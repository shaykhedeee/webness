# WEBNESS OS: System Brain (Persistent Memory)
**Purpose:** This file is the AI coder's "conscience." Read this BEFORE every session. Update it AFTER every task.

---

## Current State
- **Date:** February 10, 2026
- **Phase:** 0 (Nervous System — ACTIVE DEVELOPMENT)
- **Status:** Monorepo scaffolded (all 4 apps compile clean, 0 TS errors). Prisma schema complete (20+ models). Oracle Cloud + AI research complete. Setting up infrastructure.

## Project Identity
- **Name:** Webness OS — The Sovereign AI Agency Operating System
- **Owner:** Webness Agency (webness.in)
- **Architecture:** Hybrid Cloud (Oracle Cloud Free Tier ARM) + Local Brain (GPU PC via Cloudflare Tunnel)
- **Stack (Cloud):** Node.js, Express, React, Vite, Tailwind, ShadCN UI + Tremor (charts), Prisma, PostgreSQL + pgvector, Redis, BullMQ
- **Stack (Local):** Python, FastAPI, Ollama (Qwen3-8B, DeepSeek-R1-8B, Gemma3-4B, Qwen2.5-Coder-7B, nomic-embed-text, Gemma3-1B, Llama3.2-3B), Playwright, ComfyUI
- **Connection:** Cloudflare Tunnel (brain.webness.in → localhost:8000)
- **Cloud Host:** Oracle Cloud ARM (4 OCPUs, 24GB RAM, 200GB disk) — $0/month forever
- **Cloud OS:** Ubuntu 24.04 LTS ARM (longest support: 2029 standard, 2036 ESM)
- **Existing Hosting:** Hostinger shared hosting (1.5GB RAM) — used ONLY for static landing page
- **Communications:** WhatsApp Cloud API (direct Meta integration, no BSP middleman)
- **GPU:** RTX 3060 8GB VRAM (confirmed) — one model at a time, Ollama hot-swaps in ~2s

## Core Documents (Read in this order)
1. `TECHNICAL_BLUEPRINT.md` — Architecture, schema, folder structure, interfaces (v6.0 — Oracle Cloud + pgvector)
2. `ROADMAP.md` — Phase-by-phase execution plan with checkboxes (v7.0)
3. `ORACLE_CLOUD_SETUP.md` — **NEW v7.0:** Oracle Cloud + AI Brain setup guide (VPS, DB decision, Ollama models, Multi-Model Pipeline, MCP servers, AI fine-tuning)
4. `COMPETITOR_ANALYSIS.md` — Who we're fighting and how we win
5. `BUSINESS_INTELLIGENCE.md` — Dynatrace learnings, Shadow Manager, Business Health Score, SaaS models, proactive AI
6. `GAP_ANALYSIS.md` — What was missing, what was improved, architecture validation
7. `USER_FLOW.md` — Complete UX specification
8. `BLOG_BUILDER_ANALYSIS.md` — Analysis of existing blog builder code to reuse
## Two-Dashboard Architecture
- **Admin Dashboard** (admin.webness.in) — ONLY for Webness owner (you) + AI Brain access via API. Manages ALL clients, hosting, health, payments, system status. Built with ShadCN UI + Tremor charts + TanStack Table.
- **Client Dashboard** (app.webness.in) — For clients who connect via API key or login. Shows THEIR tools, usage, credits, results, health score. Scoped to their tenant.
- **RBAC Hierarchy:** Super Admin → Agency Admin → Client Admin → Client User → Client Viewer
- **AI Brain Access:** Same Admin API endpoints, authenticated with internal `AI_BRAIN_KEY`

## Expanded Service Scope (End-to-End Business Platform)
This is NOT just a blog/SEO tool. Webness OS is a **full business automation platform**:
- SEO Audit & Management (better than Surfer/Ahrefs/Harbour)
- Blog Writer & Content Pipeline
- Social Media Manager (Instagram, Facebook, LinkedIn, Twitter)
- Graphic Design (AI-powered logos, banners, social graphics via ComfyUI)
- Logo Design (AI-generated + human refinement)
- LinkedIn Manager (post scheduling, engagement automation)
- WhatsApp Business Integration (per-client phone numbers, templates, auto-responses)
- Receipt & Invoice Generator
- Accounting System (basic P&L, expense tracking per client)
- Lead Scraper & Outreach
- Review Management (Google, Yelp)
- Voice AI (future phase)
- Email Marketing
- Each client gets a tier with freemium demo access
## Completed Milestones
- [x] Strategic pivot defined (Agency → SaaS + Service Hybrid)
- [x] Competitor analysis completed (30+ competitors analyzed)
- [x] Technical architecture defined (Dual-Core Hydra)
- [x] Database schema designed (PostgreSQL + pgvector via Prisma)
- [x] Folder structure designed (monorepo)
- [x] Tool interface contract defined (BaseTool abstract class)
- [x] Job queue design complete (BullMQ + Redis)
- [x] Failover protocol designed (Local → DeepInfra → OpenRouter → OpenAI)
- [x] SSE streaming architecture defined
- [x] User flow & onboarding designed
- [x] Blog builder codebase analyzed for reuse
- [x] **Dynatrace research complete** — Mini Dynatrace for SMBs designed
- [x] **Oracle Cloud Free Tier validated** — replaces Hostinger VPS ($0/month)
- [x] **pgvector replaces ChromaDB** — one less service, SQL JOINs with vectors
- [x] **Shadow Manager designed** — proactive AI with 4 autonomy levels
- [x] **Business Health Score designed** — composite 0-100 score from 8 data sources
- [x] **Self-Education Loop formalized** — store corrections in pgvector, use as few-shot
- [x] **Business types analyzed** — 15 business types with pain points and tool mapping
- [x] **SaaS pricing model validated** — hybrid credit + subscription + Service-as-a-Software
- [x] **Gap analysis complete** — cross-referenced with second planner AI, all gaps closed
- [x] **GPU specs analyzed** — RTX 3060 (12GB) or 4060 (8GB), model combos documented
- [x] **Full monorepo scaffolded** — 4 apps (api, worker, dashboard, admin) + 2 packages (db, shared) + infra scripts. All compile with 0 TypeScript errors.
- [x] **Prisma schema complete** — 20+ models including Organization, User, Task, TaskStep, ApiKey, WhatsApp, Invoice, Social, AuditLog + pgvector extension
- [x] **Oracle Cloud research complete** — Free tier limits documented, Autonomous DB evaluated and REJECTED, AI Vector Search analyzed
- [x] **Ollama model library researched** — 7 optimal models identified for RTX 3060 8GB VRAM
- [x] **Multi-Model Hydra Pipeline designed** — 6-stage Router→Planner→Executor→Critic→Polisher→SelfEducation pipeline
- [x] **MCP servers planned** — 10 MCP servers identified with phase assignments
- [x] **AI fine-tuning strategy defined** — 5-level progression from prompt engineering to LoRA

## Current Progress
- **Infrastructure:** Monorepo scaffolded. All 4 apps (api, worker, dashboard, admin) compile with 0 TypeScript errors. Prisma schema (20+ models) complete. Oracle Cloud account created. Ollama models researched. Multi-model pipeline designed. MCP servers planned. Ready for VPS setup.
- **SEO Auditor:** Not started (Phase 1)
- **Researcher:** Not started (Phase 2)
- **Blog Writer:** Existing blog builder prototype analyzed and documented (Phase 3)
- **Dashboard:** App scaffolded (7 pages), 0 TS errors (Phase 4)
- **Admin Dashboard:** App scaffolded (8 pages), 0 TS errors (Phase 4)
- **Credits/Payments:** Not started (Phase 4)

## Technical Debts
- None yet (pre-development)

## Key Decisions Made
1. **Streaming from Day 1** — SSE (Server-Sent Events), not WebSockets
2. **SEO Auditor first** — Lead magnet (free tool), then Researcher, then Blog Writer
3. **Oracle Cloud Free Tier** — 4 OCPUs, 24GB ARM. Replaces Hostinger VPS. $0/month. *(v6.0 change)*
4. **pgvector replaces ChromaDB** — Vectors inside PostgreSQL. No separate service. SQL JOINs with embeddings. *(v6.0 change)*
5. **Monorepo** — Single repo with pnpm workspaces (Node.js) + per-tool requirements.txt (Python)
6. **Manager AI** — Router (Qwen2.5-7B) + Orchestrator + Critic (DeepSeek-R1) pattern
7. **Credit system + SaaSS tier** — Credits for self-serve, subscriptions for plans, outcome-based for managed service *(v6.0 enhanced)*
8. **Nginx reverse proxy** — One Oracle VM, multiple services on different ports
9. **Cloudflare Tunnel** — Free, encrypted, outbound-only connection
10. **Shadow Manager** — Proactive AI with 4-level autonomy, weekly digest, Business Health Score *(v6.0 new)*
11. **Self-Education Loop** — Store (original, edited) correction pairs in pgvector, use as few-shot examples *(v6.0 new)*
12. **Hostinger = landing page only** — Shared hosting used for static webness.in. Everything else on Oracle Cloud. *(v6.0 change)*
13. **Oracle Autonomous DB REJECTED** — Researched Oracle AI Database 26ai (AI Vector Search, Select AI). REJECTED because: Prisma has NO Oracle adapter, 20GB limit, 30 session limit, 3-6 HTTP users, no backups, auto-stops at 7 days idle. Self-hosted PostgreSQL + pgvector is far superior for our use case. See ORACLE_CLOUD_SETUP.md §2. *(v7.0 new)*
14. **Multi-Model Hydra Pipeline** — 6-stage pipeline: Router (Gemma3) → Planner (Qwen3) → Executor (task-specific) → Critic (DeepSeek-R1) → Polisher (Qwen3) → Self-Education. Critic loop max 3 iterations. See ORACLE_CLOUD_SETUP.md §8. *(v7.0 new)*
15. **MCP Servers** — Filesystem + PostgreSQL (Day 1), Brave Search + Playwright (Phase 1), GitHub (Phase 0), Memory + Fetch + Google Search Console (Phase 1). No Hostinger MCP needed. *(v7.0 new)*
16. **Grok + OpenAI free keys** — User has free API keys for both. Used as external failover in Hydra pipeline after local Ollama. *(v7.0 new)*
17. **AI Fine-Tuning Strategy** — 5 levels: Prompt Engineering → RAG (pgvector) → Few-Shot → LoRA (QLoRA fits RTX 3060) → Full. Start with Level 1-2 in Phase 1, Level 3 in Phase 2, Level 4 in Phase 7. *(v7.0 new)*

## Key Constraints (Never Forget)
- **Oracle Cloud idle reclamation:** ARM instances killed if idle 7+ days (CPU < 20%). Run idle-prevention cron job.
- **Oracle Cloud no SLA:** Free tier has no uptime guarantee. Keep Terraform configs + automated backups for rapid rebuild.
- **Oracle ARM architecture:** Ensure all packages have ARM64 builds (Node.js, PostgreSQL, Redis, Nginx all confirmed).
- **Prisma connection_limit:** Set to 5 to avoid connection pool exhaustion
- **WhatsApp policy (Jan 15, 2026):** General-purpose AI assistants BANNED. Only business-specific support bots allowed
- **Google SEO policy:** "Scaled content abuse" = penalty. Quality-first, not volume-first
- **Security:** NEVER hardcode API keys. NEVER expose credentials in frontend. All WordPress auth must go through backend proxy
- **GPU VRAM:** RTX 3060 = 8GB VRAM (confirmed). ONE model at a time. Ollama hot-swaps in ~2s. Check with `nvidia-smi`.

## Next Strategic Move
→ **Phase 0, Week 1 (ACTIVE):** Monorepo scaffold DONE (0 TS errors). Next: Create Oracle Cloud ARM VM (4 OCPUs, 24GB), install stack (PostgreSQL 16 + pgvector, Redis 7, Node.js 20, Nginx), install Ollama locally and pull 7 models, set up Cloudflare Tunnel, test brain ↔ cloud handshake. Follow ORACLE_CLOUD_SETUP.md step-by-step.

## Models Available on Local PC (RTX 3060 8GB VRAM — ONE at a time)
| Model | Command | Size | VRAM | Primary Use | Priority |
|---|---|---|---|---|---|
| **Qwen 3 (8B)** | `ollama pull qwen3:8b` | 4.9GB | ~6GB | Router/Planner/Polisher — Latest gen, thinking mode | 🔴 CRITICAL |
| **DeepSeek-R1 (8B)** | `ollama pull deepseek-r1:8b` | 4.7GB | ~5.5GB | Critic, deep reasoning, analysis, chain-of-thought | 🔴 CRITICAL |
| **Gemma 3 (4B)** | `ollama pull gemma3` | 3.3GB | ~4GB | Fast generation, summaries, quick tasks | 🔴 CRITICAL |
| **Qwen 2.5 Coder (7B)** | `ollama pull qwen2.5-coder:7b` | 4.7GB | ~5.5GB | Code generation, technical tasks | 🟡 HIGH |
| **nomic-embed-text** | `ollama pull nomic-embed-text` | 274MB | ~0.3GB | Embeddings for RAG/pgvector (runs alongside any model) | 🔴 CRITICAL |
| **Llama 3.2 (3B)** | `ollama pull llama3.2` | 2.0GB | ~3GB | Lightweight backup, fast drafts | 🟢 NICE |
| **Gemma 3 (1B)** | `ollama pull gemma3:1b` | 815MB | ~1.5GB | Ultra-fast routing/classification | 🟢 NICE |

### Multi-Model Hydra Pipeline (See ORACLE_CLOUD_SETUP.md §8 for full details)
```
Request → Router (Gemma3 1B) → Planner (Qwen3 8B) → Executor (task-specific) → Critic (DeepSeek-R1) → Polisher (Qwen3 8B) → Self-Education (pgvector)
```
- **Critic Loop:** If score < 7/10, retry up to 3 times
- **Model hot-swap:** ~2 seconds per switch via Ollama
- **Failover chain:** Local Ollama → Grok API (free) → OpenAI API (free) → DeepInfra → OpenRouter

## Killer Features to Build (Priority Ordered)
1. **"Glass Factory" LiveView** — Watch AI work in real-time via SSE streaming
2. **Business Health Score** — Composite 0-100 metric from 8 data sources (mini Dynatrace)
3. **Shadow Manager** — Proactive AI that monitors, acts, and escalates. Weekly digest.
4. **Admin God-Mode Dashboard** — Full system control, client management, health monitoring, manual payments
5. **Content Score** (à la Surfer SEO) — Real-time SEO grading for all content
6. **Self-Correction Loop** — Critic agent auto-improves output quality
7. **Self-Education Loop** — Store corrections in pgvector, improve over time
8. **WhatsApp Business Integration** — Per-client phone numbers, templates, auto-responses
9. **Brand Voice RAG** — Each client gets unique voice profile from their content (via pgvector)
10. **Industry Packs** — Pre-configured workflows for specific business types
11. **Invoice & Receipt Generator** — Professional PDF generation per client
12. **Basic Accounting System** — P&L tracking, expense categories, per-client
13. **Graphic Design AI** — Logo generation, social graphics, banners via ComfyUI
14. **LinkedIn Manager** — Post scheduling, engagement tracking, profile optimization
15. **AI Visibility Tracker** — Track brand presence in AI search engines
16. **Personality Onboarding** — "Favorite shape" → floating shape animations in dashboard
17. **Instagram Viral Reels Generator** — AI generates reel ideas, scripts, and captions based on trending topics and niche analysis. Phase 1: text ideas + scripts. Phase 2+: video generation when GPU/API allows.
18. **Free Keyword Research Tool** — AI-powered keyword research combining SERP analysis, search volume estimation, competition scoring, and marketing suggestions. Great lead magnet alongside SEO Auditor.
19. **Multi-Model Hydra Pipeline** — 6-stage AI pipeline where each model specializes. Router → Planner → Executor → Critic → Polisher → Self-Education. Human-level decision making.

## APIs & Services We Use
| Service | Purpose | Cost | Key |
|---|---|---|---|
| Oracle Cloud ARM | Cloud server (4 OCPUs, 24GB) | $0 (Always Free) | Oracle account |
| Oracle Object Storage | Backups + asset storage | $0 (20GB free) | Oracle account |
| Ollama | Local LLM inference | $0 | N/A (local) |
| pgvector | Vector embeddings (PostgreSQL ext) | $0 | N/A (extension) |
| **WhatsApp Cloud API** | Per-client business messaging | **$0 platform + Meta per-msg fees** | Meta Business account |
| Serper.dev | Google SERP data | 2500 free then $50/mo | Needs API key |
| Stripe | International payments | 2.9% + $0.30/txn | Needs API keys |
| Razorpay | Indian payments | 2% per txn | Needs API keys |
| Cloudflare Tunnel | Local-to-cloud connection | $0 | Needs auth |
| Resend | Transactional emails | 3000/mo free | Needs API key |
| Cloudflare R2 | File/image storage | 10GB free | Needs auth |
| Google PageSpeed | Core Web Vitals | $0 (25K queries/day) | API key |
| Google Search Console | SEO rankings/clicks | $0 | Site verification |
| Google Business Profile | Reviews/posts/insights | $0 | API access |
| Instagram Graph API | Social publishing | $0 | Facebook App |
| **Meta Business Suite API** | Facebook/IG management | $0 | Same Facebook App |
| **LinkedIn API** | Post scheduling/analytics | $0 (with app approval) | LinkedIn Dev App |
| BetterStack | Uptime monitoring | $0 (5 monitors) | Account |
| Oracle Object Storage | DB backups + assets | $0 (20GB free) | Oracle account |
| Oracle Email Delivery | Supplement Resend | $0 (3K/mo free) | Oracle account |
| Grok API | External AI failover #1 | $0 (free tier) | User has key |
| OpenAI API | External AI failover #2 | $0 (free credits) | User has key |

---

*UPDATE THIS FILE after every coding session. This is how the AI remembers across conversations.*
