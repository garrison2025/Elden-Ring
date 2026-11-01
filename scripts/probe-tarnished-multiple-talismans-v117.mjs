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

// Shard is defined by this dedicated multi-talisman browser workflow.
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

/** Six distinct two/three-talisman selected scenes, two different Chrome
 * browsers per scene. This is observed reference public v1.17 behavior only.
 */
const scenarios=[
 ['Starscourge Heirloom','Prosthesis-Wearer Heirloom','Stargazer Heirloom'],
 ["Radagon's Soreseal","Erdtree's Favor +2"],
 ["Radagon's Soreseal","Marika's Soreseal"],
 ["Great-Jar's Arsenal","Erdtree's Favor +2"],
 ['Silver Scarab',"Marika's Scarseal"],
 ["Radagon's Scarseal","Radagon's Soreseal"]
];
const shard=Number(process.env.V117_COMBO_SHARD),pass=Number(process.env.V117_COMBO_PASS);
if(!Number.isInteger(shard)||shard<0||shard>2||![1,2].includes(pass))
 throw Error('Set V117_COMBO_SHARD 0..2 and V117_COMBO_PASS 1..2');
const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
async function addTalisman(name){
 const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
 const widget=[...document.querySelectorAll('.p-multiselect')].find(x=>
  (x.parentElement?.innerText||'').includes('Equipped Talismans'));
 if(!widget)return{ok:false,why:'Actual talisman multiselect missing'};
 const trigger=widget.querySelector('.p-multiselect-trigger')??widget;
 // PrimeReact keeps the panel OPEN when a checkbox is selected. An
 // unconditional second click closes it and loses the next site option.
 const isOpen=()=>[...document.querySelectorAll('.p-multiselect-panel,[role=listbox]')]
   .some(x=>{const b=x.getBoundingClientRect();return b.width>0&&b.height>0&&
    !!x.querySelector('.p-multiselect-item,[role=option]')});
 if(!isOpen())trigger.click();
 await new Promise(ok=>setTimeout(ok,120));
 const options=()=>[...document.querySelectorAll('[role=option],.p-multiselect-item')]
  .filter(x=>x.getBoundingClientRect().width>0&&x.getBoundingClientRect().height>0);
 let list=options(),match=list.find(x=>norm(x.textContent)===norm(name));
 if(!match){
  // The previous selected label may remain in the live filter input;
 // always replace it with the new exact item name before searching.
 const filter=document.querySelector('.p-multiselect-filter');
 if(filter){
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(filter,name);
  filter.dispatchEvent(new Event('input',{bubbles:true}));
  await new Promise(ok=>setTimeout(ok,200));
  list=options();
  match=list.find(x=>norm(x.textContent)===norm(name));
 }
  if(filter){
   Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(filter,name);
   filter.dispatchEvent(new Event('input',{bubbles:true}));
   await new Promise(ok=>setTimeout(ok,220));
   list=options();match=list.find(x=>norm(x.textContent)===norm(name));
  }
 }
 if(!match)return{ok:false,why:'Actual named option missing',name,options:list.slice(0,7).map(x=>x.textContent?.trim())};
 match.click();await new Promise(ok=>setTimeout(ok,360));
 const tokens=[...widget.querySelectorAll('.p-multiselect-token')].map(e=>e.innerText.trim());
 const summary=widget.querySelector('.p-multiselect-label')?.textContent?.trim()??'';
 return{ok:true,name,tokens,summary,selectedHint:widget.innerText.slice(0,200)};
}
function readResult(){
 const ids=['finalvigor','finalmind','finalendurance','finalstrength','finaldexterity',
   'finalintelligence','finalfaith','finalarcane'];
 const get=id=>document.getElementById(id)?.value??null;
 const num=v=>{const n=Number(String(v).replaceAll(',',''));return Number.isFinite(n)?n:null};
 const equip=String(get('Equip Load')||''),load=equip.match(/^([0-9.]+)\s*\/\s*([0-9.]+)/);
 const values=['HP','FP','Stamina','Discovery','Physical Defense','Magic Defense',
 'Immunity','Robustness','Focus','Vitality'];
 const extras=Object.fromEntries(values.map(k=>[k,num(get(k))]));
 const multiselect=[...document.querySelectorAll('.p-multiselect')].find(x=>
  (x.parentElement?.innerText||'').includes('Equipped Talismans'));
 return{version:document.body.innerText.match(/Elden Ring Version:[^\n]*/)?.[0],
  stats:ids.map(k=>num(get(k))),extras,load:Number(load?.[1]),
  maxEquipLoad:Number(load?.[2]),
  poise:num(get('Poise')),
  negation:Object.fromEntries(['Physical','Strike','Slash','Pierce','Magic','Fire','Lightning','Holy']
   .map(k=>[k.toLowerCase(),num(String(get(k+' Dmg Negation')).replace('%',''))])),
  talismanView:multiselect?.innerText?.slice(0,180),
  selectedTokens:[...multiselect?.querySelectorAll('.p-multiselect-token')??[]].map(e=>e.innerText.trim()),
  rune:document.getElementById('activate-rune')?.checked,
  physick:document.getElementById('activate-physick')?.checked,
  noWeaponsAndArmor:[...document.querySelectorAll('.p-dropdown')].filter(x=>[
   'Equipped Helmet','Equipped Chest','Equipped Gauntlets','Equipped Legs',
   'Equipped Left Hand','Equipped Right Hand'
  ].some(k=>(x.parentElement?.innerText||'').startsWith(k)))
  .every(x=>x.querySelector('.p-dropdown-label')?.textContent?.trim()?.startsWith('Select '))}
}
async function main(){
 profile=await mkdtemp(join(tmpdir(),'v117-talisman-combo-'+shard+'-'+pass+'-'));
 chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--disable-extensions','--no-first-run','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--remote-allow-origins=*',
  '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const ep=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>chrome.exitCode!==null?'Chrome '+chrome.exitCode:null});
 socket=new WebSocket(ep);
 await new Promise((ok,bad)=>{const timer=setTimeout(()=>bad(Error('Socket timeout')),12000);
 socket.addEventListener('open',()=>{clearTimeout(timer);ok()},{once:true});
 socket.addEventListener('error',()=>{clearTimeout(timer);bad(Error('Socket error'))},{once:true});});
 socket.addEventListener('message',event=>{const msg=JSON.parse(event.data),p=pending.get(msg.id);
 if(!p)return;pending.delete(msg.id);clearTimeout(p.timer);
 if(msg.error)p.reject(Error(msg.error.message));else p.resolve(msg.result);});
 await send('Runtime.enable');await send('Page.enable');
 const rows=[];
 for(let index=shard*2;index<shard*2+2;index++){
  const names=scenarios[index];
  await send('Page.navigate',{url:'https://www.tarnished.dev/build-planner?'+
   new URLSearchParams({str:'10',dex:'10',int:'10',fai:'10',arc:'10',
    smith:'0',somber:'0',twoHanded:'false'})});
  await sleep(3200);
  const baseline=await pageCall(readResult);
  if(baseline.version!=='Elden Ring Version: v1.17'||
     baseline.stats.some(x=>x!==10)||baseline.load!==0||baseline.poise!==0||
     baseline.rune!==false||baseline.physick!==false||!baseline.noWeaponsAndArmor)
   throw Error('Wretch naked baseline invalid '+JSON.stringify(baseline).slice(0,800));
  const clicks=[];
  for(const name of names){
   const out=await pageCall(addTalisman,[name]);
   clicks.push(out);
   if(!out.ok)break;
  }
  const actual=await pageCall(readResult);
  const sourceConsistent=clicks.length===names.length&&clicks.every(x=>x.ok)&&
   actual.version===baseline.version&&actual.rune===false&&actual.physick===false&&
   actual.noWeaponsAndArmor&&actual.poise===0&&
   actual.stats.length===8&&actual.stats.every(Number.isInteger)&&
   Number.isFinite(actual.load)&&Number.isFinite(actual.maxEquipLoad)&&
   Object.values(actual.negation).every(Number.isFinite);
  const actualNames=actual.selectedTokens;
  const equippedAll=actualNames.length===names.length&&
    names.every(name=>actualNames.includes(name));
  // Real v1.17 enforces Radagon Scarseal / Radagon Soreseal mutual
  // exclusion: both options can be clicked but the second is not kept.
  const mutuallyExclusive=index===5&&actualNames.length===1&&
    actualNames[0]===names[0]&&actual.stats.join(',')==='13,10,13,13,13,10,10,10';
  const valid=sourceConsistent&&(equippedAll||mutuallyExclusive);
  rows.push({index,names,baseline,clicks,actual,valid,
   acceptedAll:equippedAll,mutuallyExclusive,actualSelectedNames:actualNames});
  if(!valid)throw Error('Refuse to certify incomplete browser selection '+index+
    ': '+JSON.stringify(rows.at(-1)).slice(0,1600));
 }
 await mkdir(resolve('.audit'),{recursive:true});
 const result={pass,shard,reference:'Actual public Tarnished.dev v1.17 Build Planner',rows};
 await writeFile(resolve('.audit/v117-talisman-combo-'+shard+'-pass-'+pass+'.json'),
  JSON.stringify(result,null,2)+'\n');
 console.log('[V117 MULTI TALISMAN REAL] '+JSON.stringify(result));
}
try{await main()}finally{
 try{socket?.close()}catch{}try{chrome?.kill('SIGTERM')}catch{}
 await sleep(250);if(chrome?.exitCode===null)try{chrome.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
