# 🔑 Webness API Key Monetization Blueprint

This document defines the technical and commercial framework for selling programmatic access to the Webness OS AI engines. By exposing your core assets (Ebook Engine, SEO Auditor, and Blog Writer) via API keys, you create a high-margin revenue stream that requires near-zero frontend maintenance or direct customer support.

---

## 💵 1. Commercial Model: Mapped Credits

Your system is already built on a credit wallet concept. We map API requests directly to credit consumption:

| API Engine | Core Operations | Credit Cost | Retail Value (Avg $0.10/credit) |
|---|---|:---:|:---:|
| **SEO Auditor** | Crawling, SERP analysis, PageSpeed audit, AI fixes recommendations | **10 credits** | $1.00 |
| **Blog Writer** | Deep researcher query, outline planning, drafting, AI humanizing | **20 credits** | $2.00 |
| **Ebook Pipeline** | Multi-stage research, chapter outline, sequential drafts, polisher, SVGs, EPUB compiler | **100 credits** | $10.00 |

### Pricing Tiers (Stripe & Razorpay)
1. **Developer Sandbox (Free):** 50 credits/month, rate limit 3 req/min.
2. **Growth Tier ($49/mo):** 600 credits/month (extra credits at $0.08/credit), rate limit 30 req/min.
3. **Scale Tier ($149/mo):** 2,000 credits/month (extra credits at $0.06/credit), rate limit 120 req/min, custom webhooks enabled.
4. **BYOK (Bring Your Own Key) Option:** If the client provides their own OpenAI/Gemini/Groq keys, credit costs are reduced by **80%** (charging only for the execution and database orchestration layer).

---

## 🛠️ 2. Technical Protocol & Endpoints

All programmatic requests authenticate using the header:
`Authorization: Bearer wn_live_xxxxxxxxxxxxxxxxxxxxxxxx`

The backend validates the token using bcrypt against `ApiKey.hashedKey` (as implemented in `api-keys.routes.ts`).

### Endpoint 1: Ebook Manuscript Generation
- **Path:** `POST /api/tools/execute/ebook`
- **Request Body:**
```json
{
  "topic": "Houseplant Care for Beginners",
  "audience": "Urban millennials with no gardening experience",
  "authorName": "Jane Doe",
  "chapterCount": 5,
  "wordCountPerChapter": 1000,
  "tone": "conversational",
  "includeImages": true,
  "includeCta": true,
  "enableResearch": true
}
```
- **Response:**
```json
{
  "success": true,
  "taskId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "QUEUED",
  "creditCost": 100,
  "message": "Ebook manuscript job queued successfully."
}
```

### Endpoint 2: Technical & Competitor SEO Audit
- **Path:** `POST /api/tools/execute/seo-audit`
- **Request Body:**
```json
{
  "url": "https://example.com",
  "keyword": "organic plant food"
}
```
- **Response:**
```json
{
  "success": true,
  "taskId": "7a3b4c5d-6e7f-8a9b-0c1d-2e3f4a5b6c7d",
  "status": "QUEUED",
  "creditCost": 10
}
```

### Endpoint 3: Fetch Task Status & Data
- **Path:** `GET /api/projects/tasks/:taskId`
- **Response:**
```json
{
  "success": true,
  "data": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "status": "COMPLETED",
    "creditCost": 100,
    "outputData": {
      "title": "Urban Jungle: The Beginner's Guide",
      "epubUrl": "https://assets.webness.in/ebooks/manuscript-123.epub",
      "totalWordCount": 5420
    },
    "error": null,
    "completedAt": "2026-06-04T00:35:10Z"
  }
}
```

---

## 🚦 3. Queue Architecture & Fail-Safe Routing

Because the KDP Ebook Engine and SEO audits take minutes to complete, you **cannot** execute them synchronously. The API immediately queues the job in `BullMQ` (backed by Redis) and returns a `taskId`.

```
Client API Call ──> Validate Token ──> Deduct Credits ──> Push to BullMQ ──> Return taskId
                                                                 │
                                                                 ▼
                                                       Local GPU Worker
                                                   (or Cloud Model Failover)
                                                                 │
                                                                 ▼
                                                        Write Result to DB
                                                                 │
                                                                 ▼
                                                       Trigger Webhook URL
```

### Uptime Fail-Safe Flow
1. **Target Worker:** The job goes to `apps/worker` which attempts to send the task payload to your local home PC via Cloudflare Tunnel (`brain.webness.in`).
2. **Circuit Breaker:** If your home PC is offline, the circuit breaker triggers:
   - If the task is **Ebook Drafting**, it routes API calls to OpenRouter/Groq.
   - If the task is **SEO Auditing (requires Playwright)**, it routes browser requests to ScrapingBee API, keeping execution alive.
3. **Completion Webhook:** If the client specified a `webhookUrl` in the request header/body, Webness OS sends a `POST` request with the final payload once the job is complete.

---

## 📈 4. 30-Day Launch Checklist

- [ ] **Expose the Endpoints:** Wire `apps/api/src/routes/tools.routes.ts` to push incoming requests directly into the `BullMQ` task dispatcher instead of executing in-memory.
- [ ] **Generate API Docs:** Write a clean, interactive single-page API reference (Swagger/ReDoc) and host it at `webness.in/docs`.
- [ ] **Embed Stripe Billing:** Set up the webhook listener in `/api/webhooks` to auto-credit wallets when payment events are confirmed.
- [ ] **Pitch to Devs:** Post your Ebook manuscript API on Hacker News / Product Hunt / Indie Hackers: *"I built a KDP-grade book writer API. Write a book in 5 minutes with full chapter consistency."*
