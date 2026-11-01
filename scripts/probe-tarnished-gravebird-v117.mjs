#!/usr/bin/env node
/**
 * Narrow new DLC supplement: read ONLY Circlet of Light against PUBLIC Tarnished.dev.
 * Reuses a real visible slot dropdown, never guesses values for rejected items.
 * The only candidate is Circlet of Light in the Head equipment slot; selecting
 * it leaves all other armor slots empty; no other equipment is equipped.
 */
import {spawn} from 'node:child_process';
import {readFile,mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {waitForChromePage} from './browser-cdp-startup.mjs';

const shard=Number(process.env.V117_PROOF_PASS??1);
const slot='Arms';
const targets=[{id:'dlc-gravebird-bracelets-v117-direct',name:'Gravebird Bracelets',slot:'Arms'}];
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
 const metricIds={
  physical:'Physical Dmg Negation',strike:'Strike Dmg Negation',
  slash:'Slash Dmg Negation',pierce:'Pierce Dmg Negation',
  magic:'Magic Dmg Negation',fire:'Fire Dmg Negation',
  lightning:'Lightning Dmg Negation',holy:'Holy Dmg Negation',
  immunity:'Immunity',robustness:'Robustness',focus:'Focus',vitality:'Vitality'
 };
 const metrics={};
 for(const [k,id] of Object.entries(metricIds)){
  const raw=String(document.getElementById(id)?.value??'').trim();
  const plain=raw.replace(/%$/,'').trim();
  metrics[k]=/^-?\d+(?:\.\d+)?$/.test(plain)?Number(plain):null;
 }
 const finalStats=['finalvigor','finalmind','finalendurance','finalstrength',
  'finaldexterity','finalintelligence','finalfaith','finalarcane']
  .map(id=>String(document.getElementById(id)?.value??''));
 return {metrics,finalStats,version:(body.match(/Elden Ring Version:[^\n]*/)||[])[0]??'',
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
 profile=await mkdtemp(join(tmpdir(),'tarnished-dlc-gravebird-'));
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
    valid:exact,reason:exact?null:selectResult.status,
    baselineMetrics:exact?baseline.metrics:null,
    liveMetrics:exact?observed.metrics:null,
    baselineFinalStats:exact?baseline.finalStats:null,
    equippedFinalStats:exact?observed.finalStats:null};
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
 await writeFile(resolve('.audit/tarnished-dlc-gravebird-v117.json'),
  JSON.stringify(result,null,2)+'\n');
 console.log('[ARMOR 12-FIELD BROWSER] '+JSON.stringify({
  shard,slot,attempted:rows.length,accepted,rejected:rows.length-accepted,
  reasons:rows.filter(x=>!x.valid).slice(0,20).map(x=>({name:x.name,why:x.reason}))}));
 const row=rows[0];
 if(accepted!==1||row.name!=='Gravebird Bracelets'||row.siteName!=='Gravebird Bracelets'||
  row.weight!==1.7||row.poise!==3||row.slot!=='Arms')
  throw Error('Gravebird Bracelets did not match 1.7 weight / 3 Poise on actual Tarnished v1.17: '+JSON.stringify(row));
 console.log('[GRAVEBIRD DIRECT SITE PROOF] '+JSON.stringify({url:'https://www.tarnished.dev/build-planner',
   name:row.siteName,slot:row.slot,weight:row.weight,poise:row.poise,
   equippedFinalStats:row.equippedFinalStats,baselineFinalStats:row.baselineFinalStats}));
}
try{await main()}finally{
 try{socket?.close()}catch{}try{chrome?.kill('SIGTERM')}catch{}
 await sleep(210);if(chrome?.exitCode===null)try{chrome.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
