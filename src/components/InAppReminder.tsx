import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createReminderPreferencesApi } from '@/services/reminderPreferencesApi';
import { useAuth } from '@/contexts/AuthContext';
import { getDueOccurrence, claimOccurrence } from '@/lib/inAppReminders';
import { Button } from '@/components/ui/button';

export const REMINDER_SETTINGS_EVENT = 'chorecoins:reminder-settings';
export function InAppReminder() {
  const { user, session, isLoading, isPasswordRecovery } = useAuth();
  const { pathname } = useLocation();
  const currentSession = useRef(session);
  currentSession.current = session;
  const [shown, setShown] = useState<{ owner: string; occurrence: string } | null>(null);
  const owner = user?.id;
  const suppressed = isLoading || isPasswordRecovery || pathname === '/reset-password';

  useEffect(() => {
    setShown(null);
    if (!owner || suppressed) return;
    let active = true;
    let preferences: Parameters<typeof getDueOccurrence>[0] | null = null;
    let request: AbortController | null = null;
    let generation = 0;
    const check = () => {
      if (!active || document.visibilityState !== 'visible' || !preferences) return;
      const occurrence = getDueOccurrence(preferences, new Date());
      if (!occurrence) { setShown(null); return; }
      // Fail closed if durable deduplication is unavailable. No background push.
      try {
        if (claimOccurrence(window.localStorage, owner, occurrence)) setShown({ owner, occurrence });
      } catch { /* Optional reminders never interfere with account use. */ }
    };
    const load = async () => {
      const version = ++generation;
      preferences = null;
      setShown(null);
      request?.abort();
      const controller = new AbortController();
      request = controller;
      const timeout = setTimeout(() => controller.abort(), 10_000);
      try {
        const capturedSession = currentSession.current;
        if (!capturedSession || capturedSession.user.id !== owner) return;
        const data = await createReminderPreferencesApi(capturedSession).load(controller.signal);
        if (active && version === generation && !controller.signal.aborted && data) {
          preferences = data;
          check();
        }
      } catch { /* Retry only on explicit settings event or next account mount. */ }
      finally { clearTimeout(timeout); }
    };
    const changed = (event: Event) => {
      if ((event as CustomEvent<{ userId?: string }>).detail?.userId === owner) void load();
    };
    void load();
    const timer = setInterval(check, 60_000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    window.addEventListener(REMINDER_SETTINGS_EVENT, changed);
    return () => {
      active = false;
      request?.abort();
      clearInterval(timer);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener(REMINDER_SETTINGS_EVENT, changed);
    };
  }, [owner, suppressed]);

  if (!shown || shown.owner !== owner || suppressed) return null;
  return <aside role="status" aria-label="Chore reminder" className="mx-auto my-3 max-w-4xl rounded-lg border bg-card p-4 flex flex-wrap items-center gap-3">
    <p className="flex-1">Time to check your chores. This reminder appears only while the app is open.</p>
    <Link className="underline" to="/chores" onClick={() => setShown(null)}>View chores</Link>
    <Button variant="ghost" size="sm" onClick={() => setShown(null)}>Dismiss reminder</Button>
  </aside>;
}
