# Webness OS

> Sovereign AI Agency Operating System - End-to-End Business Platform

## Architecture

- **Cloud Layer** (Oracle Cloud ARM): Express API + BullMQ Worker + PostgreSQL + pgvector + Redis
- **Local Brain** (GPU PC): FastAPI + Ollama + optional Playwright/ComfyUI services
- **Connection**: Cloudflare Tunnel from `brain.webness.in` to the local Brain API
- **Dashboards**: Admin (`admin.webness.in`) + Client (`app.webness.in`)

## Quick Start

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Start development (all Node apps)
pnpm dev

# Start individual apps
pnpm dev:api       # Express API on :3001
pnpm dev:worker    # BullMQ Worker
pnpm dev:dashboard # Client Dashboard on :3000
pnpm dev:admin     # Admin Dashboard on :3003
```

## Local Brain on Windows

The local AI PC runtime lives in `apps/brain` and is exposed through
`infra/cloudflared/config.yml`.

```powershell
# From webness-os
pnpm brain:models
pnpm dev:brain

# Optional daily startup install
pnpm brain:startup
```

Useful direct scripts:

```powershell
.\infra\windows\Start-BrainApi.ps1 -Install
.\infra\windows\Start-CloudflaredTunnel.ps1
.\infra\windows\Test-BrainDaily.ps1
```

## Project Structure

```text
webness-os/
├── apps/
│   ├── api/           # Express REST API (auth, CRUD, SSE, webhooks)
│   ├── brain/         # Local FastAPI Brain (AI PC + Ollama)
│   ├── worker/        # BullMQ job processor + dispatcher
│   ├── dashboard/     # Client-facing React dashboard
│   └── admin/         # Admin dashboard
├── packages/
│   ├── db/            # Prisma schema + client + migrations
│   └── shared/        # Shared types, constants, validators
├── infra/             # Nginx, Cloudflare, PM2, Windows startup scripts
└── docs/              # Planning documents
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| API | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 + pgvector |
| Queue | Redis 7 + BullMQ |
| ORM | Prisma |
| Frontend | React 19 + Vite + Tailwind |
| Local AI | Python + FastAPI + Ollama |
| Tunnel | Cloudflare Tunnel |
| Streaming | Server-Sent Events (SSE) |

## Environment Variables

Copy `.env.example` to `.env` and fill in values. Copy `apps/brain/.env.example`
to `apps/brain/.env` on the AI PC and set the same `BRAIN_API_KEY` used by the
cloud API and worker.
