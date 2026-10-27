import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProgressPayloads } from '../src/lib/progressValidation.ts';
const encode = JSON.stringify;
test('valid real UI progress shapes are returned unchanged, including bytes and identity', () => {
  const data = {
    chores:encode([{id:'1',title:'Make Bed',completed:false,dueDate:'2026-10-27T12:00:00.000Z',priority:'medium',category:'Home',recurring:'custom',recurringDays:[1,3]}]),
    userStats:encode({level:1,xp:20,totalXp:20,xpToNextLevel:100,totalChoresCompleted:1,totalMoneyEarned:1.25,completedChoreDays:['Tue Oct 27 2026'],rewardedChoreOccurrences:['["chore","1"]']}),
    portfolio:encode([{id:'1',name:'Savings',value:250,allocation:50,change:-2.3,color:'money-green'}]),
    marketStocks:encode([{symbol:'AAPL',name:'Apple',price:175.5,change:-1.2,owned:0,avgPrice:0}]),
    achievements:encode([{id:'first',title:'First',description:'Complete one',icon:'star',unlocked:true,category:'chores',rarity:'bronze',requirement:1,currentProgress:1,reward:{xp:25,coins:5},unlockedAt:'2026-10-27T12:00:00Z'}]),
    profileData:encode({name:'Synthetic',bio:'',avatar:null,favoriteColor:'money-green',goals:[]}),
    customChoreTemplates:encode({Home:[{title:'Tidy',description:'',emoji:'x',difficulty:'easy'}]}),
    savingsGoals:encode([{id:'g1',name:'Book',targetAmount:10,savedAmount:1,emoji:'book',category:'Books',priority:'medium'}]),
    spendingTransactions:encode([{id:'s1',amount:2,description:'Book',category:'Books',emoji:'book',date:'2026-10-27T12:00:00Z'}]),
    learnEarnLessons:encode([{id:'l1',title:'Learn',content:'text',earnings:5,status:'available',quiz:{question:'Question',options:['A','B'],correctAnswer:0}}]),
    customColors:encode({moneyGreen:'142 76% 36%',moneyGold:'45 93% 47%',cryptoOrange:'25 95% 53%',successGreen:'142 71% 45%'}),
    weeklyAllowance:'20.00', cash:'1000',marketCash:'0',learnEarnTotal:'5',theme:'dark',welcomeModalDismissed:'true',marketSimulatorTutorialDismissed:'false',
  };
  const before=JSON.stringify(data); assert.equal(validateProgressPayloads(data),data); assert.equal(JSON.stringify(data),before);
});
test('malformed portfolio and null chores are rejected without mutation', () => {
  for (const data of [{portfolio:'{"not":"an array"}'},{portfolio:'[null]'},{chores:'[null]'},{chores:'[{"id":"x","title":"x","completed":"false"}]'}]) {
    const before=JSON.stringify(data); assert.throws(()=>validateProgressPayloads(data),/Invalid progress payload/); assert.equal(JSON.stringify(data),before);
  }
});
test('strict nested validation rejects crashes, invalid rewards, ledgers, dates and quizzes', () => {
  const bad = [
    {achievements:encode([{id:'x',unlocked:true,reward:null}])},
    {userStats:encode({totalChoresCompleted:-1})},
    {userStats:encode({rewardedChoreOccurrences:['x','x']})},
    {userStats:encode({completedChoreDays:[null]})},
    {chores:encode([{id:'x',title:'x',completed:false,dueDate:'invalid'}])},
    {customChoreTemplates:encode({Home:[null]})},
    {profileData:'null'}, {marketStocks:'[null]'}, {savingsGoals:'[null]'}, {spendingTransactions:'[null]'},
    {learnEarnLessons:encode([{id:'x',title:'x',content:'x',earnings:1,status:'available',quiz:{question:'x',options:['a'],correctAnswer:2}}])},
    {profileData:encode({name:'Synthetic',apiKey:'synthetic-secret'})}, {toString:'{}'}, {theme:'"dark"'}, {cash:'NaN'}, {weeklyAllowance:''}, {welcomeModalDismissed:'yes'}, {coinbaseCredentials:'{}'},
  ];
  for(const data of bad) assert.throws(()=>validateProgressPayloads(data),/Invalid progress payload/);
});
test('empty and partial legitimate legacy states remain accepted without adding defaults', () => {
  const data={userStats:'{}',chores:'[]',portfolio:'[]',profileData:'{}',achievements:'[]',customChoreTemplates:'{}'};
  assert.equal(validateProgressPayloads(data),data); assert.equal(data.userStats,'{}');
});

test('import provenance accepts only the explicit minimal shape without personal identity', () => {
  const metadata={version:1,source:'legacy-shared',consentedAt:'2026-10-27T12:00:00.000Z',fields:['chores']};
  const data={chores:'[]',importMetadata:encode(metadata)};
  assert.equal(validateProgressPayloads(data),data);
  for(const change of [{email:'private@example.invalid'},{source:'automatic'},{fields:['coinbaseCredentials']},{fields:['chores','chores']},{consentedAt:'yesterday'}]) {
    assert.throws(()=>validateProgressPayloads({importMetadata:encode({...metadata,...change})}));
  }
});
