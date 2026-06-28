import { prisma } from "@webness/db";
import { saveSelfLearningEmbedding, querySelfLearningEmbeddings } from "./ai-cloud-runner.js";
import { logger } from "./logger.js";
import { AiKeys } from "./model-orchestrator.js";

/**
 * Save a dynamic memory chunk for an organization, compiling a vector embedding via Gemini
 */
export async function saveUserMemory(
  orgId: string,
  content: string,
  contentType: string = "brand_voice",
  metadata: Record<string, any> = {},
  keys: AiKeys
): Promise<void> {
  await saveSelfLearningEmbedding(orgId, contentType, content, metadata, keys);
}

/**
 * Query organization-level onboarding and brand settings, combined with pgvector memories matching the query
 */
export async function getUserMemoryContext(
  orgId: string,
  query: string,
  keys: AiKeys,
  limit = 3
): Promise<string> {
  try {
    // 1. Get global Organization profile, brandVoice and onboarding answers
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        name: true,
        industry: true,
        brandVoice: true,
        onboarding: true,
        website: true,
      }
    });

    if (!org) return "";

    // 2. Fetch relevant pgvector dynamic memories (e.g. brand_voice, correction, research)
    const brandVoiceMemories = await querySelfLearningEmbeddings(orgId, "brand_voice", query, keys, limit);
    const correctionMemories = await querySelfLearningEmbeddings(orgId, "correction", query, keys, limit);
    const researchMemories = await querySelfLearningEmbeddings(orgId, "research", query, keys, limit);

    // 3. Construct dynamic context blocks
    const lines: string[] = [];
    lines.push(`## 🏛️ Sovereign AI OS Context & Memory`);
    lines.push(`- **Business Name:** ${org.name}`);
    if (org.industry) lines.push(`- **Industry Focus:** ${org.industry}`);
    if (org.website) lines.push(`- **Website:** ${org.website}`);

    if (org.onboarding) {
      const onboardingObj = org.onboarding as Record<string, any>;
      const keysExist = Object.keys(onboardingObj).filter(k => onboardingObj[k] && typeof onboardingObj[k] !== "object");
      if (keysExist.length > 0) {
        lines.push(`\n### Dynamic User Preferences (Onboarding)`);
        for (const key of keysExist) {
          lines.push(`- **${key}:** ${onboardingObj[key]}`);
        }
      }
    }

    if (org.brandVoice) {
      const bv = org.brandVoice as Record<string, any>;
      const keysExist = Object.keys(bv).filter(k => bv[k] && typeof bv[k] !== "object");
      if (keysExist.length > 0) {
        lines.push(`\n### Core Brand Voice & Dynamic Directives`);
        for (const key of keysExist) {
          lines.push(`- **${key}:** ${bv[key]}`);
        }
      }
    }

    const allMemories = [...brandVoiceMemories, ...correctionMemories, ...researchMemories];
    if (allMemories.length > 0) {
      lines.push(`\n### Dynamically Retrieved Memories (pgvector)`);
      for (const item of allMemories) {
        const similarityText = item.similarity !== undefined ? ` *(Retrieved similarity: ${(item.similarity * 100).toFixed(1)}%)*` : "";
        lines.push(`- ${item.content}${similarityText}`);
      }
    }

    return lines.join("\n");
  } catch (err: any) {
    logger.warn({ err: err.message }, "Gracefully degraded memory context retrieval");
    return "";
  }
}

/**
 * Augment a user's prompt by decorating it with retrieved memory context
 */
export async function injectMemoryIntoPrompt(
  orgId: string,
  prompt: string,
  query: string,
  keys: AiKeys
): Promise<string> {
  const context = await getUserMemoryContext(orgId, query, keys);
  if (!context) return prompt;

  return `${context}\n\n---\n\n# User Task Instruction\n${prompt}`;
}
