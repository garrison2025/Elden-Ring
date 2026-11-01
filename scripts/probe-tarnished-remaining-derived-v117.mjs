#!/usr/bin/env node
/** Read only: previously UNVERIFIED Build Stats, enemy controls and Spell result
 * structure. No earlier weapon AR, level, armor field or Poise re-verifications.
 * Captures actual public v1.17 UI inputs and changed values with real keyboard.
 */
import {spawn} from 'node:child_process';
import {readFile,mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {waitForChromePage} from './browser-cdp-startup.mjs';
const chromePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chromePath)throw Error('No Chromium');
let chrome,ws,profile,seq=0;
const pending=new Map(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function send(method,params={}){
 const id=++seq;
 return new Promise((ok,bad)=>{
  const timer=setTimeout(()=>{pending.delete(id);bad(Error('Timeout '+method));},20000);
  pending.set(id,{ok,bad,timer});
  ws.send(JSON.stringify({id,method,params}));
 });
}
async function run(fn,...args){
 const expr='('+fn.toString()+')('+args.map(x=>JSON.stringify(x)).join(',')+')';
 const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error('Runtime '+JSON.stringify(r.exceptionDetails).slice(0,300));
 return r.result?.value;
}
function snapshot(){
 const elements=[...document.querySelectorAll('input')].map((e,i)=>({
  i,id:e.id||'',name:e.name||'',value:e.value,checked:e.checked,
  readOnly:e.readOnly,disabled:e.disabled,type:e.type,
  label:(e.closest('label')?.innerText||e.parentElement?.parentElement?.innerText||'').trim().slice(0,85),
  html:e.outerHTML.slice(0,230)
 }));
 const selects=[...document.querySelectorAll('select,[role="combobox"]')].map((e,i)=>({
  i,id:e.id||'',name:e.name||'',value:e.value||'',text:(e.innerText||'').trim().slice(0,130)
 })).slice(0,80);
 return {url:location.href,title:document.title,version:(document.body?.innerText||'').match(/Elden Ring Version:[^\n]*/)?.[0]??null,
  text:(document.body?.innerText||'').slice(0,9000),elements,selects};
}
async function nav(url){
 await send('Page.navigate',{url});await sleep(4200);
 let s=await run(snapshot);if(s.elements.length<25){await sleep(4500);s=await run(snapshot)}
 if(!s.version||!s.version.includes('v1.17'))throw Error('Reference not v1.17 at '+url+' version='+s.version);
 return s;
}
async function keyboard(id,value){
 const before=await run(function(id){const e=document.getElementById(id);
  if(!e)return {found:false};e.scrollIntoView({behavior:'instant',block:'center'});e.focus();
  return {found:true,previous:e.value,readonly:e.readOnly,disabled:e.disabled};
 },id);
 if(!before.found||before.readonly||before.disabled)throw Error('Cannot edit '+id+' '+JSON.stringify(before));
 await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});
 await send('Input.insertText',{text:String(value)});
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 await sleep(950);
 return await run(function(id){return document.getElementById(id)?.value},id);
}
async function main(){
 profile=await mkdtemp(join(tmpdir(),'remaining-v117-build-'));
 chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--disable-extensions','--no-first-run','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--remote-allow-origins=*',
  '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const ep=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>chrome.exitCode!==null?'Chrome exit '+chrome.exitCode:null});
 ws=new WebSocket(ep);
 await new Promise((ok,bad)=>{const t=setTimeout(()=>bad(Error('websocket open timeout')),12000);
  ws.addEventListener('open',()=>{clearTimeout(t);ok()},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(t);bad(Error('websocket error'))},{once:true});
 });
 ws.addEventListener('message',evt=>{const m=JSON.parse(evt.data),p=pending.get(m.id);if(!p)return;
  pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.bad(Error(m.error.message));else p.ok(m.result);
 });
 await send('Runtime.enable');await send('Page.enable');
 const results={schemaVersion:1,referenceVersion:'v1.17',date:'2026-11-01',pageCaptures:[],buildScenarios:[]};
 const baseline=await nav('https://www.tarnished.dev/build-planner');
 results.pageCaptures.push({type:'build',...baseline});
 results.buildScenarios.push({name:'Wretch bare default',snapshot:baseline});
 const get=(a,key)=>a.elements.find(e=>e.id===key)?.value;
 console.log('[NEW BUILD BASE INPUTS]',JSON.stringify(baseline.elements.map(e=>({id:e.id,value:e.value,label:e.label,readOnly:e.readOnly})).filter(e=>e.id||/HP|FP|Stamina|Discovery|Poise|Def\.|Neg\.|Equip Load|Immunity|Robustness|Focus|Vitality/.test(e.label))));
 for(const [id,val,name] of [['vigor',40,'Wretch VIG40'],['mind',30,'Wretch VIG40 MND30'],
  ['endurance',25,'Wretch VIG40 MND30 END25'],['arcane',40,'Wretch VIG40 MND30 END25 ARC40']]){
  const changed=await keyboard(id,val);
  const shot=await run(snapshot);
  results.buildScenarios.push({name,changedId:id,requested:val,changed,snapshot:shot});
  const statFields=shot.elements.filter(e=>e.readOnly||/HP|FP|Stamina|Discovery|Poise|Def\.|Neg\.|Equip Load|Immunity|Robustness|Focus|Vitality/.test(e.label));
  console.log('[NEW BUILD STATS]',JSON.stringify({name,changed,fields:statFields.map(e=>({id:e.id,value:e.value,label:e.label}))}).slice(0,12000));
 }
 for(const [type,url] of [
  ['damage','https://www.tarnished.dev/damage-calculator'],
  ['spell','https://www.tarnished.dev/spell-calculator']]){
  const shot=await nav(url);
  results.pageCaptures.push({type,...shot});
  console.log('[UNVERIFIED '+type.toUpperCase()+' UI]',JSON.stringify({
   url:shot.url,version:shot.version,inputs:shot.elements.map(x=>({id:x.id,value:x.value,label:x.label})).slice(0,100),
   selects:shot.selects,text:shot.text.slice(-1700)}).slice(0,14000));
 }
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/remaining-build-damage-spell-v117.json'),JSON.stringify(results,null,2)+'\n');
 const altered=results.buildScenarios[1].snapshot;
 if(!altered.elements.some(e=>e.id==='vigor'&&e.value==='40'))throw Error('Vigor keyboard input not accepted');
 if(results.pageCaptures.some(x=>x.version!=='Elden Ring Version: v1.17'))throw Error('Wrong site version');
}
try{await main()}finally{
 try{ws?.close()}catch{}try{chrome?.kill('SIGTERM')}catch{}
 await sleep(300);if(chrome?.exitCode===null)try{chrome.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
