interface BrainChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface BrainChatRequest {
  message?: string;
  messages?: BrainChatMessage[];
  task_type?: "general" | "code" | "reasoning" | "research" | "polish";
  model?: string;
  temperature?: number;
  system?: string;
}

interface BrainResearchLoopRequest {
  query?: string;
  prompt?: string;
  max_iterations?: number;
  confidence_threshold?: number;
  model?: string;
}

interface BrainV1Response {
  success: boolean;
  answer?: string;
  data?: Record<string, unknown>;
  error?: string;
  confidence?: number;
  tokensUsed?: number;
  latencyMs?: number;
  modelUsed?: string;
  providerUsed?: string;
}

const BRAIN_URL = process.env.BRAIN_URL || "https://brain.webness.in";
const BRAIN_API_KEY = process.env.BRAIN_API_KEY || "";

async function postToBrainV1(
  endpoint: "/v1/chat" | "/v1/research-loop",
  body: unknown,
  timeoutMs = 180000
): Promise<BrainV1Response> {
  const response = await fetch(`${BRAIN_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": BRAIN_API_KEY,
      "X-Webness-Key": BRAIN_API_KEY,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Brain ${endpoint} returned ${response.status}: ${errorText}`);
  }

  return (await response.json()) as BrainV1Response;
}

export function chatWithBrain(request: BrainChatRequest): Promise<BrainV1Response> {
  return postToBrainV1("/v1/chat", request);
}

export function runBrainResearchLoop(
  request: BrainResearchLoopRequest
): Promise<BrainV1Response> {
  return postToBrainV1("/v1/research-loop", request, 360000);
}
