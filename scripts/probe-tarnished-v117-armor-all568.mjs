#!/usr/bin/env node
/**
 * Read ALL 568 preexisting pinned armor names against actual PUBLIC Tarnished.dev.
 * Reuses a real visible slot dropdown, never guesses values for rejected items.
 * In each shard all candidates are in the same equipment slot, so selecting
 * a new armor replaces the previous one; no other armor is equipped.
 */
import {spawn} from 'node:child_process';
import {readFile,mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {waitForChromePage} from './browser-cdp-startup.mjs';
import {loadPinnedArmorSource} from '../public/src/armor-source-optin.mjs';

const groups=[['Head',4],['Chest',5],['Arms',3],['Legs',3]];
const shard=Number(process.env.TARNISHED_ARMOR_SHARD);
if(!Number.isInteger(shard)||shard<0||shard>=15)throw Error('15 armor shards required');
const known=await loadPinnedArmorSource(fetch);
if(known.count!==568)throw Error('Pinned armor source count unexpectedly changed');
const slotById=Object.fromEntries([['Head','Equipped Helmet'],['Chest','Equipped Chest'],
 ['Arms','Equipped Gauntlets'],['Legs','Equipped Legs']]);
let slot,section,idx=shard;
for(const [s,n] of groups){if(idx<n){slot=s;section={total:n,index:idx};break;}idx-=n;}
const all=known.armors.filter(x=>x.slot===slot).sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
const targets=all.filter((_,i)=>i%section.total===section.index);
const totalAll=groups.reduce((s,[name])=>s+known.armors.filter(x=>x.slot===name).length,0);
if(totalAll!==568||!targets.length)throw Error('Armor partition coverage failed');
const binary=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable',
 '/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!binary)throw Error('Real Chromium required');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let chrome,profile,socket,id=0;const pending=new Map();
async function send(method,params={}){
 const n=++id;return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{pending.delete(n);reject(Error(method+' timeout'));},18000);
  pending.set(n,{resolve,reject,timer});
  socket.send(JSON.stringify({id:n,method,params}));
 });
}
async function pageCall(fn,args=[]){
 const result=await send('Runtime.evaluate',{
  expression:'('+fn.toString()+')('+args.map(x=>JSON.stringify(x)).join(',')+')',
  returnByValue:true,awaitPromise:true
 });
 if(result.exceptionDetails)throw Error(result.exceptionDetails.text);
 return result.result?.value;
}
function state(){
 const body=document.body?.innerText||'';
 const raw=String(document.getElementById('Equip Load')?.value??'');
 const load=/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/.exec(raw);
 const poiseRaw=String(document.getElementById('Poise')?.value??'');
 const slots={};
 for(const [slot,label] of Object.entries({
  Head:'Equipped Helmet',Chest:'Equipped Chest',Arms:'Equipped Gauntlets',Legs:'Equipped Legs'
 })){
  const el=[...document.querySelectorAll('.p-dropdown')]
   .find(e=>e.parentElement?.innerText?.trim()?.startsWith(label+'\n'));
  slots[slot]=el?.querySelector('.p-dropdown-label')?.textContent?.trim()??null;
 }
 return {version:(body.match(/Elden Ring Version:[^\n]*/)||[])[0]??'',
  url:location.href,
  load:load?Number(load[1]):null,capacity:load?Number(load[2]):null,
  poise:/^\d+(?:\.\d+)?$/.test(poiseRaw)?Number(poiseRaw):null,
  controls:['strength','dexterity','intelligence','faith','arcane','smithinglevel','somberlevel']
   .map(id=>String(document.getElementById(id)?.value??'')),
  rune:document.getElementById('activate-rune')?.checked,
  physick:document.getElementById('activate-physick')?.checked,
  slots};
}
async function select(slot,name){
 const labels={Head:'Equipped Helmet',Chest:'Equipped Chest',
  Arms:'Equipped Gauntlets',Legs:'Equipped Legs'};
 const normalized=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
 const dropdown=[...document.querySelectorAll('.p-dropdown')]
  .find(x=>x.parentElement?.innerText?.trim()?.startsWith(labels[slot]+'\n'));
 if(!dropdown)return {status:'DROPDOWN_MISSING'};
 const trigger=dropdown.querySelector('.p-dropdown-trigger')||dropdown;
 trigger.click();
 await new Promise(r=>setTimeout(r,110));
 const options=()=>[...document.querySelectorAll('[role="option"],.p-dropdown-item')]
  .filter(x=>x.offsetParent!==null);
 let visible=options(),option=visible.find(x=>normalized(x.textContent)===normalized(name));
 if(!option){
  const filter=document.querySelector('.p-dropdown-filter');
  if(filter){
   const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
   setter.call(filter,name);
   filter.dispatchEvent(new Event('input',{bubbles:true}));
   await new Promise(r=>setTimeout(r,175));
   visible=options();
   option=visible.find(x=>normalized(x.textContent)===normalized(name));
  }
 }
 if(!option){
  trigger.click();
  return {status:'OPTION_UNAVAILABLE',visibleCount:visible.length,
   filterPresent:!!document.querySelector('.p-dropdown-filter'),
   sample:visible.slice(0,5).map(x=>x.textContent?.trim()?.slice(0,50))};
 }
 option.click();
 await new Promise(r=>setTimeout(r,160));
 const label=dropdown.querySelector('.p-dropdown-label')?.textContent?.trim()??null;
 return {status:normalized(label)===normalized(name)?'SELECTED_EXACT':'LABEL_MISMATCH',label};
}
async function main(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-armor-568-'));
 chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu',
  '--disable-dev-shm-usage','--disable-extensions','--no-first-run',
  '--disable-background-networking','--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=0','--remote-allow-origins=*',
  '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const endpoint=await waitForChromePage({profile,readText:readFile,
  request:fetch,getExitReason:()=>chrome.exitCode!==null?'Chrome exited '+chrome.exitCode:null});
 socket=new WebSocket(endpoint);
 await new Promise((res,rej)=>{
  const timer=setTimeout(()=>rej(Error('CDP open timeout')),12000);
  socket.addEventListener('open',()=>{clearTimeout(timer);res()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(timer);rej(Error('CDP connection failed'))},{once:true});
 });
 socket.addEventListener('message',e=>{
  const z=JSON.parse(e.data),p=pending.get(z.id);
  if(!p)return;
  pending.delete(z.id);clearTimeout(p.timer);
  if(z.error)p.reject(Error(z.error.message));else p.resolve(z.result);
 });
 await send('Runtime.enable');await send('Page.enable');
 await send('Page.navigate',{url:'https://www.tarnished.dev/build-planner?'+
  new URLSearchParams({str:'10',dex:'10',int:'10',fai:'10',arc:'10',
   smith:'0',somber:'0',twoHanded:'false'})});
 await sleep(2900);
 const baseline=await pageCall(state);
 if(baseline.version!=='Elden Ring Version: v1.17'||
   baseline.load!==0||baseline.poise!==0||baseline.capacity!==48.2||
   baseline.rune!==false||baseline.physick!==false||
   baseline.controls.join(',')!=='10,10,10,10,10,0,0')
  throw Error('Real public UI base stats/empty load/Poise not proven: '+JSON.stringify(baseline));
 const emptyText='Select equipped';
 if(Object.entries(baseline.slots).some(([key,value])=>!String(value).startsWith(emptyText)))
  throw Error('Other armor active at baseline');
 const rows=[];
 for(const item of targets){
  try{
   const selectResult=await pageCall(select,[slot,item.name]);
   const observed=await pageCall(state);
   const otherSlots=Object.entries(observed.slots)
    .filter(([name])=>name!==slot);
   const exact=selectResult.status==='SELECTED_EXACT'&&
    observed.version===baseline.version&&
    observed.controls.join(',')===baseline.controls.join(',')&&
    observed.rune===false&&observed.physick===false&&
    observed.capacity===baseline.capacity&&
    otherSlots.every(([,value])=>String(value).startsWith(emptyText))&&
    Number.isFinite(observed.load)&&observed.load>=0&&
    Number.isInteger(observed.poise)&&observed.poise>=0;
   const row={id:item.id,name:item.name,slot,
    siteName:selectResult.label??null,
    weight:exact?observed.load:null,poise:exact?observed.poise:null,
    valid:exact,reason:exact?null:selectResult.status};
   rows.push(row);
  }catch(e){rows.push({id:item.id,name:item.name,slot,valid:false,
    weight:null,poise:null,reason:String(e.message).slice(0,160)});}
 }
 const accepted=rows.filter(x=>x.valid).length;
 const result={source:'Tarnished.dev public Build Calculator v1.17',
  baseline:{level:'Wretch',str:10,dex:10,int:10,fai:10,arc:10,
   emptyWeight:0,emptyPoise:0,capacity:48.2,unbuffed:true},
  shard,slot,sourceItems:568,attempted:rows.length,accepted,
  rejected:rows.length-accepted,rows};
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-armor-shard-'+shard+'.json'),
  JSON.stringify(result,null,2)+'\n');
 console.log('[ARMOR WIDE BROWSER] '+JSON.stringify({
  shard,slot,attempted:rows.length,accepted,rejected:rows.length-accepted,
  reasons:rows.filter(x=>!x.valid).slice(0,20).map(x=>({name:x.name,why:x.reason}))}));
 if(accepted===0)throw Error('No real site armor values accepted in shard '+shard);
}
try{await main()}finally{
 try{socket?.close()}catch{}try{chrome?.kill('SIGTERM')}catch{}
 await sleep(210);if(chrome?.exitCode===null)try{chrome.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
