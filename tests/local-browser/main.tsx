import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useAccountStorage } from '@/contexts/AccountDataContext';
import { AccountRouteGate } from '@/components/AccountRouteGate';
import { mock } from '../browser/supabase-mock';
import { cloudCalls } from './cloud-forbidden';

declare global { interface Window { __browserTests?: {done:boolean;passed:string[];error?:string} } }
const result=window.__browserTests={done:false,passed:[] as string[],error:undefined as string|undefined};
let auth: ReturnType<typeof useAuth>, storage: ReturnType<typeof useAccountStorage>;
let setValue:(value:string)=>void, navigate:(path:string)=>void;
const encode=(value:string)=>JSON.stringify([{id:'synthetic',title:value,completed:false,dueDate:'2026-10-27'}]);
const decode=(value:string|null)=>value?JSON.parse(value)[0]?.title??'EMPTY':'EMPTY';
function Probe(){storage=useAccountStorage();const scoped=storage;const [value,update]=useState(()=>decode(scoped.getItem('chores')));setValue=update;useEffect(()=>scoped.setItem('chores',encode(value)),[scoped,value]);return <output id="progress">{value}</output>;}
function Observer(){auth=useAuth();navigate=useNavigate();return <AccountRouteGate><Probe/></AccountRouteGate>;}
function Harness(){return <AuthProvider><MemoryRouter><Observer/></MemoryRouter></AuthProvider>;}
const wait=()=>new Promise(resolve=>setTimeout(resolve,15));
const assert=(condition:unknown,message:string)=>{if(!condition)throw new Error(message);};
async function until(check:()=>boolean,message:string){const deadline=performance.now()+5000;while(!check()){if(performance.now()>deadline)throw new Error(message);await wait();}}
const button=(label:string)=>[...document.querySelectorAll('button')].find(el=>el.textContent?.trim()===label);
async function record(name:string,run:()=>Promise<void>){await run();result.passed.push(name);}
async function login(id:string){await auth.login(`${id}@example.invalid`,'synthetic');await until(()=>auth.user?.id===id&&!!document.getElementById('progress'),'Local owner did not mount');await wait();}
function input(id:string,value:string){const el=document.getElementById(id) as HTMLInputElement;assert(el&&!el.disabled,`Missing ${id}`);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));}
async function main(){
  localStorage.clear();localStorage.setItem('chores','LEGACY-UNASSIGNED');localStorage.setItem('weeklyAllowance','42');
  createRoot(document.getElementById('root')!).render(<Harness/>);
  await until(()=>!!mock.initialResolve,'Auth initialization missing');
  await record('default local mode waits for auth before mounting or persisting defaults',async()=>{
    assert(!document.getElementById('progress'),'Mounted before auth');assert(localStorage.getItem('chorecoins:v1:guest:chores')===null,'Persisted guest data before auth');
    mock.finishInitial();await until(()=>!!document.getElementById('progress'),'Guest local consumer missing');
  });
  await record('local account A/B logout and relogin isolate progress and reject disposed callbacks',async()=>{
    await login('local-a');setValue('A-LOCAL');await until(()=>decode(storage.getItem('chores'))==='A-LOCAL','A did not save');const oldStorage=storage;
    await auth.logout();await until(()=>auth.user===null,'Logout failed');await wait();assert(document.getElementById('progress')!.textContent==='EMPTY','Guest saw A progress');
    await login('local-b');assert(document.getElementById('progress')!.textContent==='EMPTY','B saw A progress');setValue('B-LOCAL');await until(()=>decode(storage.getItem('chores'))==='B-LOCAL','B did not save');
    oldStorage.setItem('chores',encode('STALE-A'));assert(decode(storage.getItem('chores'))==='B-LOCAL','Stale callback retargeted B');
    await auth.logout();await wait();await login('local-a');assert(document.getElementById('progress')!.textContent==='A-LOCAL','A lost data or stale callback mutated disposed account');
  });
  await record('disabled cloud gate shows local-only status and never constructs a cloud client',async()=>{
    assert(document.body.textContent?.includes('Local-only progress: saved on this browser. Cloud syncing is not enabled.'),'Local-only label missing');
    assert(!button('Refresh cloud data'),'Cloud controls visible while disabled');
    window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('online'));await wait();assert(cloudCalls===0,'Cloud API constructed while default disabled');
  });
  await record('unassigned legacy bytes remain preserved and export contains original values only',async()=>{
    assert(localStorage.getItem('chores')==='LEGACY-UNASSIGNED','Legacy chores mutated');assert(localStorage.getItem('weeklyAllowance')==='42','Legacy allowance mutated');
    assert(document.body.textContent?.includes('has not been assigned to any account'),'Unassigned legacy notice missing');
    const downloads:Blob[]=[];const originalURL=URL.createObjectURL,originalRevoke=URL.revokeObjectURL,originalClick=HTMLAnchorElement.prototype.click;
    URL.createObjectURL=(blob:Blob)=>{downloads.push(blob);return 'blob:synthetic-local-backup';};URL.revokeObjectURL=()=>{};HTMLAnchorElement.prototype.click=()=>{};
    try{assert(button('Download legacy backup'),'Legacy export action missing');button('Download legacy backup')!.click();await until(()=>downloads.length>0,'No legacy download');const backup=await downloads[0].text();assert(backup.includes('LEGACY-UNASSIGNED')&&backup.includes('42'),'Legacy bytes absent from backup');assert(!backup.includes('A-LOCAL')&&!backup.includes('B-LOCAL'),'Legacy backup mixed account values');}finally{URL.createObjectURL=originalURL;URL.revokeObjectURL=originalRevoke;HTMLAnchorElement.prototype.click=originalClick;}
  });
  await record('verified recovery works independently of local progress and cloud remains untouched',async()=>{
    navigate('/reset-password');await until(()=>!!document.getElementById('password'),'Reset form missing');assert((document.getElementById('password') as HTMLInputElement).disabled,'Ordinary session permitted recovery');
    mock.emit('PASSWORD_RECOVERY','local-a');await until(()=>!(document.getElementById('password') as HTMLInputElement)?.disabled,'Verified recovery remains blocked');
    input('password','synthetic-new-password');input('confirmPassword','synthetic-new-password');await wait();document.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    await until(()=>mock.updates===1,'Verified recovery update missing');assert(cloudCalls===0,'Recovery constructed cloud API');assert(localStorage.getItem('chores')==='LEGACY-UNASSIGNED','Recovery touched legacy progress');
  });
}
main().catch(error=>{result.error=error instanceof Error?error.message:String(error);}).finally(()=>{result.done=true;});
