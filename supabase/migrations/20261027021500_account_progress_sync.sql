-- Per-account browser-progress snapshots. No banking or authentication credentials.
-- Apply only to a reviewed Supabase project after backup/recovery verification.
BEGIN;

CREATE SCHEMA chorecoins_private;
REVOKE ALL ON SCHEMA chorecoins_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA chorecoins_private TO authenticated;

CREATE TABLE public.account_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE chorecoins_private.account_progress_operations (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_id uuid NOT NULL,
  expected_version bigint NOT NULL,
  result_version bigint NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, operation_id)
);

ALTER TABLE public.account_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_progress FORCE ROW LEVEL SECURITY;
ALTER TABLE chorecoins_private.account_progress_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chorecoins_private.account_progress_operations FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.account_progress FROM PUBLIC, anon, authenticated;
REVOKE ALL ON chorecoins_private.account_progress_operations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.account_progress TO authenticated;
CREATE POLICY account_progress_read_own ON public.account_progress
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
-- No direct-write policies or grants. Mutations and receipt access use the RPC.

CREATE FUNCTION public.read_account_progress()
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.account_progress%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  SELECT * INTO v_row FROM public.account_progress WHERE user_id = v_user;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('version', 0, 'data', '{}'::jsonb);
  END IF;
  RETURN jsonb_build_object('version', v_row.version, 'data', v_row.data);
END;
$$;

CREATE FUNCTION chorecoins_private.commit_account_progress(expected_version bigint, operation_id uuid, data jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_expected bigint := expected_version;
  v_operation uuid := operation_id;
  v_data jsonb := data;
  v_row public.account_progress%ROWTYPE;
  v_receipt chorecoins_private.account_progress_operations%ROWTYPE;
  v_stats jsonb;
  v_old_stats jsonb;
  v_ledger jsonb;
  v_old_ledger jsonb;
  v_count bigint;
  v_old_count bigint;
  v_new_occurrences bigint;
  v_allowed constant text[] := ARRAY[
    'chores', 'weeklyAllowance', 'customChoreTemplates', 'userStats', 'achievements',
    'profileData', 'portfolio', 'cash', 'savingsGoals', 'spendingTransactions',
    'marketStocks', 'marketCash', 'learnEarnLessons', 'learnEarnTotal',
    'welcomeModalDismissed', 'marketSimulatorTutorialDismissed'
  ];
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF v_expected IS NULL OR v_expected < 0 OR v_operation IS NULL THEN
    RAISE EXCEPTION 'Invalid operation metadata' USING ERRCODE = '22023';
  END IF;
  IF v_data IS NULL OR jsonb_typeof(v_data) <> 'object'
    OR octet_length(v_data::text) > 1048576 THEN
    RAISE EXCEPTION 'Progress must be an object of at most 1 MiB' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_each(v_data) AS item(key, value)
    WHERE NOT (item.key = ANY(v_allowed)) OR jsonb_typeof(item.value) <> 'string'
  ) THEN
    RAISE EXCEPTION 'Unsupported progress key or value type' USING ERRCODE = '22023';
  END IF;

  -- Serialize first creation as well as subsequent writes/retries for one owner.
  -- Hash collisions only cause extra serialization; they cannot change ownership.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text, 0));
  SELECT * INTO v_row FROM public.account_progress WHERE user_id = v_user;
  IF NOT FOUND THEN
    v_row.user_id := v_user;
    v_row.version := 0;
    v_row.data := '{}'::jsonb;
  END IF;

  SELECT * INTO v_receipt FROM chorecoins_private.account_progress_operations
    WHERE user_id = v_user AND account_progress_operations.operation_id = v_operation;
  IF FOUND THEN
    IF v_receipt.expected_version <> v_expected OR v_receipt.data <> v_data THEN
      RAISE EXCEPTION 'Operation ID was already used with different content' USING ERRCODE = '22023';
    END IF;
    RETURN jsonb_build_object('status', 'duplicate', 'version', v_row.version,
      'data', v_row.data, 'operation_version', v_receipt.result_version);
  END IF;

  IF v_row.version <> v_expected THEN
    RETURN jsonb_build_object('status', 'conflict', 'version', v_row.version, 'data', v_row.data);
  END IF;

  -- Completion IDs survive undo/re-complete and reject repeated count rewards
  -- even when a caller chooses a new operation UUID. Version zero permits an
  -- explicit legacy baseline; later snapshots must preserve that baseline.
  IF v_row.data ? 'userStats' AND NOT (v_data ? 'userStats') THEN
    RAISE EXCEPTION 'Existing reward history cannot be removed' USING ERRCODE = '22023';
  END IF;
  IF v_data ? 'userStats' THEN
    BEGIN
      v_stats := (v_data->>'userStats')::jsonb;
      v_old_stats := COALESCE((v_row.data->>'userStats')::jsonb, '{}'::jsonb);
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Invalid user statistics JSON' USING ERRCODE = '22023';
    END;
    IF jsonb_typeof(v_stats) <> 'object'
      OR COALESCE(v_stats->>'totalChoresCompleted', '0') !~ '^[0-9]{1,15}$' THEN
      RAISE EXCEPTION 'Invalid completed chore count' USING ERRCODE = '22023';
    END IF;
    v_count := COALESCE(v_stats->>'totalChoresCompleted', '0')::bigint;
    v_old_count := COALESCE(v_old_stats->>'totalChoresCompleted', '0')::bigint;
    v_ledger := COALESCE(v_stats->'rewardedChoreOccurrences', '[]'::jsonb);
    v_old_ledger := COALESCE(v_old_stats->'rewardedChoreOccurrences', '[]'::jsonb);
    IF jsonb_typeof(v_ledger) <> 'array' THEN
      RAISE EXCEPTION 'Invalid completion ledger' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(v_ledger) AS e(value)
      WHERE jsonb_typeof(e.value) <> 'string' OR length(e.value #>> '{}') NOT BETWEEN 1 AND 256)
      OR (SELECT count(*) <> count(DISTINCT value) FROM jsonb_array_elements(v_ledger)) THEN
      RAISE EXCEPTION 'Completion IDs must be unique nonempty strings' USING ERRCODE = '22023';
    END IF;
    IF NOT (v_ledger @> v_old_ledger) THEN
      RAISE EXCEPTION 'Completion history cannot be removed' USING ERRCODE = '22023';
    END IF;
    v_new_occurrences := jsonb_array_length(v_ledger) - jsonb_array_length(v_old_ledger);
    IF (v_row.version = 0 AND v_count < jsonb_array_length(v_ledger))
      OR (v_row.version > 0 AND v_count <> v_old_count + v_new_occurrences) THEN
      RAISE EXCEPTION 'Completed chore count must match newly rewarded occurrences' USING ERRCODE = '22023';
    END IF;
  END IF;

  INSERT INTO public.account_progress(user_id, version, data, updated_at)
    VALUES (v_user, v_expected + 1, v_data, pg_catalog.now())
    ON CONFLICT (user_id) DO UPDATE SET
      version = EXCLUDED.version, data = EXCLUDED.data, updated_at = EXCLUDED.updated_at;
  INSERT INTO chorecoins_private.account_progress_operations(user_id, operation_id, expected_version, result_version, data)
    VALUES (v_user, v_operation, v_expected, v_expected + 1, v_data);
  RETURN jsonb_build_object('status', 'applied', 'version', v_expected + 1,
    'data', v_data, 'operation_version', v_expected + 1);
END;
$$;

-- Exposed RPC is invoker-only; privileged mutation lives in a non-exposed schema.
CREATE FUNCTION public.commit_account_progress(expected_version bigint, operation_id uuid, data jsonb)
RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT chorecoins_private.commit_account_progress(expected_version, operation_id, data) $$;
REVOKE ALL ON FUNCTION chorecoins_private.commit_account_progress(bigint, uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION chorecoins_private.commit_account_progress(bigint, uuid, jsonb) TO authenticated;

REVOKE ALL ON FUNCTION public.read_account_progress() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.commit_account_progress(bigint, uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.read_account_progress() TO authenticated;
GRANT EXECUTE ON FUNCTION public.commit_account_progress(bigint, uuid, jsonb) TO authenticated;

COMMENT ON TABLE public.account_progress IS
  'Owner-only raw progress snapshot; atomic CAS persistence, not server-authoritative reward calculation.';
COMMENT ON TABLE chorecoins_private.account_progress_operations IS
  'Idempotency receipts. Do not prune without a reviewed replay/retention policy.';
COMMIT;
