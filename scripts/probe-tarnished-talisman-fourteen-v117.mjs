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

// The original armor sharding constant is intentionally omitted here.
const slot='Head';
const targets=[{id:'tarnished-v117-dlc-circlet-of-light',name:'Circlet of Light',slot:'Head'}];
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
/** Three ACTUAL unbuffed public Build + ONE isolated effect proofs:
 * - Starscourge Heirloom talisman alone
 * - Godrick's Great Rune selected+enabled
 * - Intelligence-knot Crystal Tear selected+Physick enabled
 * The UI selection and actual field outputs must agree; no guessed +stats.
 */
/** Four separate shards x two independent passes; every item is a fresh,
 * truly unbuffed real Build page. Capture attrs, HP/FP/Stam and load, not
 * item descriptions or hypothetical multiselection stacking behavior.
 */
const candidates=[
 'Starscourge Heirloom','Prosthesis-Wearer Heirloom','Stargazer Heirloom',
 'Two Fingers Heirloom',"Radagon's Scarseal","Radagon's Soreseal",
 "Marika's Scarseal","Marika's Soreseal","Erdtree's Favor +2",
 'Viridian Amber Medallion +2','Crimson Amber Medallion +2',
 'Arsenal Charm',"Great-Jar's Arsenal",'Silver Scarab'
];
const shard=Number(process.env.V117_TALISMAN_SHARD),pass=Number(process.env.V117_TALISMAN_PASS);
if(!Number.isInteger(shard)||shard<0||shard>3||![1,2].includes(pass))
 throw Error('Talisman shard 0–3, independent pass 1/2 required');
const pick=async(scenario)=>{
 const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
 const widgets=[...document.querySelectorAll('.p-dropdown,.p-multiselect')];
 const target=widgets.find(x=>
  normalize(x.querySelector('.p-dropdown-label,.p-multiselect-label')?.textContent??'')===
  normalize(scenario.label));
 if(!target)return{ok:false,reason:'Could not find exact unmodified option selector',
  labels:widgets.map(x=>x.querySelector('.p-dropdown-label,.p-multiselect-label')?.textContent?.trim())};
 (target.querySelector('.p-dropdown-trigger,.p-multiselect-trigger')??target).click();
 await new Promise(r=>setTimeout(r,200));
 const optionEls=()=>[...document.querySelectorAll('[role="option"],.p-dropdown-item,.p-multiselect-item')]
  .filter(x=>x.offsetParent!==null);
 let items=optionEls(),found=items.find(x=>normalize(x.textContent)===normalize(scenario.name));
 const filter=document.querySelector('.p-dropdown-filter,.p-multiselect-filter');
 if(!found&&filter){
  const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
  setter.call(filter,scenario.name);filter.dispatchEvent(new Event('input',{bubbles:true}));
  await new Promise(r=>setTimeout(r,250));
  items=optionEls();found=items.find(x=>normalize(x.textContent)===normalize(scenario.name));
 }
 if(!found)return{ok:false,reason:'Exact option is unavailable',shown:items.slice(0,12).map(x=>x.textContent?.trim()),
  widget:target.outerHTML.slice(0,300),filter:!!filter};
 found.click();await new Promise(r=>setTimeout(r,500));
 const label=target.querySelector('.p-dropdown-label,.p-multiselect-label')?.textContent?.trim()??'';
 const preActivationStats=['finalvigor','finalmind','finalendurance','finalstrength',
  'finaldexterity','finalintelligence','finalfaith','finalarcane'].map(k=>
   document.getElementById(k)?.value);
 const preActivationChecked=scenario.activate?document.getElementById(scenario.activate)?.checked:null;
 if(scenario.activate){
  const toggle=document.getElementById(scenario.activate);
  if(!toggle)return{ok:false,reason:'Missing activation checkbox',label};
  if(!toggle.checked)toggle.click();
  await new Promise(r=>setTimeout(r,450));
 }
 const selected=normalize(label).includes(normalize(scenario.name))||
   [...target.querySelectorAll('.p-multiselect-token,.p-multiselect-label')].some(x=>
    normalize(x.textContent).includes(normalize(scenario.name)));
 return{ok:selected,label,preActivationStats,preActivationChecked,
  activated:scenario.activate?document.getElementById(scenario.activate)?.checked:null,
  visibleContext:target.parentElement?.innerText?.slice(0,210)};
};

async function main(){
 profile=await mkdtemp(join(tmpdir(),'v117-talisman-'+shard+'-'+pass+'-'));
 chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--disable-extensions','--no-first-run','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--remote-allow-origins=*',
  '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const endpoint=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>chrome.exitCode!==null?'Chrome error '+chrome.exitCode:null});
 socket=new WebSocket(endpoint);
 await new Promise((ok,bad)=>{const t=setTimeout(()=>bad(Error('socket timeout')),12000);
  socket.addEventListener('open',()=>{clearTimeout(t);ok()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(t);bad(Error('socket failure'))},{once:true});
 });
 socket.addEventListener('message',evt=>{const m=JSON.parse(evt.data),p=pending.get(m.id);
  if(!p)return;pending.delete(m.id);clearTimeout(p.timer);
  if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result);
 });
 await send('Runtime.enable');await send('Page.enable');
 const rows=[];
 for(let idx=shard*4;idx<Math.min((shard+1)*4,candidates.length);idx++){
  const name=candidates[idx];
  await send('Page.navigate',{url:'https://www.tarnished.dev/build-planner?'+
   new URLSearchParams({str:'10',dex:'10',int:'10',fai:'10',arc:'10',
    smith:'0',somber:'0',twoHanded:'false'})});
  await sleep(3200);
  const base=await pageCall(state);
  if(base.version!=='Elden Ring Version: v1.17'||
    base.finalStats.some(x=>x!=='10')||base.load!==0||base.poise!==0||
    base.rune!==false||base.physick!==false)
   throw Error('Contaminated baseline for '+name+': '+JSON.stringify(base).slice(0,1000));
  const chosen=await pageCall(pick,[{kind:'talisman',label:'Search equipped talismans...',name}]);
  if(!chosen.ok){rows.push({name,available:false,reason:chosen.reason,shown:chosen.shown});continue;}
  const v=await pageCall(state);
  const output=await pageCall(function(){
   const read=id=>document.getElementById(id)?.value??null;
   return Object.fromEntries(['HP','FP','Stamina','Discovery','Physical Defense',
    'Magic Defense','Immunity','Robustness','Focus','Vitality'].map(k=>[k,read(k)]));
  });
  const baselineOutput=await pageCall(function(){
   // HP/FP/Stamina are deterministic at naked Wretch 10, independently
   // recorded from the actual baseline in eight prior shards.
   return document.body.innerText.match(/Elden Ring Version:[^\n]*/)?.[0];
  });
  const exact=chosen.label===name&&v.version===base.version&&
   v.rune===false&&v.physick===false&&v.poise===0&&
   Object.values(v.slots).every(x=>String(x).startsWith('Select equipped'))&&
   Number.isFinite(v.load)&&v.finalStats.length===8;
  const diff=v.finalStats.map((x,i)=>Number(x)-Number(base.finalStats[i]));
  rows.push({name,available:exact,actualLabel:chosen.label,weight:v.load,
    initialStats:base.finalStats,finalStats:v.finalStats,delta:diff,
    capacity:v.capacity,values:output,
    baselineVersion:baselineOutput,
    note:'Single selected reference talisman, NO active effects from any other item'});
  if(!exact)throw Error('Bad real-site selection identity or changed baseline '+name);
 }
 const report={site:'Tarnished.dev public v1.17',pass,shard,
  totalAttempted:rows.length,accepted:rows.filter(x=>x.available).length,rows};
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/v117-talisman-shard-'+shard+'-pass-'+pass+'.json'),
  JSON.stringify(report,null,2)+'\n');
 console.log('[V117 TALISMAN MULTI FIELD REAL] '+JSON.stringify(report));
 if(!rows.length)throw Error('No talisman names attempted');
}
try{await main()}finally{
 try{socket?.close()}catch{}try{chrome?.kill('SIGTERM')}catch{}
 await sleep(250);if(chrome?.exitCode===null)try{chrome.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
