// ============================================
// WEBNESS OS — Shared Constants
// ============================================

// ---- SSE Event Types ----
export const SSE_EVENTS = {
  TASK_QUEUED: "task_queued",
  STEP_START: "step_start",
  STEP_PROGRESS: "step_progress",
  STEP_COMPLETE: "step_complete",
  TOKEN: "token",
  CRITIC_FEEDBACK: "critic_feedback",
  TASK_COMPLETE: "task_complete",
  TASK_ERROR: "task_error",
  SYSTEM_STATUS: "system_status",
} as const;

// ---- Task Step Actions ----
export const STEP_ACTIONS = {
  RESEARCH: "RESEARCH",
  CRAWL: "CRAWL",
  ANALYZE: "ANALYZE",
  DRAFT: "DRAFT",
  REVIEW: "REVIEW",
  POLISH: "POLISH",
  HUMANIZE: "HUMANIZE",
  SEO_OPTIMIZE: "SEO_OPTIMIZE",
  GENERATE_IMAGE: "GENERATE_IMAGE",
  PUBLISH: "PUBLISH",
  SEND_MESSAGE: "SEND_MESSAGE",
  GENERATE_PDF: "GENERATE_PDF",
} as const;

// ---- Credit Costs (base) ----
export const CREDIT_COSTS = {
  seo_auditor: 10,
  researcher: 15,
  blog_writer: 25,
  social_writer: 8,
  lead_scraper: 20,
  whatsapp_sender: 5,
  invoice_generator: 3,
  linkedin_manager: 8,
  design_auditor: 12,
  graphic_designer: 15,
  accounting_report: 5,
} as const;

// ---- Plan Limits ----
export const PLAN_LIMITS = {
  FREE: {
    creditsPerMonth: 50,
    maxTasks: 10,
    maxUsers: 1,
    tools: ["seo_auditor"],
    whatsapp: false,
    api: false,
  },
  STARTER: {
    creditsPerMonth: 500,
    maxTasks: 100,
    maxUsers: 3,
    tools: [
      "seo_auditor",
      "researcher",
      "blog_writer",
      "social_writer",
      "invoice_generator",
    ],
    whatsapp: false,
    api: false,
  },
  PRO: {
    creditsPerMonth: 2000,
    maxTasks: 500,
    maxUsers: 10,
    tools: "all",
    whatsapp: true,
    api: true,
  },
  ENTERPRISE: {
    creditsPerMonth: 10000,
    maxTasks: -1, // unlimited
    maxUsers: -1,
    tools: "all",
    whatsapp: true,
    api: true,
  },
  SAASS: {
    creditsPerMonth: -1, // unlimited
    maxTasks: -1,
    maxUsers: -1,
    tools: "all",
    whatsapp: true,
    api: true,
  },
} as const;

// ---- AI Provider Priority ----
export const AI_PROVIDERS = [
  { name: "ollama", priority: 1, costPer1MTokens: 0 },
  { name: "deepinfra", priority: 2, costPer1MTokens: 0.06 },
  { name: "openrouter", priority: 3, costPer1MTokens: 0.1 },
  { name: "openai", priority: 4, costPer1MTokens: 2.5 },
] as const;

// ---- Pagination Defaults ----
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ---- JWT Config ----
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d",
} as const;

// ---- Rate Limits ----
export const RATE_LIMITS = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 20 }, // 20 per 15 min
  API: { windowMs: 60 * 1000, max: 60 }, // 60 per minute
  TOOL_EXECUTE: { windowMs: 60 * 1000, max: 10 }, // 10 per minute
  WHATSAPP: { windowMs: 1000, max: 80 }, // 80 per second (Meta limit)
} as const;

// ---- Domain Routing ----
export const DOMAINS = {
  CLIENT_DASHBOARD: "app.webness.in",
  ADMIN_DASHBOARD: "admin.webness.in",
  API: "api.webness.in",
  BRAIN: "brain.webness.in",
  LANDING: "webness.in",
} as const;
