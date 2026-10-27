import test from 'node:test';
import assert from 'node:assert/strict';
import { applyLessonProgress, applyXP } from '../src/lib/learningProgress.ts';
const initial = () => ({totalLessonsCompleted:0,totalMoneyEarned:0,completedLearningDays:[],lastActiveDate:'',xp:0,totalXp:0,level:1,xpToNextLevel:100,rewardedChoreOccurrences:['existing']});
test('lesson commit followed by achievement reward and XP retains all contributions', () => {
 const before=initial();
 let stored=applyLessonProgress(before,5,'today');
 stored={...stored,xp:stored.xp+50,totalXp:stored.totalXp+50,totalMoneyEarned:stored.totalMoneyEarned+10};
 stored=applyXP(stored,30);
 assert.equal(stored.totalMoneyEarned,15);assert.equal(stored.totalXp,80);assert.equal(stored.totalLessonsCompleted,1);
 assert.deepEqual(stored.rewardedChoreOccurrences,['existing']);assert.equal(before.totalLessonsCompleted,0);
});
test('XP handles accumulated achievement XP crossing multiple levels', () => {
 const next=applyXP({...initial(),xp:290,totalXp:290},30);
 assert.equal(next.level,3);assert.equal(next.xp,20);assert.equal(next.totalXp,320);assert.equal(next.xpToNextLevel,300);
});
test('learning days are unique and malformed rewards are rejected', () => {
 const once=applyLessonProgress(initial(),1,'today');const twice=applyLessonProgress(once,1,'today');
 assert.deepEqual(twice.completedLearningDays,['today']);assert.equal(twice.totalLessonsCompleted,2);
 assert.throws(()=>applyLessonProgress(initial(),NaN,'today')); assert.throws(()=>applyXP(initial(),-1));
});
