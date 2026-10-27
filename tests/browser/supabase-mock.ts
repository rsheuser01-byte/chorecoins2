type Session = { user: { id: string; email: string } } | null;
type Listener = (event: string, session: Session) => void;
let session: Session = null;
const listeners = new Set<Listener>();
export const mock = {
  initialPending: true,
  initialResolve: null as null | ((value: { data: { session: Session } }) => void),
  signOutError: false,
  signupSession: false,
  signupError: false,
  updateError: false,
  updates: 0,
  emit(event: string, userId: string | null) {
    session = userId ? { user: { id: userId, email: `${userId}@example.invalid` } } : null;
    listeners.forEach(listener => listener(event, session));
  },
  finishInitial() { this.initialPending = false; this.initialResolve?.({ data: { session } }); },
};
export const supabase = { auth: {
  onAuthStateChange(listener: Listener) {
    listeners.add(listener);
    return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
  },
  getSession() {
    return mock.initialPending
      ? new Promise<{ data: { session: Session } }>(resolve => { mock.initialResolve = resolve; })
      : Promise.resolve({ data: { session } });
  },
  async signInWithPassword({ email }: { email: string; password: string }) {
    mock.emit('SIGNED_IN', email.split('@')[0]);
    return { data: { session }, error: null };
  },
  async signUp() {
    if (mock.signupError) return { data: { session: null }, error: { message: 'Synthetic signup rejected' } };
    if (mock.signupSession) mock.emit('SIGNED_IN', 'new-account');
    return { data: { session: mock.signupSession ? session : null }, error: null };
  },
  async signOut() {
    if (mock.signOutError) return { error: { message: 'Synthetic signout rejected' } };
    mock.emit('SIGNED_OUT', null);
    return { error: null };
  },
  async resetPasswordForEmail() { return { error: null }; },
  async updateUser() {
    mock.updates++;
    if (mock.updateError) throw new Error('Synthetic network failure');
    return { error: null };
  },
} };
