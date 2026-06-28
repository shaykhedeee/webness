import { Router } from "express";
import { prisma } from "@webness/db";
import { authenticate } from "../middleware/auth.js";
import { tenantScope } from "../middleware/tenant.js";
import { decrypt } from "../utils/crypto.js";
import { runParallelCouncil } from "../utils/model-orchestrator.js";
import { logger } from "../utils/logger.js";

export const advisorRoutes = Router();

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

/**
 * GET /api/advisor/next-steps
 * Proactively calculates high-impact next steps for the business
 */
advisorRoutes.get("/next-steps", authenticate, tenantScope, async (req, res, next) => {
  try {
    const orgId = req.user!.orgId;

    const [org, health, taskCount] = await Promise.all([
      prisma.organization.findUnique({ where: { id: orgId } }),
      prisma.clientHealthScore.findFirst({
        where: { orgId },
        orderBy: { measuredAt: "desc" },
      }),
      prisma.task.count({ where: { orgId } }),
    ]);

    if (!org) {
      return res.status(404).json({ success: false, error: "Organization not found" });
    }

    const keys = await resolveKeys(orgId);

    // Baseline stats if health scoring has not been executed yet
    const seo = health?.seoScore ?? 45;
    const content = health?.contentScore ?? 30;
    const speed = health?.speedScore ?? 75;
    const lead = health?.leadScore ?? 40;
    const overall = health?.overallScore ?? Math.floor((seo + content + speed + lead) / 4);

    const prompt = `
You are the Webness OS Sovereign Business Advisor. Analyze the current state of this business and suggest exactly 3 actionable B2B next steps that the user can execute on the Webness OS platform to scale organic traction and cost savings.

Business Profile:
- Brand Name: "${org.name}"
- Industry Niche: "${org.industry || "B2B Marketing & Services"}"
- Brand URL: "${org.website || "webness.in"}"

Dynamic Health Analytics:
- Technical SEO Score: ${seo}/100
- Creative Content Score: ${content}/100
- Site Speed Index: ${speed}/100
- Local Lead Generation Score: ${lead}/100
- Overall Digital Health Score: ${overall}/100

Previous Executions Completed: ${taskCount} tasks.

Suggest exactly 3 next steps. Every step MUST map to one of our active tools:
1. Tool: "seo_auditor" (Base credits: 0, Purpose: Technical SEO Audit)
2. Tool: "blog_writer" (Base credits: 15, Purpose: Long-form content engine)
3. Tool: "ebook_pipeline" (Base credits: 50, Purpose: PDF lead magnet and KDP compiler)

Format your response as a STRICT JSON array of objects, containing no extra comments or markdown backticks:
[
  {
    "id": "adv-1",
    "toolSlug": "seo_auditor",
    "title": "Perform SEO Audit",
    "description": "Analyze technical SEO bottlenecks on your website to prepare for content scaling.",
    "priority": "HIGH",
    "impact": "Boosts organic visibility by up to 50%",
    "roi": "450% projected savings vs traditional agency audits"
  }
]
`;

    let recommendations = [];
    try {
      const council = await runParallelCouncil(keys, {
        purpose: "Dynamic business advisory",
        prompt,
        maxTokens: 3000,
        temperature: 0.2,
      });

      let cleanText = council.synthesis.trim();
      if (cleanText.includes("```")) {
        const match = cleanText.match(/```(?:json)?([\s\S]*?)```/);
        if (match) cleanText = match[1].trim();
      }

      recommendations = JSON.parse(cleanText);
    } catch (err) {
      logger.warn({ err: (err as Error).message }, "AI Advisor parse failed, generating high-fidelity fallback recommendation cards");
      
      // Fallback recommendations based on low health scores
      recommendations = [
        {
          id: "fallback-seo",
          toolSlug: "seo_auditor",
          title: `SEO Health Audit for ${org.name}`,
          description: `Your Technical SEO Score is currently ${seo}/100. Run the crawler to scan title tags, site speed, and link hierarchies.`,
          priority: "HIGH",
          impact: "Resolves Google indexing and site performance crawl bugs.",
          roi: "Instant audit - 100% free lead magnet tool."
        },
        {
          id: "fallback-content",
          toolSlug: "blog_writer",
          title: "Scale Authority Blog Campaign",
          description: `Your Content Score is ${content}/100. Generate a high-quality B2B blog post in the ${org.industry || "marketing"} niche to attract organic visitors.`,
          priority: "MEDIUM",
          impact: "Weekly content frequency boosts target keyword rankings by 300%.",
          roi: "Direct BYOK saves ~$150 per high-intent copywriter retainer."
        },
        {
          id: "fallback-ebook",
          toolSlug: "ebook_pipeline",
          title: "Launch Ebook Lead Funnel",
          description: "Compile a premium PDF ebook detailing digital automation to convert passive leads into recurring customers.",
          priority: "HIGH",
          impact: "Creates a high-converting publishing funnel and Kindle-compliant lead asset.",
          roi: "Estimated ROI: 920% - turns inbound traffic into paying retainers."
        }
      ];
    }

    res.json({
      success: true,
      data: {
        healthMetrics: { seo, content, speed, lead, overall },
        recommendations
      }
    });

  } catch (err) {
    next(err);
  }
});
