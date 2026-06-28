# Webness API Platform Decision

Date: June 4, 2026

This document decides what to do with the API-key monetization idea.

## Decision

Keep the Webness API platform, but do not make it the first public business.

API access becomes Phase 2 after Signal Room has proven workflows, stable outputs, and paying users.

## Why Not API First

The API-key idea is attractive because it sounds low-maintenance:

- developers self-serve,
- credits meter usage,
- no heavy UI,
- high-margin endpoints,
- no client meetings.

But the current implementation and market reality make API-first risky.

### Current implementation gaps

The codebase already has a good start:

- `ApiKey` model exists in Prisma.
- `api-keys.routes.ts` can create and revoke `wn_live_...` keys.
- `Tool`, `Task`, `CreditWallet`, and `CreditTransaction` exist.
- `tools.routes.ts` queues tool tasks for authenticated users.

But a public API still needs:

- API-key authentication middleware.
- Scope checks for `tools.execute`, `tasks.read`, `credits.read`.
- Endpoint versioning.
- Rate limiting by key.
- Usage metering per key.
- Idempotency keys.
- Webhook delivery and retries.
- API docs.
- Error standards.
- Refund logic for failed tasks.
- Abuse monitoring.
- Uptime fallback.
- Output schemas that are stable enough for developers.

The current Brain tool execution is still a generic local LLM prompt wrapper. That is not enough for public developer trust.

### Legal/security problem with "selling API keys"

Do not sell third-party provider API keys.

OpenAI's Services Agreement says customers may not buy, sell, or transfer API keys with third parties. OpenAI's API key safety docs also say keys should not be shared or exposed client-side.

The compliant model is:

> Webness sells Webness API keys for Webness workflows. Webness may use OpenAI/Gemini/Groq/OpenRouter/local models behind the scenes according to provider terms, or customers may bring their own keys securely.

### Business problem

API users are demanding:

- they expect docs,
- they expect uptime,
- they expect predictable JSON,
- they expect support when integrations fail,
- they churn fast if outputs are inconsistent.

This is not passive until the workflow is mature.

## The Correct API Strategy

Build API after the Signal Room workflow is proven.

### Phase 1: Internal API only

Use internal routes to power the dashboard:

- generate report,
- ingest signals,
- create action items,
- approve report,
- send report.

### Phase 2: Private beta API

Give API access to 2 to 3 trusted agency users only.

Expose:

- `POST /api/v1/client-rooms`
- `POST /api/v1/client-rooms/:id/signals`
- `POST /api/v1/client-rooms/:id/reports`
- `GET /api/v1/reports/:id`
- `POST /api/v1/reports/:id/send`
- `GET /api/v1/usage`

### Phase 3: Public API

After at least 100 reports are generated and 10+ agencies/accounts use the product, publish docs and sell credits.

### Phase 4: Marketplace

List specific endpoints on RapidAPI or similar marketplaces only after reliability is proven.

## API Products To Sell

### 1. Signal Room API

Best first API because it is tied to the core SaaS:

- weekly report generation,
- action extraction,
- client update generation,
- task prioritization,
- white-label report export.

### 2. SEO Audit API

Useful but crowded. Needs real crawler and PageSpeed/Search Console integration.

### 3. Ebook Pipeline API

Potentially profitable but higher support risk:

- long-running jobs,
- output quality disputes,
- copyright/plagiarism concerns,
- customer expectations around publishing quality.

Use it later as a specialist endpoint, not first.

### 4. Blog Writer API

Do not lead with this. Google explicitly warns against scaled content abuse when many low-value pages are generated to manipulate rankings. Blog generation must be quality-first and tied to original client context.

## Pricing

Use hybrid subscription plus credits.

| Tier | Price | Credits | Use case |
| --- | ---: | ---: | --- |
| Sandbox | Free | 50/month | testing only |
| Builder | USD 49/mo | 600/month | small agency automation |
| Studio | USD 149/mo | 2,000/month | white-label workflows |
| Platform | USD 399/mo | 7,500/month | high-volume agency, webhooks, priority queue |

Credit examples:

| Operation | Credits |
| --- | ---: |
| Ingest signal | 1 |
| Generate weekly report | 15 |
| Generate action board | 5 |
| Rewrite report tone | 3 |
| Send branded report email | 2 |
| SEO crawl/audit | 20 |
| Ebook outline | 20 |
| Ebook full pipeline | 100+ |

## BYOK Policy

BYOK is valuable, but it must be designed carefully.

Rules:

- Store customer keys encrypted.
- Never return keys after save.
- Show provider-level spend warnings.
- Let users delete keys.
- Add per-org budget limits.
- Never expose provider keys in browser code.
- Use Webness API keys for client calls, not provider keys.

BYOK discount:

- Reduce AI generation credit cost.
- Still charge for orchestration, storage, reports, queues, and support.

Do not advertise "zero cost AI" too aggressively. Local AI lowers marginal cost, but reliability, review, hosting, queues, and support still cost money.

## Required Technical Work

### API middleware

Create `authenticateApiKey`:

- parse `Authorization: Bearer wn_live_...`,
- compare bcrypt hash against active keys,
- set `req.apiKey` and `req.org`,
- update `lastUsedAt`,
- enforce permissions.

### Rate limiting

Use Redis key:

`webness:api-rate:{apiKeyId}:{window}`

### Usage ledger

Create an `ApiUsageEvent` table:

```prisma
model ApiUsageEvent {
  id          String   @id @default(uuid())
  orgId       String
  apiKeyId    String
  endpoint    String
  credits     Int
  status      String
  taskId      String?
  latencyMs   Int?
  createdAt   DateTime @default(now())
}
```

### Webhooks

Create:

- `WebhookEndpoint`
- `WebhookDelivery`

With retries and signing secrets.

### Docs

Use OpenAPI/Swagger or Redoc.

Docs must include:

- auth,
- rate limits,
- endpoints,
- request/response samples,
- webhook format,
- error codes,
- credit costs,
- changelog.

## Go/No-Go Criteria For Public API

Do not launch public API until:

- 100 successful internal/private reports.
- Less than 5% failed report generation.
- No critical hallucination issues in last 20 reports.
- API-key middleware complete.
- Rate limits complete.
- Billing/credits complete.
- Webhooks complete.
- Docs complete.
- Cloud fallback complete.
- Abuse policy complete.

## Final Call

API keys are a good monetization layer. They are not the first profitable move.

First:

> Sell the outcome through Signal Room.

Then:

> Sell API access to the workflow that already works.

## Sources Used

- OpenAI Services Agreement: https://openai.com/policies/services-agreement/
- OpenAI API key safety: https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety
- Stripe billing credits: https://docs.stripe.com/billing/subscriptions/usage-based/billing-credits
- RapidAPI provider program: https://get.rapidapi.com/api-provider/
- Google Search spam policies: https://developers.google.com/search/docs/essentials/spam-policies

