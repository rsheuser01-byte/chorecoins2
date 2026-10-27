type Session = { user: { id: string; email: string }; access_token: string } | null;
let session: Session = null;
const listeners = new Set<(event: string, session: Session) => void>();
export const defaults = { chore_reminders_enabled: true, reminder_time: '09:00:00', reminder_days: [1,2,3,4,5,6,7], timezone: 'UTC', timezone_offset_minutes: 0, push_enabled: true, push_subscription: { endpoint: 'https://example.invalid/synthetic' } };
export const mock = {
  records: new Map<string, Record<string, unknown>>(),
  loads: [] as string[], saves: [] as { userId: string; input: Record<string, unknown> }[],
  pending: new Map<string, (value: unknown) => void>(), delayOwner: '', failOwner: '',
  emit(userId: string | null) {
    session = userId ? {user:{id:userId,email:`${userId}@example.invalid`},access_token:`synthetic-${userId}`} : null;
    listeners.forEach(fn => fn(userId ? 'SIGNED_IN' : 'SIGNED_OUT',session));
  },
};
export const supabase = {auth:{
  onAuthStateChange(listener: (event: string, session: Session) => void) {listeners.add(listener);return {data:{subscription:{unsubscribe:()=>listeners.delete(listener)}}};},
  async getSession(){return {data:{session}};},
  async signOut(){mock.emit(null);return {error:null};},
}};
export function createReminderPreferencesApi(owner: NonNullable<Session>) {
  const userId=owner.user.id;
  return {
    async load() {
      mock.loads.push(userId);
      if(mock.failOwner===userId) throw new Error('Synthetic unavailable');
      if(mock.delayOwner===userId) return new Promise(resolve=>mock.pending.set(userId,resolve));
      const row = mock.records.get(userId) ?? defaults;
      const {chore_reminders_enabled,reminder_time,reminder_days,timezone,timezone_offset_minutes}=row;
      return structuredClone({chore_reminders_enabled,reminder_time,reminder_days,timezone,timezone_offset_minutes});
    },
    async save(input: Record<string,unknown>) {
      mock.saves.push({userId,input:structuredClone(input)});
      mock.records.set(userId,{...(mock.records.get(userId)??defaults),...input});
    },
  };
}
