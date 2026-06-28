import { runParallelCouncil, AiKeys } from "./model-orchestrator.js";
import { getUserMemoryContext } from "./memory-service.js";
import { logger } from "./logger.js";
import { z } from "zod";

// Zod schema matching the Report Prompt Contract
export const ReportNarrativeSchema = z.object({
  headline: z.string(),
  executiveSummary: z.string(),
  wins: z.array(z.string()),
  concerns: z.array(z.string()),
  workCompleted: z.array(z.string()),
  recommendedActions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      impact: z.enum(["high", "medium", "low"]),
      effort: z.enum(["high", "medium", "low"]),
    })
  ),
  clientDecisionsNeeded: z.array(z.string()),
  sourceConfidence: z.enum(["high", "medium", "low"]),
  missingData: z.array(z.string()),
});

export type ReportNarrative = z.infer<typeof ReportNarrativeSchema>;

export interface GenerateReportInput {
  orgId: string;
  clientRoom: {
    name: string;
    website?: string | null;
    industry?: string | null;
    goals?: any;
    brandTone?: any;
    reportCadence: string;
  };
  signals: Array<{
    source: string;
    title: string;
    value: any;
    createdAt: Date;
  }>;
  keys: AiKeys;
}

/**
 * Generates an AI client report narrative and action plan from ingested signals
 */
export async function generateClientReportNarrative(
  input: GenerateReportInput
): Promise<ReportNarrative> {
  const { orgId, clientRoom, signals, keys } = input;

  // 1. Gather organization memories and onboarding preferences
  const memoryContext = await getUserMemoryContext(
    orgId,
    `reporting client: ${clientRoom.name} goals: ${JSON.stringify(clientRoom.goals)}`,
    keys,
    3
  );

  // 2. Format signals into a readable string
  const signalsText = signals.map((sig, idx) => {
    const dateStr = new Date(sig.createdAt).toLocaleDateString();
    return `Signal #${idx + 1} [Date: ${dateStr}] [Source: ${sig.source}] - ${sig.title}:
${JSON.stringify(sig.value, null, 2)}`;
  }).join("\n\n---\n\n");

  // 3. Construct the prompt enforcing the Report Prompt Contract
  const systemPrompt = `You are the Webness Sovereign AI Chief of Staff.
Your task is to analyze weekly client performance signals and generate a client-ready narrative report plus a prioritized execution roadmap.

REPORT PROMPT CONTRACT RULES:
1. Be strictly factual and restrained. Use ONLY provided data. Avoid making up fake numbers or ROI claims.
2. If data is missing or incomplete, mention it clearly under missingData.
3. Keep the tone calm, professional, and empathetic. Do not criticize the agency or client.
4. Turn every concern into a clear next action.
5. You MUST return your response as a valid JSON object matching the JSON schema below. DO NOT output any markdown tags outside of the JSON block.

JSON OUTPUT SCHEMA:
{
  "headline": "A concise single-sentence summary of the week's overall narrative",
  "executiveSummary": "A 3-4 sentence plain-English summary of progress, challenges, and what we are doing next",
  "wins": ["bullet point 1", "bullet point 2"],
  "concerns": ["bullet point 1", "bullet point 2"],
  "workCompleted": ["bullet point 1", "bullet point 2"],
  "recommendedActions": [
    {
      "title": "Short action item title",
      "description": "What needs to be done and why",
      "impact": "high" or "medium" or "low",
      "effort": "high" or "medium" or "low"
    }
  ],
  "clientDecisionsNeeded": ["Decision 1", "Decision 2"],
  "sourceConfidence": "high" or "medium" or "low",
  "missingData": ["Any missing info needed for a complete audit"]
}

CLIENT PROFILE:
- Name: ${clientRoom.name}
- Website: ${clientRoom.website || "Not specified"}
- Industry: ${clientRoom.industry || "Not specified"}
- Goals: ${JSON.stringify(clientRoom.goals || {})}
- Brand Tone: ${JSON.stringify(clientRoom.brandTone || {})}
- Cadence: ${clientRoom.reportCadence}

CONTEXT & ORGANIZATIONAL BRAIN MOAT:
${memoryContext}

INGESTED WEEKLY SIGNALS:
${signalsText || "No weekly signals ingested. Summarize general status and ask for update parameters."}

Output only the JSON block:`;

  try {
    const summary = await runParallelCouncil(keys, {
      purpose: `generate-client-report-${clientRoom.name}`,
      prompt: systemPrompt,
      temperature: 0.2, // low temp for factual accuracy
      maxTokens: 4096,
    });

    const rawText = summary.winner?.text || summary.synthesis || "";
    
    // Clean up potential markdown formatting around the JSON string
    const cleanedJsonText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    const parsedJson = JSON.parse(cleanedJsonText);
    const validatedReport = ReportNarrativeSchema.parse(parsedJson);

    return validatedReport;
  } catch (err: any) {
    logger.error({ err: err.message }, "❌ Signal Room AI Report narrative generation failed");
    
    // Graceful fallback structured report
    return {
      headline: `Weekly status update for ${clientRoom.name}`,
      executiveSummary: "A temporary error occurred while generating the AI narrative. Please review recent work notes and manual metrics in the Action Board.",
      wins: signals.map(s => s.title),
      concerns: ["System was unable to perform automated narrative analysis"],
      workCompleted: ["Refer to manual work notes"],
      recommendedActions: [
        {
          title: "Review manual metrics",
          description: "Inspect GA4 and Search Console dashboards manually to ensure performance consistency.",
          impact: "medium",
          effort: "low",
        }
      ],
      clientDecisionsNeeded: [],
      sourceConfidence: "low",
      missingData: ["AI analysis pipeline warning"],
    };
  }
}
