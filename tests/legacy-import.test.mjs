import test from 'node:test';
import assert from 'node:assert/strict';
import { previewLegacyImport } from '../src/lib/legacyImport.ts';
const store = data => ({ getItem: key => data[key] ?? null, setItem(){ throw new Error('Preview must not mutate'); }, removeItem(){ throw new Error('Preview must not delete'); } });
test('legacy preview preserves sources and includes only known valid progress, never credentials', () => {
  const raw = { chores: '[]', weeklyAllowance: '20', userStats: '{"totalChoresCompleted":5}', coinbaseCredentials: 'synthetic-secret', sessionToken: 'synthetic-token' };
  const preview = previewLegacyImport(store(raw));
  assert.deepEqual(Object.keys(preview.data).sort(), ['chores','userStats','weeklyAllowance']);
  assert.deepEqual(JSON.parse(preview.data.userStats).rewardedChoreOccurrences, []);
  assert.equal(raw.userStats, '{"totalChoresCompleted":5}');
});
test('malformed legacy values stay in source and are explicitly excluded from preview', () => {
  const raw = { chores: '{broken', userStats: '{"totalChoresCompleted":-1}', weeklyAllowance: 'NaN' };
  const preview = previewLegacyImport(store(raw));
  assert.equal(Object.keys(preview.data).length, 0);
  assert.equal(preview.invalid.length, 3);
  assert.equal(raw.chores, '{broken');
});

test('completed one-time chores reserve rewards only in explicit preview without changing counts or source', () => {
  const raw = { chores: JSON.stringify([{id:'one',title:'Dishes',completed:true}]), userStats: JSON.stringify({totalChoresCompleted:4,totalMoneyEarned:10}) };
  const before={...raw}; const preview=previewLegacyImport(store(raw));
  const stats=JSON.parse(preview.data.userStats);
  assert.deepEqual(stats.rewardedChoreOccurrences,[JSON.stringify(['chore','one'])]);
  assert.equal(stats.totalChoresCompleted,4);assert.equal(stats.totalMoneyEarned,10);
  assert.equal(preview.adjustments.length,1);assert.deepEqual(raw,before);
});
test('inconsistent or missing baseline excludes chores and stats together instead of inflating totals', () => {
  for (const baseline of [undefined,JSON.stringify({totalChoresCompleted:0})]) {
    const raw={chores:JSON.stringify([{id:'one',title:'Dishes',completed:true}]),weeklyAllowance:'20',...(baseline?{userStats:baseline}:{})};
    const preview=previewLegacyImport(store(raw));
    assert.equal(preview.data.chores,undefined);assert.equal(preview.data.userStats,undefined);
    assert.equal(preview.data.weeklyAllowance,'20');assert.ok(preview.adjustments[0].includes('manual review'));
  }
});
test('ambiguous recurring dates are blocked, explicit occurrence dates produce stable reservations', () => {
  const chore={id:'i',seriesId:'s',title:'Daily',completed:true,dueDate:'2026-10-27T00:00:00Z'};
  const raw={chores:JSON.stringify([chore]),userStats:JSON.stringify({totalChoresCompleted:1})};
  assert.equal(previewLegacyImport(store(raw)).data.chores,undefined);
  raw.chores=JSON.stringify([{...chore,occurrenceDate:'2026-10-27'}]);
  const preview=previewLegacyImport(store(raw));
  assert.deepEqual(JSON.parse(preview.data.userStats).rewardedChoreOccurrences,[JSON.stringify(['series','s',2026,10,27])]);
});
test('existing occurrence ledger remains deduplicated and count unchanged', () => {
  const id=JSON.stringify(['chore','a']);
  const preview=previewLegacyImport(store({chores:JSON.stringify([{id:'a',title:'Done',completed:true}]),userStats:JSON.stringify({totalChoresCompleted:1,rewardedChoreOccurrences:[id]})}));
  assert.deepEqual(JSON.parse(preview.data.userStats).rewardedChoreOccurrences,[id]);assert.deepEqual(preview.adjustments,[]);
});
