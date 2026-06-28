import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger.js";

export interface AiKeys {
  groq: string;
  openai: string;
  gemini: string;
  openrouter: string;
}

export interface CouncilRunOptions {
  purpose: string;
  prompt: string;
  models?: string[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface CouncilResult {
  provider: string;
  model: string;
  ok: boolean;
  text: string;
  latencyMs: number;
  error?: string;
}

export interface CouncilSummary {
  mode: "parallel_council";
  purpose: string;
  winner: CouncilResult | null;
  results: CouncilResult[];
  synthesis: string;
  providersAttempted: string[];
  providersSucceeded: string[];
}

type ProviderTarget = {
  provider: string;
  model: string;
  enabled: boolean;
  run: () => Promise<string>;
};

const DEFAULT_OPENROUTER_MODEL = process.env.OPENROUTER_DEFAULT_MODEL || "meta-llama/llama-3.1-8b-instruct:free";
const DEFAULT_GROQ_MODEL = process.env.GROQ_DEFAULT_MODEL || "llama-3.3-70b-versatile";
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_DEFAULT_MODEL || "gemini-2.5-flash";
const DEFAULT_OPENAI_MODEL = process.env.OPENAI_DEFAULT_MODEL || "gpt-4o-mini";
const DEFAULT_HERMES_MODEL = process.env.HERMES_MODEL || "nous-hermes2:latest";
const DEFAULT_JAN_MODEL = process.env.JAN_DEFAULT_MODEL || "llama3.1:8b";

function hasModelFilter(options: CouncilRunOptions, provider: string, model: string) {
  if (!options.models?.length) return true;
  const wanted = options.models.map((item) => item.toLowerCase());
  return wanted.includes(provider.toLowerCase()) || wanted.includes(model.toLowerCase());
}

async function withTimeout<T>(label: string, timeoutMs: number, fn: () => Promise<T>): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  return Promise.race([fn(), timeout]);
}

async function callOpenAiCompatible(args: {
  baseUrl: string;
  apiKey?: string;
  model: string;
  prompt: string;
  temperature: number;
  maxTokens: number;
  extraHeaders?: Record<string, string>;
}) {
  const response = await fetch(`${args.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(args.apiKey ? { Authorization: `Bearer ${args.apiKey}` } : {}),
      ...args.extraHeaders,
    },
    body: JSON.stringify({
      model: args.model,
      messages: [{ role: "user", content: args.prompt }],
      temperature: args.temperature,
      max_tokens: args.maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`${args.baseUrl} returned ${response.status}: ${await response.text()}`);
  }

  const json = (await response.json()) as any;
  return json.choices?.[0]?.message?.content || "";
}

async function callGemini(prompt: string, keys: AiKeys, model: string, temperature: number, maxTokens: number) {
  const apiKey = keys.gemini || process.env.GOOGLE_AI_STUDIO_KEY;
  if (!apiKey) throw new Error("Gemini API key not configured");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });
  return response.text || "";
}

async function callBrain(prompt: string, model: string, temperature: number) {
  const baseUrl = (process.env.BRAIN_API_URL || process.env.BRAIN_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/v1/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.BRAIN_API_KEY ? { "X-API-Key": process.env.BRAIN_API_KEY } : {}),
    },
    body: JSON.stringify({
      message: prompt,
      task_type: "general",
      model,
      temperature,
    }),
  });

  if (!response.ok) {
    throw new Error(`Local Brain returned ${response.status}: ${await response.text()}`);
  }

  const json = (await response.json()) as any;
  return json.answer || json.data?.answer || "";
}

function buildTargets(keys: AiKeys, options: CouncilRunOptions): ProviderTarget[] {
  const temperature = options.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? 4096;
  const prompt = options.prompt;

  const targets: ProviderTarget[] = [
    {
      provider: "gemini",
      model: DEFAULT_GEMINI_MODEL,
      enabled: Boolean(keys.gemini || process.env.GOOGLE_AI_STUDIO_KEY),
      run: () => callGemini(prompt, keys, DEFAULT_GEMINI_MODEL, temperature, maxTokens),
    },
    {
      provider: "groq",
      model: DEFAULT_GROQ_MODEL,
      enabled: Boolean(keys.groq || process.env.GROQ_API_KEY),
      run: () =>
        callOpenAiCompatible({
          baseUrl: "https://api.groq.com/openai/v1",
          apiKey: keys.groq || process.env.GROQ_API_KEY,
          model: DEFAULT_GROQ_MODEL,
          prompt,
          temperature,
          maxTokens,
        }),
    },
    {
      provider: "openrouter",
      model: DEFAULT_OPENROUTER_MODEL,
      enabled: Boolean(keys.openrouter || process.env.OPENROUTER_API_KEY),
      run: () =>
        callOpenAiCompatible({
          baseUrl: "https://openrouter.ai/api/v1",
          apiKey: keys.openrouter || process.env.OPENROUTER_API_KEY,
          model: DEFAULT_OPENROUTER_MODEL,
          prompt,
          temperature,
          maxTokens,
          extraHeaders: {
            "HTTP-Referer": process.env.PUBLIC_APP_URL || "https://webness.in",
            "X-Title": "Webness OS",
          },
        }),
    },
    {
      provider: "openai",
      model: DEFAULT_OPENAI_MODEL,
      enabled: Boolean(keys.openai || process.env.OPENAI_API_KEY),
      run: () =>
        callOpenAiCompatible({
          baseUrl: "https://api.openai.com/v1",
          apiKey: keys.openai || process.env.OPENAI_API_KEY,
          model: DEFAULT_OPENAI_MODEL,
          prompt,
          temperature,
          maxTokens,
        }),
    },
    {
      provider: "hermes",
      model: DEFAULT_HERMES_MODEL,
      enabled: process.env.HERMES_ENABLED === "true" || Boolean(process.env.BRAIN_API_URL || process.env.BRAIN_URL),
      run: () => callBrain(prompt, DEFAULT_HERMES_MODEL, temperature),
    },
    {
      provider: "jan",
      model: DEFAULT_JAN_MODEL,
      enabled: Boolean(process.env.JAN_API_BASE_URL),
      run: () =>
        callOpenAiCompatible({
          baseUrl: process.env.JAN_API_BASE_URL || "http://127.0.0.1:1337/v1",
          apiKey: process.env.JAN_API_KEY,
          model: DEFAULT_JAN_MODEL,
          prompt,
          temperature,
          maxTokens,
        }),
    },
  ];

  return targets.filter((target) => target.enabled && hasModelFilter(options, target.provider, target.model));
}

export function getAiConnectorCatalog(keys?: Partial<AiKeys>) {
  return [
    { provider: "gemini", kind: "cloud", configured: Boolean(keys?.gemini || process.env.GOOGLE_AI_STUDIO_KEY), model: DEFAULT_GEMINI_MODEL },
    { provider: "groq", kind: "cloud-free-fast", configured: Boolean(keys?.groq || process.env.GROQ_API_KEY), model: DEFAULT_GROQ_MODEL },
    { provider: "openrouter", kind: "cloud-router", configured: Boolean(keys?.openrouter || process.env.OPENROUTER_API_KEY), model: DEFAULT_OPENROUTER_MODEL },
    { provider: "openai", kind: "cloud", configured: Boolean(keys?.openai || process.env.OPENAI_API_KEY), model: DEFAULT_OPENAI_MODEL },
    { provider: "hermes", kind: "local-brain", configured: process.env.HERMES_ENABLED === "true" || Boolean(process.env.BRAIN_API_URL || process.env.BRAIN_URL), model: DEFAULT_HERMES_MODEL },
    { provider: "jan", kind: "local-openai-compatible", configured: Boolean(process.env.JAN_API_BASE_URL), model: DEFAULT_JAN_MODEL },
    { provider: "claude-code", kind: "local-cli", configured: Boolean(process.env.CLAUDE_CODE_BIN), model: process.env.CLAUDE_CODE_BIN || "not configured" },
    { provider: "codex", kind: "local-cli", configured: Boolean(process.env.CODEX_BIN), model: process.env.CODEX_BIN || "current Codex session" },
    { provider: "antigravity", kind: "local-app", configured: Boolean(process.env.ANTIGRAVITY_PATH), model: process.env.ANTIGRAVITY_PATH || "not configured" },
    { provider: "obsidian", kind: "local-vault", configured: Boolean(process.env.OBSIDIAN_VAULT_PATH), model: process.env.OBSIDIAN_VAULT_PATH || "not configured" },
  ];
}

export async function runParallelCouncil(keys: AiKeys, options: CouncilRunOptions): Promise<CouncilSummary> {
  const timeoutMs = options.timeoutMs ?? 60_000;
  const targets = buildTargets(keys, options);

  if (!targets.length) {
    throw new Error("No AI providers are configured. Add Gemini, Groq, OpenRouter, OpenAI, Brain/Hermes, or Jan credentials.");
  }

  const results = await Promise.all(
    targets.map(async (target) => {
      const started = Date.now();
      try {
        const text = await withTimeout(`${target.provider}:${target.model}`, timeoutMs, target.run);
        return {
          provider: target.provider,
          model: target.model,
          ok: true,
          text,
          latencyMs: Date.now() - started,
        } satisfies CouncilResult;
      } catch (err: any) {
        logger.warn({ provider: target.provider, model: target.model, err: err.message }, "AI council provider failed");
        return {
          provider: target.provider,
          model: target.model,
          ok: false,
          text: "",
          latencyMs: Date.now() - started,
          error: err.message || "Provider failed",
        } satisfies CouncilResult;
      }
    })
  );

  const successful = results.filter((result) => result.ok && result.text.trim());
  const winner = successful.sort((a, b) => b.text.length - a.text.length)[0] || null;
  const synthesis = successful.length > 1
    ? successful
        .map((result) => `## ${result.provider} (${result.model})\n${result.text}`)
        .join("\n\n---\n\n")
    : winner?.text || "";

  return {
    mode: "parallel_council",
    purpose: options.purpose,
    winner,
    results,
    synthesis,
    providersAttempted: targets.map((target) => target.provider),
    providersSucceeded: successful.map((result) => result.provider),
  };
}
