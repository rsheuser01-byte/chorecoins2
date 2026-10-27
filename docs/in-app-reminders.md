# Optional app-open reminders

This separate stacked draft targets the cloud/auth branch, not main. Merge the cloud work independently only when its release gates are met; retarget this draft afterward. Both exact review branch names are excluded from Vercel Git deployments. Do not merge this draft into the cloud branch as a shortcut.

## Deliberately smaller design
Reminders appear only in the visible, signed-in app. No push permission request, service worker wakeup, background scheduler, new paid service, database migration or polling loop is needed. Closed or suspended apps do not deliver reminders. This trades background reach for low operational load and simpler behavior; no delivery guarantee is claimed.

Existing notification day/time/timezone and enabled choices remain. Existing push subscriptions and push-enabled preferences are preserved, not silently unsubscribed or overwritten. Background push controls are labeled paused. Invalid/missing IANA timezones fail closed rather than treating an old offset as DST-correct; the settings page offers an explicit device-timezone update.

The app loads only its signed-in owner's preferences on login or explicit settings reload. Timer, focus and visibility checks use that in-memory result, never server polling. Only current visible-account results may display. A local per-account occurrence receipt suppresses refresh/repeated-minute reminders on that device; storage failure suppresses reminders. It is not a global or cross-device exactly-once guarantee. Late occurrences beyond 15 minutes are skipped, not replayed as a backlog. DST gaps do not invent a skipped scheduled time; repeated local time shares an occurrence identity.

## Source-only retirement of old worker
The old send-chore-reminders handler now returns HTTP410 without loading credentials, querying or sending. No activation or deploy was performed. Existing job3 must remain inactive. Deploying a 410 response while accidentally restoring a every-minute cron would still produce unnecessary requests, so do not reactivate it. Removing the old schedule or deploying the retired handler requires explicit reviewed live approval.

Production target independently identified as fzlvrgmphdbupwqdiowl; repository config has referenced a different project. Never run deployment commands using that default. No secret or permission changes accompany this draft.

## Release/rollback
Parent release approval, privacy and applicable cloud prerequisites remain separate. Keep the existing paused scheduler and preferences throughout rollout/rollback. If the app-open UI causes problems, revert its application commit; do not restore the old polling scheduler. Tests use synthetic accounts, clocks and mocked preference APIs, not live push/auth credentials.
