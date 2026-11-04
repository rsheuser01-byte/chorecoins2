(async()=>{
 const wait=()=>new Promise(r=>setTimeout(r,70));
 const assert=(v,msg)=>{if(!v)throw Error(msg)};
 const click=text=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(text));assert(b,'Missing button '+text);b.click();};
 const hub=()=>{const back=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Save & exit')||b.textContent.includes('Back to village'));back?.click();};
 const open=text=>click(text);
 const answer=async n=>{const input=document.querySelector('#quest-answer');assert(input,'Answer missing');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(n));input.dispatchEvent(new Event('input',{bubbles:true}));await wait();click('Check answer');await wait();};
 window.questTest={hub,open,answer,click,wait};
 localStorage.setItem('prototype-test-legacy-sentinel','unchanged');
 for(const [name,answers] of [['Market math',[6,4,6]],['Make a plan',[8,7,1]],['Grow your goal',[12,6,14]],['Build your shop',[8,6,6]]]){
  open(name);await wait();
  if(name==='Build your shop'){
   click('Postcard kit');await wait();click('Painted sign');await wait();click('Badge kit');await wait();assert(document.body.textContent.includes('over budget'),'Budget rejection');click('Painted sign');await wait();click('Badge kit');await wait();click('Assemble shop');await wait();
  }
  for(const n of answers){click('A little hint');await wait();await answer(999);assert(document.body.textContent.includes('try again'),'Wrong answer feedback');await answer(n);assert(document.body.textContent.includes('got it'),'Correct feedback');click(n===answers[2]&&document.body.textContent.includes('Finish activity')?'Finish activity':'Next step');await wait();}
  assert(document.body.textContent.includes('One cosmetic completion'),'Completion');hub();await wait();
 }
 assert(document.body.textContent.includes('4/4'),'Four completions');
 open('Market math');await wait();await answer(6);click('Next step');await wait();hub();await wait();open('Market math');await wait();assert(document.body.textContent.includes('A notebook costs'),'Completed lesson replays from beginning');hub();await wait();
 const select=document.querySelector('.quest-nav select');select.value='demo-explorer';select.dispatchEvent(new Event('change',{bubbles:true}));await wait();assert(document.body.textContent.includes('0/4'),'Profile isolation');
 const corruptKey='chorecoins:learning-prototype:v1:demo-explorer:change';localStorage.setItem(corruptKey,'{broken');open('Market math');await wait();assert(document.body.textContent.includes('Nothing was overwritten'),'Corruption error');assert(localStorage.getItem(corruptKey)==='{broken','Corruption preserved');hub();await wait();localStorage.removeItem(corruptKey);
 open('Make a plan');await wait();const original=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError')};await answer(8);click('Next step');await wait();assert(document.body.textContent.includes('could not be saved'),'Quota visible');assert(document.body.textContent.includes('A kit costs 12'),'No advance on failed save');Storage.prototype.setItem=original;hub();await wait();assert(localStorage.getItem('prototype-test-legacy-sentinel')==='unchanged','Legacy bytes');
 return true;
})()
