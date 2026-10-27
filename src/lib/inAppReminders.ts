/** App-open reminders only: no background push, network polling or delivery guarantee. */
export interface ReminderPreferences {
  chore_reminders_enabled?: unknown;
  reminder_time?: unknown;
  reminder_days?: unknown;
  timezone?: unknown;
}

const occurrencePattern = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/;
const graceSeconds = 15 * 60;

function localParts(formatter: Intl.DateTimeFormat, date: Date) {
  const parts = Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second),
    weekday: ({ Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 } as Record<string, number>)[parts.weekday],
  };
}

/** At most 15 minutes late, on the selected local day. Missed days are never replayed.
 * Repeated DST wall times intentionally share one occurrence. Nonexistent spring-gap
 * wall times are skipped, not shifted to an arbitrary later hour. Invalid zones do
 * not silently fall back to a stale numeric UTC offset or the device's timezone.
 */
export function getDueOccurrence(preferences: ReminderPreferences | null | undefined, now: Date): string | null {
  if (!preferences || preferences.chore_reminders_enabled !== true || !Number.isFinite(now.getTime())) return null;
  const time = preferences.reminder_time;
  const days = preferences.reminder_days;
  const zone = preferences.timezone;
  if (typeof time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d(?::00)?$/.test(time)) return null;
  if (!Array.isArray(days) || !days.length || days.length > 7 || days.some(day => !Number.isInteger(day) || day < 1 || day > 7)) return null;
  if (typeof zone !== 'string' || !zone || zone.length > 100 || /^[+-]/.test(zone)) return null;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, calendar: 'gregory', numberingSystem: 'latn', hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const local = localParts(formatter, now);
    if (!days.includes(local.weekday)) return null;
    const [hour, minute] = time.split(':').map(Number);
    const elapsedSeconds = (local.hour * 60 + local.minute - hour * 60 - minute) * 60 + local.second;
    if (elapsedSeconds < 0 || elapsedSeconds > graceSeconds || (elapsedSeconds === graceSeconds && now.getUTCMilliseconds() > 0)) return null;
    // Subtracting the wall-clock delay must land on a real matching local time.
    // This detects a schedule inside a spring-forward gap without a zone database
    // scan, and remains bounded regardless of the number of saved users.
    const candidate = localParts(formatter, new Date(now.getTime() - elapsedSeconds * 1000));
    if (candidate.date !== local.date || candidate.hour !== hour || candidate.minute !== minute) return null;
    const key = `${local.date}T${time.slice(0, 5)}`;
    return occurrencePattern.test(key) ? key : null;
  } catch {
    return null;
  }
}

/** Reserve before display. One bounded marker per account, with no preference data.
 * Best-effort same-device dedupe only: localStorage lacks cross-tab CAS and markers
 * can be cleared. This is not exactly-once delivery across tabs or devices.
 * Storage errors/corruption suppress reminders rather than repeatedly displaying.
 */
export function claimOccurrence(storage: Pick<Storage, 'getItem' | 'setItem'>, userId: string, occurrence: string): boolean {
  if (typeof userId !== 'string' || !userId || userId.length > 128 || !occurrencePattern.test(occurrence)) return false;
  const key = `chorecoins:reminder:v1:${encodeURIComponent(userId)}`;
  try {
    const raw = storage.getItem(key);
    if (raw !== null) {
      if (raw.length > 100) return false;
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== 1 || typeof saved.occurrence !== 'string' || !occurrencePattern.test(saved.occurrence) || Object.keys(saved).length !== 2) return false;
      // Also suppress older wall-clock dates after clock rollback / stale callbacks.
      if (saved.occurrence >= occurrence) return false;
    }
    storage.setItem(key, JSON.stringify({ version: 1, occurrence }));
    return true;
  } catch {
    return false;
  }
}
