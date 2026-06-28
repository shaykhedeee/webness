// ============================================
// WEBNESS OS — Shared TypeScript Types
// ============================================

// ---- SSE Event Payloads ----

export interface SSETaskQueued {
  taskId: string;
  position: number;
}

export interface SSEStepStart {
  taskId: string;
  step: string;
  stepNumber: number;
  agent: string;
}

export interface SSEStepProgress {
  taskId: string;
  step: string;
  percent: number;
}

export interface SSEStepComplete {
  taskId: string;
  step: string;
  stepNumber: number;
  latencyMs: number;
}

export interface SSEToken {
  taskId: string;
  text: string;
}

export interface SSECriticFeedback {
  taskId: string;
  score: number;
  feedback: string;
}

export interface SSETaskComplete {
  taskId: string;
  status: "COMPLETED" | "FAILED";
  creditCost: number;
}

export interface SSETaskError {
  taskId: string;
  error: string;
}

export interface SSESystemStatus {
  localBrain: "online" | "offline" | "degraded";
  queueDepth: number;
  activeJobs: number;
  tunnelLatencyMs?: number;
}

// ---- API Responses ----

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---- Brain Communication ----

export interface BrainRequest {
  taskId: string;
  toolSlug: string;
  input: Record<string, unknown>;
  orgId: string;
  userId: string;
  callbackUrl: string;
}

export interface BrainResponse {
  taskId: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  tokensUsed?: number;
  latencyMs?: number;
  modelUsed?: string;
  providerUsed?: string;
}

export interface BrainHealthResponse {
  status: "healthy" | "degraded" | "offline";
  gpu: {
    name: string;
    vram_total_mb: number;
    vram_used_mb: number;
    vram_free_mb: number;
  } | null;
  ollama: {
    status: "running" | "stopped";
    loadedModel: string | null;
    models: string[];
  };
  tools: string[];
  uptime: number;
}

// ---- Tool Interface (mirrors Python BaseTool) ----

export interface ToolDefinition {
  slug: string;
  name: string;
  description: string;
  category: string;
  creditCost: number;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  isFree: boolean;
  icon?: string;
}

// ---- Admin Dashboard Types ----

export interface SystemHealthMetrics {
  api: "ok" | "error";
  worker: "ok" | "error";
  brain: "online" | "offline" | "degraded";
  redis: "ok" | "error";
  db: "ok" | "error";
  pgvector: "ok" | "error";
  tunnel: {
    status: "connected" | "disconnected";
    latencyMs: number;
  };
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}

export interface RevenueMetrics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  mrr: number;
  activeClients: number;
  churnRate: number;
}

export interface ClientOverview {
  orgId: string;
  orgName: string;
  plan: string;
  healthScore: number;
  creditsRemaining: number;
  tasksThisMonth: number;
  lastActiveAt: string | null;
  isActive: boolean;
}
