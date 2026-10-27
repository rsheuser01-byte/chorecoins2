import type { ProgressApi, ProgressSnapshot, CommitResult } from '@/lib/accountSync';
import { validateProgressData } from '@/lib/accountSync';
type Session = { user: { id: string; email: string } } | null;
type Listener = (event: string, session: Session) => void;
let session: Session = null;
const listeners = new Set<Listener>();
type Snapshot = { version: number; data: Record<string, string> };
type Receipt = { expected_version: number; operation_version: number; data: Record<string, string> };
const snapshots = new Map<string, Snapshot>();
const receipts = new Map<string, Receipt>();
const copy = <T,>(value: T): T => structuredClone(value);
export const mock = {
  rpcOffline: false,
  loseNextCommitAck: false,
  snapshot(userId: string): Snapshot { return copy(snapshots.get(userId) ?? { version: 0, data: {} }); },
  remoteEdit(userId: string, data: Record<string, string>) {
    const previous = this.snapshot(userId);
    snapshots.set(userId, { version: previous.version + 1, data: copy(validateProgressData(data)) });
  },
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
async function rpcFor(userId: string | undefined, name: string, args?: { expected_version: number; operation_id: string; data: Record<string, string> }) {
    if (mock.rpcOffline) return { data: null, error: { message: 'Synthetic offline RPC' } };
    if (!userId) return { data: null, error: { message: 'Authentication required' } };
    const current = mock.snapshot(userId);
    if (name === 'read_account_progress') return { data: current, error: null };
    if (name !== 'commit_account_progress' || !args) return { data: null, error: { message: 'Unexpected RPC' } };
    const data = validateProgressData(args.data);
    const receiptKey = `${userId}:${args.operation_id}`;
    const prior = receipts.get(receiptKey);
    if (prior) {
      if (prior.expected_version !== args.expected_version || JSON.stringify(prior.data) !== JSON.stringify(data)) {
        return { data: null, error: { message: 'Operation ID already used with different content' } };
      }
      return { data: { ...current, status: 'duplicate', operation_version: prior.operation_version }, error: null };
    }
    if (current.version !== args.expected_version) return { data: { ...current, status: 'conflict' }, error: null };
    const next = { version: current.version + 1, data: copy(data) };
    snapshots.set(userId, next);
    receipts.set(receiptKey, { expected_version: args.expected_version, operation_version: next.version, data: copy(data) });
    if (mock.loseNextCommitAck) {
      mock.loseNextCommitAck = false; mock.rpcOffline = true;
      return { data: null, error: { message: 'Synthetic lost commit acknowledgement' } };
    }
    return { data: { ...copy(next), status: 'applied', operation_version: next.version }, error: null };
}

// Capture the owner once, as the production adapter captures its session token.
export function createAccountProgressApi(ownerSession: NonNullable<Session>): ProgressApi {
  const ownerId = ownerSession.user.id;
  return {
    async getSnapshot() {
      const response = await rpcFor(ownerId, 'read_account_progress');
      if (response.error) throw new Error(response.error.message);
      return response.data as ProgressSnapshot;
    },
    async commit(request) {
      const response = await rpcFor(ownerId, 'commit_account_progress', {
        expected_version: request.expectedVersion, operation_id: request.operationId, data: request.data,
      });
      if (response.error) throw new Error(response.error.message);
      return response.data as CommitResult;
    },
  };
}
export const supabase = {
  rpc: (name: string, args?: { expected_version: number; operation_id: string; data: Record<string, string> }) => rpcFor(session?.user.id, name, args),
  auth: {
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
