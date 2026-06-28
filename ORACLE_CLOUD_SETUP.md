# ORACLE CLOUD + AI BRAIN SETUP GUIDE
**Version:** 1.0 | **Date:** February 10, 2026  
**Purpose:** Step-by-step guide to connect Oracle Cloud, set up the database, configure AI models, and wire everything together.

---

## Table of Contents
1. [Oracle Cloud Free Tier — What You Get](#1-oracle-cloud-free-tier)
2. [Oracle Autonomous Database — Research & Decision](#2-oracle-autonomous-database)
3. [Step-by-Step: Create Your Oracle VM](#3-create-oracle-vm)
4. [Step-by-Step: Connect to Your VM via SSH](#4-connect-via-ssh)
5. [Install Everything on the VPS](#5-install-vps-stack)
6. [Cloudflare Tunnel Setup](#6-cloudflare-tunnel)
7. [Local AI Brain Setup (Ollama + Models)](#7-local-ai-brain)
8. [Multi-Model AI Loop Architecture](#8-multi-model-loop)
9. [AI Fine-Tuning for Business](#9-ai-fine-tuning)
10. [MCP Servers Needed](#10-mcp-servers)
11. [Hostinger Integration](#11-hostinger)
12. [New Agent Ideas Log](#12-agent-ideas)

---

## 1. Oracle Cloud Free Tier — What You Get (ALWAYS FREE, $0/month)

### Compute
| Resource | Spec |
|---|---|
| **ARM VM (A1.Flex)** | 4 OCPUs, 24GB RAM (configurable as 1 big or 4 small VMs) |
| **AMD Micro VMs** | 2x VM.Standard.E2.1.Micro (1/8 OCPU, 1GB RAM each) |
| **Boot/Block Storage** | 200GB total (boot volumes + block volumes combined) |
| **OS Options** | Ubuntu 22.04/24.04 LTS, Oracle Linux, CentOS |
| **Outbound Data** | 10TB/month |

### Database (ALWAYS FREE)
| Resource | Spec |
|---|---|
| **Autonomous Database** | 2 instances, 1 OCPU each, 20GB storage each |
| **MySQL HeatWave** | 1 standalone DB system, 50GB storage |
| **NoSQL Database** | 133M reads/mo, 133M writes/mo, 3 tables × 25GB |

### Networking
| Resource | Spec |
|---|---|
| **Load Balancer** | 1 Flexible (10 Mbps), 16 listeners |
| **Network Load Balancer** | 1 instance, 50 listeners |
| **VCNs** | 2 Virtual Cloud Networks |
| **Site-to-Site VPN** | 50 IPSec connections |

### Other
| Resource | Spec |
|---|---|
| **Object Storage** | 20GB (for backups, assets) |
| **Vault** | 20 HSM key versions, 150 secrets |
| **Email Delivery** | 3,000 emails/month |
| **Monitoring** | 500M ingestion data points |
| **Notifications** | 1M HTTPS + 1K email notifications/month |

### ⚠️ CRITICAL WARNINGS
1. **Idle Reclamation:** ARM VMs killed if idle 7+ days (CPU < 20%, Network < 20%, Memory < 20%). We MUST run an anti-idle cron job.
2. **Autonomous DB Auto-Stop:** Stops after 7 days of inactivity. Deleted after 90 days stopped.
3. **No Backups on Free DB:** Always Free Autonomous DB has NO backup/restore. We need manual `pg_dump` for PostgreSQL.
4. **Home Region Only:** All free resources must be created in your home region (chosen at signup).
5. **No Private Endpoints:** Free tier DBs can't be in a VCN — they're public (but encrypted + authenticated).

---

## 2. Oracle Autonomous Database — Research & Decision

### What Oracle Autonomous DB Offers (Free Tier)
- **2 databases** × 1 OCPU × 20GB storage each
- **Oracle AI Database 26ai** (in select regions: Phoenix, Ashburn, London, Paris, Sydney, Mumbai, Singapore, Tokyo)
- **AI Vector Search** — Native `VECTOR` data type, similarity search, built-in embedding support
- **Select AI** — Natural language to SQL! Write `SELECT AI 'show me top clients by revenue'` and it generates SQL
- **Oracle APEX** — Low-code app builder included free
- **JSON Database** mode — NoSQL-style document storage
- **30 simultaneous sessions** (upgraded from 20)
- **Auto-tuning, auto-patching, auto-scaling** (within free limits)
- **ONNX Runtime** — Import embedding models directly into the database

### 🔍 Our Decision: STICK WITH SELF-HOSTED PostgreSQL + pgvector

**WHY NOT Oracle Autonomous DB:**
1. **Vendor Lock-In** — Oracle's SQL dialect, PL/SQL procedures, and Oracle-specific types would make migration nearly impossible
2. **Prisma Doesn't Support Oracle** — Our entire codebase uses Prisma ORM, which has NO Oracle adapter. We'd need to rewrite everything with raw SQL or `oracledb` driver
3. **20GB Storage Limit** — Our multi-tenant platform with vectors, audit logs, assets, and WhatsApp messages will exceed 20GB quickly
4. **30 Session Limit** — With multiple tenants + API + workers + admin, we'd hit this fast
5. **3-6 Simultaneous HTTP Users** — The APEX/ORDS rate limit is brutal for a SaaS
6. **No Backup/Restore** — Can't restore from a point in time on free tier
7. **Auto-Stop at 7 Days** — If no queries for 7 days, DB shuts down. 90 days = DELETED
8. **ARM Compatibility** — PostgreSQL 16 runs perfectly on ARM64. Battle-tested.

**HOWEVER — We CAN Use Oracle Free Resources:**
- ✅ **Object Storage (20GB)** → For database backups, file uploads, asset storage (replaces/supplements Cloudflare R2)
- ✅ **MySQL HeatWave** → Possible analytics sidecar in the future
- ✅ **Email Delivery (3K/mo)** → Supplement or replace Resend for transactional emails
- ✅ **Load Balancer** → Free 10 Mbps flexible LB in front of Nginx (optional, Nginx handles routing fine)
- ✅ **Monitoring + Notifications** → Free APM and alerting
- ✅ **Vault** → Store secrets (API keys, JWT secrets) securely

### Final Architecture
```
Oracle Cloud ARM VM (4 OCPUs, 24GB RAM, 200GB disk)
├── Ubuntu 24.04 LTS ARM
├── PostgreSQL 16 + pgvector (self-hosted, full control)
├── Redis 7 (self-hosted, in-memory queue)
├── Node.js 20 LTS (Express API + BullMQ Worker)
├── Nginx (reverse proxy + SSL via Certbot)
├── PM2 (process manager)
├── Cloudflared (tunnel to Local Brain)
└── Cron jobs (anti-idle, backups, health checks)

Oracle Object Storage (20GB) → DB backups + file storage
Oracle Email Delivery (3K/mo) → Transactional emails
```

---

## 3. Step-by-Step: Create Your Oracle Cloud ARM VM

### A) Login to Oracle Cloud Console
1. Go to https://cloud.oracle.com
2. Sign in with your account
3. You'll land on the **Dashboard**

### B) Create a VCN (Virtual Cloud Network)
1. Hamburger Menu → **Networking** → **Virtual Cloud Networks**
2. Click **Start VCN Wizard** → **Create VCN with Internet Connectivity**
3. Name: `webness-vcn`
4. Leave defaults → **Create**
5. After creation, go to **Security Lists** → **Default Security List**
6. Add **Ingress Rules**:
   - Port 80 (HTTP): Source `0.0.0.0/0`, TCP, Dest Port 80
   - Port 443 (HTTPS): Source `0.0.0.0/0`, TCP, Dest Port 443
   - Port 22 (SSH): Source `YOUR_IP/32` (restrict to your IP for security!)

### C) Create the ARM Compute Instance
1. Hamburger Menu → **Compute** → **Instances** → **Create Instance**
2. Settings:
   - **Name:** `webness-os-main`
   - **Image:** Ubuntu 24.04 LTS (Canonical) — Make sure it says "Always Free Eligible"
   - **Shape:** VM.Standard.A1.Flex
     - OCPUs: **4** (use all your free allocation)
     - Memory: **24 GB** (use all your free allocation)
   - **Boot volume:** 47 GB (minimum, to leave room for a block volume later)
   - **Networking:** Select `webness-vcn`, **public subnet**, Assign public IPv4 address
   - **SSH Key:** Upload your public key OR let Oracle generate one (DOWNLOAD THE PRIVATE KEY!)
3. Click **Create**
4. Wait for instance to show **RUNNING**
5. Note the **Public IP Address** — you'll need this!

### D) (Optional) Add a Block Volume for Extra Storage
1. Hamburger Menu → **Block Storage** → **Block Volumes** → **Create**
2. Size: 150 GB (leaving 47 for boot = 197/200 total)
3. Attach it to your instance → Format & mount as `/data`

---

## 4. Step-by-Step: Connect to Your VM via SSH

### From Windows (PowerShell or Git Bash)
```bash
# If Oracle generated the key, convert .pem to use:
ssh -i C:\path\to\your\oracle-key.pem ubuntu@YOUR_PUBLIC_IP

# First time: accept the fingerprint (type "yes")
```

### From Windows (PuTTY)
1. Convert .pem to .ppk using PuTTYgen
2. Open PuTTY → Host: `YOUR_PUBLIC_IP` → Port: 22
3. Connection → SSH → Auth → Browse to .ppk file
4. Login as: `ubuntu`

### IMPORTANT: Save These Credentials Securely
- **Public IP:** (from step 3C.5)
- **Private SSH Key:** (the .pem file)
- **Username:** `ubuntu`

---

## 5. Install Everything on the VPS

Once connected via SSH, run the setup script we already created:

```bash
# Upload our setup script or paste it:
curl -sL https://raw.githubusercontent.com/YOUR_REPO/main/infra/scripts/setup-vps.sh | bash

# OR manually (the script does all of this):
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2

# 3. Install PostgreSQL 16 + pgvector
sudo apt install -y postgresql-16 postgresql-contrib
sudo apt install -y postgresql-16-pgvector

# 4. Configure PostgreSQL
sudo -u postgres createuser --superuser webness
sudo -u postgres createdb webness_os -O webness
sudo -u postgres psql -c "ALTER USER webness PASSWORD 'YOUR_SECURE_PASSWORD';"
sudo -u postgres psql -d webness_os -c "CREATE EXTENSION IF NOT EXISTS vector;"
sudo -u postgres psql -d webness_os -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

# 5. Install Redis 7
sudo apt install -y redis-server
sudo systemctl enable redis-server

# 6. Install Nginx + Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# 7. Install Cloudflared
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb

# 8. Setup firewall
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

# 9. Anti-idle cron job (CRITICAL for free tier!)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/bin/head -c 1 /dev/urandom > /dev/null 2>&1") | crontab -
```

### Environment Variables (.env)
```bash
# On the VPS, create /home/ubuntu/webness-os/.env
DATABASE_URL="postgresql://webness:YOUR_SECURE_PASSWORD@localhost:5432/webness_os"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="GENERATE_A_64_CHAR_RANDOM_STRING"
JWT_REFRESH_SECRET="GENERATE_ANOTHER_64_CHAR_RANDOM_STRING"
AI_BRAIN_KEY="GENERATE_A_SECRET_KEY_FOR_BRAIN_AUTH"
PORT=3001

# Payment keys (add later)
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# RAZORPAY_KEY_ID=
# RAZORPAY_KEY_SECRET=

# WhatsApp (add later)
# WHATSAPP_VERIFY_TOKEN=
# WHATSAPP_ACCESS_TOKEN=

# APIs (add later)
# SERPER_API_KEY=
# RESEND_API_KEY=
```

---

## 6. Cloudflare Tunnel Setup

### On Your LOCAL PC (not the VPS):
```bash
# 1. Install Cloudflared on Windows
# Download: https://github.com/cloudflare/cloudflared/releases
# Or via winget:
winget install Cloudflare.cloudflared

# 2. Login to Cloudflare
cloudflared tunnel login
# This opens a browser — authorize with your Cloudflare account

# 3. Create the tunnel
cloudflared tunnel create webness-brain
# Note the TUNNEL_ID (UUID) it gives you

# 4. Create config file at ~/.cloudflared/config.yml
```

### config.yml (on your LOCAL PC):
```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/USER/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: brain.webness.in
    service: http://localhost:8000
  - service: http_status:404
```

### DNS Setup in Cloudflare:
```bash
# 5. Route DNS
cloudflared tunnel route dns webness-brain brain.webness.in

# 6. Run the tunnel
cloudflared tunnel run webness-brain

# To run as Windows service:
cloudflared service install
```

---

## 7. Local AI Brain Setup (Ollama + Models)

### A) Install Ollama on Your PC
```bash
# Windows: Download from https://ollama.com/download/OllamaSetup.exe
# Or via winget:
winget install Ollama.Ollama

# Verify it's running:
ollama --version
```

### B) Download AI Models (RTX 3060, 8GB VRAM)

Here's the **optimal model roster** for your hardware:

| Model | Command | Size | VRAM | Use Case | Priority |
|---|---|---|---|---|---|
| **Qwen 3 (8B)** | `ollama pull qwen3:8b` | 4.9GB | ~6GB | **Router/Classifier + General reasoning** — Latest Qwen with thinking mode | 🔴 CRITICAL |
| **DeepSeek-R1 (8B)** | `ollama pull deepseek-r1:8b` | 4.7GB | ~5.5GB | **Deep reasoning, criticism, analysis** — Chain-of-thought | 🔴 CRITICAL |
| **Gemma 3 (4B)** | `ollama pull gemma3` | 3.3GB | ~4GB | **Fast tasks, summaries, quick generation** — Google's latest, fits easily | 🔴 CRITICAL |
| **Qwen 2.5 Coder (7B)** | `ollama pull qwen2.5-coder:7b` | 4.7GB | ~5.5GB | **Code generation, technical tasks** | 🟡 HIGH |
| **nomic-embed-text** | `ollama pull nomic-embed-text` | 274MB | ~0.3GB | **Embeddings for RAG/pgvector** — Runs alongside any model | 🔴 CRITICAL |
| **Llama 3.2 (3B)** | `ollama pull llama3.2` | 2.0GB | ~3GB | **Lightweight backup, fast drafts** | 🟢 NICE |
| **Gemma 3 (1B)** | `ollama pull gemma3:1b` | 815MB | ~1.5GB | **Ultra-fast classification, routing** | 🟢 NICE |

### Download Commands (run these one by one):
```bash
ollama pull qwen3:8b
ollama pull deepseek-r1:8b
ollama pull gemma3
ollama pull qwen2.5-coder:7b
ollama pull nomic-embed-text
ollama pull llama3.2
ollama pull gemma3:1b
```

### ⚠️ 8GB VRAM Rules:
- **ONE 7B/8B model loaded at a time** — Ollama hot-swaps in ~2 seconds
- **nomic-embed-text is tiny** (~300MB) — can run alongside ANY model
- **Never try to load a 14B+ model** — It will crash or run at 1 token/sec via RAM fallback
- **GPU Memory Check:** `nvidia-smi` to verify VRAM usage

### Verify Installation:
```bash
ollama list               # Shows all downloaded models
ollama run qwen3:8b       # Test chat with Qwen 3
ollama run deepseek-r1:8b # Test DeepSeek reasoning
```

---

## 8. Multi-Model AI Loop Architecture ("Hydra Brain")

### The Core Philosophy
Instead of using ONE model for everything, Webness OS uses a **multi-model pipeline** where each model does what it's best at. The result passes through multiple "brains" for maximum quality.

### The Hydra Brain Pipeline
```
User Request → FastAPI Router
       │
       ▼
┌──────────────────────────────────────────┐
│  STAGE 1: ROUTER (Gemma 3 1B or 4B)     │
│  - Classifies the task type              │
│  - Picks the right pipeline              │
│  - Ultra-fast (<0.5s)                    │
│  - Determines complexity level           │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  STAGE 2: PLANNER (Qwen 3 8B)           │
│  - Breaks task into steps                │
│  - Creates execution plan                │
│  - Considers all possibilities           │
│  - Sets quality criteria                 │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  STAGE 3: EXECUTOR (Task-specific model) │
│  - Content: Qwen 3 8B                   │
│  - Code: Qwen 2.5 Coder 7B             │
│  - Analysis: DeepSeek-R1 8B             │
│  - Quick drafts: Gemma 3 4B             │
│  - Executes with embedded instructions   │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  STAGE 4: CRITIC (DeepSeek-R1 8B)       │
│  - Reviews output quality                │
│  - Checks for errors/hallucinations      │
│  - Scores output 1-10                    │
│  - If score < 7: LOOP BACK to Stage 3   │
│  - Applies chain-of-thought reasoning    │
└──────────┬───────────────────────────────┘
           │ (if score >= 7)
           ▼
┌──────────────────────────────────────────┐
│  STAGE 5: POLISHER (Qwen 3 8B)          │
│  - Final refinement                      │
│  - Brand voice alignment (RAG)           │
│  - Format/style consistency              │
│  - Human-level quality check             │
└──────────┬───────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│  STAGE 6: SELF-EDUCATION (Background)    │
│  - Store (input, output) in pgvector     │
│  - If user edits output → store delta    │
│  - Build few-shot example bank           │
│  - Next time: retrieve similar examples  │
│  - Model improves per-client over time   │
└──────────────────────────────────────────┘
```

### Key Design Decisions
1. **Critic Loop (max 3 iterations):** If the Critic rejects output 3 times, the system returns the best attempt with a quality warning
2. **Model Hot-Swap Time:** ~2 seconds per model switch. A 6-stage pipeline with 4 model switches = ~8 seconds overhead. Worth it for quality.
3. **Parallel Embeddings:** nomic-embed-text runs alongside any model, so RAG retrieval happens in parallel with generation
4. **Failover Chain:** If local brain is down → DeepInfra API → OpenRouter → OpenAI (escalating cost)
5. **Streaming:** Each stage streams progress via SSE so the user sees "Routing... Planning... Generating... Reviewing... Polishing..."
6. **Decision Engine:** The Planner (Stage 2) considers ALL possibilities like a human manager would — it weighs pros/cons, checks past results, and makes business-aware decisions

### FastAPI Implementation Pattern
```python
# apps/brain/src/pipeline/hydra.py (will be implemented in Phase 1)

async def hydra_pipeline(task: TaskRequest) -> TaskResult:
    """Multi-model pipeline for maximum quality output."""
    
    # Stage 1: Route (fast model)
    route = await route_task(task, model="gemma3:1b")
    yield_progress("routing", route)
    
    # Stage 2: Plan (smart model)
    plan = await plan_execution(task, route, model="qwen3:8b")
    yield_progress("planning", plan)
    
    # Stage 3 + 4: Execute + Critic Loop
    executor_model = pick_executor(route.task_type)
    best_result = None
    for attempt in range(3):
        result = await execute_task(task, plan, model=executor_model)
        yield_progress(f"executing_attempt_{attempt+1}", result)
        
        critique = await critique_result(task, result, model="deepseek-r1:8b")
        yield_progress("critiquing", critique)
        
        if critique.score >= 7:
            best_result = result
            break
        best_result = result  # Keep best attempt
    
    # Stage 5: Polish
    polished = await polish_output(best_result, task.client_brand_voice, model="qwen3:8b")
    yield_progress("polishing", polished)
    
    # Stage 6: Self-Education (background, don't block)
    asyncio.create_task(store_learning(task, polished))
    
    return polished
```

---

## 9. AI Fine-Tuning for Business

### Can You Train AI Models for Your Business? YES — Here's How:

### Level 1: Prompt Engineering (FREE, No Training Needed) ← START HERE
- **What:** Custom system prompts per tool that define personality, rules, output format
- **How:** Ollama Modelfiles with `SYSTEM` directives
- **Example:**
  ```
  FROM qwen3:8b
  SYSTEM """
  You are Webness AI, a professional digital marketing assistant.
  You work for a full-service digital agency called Webness.
  You always write in a professional but approachable tone.
  You NEVER hallucinate statistics. If unsure, say so.
  You format output as structured JSON when requested.
  """
  PARAMETER temperature 0.7
  ```
- **Create:** `ollama create webness-writer -f ./Modelfile`
- **Effectiveness:** 70-80% of what you need

### Level 2: RAG (Retrieval Augmented Generation) ← IMPLEMENT IN PHASE 1
- **What:** Store your business knowledge in pgvector. Before generating, retrieve relevant context and inject it into the prompt.
- **How:** When a client asks for a blog about "dental SEO", the system:
  1. Embeds the query with nomic-embed-text
  2. Searches pgvector for similar past outputs, brand guidelines, industry knowledge
  3. Injects the top 5 results as context in the prompt
  4. The model writes WITH your business knowledge
- **Effectiveness:** 85-95% of what you need
- **This is our Self-Education Loop** — the more you use it, the smarter it gets

### Level 3: Few-Shot Learning ← IMPLEMENT IN PHASE 2
- **What:** Store (input, ideal_output) pairs. When similar tasks come in, include 2-3 examples in the prompt.
- **How:** User corrects an AI output → store both versions → next time, show the model "here's what you did last time and here's the corrected version"
- **Effectiveness:** 90-95% — models learn YOUR style

### Level 4: LoRA Fine-Tuning ← FUTURE (When Ready)
- **What:** Actually modify the model weights to specialize it for your tasks
- **How:** 
  1. Collect 500-1000 high-quality (instruction, response) pairs from your best work
  2. Use tools like `unsloth` or `axolotl` to fine-tune a LoRA adapter
  3. The LoRA adapter is tiny (50-200MB) and sits ON TOP of the base model
  4. Import back into Ollama via GGUF format
- **Hardware Required:** RTX 3060 CAN do LoRA fine-tuning on 7B models (with quantization)!
  - QLoRA (4-bit quantized LoRA) fits in 8GB VRAM for 7B models
  - Training takes 1-4 hours for 1000 examples
- **Effectiveness:** 95%+ — the model becomes YOUR model

### Level 5: Full Fine-Tuning ← NOT RECOMMENDED FOR US
- Requires 40GB+ VRAM (A100 GPU)
- Use Level 4 (LoRA) instead — 95% of the benefit at 5% of the cost

### Can AI Be Trained to Do New Tasks?
**YES, absolutely.** Through LoRA fine-tuning, you can teach a model to:
- ✅ Write in YOUR brand voice
- ✅ Follow YOUR specific output formats
- ✅ Understand YOUR industry terminology
- ✅ Generate YOUR style of SEO audits
- ✅ Make business decisions based on YOUR criteria
- ✅ Work with YOUR bots and agents (it learns the API patterns)
- ✅ Act as a specialized business manager (trained on your SOPs)

### Training Pipeline (When Ready):
```
1. Collect Data → From corrected outputs (Self-Education Loop stores these)
2. Format Data → Convert to (instruction, response) JSONL pairs
3. Fine-Tune → QLoRA on RTX 3060 using unsloth/axolotl (~2-4 hours)
4. Export → Convert to GGUF format
5. Import → `ollama create webness-custom -f Modelfile` (FROM ./model.gguf)
6. Deploy → Replace base model in pipeline with fine-tuned version
7. Repeat → Every month, fine-tune again with new corrections
```

---

## 10. MCP Servers Needed

### What MCP Servers Are
MCP (Model Context Protocol) servers let AI tools/models access external data and capabilities. They're plugins for AI.

### MCP Servers We Need for Webness OS

| MCP Server | Purpose | Priority |
|---|---|---|
| **Filesystem** | Let AI read/write project files | 🔴 DAY 1 |
| **PostgreSQL** | Let AI query the database directly | 🔴 DAY 1 |
| **Brave Search** | Web search for SEO auditor & researcher | 🔴 PHASE 1 |
| **Puppeteer/Playwright** | Web scraping for SEO data | 🔴 PHASE 1 |
| **GitHub** | Code management, deployments | 🟡 PHASE 0 |
| **Memory** | Persistent memory for AI agents | 🟡 PHASE 1 |
| **Fetch** | HTTP requests to APIs | 🟡 PHASE 1 |
| **Google Search Console** | SEO data access | 🟡 PHASE 1 |
| **Slack/Discord** | Notification integrations | 🟢 PHASE 4 |
| **Cloudflare** | Tunnel management, R2 storage | 🟢 PHASE 2 |

### Do We Need a Hostinger MCP?
**NO — not as an MCP server.** Here's why:
- Hostinger shared hosting (Business plan) is used ONLY for the static landing page (webness.in)
- There's no "Hostinger MCP" that exists
- What we CAN do with Hostinger:
  - ✅ **Deploy static landing page** via FTP/SFTP or Git deployment
  - ✅ **Use Hostinger DNS** to point subdomains to Oracle Cloud IP
  - ✅ **Use Hostinger Email** if it comes with the business plan
  - ✅ **SSL** is handled by Hostinger for the main domain

### Hostinger Integration Plan
- `webness.in` → Hosted on Hostinger (static landing page + marketing site)
- `app.webness.in` → CNAME to Oracle Cloud IP (client dashboard)
- `admin.webness.in` → CNAME to Oracle Cloud IP (admin dashboard)
- `api.webness.in` → CNAME to Oracle Cloud IP (Express API)
- `brain.webness.in` → Cloudflare Tunnel (local AI brain)

### DNS Setup in Hostinger:
```
Type    Name      Value                  TTL
A       @         HOSTINGER_IP           3600    (main site stays on Hostinger)
A       app       ORACLE_PUBLIC_IP       3600    (client dashboard)
A       admin     ORACLE_PUBLIC_IP       3600    (admin dashboard)
A       api       ORACLE_PUBLIC_IP       3600    (API server)
CNAME   brain     TUNNEL_ID.cfargotunnel.com  3600  (Cloudflare tunnel)
```

---

## 11. Hostinger Business Plan — What We Use It For

| Feature | How We Use It |
|---|---|
| **Web Hosting** | Static landing page (webness.in) — HTML/CSS/JS or simple React build |
| **Free Domain** | If you got a free domain with the plan |
| **SSL** | Auto-SSL for webness.in |
| **Email** | Business email (you@webness.in) for professional communication |
| **DNS Management** | Point subdomains (app, admin, api) to Oracle Cloud |
| **File Manager/FTP** | Deploy landing page updates |
| **MySQL** | NOT used — we use PostgreSQL on Oracle Cloud |
| **1.5GB RAM** | NOT enough for our stack — that's why we use Oracle Cloud |

---

## 12. New Agent/Bot Ideas Log

### Confirmed for Development
These are queued for implementation in the roadmap:

| Agent/Bot | Description | Phase |
|---|---|---|
| **SEO Auditor** | Free lead magnet — comprehensive site audit | Phase 1 |
| **Researcher AI** | Deep web research + summarization | Phase 2 |
| **Blog Writer** | Full content pipeline (outline → draft → polish → images) | Phase 3 |
| **Social Media Manager** | Multi-platform post scheduling & analytics | Phase 5+ |
| **WhatsApp Bot** | Business support bot per client | Phase 5+ |
| **Invoice Generator** | PDF invoice/receipt creation | Phase 5+ |
| **Accounting Bot** | Basic P&L and expense tracking | Phase 5+ |
| **Graphic Designer** | AI logos, banners, social graphics (ComfyUI) | Phase 6 |
| **LinkedIn Manager** | Post scheduling, engagement, profile optimization | Phase 5+ |

### New Ideas (Noted for Future)
| Idea | Description | Complexity | Notes |
|---|---|---|---|
| **Instagram Viral Reels Generator** | AI generates reel ideas based on trending topics, niche analysis, and viral patterns. Phase 1: Text ideas + scripts. Phase 2: When video gen is affordable, auto-create reels and auto-post to Instagram. | 🟡 Medium (ideas) → 🔴 Hard (video gen) | Start with idea generation + scripts only. Video generation needs either: a) Cloud GPU API ($$) or b) much better local GPU. Auto-posting requires Instagram Graph API approval. |
| **Free Keyword Research Tool** | AI-powered keyword research combining SERP analysis, search volume estimation, competition scoring, and marketing suggestions. Can double as a lead magnet alongside SEO Auditor. | 🟡 Medium | Great lead gen tool. Uses Serper.dev API + AI analysis. Can be FREE tier to attract users. Pairs perfectly with SEO Auditor. |
| **AI Business Manager** | Train a specialized model (via LoRA fine-tuning) that acts as a virtual business manager — analyzes metrics, makes recommendations, escalates issues, plans strategies. | 🔴 Hard | This IS the Shadow Manager (already planned). Will become more capable as we fine-tune models on business data over time. |

---

## API Keys Status

### Keys We Need (add to .env when ready)
| Service | Status | Notes |
|---|---|---|
| Oracle Cloud SSH Key | 🔴 NEEDED NOW | Generated during VM creation |
| PostgreSQL Password | 🔴 NEEDED NOW | Set during DB setup on VPS |
| JWT Secret | 🔴 NEEDED NOW | Generate: `openssl rand -hex 32` |
| JWT Refresh Secret | 🔴 NEEDED NOW | Generate: `openssl rand -hex 32` |
| AI Brain Key | 🔴 NEEDED NOW | Generate: `openssl rand -hex 32` |
| Grok API Key | 🟡 User has | Add when connecting external AI failover |
| OpenAI API Key | 🟡 User may have | Add when connecting external AI failover |
| Serper.dev | 🟡 Phase 1 | 2500 free queries, needed for SEO tools |
| Stripe | 🟢 Phase 4 | Payment processing |
| Razorpay | 🟢 Phase 4 | Indian payments |
| WhatsApp Cloud API | 🟢 Phase 5 | Meta Business verification needed |
| Meta/Instagram Graph API | 🟢 Phase 5+ | Facebook App required |
| LinkedIn API | 🟢 Phase 5+ | LinkedIn Dev App approval |

---

*This document is a living guide. Update it as you complete each step.*
