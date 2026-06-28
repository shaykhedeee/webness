# Webness Decision Log

Date: 2026-05-23

This log tracks product decisions for Webness. It should be updated whenever new research, customer evidence, or implementation reality changes the plan.

## Decisions Made

| Decision | Status | Rationale |
| --- | --- | --- |
| Use `webness-os` as the clean product repository | Locked | Keeps GitHub focused on product code and curated strategy instead of raw research dumps. |
| Exclude raw scattered notes from GitHub import | Locked | The raw notes contain private, duplicated, unsafe, and exploratory material that should stay outside the public product repo. |
| Treat Webness as a strict safe stack | Locked | The product should be privacy-first and autonomous where appropriate, but not uncensored, bypass-oriented, or unsafe for clients. |
| Create a living strategy layer before deeper implementation | Locked | Webness still has multiple possible futures; decisions need to be explicit before the build expands. |
| Preserve agency evidence as a core asset | Locked | Dribbble shows Webness already has credible web/design portfolio signals that should shape positioning. |
| Build Signal Room as the first paid wedge | Locked | The strongest market/code fit is an AI client-update, reporting, and execution autopilot for small agencies, while Webness OS remains the private operating spine. |
| Delay public API-key monetization | Locked | API access should come after the reporting/execution workflow is reliable, documented, metered, and proven with paying users. |

## Decision Matrix

Scores are 1 to 5. For `Technical ease`, higher means easier to ship safely with the current assets.

| Path | Revenue speed | Technical ease | Brand fit | Current assets | Defensibility | Safety fit | 30-day shippability | Total | Read |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Agency-first revenue | 5 | 4 | 5 | 4 | 3 | 5 | 5 | 31 | Best near-term cash path. Use internal AI tools to sell better services now. |
| Narrow micro-SaaS wedge | 4 | 3 | 3 | 2 | 4 | 5 | 4 | 25 | Strong if a niche is chosen, but the niche is not locked yet. |
| Webness OS | 3 | 2 | 5 | 3 | 5 | 5 | 2 | 25 | Strong long-term platform, but too broad to finish quickly without a wedge. |
| MCP/API products | 3 | 2 | 4 | 2 | 4 | 4 | 2 | 21 | Better as a later monetization layer after internal workflows are proven. |
| Webness Forge private engine | 2 | 2 | 4 | 2 | 4 | 3 | 2 | 19 | Useful as internal infrastructure later, but should not lead the product now. |

## Current Recommendation

Build **Webness Signal Room** first.

Signal Room is the public paid wedge: an AI client-update, reporting, and execution autopilot for small agencies, freelancers, and web/SEO consultants.

Keep Webness OS as the private life-and-business operating spine for the founder. Keep API keys as a later monetization layer after Signal Room proves stable workflows, generated reports, tasks, billing, and support boundaries.

## Open Decisions

| Decision | Why it matters | Default until changed |
| --- | --- | --- |
| First wedge/customer niche | Determines landing copy, tool priority, onboarding, and sales motion. | Solo and small agencies/freelancers serving local businesses. |
| First paid offer | Determines what gets shipped first: service package, audit, dashboard, or automation. | Signal Room Beta: setup fee plus monthly client-room subscription. |
| Webness OS vs agency service packaging | Determines whether the first launch sells software access or outcomes. | Sell outcomes first; keep software internal until stable. |
| Hardware capacity | Determines realistic local model size and routing architecture. | Assume constrained local GPU until verified. |
| Domain recovery | Determines public launch readiness. | Restore `webness.in` before external launch. |

## Next Analysis Queue

- Build the first Signal Room loop: client room, signal intake, AI narrative report, action board, approval, and shareable update.
- Audit `webness-os` for the minimum runnable path: auth, first tool, task queue, SSE, credits, dashboard result view.
- Convert Dribbble portfolio into case-study style proof for the landing page.
- Restore the public domain or deploy a temporary trusted launch URL.
- Clean up landing URLs, domain references, and stale launch copy.
- Resolve GPU VRAM and local AI deployment assumptions.

## Safety Standard

Every new feature must answer:

- What user or client data does this touch?
- What action can it perform without human review?
- Is the action reversible?
- Is there an audit trail?
- Can one tenant see another tenant's data?
- Does the feature increase trust in Webness?

If the answer is unclear, the feature stays internal or behind an approval gate.
