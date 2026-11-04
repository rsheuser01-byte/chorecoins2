import test from 'node:test';
import assert from 'node:assert/strict';
import { blank, key, read, persist, cost, questions, validAnswer, enabled, missions } from '../src/prototype/model.ts';
test('prototype flag defaults off; only explicit on enables',()=>{for(const s of ['', '?learningPrototype=false','?learningPrototype=true'])assert.equal(enabled(s),false);assert.equal(enabled('?learningPrototype=on'),true);});
test('arithmetic, boundaries and invalid inputs',()=>{assert.equal(cost([0,1]),12);assert.equal(cost([0,2]),18);assert.equal(cost([0,1,2]),24);for(const m of missions)for(const d of ['easy','harder'])for(const q of questions(m,d,[0,1])){assert.equal(validAnswer(String(q.answer),q.answer),true);for(const bad of ['', '-1','NaN','1e1','2.5','Infinity'])assert.equal(validAnswer(bad,q.answer),false);}assert.equal(questions('shop','easy',[0,2])[0].answer,2);assert.equal(validAnswer('0',0),true);});
test('versioned storage is isolated; malformed reads never write',()=>{let writes=0;const data=new Map([['balance','150'],['totalLessonsCompleted','4']]);const store={getItem:k=>data.get(k)??null,setItem:(k,v)=>{writes++;data.set(k,v);}};assert.deepEqual(read(store,'demo-builder','change'),blank());for(const bad of ['{','null','{}','{"version":0}',JSON.stringify({...blank(),step:99}),JSON.stringify({...blank(),supplies:[0,0]})]){data.set(key('demo-builder','change'),bad);assert.throws(()=>read(store,'demo-builder','change'));assert.equal(data.get(key('demo-builder','change')),bad);}assert.equal(writes,0);assert.equal(data.get('balance'),'150');assert.deepEqual(read(store,'demo-explorer','change'),blank());assert.throws(()=>read({getItem(){throw Error('denied');}},'demo-builder','shop'));});
test('cosmetic receipts survive duplicate completion, stale tab writes and reload',()=>{
 const data=new Map();const store={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const stale=read(store,'demo-builder','change');
 for(let i=0;i<20;i++)persist(store,'demo-builder','change',{...blank(),done:true},true);
 persist(store,'demo-builder','change',{...stale,step:1});
 assert.equal(read(store,'demo-builder','change').done,true);
 assert.equal(read(store,'demo-explorer','change').done,false);
 const before=[...data];assert.throws(()=>persist({...store,setItem(){throw Error('quota')}},'demo-builder','change',blank()));assert.deepEqual([...data],before);
});
