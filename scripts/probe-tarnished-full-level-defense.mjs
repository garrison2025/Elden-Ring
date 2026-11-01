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
const shard=Number(process.env.V117_LEVEL_SHARD);
if(!Number.isInteger(shard)||shard<1||shard>7)throw Error('Shard 1..7 required');
async function main(){
 profile=await mkdtemp(join(tmpdir(),'wretch-max-level-'+shard+'-'));
 chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-extensions','--no-first-run','--disable-background-networking',
 '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--remote-allow-origins=*',
 '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const ep=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>chrome.exitCode!==null?'Chrome '+chrome.exitCode:null});
 ws=new WebSocket(ep);
 await new Promise((ok,bad)=>{const t=setTimeout(()=>bad(Error('CDP open timeout')),12000);
  ws.addEventListener('open',()=>{clearTimeout(t);ok()},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(t);bad(Error('CDP error'))},{once:true});
 });
 ws.addEventListener('message',evt=>{const m=JSON.parse(evt.data),p=pending.get(m.id);if(!p)return;
  pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.bad(Error(m.error.message));else p.ok(m.result);
 });
 await send('Runtime.enable');await send('Page.enable');
 const state=await nav('https://www.tarnished.dev/build-planner');
 if(state.version!=='Elden Ring Version: v1.17')throw Error('Wrong reference version');
 const values=Array(8).fill(10);
 for(let i=0;i<shard;i++){
  if(await keyboard(axes[i],99)!=='99')throw Error('Cannot preload previous stat to 99');
  values[i]=99;
 }
 const rows=[];
 for(let value=10;value<=99;value++){
  if(value>10&&await keyboard(axes[shard],value)!==String(value))
   throw Error('Keyboard value not accepted for '+axes[shard]+' '+value);
  values[shard]=value;
  const actual=await run(function(expected,finalIds,outputs){
   const get=id=>document.getElementById(id)?.value??null;
   const read=finalIds.map(get),poise=get('Poise');
   const load=String(get('Equip Load')||'').match(/^([0-9.]+)\s*\/\s*([0-9.]+)/);
   return{valid:read.every((v,i)=>v===String(expected[i]))&&
    Number(load?.[1])===0&&Number(poise)===0&&
    document.getElementById('activate-rune')?.checked===false&&
    document.getElementById('activate-physick')?.checked===false,
    final:read,raw:outputs.map(get)};
  },values,finalIds,outputs);
  if(!actual.valid)throw Error('Not naked Wretch at '+axes[shard]+'='+value+' '+JSON.stringify(actual));
  const nums=actual.raw.map(x=>{
   if(!/^\d{1,5}(?:,\d{3})*(?:\.\d+)?$/.test(String(x)))
    throw Error('Non-numeric real defense '+x);
   return Number(x.replaceAll(',',''));
  });
  rows.push({level:1+values.reduce((s,n)=>s+n-10,0),stats:[...values],values:nums});
 }
 const output={shard,axes,outputs,source:'Tarnished.dev real v1.17 naked Wretch',rows};
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/wretch-level-'+shard+'.json'),JSON.stringify(output,null,2)+'\n');
 console.log('[WRETCH LEVEL 713 SHARD] '+JSON.stringify(output));
 if(rows.length!==90||rows[0].level!==1+shard*89||rows[89].level!==90+shard*89)
  throw Error('Level shard incomplete');
}
try{await main()}finally{
 try{ws?.close()}catch{}try{chrome?.kill('SIGTERM')}catch{}
 await sleep(300);if(chrome?.exitCode===null)try{chrome.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
