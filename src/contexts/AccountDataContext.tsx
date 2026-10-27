import { createContext, useContext, useMemo, useRef, useEffect, useState, useCallback, useSyncExternalStore, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { safeLocalStorage } from '@/lib/safeLocalStorage';
import { createAccountStorage, readLegacyProgress } from '@/lib/accountStorage';
import { observableStorage, type ObservableStorage } from '@/lib/observableStorage';
import { createAccountSync, syncedProgressKeys, type ProgressData, type ProgressApi } from '@/lib/accountSync';
import { previewLegacyImport } from '@/lib/legacyImport';
import { validateProgressPayloads } from '@/lib/progressValidation';
import { createLocalProgress } from '@/lib/localProgress';
import { isCloudSyncEnabled } from '@/lib/cloudFeature';
import { createAccountProgressApi } from '@/services/accountProgressApi';

const AccountStorageContext = createContext<ObservableStorage | null>(null);
const cloudKeys = new Set<string>(syncedProgressKeys);
function download(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function LegacyNotice() {
  if (!Object.keys(readLegacyProgress(safeLocalStorage)).length) return null;
  return <aside className="p-3 border-b bg-muted text-sm" role="status">
    Older shared-browser progress is preserved, but has not been assigned to any account.
    {' '}<button className="underline" onClick={() => download('chorecoins-legacy-backup.json', readLegacyProgress(safeLocalStorage))}>Download legacy backup</button>
    {' '}Keep this backup private. No automatic import or deletion occurs.
  </aside>;
}
function GuestSession({ children }: { children: ReactNode }) {
  const storage = useMemo(() => observableStorage(createAccountStorage(safeLocalStorage, null)), []);
  return <AccountStorageContext.Provider value={storage}><LegacyNotice />{children}</AccountStorageContext.Provider>;
}
function LocalSession({ session, children }: { session: Session; children: ReactNode }) {
  const owner = session.user.id;
  const active = useRef(true);
  const depth = useRef(0);
  const [locked, setLocked] = useState(false);
  const [draft, setDraft] = useState<ProgressData>({});
  const [error, setError] = useState<string | null>(null);
  const initialized = useMemo(() => {
    try { return { value: createLocalProgress(window.localStorage, owner), error: null }; }
    catch { return { value: null, error: 'Local progress could not be opened safely. Existing bytes are preserved; export them before repairing browser storage.' }; }
  }, [owner]);
  const storage = useMemo(() => observableStorage({
    getItem: key => initialized.value?.getItem(key) ?? null,
    setItem(key, value) { if (!active.current) return; try { initialized.value!.setItem(key, value); } catch { setDraft(previous => ({ ...previous, [key]: value })); setError('This change could not be saved. Editing is paused; your previously saved progress is preserved.'); if (depth.current) throw new Error('Local progress write failed'); } },
    removeItem(key) { if (!active.current) return; try { initialized.value!.removeItem(key); } catch { setError('This change could not be saved. Editing is paused.'); if (depth.current) throw new Error('Local progress write failed'); } },
    transaction(work) { if (!active.current) return; depth.current++; try { initialized.value!.transaction(work); } catch (failure) { setDraft((failure as { unsavedProgress?: ProgressData }).unsavedProgress || {}); setError('The complete action could not be saved. No partial progress was stored. Editing is paused.'); } finally { depth.current--; } },
  }), [initialized]);
  useEffect(() => {
    active.current = true;
    let release: (() => void) | undefined;
    if (!navigator.locks) setError('This browser cannot safely coordinate local account storage. Use a browser with Web Locks support; existing data is preserved.');
    else void navigator.locks.request(`chorecoins-local:${owner}`, { mode: 'exclusive', ifAvailable: true }, async lock => {
      if (!active.current) return;
      if (!lock) { setError('This local account is already open in another tab. Close that tab and reload here.'); return; }
      setLocked(true);
      await new Promise<void>(resolve => { release = resolve; });
    }).catch(() => { if (active.current) setError('Unable to lock local storage safely. Reload before editing.'); });
    return () => { active.current = false; release?.(); };
  }, [owner]);
  const exportLocal = () => {
    const scoped = createAccountStorage(safeLocalStorage, owner);
    download('chorecoins-local-account-backup.json', { version: 1, localJournal: window.localStorage.getItem(`chorecoins:local:v1:${encodeURIComponent(owner)}`), previousAccountProgress: readLegacyProgress(scoped), unsavedDraft: draft });
  };
  return <AccountStorageContext.Provider value={storage}>
    <LegacyNotice />
    <aside className="p-3 border-b bg-muted text-sm" role="status">
      Local-only progress: saved on this browser. Cloud syncing is not enabled. Signing in on another device will not copy these chores.
      {' '}<button className="underline" onClick={exportLocal}>Download account backup</button>
      <p>Do not clear browser storage. Local account separation is not encryption or protection from someone using this browser.</p>
    </aside>
    {error || initialized.error ? <section role="alert">{error || initialized.error}</section> : locked ? children : <p role="status">Opening local account storage…</p>}
  </AccountStorageContext.Provider>;
}
function CloudSession({ session, children }: { session: Session; children: ReactNode }) {
  const { logout } = useAuth();
  const userId = session.user.id;
  const apiRef = useRef<ProgressApi>();
  // These adapters create a client with a captured account token, never a global mutable auth client.
  apiRef.current = {
    getSnapshot: () => createAccountProgressApi(session).getSnapshot(),
    commit: request => createAccountProgressApi(session).commit(request),
  };
  const engine = useMemo(() => createAccountSync({ userId, validateData: validateProgressPayloads,
    api: { getSnapshot: () => apiRef.current!.getSnapshot(), commit: request => apiRef.current!.commit(request) },
    // Durability failures must throw; never silently fall back to an in-memory queue.
    persistence: { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value), removeItem: key => window.localStorage.removeItem(key) },
  }), [userId]);
  const state = useSyncExternalStore(engine.subscribe, engine.getState, engine.getState);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [failedDraft, setFailedDraft] = useState<ProgressData>({});
  const [importDismissed, setImportDismissed] = useState(false);
  const [ownsLegacy, setOwnsLegacy] = useState(false);
  const local = useMemo(() => createAccountStorage(safeLocalStorage, userId), [userId]);
  const candidates = useMemo(() => {
    let account;
    try { account = previewLegacyImport(createLocalProgress(window.localStorage, userId)); }
    catch { account = { data: {}, invalid: ['Preserved local account journal needs manual review'], adjustments: [] }; }
    return { account, shared: previewLegacyImport(safeLocalStorage) };
  }, [local, userId]);
  const [source, setSource] = useState<'account' | 'shared'>(() => Object.keys(candidates.account.data).length ? 'account' : 'shared');
  const transactionDepth = useRef(0);
  const storage = useMemo(() => {
    const viewRevision = state.remoteRevision;
    return observableStorage({
    getItem: key => cloudKeys.has(key) ? engine.storage.getItem(key) : local.getItem(key),
    setItem(key, value) {
      if (viewRevision !== engine.getState().remoteRevision) return;
      try { if (cloudKeys.has(key)) engine.storage.setItem(key, value); else local.setItem(key, value); }
      catch (error) { if (transactionDepth.current) throw error; setFailedDraft(previous => ({ ...previous, [key]: value })); setWriteError('This change could not be saved to durable device storage. Editing is paused; export your draft before freeing storage and reloading.'); }
    },
    removeItem(key) {
      if (viewRevision !== engine.getState().remoteRevision) return;
      try { if (cloudKeys.has(key)) engine.storage.removeItem(key); else local.removeItem(key); }
      catch (error) { if (transactionDepth.current) throw error; setWriteError('A change could not be saved to durable device storage. Editing is paused.'); }
    },
    transaction(work) {
      if (viewRevision !== engine.getState().remoteRevision) return;
      transactionDepth.current++;
      try { engine.transaction(work); }
      catch (error) {
        const draft = (error as { unsavedProgress?: ProgressData }).unsavedProgress;
        if (draft) setFailedDraft(draft);
        setWriteError('The complete action could not be saved. No partial chore or reward changes were queued. Export the attempted draft before retrying.');
      } finally { transactionDepth.current--; }
    },
    });
  }, [engine, local, state.remoteRevision]);
  const storageRef = useRef(storage);
  storageRef.current = storage;

  const refresh = useCallback(async () => {
    await engine.flush();
    await engine.refresh();
  }, [engine]);

  useEffect(() => {
    let active = true;
    let release: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = engine.subscribe(() => {
      storageRef.current.notify();
      if (timer) clearTimeout(timer);
      const current = engine.getState();
      if (current.phase === 'ready' && current.ready && current.dirty && !current.syncing) timer = setTimeout(() => { void engine.flush(); }, 350);
    });
    if (!navigator.locks) setLockError('This browser cannot safely coordinate offline sync. Use a browser with Web Locks support. Your data is preserved.');
    else void navigator.locks.request(`chorecoins-sync:${userId}`, { mode: 'exclusive', ifAvailable: true }, async lock => {
      if (!active) return;
      if (!lock) { setLockError('This account is already open in another tab. Close that tab, then reload here to protect offline changes.'); return; }
      await engine.initialize();
      if (active) await new Promise<void>(resolve => { release = resolve; });
    }).catch(() => { if (active) setLockError('Unable to lock account storage safely. Close other tabs and reload.'); });
    const reconnect = () => {
      // Do not discard an open unsaved form merely because this tab regained focus.
      const editing = document.querySelector('[role="dialog"]') || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '');
      if (!editing) void refresh();
    };
    window.addEventListener('online', reconnect);
    window.addEventListener('focus', reconnect);
    return () => { active = false; if (timer) clearTimeout(timer); unsubscribe(); engine.dispose(); release?.(); window.removeEventListener('online', reconnect); window.removeEventListener('focus', reconnect); };
  }, [engine, userId, refresh]);

  const exportCurrent = () => download('chorecoins-account-backup.json', { accountId: userId, version: state.version, data: state.data, unsavedDraft: failedDraft });
  const isEmpty = state.version === 0 && !Object.keys(state.data).length;
  const hasCandidate = Object.keys(candidates.account.data).length + Object.keys(candidates.shared.data).length > 0;
  const showImport = state.ready && isEmpty && hasCandidate && !importDismissed;
  const importLegacy = () => {
    if (!ownsLegacy || !isEmpty || !state.ready) return;
    storage.transaction(() => {
      for (const [key, value] of Object.entries(candidates[source].data)) storage.setItem(key, value);
      storage.setItem('importMetadata', JSON.stringify({ version: 1, source: source === 'account' ? 'legacy-account' : 'legacy-shared', consentedAt: new Date().toISOString(), fields: Object.keys(candidates[source].data) }));
    });
    setImportDismissed(true);
    void engine.flush();
  };
  return <AccountStorageContext.Provider value={storage}>
    <LegacyNotice />
    <aside className="p-3 border-b bg-muted text-sm" role="status">
      Cloud progress: {state.syncing ? 'saving' : state.phase === 'ready' ? state.dirty ? 'queued on this device' : 'synced' : state.phase}.
      {' '}<button className="underline" disabled={!state.ready || state.syncing} onClick={() => { void refresh(); }}>Refresh cloud data</button>
      {' '}<button className="underline" onClick={exportCurrent}>Download account backup</button>
      {' '}<button className="underline" onClick={() => { void logout().then(result => { if (!result.success) setActionError(result.error || 'Unable to sign out. Please retry.'); }); }}>Sign out</button>
      {state.error && <p>{state.error}</p>}{actionError && <p role="alert">{actionError}</p>}
      {state.phase === 'offline' && <p>Offline changes remain on this device until acknowledged by the server. Do not clear browser storage.</p>}
    </aside>
    {lockError || writeError ? <section role="alert" className="p-6">{lockError || writeError}<button onClick={exportCurrent}>Export preserved draft</button></section>
    : state.conflict ? <section className="p-6" role="alert">
      <h2>Another device changed this account</h2>
      <p>Nothing has been overwritten. Download both versions before choosing the cloud copy. Automatic merging and replacing cloud rewards are not supported.</p>
      <button onClick={() => download('chorecoins-conflict-backup.json', state.conflict)}>Download both versions</button>
      <button onClick={() => { if (window.confirm('Use the cloud version and discard these queued edits? Download both versions first.')) void engine.resolveConflict('server'); }}>Use cloud version</button>
    </section>
    : !state.ready ? <section className="p-6" role="status"><p>Loading your cloud progress. No local defaults will replace cloud data.</p><button onClick={() => { void engine.refresh(); }}>Retry cloud connection</button></section>
    : showImport ? <section className="p-6 space-y-3">
      <h2>Choose how to start this empty cloud account</h2>
      <p>Old data remains untouched. Import only data you own. Imported money and investments are unverified simulation values, never bank balances.</p>
      <select aria-label="Import source" value={source} onChange={event => { setSource(event.target.value as 'account' | 'shared'); setOwnsLegacy(false); }}>
        <option value="account">Previous data for this account on this browser</option><option value="shared">Older shared-browser data (owner unknown)</option>
      </select>
      <details><summary>Preview data before import ({Object.keys(candidates[source].data).length} fields)</summary><pre className="max-h-60 overflow-auto">{JSON.stringify(candidates[source].data, null, 2)}</pre></details>
      {!!candidates[source].invalid.length && <p>Invalid fields are preserved locally but excluded from import: {candidates[source].invalid.join(', ')}.</p>}
      {!!candidates[source].adjustments.length && <ul>{candidates[source].adjustments.map(message => <li key={message}>{message}</li>)}</ul>}
      <label><input type="checkbox" checked={ownsLegacy} onChange={event => setOwnsLegacy(event.target.checked)} /> I own this data and want it copied into {session.user.email || 'this account'}.</label>
      <button disabled={!ownsLegacy || !Object.keys(candidates[source].data).length} onClick={importLegacy}>Import previewed data</button>
      <button onClick={() => setImportDismissed(true)}>Start fresh</button>
    </section>
    : <div key={state.remoteRevision}>{children}</div>}
  </AccountStorageContext.Provider>;
}
export function AccountDataBoundary({ children }: { children: ReactNode }) {
  const { session, isLoading, authStatusError } = useAuth();
  if (isLoading) return <section role="status"><p>{authStatusError || 'Loading your account…'}</p>{authStatusError && <button onClick={() => window.location.reload()}>Reload to retry account connection</button>}</section>;
  if (session && !isCloudSyncEnabled(import.meta.env.VITE_CLOUD_SYNC_ENABLED)) return <LocalSession key={`local:${session.user.id}`} session={session}>{children}</LocalSession>;
  return session ? <CloudSession key={`user:${session.user.id}`} session={session}>{children}</CloudSession> : <GuestSession key="guest">{children}</GuestSession>;
}
export function useAccountStorage() {
  const storage = useContext(AccountStorageContext);
  if (!storage) throw new Error('useAccountStorage requires AccountDataBoundary');
  return storage;
}
