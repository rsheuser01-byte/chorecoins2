import test from 'node:test';
import assert from 'node:assert/strict';
import { applyChoreReward, choreOccurrenceId } from '../src/lib/choreRewards.ts';
const initial = () => ({ totalChoresCompleted: 0, totalMoneyEarned: 0, xp: 0, totalXp: 0, level: 1, xpToNextLevel: 100, completedChoreDays: [], lastActiveDate: '' });
test('replayed and undone/re-completed occurrence awards only once, including reload', () => {
 const id = choreOccurrenceId({id: 'a', dueDate: '2026-10-27'});
 const first = applyChoreReward(initial(), id, 5, 'Tue Oct 27 2026');
 const reload = JSON.parse(JSON.stringify(first));
 assert.equal(applyChoreReward(reload, id, 5, 'Wed Oct 28 2026'), reload);
 assert.equal(reload.totalChoresCompleted, 1); assert.equal(reload.totalMoneyEarned, 5); assert.equal(reload.totalXp, 20);
});
test('series occurrences have stable identity across devices, distinct dates and series', () => {
 const chore = {id: 'series-a', recurring: 'daily', dueDate: new Date(2026,9,27)};
 const id = choreOccurrenceId(chore);
 assert.equal(choreOccurrenceId({...chore,id:'device-generated-instance',seriesId:'series-a',recurring:'none'}), id);
 assert.notEqual(choreOccurrenceId({...chore,dueDate:new Date(2026,9,28)}),id);
 assert.notEqual(choreOccurrenceId({...chore,id:'series-b'}),id);
 const first = applyChoreReward(initial(),id,0,'day1');
 const second = applyChoreReward(first,choreOccurrenceId({...chore,dueDate:new Date(2026,9,28)}),0,'day2');
 assert.equal(second.totalXp,40); assert.equal(second.totalChoresCompleted,2);
});
test('rescheduling one-time chore does not make it eligible for another reward', () => {
 assert.equal(choreOccurrenceId({id:'a',dueDate:'2026-10-27'}),choreOccurrenceId({id:'a',dueDate:'2026-10-28'}));
});
test('reward + occurrence are one immutable update and level correctly', () => {
 const prev={...initial(),xp:90,totalXp:90}; const next=applyChoreReward(prev,'a',0,'today');
 assert.equal(prev.xp,90); assert.equal(next.xp,10); assert.equal(next.level,2); assert.equal(next.totalXp,110);
 assert.deepEqual(next.rewardedChoreOccurrences,['a']);
 assert.throws(()=>applyChoreReward(prev,'',0,'today'));
 assert.throws(()=>applyChoreReward(prev,'b',-1,'today'));
});
test('stored occurrence date is timezone independent', () => {
 const occurrence = { id: 'instance', seriesId: 's', occurrenceDate: '2026-10-27', dueDate: '2026-10-27T00:00:00Z' };
 assert.equal(choreOccurrenceId(occurrence), JSON.stringify(['series','s',2026,10,27]));
});
