# GitHub Import Notes

Date: 2026-05-23

Target repository: `https://github.com/shaykhedeee/webness.git`

## Import Boundary

The first GitHub import should use `webness-os` as the repository root.

Included:

- Product source code under `apps`, `packages`, and `infra`.
- Root workspace config such as `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.base.json`, `.gitignore`, and `.env.example`.
- Curated strategy docs under `docs/strategy`.

Excluded:

- Parent-workspace raw research files such as `SCATTEREDINFO_WEBNESS.md`, `SCATTEREDINFO_WEBNESS_UNFILTER.md`, `webness.txt`, and `info.md`.
- The `blog builder` prototype and its `.env.local`.
- Any `.env`, `.env.local`, `.env.*.local`, private keys, local model files, generated build outputs, caches, and TypeScript build metadata.

## Reasoning

The target GitHub repo should be understandable to a future engineer, investor, or collaborator. Raw research files are useful as private context, but they are too noisy and risky for the initial product import.

The clean import preserves the useful product skeleton while keeping strategy memory in curated form.

## Pre-Commit Checklist

- Verify `git status` from `webness-os`.
- Verify remote refs with `git ls-remote`.
- Run a secret scan over the repo before staging.
- Run existing checks and document failures.
- Stage only files inside `webness-os`.
- Confirm ignored files such as `.env.local`, `node_modules`, `dist`, `.next`, `*.tsbuildinfo`, and model artifacts are not tracked.

## Known State At Import

- The remote resolved with no refs during planning, which indicates an empty repository or no default branch exposed yet.
- `webness-os` was not a git repository before this import.
- Existing TypeScript checks are expected to fail until the app config issues are fixed.
- Product docs mention future directories that do not exist yet, including `apps/brain` and top-level `tools`.

## Verification Results

- Secret scan result: no high-confidence real secrets found. Matches were placeholders in `.env.example`, environment variable names in source code, and Cloudflare/Razorpay/Stripe references in docs or config.
- Environment file scan: only example env files were found inside `webness-os`; real `.env.local` files remain outside this product repo boundary.
- Typecheck result: `pnpm typecheck` currently fails in `apps/web` with TS6059 because files such as `apps/web/next.config.ts`, `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`, and `apps/web/tailwind.config.ts` are outside the inherited `rootDir` of `webness-os/src`.

## Push Rule

If the remote has refs when the import is attempted, stop before pushing. Fetch and review instead of overwriting or merging blindly.
