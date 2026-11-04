# Learning village prototype — local review

Baseline fetched and verified: `46758a69fe88ebc39281a7b3edac86aa9a62da50` (main, November 4, 2026).
Branch: `codex/chorecoins2-learning-redesign`. Prepared for publication as a separate GitHub branch at the user’s request. No merge, live API call, or migration was performed. The branch now explicitly disables Vercel Git deployment in vercel.json, preserving the two existing branch guards. The GitHub workflow runs on PR/manual dispatch, not branch pushes; this does not disable Vercel previews.

## Try it

Node 24 and npm (validated with 24.22.1 / 11.9.0); Chromium for browser checks.

```sh
cd /workspace/chorecoins2
npm ci --no-audit --no-fund --cache /tmp/chorecoins-npm-cache
npm run dev -- --host 127.0.0.1 --port 8080 --strictPort
```

Use a new isolated browser profile and local origin. Open `/?learningPrototype=on`. No credentials or fixtures are needed. The URL flag is explicit and off by default. Only the exact value `on` enables it. Two synthetic owners are available in the selector. Use “Back to classic” or remove the query to return to normal routes. Classic authentication continues to have its existing requirements; the prototype does not authenticate a real account.

For a fully network-intercepted, credential-free session, run `node scripts/test-prototype-browser.mjs`. This starts Vite with environment-file loading disabled, mocks classic auth for the flag-off check, launches a disposable Chromium profile, blocks every unexpected external HTTP(S) request, and closes the browser afterward. It exercises the actual main entry and rendered prototype, not a replacement component.

## What changed

- `src/main.tsx`: lazy entry selection; the prototype never imports the classic App/auth/service modules and never registers the service worker. The default path still loads App.
- `src/prototype/Prototype.tsx`: village hub, original CSS shop scene, existing Nova image, three three-step lessons, choice-based supply budget and two customer transactions, hints/retry, easy/harder numbers, resume/replay and completion views.
- `src/prototype/model.ts`: arithmetic, strict input validation, versioned storage, isolated cosmetic receipts.
- `src/prototype/prototype.css`: scoped desktop/phone styles, focus treatment and reduced-motion rule. No new dependencies, sound, analytics or external assets.
- Tests and this report, with screenshots in `screenshots/`.

Existing content verified: four learning modules with seven lessons; classic games include Money Detective, Treasure Island Budget and Money Tree Grower. Classic reward entry points include LessonContent, LearnAndEarn and each of those game components, all calling useGamification.completeLesson. That function increments aggregate totals and does not take a stable lesson identity. Classic Learn distributes the aggregate count across modules. These are existing replay/reward and historical-truth concerns, left untouched; this prototype does not call any of those paths or infer completion from them. Separate investment and trading routes are unchanged.

## Persistence and rollback

Only `chorecoins:learning-prototype:v1:<demo-owner>:<mission>` and its `:complete` receipt are used. No conversion, import, balance repair or legacy data adoption occurs. Turning off the flag leaves all bytes in place. Removing the prototype namespace in an isolated test profile resets only this prototype; do not clear all local storage.

Missing records start empty. Partial, old-version, malformed and inaccessible records fail closed. Failed reads never write defaults. Failed writes leave the UI on the previous step with an error and retry opportunity. Session actions capture the synthetic owner; switching owners unmounts that session. There are no asynchronous reward callbacks.

Completion writes the same immutable string `1` to one per-owner/per-mission receipt. Repeated submissions and concurrent tabs therefore cannot create multiple cosmetic awards. Draft step writes use another key and cannot overwrite receipts. Step position is last-writer-wins; an already-open tab does not live-refresh another tab's progress. Reload/remount reads the receipts. This is NOT exactly-once wallet credit, cross-device synchronization, or a real economy. Replays begin at step one after completion. No server state exists to roll back.

## Validation evidence

Baseline before source edits: all 13 focused test files, lint, typecheck, production build and bundle scan passed. Baseline browser evidence from environment onboarding: 14 auth + 5 local + 5 alternate-flag + 7 reminder cases passed.

After changes:

```sh
npm run test:focused
npm run lint
npm run typecheck
npm run build
npm run check:bundle
node scripts/test-prototype-browser.mjs
npm run test:browser
npm run test:local-browser
LOCAL_TEST_CLOUD_VALUE=true npm run test:local-browser
npm run test:reminders-browser
```

Passed: 14 focused test files (including four new model cases), lint, typecheck, build, bundle scan, all 31 existing browser cases, and the prototype browser flow. Prototype assertions cover four completions, wrong/correct answers, hints, budget rejection, replay, remount, profile isolation, corruption preservation, quota failure, legacy sentinel preservation, reload, flag-off entry, keyboard focus, reduced-motion emulation and narrow-screen overflow. Model coverage includes both difficulty calculations, input boundaries, missing/partial/old-format/corrupt records, denied storage, duplicate receipts, stale-tab writes and quota rollback. External requests are intercepted; any attempted external HTTP(S) request fails the harness. No such requests occurred.

A screenshot sequencing error in the first new harness run was corrected and rerun; no baseline test failures were observed. Non-failing Browserslist age warnings remain; lockfiles were not updated.

Baseline JS: 1,063.13 kB (306.13 kB gzip). Final split JS: entry 148.14 kB + classic App 916.42 kB + shared asset/icon module 3.18 kB + optional prototype 12.73 kB. Prototype CSS adds 9.84 kB (2.91 kB gzip); its JS is 4.61 kB gzip. Classic CSS remains 146.77 kB. No new image downloads: Nova reuses the existing 32.03 kB asset.

Inspected screenshots: desktop and phone hub, phone lesson, desktop shop, completion, and flag-off account gate. Corrected unsupported diagonal arrow glyphs after visual inspection. No horizontal overflow in the captured layouts. The flag-off screenshot shows the existing loading gate under a deliberately unresolved auth mock, not proof of successful sign-in. Full authenticated classic before/after screenshots, manual screen-reader testing, a formal contrast audit, physical touchscreen testing, video recording, live auth/trading, and database tests were not performed. Do not treat these screenshots as a full classic-app visual regression review. The browser keyboard check covers initial Tab navigation; full assistive-technology review remains a follow-up.

## Five-minute family tryout

1. Find Continue and tell us what you expect to practice.
2. Finish Market math; deliberately give a wrong answer and try its hint.
3. Choose shop supplies, go over budget once, and adjust your plan.
4. Serve both customers and notice what changes in the village.
5. Replay, refresh, switch synthetic profiles, then return to classic.

Ask: What was fun? What was confusing? Too easy or too hard? Would you choose another activity? Record feedback manually; no child analytics are collected. The displayed time ranges are targets, not measured child-session durations.

Next: test the pace with the family, improve the shop's physical assembly/customer interactions if needed, and complete accessibility review before considering integration. Treasure Island could later replace the shop supplies with expedition gear and the customer totals with travel purchases using the same small question/choice model; no second game or generalized engine is included. Any release, hosted preview, real-account integration or wallet rewards requires separate review.
