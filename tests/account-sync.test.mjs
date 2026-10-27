import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountSync, validateProgressData } from '../src/lib/accountSync.ts';
const copy = value => structuredClone(value);
const memory = () => { const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key), map }; };
function server() {
  const rows = new Map(), receipts = new Map();
  let failRead = false, loseResponse = false;
  return {
    set failRead(value) { failRead = value; }, set loseResponse(value) { loseResponse = value; },
    row: id => copy(rows.get(id) ?? { version: 0, data: {} }),
    api(id) { return {
      async getSnapshot() { if (failRead) throw new Error('offline'); return copy(rows.get(id) ?? { version: 0, data: {} }); },
      async commit(request) {
        if (failRead) throw new Error('offline');
        const key = `${id}:${request.operationId}`, row = rows.get(id) ?? { version: 0, data: {} };
        if (receipts.has(key)) {
          const receipt = receipts.get(key);
          assert.deepEqual(request, receipt.request);
          return { status: 'duplicate', ...copy(row), operation_version: receipt.version };
        }
        if (row.version !== request.expectedVersion) return { status: 'conflict', ...copy(row) };
        const next = { version: row.version + 1, data: copy(request.data) };
        rows.set(id, next); receipts.set(key, { request: copy(request), version: next.version });
        if (loseResponse) { loseResponse = false; throw new Error('response lost'); }
        return { status: 'applied', ...copy(next), operation_version: next.version };
      },
    }; },
  };
}
let sequence = 0;
const make = (id, backend, persistence = memory(), api = backend.api(id)) => createAccountSync({ userId: id, api, persistence, operationId: () => `op-${++sequence}` });

test('cloud source hydrates a second device and accounts stay separate', async () => {
  const cloud = server(), disk = memory(), a = make('A', cloud, disk);
  assert.throws(() => a.storage.setItem('chores', '[]'), /not ready/);
  await a.initialize(); a.storage.setItem('chores', 'A-chores'); a.storage.setItem('weeklyAllowance', '25'); await a.flush();
  const otherDevice = make('A', cloud), b = make('B', cloud, disk); await otherDevice.initialize(); await b.initialize();
  assert.equal(otherDevice.storage.getItem('chores'), 'A-chores'); assert.equal(b.storage.getItem('chores'), null);
  assert.notEqual(a.journalKey, b.journalKey);
});

test('offline cache and queue survive restart; first-ever fetch failure does not create empty account', async () => {
  const cloud = server(), disk = memory(), a = make('A', cloud, disk); await a.initialize();
  a.storage.setItem('chores', 'before'); await a.flush(); cloud.failRead = true;
  a.storage.setItem('chores', 'offline-change'); await a.flush(); assert.equal(a.getState().phase, 'offline'); a.dispose();
  const resumed = make('A', cloud, disk); await resumed.initialize();
  assert.equal(resumed.getState().ready, true); assert.equal(resumed.storage.getItem('chores'), 'offline-change');
  const first = make('B', cloud); await first.initialize(); assert.equal(first.getState().ready, false); assert.equal(first.getState().phase, 'error');
  cloud.failRead = false; await resumed.flush(); assert.equal(cloud.row('A').data.chores, 'offline-change');
  await first.refresh(); assert.equal(first.getState().ready, true);
});

test('lost commit response retries the same operation and never increments version twice', async () => {
  const cloud = server(), disk = memory(), a = make('A', cloud, disk); await a.initialize();
  a.storage.setItem('chores', 'done'); cloud.loseResponse = true; await a.flush();
  assert.equal(cloud.row('A').version, 1); assert.equal(a.getState().phase, 'offline');
  const pendingId = JSON.parse(disk.getItem(a.journalKey)).pending.operationId; a.dispose();
  const resumed = make('A', cloud, disk); await resumed.initialize();
  assert.equal(cloud.row('A').version, 1); assert.equal(resumed.getState().dirty, false); assert.equal(resumed.storage.getItem('chores'), 'done');
  assert.ok(pendingId);
});

test('two-device CAS conflict preserves both versions and requires explicit resolution', async () => {
  const cloud = server(), a = make('A', cloud), b = make('A', cloud); await a.initialize(); await b.initialize();
  a.storage.setItem('chores', 'device-A'); b.storage.setItem('chores', 'device-B'); await a.flush(); await b.flush();
  assert.equal(b.getState().phase, 'conflict'); assert.equal(b.getState().conflict.local.chores, 'device-B'); assert.equal(b.getState().conflict.remote.data.chores, 'device-A');
  assert.throws(() => b.storage.setItem('chores', 'oops'), /not ready/); assert.equal(cloud.row('A').data.chores, 'device-A');
  await b.resolveConflict('local'); await b.flush(); assert.equal(cloud.row('A').data.chores, 'device-B');
  await a.refresh(); assert.equal(a.storage.getItem('chores'), 'device-B');
});

test('explicit server choice drops only queued local version and never automatically claims legacy keys', async () => {
  const cloud = server(), disk = memory(); disk.setItem('chores', 'legacy');
  const a = make('A', cloud, disk), b = make('A', cloud); await a.initialize(); await b.initialize();
  assert.equal(a.storage.getItem('chores'), null);
  a.storage.setItem('chores', 'A'); b.storage.setItem('chores', 'B'); await b.flush(); await a.flush();
  await a.resolveConflict('server'); await a.flush(); assert.equal(a.storage.getItem('chores'), 'B'); assert.equal(cloud.row('A').version, 1); assert.equal(disk.getItem('chores'), 'legacy');
});

test('new edits during an in-flight snapshot are not lost', async () => {
  const cloud = server(), base = cloud.api('A'); let release, started;
  const began = new Promise(resolve => { started = resolve; }); let once = true;
  const api = { ...base, async commit(request) { if (once) { once = false; started(); await new Promise(resolve => { release = resolve; }); } return base.commit(request); } };
  const a = make('A', cloud, memory(), api); await a.initialize(); a.storage.setItem('chores', 'first');
  const flight = a.flush(); await began; a.storage.setItem('chores', 'second'); release(); await flight;
  assert.equal(cloud.row('A').version, 2); assert.equal(cloud.row('A').data.chores, 'second'); assert.equal(a.getState().dirty, false);
});

test('late completion after dispose cannot mutate cache or another account', async () => {
  const cloud = server(), disk = memory(), base = cloud.api('A'); let release;
  const a = make('A', cloud, disk, { ...base, getSnapshot: () => new Promise(resolve => { release = resolve; }) });
  const loading = a.initialize(); await Promise.resolve(); a.dispose();
  const b = make('B', cloud, disk); await b.initialize(); b.storage.setItem('chores', 'B');
  release({ version: 9, data: { chores: 'A' } }); await loading;
  assert.equal(disk.getItem(a.journalKey), null); assert.equal(b.storage.getItem('chores'), 'B');
});

test('credentials and oversized snapshots are rejected; corrupt journals remain intact', async () => {
  assert.throws(() => validateProgressData({ coinbaseCredentials: 'secret' }), /Unsupported/);
  assert.throws(() => validateProgressData({ chores: 'x'.repeat(1024 * 1024) }), /limit/);
  const cloud = server(), disk = memory(), a = make('A', cloud, disk);
  disk.setItem(a.journalKey, 'corrupt'); await a.initialize();
  assert.equal(a.getState().ready, false); assert.equal(disk.getItem(a.journalKey), 'corrupt');
  await a.refresh(); assert.equal(a.getState().ready, false); assert.equal(disk.getItem(a.journalKey), 'corrupt');
});

test('duplicate acknowledgement with newer remote work does not overwrite later local edits', async () => {
  const cloud = server(), disk = memory(), a = make('A', cloud, disk); await a.initialize();
  a.storage.setItem('chores', 'first'); cloud.loseResponse = true; await a.flush();
  a.storage.setItem('chores', 'later-local');
  const b = make('A', cloud); await b.initialize(); b.storage.setItem('chores', 'later-remote'); await b.flush(); a.dispose();
  const resumed = make('A', cloud, disk); await resumed.initialize();
  assert.equal(resumed.getState().phase, 'conflict'); assert.equal(resumed.getState().conflict.local.chores, 'later-local'); assert.equal(resumed.getState().conflict.remote.data.chores, 'later-remote');
});


test('failed durable persistence never sends an unjournaled operation or destroys cached values', async () => {
  const cloud = server(), disk = memory(); let failWrites = false;
  const persistence = { ...disk, setItem(key, value) { if (failWrites) throw new Error('disk full'); disk.setItem(key, value); } };
  const a = make('A', cloud, persistence); await a.initialize(); a.storage.setItem('chores', 'saved-locally');
  const before = disk.getItem(a.journalKey); failWrites = true;
  assert.throws(() => a.storage.setItem('chores', 'not-saved'), /disk full/);
  await a.flush(); assert.equal(cloud.row('A').version, 0); assert.equal(disk.getItem(a.journalKey), before);
  failWrites = false; await a.flush(); assert.equal(cloud.row('A').data.chores, 'saved-locally');
});


test('stale same-account tab cannot overwrite a newer durable local queue', async () => {
  const cloud = server(), disk = memory(), a = make('A', cloud, disk), b = make('A', cloud, disk);
  await a.initialize(); await b.initialize();
  a.storage.setItem('chores', 'tab-A-offline-draft');
  const stored = disk.getItem(a.journalKey);
  assert.throws(() => b.storage.setItem('chores', 'tab-B-stale-draft'), /another tab/);
  assert.equal(b.getState().ready, false); assert.equal(b.getState().phase, 'error');
  assert.equal(disk.getItem(a.journalKey), stored);
  await b.refresh(); await b.flush(); assert.equal(disk.getItem(a.journalKey), stored);
  await a.flush(); assert.equal(cloud.row('A').data.chores, 'tab-A-offline-draft');
});
