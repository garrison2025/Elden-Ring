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
/**
 * Eight independent shards, one real browser/attribute.
 * The only certified context is an unequipped Wretch with all other stats=10.
 * 8 axes x 90 levels x 10 defense/defensive-resistance/discovery output cells.
 * This is NOT an additive combat formula for mixed-level characters.
 */
const axes=['vigor','mind','endurance','strength','dexterity','intelligence','faith','arcane'];
const finalIds=axes.map(x=>'final'+x);
const outputs=[
 'Physical Defense','Magic Defense','Fire Defense','Lightning Defense','Holy Defense',
 'Immunity','Robustness','Focus','Vitality','Discovery'
];
const axis=process.env.V117_AXIS;
if(!axes.includes(axis))throw Error('Set V117_AXIS to one of 8 actual attribute names');
async function main(){
 profile=await mkdtemp(join(tmpdir(),'remaining-defense-'+axis+'-'));
 chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--disable-extensions','--no-first-run','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--remote-allow-origins=*',
  '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const ep=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>chrome.exitCode!==null?'Chrome exit '+chrome.exitCode:null});
 ws=new WebSocket(ep);
 await new Promise((ok,bad)=>{const t=setTimeout(()=>bad(Error('CDP open timeout')),12000);
  ws.addEventListener('open',()=>{clearTimeout(t);ok()},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(t);bad(Error('CDP socket error'))},{once:true});
 });
 ws.addEventListener('message',evt=>{const m=JSON.parse(evt.data),p=pending.get(m.id);if(!p)return;
  pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.bad(Error(m.error.message));else p.ok(m.result);
 });
 await send('Runtime.enable');await send('Page.enable');
 const baseline=await nav('https://www.tarnished.dev/build-planner');
 if(baseline.version!=='Elden Ring Version: v1.17')throw Error('Site version mismatch');
 const verify=async(level)=>{
  return await run(function(axis,level,finalIds,outputs){
   const get=id=>document.getElementById(id)?.value??null;
   const vals=finalIds.map(get);
   const expected=finalIds.map(id=>id==='final'+axis?String(level):'10');
   const load=String(get('Equip Load')||'').match(/^([0-9.]+)\s*\/\s*([0-9.]+)/);
   const rune=document.getElementById('activate-rune');
   const physick=document.getElementById('activate-physick');
   const poise=String(get('Poise')||'');
   const values=outputs.map(id=>get(id));
   const checked=vals.every((v,i)=>v===expected[i])&&
    load&&Number(load[1])===0&&Number(poise)===0&&
    rune?.checked===false&&physick?.checked===false;
   return {checked,values,vals,expected,load:load?.[0]??null,poise,
     relevantError:!checked?'Unexpected Wretch or equipped effects':null};
  },axis,level,finalIds,outputs);
 };
 const baselineCheck=await verify(10);
 if(!baselineCheck.checked)throw Error('Not naked Wretch 10 baseline: '+JSON.stringify(baselineCheck));
 const rows=[];
 for(let level=10;level<=99;level++){
  if(level>10){
   const value=await keyboard(axis,level);
   if(value!==String(level))throw Error('Real keyboard input did not stick '+axis+' '+level);
  }
  const row=await verify(level);
  if(!row.checked)throw Error('Not real naked Wretch at '+axis+'='+level+' '+JSON.stringify(row));
  const nums=row.values.map((v,i)=>{
   if(!/^\d{1,5}(?:,\d{3})*(?:\.\d+)?$/.test(String(v)))
    throw Error('Non-numeric source output '+outputs[i]+' at '+axis+' '+level+' = '+v);
   return Number(v.replaceAll(',',''));
  });
  if(nums.some(x=>!Number.isFinite(x)||x<0||x>99999))
   throw Error('Out-of-range output at '+axis+' '+level);
  rows.push({level,values:nums});
 }
 const record={
  referenceVersion:'v1.17',axis,
  reference:'Real Tarnished.dev Build Planner, real Chromium keyboard',
  scenario:'Wretch all 10 except selected axis 10–99, no gear/rune/Physick',
  axes,outputs,rows,
  verifiedEveryRow:true
 };
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/wretch-defense-'+axis+'.json'),JSON.stringify(record,null,2)+'\n');
 console.log('[WRETCH DEFENSE 90] '+JSON.stringify(record));
 if(rows.length!==90||rows[0].level!==10||rows[89].level!==99)
  throw Error('Incomplete 90 level axis, refuse a partial table');
}
try{await main()}finally{
 try{ws?.close()}catch{}try{chrome?.kill('SIGTERM')}catch{}
 await sleep(300);if(chrome?.exitCode===null)try{chrome.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
