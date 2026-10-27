import { createClient, type Session } from '@supabase/supabase-js';
import type { ProgressApi, CommitResult, ProgressSnapshot } from '@/lib/accountSync';

/** A separate client captures this owner's token; a later global login cannot change its owner. */
export function createAccountProgressApi(session: Session): ProgressApi {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !session.access_token) throw new Error('Cloud sync is not configured');
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return {
    async getSnapshot() {
      const { data, error } = await client.rpc('read_account_progress').abortSignal(AbortSignal.timeout(15000));
      if (error) throw new Error('Unable to load cloud progress. Your device data is preserved.');
      return data as ProgressSnapshot;
    },
    async commit(request) {
      const { data, error } = await client.rpc('commit_account_progress', {
        expected_version: request.expectedVersion,
        operation_id: request.operationId,
        data: request.data,
      }).abortSignal(AbortSignal.timeout(15000));
      if (error) throw new Error('Unable to save cloud progress. Changes remain queued on this device.');
      return data as CommitResult;
    },
  };
}
