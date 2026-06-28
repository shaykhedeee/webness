# Project Brief - 2026-06-02

## Scope

Scanned the current workspace plus common project locations under `C:\Users\USER\Documents`, `Desktop`, `Downloads`, and related folders. The active projects are mostly under `Documents`. Classification is based on folder names, README files, package manifests, git remotes, and visible project documents. Ambiguous items are marked as such.

## Personal / Own Ventures

### Resurgo

- Path: `C:\Users\USER\Documents\GOAKL RTRACKER`
- Remote: `https://github.com/shaykhedeee/resurgo.git`
- Type: Personal productivity SaaS / life operating system.
- Stack: Next.js, TypeScript, Convex, Clerk, Dodo Payments, Tailwind, Jest, Capacitor, Tauri, Resend, multiple AI providers.
- Brief: A large, mature AI-powered life transformation platform with goals, habits, AI coaches, vision boards, focus sessions, wellness tracking, finance, analytics, referrals, Telegram bot, mobile builds, desktop build, and MCP server.
- Status: Most production-like project found. Has tests, deployment notes, pricing, public domain references, native app targets, and worktrees.
- Notes: `GOAKL RTRACKER.worktrees` and `.scan-copy` are duplicate/worktree versions of this same project.

### CampIN

- Path: `C:\Users\USER\Documents\CampIN`
- Remote: `https://github.com/shaykhedeee/campin.git`
- Type: Startup / marketplace.
- Stack: Vite, React 19, TypeScript, Supabase, Drizzle ORM, PostgreSQL, Tailwind, research tooling.
- Brief: India's camping and road-stop discovery platform. The docs position it as "Airbnb for Camping in India" with campsite listings, host lead capture, road-stop verification, community, legal docs, research OS, and brand system.
- Status: Strong strategy/docs foundation plus working app scaffold. MVP focus appears to be trust, discovery, lead generation, and host onboarding.
- Notes: This has unusually rich business planning: PRD, legal docs, brand story, SEO briefs, community playbook, validation strategy, and 90-day execution plan.

### Webness OS

- Path: `C:\Users\USER\Documents\Webness\pro webness ai tools\webness-os`
- Remote: `https://github.com/shaykhedeee/webness.git`
- Type: Internal agency operating system / business platform.
- Stack: pnpm monorepo, Express, TypeScript, PostgreSQL, pgvector, Redis, BullMQ, Prisma, React/Vite dashboards, Python FastAPI local brain, Ollama, Cloudflare Tunnel.
- Brief: A sovereign AI agency platform with cloud API, worker queue, local GPU "brain", admin dashboard, client dashboard, SSE jobs, SEO auditor, research manager, blog writer, WhatsApp, invoicing, social, and white-label roadmap.
- Status: Significant architecture and partial scaffolding. The roadmap shows several components already scaffolded, but infrastructure and local brain setup still need completion.
- Notes: This is best treated as business/internal, not a client project.

### Blog Builder / AI Blog Publisher

- Paths:
- `C:\Users\USER\Documents\blog builder`
- `C:\Users\USER\Documents\Webness\pro webness ai tools\blog builder`
- Type: Internal AI content tool.
- Stack: Vite, React, TypeScript, Google Gemini API, jsPDF, html2canvas.
- Brief: AI Studio-origin app for generating/publishing WordPress blog content and exporting documents.
- Status: Small, runnable app with AI Studio README.
- Notes: Likely overlaps with Webness content automation.

### AI/Game/Security Research Folder

- Path: `C:\Users\USER\Documents\AI CRACKER`
- Type: Personal experiments, copied references, gaming/statistics/security tools.
- Important projects:
- `edge_tracker`: Remote `https://github.com/shaykhedeee/Advanced-BC-AI-Analyser.git`. A serious statistics/ML app for provably fair crash game analysis, with the stated thesis that cryptographically secure RNG cannot be predicted and ML should converge near chance.
- `ai-game-helper`: React/FastAPI/Qwen planning folder for game-helper prediction experiments.
- `BC-AI-Analyser`, `bc-game-crash-predictor`, `BC.game-Crash-Predictive-APP`, `bc-lifehash`, `Bcgame5111.github.io`: crash-game/predictor/analyser experiments and references.
- `cryptosym`: Python crypto/symbolic/math package reference.
- `Hacker-AI`, `hackgpt`, `worm-ai`, `jail break security`: security/AI assistant/reference repos.
- `n8n`: automation template packs.
- Status: Mixed. Some owned experiments, many cloned/reference repos.
- Notes: Keep this separate from client work. Anything claiming gambling prediction accuracy should be reframed carefully as statistical analysis, fairness verification, or educational simulation.

### FeedbackHub

- Path: `C:\Users\USER\Documents\FeedbackHub`
- Type: Unknown / empty placeholder.
- Status: No visible files found during scan.

## Client / External Brand Projects

### Whole Lot of Nature

- Path: `C:\Users\USER\Documents\whole lot of nature\Whole lot of nature\whole-lot-of-nature`
- Remote: `https://github.com/shayankhadir/-whole-lot-of-nature.git`
- Type: Brand storefront / likely client or owned commerce brand.
- Stack: Next.js 14, React, Prisma, MySQL, WooCommerce/WordPress API, Resend, NextAuth, Playwright, SEO/growth/content agents.
- Brief: Production-ready storefront that syncs with WooCommerce/WordPress and adds email-intelligence workflows for contact/newsletter submissions.
- Status: Mature ecommerce project with many automation scripts for WooCommerce sync, SEO, performance, design optimization, growth, content, responsive QA, and site audit.
- Classification note: Looks like a brand/business site. If this is your own brand, move it to "Own ventures"; otherwise it belongs with client commerce work.

### Mridula VFX Portfolio

- Path: `C:\Users\USER\Documents\Mridula`
- Type: Client/person portfolio.
- Stack: Astro, React, TypeScript, Tailwind, Framer Motion, MDX/content collections, Three.js.
- Brief: Professional VFX artist portfolio for Mridula Jidagam with realtime VFX, shaders, tools, blog, offline VFX, and an NDA vault.
- Status: Solid content-driven portfolio with SEO/deployment docs.
- Notes: README warns vault auth is currently client-side and needs proper server-side auth before production use.

### Muskans Autocad Solution / Interior Tools

- Path: `C:\Users\USER\Documents\Muskans autocad solution`
- Type: Client/interior design tooling.
- Components:
- Root floorplan tooling: HTML/CSS/JS/Python utilities for DXF/SVG/PNG floorplan generation and editing.
- `cutlist`: research and roadmap for a modular cabinetry cutlist SaaS for Indian design-build studios.
- `cutlist\cutlist-app`: React/Vite prototype for cutlist calculations.
- `spacious-venture-onboarding`: full-stack Express/SQLite/React app for an interior experience centre, proposals, moodboards, floorplans, material library, and AI/image workflows.
- `dadthing`: duplicate or related quotation generator repo, remote `https://github.com/shaykhedeee/quotationgenerator`.
- Status: Multiple related prototypes around interior design automation, quoting, floorplan generation, cutlists, and client onboarding.
- Notes: This folder should probably be split into clean subprojects: `floorplan-editor`, `cutlist-saas`, `quotation-generator`, and `spacious-venture-onboarding`.

### Spaces 360 / Quotation Generator

- Path: `C:\Users\USER\Documents\dadthing`
- Remote: `https://github.com/shaykhedeee/quotationgenerator`
- Type: Client/family business tool.
- Stack: Vite, React 19, TypeScript, Gemini API, Tailwind, jsPDF, html2canvas, jszip, Recharts, Motion.
- Brief: Interior design quotation system for generating estimates, PDFs, charts, and project materials.
- Status: Working Vite app scaffold with AI Studio style README.
- Notes: Related copy also exists under `Muskans autocad solution\dadthing`.

### Restaurant Brand Suite

- Path: `C:\Users\USER\Documents\om`
- Type: Client branding/design.
- Main brands: Ande Ka Fanda, London Fish & Chips, Patiala House, plus Dolly/menu assets.
- Code project: `C:\Users\USER\Documents\om\Resyaurant guide list\restaurant-presentations`
- Stack: Next.js 14, TypeScript, Tailwind, Framer Motion, Lucide, Swiper.
- Brief: Interactive presentation suite for three restaurant brands with brand identity, menu, pitch decks, guides, PDFs, Illustrator assets, and generated images.
- Status: Client design package plus a runnable presentation app.

### CakeStop

- Path: `C:\Users\USER\Documents\cakestop`
- Type: Client WordPress/Elementor site kit.
- Stack/assets: Elementor kit export, Elementor Pro metadata, templates, taxonomies, content, WooCommerce settings, images, video, zip exports.
- Brief: Cake/bakery website asset and template package.
- Status: Asset/export folder rather than a source-code app.

### Giftyaari

- Path: `C:\Users\USER\Documents\Giftyaari`
- Type: Client/brand ecommerce or product asset folder.
- Brief: Gift/card/product visuals, printing assets, SVGs, product photos, website pictures, PDFs, loading JSON, and mockups.
- Status: Mostly design/media assets, not a detected software repo.

### Salini Finance

- Path: `C:\Users\USER\Documents\Salini Fineace`
- Type: Client finance/accounting documents.
- Brief: Contains accounting issue docs, annual report PDFs, adjusted spreadsheets, and fiscal deficit slide materials.
- Status: Document/data project, not a codebase.

### Digi Marketing / Royaal

- Path: `C:\Users\USER\Documents\Digi Marketing`
- Type: Client sales/quotation documents.
- Brief: Digital marketing quotation PDFs for Royaal.
- Status: Document folder.

## Reference / Downloaded / Dependency Repos

These are useful, but should not be mixed with owned project briefs unless you actively maintain them:

- `C:\Users\USER\Documents\GOAKL RTRACKER\API`: Hacker News API docs/reference.
- `C:\Users\USER\Documents\GOAKL RTRACKER\clerk-nextjs`: basic Next.js template.
- `C:\Users\USER\Documents\GOAKL RTRACKER\clime`: Go CLI library.
- `C:\Users\USER\Documents\GOAKL RTRACKER\gettyimages-api_nodejs`: Getty Images SDK.
- `C:\Users\USER\Documents\GOAKL RTRACKER\google-analytics-mcp`: Google Analytics MCP server.
- `C:\Users\USER\Documents\GOAKL RTRACKER\openfoodfacts-server`: Open Food Facts/Product Opener source reference.
- `C:\Users\USER\Documents\GOAKL RTRACKER\rest-api-doc`: INSPIRE REST API documentation.
- `C:\Users\USER\Documents\GOAKL RTRACKER\todo-for-ai-mcp`: Todo for AI MCP server.
- `C:\Users\USER\Documents\AI CRACKER\Hacker-AI`, `hackgpt`, `worm-ai`, `cryptosym`: cloned/reference security/AI/crypto projects.

## Highest-Priority Cleanup

1. Create a clean project taxonomy:
   - `Own Ventures`: Resurgo, CampIN, Webness OS, Blog Builder.
   - `Client Work`: Mridula, Muskans/Spacious Venture, Restaurant Suite, CakeStop, Giftyaari, Whole Lot of Nature if client-owned.
   - `Research/References`: AI CRACKER references, GOAKL copied SDK/API repos, n8n templates.
   - `Archives/Duplicates`: Resurgo worktrees, `.scan-copy`, duplicated dadthing folders.

2. Audit secrets before sharing or pushing:
   - I saw `.env`, `.env.local`, and `.env.example` files in several projects. I did not read their contents, but these should be checked before any public upload or client handoff.

3. Separate active code from media dumps:
   - `om`, `Giftyaari`, and `cakestop` contain many generated images/design exports. Keep a small `source` or `deliverables` structure so future scans do not treat every asset as a project.

4. Reframe risky AI/game material:
   - The strongest and safest positioning is "provably fair analysis, simulation, statistical testing, and risk education." Avoid claims of guaranteed crash-game prediction.

## Most Mature Projects

- Resurgo: strongest production SaaS architecture.
- Whole Lot of Nature: strongest ecommerce/client production stack.
- CampIN: strongest startup/business planning package.
- Webness OS: strongest internal agency platform roadmap and architecture.
- Mridula: cleanest portfolio/client website.
- Spacious Venture / Muskans tools: strongest niche B2B tooling opportunity for interiors.

