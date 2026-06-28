import { Router } from "express";
import { prisma } from "@webness/db";
import { authenticate } from "../middleware/auth.js";
import { tenantScope } from "../middleware/tenant.js";
import { decrypt } from "../utils/crypto.js";
import { getAiConnectorCatalog, runParallelCouncil } from "../utils/model-orchestrator.js";
import { saveUserMemory, injectMemoryIntoPrompt, getUserMemoryContext } from "../utils/memory-service.js";
import { GoogleGenAI } from "@google/genai";

export const aiOsRoutes = Router();

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

aiOsRoutes.get("/connectors", authenticate, tenantScope, async (req, res, next) => {
  try {
    const keys = await resolveKeys(req.user!.orgId);
    res.json({
      success: true,
      data: {
        executionMode: "parallel_council",
        connectors: getAiConnectorCatalog(keys),
        localConfig: {
          brainUrl: process.env.BRAIN_API_URL || process.env.BRAIN_URL || "http://127.0.0.1:8000",
          janUrl: process.env.JAN_API_BASE_URL || null,
          obsidianVault: process.env.OBSIDIAN_VAULT_PATH || null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/ai-os/memory - Retrieve dynamic user preferences & pgvector memories
aiOsRoutes.get("/memory", authenticate, tenantScope, async (req, res, next) => {
  try {
    const limit = Number(req.query.limit || 30);
    const memories = await prisma.embedding.findMany({
      where: {
        orgId: req.user!.orgId,
        contentType: { in: ["brand_voice", "correction", "research"] }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.json({ success: true, data: memories });
  } catch (err) {
    next(err);
  }
});

// GET /api/ai-os/memory/context - Retrieve semantic memory context for a given query
aiOsRoutes.get("/memory/context", authenticate, tenantScope, async (req, res, next) => {
  try {
    const query = String(req.query.q || "");
    const keys = await resolveKeys(req.user!.orgId);
    const context = await getUserMemoryContext(req.user!.orgId, query, keys);
    res.json({ success: true, context });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai-os/memory - Save a dynamic user memory / fact
aiOsRoutes.post("/memory", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { content, contentType, metadata } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, error: "content is required" });
    }

    const keys = await resolveKeys(req.user!.orgId);
    await saveUserMemory(req.user!.orgId, content, contentType || "brand_voice", metadata || {}, keys);

    res.json({ success: true, message: "Memory saved successfully" });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/ai-os/memory/:id - Prune a memory fact
aiOsRoutes.delete("/memory/:id", authenticate, tenantScope, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    await prisma.embedding.delete({
      where: {
        id,
        orgId: req.user!.orgId,
      }
    });

    res.json({ success: true, message: "Memory pruned successfully" });
  } catch (err) {
    next(err);
  }
});

aiOsRoutes.post("/council/run", authenticate, tenantScope, async (req, res, next) => {
  try {
    const keys = await resolveKeys(req.user!.orgId);
    const { prompt, purpose, models } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: "prompt is required" });
    }

    // Dynamic semantic memory prompt decoration prior to parallel council execution
    const injectedPrompt = await injectMemoryIntoPrompt(req.user!.orgId, prompt, prompt, keys);

    const result = await runParallelCouncil(keys, {
      purpose: purpose || "Manual AI OS council run",
      prompt: injectedPrompt,
      models,
      maxTokens: Number(req.body.maxTokens || 5000),
      temperature: Number(req.body.temperature || 0.7),
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

aiOsRoutes.post("/obsidian/sync", authenticate, tenantScope, async (req, res, next) => {
  try {
    const localConfig = {
      brainUrl: process.env.BRAIN_API_URL || process.env.BRAIN_URL || "http://127.0.0.1:8000",
      obsidianVault: process.env.OBSIDIAN_VAULT_PATH || "",
    };

    const response = await fetch(`${localConfig.brainUrl}/v1/obsidian/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webness-Key": process.env.BRAIN_API_KEY || "",
      },
      body: JSON.stringify({
        org_id: req.user!.orgId,
        api_url: process.env.PUBLIC_API_URL || `${req.protocol}://${req.get("host")}`,
        api_key: process.env.AI_BRAIN_KEY || "",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ success: false, error: `Local Brain sync failed: ${errorText}` });
    }

    const data = await response.json() as any;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

aiOsRoutes.post("/memory/bulk", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { memories } = req.body;
    if (!Array.isArray(memories)) {
      return res.status(400).json({ success: false, error: "memories array is required" });
    }

    const keys = await resolveKeys(req.user!.orgId);
    
    const clearObsidian = req.query.clear === "true";
    if (clearObsidian) {
      await prisma.$executeRawUnsafe(
        'DELETE FROM "Embedding" WHERE "orgId" = $1 AND "metadata"->>\'source\' = \'obsidian\'',
        req.user!.orgId
      );
    }

    const batchSize = 10;
    for (let i = 0; i < memories.length; i += batchSize) {
      const batch = memories.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (m: any) => {
          await saveUserMemory(req.user!.orgId, m.content, m.contentType || "research", m.metadata || {}, keys);
        })
      );
    }

    res.json({ success: true, count: memories.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai-os/link/scan - Deep Link Scraper & Analyst
aiOsRoutes.post("/link/scan", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return res.status(400).json({ success: false, error: "A valid HTTP URL is required" });
    }

    const keys = await resolveKeys(req.user!.orgId);
    const apiKey = keys.gemini || process.env.GOOGLE_AI_STUDIO_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "Gemini API key is not configured" });
    }

    // 1. Fetch URL
    const fetchRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!fetchRes.ok) {
      return res.status(502).json({ success: false, error: `Failed to fetch target website: ${fetchRes.statusText}` });
    }

    const html = await fetchRes.text();

    // 2. Extract title & basic metadata
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // 3. Clean HTML
    const cleanedText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 4. Send to Gemini for teardown
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Perform a comprehensive SEO, business model, and copywriting analysis of the following website text.
URL: ${url}
Title: ${title}

Content:
${cleanedText.slice(0, 60000)}

Please return a detailed JSON object matching this structure EXACTLY (do not include other text, return ONLY the raw JSON block):
{
  "overview": {
    "businessName": "Name of the business",
    "businessModel": "How they monetize / what they sell",
    "positioning": "Value proposition and market positioning",
    "targetAudience": "Who is the primary customer"
  },
  "copywriting": {
    "score": 80,
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"],
    "ctaAnalysis": "Analysis of the CTAs on the page"
  },
  "seoAudit": {
    "score": 75,
    "issues": ["SEO issue 1", "SEO issue 2"],
    "suggestions": ["SEO recommendation 1", "SEO recommendation 2"]
  },
  "leadContacts": {
    "extractedEmails": ["contact@business.com"],
    "socialProfiles": ["https://twitter.com/business"],
    "contactForms": ["/contact"]
  }
}`;

    const geminiRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = geminiRes.text || "";
    // Extract JSON block if enclosed in markdown
    const jsonMatch = rawText.match(/```json\n([\s\S]+?)\n```/) || rawText.match(/{[\s\S]+}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawText;

    let parsedResult;
    try {
      parsedResult = JSON.parse(jsonString.trim());
    } catch {
      parsedResult = {
        overview: { businessName: "Unknown", businessModel: "Unable to parse", positioning: rawText, targetAudience: "N/A" },
        copywriting: { score: 50, strengths: [], weaknesses: [], ctaAnalysis: "" },
        seoAudit: { score: 50, issues: [], suggestions: [] },
        leadContacts: { extractedEmails: [], socialProfiles: [], contactForms: [] }
      };
    }

    res.json({ success: true, data: parsedResult, rawText });
  } catch (err: any) {
    next(err);
  }
});

// POST /api/ai-os/notebook/chat - NotebookLM Long-Context Chat over selected notes
aiOsRoutes.post("/notebook/chat", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { sourceIds, prompt, messages } = req.body;
    if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
      return res.status(400).json({ success: false, error: "Please select at least one document source" });
    }
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt is required" });
    }

    const keys = await resolveKeys(req.user!.orgId);
    const apiKey = keys.gemini || process.env.GOOGLE_AI_STUDIO_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "Gemini API key is not configured" });
    }

    // 1. Fetch selected assets
    const assets = await prisma.asset.findMany({
      where: {
        id: { in: sourceIds },
        orgId: req.user!.orgId
      }
    });

    if (assets.length === 0) {
      return res.status(404).json({ success: false, error: "No matching documents found in Vault" });
    }

    // 2. Concatenate context
    const contextText = assets
      .map((a) => {
        const meta = (a.metadata as Record<string, any>) || {};
        return `=== Document: ${a.name} ===\nSource: ${meta.source || "unknown"}\nContent:\n${a.content || ""}`;
      })
      .join("\n\n");

    // 3. Construct chat messages for Gemini
    const historyLines = (messages || []).map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");

    const finalPrompt = `You are a NotebookLM-style assistant. You are direct, precise, and help the user retrieve, summarize, and analyze their knowledge based strictly on the provided documents.
If the answer cannot be found in the documents, state that clearly rather than hallucinating.

---
CONTEXT DOCUMENTS:
${contextText}
---

CHAT HISTORY:
${historyLines}

User: ${prompt}
Assistant:`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: finalPrompt,
    });

    res.json({ success: true, answer: response.text || "No response generated." });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai-os/prompt/enhance - Enhance user's raw prompt
aiOsRoutes.post("/prompt/enhance", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ success: false, error: "Prompt string is required" });
    }

    const keys = await resolveKeys(req.user!.orgId);
    const apiKey = keys.gemini || process.env.GOOGLE_AI_STUDIO_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, error: "Gemini API key is not configured" });
    }

    const enhancementInstruction = `You are an expert AI prompt engineer.
Your task is to take the user's raw prompt and rewrite it to be extremely detailed, structured, and optimized for execution by advanced AI agents.

Follow these rules:
1. Preserve the core meaning, intent, and context of the original prompt.
2. Structure the prompt clearly using Markdown headings (e.g., # Goal, # Context, # Instructions, # Constraints/Rules, # Output Format).
3. Specify step-by-step thinking instructions if relevant (reasoning steps).
4. Add clear rules and negative constraints (what the AI should NOT do).
5. Specify the exact expected output format (e.g. Markdown, JSON, tone of voice, length).
6. Do NOT include any meta-talk or introductory greetings like "Here is your enhanced prompt:". Start directly with the enhanced prompt content itself.

User Raw Prompt:
"${prompt}"

Enhanced Prompt:`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: enhancementInstruction,
      config: {
        temperature: 0.6,
      }
    });

    res.json({ success: true, enhancedPrompt: response.text || prompt });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai-os/coder/delegate - Hierarchical Coding Delegation
aiOsRoutes.post("/coder/delegate", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { prompt, model } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt is required" });
    }

    const brainUrl = process.env.BRAIN_API_URL || process.env.BRAIN_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${brainUrl}/v1/coder/delegate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webness-Key": process.env.BRAIN_API_KEY || "",
      },
      body: JSON.stringify({
        prompt,
        orgId: req.user!.orgId,
        model: model || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ success: false, error: `Local Brain delegation failed: ${errorText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/ai-os/odysseus/deep-research - Odysseus Deep Research Agent
aiOsRoutes.post("/odysseus/deep-research", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { query, steps } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: "Query is required" });
    }

    const brainUrl = process.env.BRAIN_API_URL || process.env.BRAIN_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${brainUrl}/v1/odysseus/deep-research`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webness-Key": process.env.BRAIN_API_KEY || "",
      },
      body: JSON.stringify({
        query,
        orgId: req.user!.orgId,
        steps: steps ? Number(steps) : 3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ success: false, error: `Local Brain deep research failed: ${errorText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/ai-os/files/list - List files in safe workspace path
aiOsRoutes.get("/files/list", authenticate, tenantScope, async (req, res, next) => {
  try {
    const path = String(req.query.path || ".");
    const brainUrl = process.env.BRAIN_API_URL || process.env.BRAIN_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${brainUrl}/v1/files/list?path=${encodeURIComponent(path)}`, {
      method: "GET",
      headers: {
        "X-Webness-Key": process.env.BRAIN_API_KEY || "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ success: false, error: `Local Brain list files failed: ${errorText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/ai-os/coder/read-large - Read range of lines in file
aiOsRoutes.get("/coder/read-large", authenticate, tenantScope, async (req, res, next) => {
  try {
    const path = String(req.query.path || "");
    const startLine = Number(req.query.startLine || 1);
    const endLine = req.query.endLine ? Number(req.query.endLine) : "";
    
    const brainUrl = process.env.BRAIN_API_URL || process.env.BRAIN_URL || "http://127.0.0.1:8000";
    const url = `${brainUrl}/v1/coder/read-large?path=${encodeURIComponent(path)}&start_line=${startLine}${endLine ? `&end_line=${endLine}` : ""}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Webness-Key": process.env.BRAIN_API_KEY || "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ success: false, error: `Local Brain read large file failed: ${errorText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/ai-os/coder/edit - Perform string replace edit on workspace file
aiOsRoutes.post("/coder/edit", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { path, target_search, replacement } = req.body;
    if (!path || !target_search) {
      return res.status(400).json({ success: false, error: "path and target_search are required" });
    }

    const brainUrl = process.env.BRAIN_API_URL || process.env.BRAIN_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${brainUrl}/v1/coder/edit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webness-Key": process.env.BRAIN_API_KEY || "",
      },
      body: JSON.stringify({ path, target_search, replacement: replacement || "" }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ success: false, error: `Local Brain file edit failed: ${errorText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/ai-os/coder/execute-ooda - Start background autonomous coding OODA loop
aiOsRoutes.post("/coder/execute-ooda", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { target_path, instruction, verification_command, max_iterations } = req.body;
    if (!target_path || !instruction) {
      return res.status(400).json({ success: false, error: "target_path and instruction are required" });
    }

    const brainUrl = process.env.BRAIN_API_URL || process.env.BRAIN_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${brainUrl}/v1/coder/execute-ooda`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webness-Key": process.env.BRAIN_API_KEY || "",
      },
      body: JSON.stringify({
        target_path,
        instruction,
        verification_command: verification_command || null,
        max_iterations: max_iterations ? Number(max_iterations) : 3,
        orgId: req.user!.orgId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ success: false, error: `Local Brain OODA loop execution failed: ${errorText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/ai-os/coder/ooda-status/:runId - Check status and logs of background OODA run
aiOsRoutes.get("/coder/ooda-status/:runId", authenticate, tenantScope, async (req, res, next) => {
  try {
    const { runId } = req.params;
    const brainUrl = process.env.BRAIN_API_URL || process.env.BRAIN_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${brainUrl}/v1/coder/ooda-status/${runId}`, {
      method: "GET",
      headers: {
        "X-Webness-Key": process.env.BRAIN_API_KEY || "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ success: false, error: `Local Brain OODA status query failed: ${errorText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/ai-os/coder/training-data - Get all saved training tuples
aiOsRoutes.get("/coder/training-data", authenticate, tenantScope, async (req, res, next) => {
  try {
    const brainUrl = process.env.BRAIN_API_URL || process.env.BRAIN_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${brainUrl}/v1/coder/training-data`, {
      method: "GET",
      headers: {
        "X-Webness-Key": process.env.BRAIN_API_KEY || "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(502).json({ success: false, error: `Local Brain training data retrieval failed: ${errorText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    next(err);
  }
});


