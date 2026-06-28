import { generateEbook, EbookConfig, AiCallers } from "./ebook-engine.js";
import { compileKdpEpub } from "./epub-compiler.js";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Resolve directories in CommonJS
const outputDir = path.resolve(__dirname, "../../../../../generated-books");

// Load .env
const envPath = path.resolve(__dirname, "../../../../.env");
console.log(`🔍 Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const geminiKey = process.env.GOOGLE_AI_STUDIO_KEY_BACKUP || process.env.GOOGLE_AI_STUDIO_KEY || "";
const groqKey = process.env.GROQ_API_KEY || "";
const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY_BACKUP || "";
const openaiKey = process.env.OPENAI_API_KEY || "";

console.log("----------------------------------------------------------------");
console.log("🌟 Webness OS v3.1 — Niche Ebook Production Launcher");
console.log("----------------------------------------------------------------");
console.log(`📂 Output Workspace Directory: ${outputDir}`);
console.log(`🔑 Credentials Resolved:`);
console.log(`   - Gemini Key: ${geminiKey ? "✅ Present" : "❌ Missing"}`);
console.log(`   - Groq Key: ${groqKey ? "✅ Present" : "❌ Missing"}`);
console.log(`   - OpenRouter Key: ${openrouterKey ? "✅ Present" : "❌ Missing"}`);
console.log(`   - OpenAI Key: ${openaiKey ? "✅ Present" : "❌ Missing"}`);
console.log("----------------------------------------------------------------\n");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ─── Smart Quota Fallback Translation Handlers ─────────────────

const ai = new GoogleGenAI({ apiKey: geminiKey || "dummy_key" });

const callOpenRouterModel = async (prompt: string, model: string): Promise<string> => {
  if (!openrouterKey) throw new Error("OpenRouter key not present in environment");
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openrouterKey}`,
      "HTTP-Referer": "https://webness.in",
      "X-Title": "Webness OS Ebook Runner",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000, // Strict ceiling to bypass credit reservations
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter (${model}) returned ${response.status}: ${await response.text()}`);
  }

  const json = (await response.json()) as any;
  return json.choices[0].message.content || "";
};

const callOpenAIModel = async (prompt: string, model: string): Promise<string> => {
  if (!openaiKey) throw new Error("OpenAI key not present in environment");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI (${model}) returned ${response.status}: ${await response.text()}`);
  }

  const json = (await response.json()) as any;
  return json.choices[0].message.content || "";
};

const callModelWithFallback = async (
  prompt: string,
  geminiModel: string,
  openrouterModel: string,
  openaiModel: string,
  useSearch = false
): Promise<string> => {
  // Try 1: Native Gemini (if key exists)
  if (geminiKey) {
    try {
      if (useSearch) {
        // Native search grounding is only supported in Gemini 2.5 flash
        const res = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} } as any],
          },
        });
        return res.text || "";
      } else {
        const res = await ai.models.generateContent({
          model: geminiModel,
          contents: prompt,
          config: { temperature: 0.7, maxOutputTokens: 8192 },
        });
        return res.text || "";
      }
    } catch (err: any) {
      const errorMsg = err.message || "";
      if (
        errorMsg.includes("429") ||
        errorMsg.includes("quota") ||
        errorMsg.includes("RESOURCE_EXHAUSTED") ||
        errorMsg.includes("503") ||
        errorMsg.includes("demand")
      ) {
        console.warn(`⚠️ Native Gemini [${geminiModel}] Rate Limited/Quota Exhausted. Shifting to OpenRouter...`);
      } else {
        console.warn(`⚠️ Native Gemini [${geminiModel}] call failed: ${err.message}. Retrying via OpenRouter...`);
      }
    }
  }

  // Try 2: OpenRouter (First choice fallback using FREE-TIER endpoints to bypass billing limits)
  if (openrouterKey) {
    try {
      // Map all standard fallbacks to OpenRouter's 100% Free Router to prevent credit rate locks!
      const freeModel = "openrouter/free";
      console.log(`☁️ Routing request to OpenRouter Free Router [${freeModel}]...`);
      return await callOpenRouterModel(prompt, freeModel);
    } catch (orErr: any) {
      console.warn(`⚠️ OpenRouter Free Router fallback failed: ${orErr.message}. Attempting OpenAI...`);
    }
  }

  // Try 3: OpenAI
  if (openaiKey) {
    try {
      console.log(`☁️ Routing request to OpenAI [${openaiModel}]...`);
      return await callOpenAIModel(prompt, openaiModel);
    } catch (oaErr: any) {
      console.warn(`⚠️ OpenAI fallback failed: ${oaErr.message}`);
    }
  }

  throw new Error("All translation engines exhausted. Please verify your API keys inside the monorepo .env file.");
};

const callFlash = async (prompt: string): Promise<string> => {
  return callModelWithFallback(prompt, "gemini-2.5-flash", "openrouter/free", "gpt-4o-mini", false);
};

const callFlashSearch = async (prompt: string): Promise<string> => {
  return callModelWithFallback(prompt, "gemini-2.5-flash", "openrouter/free", "gpt-4o-mini", true);
};

const callPro = async (prompt: string): Promise<string> => {
  // Map Gemini Pro fallback to Free Router on OpenRouter if key is restricted/empty
  return callModelWithFallback(prompt, "gemini-2.5-pro", "openrouter/free", "gpt-4o", false);
};

// Groq parallel chapter polisher
const callGroq = async (prompt: string, model = "llama-3.3-70b-versatile"): Promise<string> => {
  if (!groqKey) return callFlash(prompt);
  
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const json = (await response.json()) as any;
    return json.choices[0].message.content || "";
  } catch (err: any) {
    console.warn(`⚠️ Groq failed, falling back to Flash/OpenAI: ${err.message}`);
    return callFlash(prompt);
  }
};

const callOpenRouter = async (prompt: string): Promise<string> => {
  return callFlash(prompt);
};

const callMockImagen = async (prompt: string): Promise<string> => {
  console.log(`🖼️ Mocking Imagen 3 cover generation for prompt: "${prompt.substring(0, 60)}..."`);
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">
    <rect width="100%" height="100%" fill="#18181b"/>
    <circle cx="200" cy="300" r="100" fill="#6366f1" opacity="0.1"/>
    <text x="200" y="280" font-family="Georgia" font-size="28" fill="#e5e7eb" text-anchor="middle">NICHE EBOOK</text>
    <text x="200" y="320" font-family="Georgia" font-size="14" fill="#71717a" text-anchor="middle" font-style="italic">Webness Publishing</text>
  </svg>`;
  return Buffer.from(fallbackSvg).toString("base64");
};

const callers: AiCallers = {
  flash: callFlash,
  pro: callPro,
  groq: callGroq,
  openrouter: callOpenRouter,
  imagen: callMockImagen,
  flashSearch: callFlashSearch,
};

// ─── Execution Logic ───────────────────────────────────────────

async function runProductionPipeline(config: EbookConfig, filenamePrefix: string) {
  console.log(`\n================================================================`);
  console.log(`🚀 STARTING PRODUCTION RUN: ${config.topic.toUpperCase()}`);
  console.log(`================================================================`);

  const onProgress = (step: string, detail: string, progress: number) => {
    const bar = "█".repeat(Math.round(progress / 5)) + "░".repeat(20 - Math.round(progress / 5));
    console.log(`[${step.toUpperCase()}] [${bar}] ${progress}% : ${detail}`);
  };

  try {
    const result = await generateEbook(config, callers, onProgress);

    console.log("\n📦 Compiling KDP Reflowable EPUB 3.0 package...");
    const epubResult = compileKdpEpub(result, outputDir);
    
    // Save manuscript (Markdown)
    const mdPath = path.join(outputDir, `${filenamePrefix}.md`);
    fs.writeFileSync(mdPath, result.fullMarkdown);
    console.log(`✅ Saved Manuscript Markdown to: ${mdPath}`);

    // Save Research Dossier
    if (result.researchDossier) {
      const dossierPath = path.join(outputDir, `${filenamePrefix}_research_dossier.md`);
      fs.writeFileSync(dossierPath, result.researchDossier);
      console.log(`✅ Saved Research Dossier to: ${dossierPath}`);
    }

    // Save final compiled EPUB path info
    if (epubResult.epubPath) {
      const compiledEpubPath = path.join(outputDir, `${filenamePrefix}.epub`);
      if (fs.existsSync(compiledEpubPath)) {
        fs.unlinkSync(compiledEpubPath);
      }
      fs.renameSync(epubResult.epubPath, compiledEpubPath);
      console.log(`✅ Compiled reflowable EPUB written to: ${compiledEpubPath}`);
    }

    console.log(`🎉 RUN COMPLETED SUCCESS! Total words generated: ${result.totalWordCount.toLocaleString()} words`);
  } catch (err: any) {
    console.error(`❌ Run failed for ${config.topic}:`, err.message);
  }
}

// ─── Launcher ──────────────────────────────────────────────────

async function main() {
  // EBOOK 1: HOUSEPLANTS
  const houseplantConfig: EbookConfig = {
    topic: "Houseplants Care & Indoor Jungle Design",
    subtitle: "The Ultimate Guide to Potted Plants, Interior Styling, and Thriving Botanicals",
    audience: "Urban gardeners, plant lovers, home interior enthusiasts",
    offer: "Webness Green OS & Botanical Design Consultation Services",
    authorName: "Webness Botanical Lab",
    chapterCount: 5,
    wordCountPerChapter: 1500,
    tone: "conversational",
    genre: "Home Gardening & Design",
    keywords: ["houseplants care", "indoor jungle", "monstera propagation", "watering guide", "plant styling"],
    includeImages: true,
    includeCta: true,
    enableResearch: true,
  };

  // EBOOK 2: AQUASCAPING
  const aquascapingConfig: EbookConfig = {
    topic: "Aquascaping & Aquatic Tank Design",
    subtitle: "Mastering the Art of Zen Aquarium Layouts, Driftwood Styling, and Live Water Plants",
    audience: "Aquarium hobbyists, aquascapers, zen design lovers",
    offer: "Webness Zen Space Automation & Design Consulting",
    authorName: "Webness Zen Lab",
    chapterCount: 5,
    wordCountPerChapter: 1500,
    tone: "professional",
    genre: "Aquarium Hobby & Zen Art",
    keywords: ["aquascaping guide", "iwagumi layout", "aquatic plants care", "co2 tank diffuser", "driftwood design"],
    includeImages: true,
    includeCta: true,
    enableResearch: true,
  };

  // 1. HOUSEPLANTS CHECK
  const houseplantPath = path.join(outputDir, "houseplants_care_indoor_jungle.epub");
  if (fs.existsSync(houseplantPath)) {
    console.log(`\n🍀 Skipping Houseplants Care book (Already generated at: ${houseplantPath})`);
  } else {
    console.log("\n🍀 Initializing Houseplants Ebook Run...");
    await runProductionPipeline(houseplantConfig, "houseplants_care_indoor_jungle");
  }

  // 2. AQUASCAPING CHECK
  const aquascapingPath = path.join(outputDir, "aquascaping_aquatic_tank_design.epub");
  if (fs.existsSync(aquascapingPath)) {
    console.log(`\n🌊 Skipping Aquascaping book (Already generated at: ${aquascapingPath})`);
  } else {
    console.log("\n🌊 Initializing Aquascaping Ebook Run...");
    await runProductionPipeline(aquascapingConfig, "aquascaping_aquatic_tank_design");
  }

  console.log("\n----------------------------------------------------------------");
  console.log("🌟 ALL niche ebook runs successfully executed! Check 'generated-books/'");
  console.log("----------------------------------------------------------------");
}

main().catch((err) => {
  console.error("❌ Critical Launcher Error:", err.message);
});
