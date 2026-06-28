# WEBNESS OS: Technical Blueprint
**Version:** 7.0 (The End-to-End Business OS — Dual Dashboard Edition)  
**Date:** February 10, 2026  
**Purpose:** Complete technical specification for the AI coder. Every architectural decision, folder structure, schema, interface contract, and failover protocol is defined here.

> **⚠️ v7.0 CHANGES:** WhatsApp Cloud API added. Dual dashboard (Admin + Client). Expanded services: invoicing, accounting, graphic design, LinkedIn, social media. RBAC model. GPU confirmed 8GB. Ubuntu 24.04 LTS ARM. Convex rejected. See SYSTEM_BRAIN.md for all decisions.

---

## 1. Architecture Overview: "The Dual-Core Hydra"

```
┌─────────────────────────────────────────────────────────┐
│                    THE INTERNET                          │
│  (Users access app.webness.in via browser/mobile)       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────────────┐
│    CLOUD LAYER (Oracle Cloud ARM — 4 OCPUs, 24GB, FREE)  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Nginx       │  │ PostgreSQL16 │  │  Redis 7       │  │
│  │  (Reverse    │──│ + pgvector   │  │  (Job Queue)   │  │
│  │   Proxy+SSL) │  └──────────────┘  └───────────────┘  │
│  └──────┬───────┘                                        │
│         │ Routes to:                                     │
│  ┌──────┴───────────────────────────────────────────┐    │
│  │ :3000 Client Dashboard (app.webness.in)          │    │
│  │ :3003 Admin Dashboard (admin.webness.in)         │    │
│  │ :3001 Express API (Auth, RBAC, CRUD, SSE, WA)   │    │
│  │ :3002 BullMQ Worker (Job Processor + Dispatcher) │    │
│  └──────────────────────────┬───────────────────────┘    │
│  x86 Micro VM #1: Monitoring │ x86 Micro VM #2: Backups │
└─────────────────────────────┼────────────────────────────┘
                              │ Cloudflare Tunnel (Encrypted)
                              │ brain.webness.in → localhost:8000
                              ▼
┌──────────────────────────────────────────────────────────┐
│         LOCAL LAYER (Your GPU PC - The Brain)             │
│  ┌──────────────┐  ┌──────────────┐                      │
│  │  FastAPI      │  │  Ollama      │  No ChromaDB needed! │
│  │  (Tool Host)  │──│  (LLMs)      │  Vectors stored in   │
│  │  :8000        │  │  :11434      │  pgvector on Oracle   │
│  └──────────────┘  └──────────────┘  Cloud PostgreSQL.    │
│  ┌──────────────┐  ┌──────────────┐                      │
│  │  Playwright   │  │  ComfyUI     │  Embeddings created  │
│  │  (Scraping)   │  │  (Images)    │  locally via Ollama   │
│  └──────────────┘  │  :8188       │  (nomic-embed-text)  │
│                     └──────────────┘                      │
└──────────────────────────────────────────────────────────┘
```

### Why This Architecture?
- **Cloud Layer is always on.** Oracle Cloud Free Tier gives us 4 ARM OCPUs + 24GB RAM forever. If your PC is off, clients can still log in, see history, submit tasks (they queue)
- **Local Layer is the muscle.** All LLM inference, scraping, image generation = $0 cost
- **Cloudflare Tunnel** = outbound-only connection from your PC. No ports to open. No firewall config. Free forever
- **One Oracle VM, One Nginx** = handles all routing. Nginx routes subdomains/paths internally
- **pgvector inside PostgreSQL** = vector search + relational data in ONE database. No separate ChromaDB service. JOINs between vectors and business data.
- **Total infrastructure cost: $0/month** (Oracle Always Free + Cloudflare Free + Ollama local)
- **Existing Hostinger shared hosting** = used ONLY for the static landing page (webness.in)

---

## 2. Monorepo Folder Structure

```
webness-os/
│
├── apps/                              # Deployable applications
│   ├── api/                           # EXPRESS API (Cloud - Port 3001)
│   │   ├── src/
│   │   │   ├── index.ts               # Express app entry + SSE setup
│   │   │   ├── config/
│   │   │   │   ├── env.ts             # Environment variable validation
│   │   │   │   ├── database.ts        # Prisma client singleton
│   │   │   │   └── redis.ts           # Redis/BullMQ connection
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts            # JWT + API key verification
│   │   │   │   ├── rbac.ts            # Role-based access control guard
│   │   │   │   ├── tenant.ts          # Tenant isolation (orgId scoping)
│   │   │   │   ├── credits.ts         # Credit deduction middleware
│   │   │   │   ├── rateLimit.ts       # Per-user rate limiting
│   │   │   │   ├── auditLog.ts        # Log every action for security
│   │   │   │   └── errorHandler.ts    # Global error handler
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts     # Login, Register, OAuth, API key auth
│   │   │   │   ├── projects.routes.ts # CRUD for tasks/projects
│   │   │   │   ├── tools.routes.ts    # List/execute tools
│   │   │   │   ├── credits.routes.ts  # Balance, purchase, history
│   │   │   │   ├── stream.routes.ts   # SSE endpoint for live updates
│   │   │   │   ├── admin.routes.ts    # Admin God-Mode APIs (SUPER_ADMIN only)
│   │   │   │   ├── whatsapp.routes.ts # WhatsApp webhook + send + templates
│   │   │   │   ├── invoice.routes.ts  # Invoice CRUD + PDF generation
│   │   │   │   ├── social.routes.ts   # Social media post/schedule
│   │   │   │   └── webhook.routes.ts  # Stripe/Razorpay/WhatsApp webhooks
│   │   │   ├── services/
│   │   │   │   ├── ai-router.ts       # Manager AI — routes tasks to tools
│   │   │   │   ├── credit.service.ts  # Credit logic (deduct, check, refund)
│   │   │   │   ├── job.service.ts     # BullMQ job creation + tracking
│   │   │   │   ├── stream.service.ts  # SSE event emitter
│   │   │   │   └── payment.service.ts # Stripe/Razorpay integration
│   │   │   └── utils/
│   │   │       ├── logger.ts          # Structured logging (pino)
│   │   │       └── validators.ts      # Zod schemas for request validation
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── worker/                        # BULLMQ WORKER (Cloud - Port 3002)
│   │   ├── src/
│   │   │   ├── index.ts               # Worker entry — connects to Redis
│   │   │   ├── dispatcher.ts          # Routes jobs to Local Brain via tunnel
│   │   │   ├── processors/
│   │   │   │   ├── seo-audit.processor.ts
│   │   │   │   ├── blog-write.processor.ts
│   │   │   │   ├── research.processor.ts
│   │   │   │   ├── social-write.processor.ts
│   │   │   │   ├── lead-scrape.processor.ts
│   │   │   │   ├── whatsapp.processor.ts
│   │   │   │   ├── graphic-design.processor.ts
│   │   │   │   ├── invoice.processor.ts
│   │   │   │   └── linkedin.processor.ts
│   │   │   ├── failover/
│   │   │   │   ├── circuit-breaker.ts  # Opossum circuit breaker
│   │   │   │   └── providers.ts        # OpenRouter/DeepInfra fallbacks
│   │   │   └── health/
│   │   │       └── tunnel-monitor.ts   # Pings Local Brain every 30s
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── admin/                         # ADMIN DASHBOARD (admin.webness.in - Port 3003)
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Login.tsx           # Admin-only login (hardcoded owner email)
│   │   │   │   ├── Overview.tsx        # System health, revenue, active clients
│   │   │   │   ├── Clients.tsx         # All orgs: health scores, plans, usage
│   │   │   │   ├── ClientDetail.tsx    # Deep dive: tasks, credits, timeline
│   │   │   │   ├── Packages.tsx        # Manage plans, pricing, credit packs
│   │   │   │   ├── Payments.tsx        # Payment history, manual adjustments
│   │   │   │   ├── WhatsApp.tsx        # WhatsApp accounts, templates, logs
│   │   │   │   ├── SystemHealth.tsx    # Brain status, queue depth, Redis, PG
│   │   │   │   ├── TaskQueue.tsx       # Live job queue monitor
│   │   │   │   ├── AIBrain.tsx         # Brain chat interface (talk to Manager AI)
│   │   │   │   └── Settings.tsx        # System config, API keys, toggles
│   │   │   ├── components/
│   │   │   │   ├── ui/                 # ShadCN components
│   │   │   │   ├── charts/             # Tremor charts (revenue, health, usage)
│   │   │   │   └── tables/             # TanStack Table components
│   │   │   └── hooks/
│   │   │       ├── useAdminSSE.ts      # SSE for live system status
│   │   │       └── useAdminAuth.ts     # Admin-only auth guard
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── dashboard/                     # CLIENT DASHBOARD (app.webness.in - Port 3000)
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── pages/
│       │   │   ├── Login.tsx
│       │   │   ├── Onboarding.tsx      # The "personality" onboarding wizard
│       │   │   ├── Dashboard.tsx       # Main command center
│       │   │   ├── Tools.tsx           # Tool catalog
│       │   │   ├── Projects.tsx        # Task history + results
│       │   │   ├── LiveView.tsx        # SSE streaming "Glass Factory"
│       │   │   ├── Credits.tsx         # Balance, purchase, usage charts
│       │   │   ├── Invoices.tsx        # Client's invoices + receipts
│       │   │   ├── WhatsApp.tsx        # Client's WhatsApp config + messages
│       │   │   ├── SocialMedia.tsx     # Social media management hub
│       │   │   └── Settings.tsx        # Brand voice, API keys, integrations
│       │   ├── components/
│       │   │   ├── ui/                 # ShadCN components
│       │   │   ├── onboarding/
│       │   │   │   ├── ShapeQuestion.tsx   # "What's your favorite shape?"
│       │   │   │   ├── FloatingShapes.tsx  # Animated shape illustrations
│       │   │   │   └── BusinessProfile.tsx # Industry, goals, brand voice
│       │   │   ├── stream/
│       │   │   │   ├── AgentTerminal.tsx   # Live terminal showing AI thinking
│       │   │   │   ├── StepProgress.tsx    # Step-by-step progress cards
│       │   │   │   └── TokenStream.tsx     # Typewriter effect for text
│       │   │   ├── charts/
│       │   │   │   ├── CreditGauge.tsx     # Animated credit gauge
│       │   │   │   ├── UsageChart.tsx      # Daily/weekly burn rate
│       │   │   │   └── SEOScoreCard.tsx    # Audit score visualization
│       │   │   └── common/
│       │   │       ├── CreditBadge.tsx     # Always-visible credit balance
│       │   │       ├── RetentionPopup.tsx  # Smart re-engagement popup
│       │   │       └── AchievementToast.tsx # Gamification notifications
│       │   ├── hooks/
│       │   │   ├── useSSE.ts           # Server-Sent Events hook
│       │   │   ├── useCredits.ts       # Credit balance + transactions
│       │   │   └── useAuth.ts          # Authentication state
│       │   ├── services/
│       │   │   ├── api.ts              # Axios instance + interceptors
│       │   │   └── sse.ts              # EventSource manager
│       │   └── styles/
│       │       └── globals.css         # Tailwind + custom animations
│       ├── package.json
│       └── vite.config.ts
│
├── tools/                             # AI TOOL AGENTS (Local - Python)
│   ├── _base/                         # Shared tool interface
│   │   ├── __init__.py
│   │   ├── tool_interface.py          # Abstract base class for ALL tools
│   │   ├── models.py                  # Pydantic models (ToolInput, ToolOutput)
│   │   ├── llm_client.py             # Unified Ollama client wrapper
│   │   ├── critic.py                  # Universal Critic Agent (quality gate)
│   │   └── streaming.py              # SSE streaming helper for tool outputs
│   │
│   ├── seo_auditor/                   # TOOL 1: SEO Audit (Lead Magnet)
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI router for this tool
│   │   ├── crawler.py                 # Playwright-based page crawler
│   │   ├── analyzers/
│   │   │   ├── technical.py           # Load speed, mobile, schema, meta
│   │   │   ├── content.py             # Word count, heading structure, readability
│   │   │   ├── links.py               # Internal/external link analysis
│   │   │   └── competitor.py          # SERP competitor comparison
│   │   ├── scorer.py                  # Weighted score calculator (0-100)
│   │   └── report_generator.py        # LLM-powered recommendations
│   │
│   ├── researcher/                    # TOOL 2: Deep Research (Foundation)
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── search.py                  # Serper.dev Google search
│   │   ├── scraper.py                 # Playwright content extraction
│   │   ├── analyzer.py                # LLM gap analysis (DeepSeek-R1)
│   │   └── synthesizer.py            # Combine sources into research brief
│   │
│   ├── blog_writer/                   # TOOL 3: Blog Generation (Revenue)
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── pipeline/
│   │   │   ├── outline.py             # Structure planner (uses Researcher)
│   │   │   ├── drafter.py             # Creative writer (Llama-3)
│   │   │   ├── polisher.py            # Editor/Critic (DeepSeek-R1)
│   │   │   ├── seo_optimizer.py       # Keyword injection, schema markup
│   │   │   ├── humanizer.py           # Make AI content undetectable
│   │   │   └── image_generator.py     # ComfyUI / Stable Diffusion
│   │   ├── publishers/
│   │   │   ├── wordpress.py           # WP REST API publisher
│   │   │   ├── blogger.py             # Blogger API publisher
│   │   │   └── webflow.py             # Webflow CMS publisher
│   │   └── brand_voice.py            # RAG-powered brand voice matching
│   │
│   ├── social_writer/                 # TOOL 4: Social Media Content
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── repurposer.py             # Blog → LinkedIn/Twitter/IG
│   │   ├── hook_generator.py          # Viral hook patterns
│   │   └── carousel_builder.py        # LinkedIn carousel text
│   │
│   ├── lead_scraper/                  # TOOL 5: Lead Generation
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── google_maps.py            # Business discovery
│   │   ├── enricher.py               # Website analysis + email finder
│   │   └── email_writer.py           # Personalized outreach drafts
│   │
│   ├── design_auditor/               # TOOL 6: Visual Design Audit
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── screenshot.py             # Playwright screenshot capture
│   │   └── vision_analyzer.py        # LLaVA visual analysis
│   │
│   ├── whatsapp/                     # TOOL 7: WhatsApp Business
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI router for WhatsApp
│   │   ├── webhook_handler.py        # Incoming message webhook
│   │   ├── template_sender.py        # Send template messages
│   │   ├── auto_responder.py         # AI-powered auto-reply
│   │   └── media_handler.py          # Image/doc send/receive
│   │
│   ├── graphic_designer/             # TOOL 8: AI Graphic Design
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── logo_generator.py         # ComfyUI logo generation
│   │   ├── social_graphics.py        # Instagram/FB post graphics
│   │   └── banner_creator.py         # Website/ad banners
│   │
│   ├── linkedin_manager/             # TOOL 9: LinkedIn Automation
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── post_scheduler.py         # Schedule LinkedIn posts
│   │   ├── engagement_tracker.py     # Track likes/comments/reach
│   │   └── profile_optimizer.py      # Profile improvement suggestions
│   │
│   ├── invoice_generator/            # TOOL 10: Invoice & Receipt
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── pdf_builder.py            # Generate professional PDF invoices
│   │   ├── templates/                # Invoice templates (HTML→PDF)
│   │   └── receipt_builder.py        # Payment receipts
│   │
│   ├── accounting/                   # TOOL 11: Basic Accounting
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── expense_tracker.py        # Track expenses per client
│   │   ├── revenue_tracker.py        # Track income per client
│   │   └── pnl_report.py            # Profit & Loss reports
│   │
│   ├── server.py                     # MAIN FastAPI server (Port 8000)
│   │                                  # Mounts all tool routers
│   ├── requirements.txt
│   └── pyproject.toml
│
├── packages/                          # Shared code packages
│   ├── db/
│   │   ├── prisma/
│   │   │   └── schema.prisma          # THE database schema
│   │   ├── migrations/
│   │   └── package.json
│   ├── shared/
│   │   ├── types.ts                   # Shared TypeScript types
│   │   ├── constants.ts               # Shared constants (step names, statuses)
│   │   └── package.json
│   └── ai-router/
│       ├── router.ts                  # Manager AI decision logic
│       ├── prompts.ts                 # System prompts for the Manager
│       └── package.json
│
├── infra/                             # Infrastructure configs
│   ├── nginx/
│   │   └── webness.conf               # Nginx reverse proxy config
│   ├── cloudflared/
│   │   ├── config.yml                 # Tunnel configuration
│   │   └── setup.md                   # Setup instructions
│   ├── docker/
│   │   ├── docker-compose.yml         # Local dev environment
│   │   └── Dockerfile.tools           # Python tools container
│   ├── scripts/
│   │   ├── deploy-vps.sh             # VPS deployment script
│   │   ├── backup-db.sh              # Database backup cron
│   │   ├── health-check.sh           # System health monitor
│   │   └── setup-vps.sh             # Initial VPS setup (Postgres, Redis, Node, Nginx)
│   └── pm2/
│       └── ecosystem.config.js        # PM2 process manager config
│
├── docs/                              # Documentation
│   ├── COMPETITOR_ANALYSIS.md
│   ├── TECHNICAL_BLUEPRINT.md         # THIS FILE
│   ├── ROADMAP.md
│   ├── SYSTEM_BRAIN.md
│   ├── USER_FLOW.md
│   ├── BLOG_BUILDER_ANALYSIS.md
│   └── API.md                         # API documentation
│
├── .env.example                       # Environment variable template
├── .gitignore
├── pnpm-workspace.yaml                # pnpm workspace config
├── package.json                       # Root package.json
└── README.md
```

---

## 3. Database Schema (PostgreSQL via Prisma)

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ORGANIZATIONS & USERS ====================

model Organization {
  id            String    @id @default(uuid())
  name          String
  slug          String    @unique
  plan          Plan      @default(FREE)
  industry      String?   // "interior_design", "clinic", "restaurant", etc.
  brandVoice    Json?     // Stored brand voice profile
  onboarding    Json?     // Onboarding answers (favorite shape, goals, etc.)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  users         User[]
  creditWallet  CreditWallet?
  tasks         Task[]
  assets        Asset[]
}

enum Plan {
  FREE        // Freemium demo: limited tools, limited credits
  STARTER     // $49/mo: 500 credits, basic tools
  PRO         // $149/mo: 2000 credits, all tools
  ENTERPRISE  // $399/mo: 10000 credits, white-label, API
  SAASS       // Custom: outcome-based pricing, managed service
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String?   // Null if OAuth login
  name          String
  avatar        String?
  role          UserRole  @default(CLIENT)
  orgId         String
  favoriteShape String?   // The fun onboarding question!
  lastActiveAt  DateTime?
  createdAt     DateTime  @default(now())

  org           Organization @relation(fields: [orgId], references: [id])
  tasks         Task[]
  creditTxns    CreditTransaction[]
  sessions      Session[]
}

enum UserRole {
  SUPER_ADMIN    // You (Webness owner) — God mode
  AGENCY_ADMIN   // Future: agency partners who resell
  CLIENT_ADMIN   // Client's admin (manages their org)
  CLIENT_USER    // Client team member (uses tools)
  CLIENT_VIEWER  // Read-only access
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
}

// ==================== CREDITS & BILLING ====================

model CreditWallet {
  id        String   @id @default(uuid())
  orgId     String   @unique
  balance   Int      @default(0) // Current credit balance
  updatedAt DateTime @updatedAt

  org       Organization @relation(fields: [orgId], references: [id])
  transactions CreditTransaction[]
}

model CreditTransaction {
  id        String    @id @default(uuid())
  walletId  String
  userId    String?   // Who triggered this (null for system actions)
  amount    Int       // Positive = purchase/bonus, Negative = usage
  type      CreditTxType
  taskId    String?   // If usage, which task consumed it
  metadata  Json?     // Payment ID, promo code, etc.
  createdAt DateTime  @default(now())

  wallet    CreditWallet @relation(fields: [walletId], references: [id])
  user      User?        @relation(fields: [userId], references: [id])
  task      Task?        @relation(fields: [taskId], references: [id])
}

enum CreditTxType {
  PURCHASE    // Stripe/Razorpay payment
  USAGE       // Tool execution cost
  BONUS       // Promotional credits
  REFUND      // Failed task refund
  SUBSCRIPTION // Monthly plan credit allocation
}

// ==================== TOOLS & AGENTS ====================

model Tool {
  id              String    @id @default(uuid())
  slug            String    @unique // "seo_auditor", "blog_writer", etc.
  name            String    // "SEO Auditor"
  description     String
  category        ToolCategory
  creditCost      Int       // Base credit cost to run
  inputSchema     Json      // JSON Schema for valid inputs
  outputSchema    Json      // JSON Schema for expected outputs
  estimatedSeconds Int      @default(60) // Estimated execution time
  isActive        Boolean   @default(true)
  isFree          Boolean   @default(false) // Lead magnet tools
  version         String    @default("1.0.0")
  icon            String?   // Emoji or icon identifier
  createdAt       DateTime  @default(now())

  tasks           Task[]
}

enum ToolCategory {
  SEO
  CONTENT
  SOCIAL
  OUTREACH
  DESIGN
  RESEARCH
  VOICE
  ADMIN
  WHATSAPP
  INVOICING
  ACCOUNTING
  LINKEDIN
}

model Agent {
  id        String    @id @default(uuid())
  name      String    // "Reasoner", "Writer", "Critic", "Researcher"
  role      AgentRole
  model     String    // "deepseek-r1:8b", "llama3.1:8b", "gpt-4o-mini"
  provider  String    // "ollama", "openai", "deepinfra"
  config    Json?     // Temperature, max_tokens, system prompt
  isActive  Boolean   @default(true)

  taskSteps TaskStep[]
}

enum AgentRole {
  MANAGER     // Orchestrates, delegates, decides
  REASONER    // Deep thinking (DeepSeek-R1)
  WRITER      // Content generation (Llama-3)
  CRITIC      // Quality checking
  RESEARCHER  // Web search + analysis
  VISION      // Image/design analysis (LLaVA)
  VOICE       // Speech processing (Whisper)
}

// ==================== TASKS & EXECUTION ====================

model Task {
  id            String    @id @default(uuid())
  orgId         String
  userId        String    // Who submitted
  toolId        String    // Which tool was used
  status        TaskStatus @default(QUEUED)
  priority      Int       @default(5) // 1=highest, 10=lowest
  inputData     Json      // User's input (topic, URL, settings)
  outputData    Json?     // Final result
  creditCost    Int       // Actual credits deducted
  errorMessage  String?
  retryCount    Int       @default(0)
  maxRetries    Int       @default(3)
  queuedAt      DateTime  @default(now())
  startedAt     DateTime?
  completedAt   DateTime?

  org           Organization @relation(fields: [orgId], references: [id])
  user          User         @relation(fields: [userId], references: [id])
  tool          Tool         @relation(fields: [toolId], references: [id])
  steps         TaskStep[]
  creditTxns    CreditTransaction[]
}

enum TaskStatus {
  QUEUED        // In BullMQ waiting
  DISPATCHED    // Sent to Local Brain
  PROCESSING    // Agent is working
  REVIEWING     // Critic is checking
  COMPLETED     // Done, results ready
  FAILED        // Error (retries exhausted)
  CANCELLED     // User cancelled
  WAITING_GPU   // Local PC offline, queued for retry
}

model TaskStep {
  id            String    @id @default(uuid())
  taskId        String
  agentId       String?   // Which agent executed this step
  stepNumber    Int       // Order of execution (1, 2, 3...)
  action        String    // "RESEARCH", "DRAFT", "REVIEW", "PUBLISH", etc.
  status        StepStatus @default(PENDING)
  inputData     Json?     // What was passed to this step
  outputData    Json?     // What this step produced
  tokensUsed    Int?      // LLM tokens consumed
  latencyMs     Int?      // How long this step took
  modelUsed     String?   // Actual model used (for failover tracking)
  providerUsed  String?   // "ollama", "openai", "deepinfra"
  errorMessage  String?
  startedAt     DateTime?
  completedAt   DateTime?

  task          Task      @relation(fields: [taskId], references: [id])
  agent         Agent?    @relation(fields: [agentId], references: [id])
}

enum StepStatus {
  PENDING
  RUNNING
  SUCCESS
  FAILED
  SKIPPED
  RETRYING
}

// ==================== ASSETS & CONTENT ====================

model Asset {
  id        String    @id @default(uuid())
  orgId     String
  type      AssetType
  name      String
  url       String?   // Cloudflare R2 URL
  content   String?   // Text content (for brand voice docs)
  metadata  Json?
  createdAt DateTime  @default(now())

  org       Organization @relation(fields: [orgId], references: [id])
}

enum AssetType {
  LOGO
  BRAND_GUIDE
  BLOG_POST
  SOCIAL_POST
  IMAGE
  DOCUMENT
  VOICE_SAMPLE
}

// ==================== VECTOR EMBEDDINGS (pgvector) ====================
// Replaces ChromaDB — vectors live inside PostgreSQL via pgvector extension
// Enable with: CREATE EXTENSION vector;

model Embedding {
  id          String   @id @default(uuid())
  orgId       String
  contentType String   // "blog_draft", "brand_voice", "correction", "research"
  content     String   // The actual text chunk
  embedding   Unsupported("vector(768)") // nomic-embed-text = 768 dimensions
  metadata    Json?    // { "source_task_id": "...", "correction_type": "tone_wrong" }
  score       Float?   // Performance score (for retrieving best examples)
  createdAt   DateTime @default(now())

  org         Organization @relation(fields: [orgId], references: [id])

  @@index([orgId, contentType])
}

// ==================== WHATSAPP INTEGRATION ====================

model WhatsAppAccount {
  id              String    @id @default(uuid())
  orgId           String
  wabaId          String    @unique // WhatsApp Business Account ID
  phoneNumberId   String    @unique // Meta phone number ID
  phoneNumber     String              // Display phone number
  displayName     String
  accessToken     String              // Encrypted Meta access token
  webhookSecret   String              // Webhook verification token
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  org             Organization @relation(fields: [orgId], references: [id])
  messages        WhatsAppMessage[]
  templates       WhatsAppTemplate[]
}

model WhatsAppMessage {
  id              String    @id @default(uuid())
  accountId       String
  direction       MessageDirection // INBOUND or OUTBOUND
  from            String    // Sender phone
  to              String    // Recipient phone
  type            String    // text, image, template, interactive
  content         Json      // Message body/payload
  status          String    @default("sent") // sent, delivered, read, failed
  waMessageId     String?   @unique // Meta's message ID
  createdAt       DateTime  @default(now())

  account         WhatsAppAccount @relation(fields: [accountId], references: [id])

  @@index([accountId, createdAt])
}

enum MessageDirection {
  INBOUND
  OUTBOUND
}

model WhatsAppTemplate {
  id              String    @id @default(uuid())
  accountId       String
  name            String
  language        String    @default("en")
  category        String    // MARKETING, UTILITY, AUTHENTICATION
  status          String    @default("PENDING") // APPROVED, REJECTED, PENDING
  components      Json      // Header, body, footer, buttons
  createdAt       DateTime  @default(now())

  account         WhatsAppAccount @relation(fields: [accountId], references: [id])
}

// ==================== INVOICES & ACCOUNTING ====================

model Invoice {
  id              String    @id @default(uuid())
  orgId           String
  invoiceNumber   String    @unique // INV-2026-0001
  clientName      String
  clientEmail     String?
  items           Json      // Array of { description, quantity, rate, amount }
  subtotal        Float
  tax             Float     @default(0)
  total           Float
  currency        String    @default("USD")
  status          InvoiceStatus @default(DRAFT)
  dueDate         DateTime?
  paidAt          DateTime?
  pdfUrl          String?   // R2 URL to generated PDF
  notes           String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  org             Organization @relation(fields: [orgId], references: [id])
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
  CANCELLED
}

model Expense {
  id              String    @id @default(uuid())
  orgId           String
  category        String    // hosting, tools, marketing, salary, misc
  description     String
  amount          Float
  currency        String    @default("USD")
  date            DateTime
  receiptUrl      String?   // R2 URL to receipt image/PDF
  createdAt       DateTime  @default(now())

  org             Organization @relation(fields: [orgId], references: [id])
}

// ==================== SOCIAL MEDIA ====================

model SocialAccount {
  id              String    @id @default(uuid())
  orgId           String
  platform        SocialPlatform
  accountId       String    // Platform-specific account ID
  accountName     String
  accessToken     String    // Encrypted
  refreshToken    String?   // Encrypted
  tokenExpiresAt  DateTime?
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())

  org             Organization @relation(fields: [orgId], references: [id])
  posts           SocialPost[]
}

enum SocialPlatform {
  INSTAGRAM
  FACEBOOK
  LINKEDIN
  TWITTER
}

model SocialPost {
  id              String    @id @default(uuid())
  accountId       String
  content         String
  mediaUrls       String[]  // Array of image/video URLs
  scheduledAt     DateTime?
  publishedAt     DateTime?
  status          PostStatus @default(DRAFT)
  platformPostId  String?   // ID from the platform after publishing
  analytics       Json?     // likes, shares, comments, reach
  createdAt       DateTime  @default(now())

  account         SocialAccount @relation(fields: [accountId], references: [id])
}

enum PostStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  FAILED
}

// ==================== ADMIN AUDIT LOG ====================

model AuditLog {
  id          String   @id @default(uuid())
  actorId     String?  // User ID or "SYSTEM" or "AI_BRAIN"
  actorType   String   // "user", "admin", "ai_brain", "system"
  action      String   // "create_client", "adjust_credits", "manual_payment", etc.
  resource    String   // "organization", "invoice", "task", etc.
  resourceId  String?
  metadata    Json?    // Additional context
  ipAddress   String?
  createdAt   DateTime @default(now())

  @@index([actorId, createdAt])
  @@index([resource, resourceId])
}

// ==================== API KEYS (Client Access) ====================

model ApiKey {
  id          String   @id @default(uuid())
  orgId       String
  keyHash     String   @unique // bcrypt hash of the key (never store plaintext)
  keyPrefix   String   // First 8 chars for identification: "wn_live_ab12..."
  name        String   // "Production Key", "Test Key"
  permissions String[] // ["tools.execute", "tasks.read", "credits.read"]
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  org         Organization @relation(fields: [orgId], references: [id])

  @@index([orgId])
}

// ==================== SHADOW MANAGER (Proactive Monitoring) ====================

model ClientHealthScore {
  id              String   @id @default(uuid())
  orgId           String
  overallScore    Int      // 0-100 composite score
  uptimeScore     Int?
  speedScore      Int?
  seoScore        Int?
  contentScore    Int?
  reviewScore     Int?
  socialScore     Int?
  leadScore       Int?
  alertTriggered  Boolean  @default(false)
  alertMessage    String?
  measuredAt      DateTime @default(now())

  org             Organization @relation(fields: [orgId], references: [id])

  @@index([orgId, measuredAt])
}
```

---

## 4. The Manager AI (Router + Orchestrator + Critic)

### How the Manager Decides Which Tool to Use

```
User Input: "Audit my website and write a blog post to fix the issues"
          │
          ▼
┌─────────────────────────────┐
│  STEP 1: ROUTER (Classifier)│
│  Model: Qwen2.5-7B (local)  │
│  or gpt-4o-mini (fallback)   │
│                               │
│  Input: User's request        │
│  Output: Structured JSON      │
│  {                            │
│    "tasks": [                 │
│      {                        │
│        "tool": "seo_auditor", │
│        "priority": 1,         │
│        "input": {"url":"..."} │
│      },                       │
│      {                        │
│        "tool": "blog_writer", │
│        "priority": 2,         │
│        "depends_on": [0],     │
│        "input": {             │
│          "use_audit_results": │
│            true               │
│        }                      │
│      }                        │
│    ]                          │
│  }                            │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  STEP 2: ORCHESTRATOR        │
│  For each task in order:     │
│  1. Check dependencies       │
│  2. Deduct credits           │
│  3. Dispatch to BullMQ       │
│  4. Stream progress via SSE  │
│  5. Collect results          │
│  6. Pass to next task        │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  STEP 3: CRITIC (Quality)    │
│  Model: DeepSeek-R1 (local)  │
│                               │
│  Checks:                      │
│  - Word count >= minimum?     │
│  - SEO score >= threshold?    │
│  - Brand voice match?         │
│  - Factual accuracy?          │
│  - No banned claims?          │
│                               │
│  If FAIL → Retry (max 3)     │
│  If PASS → Mark COMPLETED    │
└─────────────────────────────┘
```

### The Self-Correction Loop

```
Writer Agent produces output
          │
          ▼
Critic Agent evaluates:
  ├── Score >= 80%  →  APPROVE  →  Return to user
  │
  └── Score < 80%   →  REJECT   →  Send feedback to Writer
                                          │
                                          ▼
                                    Writer retries with
                                    Critic's feedback
                                    (max 3 attempts)
                                          │
                                          ▼
                                    Critic re-evaluates
                                          │
                                    (Loop until pass or max retries)
```

---

## 5. The Job Queue (BullMQ + Redis)

### Job Lifecycle

```
User clicks "Run" → API creates job → BullMQ QUEUED
     │
     ▼
Worker picks up job → Sends to Local Brain via Tunnel → DISPATCHED
     │
     ├── Local Brain ONLINE:
     │      │
     │      ▼
     │   Tool executes → Streams progress → PROCESSING
     │      │
     │      ▼
     │   Critic reviews → REVIEWING
     │      │
     │      ▼
     │   Result saved → COMPLETED ✅
     │
     └── Local Brain OFFLINE:
            │
            ▼
         Circuit breaker opens → WAITING_GPU
            │
            ├── Check: Is failover enabled?
            │      │
            │      ├── YES → Route to OpenRouter/DeepInfra → PROCESSING (cloud)
            │      │
            │      └── NO → Job stays in WAITING_GPU
            │               Retry every 5 minutes
            │               Auto-resume when tunnel reconnects
            │
            └── After 24 hours → Mark FAILED + Refund credits
```

### BullMQ Configuration

```typescript
// Key settings for reliability
const queueConfig = {
  connection: {
    host: process.env.REDIS_HOST,
    port: 6379,
    maxRetriesPerRequest: null, // Worker: retry Redis forever
  },
  defaultJobOptions: {
    removeOnComplete: { age: 7 * 24 * 3600 }, // Keep 7 days
    removeOnFail: { age: 30 * 24 * 3600 },    // Keep 30 days
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 30000, // Start at 30s, then 60s, 120s
    },
  },
};
```

---

## 6. Streaming Architecture (SSE - Server-Sent Events)

### Why SSE Over WebSockets?
- SSE is simpler (one-way server→client, which is what we need)
- Works through Nginx reverse proxy with minimal config
- Auto-reconnects on network drop
- HTTP/2 removes the 6-connection browser limit

### SSE Event Types

```
event: task_queued
data: {"taskId":"abc","position":3}

event: step_start
data: {"taskId":"abc","step":"RESEARCH","stepNumber":1,"agent":"Researcher"}

event: token
data: {"taskId":"abc","text":"The website's meta tags are..."}

event: step_progress
data: {"taskId":"abc","step":"RESEARCH","percent":45}

event: step_complete
data: {"taskId":"abc","step":"RESEARCH","stepNumber":1,"latencyMs":3200}

event: critic_feedback
data: {"taskId":"abc","score":72,"feedback":"Needs more keyword density"}

event: task_complete
data: {"taskId":"abc","status":"COMPLETED","creditCost":15}

event: task_error
data: {"taskId":"abc","error":"Local Brain offline. Queued for retry."}

event: system_status
data: {"localBrain":"online","queueDepth":4,"activeJobs":1}
```

### Nginx Config for SSE (Critical)

```nginx
location /api/stream {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_buffering off;            # CRITICAL — prevents SSE batching
    proxy_cache off;
    proxy_read_timeout 86400s;      # Keep connection open 24 hours
    add_header X-Accel-Buffering no; # Double-ensure no buffering
}
```

### Client-Side SSE (React)

```typescript
// useSSE.ts hook pattern
const useSSE = (taskId: string) => {
  const [steps, setSteps] = useState<StepUpdate[]>([]);
  const [tokens, setTokens] = useState<string>('');

  useEffect(() => {
    const source = new EventSource(`/api/stream?taskId=${taskId}`);

    source.addEventListener('step_start', (e) => {
      const data = JSON.parse(e.data);
      setSteps(prev => [...prev, { ...data, status: 'running' }]);
    });

    source.addEventListener('token', (e) => {
      const data = JSON.parse(e.data);
      setTokens(prev => prev + data.text); // Typewriter effect
    });

    source.addEventListener('step_complete', (e) => {
      const data = JSON.parse(e.data);
      setSteps(prev => prev.map(s =>
        s.stepNumber === data.stepNumber ? { ...s, status: 'success' } : s
      ));
    });

    return () => source.close();
  }, [taskId]);

  return { steps, tokens };
};
```

---

## 7. Failover Protocol (The "Never Die" System)

### AI Provider Chain (Ordered by preference)

```
Priority 1: Local Ollama (via Cloudflare Tunnel)
  → Cost: $0/request
  → Latency: 2-10s depending on model
  → Quality: High (DeepSeek-R1, Llama-3.1-8B)

Priority 2: DeepInfra API
  → Cost: ~$0.06/1M input tokens (very cheap)
  → Latency: 1-3s
  → Quality: High (same models, cloud-hosted)

Priority 3: OpenRouter API
  → Cost: Variable (~$0.10-1.00/1M tokens)
  → Latency: 1-5s
  → Quality: High (routes to best available)

Priority 4: OpenAI API (Emergency only)
  → Cost: ~$2.50/1M tokens (expensive)
  → Latency: 1-3s
  → Quality: Highest (GPT-4o)
```

### Circuit Breaker Config (opossum)

```typescript
const circuitOptions = {
  timeout: 120000,             // 2 min timeout (LLMs are slow)
  errorThresholdPercentage: 50,// Open after 50% failures
  resetTimeout: 30000,         // Try local again after 30s
  rollingCountTimeout: 60000,  // Window: 1 minute
  rollingCountBuckets: 6,      // 6 × 10s buckets
};
```

---

## 8. The Tool Interface Contract

Every tool MUST implement this interface. This is what makes tools "hot-swappable" by the Manager.

### Python Base Class

```python
# tools/_base/tool_interface.py
from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import AsyncGenerator, Any

class ToolInput(BaseModel):
    """Base input — all tools extend this"""
    task_id: str
    org_id: str
    user_id: str

class ToolOutput(BaseModel):
    """Base output — all tools return this"""
    task_id: str
    success: bool
    data: Any           # Tool-specific result
    credits_used: int
    steps_log: list     # Detailed step-by-step log

class BaseTool(ABC):
    """Every tool agent must extend this"""

    @property
    @abstractmethod
    def slug(self) -> str:
        """Unique identifier: 'seo_auditor', 'blog_writer'"""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """Display name: 'SEO Auditor'"""
        pass

    @property
    @abstractmethod
    def credit_cost(self) -> int:
        """Base credit cost"""
        pass

    @property
    @abstractmethod
    def input_schema(self) -> dict:
        """JSON Schema for valid inputs"""
        pass

    @abstractmethod
    async def execute(self, input_data: ToolInput) -> ToolOutput:
        """Main execution — MUST be implemented by every tool"""
        pass

    @abstractmethod
    async def stream(self, input_data: ToolInput) -> AsyncGenerator[dict, None]:
        """Streaming execution — yields SSE events"""
        pass

    async def health(self) -> dict:
        """Health check — override if tool has dependencies"""
        return {"status": "healthy", "tool": self.slug}
```

### FastAPI Endpoints (Auto-generated per tool)

```
POST /tools/{slug}/execute    → Full execution, returns final result
POST /tools/{slug}/stream     → Streaming execution, returns SSE events
GET  /tools/{slug}/health     → Health check
GET  /tools/{slug}/schema     → Returns input/output JSON schemas
```

---

## 9. Security Architecture

### Authentication Flow
1. **Registration:** Email + Password → bcrypt hash → JWT issued
2. **Login:** Email + Password → verify hash → JWT (15min access + 7day refresh)
3. **OAuth (future):** Google OAuth → link to org
4. **API Keys (future):** For programmatic access, separate from JWT

### API Key Authentication (Client Programmatic Access)
```
POST /api/auth/api-key
→ Generate key: returns wn_live_xxxxxxxxxxxx (show ONCE)
→ Store bcrypt hash in ApiKey model
→ Client uses: Authorization: Bearer wn_live_xxxxxxxxxxxx
→ On each request: bcrypt.compare(key, storedHash)
→ Token/credit usage tracked and visible on client dashboard
```

### AI Brain Access (Internal)
```
X-AI-Brain-Key: {AI_BRAIN_KEY}  // Same admin API, authenticated as AI
X-Webness-Key: {shared_secret}  // Between VPS ↔ Local Brain
Authorization: Bearer {jwt}     // Between Client ↔ API
```

### Domain Routing
```
app.webness.in    → Client Dashboard (:3000)
admin.webness.in  → Admin Dashboard (:3003) — IP-restricted + SUPER_ADMIN only
api.webness.in    → Express API (:3001)
brain.webness.in  → Cloudflare Tunnel → localhost:8000
webness.in        → Hostinger (static landing page)
```

### The Local Brain Security
- Cloudflare Tunnel = encrypted, outbound-only (no open ports)
- `X-Webness-Key` header required on every request from VPS to Local
- IP allowlist: Only accept requests from Cloudflare's IP ranges
- Rate limiting on the FastAPI server

---

## 10. Free Services Stack (Zero-Cost Infrastructure)

| Service | What We Use It For | Free Tier Limits |
|---|---|---|
| **Cloudflare Tunnel** | Connect Local Brain to VPS | Unlimited, forever |
| **Cloudflare R2** | Store images, PDFs, exports | 10GB, 1M writes/mo |
| **Cloudflare Pages** | Host React dashboard (alternative) | Unlimited bandwidth |
| **Serper.dev** | Google SERP data for SEO tools | 2,500 searches (one-time) |
| **Resend** | Transactional emails | 3,000 emails/mo |
| **Upstash Redis** | BullMQ queue (if VPS Redis insufficient) | 10K commands/day |
| **Let's Encrypt** | SSL certificates | Free forever |
| **CloudPanel** | VPS management (Nginx, SSL, domains) | Free forever |
| **Oracle Cloud ARM** | Cloud server (4 OCPUs, 24GB RAM) | Free forever (Always Free tier) |
| **Oracle Object Storage** | Image/file backup storage | 20GB free |
| **Ollama** | Local LLM inference | Free forever |
| **pgvector** | Vector embeddings (inside PostgreSQL) | Free (PostgreSQL extension) |
| **ComfyUI** | Local image generation | Free forever |
| **GitHub Actions** | CI/CD + scheduled cron | 2,000 min/mo |
| **BetterStack** | Uptime monitoring | 50 monitors free |

---

## 11. Deployment Configuration

### PM2 Ecosystem (Cloud VPS)

```javascript
// infra/pm2/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'webness-api',
      cwd: './apps/api',
      script: 'dist/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'webness-worker',
      cwd: './apps/worker',
      script: 'dist/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
    },
  ],
};
```

### Cloudflare Tunnel Config (Local PC)

```yaml
# infra/cloudflared/config.yml
tunnel: webness-brain
credentials-file: /home/user/.cloudflared/tunnel-credentials.json

ingress:
  - hostname: brain.webness.in
    service: http://localhost:8000
  - hostname: ollama.webness.in
    service: http://localhost:11434
  - service: http_status:404
```

---

## 12. Multi-Model Hydra Pipeline (AI Brain Architecture)

### Pipeline Overview
```
Request → [Router] → [Planner] → [Executor] → [Critic] ←→ (Retry Loop) → [Polisher] → [Self-Education]
          Gemma3:1B   Qwen3:8B   varies       DeepSeek-R1:8B            Qwen3:8B     pgvector
          ~0.3s       ~3s        ~5-15s       ~3-5s                     ~3s          background
```

### Model Roster (RTX 3060 8GB VRAM — ONE 7B/8B model at a time)
| Model | Role | Size | Ollama Command |
|---|---|---|---|
| Gemma 3 (1B) | Router/Classifier | 815MB | `ollama pull gemma3:1b` |
| Qwen 3 (8B) | Planner + Polisher | 4.9GB | `ollama pull qwen3:8b` |
| DeepSeek-R1 (8B) | Critic + Reasoning | 4.7GB | `ollama pull deepseek-r1:8b` |
| Gemma 3 (4B) | Fast Executor | 3.3GB | `ollama pull gemma3` |
| Qwen 2.5 Coder (7B) | Code Executor | 4.7GB | `ollama pull qwen2.5-coder:7b` |
| Llama 3.2 (3B) | Backup Executor | 2.0GB | `ollama pull llama3.2` |
| nomic-embed-text | Embeddings (always on) | 274MB | `ollama pull nomic-embed-text` |

### Failover Chain
```
Local Ollama → Grok API (free) → OpenAI API (free credits) → DeepInfra → OpenRouter
```

### MCP Servers Configuration
| MCP Server | Purpose | Phase |
|---|---|---|
| Filesystem | AI reads/writes project files | Phase 0 |
| PostgreSQL | AI queries database directly | Phase 0 |
| GitHub | Code management, deployments | Phase 0 |
| Brave Search | Web search for SEO tools | Phase 1 |
| Puppeteer/Playwright | Web scraping for SEO data | Phase 1 |
| Memory | Persistent memory for AI agents | Phase 1 |
| Fetch | HTTP requests to external APIs | Phase 1 |
| Google Search Console | SEO data access | Phase 1 |
| Cloudflare | Tunnel management, R2 storage | Phase 2 |
| Slack/Discord | Notification integrations | Phase 4 |

### Oracle Cloud Free Resources Used
| Resource | Purpose |
|---|---|
| ARM VM (4 OCPU, 24GB) | Main server: PostgreSQL, Redis, Node.js, Nginx |
| Object Storage (20GB) | Database backups, file uploads |
| Email Delivery (3K/mo) | Supplement Resend for transactional emails |
| Monitoring (500M pts) | APM and alerting |
| Vault (20 keys) | Secure secret storage |

### Oracle Autonomous DB — REJECTED
Researched Oracle AI Database 26ai (AI Vector Search, Select AI, ONNX embedding import).
**Rejected because:** Prisma has no Oracle adapter, 20GB limit, 30 sessions max, 3-6 HTTP users, no backups, auto-stops at 7 days idle.
**Decision:** Stay with self-hosted PostgreSQL 16 + pgvector on Oracle ARM VM.

---

*This blueprint is the single source of truth for all technical decisions. Every line of code must align with this document. Update it as architecture evolves.*
