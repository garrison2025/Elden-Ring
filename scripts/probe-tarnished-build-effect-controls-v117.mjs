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
/** Read-only real-site UI discovery for previously unverified buffs.
 * Source is the actually rendered public v1.17 Build Planner, not guessed names.
 */
const pass=Number(process.env.V117_EFFECT_DISCOVERY_PASS??1);
async function main(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-effects-'+pass+'-'));
 chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--disable-extensions','--no-first-run','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--remote-allow-origins=*',
  '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const ep=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>chrome.exitCode!==null?'Chrome exit '+chrome.exitCode:null});
 socket=new WebSocket(ep);
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Socket timeout')),12000);
  socket.addEventListener('open',()=>{clearTimeout(t);resolve()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(t);reject(Error('CDP socket failed'))},{once:true});
 });
 socket.addEventListener('message',event=>{
  const msg=JSON.parse(event.data),p=pending.get(msg.id);
  if(!p)return;
  pending.delete(msg.id);clearTimeout(p.timer);
  if(msg.error)p.reject(Error(msg.error.message));else p.resolve(msg.result);
 });
 await send('Page.enable');await send('Runtime.enable');
 await send('Page.navigate',{url:'https://www.tarnished.dev/build-planner'});
 await sleep(5700);
 const state=await pageCall(function(){
  const dropdowns=[...document.querySelectorAll('.p-dropdown,.p-multiselect,[role="combobox"]')].map((e,i)=>{
   const parent=e.closest('label')??e.parentElement??e;
   const grand=parent.parentElement??parent;
   return{i,html:e.outerHTML.slice(0,600),
    label:(grand.innerText||'').slice(0,200),
    title:e.querySelector('.p-dropdown-label,.p-multiselect-label')?.innerText?.trim()??'',
    x:e.getBoundingClientRect().x+e.getBoundingClientRect().width/2,
    y:e.getBoundingClientRect().y+e.getBoundingClientRect().height/2};
  });
  const toggles=[...document.querySelectorAll('input[type=checkbox],button')].filter(e=>
    /rune|physick|talisman|crystal|tear|activate/i.test(
    (e.id||'')+' '+(e.innerText||'')+' '+(e.parentElement?.innerText||''))).map(e=>({
    tag:e.tagName,id:e.id,type:e.type,checked:e.checked,
    context:e.parentElement?.innerText?.slice(0,140),html:e.outerHTML.slice(0,240)
  }));
  const outputs=['finalvigor','finalmind','finalendurance','finalstrength',
   'finaldexterity','finalintelligence','finalfaith','finalarcane','HP','FP','Stamina','Equip Load'];
  return{version:document.body.innerText.match(/Elden Ring Version:[^\n]*/)?.[0],
   dropdowns,toggles,fields:Object.fromEntries(outputs.map(id=>[id,document.getElementById(id)?.value])),
   text:document.body.innerText.slice(0,6000)};
 });
 if(state.version!=='Elden Ring Version: v1.17')throw Error('Wrong public reference version');
 console.log('[V117 EFFECT ACTUAL CONTROLS] '+JSON.stringify({
 version:state.version,
 dropdowns:state.dropdowns.map(x=>({i:x.i,title:x.title,id:x.html.match(/id=\\\"([^\\\"]+)/)?.[1],
  label:x.label.slice(0,125)})),
 toggles:state.toggles.map(x=>({id:x.id,checked:x.checked,context:x.context})),
 fields:state.fields,
 text:state.text.slice(-3000)
}));
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/v117-effect-control-discovery-'+pass+'.json'),JSON.stringify(state,null,2)+'\n');
}
try{await main()}finally{
 try{socket?.close()}catch{}try{chrome?.kill('SIGTERM')}catch{}
 await sleep(260);if(chrome?.exitCode===null)try{chrome.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
