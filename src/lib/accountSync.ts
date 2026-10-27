/** Account-bound, durable snapshot synchronization. Never instantiate with a mutable/global owner API. */
export type ProgressData = Record<string, string>;
export interface ProgressSnapshot { version: number; data: ProgressData }
export interface CommitRequest { expectedVersion: number; operationId: string; data: ProgressData }
export interface CommitResult extends ProgressSnapshot {
  status: 'applied' | 'duplicate' | 'conflict';
  operation_version?: number;
}
export interface ProgressApi {
  getSnapshot(): Promise<ProgressSnapshot>;
  commit(request: CommitRequest): Promise<CommitResult>;
}
export type SyncPersistence = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export const syncedProgressKeys = [
  'chores', 'weeklyAllowance', 'customChoreTemplates', 'userStats', 'achievements',
  'profileData', 'portfolio', 'cash', 'savingsGoals', 'spendingTransactions',
  'marketStocks', 'marketCash', 'learnEarnLessons', 'learnEarnTotal',
  'welcomeModalDismissed', 'marketSimulatorTutorialDismissed',
] as const;
const allowed = new Set<string>(syncedProgressKeys);
const MAX_BYTES = 1024 * 1024;
export function validateProgressData(value: unknown): ProgressData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid progress snapshot');
  const result: ProgressData = {};
  for (const [key, item] of Object.entries(value)) {
    if (!allowed.has(key) || typeof item !== 'string') throw new Error('Unsupported progress key or value');
    result[key] = item;
  }
  if (new TextEncoder().encode(JSON.stringify(result)).length > MAX_BYTES) throw new Error('Progress exceeds the 1 MiB sync limit');
  return result;
}
function snapshot(value: ProgressSnapshot): ProgressSnapshot {
  if (!value || !Number.isSafeInteger(value.version) || value.version < 0) throw new Error('Invalid progress version');
  return { version: value.version, data: validateProgressData(value.data) };
}
function equal(a: ProgressData, b: ProgressData) {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(key => a[key] === b[key]);
}
interface Journal {
  format: 1;
  userId: string;
  base: ProgressSnapshot;
  working: ProgressData;
  pending: CommitRequest | null;
}
export interface SyncState {
  phase: 'loading' | 'ready' | 'offline' | 'conflict' | 'error' | 'disposed';
  ready: boolean;
  syncing: boolean;
  dirty: boolean;
  version: number;
  data: Readonly<ProgressData>;
  error: string | null;
  conflict: null | { local: ProgressData; remote: ProgressSnapshot };
}
export interface AccountSyncOptions {
  userId: string;
  api: ProgressApi;
  persistence: SyncPersistence;
  operationId?: () => string;
}

export function createAccountSync({ userId, api, persistence, operationId = () => crypto.randomUUID() }: AccountSyncOptions) {
  if (!userId) throw new Error('An authenticated account ID is required');
  const journalKey = `chorecoins:sync:v1:user:${encodeURIComponent(userId)}`;
  let journal: Journal | null = null;
  let disposed = false;
  let initialized = false;
  let corruptJournal = false;
  let staleJournal = false;
  let journalRaw: string | null = null;
  let serial: Promise<unknown> = Promise.resolve();
  const listeners = new Set<() => void>();
  let state: SyncState = Object.freeze({ phase: 'loading', ready: false, syncing: false, dirty: false, version: 0, data: Object.freeze({}), error: null, conflict: null });
  function emit(overrides: Partial<SyncState> = {}) {
    if (disposed) return;
    state = Object.freeze({ ...state, ...(journal ? {
      version: journal.base.version,
      dirty: !!journal.pending || !equal(journal.working, journal.base.data),
      data: Object.freeze({ ...journal.working }),
    } : {}), ...overrides });
    listeners.forEach(listener => listener());
  }
  function save(next: Journal) {
    if (disposed) return;
    // One journal write atomically preserves the base, immutable pending op, and newer local edits.
    // Defense in depth: a stale instance must not replace a newer local queue.
    // The browser provider additionally holds a Web Lock: localStorage read/write
    // itself is not an atomic compare-and-swap across concurrent browser processes.
    if (persistence.getItem(journalKey) !== journalRaw) {
      staleJournal = true;
      emit({ phase: 'error', ready: false, syncing: false, error: 'Another tab changed this account cache. Export this draft and reload after closing the other tab.' });
      throw new Error('Account sync journal changed in another tab');
    }
    const serialized = JSON.stringify(next);
    persistence.setItem(journalKey, serialized);
    journalRaw = serialized;
    journal = next;
  }
  function failure(error: unknown) {
    emit({ phase: journal && !staleJournal ? 'offline' : 'error', ready: !!journal && !staleJournal, syncing: false, error: error instanceof Error ? error.message : 'Cloud sync failed' });
  }
  function conflict(remote: ProgressSnapshot) {
    emit({ phase: 'conflict', ready: false, syncing: false, error: 'Cloud progress changed on another device. Choose which version to keep.', conflict: { local: { ...journal!.working }, remote: snapshot(remote) } });
  }
  function queue<T>(work: () => Promise<T>): Promise<T> {
    const next = serial.then(async () => { if (disposed) return undefined as T; return work(); });
    serial = next.catch(() => {});
    return next;
  }
  function readJournal() {
    const raw = persistence.getItem(journalKey);
    journalRaw = raw;
    if (raw === null) return;
    const value = JSON.parse(raw) as Journal;
    if (value.format !== 1 || value.userId !== userId) throw new Error('Stored sync journal has an invalid owner or format');
    const base = snapshot(value.base);
    const working = validateProgressData(value.working);
    let pending: CommitRequest | null = null;
    if (value.pending) {
      if (typeof value.pending.operationId !== 'string' || !value.pending.operationId || value.pending.expectedVersion !== base.version) throw new Error('Invalid pending sync operation');
      pending = { expectedVersion: base.version, operationId: value.pending.operationId, data: validateProgressData(value.pending.data) };
    }
    journal = { format: 1, userId, base, working, pending };
  }
  async function commitPending() {
    if (!journal || disposed || state.phase === 'conflict') return;
    if (!journal.pending) {
      if (equal(journal.working, journal.base.data)) return;
      save({ ...journal, pending: { expectedVersion: journal.base.version, operationId: operationId(), data: { ...journal.working } } });
    }
    const request = journal!.pending!;
    emit({ syncing: true, error: null });
    const response = await api.commit({ ...request, data: { ...request.data } });
    if (disposed) return;
    const remote = snapshot(response);
    if (response.status === 'conflict') { conflict(remote); return; }
    if (response.status !== 'applied' && response.status !== 'duplicate') throw new Error('Invalid cloud commit response');
    const operationVersion = response.operation_version ?? request.expectedVersion + 1;
    if (operationVersion !== request.expectedVersion + 1 || remote.version < operationVersion) throw new Error('Cloud commit version did not match the operation');
    const laterEdits = !equal(journal!.working, request.data);
    if (remote.version > operationVersion && laterEdits) {
      // Retry proved our old operation committed, but both devices edited subsequently.
      save({ ...journal!, pending: null });
      conflict(remote);
      return;
    }
    if (remote.version === operationVersion && !equal(remote.data, request.data)) throw new Error('Cloud commit data did not match the operation');
    save({ ...journal!, base: remote, working: laterEdits ? journal!.working : { ...remote.data }, pending: null });
    emit({ phase: 'ready', ready: true, syncing: false, error: null, conflict: null });
  }
  async function loadRemote() {
    const remote = snapshot(await api.getSnapshot());
    if (disposed) return;
    if (!journal) {
      save({ format: 1, userId, base: remote, working: { ...remote.data }, pending: null });
    } else if (journal.pending) {
      // A lost response must retry the exact receipt before treating a newer version as conflict.
      await commitPending();
      if (disposed || state.phase === 'conflict') return;
      return loadRemote();
    } else if (!equal(journal.working, journal.base.data)) {
      if (remote.version !== journal.base.version || !equal(remote.data, journal.base.data)) { conflict(remote); return; }
    } else {
      save({ ...journal, base: remote, working: { ...remote.data }, pending: null });
    }
    emit({ phase: 'ready', ready: true, syncing: false, error: null, conflict: null });
  }
  const engine = {
    journalKey,
    getState: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    initialize: () => queue(async () => {
      if (initialized) return;
      initialized = true;
      try { readJournal(); } catch (error) {
        // Never overwrite a corrupt journal or pretend malformed cached progress is empty.
        corruptJournal = true;
        emit({ phase: 'error', ready: false, error: error instanceof Error ? error.message : 'Unable to load cached progress' });
        return;
      }
      try { await loadRemote(); } catch (error) { failure(error); }
    }),
    flush: () => queue(async () => {
      if (!initialized || !journal || state.phase === 'conflict' || state.phase === 'error') return;
      try {
        do { await commitPending(); } while (!disposed && state.phase !== 'conflict' && journal && !equal(journal.working, journal.base.data));
      } catch (error) { failure(error); }
    }),
    refresh: () => queue(async () => {
      if (!initialized || corruptJournal || staleJournal || state.phase === 'conflict') return;
      try { await loadRemote(); } catch (error) { failure(error); }
    }),
    resolveConflict: (choice: 'server' | 'local') => queue(async () => {
      if (!journal || !state.conflict) throw new Error('No conflict to resolve');
      const remote = snapshot(state.conflict.remote);
      save({ ...journal, base: remote, working: choice === 'server' ? { ...remote.data } : { ...journal.working }, pending: null });
      emit({ phase: 'ready', ready: true, error: null, conflict: null });
      // Keeping local changes remains queued; explicit flush retries against this observed version.
    }),
    storage: {
      getItem(key: string) { return allowed.has(key) ? state.data[key] ?? null : null; },
      setItem(key: string, value: string) {
        if (disposed) return;
        if (!state.ready || !journal) throw new Error('Account progress is not ready for editing');
        if (!allowed.has(key) || typeof value !== 'string') throw new Error('This key cannot be cloud synchronized');
        const working = validateProgressData({ ...journal.working, [key]: value });
        if (equal(working, journal.working)) return;
        save({ ...journal, working }); emit();
      },
      removeItem(key: string) {
        if (disposed) return;
        if (!state.ready || !journal) throw new Error('Account progress is not ready for editing');
        if (!allowed.has(key)) throw new Error('This key cannot be cloud synchronized');
        const working = { ...journal.working }; delete working[key];
        if (equal(working, journal.working)) return;
        save({ ...journal, working }); emit();
      },
    },
    dispose() {
      disposed = true;
      state = Object.freeze({ ...state, phase: 'disposed', ready: false, syncing: false });
      listeners.clear();
    },
  };
  return engine;
}
