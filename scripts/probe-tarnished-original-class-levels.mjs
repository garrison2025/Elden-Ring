#!/usr/bin/env node
/** Actual public v1.17 starting class and base Level parity, original 10
 * character classes, no game client, no undocumented public API.
 * Validation requires the real visible PrimeReact class selector.
 */
import {spawn} from 'node:child_process';
import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {waitForChromePage} from './browser-cdp-startup.mjs';
import {CLASSES,buildLevel} from '../public/src/core.mjs';
const originals=CLASSES.filter(x=>!x.dlc);
if(originals.length!==10)throw Error('Expected ten original character starting classes');
const shard=Number(process.env.TARNISHED_CLASS_SHARD);
if(!Number.isInteger(shard)||shard<0||shard>4)throw Error('Class shard 0..4 required');
const targets=originals.slice(shard*2,shard*2+2);
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chrome)throw Error('Chromium required for actual public DOM comparison');
const sleep=ms=>new Promise(res=>setTimeout(res,ms));
let proc,profile,ws,id=0;const pending=new Map();
async function command(method,params={}){
 const current=++id;return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{pending.delete(current);reject(Error(method+' timeout'));},18000);
  pending.set(current,{resolve,reject,timer});
  ws.send(JSON.stringify({id:current,method,params}));
 });
}
async function pageCall(fn,args=[]){
 const expr='('+fn.toString()+')('+args.map(x=>JSON.stringify(x)).join(',')+')';
 const resp=await command('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
 if(resp.exceptionDetails)throw Error(resp.exceptionDetails.text);
 return resp.result?.value;
}
async function clickVisibleOrigin(name){
 const trigger=document.querySelector('#startingclass .p-dropdown-trigger');
 if(!trigger)return {status:'NO_VISIBLE_TRIGGER'};
 trigger.click();await new Promise(r=>setTimeout(r,280));
 const opt=[...document.querySelectorAll('[role="option"]')].find(e=>(e.textContent||'').trim()===name);
 if(!opt)return {status:'CLASS_OPTION_NOT_VISIBLE',name};
 opt.click();await new Promise(r=>setTimeout(r,200));
 return {status:'SELECTED_VISIBLE_OPTION',actual:document.querySelector('#startingclass .p-dropdown-label')?.textContent?.trim()};
}
function snapshot(){
 const text=document.body?.innerText||'';
 const level=String(document.getElementById('total-level')?.value??'');
 const cls=document.querySelector('#startingclass .p-dropdown-label')?.textContent?.trim()??null;
 const stats=['vigor','mind','endurance','strength','dexterity','intelligence','faith','arcane']
 .map(x=>String(document.getElementById(x)?.value??''));
 return {version:(text.match(/Elden Ring Version:[^\n]*/)||[])[0]??'',
  url:location.href,classLabel:cls,statValues:stats,
  level:/^\d+$/.test(level)?Number(level):null,
  runeOff:document.getElementById('activate-rune')?.checked===false,
  physickOff:document.getElementById('activate-physick')?.checked===false};
}
async function main(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-classes-all-'));
 proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu',
  '--disable-dev-shm-usage','--disable-extensions','--no-first-run',
  '--disable-background-networking','--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const endpoint=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>proc.exitCode!==null?'Chrome exited '+proc.exitCode:null});
 ws=new WebSocket(endpoint);
 await new Promise((res,rej)=>{
  const timer=setTimeout(()=>rej(Error('CDP open timeout')),12000);
  ws.addEventListener('open',()=>{clearTimeout(timer);res()},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(timer);rej(Error('CDP opening failed'))},{once:true});
 });
 ws.addEventListener('message',e=>{
  const m=JSON.parse(e.data),pendingCall=pending.get(m.id);
  if(!pendingCall)return;
  pending.delete(m.id);clearTimeout(pendingCall.timer);
  if(m.error)pendingCall.reject(Error(m.error.message));else pendingCall.resolve(m.result);
 });
 await command('Runtime.enable');await command('Page.enable');
 const rows=[];
 for(const cls of targets){
  try{
   const params=new URLSearchParams({str:'10',dex:'10',int:'10',fai:'10',arc:'10',
    smith:'0',somber:'0',twoHanded:'false'});
   await command('Page.navigate',{url:'https://www.tarnished.dev/build-planner?'+params});
   await sleep(2700);
   let initial=await pageCall(snapshot);
   if(initial.version!=='Elden Ring Version: v1.17'){await sleep(1400);initial=await pageCall(snapshot);}
   const action=cls.name==='Wretch'?{status:'DEFAULT_WRETCH',actual:'Wretch'}:
    await pageCall(clickVisibleOrigin,[cls.name]);
   await sleep(850);
   const shot=await pageCall(snapshot);
   const verified=Boolean(shot.version==='Elden Ring Version: v1.17'&&
    new URL(shot.url).hostname==='www.tarnished.dev'&&
    new URL(shot.url).pathname==='/build-planner'&&
    action.actual===cls.name&&shot.classLabel===cls.name&&
    ['SELECTED_VISIBLE_OPTION','DEFAULT_WRETCH'].includes(action.status)&&
    shot.statValues.length===8&&
    shot.statValues.every((n,i)=>n===String(cls.stats[i]))&&
    Number.isInteger(shot.level)&&shot.runeOff&&shot.physickOff);
   const local=buildLevel(cls,cls.stats);
   const record={id:cls.name,class:cls.name,version:shot.version,
    expectedStats:cls.stats,actualStats:shot.statValues,expectedLevel:local,
    publicLevel:verified?shot.level:null,valid:verified,
    delta:verified?local-shot.level:null,action,observedLabel:shot.classLabel};
   rows.push(record);console.log('[ORIGINAL CLASS LEVEL] '+JSON.stringify(record));
  }catch(e){
   rows.push({id:cls.name,class:cls.name,valid:false,reason:String(e.message).slice(0,200)});
  }
 }
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/v117-original-classes-'+shard+'.json'),
  JSON.stringify({site:'Tarnished.dev public v1.17',shard,rows},null,2)+'\n');
 const counts={total:rows.length,verified:rows.filter(x=>x.valid).length,
  matches:rows.filter(x=>x.valid&&x.delta===0).length,
  failed:rows.filter(x=>!x.valid||x.delta!==0).map(x=>x.class)};
 console.log('[ORIGINAL CLASS LEVEL SUMMARY] '+JSON.stringify(counts));
 if(rows.length!==2||counts.matches!==2)throw Error('Two original-class base-level observations must match');
}
try{await main()}finally{
 try{ws?.close()}catch{}try{proc?.kill('SIGTERM')}catch{}
 await sleep(270);if(proc?.exitCode===null)try{proc.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
