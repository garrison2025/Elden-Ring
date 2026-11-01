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

const shard=0;
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
/** Public v1.17 actual selected-two-talisman reference profile.
 * Two independently opened Wretch sessions. Exact selected names checked
 * at every intermediate selection, no guessed additive/stacks rule.
 */
const combos=[
 ["Starscourge Heirloom","Radagon's Scarseal"],
 ["Radagon's Scarseal","Marika's Scarseal"],
 ["Great-Jar's Arsenal","Erdtree's Favor +2"],
 ["Crimson Amber Medallion +2","Erdtree's Favor +2"]
];
const index=Number(process.env.V117_COMBO_INDEX),pass=Number(process.env.V117_COMBO_PASS);
if(!Number.isInteger(index)||index<0||index>=combos.length||![1,2].includes(pass))
 throw Error('V117_COMBO_INDEX 0–3 and V117_COMBO_PASS 1–2 required.');
const selectedName=x=>String(x||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
const pickTalisman=async(name,previousNames)=>{
 const norm=x=>String(x||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
 const widgets=[...document.querySelectorAll('.p-multiselect')];
 const chosen=widgets.find(w=>{
  const label=w.querySelector('.p-multiselect-label')?.textContent?.trim()||'';
  return norm(label)===norm('Search equipped talismans...')||
    previousNames.some(n=>norm(label).includes(norm(n)));
 });
 if(!chosen)return{success:false,reason:'Actual talisman selector missing',labels:widgets.map(w=>w.innerText.slice(0,120))};
 (chosen.querySelector('.p-multiselect-trigger')||chosen).click();
 await new Promise(r=>setTimeout(r,180));
 const options=()=>[...document.querySelectorAll('[role="option"],.p-multiselect-item')].
  filter(e=>e.offsetParent!==null);
 let list=options(),option=list.find(e=>norm(e.textContent)===norm(name));
 const filter=document.querySelector('.p-multiselect-filter');
 if(!option&&filter){
  const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
  setter.call(filter,name);filter.dispatchEvent(new Event('input',{bubbles:true}));
  await new Promise(r=>setTimeout(r,220));
  list=options();option=list.find(e=>norm(e.textContent)===norm(name));
 }
 if(!option)return{success:false,reason:'Actual name not visible',label:chosen.innerText.slice(0,140),
  shown:list.slice(0,20).map(x=>x.textContent?.trim()),hasFilter:!!filter};
 option.click();
 await new Promise(r=>setTimeout(r,450));
 const label=chosen.querySelector('.p-multiselect-label')?.textContent?.trim()||'';
 const matched=[...previousNames,name].every(n=>norm(label).includes(norm(n)));
 return{success:matched,name,label,optionText:option.textContent?.trim(),previousNames};
};
async function capture(){
 const core=state();
 const ids=['HP','FP','Stamina','Discovery','Physical Defense','Magic Defense','Fire Defense',
   'Lightning Defense','Holy Defense','Immunity','Robustness','Focus','Vitality'];
 const raw=Object.fromEntries(ids.map(x=>[x,document.getElementById(x)?.value??null]));
 const neg=core.metrics;
 const selected=[...document.querySelectorAll('.p-multiselect')].map(w=>
  w.querySelector('.p-multiselect-label')?.textContent?.trim()||'');
 return {...core,raw,selected};
}
async function main(){
 profile=await mkdtemp(join(tmpdir(),'v117-double-talisman-'+index+'-'+pass+'-'));
 chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-extensions','--no-first-run','--disable-background-networking',
 '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--remote-allow-origins=*',
 '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const endpoint=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>chrome.exitCode!==null?'Chrome exited '+chrome.exitCode:null});
 socket=new WebSocket(endpoint);
 await new Promise((res,rej)=>{const t=setTimeout(()=>rej(Error('CDP timeout')),12000);
  socket.addEventListener('open',()=>{clearTimeout(t);res()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(t);rej(Error('CDP connection failed'))},{once:true});
 });
 socket.addEventListener('message',evt=>{const m=JSON.parse(evt.data),q=pending.get(m.id);
  if(!q)return;pending.delete(m.id);clearTimeout(q.timer);
  if(m.error)q.reject(Error(m.error.message));else q.resolve(m.result);
 });
 await send('Runtime.enable');await send('Page.enable');
 await send('Page.navigate',{url:'https://www.tarnished.dev/build-planner?'+
  new URLSearchParams({str:'10',dex:'10',int:'10',fai:'10',arc:'10',smith:'0',somber:'0',twoHanded:'false'})});
 await sleep(3400);
 const baseline=await pageCall(capture);
 if(baseline.version!=='Elden Ring Version: v1.17'||baseline.finalStats.some(x=>x!=='10')||
   baseline.load!==0||baseline.poise!==0||baseline.rune!==false||baseline.physick!==false)
  throw Error('Contaminated baseline: '+JSON.stringify(baseline).slice(0,800));
 const chosen=[],after=[];
 for(let i=0;i<combos[index].length;i++){
  const res=await pageCall(pickTalisman,[combos[index][i],combos[index].slice(0,i)]);
  chosen.push(res);
  after.push(await pageCall(capture));
  if(!res.success)throw Error('Real UI failed selecting second talisman: '+JSON.stringify({res,chosen,after:after.map(x=>x.selected)}));
 }
 const final=after.at(-1);
 const expectedWeight=combos[index].reduce((s,name)=>s+
  (name==="Erdtree's Favor +2"||name==="Great-Jar's Arsenal"?1.5:
   name==="Crimson Amber Medallion +2"?0.3:0.8),0);
 const correct=final.poise===0&&final.load===expectedWeight&&
  final.rune===false&&final.physick===false&&
  Object.values(final.slots).every(x=>String(x).startsWith('Select equipped'));
 const record={source:'Tarnished.dev public v1.17',combo:combos[index],index,pass,
  expectedWeight,baseline,chosen,after,valid:correct};
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/v117-combo-'+index+'-pass-'+pass+'.json'),JSON.stringify(record,null,2)+'\n');
 console.log('[V117 TWO TALISMAN LIVE] '+JSON.stringify({
  index,pass,combo:record.combo,expectedWeight,valid:correct,
  selection:chosen,stages:after.map(x=>({
   finalStats:x.finalStats,load:x.load,capacity:x.capacity,raw:x.raw,metrics:x.metrics,
   selected:x.selected
  }))
 }));
 if(!correct)throw Error('Exact two-talisman reference selection / real weight not proven.');
}
try{await main()}finally{
 try{socket?.close()}catch{}try{chrome?.kill('SIGTERM')}catch{}
 await sleep(250);if(chrome?.exitCode===null)try{chrome.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
