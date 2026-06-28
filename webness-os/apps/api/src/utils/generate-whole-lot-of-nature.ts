import { generateEbook, EbookConfig, AiCallers } from "./ebook-engine.js";
import { compileKdpEpub } from "./epub-compiler.js";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
// __dirname is globally available in Node.js CommonJS

// Resolve directories
const outputDir = path.resolve(__dirname, "../../../../../generated-books");

// Load .env
const envPath = path.resolve(__dirname, "../../../../.env");
console.log(`🔍 Loading .env from: ${envPath}`);
dotenv.config({ path: envPath });

const geminiKey = process.env.GOOGLE_AI_STUDIO_KEY_BACKUP || process.env.GOOGLE_AI_STUDIO_KEY || "";
const groqKey = process.env.GROQ_API_KEY || "";
const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY_BACKUP || "";
const openaiKey = process.env.OPENAI_API_KEY || "";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Quick inline caller map
const ai = new GoogleGenAI({ apiKey: geminiKey || "dummy_key" });

const callModelWithFallback = async (prompt: string, model: string): Promise<string> => {
    try {
        const res = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: { temperature: 0.7, maxOutputTokens: 8192 },
        });
        return res.text || "";
    } catch (e) {
        console.log("Fallback failed natively", e);
        return "";
    }
};

const callFlash = async (prompt: string) => callModelWithFallback(prompt, "gemini-2.5-flash");
const callFlashSearch = async (prompt: string) => {
    try {
        const res = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { tools: [{ googleSearch: {} } as any] },
        });
        return res.text || "";
    } catch (e) {
        return callFlash(prompt);
    }
};
const callPro = async (prompt: string) => callModelWithFallback(prompt, "gemini-2.5-pro");
const callMockImagen = async (prompt: string) => {
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">
    <rect width="100%" height="100%" fill="#18181b"/>
    <text x="200" y="280" font-family="Georgia" font-size="28" fill="#e5e7eb" text-anchor="middle">WHOLE LOT OF NATURE</text>
    <text x="200" y="320" font-family="Georgia" font-size="14" fill="#71717a" text-anchor="middle" font-style="italic">wholelotofnatture</text>
  </svg>`;
  return Buffer.from(fallbackSvg).toString("base64");
};

const callers: AiCallers = {
  flash: callFlash,
  pro: callPro,
  groq: callFlash,
  openrouter: callFlash,
  imagen: callMockImagen,
  flashSearch: callFlashSearch,
};

async function runProductionPipeline(config: EbookConfig, filenamePrefix: string) {
  const onProgress = (step: string, detail: string, progress: number) => {
    console.log(`[${step.toUpperCase()}] ${progress}% : ${detail}`);
  };

  try {
    const result = await generateEbook(config, callers, onProgress);
    const epubResult = compileKdpEpub(result, outputDir);
    
    const mdPath = path.join(outputDir, `${filenamePrefix}.md`);
    fs.writeFileSync(mdPath, result.fullMarkdown);
    console.log(`✅ Saved Manuscript Markdown to: ${mdPath}`);

    if (epubResult.epubPath) {
      const compiledEpubPath = path.join(outputDir, `${filenamePrefix}.epub`);
      if (fs.existsSync(compiledEpubPath)) fs.unlinkSync(compiledEpubPath);
      fs.renameSync(epubResult.epubPath, compiledEpubPath);
      console.log(`✅ Compiled reflowable EPUB written to: ${compiledEpubPath}`);
    }
  } catch (err: any) {
    console.error(`❌ Run failed:`, err.message);
  }
}

async function main() {
  const config: EbookConfig = {
    topic: "How nature is the only thing that can heal us, exposing the truths of Big Pharma, the mental health niche, and turning to plants like our ancestors did.",
    subtitle: "The Ultimate Guide to Getting Back to Nature and Breaking the Cycle",
    audience: "People struggling with mental health looking for natural alternatives to big pharma",
    offer: "A profound connection to ancestral healing and breaking the cycle of medical dependence",
    authorName: "wholelotofnatture",
    chapterCount: 5,
    wordCountPerChapter: 2000,
    tone: "passionate, authoritative, exposing, healing" as any,
    genre: "Alternative Medicine & Mental Health",
    keywords: ["nature healing", "big pharma truths", "mental health plants", "aztec priests", "ayurveda", "break the cycle"],
    includeImages: true,
    includeCta: false,
    enableResearch: true,
  };

  await runProductionPipeline(config, "whole_lot_of_nature");
}

main();
