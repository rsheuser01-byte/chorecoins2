import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { createReminderPreferencesApi, type ReminderPreferences } from '@/services/reminderPreferencesApi';
import { REMINDER_SETTINGS_EVENT } from '@/components/InAppReminder';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const deviceTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const defaults = (): ReminderPreferences => ({ chore_reminders_enabled: false, reminder_time: '09:00', reminder_days: [1, 2, 3, 4, 5, 6, 7], timezone: deviceTimezone(), timezone_offset_minutes: new Date().getTimezoneOffset() });
function validPreferences(value: ReminderPreferences) {
  if (typeof value.chore_reminders_enabled !== 'boolean' || !/^([01]\d|2[0-3]):[0-5]\d(:00)?$/.test(value.reminder_time)
    || !Array.isArray(value.reminder_days) || value.reminder_days.length > 7 || new Set(value.reminder_days).size !== value.reminder_days.length || !value.reminder_days.every(day => Number.isInteger(day) && day >= 1 && day <= 7)) return false;
  // Preserve old missing/invalid zones for explicit correction, never assume UTC.
  return true;
}
function validZone(zone: string | null) {
  try { if (!zone) return false; new Intl.DateTimeFormat('en', { timeZone: zone }).format(); return true; } catch { return false; }
}

export default function Notifications() {
  const { user, session, isLoading } = useAuth();
  const owner = user?.id;
  const current = useRef({ owner, session });
  current.current = { owner, session };
  const [preferences, setPreferences] = useState<ReminderPreferences>(defaults);
  const [loadedOwner, setLoadedOwner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [reload, setReload] = useState(0);
  const saving = useRef(false);
  const saveRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    setLoadedOwner(null); setMessage(''); setPreferences(defaults()); setBusy(false);
    saving.current = false;
    saveRequest.current?.abort();
    if (!owner || isLoading) return;
    let active = true;
    const controller = new AbortController();
    const capturedSession = current.current.session;
    if (!capturedSession || capturedSession.user.id !== owner) return;
    void (async () => {
      try {
        const data = await createReminderPreferencesApi(capturedSession).load(controller.signal);
        if (!active || controller.signal.aborted) return;
        if (data && !validPreferences(data)) throw new Error('Invalid preferences');
        setPreferences(data ? { ...data, reminder_time: data.reminder_time.slice(0, 5) } : defaults());
        setLoadedOwner(owner);
      } catch {
        if (active && !controller.signal.aborted) setMessage('Could not load your reminder settings. Existing choices have not been changed.');
      }
    })();
    return () => { active = false; controller.abort(); saveRequest.current?.abort(); };
  }, [owner, isLoading, reload]);

  const save = async () => {
    if (!owner || loadedOwner !== owner || saving.current) return;
    const captured = current.current.session;
    if (!captured || captured.user.id !== owner) return;
    if (!validPreferences(preferences) || (preferences.chore_reminders_enabled && !validZone(preferences.timezone))) {
      setMessage('Choose a valid reminder time and timezone before enabling reminders.'); return;
    }
    saving.current = true; setBusy(true); setMessage('');
    const controller = new AbortController(); saveRequest.current = controller;
    try {
      await createReminderPreferencesApi(captured).save({ ...preferences, reminder_time: `${preferences.reminder_time}:00` }, controller.signal);
      if (current.current.owner !== owner || controller.signal.aborted) return;
      setMessage('Reminder settings saved. Background push remains paused.');
      window.dispatchEvent(new CustomEvent(REMINDER_SETTINGS_EVENT, { detail: { userId: owner } }));
    } catch {
      if (current.current.owner === owner && !controller.signal.aborted) setMessage('Could not confirm the save. Reload settings before retrying; your earlier choices are preserved unless the server accepted this save.');
    } finally {
      if (saveRequest.current === controller) { saving.current = false; setBusy(false); }
    }
  };
  const ready = !!owner && loadedOwner === owner && !isLoading;
  return <div className="container mx-auto px-4 py-8 max-w-4xl">
    <h1 className="text-4xl font-bold mb-4">Reminder Settings</h1>
    <Card><CardHeader><CardTitle>In-app chore reminders</CardTitle>
      <CardDescription>Reminders appear only while this app is open and visible. Background push is paused; no reminders are sent while the app is closed. Your saved push choices are retained.</CardDescription>
    </CardHeader><CardContent className="space-y-5">
      {!owner && !isLoading && <p>Sign in to manage your own reminder schedule.</p>}
      {!!owner && !ready && !message && <p>Loading your reminder settings…</p>}
      {message && <p role="status">{message}</p>}
      {!!owner && <Button variant="outline" disabled={busy} onClick={() => setReload(value => value + 1)}>Reload settings</Button>}
      {ready && <fieldset disabled={!ready || busy} className="space-y-5">
        <div className="flex items-center justify-between"><Label htmlFor="chore-reminders">Enable in-app chore reminders</Label>
          <Switch id="chore-reminders" checked={ready && preferences.chore_reminders_enabled} onCheckedChange={checked => setPreferences(value => ({ ...value, chore_reminders_enabled: checked }))} /></div>
        <div><Label htmlFor="reminder-time">Reminder Time</Label><Input id="reminder-time" type="time" value={preferences.reminder_time} onChange={event => setPreferences(value => ({ ...value, reminder_time: event.target.value }))} /></div>
        <div><p>Schedule timezone: {preferences.timezone || 'Not set — choose your device timezone'}</p>
          <Button variant="outline" onClick={() => setPreferences(value => ({ ...value, timezone: deviceTimezone(), timezone_offset_minutes: new Date().getTimezoneOffset() }))}>Use device timezone</Button></div>
        <div><Label>Reminder Days</Label><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DAYS.map((day, index) => <Button key={day} variant={preferences.reminder_days.includes(index + 1) ? 'default' : 'outline'} aria-pressed={preferences.reminder_days.includes(index + 1)} onClick={() => setPreferences(value => ({ ...value, reminder_days: value.reminder_days.includes(index + 1) ? value.reminder_days.filter(item => item !== index + 1) : [...value.reminder_days, index + 1].sort() }))}>{day}</Button>)}
        </div></div>
        <p className="text-sm text-muted-foreground">Late reminders are skipped after 15 minutes. Dismissal is remembered on this browser; other devices may show their own reminder. No notification permission is requested.</p>
        <Button onClick={save} disabled={!ready || busy}>{busy ? 'Saving…' : 'Save Settings'}</Button>
      </fieldset>}
    </CardContent></Card>
  </div>;
}
