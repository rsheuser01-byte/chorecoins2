# Disposable PostgreSQL ownership tests

Run only in a newly created disposable PostgreSQL 16+ database:

```sh
TEST_DATABASE_URL=postgresql://postgres:synthetic-ci-only@127.0.0.1:5432/chorecoins_test \
ALLOW_DISPOSABLE_DB_BOOTSTRAP=yes bash tests/database/run.sh
```

The bootstrap creates minimal Supabase-compatible `auth.users`, `auth.uid()`, and JWT roles. It is not a Supabase emulator and must never be run against a live project. Tests switch to `authenticated`/`anon` roles and inject synthetic JWT subjects, rather than testing all queries as a superuser. The migration is applied by the disposable administrator, as Supabase migrations normally are.

Tests cover anonymous and cross-account denial, direct write/receipt denial, own reads, version conflicts, retry idempotence, operation-ID payload reuse, concurrent first writes, atomic snapshot fields, forbidden credential keys and payload limits, monotonic completion occurrence history and no repeated completion count through a fresh operation UUID.

The single snapshot transaction does not establish server-authoritative XP, real money, or proof a chore was physically performed. Completion identities are client-generated, unique per occurrence; a count can increase only when a new unique ID is added. Other learning/achievement XP sources are outside this count invariant. Legacy baseline counts are permitted only in the initial snapshot; later snapshots cannot remove existing reward history.

## CI service proposal

Use a new `postgres:17` service with synthetic `POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=synthetic-ci-only`, `POSTGRES_DB=chorecoins_test`, port `5432:5432`, health command `pg_isready -U postgres -d chorecoins_test`. Then run the command above after checkout. No secrets, live URL, privileged Supabase key, or project credentials are needed. Fail if `psql` is unavailable; Ubuntu GitHub runners typically provide the PostgreSQL client.

## Migration preparation caveat

The SQL is a review proposal, not a live-applied migration. Supabase CLI, psql, and Docker are absent in the assistant's local executor. Therefore the initial filename was prepared locally rather than generated with `supabase migration new`; generate/verify migration history with the project CLI before an authorized live rollout. No live project was used to overcome that tooling limitation.

The public read RPC is security-invoker. The commit RPC is an invoker wrapper around a private security-definer mutator; the latter is required to write the snapshot and idempotency receipt atomically while denying all direct client writes. It derives owner only from `auth.uid()`, uses an empty search path and qualified objects, and grants EXECUTE narrowly to authenticated after revoking PUBLIC/anon. Keep `chorecoins_private` out of exposed Data API schemas. Security advisors and the real project's migration ownership/grants must be reviewed before live rollout.

Receipts store only the canonical JSONB snapshot's SHA-256 hash plus operation/version metadata, not another full snapshot. Built-in PostgreSQL `sha256(convert_to(...,'UTF8'))` requires no extension. This bounds per-operation storage while retaining collision-resistant replay checking; receipt retention still needs a reviewed policy before pruning.
