import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AccountDataBoundary, useAccountStorage } from '@/contexts/AccountDataContext';
import { LoginModal } from '@/components/LoginModal';
import ResetPassword from '@/pages/ResetPassword';
import { mock } from './supabase-mock';

declare global { interface Window { __browserTests?: { done: boolean; passed: string[]; error?: string } } }
const result = window.__browserTests = { done: false, passed: [] as string[], error: undefined as string | undefined };
let auth: ReturnType<typeof useAuth>;
let storage: ReturnType<typeof useAccountStorage>;
let setValue: (value: string) => void;
let setMode: (mode: 'closed' | 'signup' | 'reset') => void;
function Observer() { auth = useAuth(); return null; }
function Probe() {
  storage = useAccountStorage();
  const scoped = storage;
  const [value, update] = useState(() => scoped.getItem('chores') ?? 'EMPTY');
  setValue = update;
  useEffect(() => { scoped.setItem('chores', value); }, [scoped, value]);
  return <output id="progress">{value}</output>;
}
function Harness() {
  const [mode, changeMode] = useState<'closed' | 'signup' | 'reset'>('closed');
  setMode = changeMode;
  return <AuthProvider><Observer /><AccountDataBoundary>
    <Probe />
    {mode === 'signup' && <LoginModal isOpen onClose={() => changeMode('closed')} defaultMode="signup" />}
    {mode === 'reset' && <ResetPassword />}
  </AccountDataBoundary></AuthProvider>;
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
    await until(() => storage.getItem('chores') === 'A-CHORES', 'A chores not saved');
    await until(() => mock.snapshot('account-a').data.chores === 'A-CHORES', 'A chores did not reach cloud');
    const oldStorage = storage;
    assert((await auth.logout()).success, 'A logout failed');
    await until(() => auth.user === null, 'Logout did not clear auth');
    assert(document.getElementById('progress')!.textContent === 'EMPTY', 'Guest sees account A');
    await auth.login('account-b@example.invalid', 'synthetic');
    await until(() => auth.user?.id === 'account-b', 'Account B not signed in');
    await accountReady();
    assert(document.getElementById('progress')!.textContent === 'EMPTY', 'B sees A data');
    setValue('B-CHORES');
    await until(() => storage.getItem('chores') === 'B-CHORES', 'B chores not saved');
    await until(() => mock.snapshot('account-b').data.chores === 'B-CHORES', 'B chores did not reach cloud');
    oldStorage.setItem('chores', 'A-DELAYED');
    assert(storage.getItem('chores') === 'B-CHORES', 'Old callback wrote into B');
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
  setMode('closed'); await delay();
  await record('cloud refresh renders edits from another device without overwriting them', async () => {
    await until(() => mock.snapshot('account-a').data.chores === 'A-CHORES', 'Cloud baseline not ready');
    mock.remoteEdit('account-a', { ...mock.snapshot('account-a').data, chores: 'OTHER-DEVICE-CHORES' });
    await clickButton('Refresh cloud data');
    await until(() => document.getElementById('progress')?.textContent === 'OTHER-DEVICE-CHORES', 'Refresh did not render remote progress');
    await delay();
    assert(mock.snapshot('account-a').data.chores === 'OTHER-DEVICE-CHORES', 'Stale component state overwrote remote progress');
    assert(mock.snapshot('account-b').data.chores === 'B-CHORES', 'Refresh crossed account ownership');
  });
  await record('offline edits survive, concurrent cloud edits require explicit resolution', async () => {
    mock.rpcOffline = true;
    setValue('OFFLINE-LOCAL-CHORES');
    await until(() => document.body.textContent!.includes('Cloud progress: offline.'), 'Offline status missing after RPC failure');
    assert(mock.snapshot('account-a').data.chores === 'OTHER-DEVICE-CHORES', 'Offline edit unexpectedly reached cloud');
    assert(storage.getItem('chores') === 'OFFLINE-LOCAL-CHORES', 'Offline local edits lost');
    const journal = localStorage.getItem('chorecoins:sync:v1:user:account-a');
    assert(journal?.includes('OFFLINE-LOCAL-CHORES'), 'Offline edit not durably journaled');
    mock.remoteEdit('account-a', { ...mock.snapshot('account-a').data, chores: 'CONCURRENT-CLOUD-CHORES' });
    mock.rpcOffline = false;
    await clickButton('Refresh cloud data');
    await until(() => !!button('Use cloud version'), 'Conflict did not require a decision');
    assert(!document.getElementById('progress'), 'Editable consumers mounted during conflict');
    assert(mock.snapshot('account-a').data.chores === 'CONCURRENT-CLOUD-CHORES', 'Conflict silently overwrote cloud');
    const originalConfirm = window.confirm;
    let confirmationAsked = false;
    window.confirm = () => { confirmationAsked = true; return true; };
    try { await clickButton('Use cloud version'); } finally { window.confirm = originalConfirm; }
    assert(confirmationAsked, 'Cloud choice skipped confirmation');
    await until(() => document.getElementById('progress')?.textContent === 'CONCURRENT-CLOUD-CHORES', 'Explicit cloud choice did not hydrate');
    assert(localStorage.getItem('chores') === 'LEGACY-UNASSIGNED', 'Conflict resolution changed legacy data');
  });
  root.unmount();
}
main().catch(error => { result.error = error instanceof Error ? error.stack : String(error); }).finally(() => { result.done = true; });
