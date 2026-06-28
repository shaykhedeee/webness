# Webness Context Digest

Date: 2026-05-23

This digest is the curated product memory for the clean Webness repository. It distills the local docs, the scattered research files, the current `webness-os` codebase, and the public brand surfaces into a safe, implementation-ready context.

## Repository Boundary

`shaykhedeee/webness` is the product repository for `webness-os`.

The parent workspace remains a private research vault. Raw scattered notes, unfiltered notes, massive dumps, `.env.local` files, and experimental prototypes are intentionally excluded from the initial product import.

## Sources Scanned

- Core docs: `SYSTEM_BRAIN.md`, `TECHNICAL_BLUEPRINT.md`, `ROADMAP.md`, `USER_FLOW.md`, `BUSINESS_INTELLIGENCE.md`, `GAP_ANALYSIS.md`, `COMPETITOR_ANALYSIS.md`, `BLOG_BUILDER_ANALYSIS.md`, `BRAIN_AI_DEPLOYMENT_PLAN.md`, `ORACLE_CLOUD_SETUP.md`, `MCP_SETUP.md`.
- Scattered research: `SCATTEREDINFO_WEBNESS.md`, `SCATTEREDINFO_WEBNESS_UNFILTER.md`, `webness.txt`, and `info.md`.
- Product code: `webness-os` monorepo with API, worker, dashboard, admin, landing web app, shared package, db package, and infra scripts.
- Public surfaces: `https://webness.in` and `https://dribbble.com/webness`.

## Current Brand Truth

- `webness.in` currently resolves to a Hostinger expired-domain page. This is a critical launch blocker and brand trust issue.
- Dribbble positions Webness as `Webness Agency`, based in India, with the line `We scale your business digitally`.
- The visible Dribbble portfolio signal is broad web/design execution: ecommerce, medical consultation, drone company, construction, liquor, interiors, and digital marketing websites.

## Strategic Threads Found

1. Webness OS: a client-facing agency/business platform with auth, client portal, credits, billing, tools, admin, and live execution streams.
2. Webness Forge: a private/local AI engine and internal automation layer for agency work, model routing, agents, and local-first workflows.
3. Agency-first revenue: sell AI-powered web, content, SEO, automation, and business execution services using internal tools before the SaaS is fully mature.
4. MCP/API products: later productize Webness workflows as paid tools, connectors, or API access for other agencies.
5. Narrow micro-SaaS wedge: ship a focused workflow product for one business niche faster than the full platform.

These are not all equal priorities. Webness needs a deliberate decision process before deeper implementation so the repo does not turn into a giant unfocused platform.

## Product Direction Locked For Now

Webness is a strict safe stack.

The unfiltered/uncensored direction from the raw research is rejected for product direction. Webness can still value privacy, local control, and founder-owned infrastructure, but not unsafe bypass behavior, public/client-facing uncensored automation, or systems designed to remove safety boundaries.

Practical implication:

- Client-facing products need guardrails, audit logs, approvals, tenant isolation, and safe defaults.
- Internal automation should still use least privilege, allowlists, and explicit approvals for risky actions.
- Any local AI engine should be treated as infrastructure, not as a reason to bypass safety or compliance.

## Current Codebase Shape

`webness-os` is a TypeScript monorepo with:

- `apps/api`: Express API for auth, tools, streams, credits, webhooks, projects, admin, and health.
- `apps/worker`: BullMQ/Redis worker concept with dispatcher, tunnel monitor, and circuit breaker.
- `apps/dashboard`: client dashboard React app.
- `apps/admin`: admin React app.
- `apps/web`: landing website app.
- `packages/db`: Prisma schema and seed.
- `packages/shared`: shared constants/types.
- `infra`: Nginx, PM2, cloudflared, and deployment scripts.

## Known Implementation Gaps

- Tool execution creates tasks and deducts credits, but does not enqueue BullMQ jobs yet.
- Worker publishes task events through Redis, while API SSE currently only broadcasts to in-memory connections.
- API tool catalog returns `accessible`, while dashboard code expects `hasAccess`.
- Backend auth login returns token data in a different shape than the dashboard login hook expects.
- `apps/brain` and top-level `tools` directories appear in docs but do not exist in the current product repo.
- TypeScript checks currently fail in `apps/web` because the shared base config sets `rootDir` to `./src`, which resolves incorrectly when extended from the Next app.
- Landing app copy still includes stale or mismatched references such as `webness.com` and old launch timing.

These gaps should be documented and fixed deliberately before treating the platform as runnable.

## Contradictions To Resolve

- GPU memory: some docs assume a 3060 with 12GB VRAM, while the current technical source of truth says 8GB. Local `nvidia-smi` was not available in this environment, so this remains unresolved.
- Brand state: the plan assumes `webness.in` is the brand home, but the live domain currently shows an expired page.
- Product naming: Webness OS and Webness Forge are both strong concepts. The current default is Webness OS as the product repo, with Forge only as a possible private engine later.

## Working Principle

Build the smallest Webness that proves the business.

The near-term job is not to build every idea. It is to choose a wedge, ship a trustworthy product or service workflow, gather proof, and let the bigger operating system grow from real usage.
