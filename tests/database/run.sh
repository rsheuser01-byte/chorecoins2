#!/usr/bin/env bash
set -euo pipefail
# Must point to an explicitly disposable PostgreSQL database, never a live project.
: "${TEST_DATABASE_URL:?Set TEST_DATABASE_URL to a disposable PostgreSQL database}"
: "${ALLOW_DISPOSABLE_DB_BOOTSTRAP:?Set ALLOW_DISPOSABLE_DB_BOOTSTRAP=yes for the disposable test database}"
[[ "$ALLOW_DISPOSABLE_DB_BOOTSTRAP" == yes ]] || exit 1
root="$(cd "$(dirname "$0")/../.." && pwd)"
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$root/tests/database/bootstrap.sql"
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$root/supabase/migrations/20261027021500_account_progress_sync.sql"
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$root/tests/database/account-progress.sql"
# Concurrent first writes at the same version must yield exactly one winner.
a="$(mktemp)"; b="$(mktemp)"
trap 'rm -f "$a" "$b"' EXIT
write_once() {
  psql "$TEST_DATABASE_URL" -X -qAt -v ON_ERROR_STOP=1 <<SQL
SET ROLE authenticated;
SET request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
SELECT public.commit_account_progress(0, '$1', '{"chores":"$2"}')->>'status';
SQL
}
write_once '55555555-5555-4555-8555-555555555555' first >"$a" & first=$!
write_once '66666666-6666-4666-8666-666666666666' second >"$b" & second=$!
wait "$first"; wait "$second"
[[ "$(cat "$a" "$b" | sort | tr '\n' ' ')" == 'applied conflict ' ]]
echo 'Concurrent same-version writes: exactly one applied, one conflict'
