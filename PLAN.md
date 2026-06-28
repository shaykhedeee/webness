# Webness Decision Lab + Clean GitHub Attach

## Summary
- Use `webness-os` as the clean product repository for `shaykhedeee/webness`.
- Do not commit raw scattered notes, unfiltered notes, `webness.txt`, `info.md`, or any `.env.local` files.
- Build a living strategy layer first, because Webness is still undecided: Webness OS, Webness Forge, agency services, MCP tools, and micro-SaaS ideas need to be compared before deeper implementation.
- Treat “unfiltered” research as rejected for product direction. Webness should be a strict safe stack: privacy, local control, approvals, and security without uncensored/bypass behavior.

## Key Changes
- Create curated strategy docs inside `webness-os/docs/strategy/`:
  - `WEBNESS_CONTEXT_DIGEST.md`: distilled summary of all scanned docs, Dribbble brand evidence, current repo state, and known contradictions.
  - `WEBNESS_DECISION_LOG.md`: decisions made, open decisions, tradeoff matrix, next analysis queue.
  - `GITHUB_IMPORT_NOTES.md`: what was included/excluded and why.
- GitHub attach flow:
  - Initialize git inside `webness-os`.
  - Set branch to `main`.
  - Add remote `origin` as `https://github.com/shaykhedeee/webness.git`.
  - Verify remote is still empty before pushing; if it has refs later, fetch and stop for review.
  - Commit only sanitized product code plus curated strategy docs.
- Repository hygiene:
  - Keep `.env`, `.env.local`, model files, build outputs, caches, and local-only assets ignored.
  - Run a pre-commit secret scan and abort if any real keys/secrets are found.
  - Preserve `blog builder` and raw research outside the first clean repo import.

## Analysis Work
- Convert the scattered material into a decision matrix comparing:
  - Webness OS: client portal, tools, billing, agency dashboard.
  - Webness Forge: private/local AI engine and internal automation layer.
  - Agency-first revenue: AI-powered services using internal tools.
  - MCP/API products: later monetizable tooling for other agencies.
  - Narrow micro-SaaS wedge: fastest shippable business-specific product.
- Score each by revenue speed, technical risk, brand fit, current assets, defensibility, safety/compliance, and 30-day shippability.
- Record current facts:
  - `webness.in` currently shows a Hostinger expired-domain page.
  - Dribbble positions Webness as “Webness Agency” in India with web/design/ecommerce/healthcare/interior/construction portfolio signals.
  - The current codebase has known wiring/typecheck gaps that should be documented before product work continues.

## Test Plan
- Verify git state: `git status`, `git remote -v`, `git branch --show-current`.
- Verify remote state with `git ls-remote`.
- Run secret scan before commit.
- Run existing checks from `webness-os`; record failures instead of hiding them.
- Confirm excluded files are not tracked: scattered raw docs, `.env.local`, old massive dumps, and private research.

## Assumptions
- `shaykhedeee/webness` is the product repo, not the raw research vault.
- Existing repo visibility will be preserved; sanitized contents should be safe even if public.
- Initial commit can include current code state plus strategy docs, with known issues documented rather than silently fixed.
- Strict safe stack means no uncensored model behavior, bypass prompts, or client-facing unsafe automation.
