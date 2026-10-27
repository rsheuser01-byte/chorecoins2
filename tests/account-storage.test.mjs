import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountStorage, readLegacyProgress } from '../src/lib/accountStorage.ts';
const memory = () => {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
};
test('two accounts and guest have distinct progress, including logout/login', () => {
  const raw = memory();
  const a = createAccountStorage(raw, 'account-A');
  const b = createAccountStorage(raw, 'account-B');
  const guest = createAccountStorage(raw, null);
  for (const key of ['chores', 'weeklyAllowance', 'userStats', 'achievements', 'profileData', 'cash']) {
    a.setItem(key, 'A'); b.setItem(key, 'B'); guest.setItem(key, 'guest');
    assert.equal(createAccountStorage(raw, 'account-A').getItem(key), 'A');
    assert.equal(b.getItem(key), 'B'); assert.equal(guest.getItem(key), 'guest');
  }
  b.removeItem('chores'); assert.equal(a.getItem('chores'), 'A');
});
test('legacy progress remains byte-for-byte intact and is never automatically claimed', () => {
  const raw = memory(); raw.setItem('chores', '[{"title":"legacy"}]'); raw.setItem('userStats', '{invalid-but-preserved');
  raw.setItem('coinbaseCredentials', 'synthetic-secret');
  const before = readLegacyProgress(raw);
  for (const id of [null, 'A', 'B']) {
    const storage = createAccountStorage(raw, id);
    assert.equal(storage.getItem('chores'), null); storage.setItem('chores', '[]'); storage.removeItem('userStats');
  }
  assert.deepEqual(readLegacyProgress(raw), before);
  assert.equal('coinbaseCredentials' in before, false);
});
test('delayed old callbacks retain their old owner and never touch new account', () => {
  const raw = memory(); const old = createAccountStorage(raw, 'A'); const next = createAccountStorage(raw, 'B');
  next.setItem('userStats', 'B'); old.setItem('userStats', 'delayed-A');
  assert.equal(next.getItem('userStats'), 'B');
});
test('namespace cannot collide with guest or delimiter-containing user IDs', () => {
  const raw = memory();
  for (const id of [null, 'guest', 'a:b', 'a%3Ab']) createAccountStorage(raw, id).setItem('chores', String(id));
  for (const id of [null, 'guest', 'a:b', 'a%3Ab']) assert.equal(createAccountStorage(raw, id).getItem('chores'), String(id));
});
