import { Router } from "express";
import { prisma } from "@webness/db";
import { authenticate } from "../middleware/auth.js";
import { tenantScope } from "../middleware/tenant.js";
import { getUserMemoryContext } from "../utils/memory-service.js";
import { decrypt } from "../utils/crypto.js";

export const oodaRoutes = Router();

async function resolveKeys(orgId: string) {
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  const keys = {
    groq: process.env.GROQ_API_KEY || "",
    openai: process.env.OPENAI_API_KEY || "",
    gemini: process.env.GOOGLE_AI_STUDIO_KEY || "",
    openrouter: process.env.OPENROUTER_API_KEY || "",
  };

  const byok = (org?.byokKeys as Record<string, string>) || {};
  if (byok.groq) keys.groq = decrypt(byok.groq);
  if (byok.openai) keys.openai = decrypt(byok.openai);
  if (byok.gemini) keys.gemini = decrypt(byok.gemini);
  if (byok.openrouter) keys.openrouter = decrypt(byok.openrouter);
  return keys;
}

// POST /api/ai-os/ingest - Capture Anything
oodaRoutes.post("/ingest", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { source, title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: "Title and content are required." });
    }

    const item = await prisma.ingestion.create({
      data: {
        orgId: req.user!.orgId,
        source: (source as string) || "manual",
        title,
        content,
        status: "UNPROCESSED",
      },
    });

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

// GET /api/ai-os/ingested - List Captured Items
oodaRoutes.get("/ingested", authenticate, tenantScope, async (req, res, next) => {
  try {
    const items = await prisma.ingestion.findMany({
      where: { orgId: req.user!.orgId },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai-os/ingest/:id/route - Orient Layer & Disposition Router
oodaRoutes.post("/ingest/:id/route", authenticate, tenantScope, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const ingestion = await prisma.ingestion.findFirst({
      where: { id, orgId: req.user!.orgId },
    });

    if (!ingestion) {
      return res.status(404).json({ success: false, error: "Ingestion observation not found." });
    }

    // 1. Orient Layer - Query strategic context (Obsidian notes / memories)
    const keys = await resolveKeys(req.user!.orgId);
    const strategicContext = await getUserMemoryContext(req.user!.orgId, ingestion.content, keys);

    // 2. Disposition Classifier Prompt
    const classificationPrompt = `
      You are the Webness OS Disposition Router. Categorize this observation and decide the routing path.
      
      OBSERVATION SOURCE: ${ingestion.source}
      OBSERVATION TITLE: ${ingestion.title}
      OBSERVATION CONTENT:
      ${ingestion.content}
      
      STRATEGIC RULES & STRATEGIC CONTEXT (Obsidian PKM):
      ${strategicContext || "No strategic constraints configured yet."}
      
      Choose one of the following dispositions:
      - "DETERMINISTIC": Simple administrative tasks, spam filter, or direct status marks that don't need AI analysis.
      - "SMALL_AI": Basic categorizations, simple updates, or single-phrase answers using a light model.
      - "ADVANCED_AI": High-level complex tasks, client strategy wagers, software builds, or UI design modifications.
      
      Also, generate the next action description. If "ADVANCED_AI", draft a proposal (a JSON structure containing: proposed title, description, changes object, and ROI wager metrics like estimated ROI % and confidence score).
      
      Return ONLY a JSON block matching this format:
      {
        "disposition": "DETERMINISTIC" | "SMALL_AI" | "ADVANCED_AI",
        "reasoning": "Brief explanation",
        "proposalDraft": {
          "title": "Proposed Action Name",
          "description": "Details",
          "changes": {},
          "wager": {
            "expectedRoi": 85.0,
            "profitabilityImpact": 450,
            "confidence": 0.9
          }
        }
      }
    `;

    // Local brain endpoint or default Ollama completions
    const localBrainUrl = process.env.BRAIN_API_URL || "http://127.0.0.1:8080";
    let classificationResult;

    try {
      const response = await fetch(`${localBrainUrl}/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.BRAIN_API_KEY || ""}`,
        },
        body: JSON.stringify({
          message: classificationPrompt,
          task_type: "reasoning",
          orgId: req.user!.orgId,
        }),
      });

      if (response.ok) {
        const body = (await response.json()) as any;
        const rawText = body.answer || "";
        const jsonMatch = rawText.match(/\{[\s\S]+\}/);
        classificationResult = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
      }
    } catch (e) {
      console.warn("Local brain routing failed, using mock router classification:", e);
    }

    if (!classificationResult) {
      // Mock Fallback
      classificationResult = {
        disposition: "ADVANCED_AI",
        reasoning: "Complex strategy prompt requiring advanced model and wager prediction.",
        proposalDraft: {
          title: `Approve: ${ingestion.title}`,
          description: `Apply changes based on: ${ingestion.content.substring(0, 80)}...`,
          changes: { textContent: ingestion.content },
          wager: {
            expectedRoi: 120.0,
            profitabilityImpact: 800,
            confidence: 0.85,
          },
        },
      };
    }

    // 3. Create Proposal if Advanced AI
    let proposalId = null;
    if (classificationResult.disposition === "ADVANCED_AI" && classificationResult.proposalDraft) {
      // Fetch or seed a default scene branch to assign
      let branch = await prisma.sceneBranch.findFirst({
        where: { orgId: req.user!.orgId },
      });

      if (!branch) {
        branch = await prisma.sceneBranch.create({
          data: {
            orgId: req.user!.orgId,
            name: "Main Branch",
            description: "Default scene branch created by OODA router",
            state: {},
          },
        });
      }

      const proposal = await prisma.proposal.create({
        data: {
          orgId: req.user!.orgId,
          branchId: branch.id,
          title: classificationResult.proposalDraft.title,
          description: classificationResult.proposalDraft.description,
          changes: classificationResult.proposalDraft.changes,
          disposition: classificationResult.disposition as string,
          wagerMetrics: classificationResult.proposalDraft.wager,
          status: "PENDING",
        },
      });
      proposalId = proposal.id;
    }

    // Update Ingestion status
    const updated = await prisma.ingestion.update({
      where: { id: ingestion.id },
      data: {
        status: "ROUTED",
        disposition: classificationResult.disposition as string,
        proposalId,
      },
    });

    res.json({
      success: true,
      data: {
        ingestion: updated,
        disposition: classificationResult.disposition,
        reasoning: classificationResult.reasoning,
        proposalId,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai-os/proposals/:proposalId/evaluate - Outcome Evaluation
oodaRoutes.post("/proposals/:proposalId/evaluate", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { actualRoi, actualProfitability, comments } = req.body;
    const proposal = await prisma.proposal.findFirst({
      where: { id: req.params.proposalId as string, orgId: req.user!.orgId },
    });

    if (!proposal) {
      return res.status(404).json({ success: false, error: "Proposal not found." });
    }

    const verdict = {
      actualRoi: parseFloat(actualRoi) || 0.0,
      actualProfitability: parseFloat(actualProfitability) || 0.0,
      comments: comments || "Wager outcome evaluated.",
    };

    // Update proposal with verdict metrics
    const updated = await prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: "EVALUATED",
        verdictMetrics: verdict,
      },
    });

    // Invoke Local Brain self-learning reflex
    const localBrainUrl = process.env.BRAIN_API_URL || "http://127.0.0.1:8080";
    try {
      const wager = (proposal.wagerMetrics as Record<string, any>) || {};
      const feedbackMessage = `
        Prediction (Wager): Expected ROI: ${wager.expectedRoi || "N/A"}%, profitability: $${wager.profitabilityImpact || "N/A"}.
        Actual Outcome: ROI: ${verdict.actualRoi}%, profitability: $${verdict.actualProfitability}.
        Comments: ${verdict.comments}
      `;

      await fetch(`${localBrainUrl}/v1/learn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.BRAIN_API_KEY || ""}`,
        },
        body: JSON.stringify({
          task_id: proposal.id,
          org_id: req.user!.orgId,
          prompt: `Wager execution for: ${proposal.title}`,
          output: JSON.stringify(proposal.changes),
          status: verdict.actualRoi >= (wager.expectedRoi || 0) ? "success" : "failed",
          user_feedback: feedbackMessage,
          rating: verdict.actualRoi >= (wager.expectedRoi || 0) ? 5 : 2,
        }),
      });
    } catch (learnErr) {
      console.warn("Failed to submit feedback to /v1/learn:", learnErr);
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
