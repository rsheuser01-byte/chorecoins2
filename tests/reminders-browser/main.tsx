import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { InAppReminder } from '@/components/InAppReminder';
import Notifications from '@/pages/Notifications';
import { mock, defaults } from './mock';

declare global { interface Window { __browserTests?: {done:boolean;passed:string[];error?:string} } }
const result=window.__browserTests={done:false,passed:[] as string[],error:undefined as string|undefined};
const RealDate=Date;
let now=Date.parse('2026-10-27T09:05:00Z');
window.Date=new Proxy(RealDate,{construct(target,args){return Reflect.construct(target,args.length?args:[now]);},get(target,key){return key==='now'?()=>now:Reflect.get(target,key);}});
const realInterval=window.setInterval.bind(window), realClear=window.clearInterval.bind(window);
const timers=new Map<number,()=>void>();let timerId=100000;
window.setInterval=((callback:TimerHandler,delay?:number,...args:unknown[])=>{
  if(delay && delay>=30000 && typeof callback==='function'){const id=timerId++;timers.set(id,()=>callback(...args));return id;}
  return realInterval(callback,delay,...args);
}) as typeof setInterval;
window.clearInterval=((id:number)=>{if(!timers.delete(id))realClear(id);}) as typeof clearInterval;
let visible=true;
Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>visible?'visible':'hidden'});
let permissionPrompts=0;
if('Notification' in window) Object.defineProperty(Notification,'requestPermission',{configurable:true,value:async()=>{permissionPrompts++;throw new Error('Unexpected permission prompt');}});
let setSettings:(show:boolean)=>void;
let remount:()=>void;
function Harness(){const [settings,change]=useState(false);const[key,changeKey]=useState(0);setSettings=change;remount=()=>changeKey(v=>v+1);return <AuthProvider><MemoryRouter><InAppReminder key={key}/>{settings&&<Notifications/>}</MemoryRouter></AuthProvider>;}
const root=createRoot(document.getElementById('root')!);
const wait=()=>new Promise(resolve=>setTimeout(resolve,20));
const assert=(value:unknown,message:string)=>{if(!value)throw new Error(message);};
async function until(check:()=>boolean,message:string){const deadline=performance.now()+5000;while(!check()){if(performance.now()>deadline)throw new Error(message);await wait();}}
const reminder=()=>document.querySelector('[aria-label="Chore reminder"]');
const button=(text:string)=>[...document.querySelectorAll('button')].find(el=>el.textContent?.trim()===text);
async function record(name:string,run:()=>Promise<void>){await run();result.passed.push(name);}
async function account(id:string){mock.emit(id);await until(()=>mock.loads.includes(id),'Owner preferences did not load');await wait();}
async function main(){
  localStorage.clear();root.render(<Harness/>);await wait();
  await record('visible due reminder, dismiss and remount suppress same occurrence',async()=>{
    await account('due');await until(()=>!!reminder(),'Due reminder missing');
    assert(reminder()?.textContent?.includes('only while the app is open'),'App-open limitation missing');
    button('Dismiss reminder')!.click();await wait();assert(!reminder(),'Dismiss failed');
    remount();await wait();assert(!reminder(),'Refresh repeated same occurrence');
  });
  await record('timer, focus and visibility recheck without server polling or permission prompts',async()=>{
    const count=mock.loads.length;
    now=RealDate.parse('2026-10-28T09:05:00Z');
    visible=false;for(const callback of timers.values())callback();await wait();assert(!reminder(),'Hidden app showed reminder');visible=true;
    for(const callback of timers.values())callback();window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));
    await until(()=>!!reminder(),'Next-day local reminder missing');
    assert(mock.loads.length===count,'Timer/focus polled the server');assert(permissionPrompts===0,'Requested notification permission');
  });
  await record('logout and account switch remove prior reminder and reject stale pending load',async()=>{
    mock.emit(null);await wait();assert(!reminder(),'Signed-out reminder remains');
    mock.delayOwner='slow';mock.emit('slow');await until(()=>mock.pending.has('slow'),'Pending load missing');
    mock.records.set('disabled',{...defaults,chore_reminders_enabled:false});await account('disabled');
    mock.pending.get('slow')!(defaults);mock.delayOwner='';await wait();assert(!reminder(),'Old account load escaped cleanup');
  });
  await record('same occurrence is independently scoped to each account',async()=>{
    await account('account-b');await until(()=>!!reminder(),'Second owner did not get its own occurrence');
    button('Dismiss reminder')!.click();await wait();await account('due');assert(!reminder(),'First owner occurrence replayed');
  });
  await record('disabled, invalid timezone and expired backlog never show reminders',async()=>{
    await account('disabled');assert(!reminder(),'Disabled reminders fired');
    mock.records.set('invalid',{...defaults,timezone:'Invalid/Synthetic'});await account('invalid');assert(!reminder(),'Invalid zone fired');
    now=RealDate.parse('2026-10-28T12:00:00Z');await account('late');assert(!reminder(),'Old missed reminder replayed');
  });
  await record('settings preserve push choice and saved timezone without permission prompts',async()=>{
    mock.records.set('settings',{...defaults,timezone:'America/New_York',timezone_offset_minutes:240});await account('settings');
    setSettings(true);await until(()=>!!button('Save Settings')&&!button('Save Settings')!.disabled,'Settings did not hydrate');
    button('Save Settings')!.click();await until(()=>mock.saves.length===1,'Settings not saved');
    const saved=mock.saves[0];assert(saved.userId==='settings','Settings retargeted owner');
    assert(!('push_enabled'in saved.input)&&!('push_subscription'in saved.input),'Settings overwrote push choices');
    assert(saved.input.timezone==='America/New_York','Timezone changed without consent');
    assert(mock.records.get('settings')?.push_enabled===true,'Existing push preference lost');
    assert(permissionPrompts===0,'Settings requested push permission');
    assert(document.body.textContent?.includes('paused'),'Paused background status missing');setSettings(false);await wait();
  });
  await record('failed owner preference read fails closed without timer retries',async()=>{
    mock.failOwner='unavailable';await account('unavailable');assert(!reminder(),'Failed load produced reminder');
    const count=mock.loads.length;for(const callback of timers.values())callback();window.dispatchEvent(new Event('focus'));await wait();
    assert(mock.loads.length===count,'Failure led to periodic retries');
  });
}
main().catch(error=>{result.error=error instanceof Error?error.message:String(error);}).finally(()=>{result.done=true;});
