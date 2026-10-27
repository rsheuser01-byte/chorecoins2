\set ON_ERROR_STOP on
SET ROLE authenticated;
SET request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
DO $$
DECLARE r jsonb; denied boolean := false;
BEGIN
  r := public.read_account_progress();
  ASSERT r = '{"version":0,"data":{}}'::jsonb, 'New account must be empty';
  r := public.commit_account_progress(0, '11111111-1111-4111-8111-111111111111', jsonb_build_object('chores','A','userStats','{"totalChoresCompleted":5}'::text));
  ASSERT r->>'status' = 'applied' AND (r->>'version')::int = 1;
  ASSERT (SELECT count(*) FROM public.account_progress) = 1;
  BEGIN
    UPDATE public.account_progress SET data = '{}'::jsonb;
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  ASSERT denied, 'Direct writes must be denied even for owner';
  denied := false;
  BEGIN
    PERFORM * FROM chorecoins_private.account_progress_operations;
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  ASSERT denied, 'Receipt table is not directly exposed';
  r := public.commit_account_progress(0, '11111111-1111-4111-8111-111111111111', jsonb_build_object('chores','A','userStats','{"totalChoresCompleted":5}'::text));
  ASSERT r->>'status' = 'duplicate' AND (r->>'version')::int = 1, 'Retry repeated mutation';
  r := public.commit_account_progress(0, '22222222-2222-4222-8222-222222222222', '{"chores":"stale"}');
  ASSERT r->>'status' = 'conflict' AND r->'data'->>'chores' = 'A', 'Conflict overwrote server';
  r := public.commit_account_progress(1, '33333333-3333-4333-8333-333333333333', jsonb_build_object('chores','A2','userStats','{"totalChoresCompleted":5}'::text));
  ASSERT r->>'status' = 'applied' AND (r->>'version')::int = 2;
  r := public.commit_account_progress(0, '11111111-1111-4111-8111-111111111111', jsonb_build_object('chores','A','userStats','{"totalChoresCompleted":5}'::text));
  ASSERT r->>'status' = 'duplicate' AND (r->>'version')::int = 2
    AND (r->>'operation_version')::int = 1 AND r->'data'->>'chores' = 'A2', 'Replay returned stale snapshot';
  denied := false;
  BEGIN
    PERFORM public.commit_account_progress(0, '11111111-1111-4111-8111-111111111111', '{"chores":"changed replay"}');
  EXCEPTION WHEN invalid_parameter_value THEN denied := true;
  END;
  ASSERT denied, 'Operation ID reuse must reject changed content';
  ASSERT (public.read_account_progress()->'data') = jsonb_build_object('chores','A2','userStats','{"totalChoresCompleted":5}'::text)::jsonb, 'Coupled fields not atomic';
END $$;

SET request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
DO $$
DECLARE r jsonb; denied boolean := false;
BEGIN
  ASSERT (SELECT count(*) FROM public.account_progress) = 0, 'User B can see user A';
  ASSERT public.read_account_progress() = '{"version":0,"data":{}}'::jsonb;
  -- Same operation ID is intentionally safe for a different owner.
  r := public.commit_account_progress(0, '11111111-1111-4111-8111-111111111111', '{"chores":"B"}');
  ASSERT r->>'status' = 'applied';
  ASSERT (SELECT count(*) FROM public.account_progress) = 1;
  ASSERT (SELECT data->>'chores' FROM public.account_progress) = 'B';
  BEGIN
    INSERT INTO public.account_progress(user_id, version, data)
      VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 3, '{"chores":"attack"}')
      ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data;
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  ASSERT denied, 'User B can directly overwrite A';
END $$;

DO $$
DECLARE payload jsonb; denied boolean;
BEGIN
  FOREACH payload IN ARRAY ARRAY[
    '{"coinbaseCredentials":"secret"}'::jsonb,
    '{"sessionToken":"secret"}'::jsonb,
    '{"dbConfig":"secret"}'::jsonb,
    '{"chores":[]}'::jsonb,
    '[]'::jsonb,
    'null'::jsonb,
    jsonb_build_object('chores', repeat('x', 1048577))
  ] LOOP
    denied := false;
    BEGIN
      PERFORM public.commit_account_progress(1, '44444444-4444-4444-8444-444444444444', payload);
    EXCEPTION WHEN invalid_parameter_value THEN denied := true;
    END;
    ASSERT denied, 'Invalid/secret-bearing payload accepted';
  END LOOP;
  ASSERT (public.read_account_progress()->>'version')::int = 1, 'Rejected payload mutated row';
END $$;

-- New occurrence increments count once; undo/recomplete and operation UUID changes
-- cannot erase history or claim that same occurrence a second time.
DO $$
DECLARE r jsonb; denied boolean; stats jsonb;
BEGIN
  r := public.commit_account_progress(1, '77777777-7777-4777-8777-777777777777',
    jsonb_build_object('chores', '[{"id":"test-chore","completed":true}]',
      'userStats', '{"totalChoresCompleted":1,"rewardedChoreOccurrences":["test-occurrence"]}'));
  ASSERT r->>'status' = 'applied';
  FOREACH stats IN ARRAY ARRAY[
    '{"totalChoresCompleted":2,"rewardedChoreOccurrences":["test-occurrence"]}'::jsonb,
    '{"totalChoresCompleted":0,"rewardedChoreOccurrences":[]}'::jsonb,
    '{"totalChoresCompleted":2,"rewardedChoreOccurrences":["test-occurrence","test-occurrence"]}'::jsonb
  ] LOOP
    denied := false;
    BEGIN
      PERFORM public.commit_account_progress(2, '88888888-8888-4888-8888-888888888888',
        jsonb_build_object('chores', '[]', 'userStats', stats::text));
    EXCEPTION WHEN invalid_parameter_value THEN denied := true;
    END;
    ASSERT denied, 'Completion was counted again or history erased';
  END LOOP;
  denied := false;
  BEGIN
    PERFORM public.commit_account_progress(2, '88888888-8888-4888-8888-888888888888', '{"chores":"[]"}');
  EXCEPTION WHEN invalid_parameter_value THEN denied := true;
  END;
  ASSERT denied, 'Statistics could be removed to reset the ledger';
  ASSERT (public.read_account_progress()->>'version')::int = 2;
  ASSERT ((public.read_account_progress()->'data'->>'userStats')::jsonb->>'totalChoresCompleted')::int = 1;
END $$;

DO $$
DECLARE denied boolean := false;
BEGIN
  BEGIN
    PERFORM public.commit_account_progress(2, 'aaaaaaaa-2222-4222-8222-222222222222',
      (public.read_account_progress()->'data') || jsonb_build_object('importMetadata',
        '{"version":1,"source":"legacy-shared","consentedAt":"2026-10-27T12:00:00.000Z","fields":["chores"]}'));
  EXCEPTION WHEN invalid_parameter_value THEN denied := true;
  END;
  ASSERT denied, 'Import provenance added after initial cloud snapshot';
END $$;

SET request.jwt.claim.sub = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
DO $$
DECLARE r jsonb; denied boolean := false;
  metadata jsonb := '{"version":1,"source":"legacy-shared","consentedAt":"2026-10-27T12:00:00.000Z","fields":["chores"]}';
BEGIN
  BEGIN
    PERFORM public.commit_account_progress(0, '99999999-9999-4999-8999-999999999999',
      jsonb_build_object('chores','[]','importMetadata',(metadata - 'source' || '{"extra":"bad"}'::jsonb)::text));
  EXCEPTION WHEN invalid_parameter_value THEN denied := true;
  END;
  ASSERT denied, 'Missing provenance source accepted';
  r := public.commit_account_progress(0, '99999999-9999-4999-8999-999999999999',
    jsonb_build_object('chores','[]','importMetadata',metadata::text));
  ASSERT r->>'status' = 'applied';
  denied := false;
  BEGIN
    PERFORM public.commit_account_progress(1, 'aaaaaaaa-1111-4111-8111-111111111111',
      jsonb_build_object('chores','[]','importMetadata',(metadata || '{"source":"legacy-account"}'::jsonb)::text));
  EXCEPTION WHEN invalid_parameter_value THEN denied := true;
  END;
  ASSERT denied, 'Import provenance was modified';
  denied := false;
  BEGIN
    PERFORM public.commit_account_progress(1, 'aaaaaaaa-1111-4111-8111-111111111111', '{"chores":"[]"}');
  EXCEPTION WHEN invalid_parameter_value THEN denied := true;
  END;
  ASSERT denied, 'Import provenance was removed';
END $$;

SET request.jwt.claim.sub = '';
DO $$
DECLARE denied boolean := false;
BEGIN
  ASSERT (SELECT count(*) FROM public.account_progress) = 0, 'Null auth can read rows';
  BEGIN PERFORM public.read_account_progress();
  EXCEPTION WHEN invalid_authorization_specification THEN denied := true; END;
  ASSERT denied, 'Missing JWT accepted';
END $$;
RESET ROLE;
SET ROLE anon;
DO $$
DECLARE denied boolean := false;
BEGIN
  BEGIN PERFORM public.read_account_progress();
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  ASSERT denied, 'Anonymous RPC access allowed';
  denied := false;
  BEGIN PERFORM * FROM public.account_progress;
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  ASSERT denied, 'Anonymous table access allowed';
END $$;
RESET ROLE;
DO $$ BEGIN
  ASSERT (SELECT data->>'chores' FROM public.account_progress WHERE user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') = 'A2', 'A data changed during B tests';
  ASSERT (SELECT count(*) FROM chorecoins_private.account_progress_operations) = 5, 'Unexpected receipt count';
  ASSERT (SELECT bool_and(octet_length(payload_hash) = 32) FROM chorecoins_private.account_progress_operations), 'Receipt is not a SHA-256 digest';
  ASSERT NOT has_function_privilege('anon', 'public.commit_account_progress(bigint,uuid,jsonb)', 'EXECUTE');
  ASSERT NOT has_function_privilege('anon', 'chorecoins_private.commit_account_progress(bigint,uuid,jsonb)', 'EXECUTE');
  ASSERT NOT has_schema_privilege('anon', 'chorecoins_private', 'USAGE');
  ASSERT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid='public.account_progress'::regclass);
  ASSERT (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid='chorecoins_private.account_progress_operations'::regclass);
END $$;
SELECT 'account progress ownership, CAS, idempotence and validation tests passed' AS result;
