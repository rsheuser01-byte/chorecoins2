import test from 'node:test';
import assert from 'node:assert/strict';
import { getDueOccurrence, claimOccurrence } from '../src/lib/inAppReminders.ts';
const prefs = (overrides = {}) => ({ chore_reminders_enabled: true, reminder_time: '09:00', reminder_days: [1,2,3,4,5,6,7], timezone: 'UTC', ...overrides });
const due = (date, overrides) => getDueOccurrence(prefs(overrides), new Date(date));
const memory = () => { const map = new Map(); return { map, getItem: key => map.get(key) ?? null, setItem: (key,value) => map.set(key,value) }; };

test('selected local day/time and bounded grace, never stale backlog', () => {
 assert.equal(due('2026-10-27T08:59:59Z'), null);
 assert.equal(due('2026-10-27T09:00:00Z'), '2026-10-27T09:00');
 assert.equal(due('2026-10-27T09:15:00Z'), '2026-10-27T09:00');
 assert.equal(due('2026-10-27T09:15:00.001Z'), null);
 assert.equal(due('2026-10-27T09:16:00Z'), null);
 assert.equal(due('2026-10-27T09:00:00Z', {reminder_days:[1]}), null);
 assert.equal(due('2026-10-27T09:00:00Z', {reminder_days:[2]}), '2026-10-27T09:00');
});
test('IANA timezone handles midnight, UTC date change and nonwhole offsets', () => {
 assert.equal(due('2026-10-27T00:00:00Z',{reminder_time:'00:00:00'}),'2026-10-27T00:00');
 assert.equal(due('2026-10-26T18:15:00Z',{reminder_time:'00:00',timezone:'Asia/Kathmandu',reminder_days:[2]}),'2026-10-27T00:00');
 assert.equal(due('2026-10-28T00:05:00Z',{reminder_time:'23:59'}),null);
});
test('DST spring gap skipped; normal post-transition time still due', () => {
 assert.equal(due('2026-03-08T07:00:00Z',{reminder_time:'02:55',timezone:'America/New_York'}),null);
 assert.equal(due('2026-03-08T07:05:00Z',{reminder_time:'03:00',timezone:'America/New_York'}),'2026-03-08T03:00');
 assert.equal(due('2026-03-09T06:55:00Z',{reminder_time:'02:55',timezone:'America/New_York'}),'2026-03-09T02:55');
});
test('DST fall repeated wall time shares one claim across refresh', () => {
 const first=due('2026-11-01T05:30:00Z',{reminder_time:'01:30',timezone:'America/New_York'});
 const second=due('2026-11-01T06:30:00Z',{reminder_time:'01:30',timezone:'America/New_York'});
 assert.equal(first,'2026-11-01T01:30'); assert.equal(second,first);
 const store=memory(); assert.equal(claimOccurrence(store,'account-a',first),true); assert.equal(claimOccurrence(store,'account-a',second),false);
});
test('invalid settings and disabled reminders fail closed, no offset fallback', () => {
 for(const change of [{chore_reminders_enabled:false},{chore_reminders_enabled:'true'},{reminder_days:[]},{reminder_days:[0]},{reminder_days:[8]},{reminder_days:['2']},{reminder_time:'9:00'},{reminder_time:'09:00:01'},{reminder_time:'24:00'},{timezone:'Invalid/Zone'},{timezone:''},{timezone:'+00:00'},{timezone:null,timezone_offset_minutes:0}]) assert.equal(due('2026-10-27T09:00:00Z',change),null,JSON.stringify(change));
 assert.equal(getDueOccurrence(null,new Date()),null); assert.equal(getDueOccurrence(prefs(),new Date('invalid')),null);
});
test('claims are account scoped, bounded, suppress duplicate and clock rollback', () => {
 const store=memory(); const key='2026-10-27T09:00';
 assert.equal(claimOccurrence(store,'a',key),true); assert.equal(claimOccurrence(store,'b',key),true);
 assert.equal(claimOccurrence(store,'a',key),false); assert.equal(claimOccurrence(store,'a','2026-10-26T09:00'),false);
 assert.equal(claimOccurrence(store,'a','2026-10-28T09:00'),true); assert.equal(store.map.size,2);
 assert.equal(claimOccurrence(store,'',key),false); assert.equal(claimOccurrence(store,'a','bad'),false);
});
test('corrupt markers and storage quota/access errors preserve bytes and suppress', () => {
 const store=memory(); const key='chorecoins:reminder:v1:a';
 for(const raw of ['bad','null','{}','{"version":1,"occurrence":"bad"}','{"version":2,"occurrence":"2026-10-27T09:00"}']) {store.setItem(key,raw); assert.equal(claimOccurrence(store,'a','2026-10-28T09:00'),false); assert.equal(store.getItem(key),raw);}
 assert.equal(claimOccurrence({getItem(){throw Error('blocked');},setItem(){}},'a','2026-10-27T09:00'),false);
 assert.equal(claimOccurrence({getItem(){return null;},setItem(){throw Error('quota');}},'a','2026-10-27T09:00'),false);
});
