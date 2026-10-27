import { createAccountStorage, type StorageAdapter } from './accountStorage.ts';
import { syncedProgressKeys, validateProgressData, type ProgressData } from './accountSync.ts';
import { validateProgressPayloads } from './progressValidation.ts';

const allowed = new Set<string>(syncedProgressKeys);
function validate(data: unknown): ProgressData {
  return validateProgressPayloads(validateProgressData(data));
}
/** Local-only account progress. No cloud request or runtime network fallback exists here.
 * One durable envelope makes coupled chore/reward edits atomic. Original same-owner
 * per-key data is read once and preserved; shared legacy data is never assigned.
 */
export function createLocalProgress(storage: StorageAdapter, userId: string) {
  if (!userId || userId.length > 128) throw new Error('Invalid local account');
  const key = `chorecoins:local:v1:${encodeURIComponent(userId)}`;
  const scoped = createAccountStorage(storage, userId);
  let lastRaw = storage.getItem(key);
  const original: Record<string, string | null> = {};
  let data: ProgressData;
  if (lastRaw !== null) {
    const saved = JSON.parse(lastRaw);
    if (!saved || saved.format !== 1 || saved.userId !== userId || Object.keys(saved).length !== 3) throw new Error('Invalid local account progress');
    data = validate(saved.data);
  } else {
    const initial: ProgressData = {};
    for (const name of syncedProgressKeys) {
      const value = scoped.getItem(name); original[name] = value;
      if (value !== null) initial[name] = value;
    }
    data = validate(initial);
  }
  let draft: ProgressData | null = null;
  const assertCurrent = () => {
    if (storage.getItem(key) !== lastRaw) throw new Error('Local progress changed in another tab. Reload before editing.');
    if (lastRaw === null && Object.keys(original).some(name => scoped.getItem(name) !== original[name])) throw new Error('Previous local progress changed. Reload before editing.');
  };
  const persist = (next: ProgressData) => {
    const checked = validate(next);
    assertCurrent();
    const raw = JSON.stringify({ format: 1, userId, data: checked });
    // localStorage.setItem is atomic; never update memory before it succeeds.
    storage.setItem(key, raw);
    lastRaw = raw; data = checked;
  };
  const adapter = {
    getItem(name: string): string | null {
      return allowed.has(name) ? (draft ?? data)[name] ?? null : scoped.getItem(name);
    },
    setItem(name: string, value: string) {
      if (!allowed.has(name)) {
        if (draft) throw new Error('Non-progress changes cannot join a progress transaction');
        scoped.setItem(name, value); return;
      }
      if (draft) draft[name] = value;
      else persist({ ...data, [name]: value });
    },
    removeItem(name: string) {
      if (!allowed.has(name)) {
        if (draft) throw new Error('Non-progress changes cannot join a progress transaction');
        scoped.removeItem(name); return;
      }
      if (draft) delete draft[name];
      else { const next = { ...data }; delete next[name]; persist(next); }
    },
    transaction(work: () => void) {
      if (work.constructor.name === 'AsyncFunction') throw new Error('Local progress transactions must be synchronous');
      const outer = draft;
      draft = { ...(outer ?? data) };
      try {
        const result = (work as () => unknown)();
        if (result && typeof (result as unknown as { then?: unknown }).then === 'function') throw new Error('Local progress transactions must be synchronous');
        if (outer) { Object.keys(outer).forEach(name => delete outer[name]); Object.assign(outer, draft); }
        else persist(draft);
      } catch (error) {
        const failure = new Error('Local progress was not saved. No partial action was committed.');
        Object.assign(failure, { unsavedProgress: { ...draft }, cause: error });
        throw failure;
      } finally { draft = outer; }
    },
    /** Safe allowlisted snapshot only; never exports auth or connector credentials. */
    read(): ProgressData { return { ...data }; },
  };
  return adapter;
}
