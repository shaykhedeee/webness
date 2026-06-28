/**
 * Webness OS — KDP-Grade Multi-Model Ebook Engine
 *
 * Token-efficient architecture:
 *  1. Flash (cheap)  → Outline, research, TOC, KDP metadata, keywords
 *  2. Pro (smart)    → Draft each chapter INDIVIDUALLY (parallel)
 *  3. Groq (fast)    → Polish/edit each chapter (parallel)
 *  4. Flash (cheap)  → Front/back matter, CTA insertions
 *  5. Flash (cheap)  → SVG chapter illustrations (vector graphics)
 *  6. Compiler       → KDP-compliant EPUB 3.0 + print-ready HTML
 *
 * Each chapter is drafted separately → saves tokens by not re-sending
 * the entire book on every call. A 10-chapter book uses ~40% fewer tokens.
 */

import { logger } from "./logger.js";

// ─── Types ──────────────────────────────────────────────────────

export interface EbookConfig {
  topic: string;
  subtitle?: string;
  audience: string;
  offer: string;
  authorName: string;
  chapterCount: number;
  wordCountPerChapter: number;
  tone: "professional" | "conversational" | "academic" | "storytelling";
  genre: string;
  keywords: string[];
  includeImages: boolean;
  includeCta: boolean;
  enableResearch?: boolean; // Google Search Grounding toggle
}

export interface ChapterDraft {
  number: number;
  title: string;
  content: string;       // Polished markdown
  wordCount: number;
  keyTakeaways: string[];
  svgIllustration?: string;
}

export interface EbookOutline {
  title: string;
  subtitle: string;
  chapters: Array<{
    number: number;
    title: string;
    synopsis: string;
    keyPoints: string[];
    targetKeywords: string[];
  }>;
  kdpMetadata: {
    description: string;
    keywords: string[];          // Max 7 for KDP
    categories: string[];        // Max 3 for KDP
    targetAge: string;
    language: string;
  };
}

export interface EbookFrontMatter {
  titlePage: string;
  copyrightPage: string;
  dedication: string;
  tableOfContents: string;
  preface: string;
}

export interface EbookBackMatter {
  aboutAuthor: string;
  resources: string;
  callToAction: string;
  glossary: string;
}

export interface EbookResult {
  config: EbookConfig;
  outline: EbookOutline;
  frontMatter: EbookFrontMatter;
  chapters: ChapterDraft[];
  backMatter: EbookBackMatter;
  fullMarkdown: string;
  totalWordCount: number;
  tokenUsage: {
    researchTokens?: number;
    outlineTokens: number;
    draftTokens: number;
    polishTokens: number;
    matterTokens: number;
    illustrationTokens: number;
    totalEstimated: number;
  };
  coverImage?: string; // base64 encoded JPEG
  researchDossier?: string; // markdown formatted research dossier
}

// ─── AI Caller Interface ────────────────────────────────────────

export type AiCaller = (prompt: string, model?: string) => Promise<string>;

export interface AiCallers {
  flash: AiCaller;    // Gemini 2.5 Flash — cheap, fast
  pro: AiCaller;      // Gemini 2.5 Pro — smart, expensive
  groq: AiCaller;     // Groq Llama 70B — fast, free-tier
  openrouter: AiCaller;
  imagen?: (prompt: string) => Promise<string>; // Gemini Imagen cover generator (returns base64)
  flashSearch?: AiCaller; // Gemini with Google Search grounding enabled
}

// ─── Progress Callback ─────────────────────────────────────────

export type ProgressCallback = (step: string, detail: string, progress: number) => void;

// ─── Main Pipeline ──────────────────────────────────────────────

/**
 * Executes a highly comprehensive, 4-stage iterative niche research campaign.
 * It uses Google Search Grounding to fetch the absolute latest statistics, competitive gaps, and case studies,
 * and synthesizes them into an authoritative Enterprise Niche Research Dossier.
 */
async function executeDeepNicheResearch(
  config: EbookConfig,
  callers: AiCallers,
  onProgress: ProgressCallback
): Promise<{ dossier: string; tokensUsed: number }> {
  let tokensUsed = 0;
  const topic = config.topic;
  const audience = config.audience;

  onProgress("research", "🔍 Deep Research Stage 1: Trend Auditing & Live Statistics...", 1);
  const stage1Prompt = `You are an expert market analyst conducting research for an upcoming ebook about: "${topic}".
Your task is to search the web for the most up-to-date (up to 2026) statistics, industry benchmarks, quantitative metrics, and market trends regarding "${topic}".

Find:
1. At least 5-6 hard data points, percentages, or growth rates with authoritative references.
2. Market size, compound annual growth rate (CAGR), or industry-wide adoption statistics.
3. Emerging challenges or opportunities in the space.

Synthesize this data into a detailed, fact-grounded report on industry trends. Do not write placeholders; find real data.`;

  let stage1Stats = "";
  try {
    stage1Stats = await (config.enableResearch && callers.flashSearch ? callers.flashSearch(stage1Prompt) : callers.flash(stage1Prompt));
    tokensUsed += estimateTokens(stage1Prompt) + estimateTokens(stage1Stats);
  } catch (err: any) {
    logger.warn({ err: err.message }, "Research Stage 1 failed, using pre-trained data");
    stage1Stats = await callers.flash(stage1Prompt);
    tokensUsed += estimateTokens(stage1Prompt) + estimateTokens(stage1Stats);
  }

  onProgress("research", "📊 Deep Research Stage 2: Competitive Disruption & Gap Auditing...", 2);
  const stage2Prompt = `You are a professional publishing strategist analyzing existing literature on the topic: "${topic}".
Your task is to search for common books, articles, or discussions on "${topic}". 

Determine:
1. What do most standard resources cover?
2. What are the common gaps, deficiencies, or major reader pain points that are usually left unaddressed? (e.g. what are readers complaining about in Kindle book reviews for this niche?)
3. What unique positioning, new methodologies, or controversial insights can our book introduce to differentiate itself and stand out?

Provide a clear competitive analysis highlighting our unique positioning strategy.`;

  let stage2Gaps = "";
  try {
    stage2Gaps = await (config.enableResearch && callers.flashSearch ? callers.flashSearch(stage2Prompt) : callers.flash(stage2Prompt));
    tokensUsed += estimateTokens(stage2Prompt) + estimateTokens(stage2Gaps);
  } catch (err: any) {
    logger.warn({ err: err.message }, "Research Stage 2 failed, using pre-trained data");
    stage2Gaps = await callers.flash(stage2Prompt);
    tokensUsed += estimateTokens(stage2Prompt) + estimateTokens(stage2Gaps);
  }

  onProgress("research", "💼 Deep Research Stage 3: Real-World Case Studies & Outcomes...", 3);
  const stage3Prompt = `You are an investigative business researcher looking for real-world proof.
Your task is to search the web for concrete, real-world examples, success stories, or company case studies that successfully applied strategies related to "${topic}".

Find exactly 3 specific, real-world case studies:
1. Identify the company or organization by name.
2. Outline their starting challenge.
3. Detail the specific strategy they executed.
4. Detail the actual, numerical results or metrics they achieved (e.g., ROI, revenue growth, hours saved).

Compile these into a highly professional case studies portfolio.`;

  let stage3Cases = "";
  try {
    stage3Cases = await (config.enableResearch && callers.flashSearch ? callers.flashSearch(stage3Prompt) : callers.flash(stage3Prompt));
    tokensUsed += estimateTokens(stage3Prompt) + estimateTokens(stage3Cases);
  } catch (err: any) {
    logger.warn({ err: err.message }, "Research Stage 3 failed, using pre-trained data");
    stage3Cases = await callers.flash(stage3Prompt);
    tokensUsed += estimateTokens(stage3Prompt) + estimateTokens(stage3Cases);
  }

  onProgress("research", "🧬 Deep Research Stage 4: Compiling Enterprise Research Dossier...", 4);
  const synthesisPrompt = `You are an elite research director. You must combine three separate research runs into a highly polished, comprehensive, 2,500-word Markdown Research Dossier & Strategic USP Blueprint for an upcoming ebook on "${topic}" targeted at "${audience}".

Here is the raw gathered data:

---
STAGE 1 DATA (MARKET TRENDS & DATA POINTS):
${stage1Stats}

---
STAGE 2 DATA (COMPETITIVE GAP ANALYSIS & DIFFERENTIATION):
${stage2Gaps}

---
STAGE 3 DATA (REAL-WORLD CASE STUDIES):
${stage3Cases}
---

Your goal is to compile, organize, and synthesize these findings into a master research dossier.
Create a beautifully structured, premium Markdown document with the following exact headers:

# Niche Research Dossier & Strategic USP Blueprint: ${topic}

## Executive Summary & Unique Selling Proposition (USP)
- State a clear, highly compelling "Differentiation Angle" (USP) for this ebook based on the gaps found in Stage 2.
- Define why readers will choose this book over any competitor.

## I. Industry Benchmarks & Quantitative Evidence
- Present at least 5-6 key statistics in a beautiful **Comparative Data Table** comparing "Before/Standard Practice" vs. "After/Optimized Practice" or showing key industry indicators.
- Write a highly analytical, data-driven narrative explaining these trends.

## II. Real-World Case Studies Portfolio
- Format the 3 case studies nicely, calling out the company name, strategy, and metric results.
- Embed a custom **[.case-study]** block or callout structure around each.

## III. Niche Terminology & Technical Definitions
- Define 6-8 core terms or technical jargon so the book maintains absolute authority.

## IV. Strategic Actionable Frameworks
- Synthesize the strategic steps the book should recommend to achieve the results seen in the case studies.

Ensure the final dossier is deeply comprehensive, contains actual numerical facts, and uses professional, publishing-grade language. Do not include placeholders.`;

  let finalDossier = "";
  try {
    finalDossier = await callers.flash(synthesisPrompt);
    tokensUsed += estimateTokens(synthesisPrompt) + estimateTokens(finalDossier);
  } catch (err: any) {
    logger.warn({ err: err.message }, "Final dossier synthesis failed, joining raw data");
    finalDossier = `# Research Dossier: ${topic}\n\n## I. Trends\n${stage1Stats}\n\n## II. Gaps\n${stage2Gaps}\n\n## III. Case Studies\n${stage3Cases}`;
  }

  return {
    dossier: finalDossier,
    tokensUsed,
  };
}

export async function generateEbook(
  config: EbookConfig,
  callers: AiCallers,
  onProgress: ProgressCallback
): Promise<EbookResult> {
  const tokenUsage = {
    researchTokens: 0,
    outlineTokens: 0,
    draftTokens: 0,
    polishTokens: 0,
    matterTokens: 0,
    illustrationTokens: 0,
    totalEstimated: 0,
  };

  // ═══════════════════════════════════════════════════════════════
  // STEP 0: GROUNDED LIVE RESEARCH  (Flash + Google Search Grounding)
  // ═══════════════════════════════════════════════════════════════
  let researchDossier = "";
  if (config.enableResearch) {
    const researchResult = await executeDeepNicheResearch(config, callers, onProgress);
    researchDossier = researchResult.dossier;
    tokenUsage.researchTokens = researchResult.tokensUsed;
    onProgress("research", "Live niche research dossier compiled successfully!", 4);
  }

  // Fallback research run if research was skipped or failed
  if (!researchDossier) {
    const fallbackPrompt = `You are an expert non-fiction book researcher. Write a highly detailed, comprehensive research dossier for a book on: "${config.topic}".
Target Audience: "${config.audience}"
Genre: "${config.genre}"

Provide:
1. Key historical and current industry benchmarks.
2. At least 2 real-world case studies/success stories.
3. Essential definitions and terms.
4. Actionable strategies that can be developed in the book chapters.

Format as a structured Markdown dossier.`;
    
    try {
      researchDossier = await callers.flash(fallbackPrompt);
      tokenUsage.researchTokens = estimateTokens(fallbackPrompt) + estimateTokens(researchDossier);
    } catch {
      researchDossier = `# Research Dossier: ${config.topic}\n\nLive research was skipped or failed. Using pre-trained contextual reasoning.`;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 1: OUTLINE + KDP METADATA  (Flash — cheap)
  // ═══════════════════════════════════════════════════════════════
  onProgress("outline", "Generating book structure, KDP metadata & keyword research…", 5);

  const outlinePrompt = buildOutlinePrompt(config, researchDossier);
  let outlineRaw: string;
  try {
    outlineRaw = await callers.flash(outlinePrompt);
  } catch {
    outlineRaw = await callers.groq(outlinePrompt);
  }

  const outline = parseOutline(outlineRaw, config);
  tokenUsage.outlineTokens = estimateTokens(outlinePrompt) + estimateTokens(outlineRaw);

  onProgress("outline", `Outline complete: "${outline.title}" — ${outline.chapters.length} chapters`, 12);

  // ═══════════════════════════════════════════════════════════════
  // STEP 2: DRAFT CHAPTERS SEQUENTIALLY (Adaptive Memory Narrative Chaining)
  // ═══════════════════════════════════════════════════════════════
  onProgress("drafting", `Drafting ${outline.chapters.length} chapters sequentially with Gemini 2.5 Pro (Continuous Narrative Chaining)…`, 15);

  const draftedChapters: ChapterDraft[] = [];

  for (let i = 0; i < outline.chapters.length; i++) {
    const ch = outline.chapters[i];
    
    // Build narrative continuity context from the previously drafted chapter
    let narrativeContext = "";
    if (i > 0) {
      const prevCh = draftedChapters[i - 1];
      
      // Extract a snippet of the end of the previous chapter (last ~400 words)
      const prevWords = prevCh.content.split(/\s+/);
      const endingSnippet = prevWords.slice(-400).join(" ");
      
      narrativeContext = `PREVIOUS CHAPTER (Chapter ${prevCh.number}): "${prevCh.title}"
Key Takeaways Covered:
${prevCh.keyTakeaways.map(t => `- ${t}`).join("\n")}

Concluding Section of Chapter ${prevCh.number} (Read this to ensure Chapter ${ch.number} transitions smoothly from this ending):
... ${endingSnippet}`;
    }

    onProgress("drafting", `Drafting Chapter ${ch.number}/${outline.chapters.length}: "${ch.title}"…`, 15 + (i / outline.chapters.length) * 30);

    try {
      const drafted = await draftSingleChapter(ch, outline, config, callers, researchDossier, narrativeContext);
      draftedChapters.push(drafted);
      tokenUsage.draftTokens += estimateTokens(drafted.content) * 2;
    } catch (err: any) {
      logger.warn({ err: err.message, chapter: ch.number }, "Chapter draft failed, creating placeholder");
      draftedChapters.push({
        number: ch.number,
        title: ch.title,
        content: `## ${ch.title}\n\nContent generation failed for this chapter.`,
        wordCount: 0,
        keyTakeaways: [],
      });
    }
  }

  // Sort by chapter number just in case
  draftedChapters.sort((a, b) => a.number - b.number);

  // ═══════════════════════════════════════════════════════════════
  // STEP 3: POLISH EACH CHAPTER  (Groq — fast, parallel)
  // ═══════════════════════════════════════════════════════════════
  onProgress("polishing", `Polishing ${draftedChapters.length} chapters with Groq Llama 70B…`, 48);

  const polishedChapters: ChapterDraft[] = [];
  const batchSize = 2;

  for (let i = 0; i < draftedChapters.length; i += batchSize) {
    const batch = draftedChapters.slice(i, i + batchSize);
    const batchPromises = batch.map((ch) => polishSingleChapter(ch, config, callers));
    const batchResults = await Promise.allSettled(batchPromises);

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === "fulfilled") {
        polishedChapters.push(result.value);
        tokenUsage.polishTokens += estimateTokens(result.value.content) * 2;
      } else {
        // Keep the draft version if polish fails
        polishedChapters.push(batch[j]);
      }
    }

    const progress = 48 + ((i + batchSize) / draftedChapters.length) * 15;
    onProgress("polishing", `Polished ${Math.min(i + batchSize, draftedChapters.length)}/${draftedChapters.length} chapters`, Math.min(progress, 63));
  }

  polishedChapters.sort((a, b) => a.number - b.number);

  // ═══════════════════════════════════════════════════════════════
  // STEP 4: FRONT/BACK MATTER  (Flash — cheap)
  // ═══════════════════════════════════════════════════════════════
  onProgress("matter", "Generating professional front & back matter…", 65);

  const [frontMatter, backMatter] = await Promise.all([
    generateFrontMatter(outline, config, callers),
    generateBackMatter(outline, polishedChapters, config, callers),
  ]);

  tokenUsage.matterTokens = 2000; // Estimated
  onProgress("matter", "Front & back matter complete", 72);

  // ═══════════════════════════════════════════════════════════════
  // STEP 4.5: COVER IMAGE GENERATION  (Imagen — high quality)
  // ═══════════════════════════════════════════════════════════════
  let coverImage: string | undefined = undefined;
  if (config.includeImages && callers.imagen) {
    onProgress("cover", "Designing professional book cover with Gemini Imagen API…", 73);
    try {
      let coverStyleInstructions = "";
      const topicLower = config.topic.toLowerCase();
      if (topicLower.includes("plant") || topicLower.includes("garden") || topicLower.includes("botanical")) {
        coverStyleInstructions = "Focus on a luxury, minimalist botanical catalog aesthetic. Describe a single, highly detailed organic Swiss Cheese plant (Monstera Deliciosa) leaf in a matte ceramic pot on a rustic wooden table. Soft organic leaf shadows cast against a textured warm neutral plaster wall. Warm, dramatic sun rays, soft focus background, elegant earth tones (sage green, warm sand, soft white).";
      } else if (topicLower.includes("aquascape") || topicLower.includes("aquarium") || topicLower.includes("aquatic")) {
        coverStyleInstructions = "Focus on an ultra-premium, modern Zen-aquascaping showcase. Describe a pristine, crystal-clear rimless glass aquarium displaying an exquisite Iwagumi aquascape layout. Natural dark Dragon stones covered in lush green carpet grass, elegant branching driftwood roots, and tiny cardinal tetra fish schooling. Ambient, dramatic underwater lighting, clean minimalist presentation against a dark editorial background.";
      } else {
        coverStyleInstructions = "Focus entirely on creating a clean, modern, premium, minimalist visual metaphor or illustration representing the topic.";
      }

      const designPrompt = `You are an expert graphic designer and book cover artist. Write a highly detailed graphic design prompt for Gemini Imagen to create a beautiful, professional, high-converting book cover.
      
BOOK DETAILS:
- Title: "${outline.title}"
- Subtitle: "${outline.subtitle || ""}"
- Genre: "${config.genre}"
- Tone: "${config.tone}"
- Target Audience: "${config.audience}"

INSTRUCTIONS FOR THE PROMPT:
- ${coverStyleInstructions}
- Describe the color palette (harmonious, modern colors).
- Describe the lighting, style (e.g., editorial illustration, clean vector, corporate minimalism, elegant line art).
- Specify: "No text, typography, letters, or words inside the image itself." (Typography will be overlaid separately, so we require a pure graphic background).
- Avoid generic patterns. Keep it elegant and high-end.

Write ONLY the Imagen prompt:`;

      const imagenPrompt = await callers.flash(designPrompt);
      logger.info({ imagenPrompt }, "🎨 Custom Imagen cover design prompt generated");

      coverImage = await callers.imagen(imagenPrompt);
      onProgress("cover", "Cover art generated successfully!", 76);
    } catch (err: any) {
      logger.warn({ err: err.message }, "Imagen cover generation failed, falling back to styled title page");
      onProgress("cover", "Cover generation failed (skipping)…", 76);
    }
  } else {
    onProgress("cover", "Cover image generation skipped (no key or disabled)", 76);
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 5: SVG ILLUSTRATIONS  (Flash — cheap vector generation)
  // ═══════════════════════════════════════════════════════════════
  if (config.includeImages) {
    onProgress("illustrations", "Generating SVG illustrations for each chapter…", 77);

    for (let i = 0; i < polishedChapters.length; i++) {
      try {
        const svg = await generateChapterSvg(polishedChapters[i], config, callers);
        polishedChapters[i].svgIllustration = svg;
        tokenUsage.illustrationTokens += 500;
      } catch (err: any) {
        logger.warn({ chapter: i + 1, err: err.message }, "SVG generation failed for chapter");
      }

      const progress = 77 + ((i + 1) / polishedChapters.length) * 9;
      onProgress("illustrations", `Generated ${i + 1}/${polishedChapters.length} illustrations`, Math.min(progress, 86));
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 6: COMPILE FULL MARKDOWN
  // ═══════════════════════════════════════════════════════════════
  onProgress("compiling", "Assembling final manuscript…", 88);

  const fullMarkdown = assembleFullMarkdown(outline, frontMatter, polishedChapters, backMatter, config);
  const totalWordCount = fullMarkdown.split(/\s+/).length;

  tokenUsage.totalEstimated =
    tokenUsage.researchTokens +
    tokenUsage.outlineTokens +
    tokenUsage.draftTokens +
    tokenUsage.polishTokens +
    tokenUsage.matterTokens +
    tokenUsage.illustrationTokens;

  onProgress("done", `Complete! ${totalWordCount.toLocaleString()} words, ${polishedChapters.length} chapters`, 100);

  return {
    config,
    outline,
    frontMatter,
    chapters: polishedChapters,
    backMatter,
    fullMarkdown,
    totalWordCount,
    tokenUsage,
    coverImage,
    researchDossier,
  };
}

// ─── Prompt Builders ────────────────────────────────────────────

function buildOutlinePrompt(config: EbookConfig, researchDossier?: string): string {
  const researchContext = researchDossier
    ? `\nRESEARCH DOSSIER (Use this verified research to guide the ebook outline structure, ensuring absolute factual correctness):\n---\n${researchDossier}\n---\n`
    : "";

  return `You are a professional book publisher and Amazon KDP expert. Create a comprehensive chapter-by-chapter outline for an ebook.
${researchContext}
BOOK SPECIFICATIONS:
- Topic: "${config.topic}"
${config.subtitle ? `- Subtitle: "${config.subtitle}"` : ""}
- Target Audience: "${config.audience}"
- Genre: "${config.genre}"
- Tone: ${config.tone}
- Number of Chapters: ${config.chapterCount}
- Words per Chapter: ~${config.wordCountPerChapter}
- Lead Capture Offer: "${config.offer}"
${config.keywords.length > 0 ? `- Seed Keywords: ${config.keywords.join(", ")}` : ""}

REQUIREMENTS:
1. Create a compelling, market-ready book title and subtitle
2. Design exactly ${config.chapterCount} chapters with:
   - Clear, engaging chapter titles
   - 3-5 sentence synopsis per chapter
   - 3-5 key points/takeaways per chapter
   - 2-3 target SEO keywords per chapter
3. Ensure logical flow from fundamentals → advanced → action
4. Include practical, actionable advice in each chapter

AMAZON KDP METADATA (critical for discoverability):
5. Write a compelling 150-word book description (for KDP listing)
6. Suggest exactly 7 search keywords (phrases readers would type)
7. Suggest 3 Amazon categories (e.g., "Business & Money > Small Business")
8. Recommend target age group

Return as structured markdown with clear headers:
# [Book Title]
## Subtitle: [subtitle]
### Chapter Outlines
### KDP Metadata`;
}

async function draftSingleChapter(
  chapterOutline: EbookOutline["chapters"][0],
  fullOutline: EbookOutline,
  config: EbookConfig,
  callers: AiCallers,
  researchDossier?: string,
  narrativeContext?: string
): Promise<ChapterDraft> {
  const researchContext = researchDossier
    ? `\nRESEARCH DOSSIER (Cite these figures, statistics, benchmarks, or case studies directly in the chapter content where appropriate):\n---\n${researchDossier}\n---\n`
    : "";

  const continuityContext = narrativeContext
    ? `\nNARRATIVE CONTINUITY & CONTEXT FROM PREVIOUS CHAPTER:\n---\n${narrativeContext}\n---\n`
    : "";

  const prompt = `You are a bestselling ${config.genre} author. Write Chapter ${chapterOutline.number} of the book "${fullOutline.title}".
${researchContext}
${continuityContext}
CHAPTER DETAILS:
- Title: "${chapterOutline.title}"
- Synopsis: ${chapterOutline.synopsis}
- Key Points to Cover: ${chapterOutline.keyPoints.join("; ")}
- Target Keywords: ${chapterOutline.targetKeywords.join(", ")}

WRITING GUIDELINES:
- Target length: ${config.wordCountPerChapter} words
- Tone: ${config.tone}
- Audience: ${config.audience}
- Include real-world examples, case studies, or analogies
- Use clear subheadings (### format) to break up the content
- Start with a compelling hook that connects beautifully with the previous chapter (if applicable, using the continuity context above)
- End with a smooth, compelling transition to the next chapter
- Include 1-2 blockquote callouts with key insights
- Use bullet points for actionable steps

AMAZON KDP FORMATTING RULES:
- Use Markdown headings (### for subheadings within the chapter)
- First-line paragraph indents will be handled by CSS
- No page numbers or headers (reflowable ebook)
- Keep paragraphs between 3-6 sentences for readability
- Use bold (**text**) sparingly for emphasis

IMPORTANT CONTEXT CONTINUITY RULES:
1. Ensure absolute zero repetition or duplication of concepts, definitions, or stories already covered in previous chapters (refer to the continuity context above).
2. Write in a continuous, flowing narrative.
3. Write ONLY Chapter ${chapterOutline.number}. Do not include the chapter number prefix in headings (no "Chapter 1:"). Write the full chapter title as an H2 heading, then the content.

Write the complete chapter now:`;

  let content: string;
  try {
    content = await callers.pro(prompt, "gemini-2.5-pro");
  } catch {
    try {
      content = await callers.flash(prompt);
    } catch {
      content = await callers.openrouter(prompt);
    }
  }

  // Extract key takeaways
  const takeaways = content
    .match(/>\s*(.+)/g)
    ?.map((t) => t.replace(/^>\s*/, "").trim())
    .slice(0, 5) || chapterOutline.keyPoints;

  return {
    number: chapterOutline.number,
    title: chapterOutline.title,
    content,
    wordCount: content.split(/\s+/).length,
    keyTakeaways: takeaways,
  };
}

async function polishSingleChapter(
  chapter: ChapterDraft,
  config: EbookConfig,
  callers: AiCallers
): Promise<ChapterDraft> {
  const prompt = `You are a professional book editor specializing in ${config.genre}. Edit and polish this chapter for publication quality.

CHAPTER: "${chapter.title}" (Chapter ${chapter.number})

EDITING INSTRUCTIONS:
1. Fix grammar, spelling, and punctuation
2. Improve sentence flow and transitions
3. Ensure ${config.tone} tone consistency throughout
4. Tighten verbose passages — remove filler words
5. Strengthen the opening hook and closing transition
6. Ensure subheadings are clear and compelling
7. Verify logical flow of arguments/ideas
8. Make blockquote callouts more impactful
9. Keep formatting in clean Markdown (### subheadings, **bold**, > blockquotes)
10. Do NOT change the chapter title or restructure the content
11. Do NOT add chapter number prefixes

ORIGINAL CHAPTER:
---
${chapter.content}
---

Return the polished chapter in clean Markdown format:`;

  let polished: string;
  try {
    polished = await callers.groq(prompt, "llama-3.3-70b-versatile");
  } catch {
    try {
      polished = await callers.flash(prompt);
    } catch {
      return chapter; // Return unpolished if all fail
    }
  }

  return {
    ...chapter,
    content: polished,
    wordCount: polished.split(/\s+/).length,
  };
}

async function generateFrontMatter(
  outline: EbookOutline,
  config: EbookConfig,
  callers: AiCallers
): Promise<EbookFrontMatter> {
  const prompt = `Generate professional front matter for the ebook "${outline.title}" by ${config.authorName}.

Create these sections in clean Markdown:

1. **TITLE PAGE** — Book title, subtitle, author name, publisher ("Webness Publishing")
2. **COPYRIGHT PAGE** — Standard copyright notice, year ${new Date().getFullYear()}, "All rights reserved", disclaimer
3. **DEDICATION** — A brief, thoughtful dedication (2-3 sentences)
4. **PREFACE** — A 200-word preface explaining why this book was written, who it's for, and what readers will gain

Do NOT include a Table of Contents (it's auto-generated).

Separate each section with: ---SECTION_BREAK---`;

  let raw: string;
  try {
    raw = await callers.flash(prompt);
  } catch {
    raw = await callers.groq(prompt);
  }

  const sections = raw.split(/---SECTION_BREAK---/);

  const tocEntries = outline.chapters
    .map((ch) => `${ch.number}. ${ch.title}`)
    .join("\n");

  return {
    titlePage: sections[0]?.trim() || `# ${outline.title}\n\n## ${outline.subtitle}\n\n*By ${config.authorName}*\n\n*Webness Publishing*`,
    copyrightPage: sections[1]?.trim() || `© ${new Date().getFullYear()} ${config.authorName}. All rights reserved.`,
    dedication: sections[2]?.trim() || "",
    tableOfContents: `# Table of Contents\n\n${tocEntries}`,
    preface: sections[3]?.trim() || "",
  };
}

async function generateBackMatter(
  outline: EbookOutline,
  chapters: ChapterDraft[],
  config: EbookConfig,
  callers: AiCallers
): Promise<EbookBackMatter> {
  const chapterSummaries = chapters
    .map((ch) => `Ch${ch.number}: ${ch.title} — ${ch.keyTakeaways[0] || ""}`)
    .join("\n");

  const prompt = `Generate professional back matter for the ebook "${outline.title}" by ${config.authorName}.

Book summary for context:
${chapterSummaries}

Lead capture offer: "${config.offer}"

Create these sections in clean Markdown:

1. **ABOUT THE AUTHOR** — Professional 150-word author bio for ${config.authorName}, positioning them as an expert
2. **RESOURCES** — 5-8 recommended resources (tools, websites, books) related to ${config.topic}
3. **CALL TO ACTION** — A compelling CTA page (150 words) encouraging readers to take the next step with "${config.offer}". Include a fake URL placeholder like [yourwebsite.com] for the offer link.
4. **GLOSSARY** — 8-12 key terms from the book with concise definitions

Separate each section with: ---SECTION_BREAK---`;

  let raw: string;
  try {
    raw = await callers.flash(prompt);
  } catch {
    raw = await callers.groq(prompt);
  }

  const sections = raw.split(/---SECTION_BREAK---/);

  return {
    aboutAuthor: sections[0]?.trim() || `## About the Author\n\n${config.authorName} is an expert in ${config.topic}.`,
    resources: sections[1]?.trim() || "## Recommended Resources\n\n*Coming soon*",
    callToAction: sections[2]?.trim() || `## Take the Next Step\n\nVisit us to learn more about ${config.offer}.`,
    glossary: sections[3]?.trim() || "",
  };
}

// ─── SVG Chapter Illustrations ──────────────────────────────────

async function generateChapterSvg(
  chapter: ChapterDraft,
  config: EbookConfig,
  callers: AiCallers
): Promise<string> {
  let customStyleInstructions = "";
  const topicLower = config.topic.toLowerCase();
  const titleLower = chapter.title.toLowerCase();
  const contentLower = chapter.content.toLowerCase();

  if (topicLower.includes("plant") || topicLower.includes("garden") || topicLower.includes("botanical") || contentLower.includes("soil") || contentLower.includes("leaf")) {
    customStyleInstructions = `- Visual Theme: Botanical/Houseplants Minimalist Vector Art.
- Design Elements to select from: Elegant silhouettes of Monstera Deliciosa leaves, potted snake plants in ceramic stand planters, hanging string of pearls vines, modern watering cans, plant mister spray bottles, structured soil layers, sun rays filtering through leaves, or aesthetic plant shelving.
- Graphic Style: Flat illustration, organic smooth vector lines, premium Scandinavian indoor gardening aesthetic.`;
  } else if (topicLower.includes("aquascape") || topicLower.includes("aquarium") || topicLower.includes("aquatic") || contentLower.includes("fish") || contentLower.includes("stone")) {
    customStyleInstructions = `- Visual Theme: Aquascaping & Aquatic Tank Art.
- Design Elements to select from: Silhouette curves of natural driftwood roots, structured Dragon stones or Seiryu stones clusters, carpeting grass layers, aquatic moss elements, CO2 bubble diffusers with tiny bubbles rising, or minimalist schools of 3-4 neon tetra fish vectors.
- Graphic Style: High-end Japanese Zen aesthetic, clean geometric lines, peaceful and balanced layout.`;
  } else {
    customStyleInstructions = `- Visual Theme: High-end B2B and business consulting graphics.
- Design Elements to select from: Minimalist gears, growth chart arrows, step-by-step progress funnels, structured organizational block diagrams.
- Graphic Style: Flat modern vector illustration, executive catalog style.`;
  }

  const prompt = `Generate a clean, professional SVG illustration for a book chapter. The SVG should be a minimal, elegant vector graphic suitable for an ebook interior.

CHAPTER: "${chapter.title}"
KEY CONCEPT: ${chapter.keyTakeaways[0] || chapter.title}
BOOK TOPIC: ${config.topic}

${customStyleInstructions}

SVG REQUIREMENTS:
- ViewBox: "0 0 600 400"
- Use only these colors: #6366f1 (indigo), #a855f7 (purple), #22c55e (green), #f59e0b (amber), #1a1a1a (dark), #f8fafc (light), #e2e8f0 (border)
- Style: Clean, geometric, modern flat vector illustration style
- NO text elements — purely visual/geometric shapes
- Professional enough for Amazon Kindle display
- Keep it simple — max 20 SVG elements
- Must be valid SVG starting with <svg and ending with </svg>

Return ONLY the raw SVG code, starting with <svg and ending with </svg>. No markdown, no explanation.`;

  let raw: string;
  try {
    raw = await callers.flash(prompt);
  } catch {
    return generateFallbackSvg(chapter.number);
  }

  // Extract SVG from response
  const svgMatch = raw.match(/<svg[\s\S]*?<\/svg>/i);
  if (svgMatch) {
    return svgMatch[0];
  }

  return generateFallbackSvg(chapter.number);
}

function generateFallbackSvg(chapterNum: number): string {
  const colors = ["#6366f1", "#a855f7", "#22c55e", "#f59e0b", "#ec4899"];
  const color = colors[(chapterNum - 1) % colors.length];
  const secondary = colors[chapterNum % colors.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#f8fafc" rx="8"/>
  <circle cx="300" cy="180" r="80" fill="${color}" opacity="0.15"/>
  <circle cx="300" cy="180" r="50" fill="${color}" opacity="0.25"/>
  <circle cx="300" cy="180" r="25" fill="${color}" opacity="0.4"/>
  <line x1="150" y1="300" x2="450" y2="300" stroke="#e2e8f0" stroke-width="2"/>
  <rect x="180" y="260" width="40" height="40" rx="4" fill="${color}" opacity="0.3"/>
  <rect x="240" y="240" width="40" height="60" rx="4" fill="${color}" opacity="0.5"/>
  <rect x="300" y="220" width="40" height="80" rx="4" fill="${color}" opacity="0.7"/>
  <rect x="360" y="230" width="40" height="70" rx="4" fill="${secondary}" opacity="0.5"/>
</svg>`;
}

// ─── Full Manuscript Assembly ───────────────────────────────────

function assembleFullMarkdown(
  outline: EbookOutline,
  frontMatter: EbookFrontMatter,
  chapters: ChapterDraft[],
  backMatter: EbookBackMatter,
  config: EbookConfig
): string {
  const parts: string[] = [];

  // YAML Front Matter (for tools that parse it)
  parts.push(`---
title: "${outline.title}"
subtitle: "${outline.subtitle}"
author: "${config.authorName}"
publisher: "Webness Publishing"
date: "${new Date().toISOString().split("T")[0]}"
genre: "${config.genre}"
audience: "${config.audience}"
keywords: [${outline.kdpMetadata.keywords.map((k) => `"${k}"`).join(", ")}]
categories: [${outline.kdpMetadata.categories.map((c) => `"${c}"`).join(", ")}]
description: "${outline.kdpMetadata.description.replace(/"/g, '\\"')}"
word_count: ${chapters.reduce((sum, ch) => sum + ch.wordCount, 0)}
generated_by: "Webness OS Ebook Engine v2"
---`);

  // Front Matter
  parts.push(frontMatter.titlePage);
  parts.push("\n\n---\n\n");
  parts.push(frontMatter.copyrightPage);

  if (frontMatter.dedication) {
    parts.push("\n\n---\n\n");
    parts.push(frontMatter.dedication);
  }

  parts.push("\n\n---\n\n");
  parts.push(frontMatter.tableOfContents);

  if (frontMatter.preface) {
    parts.push("\n\n---\n\n");
    parts.push(frontMatter.preface);
  }

  // Chapters
  for (const chapter of chapters) {
    parts.push("\n\n---\n\n");
    parts.push(`## ${chapter.title}\n\n`);
    parts.push(chapter.content);

    // Key Takeaways box
    if (chapter.keyTakeaways.length > 0) {
      parts.push("\n\n---\n\n");
      parts.push("**📌 Key Takeaways:**\n\n");
      for (const takeaway of chapter.keyTakeaways) {
        parts.push(`- ${takeaway}\n`);
      }
    }
  }

  // Back Matter
  parts.push("\n\n---\n\n");
  parts.push(backMatter.aboutAuthor);
  parts.push("\n\n---\n\n");
  parts.push(backMatter.resources);

  if (config.includeCta) {
    parts.push("\n\n---\n\n");
    parts.push(backMatter.callToAction);
  }

  if (backMatter.glossary) {
    parts.push("\n\n---\n\n");
    parts.push(backMatter.glossary);
  }

  return parts.join("\n");
}

// ─── Outline Parser ─────────────────────────────────────────────

function parseOutline(raw: string, config: EbookConfig): EbookOutline {
  // Extract title
  const titleMatch = raw.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : `${config.topic}: The Complete Guide`;

  // Extract subtitle
  const subtitleMatch = raw.match(/subtitle[:\s]*(.+)/i);
  const subtitle = subtitleMatch
    ? subtitleMatch[1].replace(/^["']|["']$/g, "").trim()
    : `A Comprehensive Guide for ${config.audience}`;

  // Extract chapters
  const chapterMatches = raw.matchAll(/(?:chapter\s*(\d+)|(\d+)\.\s+)[\s:]*(.+?)(?:\n|$)/gi);
  const chapters: EbookOutline["chapters"] = [];
  let chNum = 0;

  for (const match of chapterMatches) {
    chNum++;
    const num = parseInt(match[1] || match[2] || String(chNum));
    const chTitle = match[3]?.replace(/^[:\-–]\s*/, "").replace(/\*+/g, "").trim() || `Chapter ${num}`;

    // Find content after this chapter heading
    const chIndex = raw.indexOf(match[0]);
    const nextChIndex = raw.indexOf("Chapter", chIndex + match[0].length);
    const chContent = nextChIndex > 0
      ? raw.substring(chIndex + match[0].length, nextChIndex)
      : raw.substring(chIndex + match[0].length, chIndex + match[0].length + 500);

    // Extract key points (bullet items)
    const points = chContent
      .match(/[-*•]\s+(.+)/g)
      ?.map((p) => p.replace(/^[-*•]\s+/, "").trim())
      .slice(0, 5) || [];

    // Extract keywords
    const kwMatch = chContent.match(/keyword[s]?[:\s]*(.+)/i);
    const keywords = kwMatch
      ? kwMatch[1].split(/[,;]/).map((k) => k.trim()).filter(Boolean).slice(0, 3)
      : [];

    chapters.push({
      number: num,
      title: chTitle,
      synopsis: points.slice(0, 2).join(". ") || `An in-depth exploration of ${chTitle.toLowerCase()}.`,
      keyPoints: points.length > 0 ? points : [`Understanding ${chTitle}`, `Practical applications`, `Key strategies`],
      targetKeywords: keywords.length > 0 ? keywords : [config.topic.toLowerCase()],
    });

    if (chapters.length >= config.chapterCount) break;
  }

  // Fill missing chapters
  while (chapters.length < config.chapterCount) {
    const n = chapters.length + 1;
    chapters.push({
      number: n,
      title: `Chapter ${n}`,
      synopsis: `Continued exploration of ${config.topic}.`,
      keyPoints: [`Key aspect ${n}`, `Practical tip ${n}`],
      targetKeywords: [config.topic.toLowerCase()],
    });
  }

  // Extract KDP metadata
  const descMatch = raw.match(/description[:\s]*(.{50,300})/i);
  const description = descMatch
    ? descMatch[1].trim()
    : `${title} is a comprehensive guide for ${config.audience} covering everything about ${config.topic}.`;

  const kwSection = raw.match(/keyword[s]?[:\s]*([\s\S]{20,300}?)(?:\n\n|categories|$)/i);
  const keywords = kwSection
    ? kwSection[1].split(/[\n,;•]/).map((k) => k.replace(/^[-*\d.)\s]+/, "").trim()).filter((k) => k.length > 2).slice(0, 7)
    : config.keywords.slice(0, 7);

  const catSection = raw.match(/categor[yies]+[:\s]*([\s\S]{10,200}?)(?:\n\n|$)/i);
  const categories = catSection
    ? catSection[1].split(/[\n,;•]/).map((c) => c.replace(/^[-*\d.)\s]+/, "").trim()).filter((c) => c.length > 3).slice(0, 3)
    : ["Business & Money", "Self-Help", "Computers & Technology"];

  return {
    title,
    subtitle,
    chapters,
    kdpMetadata: {
      description,
      keywords: keywords.length > 0 ? keywords : [config.topic],
      categories,
      targetAge: "18-65",
      language: "en",
    },
  };
}

// ─── Utilities ──────────────────────────────────────────────────

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4);
}
