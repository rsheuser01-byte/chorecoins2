import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalProgress } from '../src/lib/localProgress.ts';
const memory=()=>{const map=new Map();return {map,writes:0,fail:false,getItem(k){return map.get(k)??null;},setItem(k,v){if(this.fail)throw Error('quota');this.writes++;map.set(k,v);},removeItem(k){map.delete(k);}};};
test('same-owner old keys seed local progress without assigning shared data or deleting originals',()=>{
 const disk=memory();disk.map.set('chores','SHARED');disk.map.set('chorecoins:v1:user:A:chores','[]');disk.map.set('chorecoins:v1:user:A:coinbaseCredentials','secret');
 const a=createLocalProgress(disk,'A'),b=createLocalProgress(disk,'B');assert.equal(a.getItem('chores'),'[]');assert.equal(b.getItem('chores'),null);a.setItem('cash','5');
 assert.equal(disk.getItem('chores'),'SHARED');assert.equal(disk.getItem('chorecoins:v1:user:A:chores'),'[]');assert.equal(a.read().coinbaseCredentials,undefined);assert.equal(createLocalProgress(disk,'A').getItem('cash'),'5');
});
test('one durable write includes all staged changes and staged reads',()=>{
 const disk=memory(),a=createLocalProgress(disk,'A');a.transaction(()=>{a.setItem('chores','[]');a.setItem('cash','7');assert.equal(a.getItem('cash'),'7');});assert.equal(disk.writes,1);assert.deepEqual(a.read(),{chores:'[]',cash:'7'});
});
test('quota failure retains exact prior bytes and memory; attempted draft is exportable',()=>{
 const disk=memory(),a=createLocalProgress(disk,'A');a.setItem('cash','1');const before=disk.getItem('chorecoins:local:v1:A');disk.fail=true;
 assert.throws(()=>a.transaction(()=>{a.setItem('cash','2');a.setItem('chores','[]');}),e=>{assert.deepEqual(e.unsavedProgress,{cash:'2',chores:'[]'});return true;});assert.equal(disk.getItem('chorecoins:local:v1:A'),before);assert.deepEqual(a.read(),{cash:'1'});
});
test('nested failed transaction rolls back savepoint and outer remains usable',()=>{
 const disk=memory(),a=createLocalProgress(disk,'A');a.transaction(()=>{a.setItem('cash','2');assert.throws(()=>a.transaction(()=>{a.setItem('cash','3');throw Error('stop');}));assert.equal(a.getItem('cash'),'2');a.setItem('chores','[]');});assert.equal(disk.writes,1);assert.equal(a.getItem('cash'),'2');
});
test('corrupt envelope and malformed old payload fail closed preserving exact bytes',()=>{
 for(const raw of ['{broken',JSON.stringify({format:1,userId:'A',data:{portfolio:'{broken'}}),JSON.stringify({format:1,userId:'B',data:{}})]){const disk=memory();disk.map.set('chorecoins:local:v1:A',raw);assert.throws(()=>createLocalProgress(disk,'A'));assert.equal(disk.getItem('chorecoins:local:v1:A'),raw);assert.equal(disk.writes,0);}
 const disk=memory();disk.map.set('chorecoins:v1:user:A:chores','[null]');assert.throws(()=>createLocalProgress(disk,'A'));assert.equal(disk.getItem('chorecoins:v1:user:A:chores'),'[null]');
});
test('stale writer cannot replace newer other-tab progress',()=>{
 const disk=memory(),a=createLocalProgress(disk,'A'),stale=createLocalProgress(disk,'A');a.setItem('cash','10');assert.throws(()=>stale.setItem('cash','20'));assert.equal(createLocalProgress(disk,'A').getItem('cash'),'10');
});
test('validation and asynchronous transaction rejection never persist partial progress',()=>{
 const disk=memory(),a=createLocalProgress(disk,'A');assert.throws(()=>a.transaction(()=>{a.setItem('cash','5');a.setItem('chores','[null]');}));assert.throws(()=>a.transaction(()=>Promise.resolve()));assert.deepEqual(a.read(),{});assert.equal(disk.writes,0);
});
test('successful nested transactions persist once and old-source changes block first save',()=>{
 const disk=memory(),a=createLocalProgress(disk,'A');a.transaction(()=>{a.setItem('cash','2');a.transaction(()=>a.setItem('chores','[]'));assert.equal(a.getItem('chores'),'[]');});assert.equal(disk.writes,1);assert.deepEqual(a.read(),{cash:'2',chores:'[]'});
 const next=memory(),b=createLocalProgress(next,'B');next.map.set('chorecoins:v1:user:B:cash','9');assert.throws(()=>b.setItem('cash','1'));assert.equal(next.getItem('chorecoins:local:v1:B'),null);assert.equal(next.getItem('chorecoins:v1:user:B:cash'),'9');
});

test('async transaction callback is rejected before invocation', () => {
  const backing = new Map();
  const storage = { getItem: key => backing.get(key) ?? null, setItem: (key, value) => backing.set(key, value), removeItem: key => backing.delete(key) };
  const local = createLocalProgress(storage, 'synthetic');
  let invoked = false;
  assert.throws(() => local.transaction(async () => { invoked = true; await Promise.resolve(); local.setItem('weeklyAllowance', '9'); }));
  assert.equal(invoked, false);
  assert.equal(backing.size, 0);
});
