import CircuitBreaker from "opossum";
import { logger } from "../utils/logger.js";

interface BrainRequestOptions {
  endpoint: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
  timeoutMs?: number;
}

interface BrainResponse {
  success: boolean;
  data?: any;
  error?: string;
}

const BRAIN_URL = process.env.BRAIN_URL || "http://localhost:8000";
const BRAIN_API_KEY = process.env.BRAIN_API_KEY || "";

/**
 * Make a request to the Local Brain (Python + Ollama)
 */
async function callBrain(options: BrainRequestOptions): Promise<BrainResponse> {
  const { endpoint, method = "POST", body, timeoutMs = 120000 } = options;

  const url = `${BRAIN_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Webness-Key": BRAIN_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Brain returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return { success: true, data };
}

// ─── Circuit Breaker ─────────────────────────────────────
// Wraps callBrain with circuit breaker pattern (opossum)
// Opens circuit after 3 failures, resets after 30s

export const brainCircuit = new CircuitBreaker(callBrain, {
  timeout: 120000,        // 2 min timeout per request
  errorThresholdPercentage: 50, // Open after 50% failures
  resetTimeout: 30000,    // Try again after 30s
  rollingCountTimeout: 60000,   // 1 min rolling window
  rollingCountBuckets: 6,       // 10s buckets
  volumeThreshold: 3,     // Min 3 requests before opening
  name: "brain",
});

brainCircuit.on("open", () => {
  logger.warn("🔴 Brain circuit OPEN — brain unreachable");
});

brainCircuit.on("halfOpen", () => {
  logger.info("🟡 Brain circuit HALF-OPEN — testing...");
});

brainCircuit.on("close", () => {
  logger.info("🟢 Brain circuit CLOSED — brain recovered");
});

brainCircuit.on("fallback", () => {
  logger.warn("Brain circuit fallback triggered");
});

/**
 * Send a task to the brain with circuit breaker protection
 */
export async function sendToBrain(
  toolSlug: string,
  input: Record<string, unknown>,
  taskId: string
): Promise<BrainResponse> {
  return brainCircuit.fire({
    endpoint: `/tools/${toolSlug}/execute`,
    method: "POST",
    body: { input, taskId },
    timeoutMs: 120000,
  }) as Promise<BrainResponse>;
}

/**
 * Check brain health (bypasses circuit breaker)
 */
export async function checkBrainHealth(): Promise<boolean> {
  try {
    const result = await callBrain({
      endpoint: "/health",
      method: "GET",
      timeoutMs: 5000,
    });
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Get circuit breaker stats
 */
export function getBrainCircuitStats() {
  return {
    state: brainCircuit.opened
      ? "open"
      : brainCircuit.halfOpen
        ? "half-open"
        : "closed",
    stats: brainCircuit.stats,
  };
}
