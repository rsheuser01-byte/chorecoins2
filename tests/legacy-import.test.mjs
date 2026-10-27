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
