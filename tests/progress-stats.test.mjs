import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStats } from '../src/lib/progressStats.ts';
test('legacy statistics get defaults each time they are decoded', () => {
 const stats=normalizeStats(JSON.stringify({totalChoresCompleted:4,totalMoneyEarned:5.25}));
 assert.equal(stats.totalChoresCompleted,4);assert.equal(stats.totalMoneyEarned,5.25);
 assert.deepEqual(stats.completedLearningDays,[]);assert.deepEqual(stats.rewardedChoreOccurrences,[]);assert.equal(stats.level,1);
});
test('malformed counters and arrays cannot bypass normalization', () => {
 const stats=normalizeStats(JSON.stringify({level:0,xp:'99',completedChoreDays:42,completedLearningDays:['today',null],rewardedChoreOccurrences:['a','a',1]}));
 assert.equal(stats.level,1);assert.equal(stats.xp,0);assert.deepEqual(stats.completedChoreDays,[]);
 assert.deepEqual(stats.completedLearningDays,['today']);assert.deepEqual(stats.rewardedChoreOccurrences,['a']);
 assert.throws(()=>normalizeStats('null')); assert.throws(()=>normalizeStats('[]'));
});
