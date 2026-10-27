import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useAccountStorage } from '@/contexts/AccountDataContext';
import { LoginModal } from '@/components/LoginModal';
import { AccountRouteGate } from '@/components/AccountRouteGate';
import { mock } from './supabase-mock';

declare global { interface Window { __browserTests?: { done: boolean; passed: string[]; error?: string } } }
const result = window.__browserTests = { done: false, passed: [] as string[], error: undefined as string | undefined };
let auth: ReturnType<typeof useAuth>;
let storage: ReturnType<typeof useAccountStorage>;
let setValue: (value: string) => void;
let setMode: (mode: 'closed' | 'signup' | 'reset') => void;
function Observer() { auth = useAuth(); return null; }
function encodeChores(value: string) {
  return JSON.stringify([{ id: 'test', title: value, completed: false, dueDate: '2026-10-27' }]);
}
function decodeChores(value: string | null | undefined) {
  if (!value) return 'EMPTY';
  return JSON.parse(value)[0]?.title ?? 'EMPTY';
}
function Probe() {
  storage = useAccountStorage();
  const scoped = storage;
  const [value, update] = useState(() => decodeChores(scoped.getItem('chores')));
  setValue = update;
  useEffect(() => { scoped.setItem('chores', encodeChores(value)); }, [scoped, value]);
  return <output id="progress">{value}</output>;
}
function RoutedHarness() {
  const navigate = useNavigate();
  const [mode, changeMode] = useState<'closed' | 'signup' | 'reset'>('closed');
  setMode = next => { changeMode(next); navigate(next === 'reset' ? '/reset-password' : '/'); };
  return <AccountRouteGate>
    <Probe />
    {mode === 'signup' && <LoginModal isOpen onClose={() => setMode('closed')} defaultMode="signup" />}
  </AccountRouteGate>;
}
function Harness() {
  return <AuthProvider><Observer /><MemoryRouter><RoutedHarness /></MemoryRouter></AuthProvider>;
}
const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message); };
const delay = () => new Promise(resolve => setTimeout(resolve, 15));
async function until(check: () => boolean, message: string) {
  const deadline = performance.now() + 5000;
  while (!check()) { if (performance.now() > deadline) throw new Error(message); await delay(); }
}
function button(label: string) {
  return [...document.querySelectorAll('button')].find(item => item.textContent?.trim() === label);
}
async function accountReady() {
  await until(() => !!button('Start fresh') || !!document.getElementById('progress'), 'Account hydration or legacy choice did not finish');
  if (button('Start fresh')) button('Start fresh')!.click();
  await until(() => !!document.getElementById('progress'), 'Account consumer did not mount after explicit choice');
}
async function clickButton(label: string) {
  await until(() => !!button(label) && !button(label)!.disabled, `Missing or disabled ${label} action`);
  button(label)!.click();
  await delay();
}
async function record(name: string, run: () => Promise<void>) { await run(); result.passed.push(name); }
function input(id: string, value: string) {
  const element = document.getElementById(id) as HTMLInputElement;
  assert(element && !element.disabled, `${id} is missing or disabled`);
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
}
async function submit() {
  await delay();
  const form = document.querySelector('form');
  assert(form, 'Expected rendered form');
  form!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await delay();
}
async function main() {
  // Synthetic data only; this origin/profile is created afresh by the runner.
  localStorage.setItem('chores', 'LEGACY-UNASSIGNED');
  localStorage.setItem('weeklyAllowance', '42');
  const root = createRoot(document.getElementById('root')!);
  root.render(<Harness />);
  await until(() => !!mock.initialResolve, 'Auth initialization never began');
  await record('loading gate does not mount or persist guest data', async () => {
    assert(!document.getElementById('progress'), 'Storage consumer mounted before auth resolved');
    assert(localStorage.getItem('chorecoins:v1:guest:chores') === null, 'Guest data written during initialization');
    mock.finishInitial();
    await until(() => !!document.getElementById('progress'), 'Guest consumer did not mount');
  });
  await record('two accounts, logout/login and delayed old callbacks remain isolated', async () => {
    await auth.login('account-a@example.invalid', 'synthetic');
    await until(() => auth.user?.id === 'account-a', 'Account A not signed in');
    await accountReady();
    setValue('A-CHORES');
    await until(() => decodeChores(storage.getItem('chores')) === 'A-CHORES', 'A chores not saved');
    await until(() => decodeChores(mock.snapshot('account-a').data.chores) === 'A-CHORES', 'A chores did not reach cloud');
    const oldStorage = storage;
    assert((await auth.logout()).success, 'A logout failed');
    await until(() => auth.user === null, 'Logout did not clear auth');
    assert(document.getElementById('progress')!.textContent === 'EMPTY', 'Guest sees account A');
    await auth.login('account-b@example.invalid', 'synthetic');
    await until(() => auth.user?.id === 'account-b', 'Account B not signed in');
    await accountReady();
    assert(document.getElementById('progress')!.textContent === 'EMPTY', 'B sees A data');
    setValue('B-CHORES');
    await until(() => decodeChores(storage.getItem('chores')) === 'B-CHORES', 'B chores not saved');
    await until(() => decodeChores(mock.snapshot('account-b').data.chores) === 'B-CHORES', 'B chores did not reach cloud');
    oldStorage.setItem('chores', encodeChores('A-DELAYED'));
    assert(decodeChores(storage.getItem('chores')) === 'B-CHORES', 'Old callback wrote into B');
    await auth.logout(); await until(() => auth.user === null, 'B logout failed');
    await auth.login('account-a@example.invalid', 'synthetic');
    await until(() => auth.user?.id === 'account-a', 'A relogin failed');
    await accountReady();
    assert(document.getElementById('progress')!.textContent === 'A-CHORES', 'A data did not survive relogin or disposed callback mutated it');
  });
  await record('legacy data stays unassigned and backup notice is rendered', async () => {
    assert(localStorage.getItem('chores') === 'LEGACY-UNASSIGNED', 'Legacy chores changed');
    assert(localStorage.getItem('weeklyAllowance') === '42', 'Legacy allowance changed');
    assert(document.body.textContent!.includes('has not been assigned to any account'), 'Legacy notice missing');
    assert([...document.querySelectorAll('button')].some(button => button.textContent === 'Download legacy backup'), 'Backup action missing');
  });
  await record('failed signout retains authenticated account and progress', async () => {
    mock.signOutError = true;
    const response = await auth.logout();
    assert(!response.success && !!response.error, 'Signout error was hidden');
    await delay();
    assert(auth.user?.id === 'account-a', 'Failed signout falsely cleared auth');
    assert(document.getElementById('progress')!.textContent === 'A-CHORES', 'Failed signout changed progress');
    mock.signOutError = false;
    await auth.logout(); await until(() => auth.user === null, 'Signout did not recover');
  });
  await record('confirmation signup stays open without claiming a session', async () => {
    setMode('signup');
    await until(() => !!document.getElementById('email'), 'Signup modal missing');
    input('email', 'new@example.invalid'); input('password', 'synthetic-password');
    await submit();
    await until(() => document.body.textContent!.includes('Check your email'), 'Confirmation guidance missing');
    assert(auth.user === null, 'Confirmation-only signup authenticated');
    assert(!document.body.textContent!.includes('You’re signed in!'), 'False signed-in success shown');
    await new Promise(resolve => setTimeout(resolve, 1700));
    assert(!!document.querySelector('[role="dialog"]'), 'Confirmation modal auto-closed');
    setMode('closed'); await delay();
  });
  await record('signup error is visible; reopening clears prior success', async () => {
    mock.signupError = true; setMode('signup');
    await until(() => !!document.getElementById('email'), 'Reopened signup form missing');
    input('email', 'new@example.invalid'); input('password', 'synthetic-password'); await submit();
    await until(() => document.body.textContent!.includes('Synthetic signup rejected'), 'Signup error missing');
    assert(auth.user === null, 'Failed signup authenticated');
    setMode('closed'); mock.signupError = false; await delay();
  });
  await record('ordinary session cannot reset password; recovery event can, errors recover', async () => {
    await auth.login('account-a@example.invalid', 'synthetic');
    await until(() => auth.user?.id === 'account-a', 'Reset test login failed');
    await accountReady();
    setMode('reset'); await until(() => !!document.getElementById('confirmPassword'), 'Reset form missing');
    assert((document.getElementById('password') as HTMLInputElement).disabled, 'Ordinary session can reset through recovery screen');
    mock.emit('PASSWORD_RECOVERY', 'account-a');
    await until(() => !(document.getElementById('password') as HTMLInputElement).disabled, 'Verified recovery did not enable reset');
    mock.updateError = true;
    input('password', 'new-synthetic-password'); input('confirmPassword', 'new-synthetic-password'); await submit();
    await until(() => document.body.textContent!.includes('Unable to update your password'), 'Reset exception not displayed');
    assert(!(document.getElementById('password') as HTMLInputElement).disabled, 'Reset form stuck loading');
    mock.updateError = false; await submit();
    await until(() => document.body.textContent!.includes('Your password has been updated'), 'Reset retry failed');
    assert(!auth.isPasswordRecovery && mock.updates === 2, 'Recovery state not consumed or duplicate updates');
  });
  setMode('closed'); await delay(); await accountReady();
  await record('cloud refresh renders edits from another device without overwriting them', async () => {
    await until(() => decodeChores(mock.snapshot('account-a').data.chores) === 'A-CHORES', 'Cloud baseline not ready');
    mock.remoteEdit('account-a', { ...mock.snapshot('account-a').data, chores: encodeChores('OTHER-DEVICE-CHORES') });
    await clickButton('Refresh cloud data');
    await until(() => document.getElementById('progress')?.textContent === 'OTHER-DEVICE-CHORES', 'Refresh did not render remote progress');
    await delay();
    assert(decodeChores(mock.snapshot('account-a').data.chores) === 'OTHER-DEVICE-CHORES', 'Stale component state overwrote remote progress');
    assert(decodeChores(mock.snapshot('account-b').data.chores) === 'B-CHORES', 'Refresh crossed account ownership');
  });
  await record('offline edits survive, concurrent cloud edits require explicit resolution', async () => {
    mock.rpcOffline = true;
    setValue('OFFLINE-LOCAL-CHORES');
    await until(() => document.body.textContent!.includes('Cloud progress: offline.'), 'Offline status missing after RPC failure');
    assert(decodeChores(mock.snapshot('account-a').data.chores) === 'OTHER-DEVICE-CHORES', 'Offline edit unexpectedly reached cloud');
    assert(decodeChores(storage.getItem('chores')) === 'OFFLINE-LOCAL-CHORES', 'Offline local edits lost');
    const journal = localStorage.getItem('chorecoins:sync:v1:user:account-a');
    assert(journal?.includes('OFFLINE-LOCAL-CHORES'), 'Offline edit not durably journaled');
    mock.remoteEdit('account-a', { ...mock.snapshot('account-a').data, chores: encodeChores('CONCURRENT-CLOUD-CHORES') });
    mock.rpcOffline = false;
    await clickButton('Refresh cloud data');
    await until(() => !!button('Use cloud version'), 'Conflict did not require a decision');
    assert(!document.getElementById('progress'), 'Editable consumers mounted during conflict');
    assert(decodeChores(mock.snapshot('account-a').data.chores) === 'CONCURRENT-CLOUD-CHORES', 'Conflict silently overwrote cloud');
    const originalConfirm = window.confirm;
    let confirmationAsked = false;
    window.confirm = () => { confirmationAsked = true; return true; };
    try { await clickButton('Use cloud version'); } finally { window.confirm = originalConfirm; }
    assert(confirmationAsked, 'Cloud choice skipped confirmation');
    await until(() => document.getElementById('progress')?.textContent === 'CONCURRENT-CLOUD-CHORES', 'Explicit cloud choice did not hydrate');
    assert(localStorage.getItem('chores') === 'LEGACY-UNASSIGNED', 'Conflict resolution changed legacy data');
  });
  await record('lost commit acknowledgement adopts newer cloud data and remounts consumers', async () => {
    mock.loseNextCommitAck = true;
    setValue('LOST-ACK-CHORES');
    await until(() => document.body.textContent!.includes('Cloud progress: offline.'), 'Lost acknowledgement did not stay queued');
    assert(decodeChores(mock.snapshot('account-a').data.chores) === 'LOST-ACK-CHORES', 'Synthetic server did not commit before losing response');
    mock.remoteEdit('account-a', { ...mock.snapshot('account-a').data, chores: encodeChores('AFTER-LOST-ACK-REMOTE') });
    mock.rpcOffline = false;
    await clickButton('Refresh cloud data');
    await until(() => document.getElementById('progress')?.textContent === 'AFTER-LOST-ACK-REMOTE', 'Receipt replay adopted remote data but left stale mounted consumers');
    await new Promise(resolve => setTimeout(resolve, 500));
    assert(decodeChores(mock.snapshot('account-a').data.chores) === 'AFTER-LOST-ACK-REMOTE', 'Stale consumer rewrote newer remote progress');
    setValue('POST-ADOPTION-EDIT');
    await until(() => decodeChores(mock.snapshot('account-a').data.chores) === 'POST-ADOPTION-EDIT', 'Remote remount disposed the engine or stopped subsequent writes');
  });
  await record('verified recovery bypasses offline cloud, corrupt queue, and another-tab lock', async () => {
    for (const problem of ['offline', 'corrupt', 'locked']) {
      const userId = `recovery-${problem}`;
      let releaseLock: (() => void) | undefined;
      let heldLock: Promise<void> | undefined;
      if (problem === 'offline') mock.rpcOffline = true;
      if (problem === 'corrupt') localStorage.setItem(`chorecoins:sync:v1:user:${userId}`, '{synthetic-corrupt');
      if (problem === 'locked') {
        let acquired: () => void;
        const ready = new Promise<void>(resolve => { acquired = resolve; });
        heldLock = navigator.locks.request(`chorecoins-sync:${userId}`, async () => {
          acquired(); await new Promise<void>(resolve => { releaseLock = resolve; });
        });
        await ready;
      }
      try {
        setMode('closed');
        await auth.login(`${userId}@example.invalid`, 'synthetic');
        await until(() => auth.user?.id === userId && !document.getElementById('progress'), `${problem} setup did not gate cloud consumers`);
        if (problem !== 'locked') await until(() => document.body.textContent!.includes('Cloud progress: error.'), `${problem} setup did not expose the blocked cloud state`);
        if (problem === 'locked') await until(() => document.body.textContent!.includes('already open in another tab'), 'Synthetic lock did not block cloud view');
        mock.emit('PASSWORD_RECOVERY', userId);
        await until(() => !!document.getElementById('confirmPassword') && !(document.getElementById('password') as HTMLInputElement).disabled, `${problem} cloud state blocked verified password recovery`);
        input('password', 'recovery-synthetic-password'); input('confirmPassword', 'recovery-synthetic-password');
        await submit();
        await until(() => document.body.textContent!.includes('Your password has been updated'), `${problem} password recovery failed`);
        if (problem === 'corrupt') assert(localStorage.getItem(`chorecoins:sync:v1:user:${userId}`) === '{synthetic-corrupt', 'Recovery mutated corrupt progress journal');
      } finally {
        mock.rpcOffline = false;
        releaseLock?.();
        await heldLock;
      }
    }
  });
  await record('legacy import requires ownership consent and preserves excluded source bytes', async () => {
    const userId = 'explicit-legacy-import';
    setMode('closed');
    await auth.login(`${userId}@example.invalid`, 'synthetic');
    await until(() => auth.user?.id === userId && !!button('Import previewed data'), 'Legacy import choice did not render');
    assert(button('Import previewed data')!.disabled, 'Legacy import enabled without ownership consent');
    assert(!document.getElementById('progress'), 'Defaults mounted before explicit legacy choice');
    const source = document.querySelector('select[aria-label="Import source"]') as HTMLSelectElement;
    assert(source.value === 'shared', 'Expected older shared source preview');
    const preview = JSON.parse(document.querySelector('details pre')!.textContent!);
    assert(preview.weeklyAllowance === '42' && !('chores' in preview), 'Preview did not retain valid allowance and exclude malformed chores');
    assert(document.body.textContent!.includes('Invalid fields are preserved locally but excluded from import: chores'), 'Excluded source field not explained');
    const consent = document.querySelector('input[type="checkbox"]') as HTMLInputElement;
    assert(!consent.checked, 'Ownership consent was preselected');
    consent.click();
    await clickButton('Import previewed data');
    await until(() => mock.snapshot(userId).data.weeklyAllowance === '42' && !!mock.snapshot(userId).data.importMetadata, 'Explicit import did not reach cloud');
    const metadata = JSON.parse(mock.snapshot(userId).data.importMetadata);
    assert(metadata.source === 'legacy-shared' && metadata.version === 1, 'Import provenance missing');
    assert(metadata.fields.includes('weeklyAllowance') && !metadata.fields.includes('chores') && !Number.isNaN(Date.parse(metadata.consentedAt)), 'Import consent fields/timestamp invalid');
    assert(localStorage.getItem('chores') === 'LEGACY-UNASSIGNED' && localStorage.getItem('weeklyAllowance') === '42', 'Import changed shared source bytes');
  });
  await record('valid journal with malformed nested portfolio fails closed and retry preserves exact bytes', async () => {
    const userId = 'invalid-nested-journal';
    const journalKey = `chorecoins:sync:v1:user:${userId}`;
    const bytes = JSON.stringify({ format: 1, userId, base: { version: 0, data: { portfolio: '{broken' } }, working: { portfolio: '{broken' }, pending: null });
    localStorage.setItem(journalKey, bytes);
    setMode('closed');
    await auth.login(`${userId}@example.invalid`, 'synthetic');
    await until(() => auth.user?.id === userId && document.body.textContent!.includes('Cloud progress: error.'), 'Malformed nested portfolio did not fail closed');
    assert(!document.getElementById('progress'), 'Malformed journal mounted consumers');
    await clickButton('Retry cloud connection');
    await delay();
    assert(!document.getElementById('progress'), 'Retry bypassed malformed journal validation');
    assert(localStorage.getItem(journalKey) === bytes, 'Retry changed preserved journal bytes');
    assert(mock.snapshot(userId).version === 0, 'Malformed journal wrote to cloud');
  });
  await record('transaction persistence failure rolls back chore and reward together and exports attempted draft', async () => {
    const userId = 'transaction-quota-failure';
    const journalKey = `chorecoins:sync:v1:user:${userId}`;
    setMode('closed');
    await auth.login(`${userId}@example.invalid`, 'synthetic');
    await until(() => auth.user?.id === userId, 'Transaction test login failed');
    await accountReady();
    setValue('TRANSACTION-BASELINE');
    await until(() => decodeChores(mock.snapshot(userId).data.chores) === 'TRANSACTION-BASELINE' && document.body.textContent!.includes('Cloud progress: synced.'), 'Transaction baseline not durably synced');
    const journalBefore = localStorage.getItem(journalKey);
    const cloudBefore = JSON.stringify(mock.snapshot(userId));
    const choresBefore = storage.getItem('chores');
    const statsBefore = storage.getItem('userStats');
    const attemptedChores = JSON.stringify([{ id: 'test', title: 'TRANSACTION-ATTEMPT', completed: true, dueDate: '2026-10-27' }]);
    const attemptedStats = JSON.stringify({ totalChoresCompleted: 1, rewardedChoreOccurrences: ['test'] });
    const originalSet = Storage.prototype.setItem;
    let failedWrites = 0;
    Storage.prototype.setItem = function(key: string, value: string) {
      if (this === localStorage && key === journalKey) { failedWrites++; throw new DOMException('Synthetic quota exhaustion', 'QuotaExceededError'); }
      originalSet.call(this, key, value);
    };
    try {
      storage.transaction(() => {
        storage.setItem('chores', attemptedChores);
        storage.setItem('userStats', attemptedStats);
      });
    } finally { Storage.prototype.setItem = originalSet; }
    await until(() => document.body.textContent!.includes('No partial chore or reward changes were queued'), 'Transaction failure was not visible');
    assert(failedWrites === 1, 'Transaction was not persisted as one final journal write');
    assert(!document.getElementById('progress'), 'Editing was not paused after durability failure');
    assert(storage.getItem('chores') === choresBefore && storage.getItem('userStats') === statsBefore, 'Partial transaction leaked into context cache');
    assert(localStorage.getItem(journalKey) === journalBefore, 'Failed transaction altered durable journal');
    await new Promise(resolve => setTimeout(resolve, 500));
    assert(JSON.stringify(mock.snapshot(userId)) === cloudBefore, 'Failed transaction partially reached cloud');
    const originalCreate = URL.createObjectURL;
    const originalClick = HTMLAnchorElement.prototype.click;
    let exported: Blob | undefined;
    URL.createObjectURL = function(blob: Blob | MediaSource) { if (blob instanceof Blob) exported = blob; return originalCreate.call(URL, blob); };
    HTMLAnchorElement.prototype.click = function() { /* Capture synthetic download without saving a file. */ };
    try { await clickButton('Export preserved draft'); }
    finally { URL.createObjectURL = originalCreate; HTMLAnchorElement.prototype.click = originalClick; }
    assert(exported, 'Attempted draft export did not create a blob');
    const backup = JSON.parse(await exported!.text());
    assert(backup.unsavedDraft.chores === attemptedChores && backup.unsavedDraft.userStats === attemptedStats, 'Export lost part of attempted transaction');
    assert(backup.data.chores === choresBefore && (backup.data.userStats ?? null) === statsBefore, 'Export did not distinguish committed baseline from attempted draft');
  });
  root.unmount();
}
main().catch(error => { result.error = error instanceof Error ? error.stack : String(error); }).finally(() => { result.done = true; });
