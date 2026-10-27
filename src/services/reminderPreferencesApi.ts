import { createClient } from '@supabase/supabase-js';

export interface ReminderPreferences {
  chore_reminders_enabled: boolean;
  reminder_time: string;
  reminder_days: number[];
  timezone: string | null;
  timezone_offset_minutes: number | null;
}
export function createReminderPreferencesApi(session: { user: { id: string }; access_token: string }) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !session.access_token || !session.user.id) throw new Error('Reminder service unavailable');
  const owner = session.user.id;
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  async function bounded<T>(run: (signal: AbortSignal) => PromiseLike<{ data: T; error: unknown }>, signal?: AbortSignal) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 15_000);
    try {
      const result = await run(controller.signal);
      if (result.error || controller.signal.aborted) throw new Error('Reminder request failed');
      return result.data;
    } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
  }
  return {
    load: (signal?: AbortSignal): Promise<ReminderPreferences | null> => bounded((requestSignal) => client
      .from('notification_preferences')
      .select('chore_reminders_enabled,reminder_time,reminder_days,timezone,timezone_offset_minutes')
      .eq('user_id', owner).abortSignal(requestSignal).maybeSingle(), signal),
    save: (input: ReminderPreferences, signal?: AbortSignal) => bounded((requestSignal) => client
      .from('notification_preferences').upsert({
        user_id: owner,
        chore_reminders_enabled: input.chore_reminders_enabled,
        reminder_time: input.reminder_time,
        reminder_days: input.reminder_days,
        timezone: input.timezone,
        timezone_offset_minutes: input.timezone_offset_minutes,
        // Never overwrite existing push_enabled or push_subscription.
      }, { onConflict: 'user_id' }).abortSignal(requestSignal), signal),
  };
}
