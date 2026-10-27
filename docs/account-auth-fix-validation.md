# Local account/auth patch — not deployed

Base: `e2295654932b47390657cb765bd31b2dba8b8005` (main).

## Changes
- Distinguish signup requiring email verification from signup returning an authenticated session.
- Route only recovery links/events to password reset; use router navigation. Password update requires a verified SDK PASSWORD_RECOVERY event and session, not merely a claimed URL hash or unrelated signed-in session. Reloading a consumed recovery flow requires a fresh link (fail closed).
- Avoid stale modal auto-close timers; guard repeated/stale requests. Show reset/sign-out errors; retain signed-in state when sign-out fails.
- Namespace browser progress by Supabase user ID, with a separate guest namespace. Remount the data subtree on identity changes, after initial auth restoration. Captured storage adapters keep delayed callbacks tied to their original account.
- Scope chores, allowance, custom templates, gamification, simulated portfolio/market/learning progress and local profile consumers. Browser theme/audio preferences remain shared intentionally.
- Preserve all unscoped legacy values, including malformed values. Never automatically assign them to an account or delete them. An explicit legacy export button downloads only known old progress keys; no auth tokens/credential keys or new account-scoped values. Ownership/import requires a separate decision.
- Remove broad build-time process.env serialization. Only explicit public Supabase URL/key and mock-mode setting are exposed. Do not change project identity blindly: deployment environment still determines Supabase URL.

## Passed
`node --test tests/*.test.mjs` (Node 24): 13 tests for two accounts and guest, logout/login storage reuse, delayed callbacks, namespace collisions, retained legacy data, confirmation/error outcomes, recovery routing, invalid recovery plus an existing session, and synthetic private environment exclusion from evaluated Vite config.

These are helper/config tests, not rendered React integration tests, real authentication, or generated-bundle scanning.

## Blocked / not verified
- `npm ci --ignore-scripts --offline --no-audit --no-fund`: ENOTCACHED for zod tarball; no dependency cache available. This is cache unavailability, not a permission denial. No registry network bypass attempted.
- `npm run build`: vite not found. `npm run lint`: eslint not found. Type checking unavailable without TypeScript dependencies.
- Source was materialized through the GitHub connector, excluding secret .env and binary assets. Use a complete checkout with reviewed dependency installation before building.
- Real login, email delivery, Supabase health, deployed configuration, reset and logout behavior, browser Back/Forward/reopen flows, and bundle sentinel scanning remain to be validated.

## Required before publication
1. In a full clean checkout, apply patch, install locked dependencies, run build/lint/type checks, and rendered two-account tests. Verify no credentials/private sentinel strings are in generated assets.
2. With synthetic test accounts in an authorized test project, verify account switching, refresh, login/logout errors, confirmation and expired/replayed recovery links. Verify no old-account UI flashes during session restoration.
3. Review experimental database and Coinbase services separately: singleton API instances and database pending-change queue are not an authenticated per-account cloud architecture. Local namespaces do not provide secure isolation against someone with browser access, nor cross-device sync. Never claim all financial/backend features are isolated by this patch.
4. For cloud persistence, choose the authoritative Supabase project, inspect deployed schemas, implement owner IDs and RLS policies with authenticated CRUD and two-user denial tests. Preserve/export legacy data and obtain explicit ownership/import decisions before migration.
5. Suspected committed or deployed credentials need owner-authorized rotation and history/artifact response. Removing environment serialization prevents future exposure but does not revoke already exposed values. This patch does not rotate credentials or remove history.

Initial local work made no remote changes. Following explicit user approval, draft PR #1 was published on the review branch. No merge, deployment, live database write, real account action, credential rotation, or account security-setting change was performed.

## Prepared CI (not published or run remotely)
No `.github` paths existed in the pinned repository tree. `.github/workflows/validate.yml` adds pull-request/manual validation only, read-only repository permissions, no deployment and no repository secrets. It removes environment files from the ephemeral checkout without reading them, installs locked dependencies, runs focused tests/lint/typechecks/build, then scans generated assets for synthetic private sentinels and forbidden environment variable names. Actual build/typecheck may reveal pre-existing issues; none are represented as passing locally.

The review branch `codex/account-auth-isolation-20261027` is explicitly excluded from automatic Vercel Git deployments in `vercel.json`; no production branch setting is changed. The branch must be created directly at the guarded commit, never at an unguarded intermediate commit. This is a Git-integration guard, not an authorization for any deployment.

## GitHub CI result after approved publication
Run 40435963600 for head `9a2950a42586af4b4681bbd1591b66f1fcef5c8e` passed dependency installation, all 13 focused tests, lint, app and Vite-config typechecks, production build with synthetic settings, and generated-asset sentinel scan. The first run exposed narrow existing lint/type defects in the touched pages; these were corrected rather than suppressing checks. Rendered browser integration coverage is being added separately.

Rendered integration harness: `npm run test:browser` uses the locked Vite/React packages and system Chrome via CDP, a fresh browser profile, fully mocked Supabase, and blocks all non-local HTTP(S) requests. It covers loading before session restoration, two-account/logout/relogin rendering, captured old callbacks, retained legacy notice/data, signout failure, signup confirmation persistence and errors/reopen, and reset authorization/error/retry. Missing Chrome fails explicitly rather than skipping.
