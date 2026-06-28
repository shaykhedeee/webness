# 🏛️ Sovereign AI OS Local Brain Setup & Operations

Welcome to the enhanced, production-ready local AI PC runtime. This document details how to configure, run, and manage your agentic OS locally on your RTX 3060 (or similar local GPU setup) for full offline or hybrid SaaS execution.

---

## 🚀 RTX 3060 Local Model Recommendations

To get the absolute best performance and prevent VRAM overflow (12GB limit on RTX 3060), use the following curated mix of quantized models:

| Task Area | Recommended Model | Command to Pull | Size | Notes |
|---|---|---|---|---|
| **Gateway Chat / Voice** | `hermes3:8b` | `ollama pull hermes3:8b` | ~4.7 GB | Elite agentic capability, system prompt adherence |
| **Deep Reasoning** | `deepseek-r1:8b` | `ollama pull deepseek-r1:8b` | ~4.7 GB | Advanced chain-of-thought, planning |
| **General Chat** | `qwen2.5:7b` | `ollama pull qwen2.5:7b` | ~4.7 GB | High speed, great context reasoning |
| **Code & Scripting** | `qwen2.5-coder:3b` | `ollama pull qwen2.5-coder:3b` | ~2.0 GB | Ultra-fast execution helper |
| **Vector Embeddings** | `nomic-embed-text` | `ollama pull nomic-embed-text` | ~274 MB | 100% offline pgvector memory |
| **Fast Router** | `gemma3:1b` | `ollama pull gemma3:1b` | ~1.0 GB | Ultra-low latency categorization |

> [!TIP]
> **RTX 3060 VRAM Management:** Keep at most 2 active models loaded in VRAM concurrently. Ollama handles swapping automatically. To clear VRAM instantly, use the `/swap-model` endpoint.

---

## 📦 Unified Memory Architecture

The Local Brain directly interfaces with the PostgreSQL + `pgvector` database configured in `webness-os/.env`. It operates with three distinct memory layers:

1. **Working Memory:** Local message history passed in request threads.
2. **Semantic Memory (Obsidian & Research):** Chunks from your Obsidian vault and external research nodes synced to pgvector.
3. **Episodic Memory (Directives & Corrections):** Rules generated during task runs, loaded automatically when prompts align semantically.

### Local Memory Context Injection
Whenever a request is sent to `/v1/chat` or `/v1/chat/completions` (Hermes Chat), the brain automatically:
1. Generates local query embeddings using `nomic-embed-text`.
2. Queries pgvector via cosine similarity (`<=>`).
3. Decorates the system prompt with matching preferences, brand tone, and Obsidian notes.

---

## 🛠️ Self-Learning Reflection Loop

The `/v1/learn` endpoint runs a meta-cognitive agent to analyze past runs. 

### How to Trigger:
Make a POST request to `http://127.0.0.1:8080/v1/learn`:
```json
{
  "task_id": "8c5c4e9f-...",
  "org_id": "default",
  "prompt": "Create an email marketing draft",
  "output": "Dear Subscriber...",
  "status": "success",
  "user_feedback": "Ensure to keep paragraphs under 3 sentences for mobile readability",
  "rating": 4
}
```
*The agent will generate a customized mobile formatting rule, embed it, and inject it automatically into all future email marketing tasks!*

---

## 📂 Secure File Management & Code Indexing

The brain includes a built-in RAG and file indexing system.

### File CRUD Endpoints:
- `GET /v1/files/list?path=.` - Recursively lists files in the workspace (ignoring build folders).
- `GET /v1/files/read?path=src/index.ts` - Read file contents safely (traversal guarded).
- `POST /v1/files/write` - Create or update files.

### Code Indexer:
- `POST /v1/files/index` - Background task that chunks, embeds, and indexes your entire codebase.
- `POST /v1/files/search` - Semantic search over your indexed codebase:
  ```json
  { "query": "database connection schema" }
  ```

---

## 🔌 Running the Servers

The PowerShell script automatically launches a **dual-port daemon** setup:
- **Port 8080:** Dedicated backend connection channel.
- **Port 8642:** Nous Hermes Agent CORS-compliant endpoint for browser clients.

Start it with:
```powershell
.\infra\windows\Start-BrainApi.ps1
```
*Pressing `Ctrl+C` will clean up both port processes automatically.*
