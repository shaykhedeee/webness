# Webness AI OS Architecture

## Goal

Webness OS is being shaped into one local-first business command system for projects, AI providers, SEO tools, content production, ebook lead magnets, Obsidian knowledge management, and local model hosting.

The first implemented layer is the Parallel AI Council:

- Gemini stays active.
- Groq is restored as a first-class fast/free provider.
- OpenRouter is restored as a first-class router/free-model provider.
- OpenAI remains supported.
- Hermes runs through the Local Brain/Ollama connector.
- Jan AI is supported through an OpenAI-compatible local endpoint.
- Claude Code, Codex, Antigravity, and Obsidian are tracked as local connectors.

## Runtime Flow

1. A user runs a tool from the dashboard.
2. The API creates a task and streams progress over SSE.
3. Worker/API fallback resolves organization BYOK keys first, then server `.env` keys.
4. The model orchestrator builds all configured provider targets.
5. Configured providers run simultaneously with `Promise.all`.
6. The result stores every provider output, latency, success/failure state, and a combined synthesis.

## Implemented Tools

| Tool | Purpose |
| --- | --- |
| `ai_council` | Send one prompt to all configured models simultaneously. |
| `seo_auditor` | Crawls the URL, then runs the audit through the parallel council. |
| `blog_writer` | Runs outline, draft, and review stages through the parallel council. |
| `ebook_pipeline` | Produces ebook draft, landing copy, lead capture copy, nurture sequence, and publishing checklist. |
| `obsidian_publisher` | Converts raw notes and drafts into Obsidian-ready markdown. |

## Connector Environment

Cloud providers:

```env
GROQ_API_KEY=""
OPENROUTER_API_KEY=""
GOOGLE_AI_STUDIO_KEY=""
OPENAI_API_KEY=""
```

Local providers:

```env
BRAIN_API_URL="http://127.0.0.1:8000"
BRAIN_API_KEY=""
HERMES_ENABLED=true
HERMES_MODEL="nous-hermes2:latest"
JAN_API_BASE_URL="http://127.0.0.1:1337/v1"
JAN_API_KEY=""
OBSIDIAN_VAULT_PATH="C:\Users\USER\Documents\ObsidianVault"
CLAUDE_CODE_BIN=""
CODEX_BIN=""
ANTIGRAVITY_PATH=""
```

## Dashboard

The dashboard has a new `AI OS` page:

- Shows configured connectors.
- Shows Brain/Hermes/Obsidian status from environment.
- Lets you run a manual parallel council prompt.
- Displays the combined council output and successful providers.

## Next Build Slices

1. Add real file-write approval for Obsidian notes and ebook drafts.
2. Add connector health checks that actually ping Jan, Brain, Ollama, and configured CLIs.
3. Add project command center tying tasks, notes, leads, content, invoices, and assets to one project record.
4. Add lead capture and ebook publishing tables so ebook assets become reusable sales funnels.
5. Add provider routing policy per tool: fastest, cheapest, highest-quality, local-only, or all-model council.
