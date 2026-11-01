#!/usr/bin/env node
/** Match actual selected armor one piece at a time against live v1.17 Build.
 * No claim all armor verified; preservation of direct UI goldens ONLY.
 */
import {spawn} from 'node:child_process';
import {readFile,mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {waitForChromePage} from './browser-cdp-startup.mjs';
const armor=[
 {slot:'Equipped Helmet',name:'All-knowing Helm'},
 {slot:'Equipped Chest',name:'All-knowing Armor'},
 {slot:'Equipped Gauntlets',name:'All-knowing Gauntlets'},
 {slot:'Equipped Legs',name:'All-knowing Greaves'}
];
const cpath=['/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/google-chrome-stable'].find(existsSync);
if(!cpath)throw Error('Real Chromium browser required');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let proc,profile,ws,id=0;const pending=new Map();
async function send(method,params={}){
 const n=++id;return new Promise((res,rej)=>{
  const timer=setTimeout(()=>{pending.delete(n);rej(Error(method+' timed out'));},16000);
  pending.set(n,{res,rej,timer});ws.send(JSON.stringify({id:n,method,params}));
 });
}
async function evalFn(fn,args=[]){
 const r=await send('Runtime.evaluate',{expression:'('+fn.toString()+')('+args.map(JSON.stringify).join(',')+')',
  returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error(r.exceptionDetails.text);
 return r.result?.value;
}
function normalizeName(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');}
function snap(){
 const t=document.body?.innerText||'';
 const get=id=>String(document.getElementById(id)?.value??'');
 const loadRaw=get('Equip Load');
 const poise=get('Poise');
 const load=/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/.exec(loadRaw);
 return {version:(t.match(/Elden Ring Version:[^\n]*/)||[])[0]||'',
  url:location.href,loadRaw,load:load?Number(load[1]):null,
  maxLoad:load?Number(load[2]):null,
  poise:/^\d+(?:\.\d+)?$/.test(poise)?Number(poise):null,
  finalStats:['strength','dexterity','intelligence','faith','arcane','smithinglevel','somberlevel']
   .map(x=>get(x)),
  rune:document.getElementById('activate-rune')?.checked,
  physick:document.getElementById('activate-physick')?.checked,
  armorLabels:[...document.querySelectorAll('.p-dropdown')]
   .filter(x=>/^Equipped (Helmet|Chest|Gauntlets|Legs)(?:\n|$)/.test(x.parentElement?.innerText?.trim()||''))
   .map(x=>({context:x.parentElement?.innerText?.trim()?.slice(0,140),
    label:x.querySelector('.p-dropdown-label')?.textContent?.trim()}))
 };
}
async function clickArmor(slot,name){
 const dropdown=[...document.querySelectorAll('.p-dropdown')]
  .find(x=>x.parentElement?.innerText?.trim()?.startsWith(slot+'\n'));
 if(!dropdown)return {status:'NO_DROPDOWN',slot,
  candidates:[...document.querySelectorAll('.p-dropdown')].map(x=>x.parentElement?.innerText?.trim()?.slice(0,38)).filter(Boolean).slice(0,30)};
 (dropdown.querySelector('.p-dropdown-trigger')||dropdown).click();
 await new Promise(res=>setTimeout(res,300));
 let options=[...document.querySelectorAll('[role="option"],.p-dropdown-item')]
  .filter(x=>x.offsetParent!==null);
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 let option=options.find(x=>norm(x.textContent)===norm(name));
 if(!option){
  const filter=document.querySelector('.p-dropdown-filter');
  if(filter){
   const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
   setter?.call(filter,name);filter.dispatchEvent(new Event('input',{bubbles:true}));
   await new Promise(res=>setTimeout(res,280));
   options=[...document.querySelectorAll('[role="option"],.p-dropdown-item')]
    .filter(x=>x.offsetParent!==null);
   option=options.find(x=>norm(x.textContent)===norm(name));
  }
 }
 if(!option)return {status:'NO_VISIBLE_OPTION',slot,name,
   firstOptions:options.slice(0,18).map(x=>x.textContent?.trim())};
 option.click();await new Promise(res=>setTimeout(res,450));
 const label=dropdown.querySelector('.p-dropdown-label')?.textContent?.trim()||null;
 return {status:norm(label)===norm(name)?'SELECTED_EXACT':'LABEL_DIFFERENT',slot,name,label};
}
async function main(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-armor-compare-'));
 proc=spawn(cpath,['--headless=new','--no-sandbox','--disable-gpu','--no-first-run',
  '--disable-dev-shm-usage','--disable-extensions','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',
  '--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const ep=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>proc.exitCode!==null?'Chrome exited '+proc.exitCode:null});
 ws=new WebSocket(ep);
 await new Promise((res,rej)=>{
  const timer=setTimeout(()=>rej(Error('CDP open timeout')),10000);
  ws.addEventListener('open',()=>{clearTimeout(timer);res()},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(timer);rej(Error('CDP connection failure'))},{once:true});
 });
 ws.addEventListener('message',event=>{
  const m=JSON.parse(event.data),p=pending.get(m.id);if(!p)return;
  pending.delete(m.id);clearTimeout(p.timer);
  if(m.error)p.rej(Error(m.error.message));else p.res(m.result);
 });
 await send('Page.enable');await send('Runtime.enable');
 const rows=[];
 for(const c of armor){
  try{
   await send('Page.navigate',{url:'https://www.tarnished.dev/build-planner?'+new URLSearchParams({
    str:'10',dex:'10',int:'10',fai:'10',arc:'10',smith:'0',somber:'0',twoHanded:'false'
   })});
   await sleep(2700);
   const baseline=await evalFn(snap);
   const selection=await evalFn(clickArmor,[c.slot,c.name]);
   const selected=await evalFn(snap);
   const conditions=baseline.version==='Elden Ring Version: v1.17'&&
    selected.version===baseline.version&&selection.status==='SELECTED_EXACT'&&
    baseline.load===0&&baseline.poise===0&&
    selected.finalStats.every((x,i)=>x===['10','10','10','10','10','0','0'][i])&&
    baseline.maxLoad===selected.maxLoad&&selected.rune===false&&selected.physick===false&&
    Number.isFinite(selected.load)&&Number.isFinite(selected.poise);
   const row={slot:c.slot,name:c.name,selection,valid:conditions,
    version:selected.version,baseline:{load:baseline.load,poise:baseline.poise,maxLoad:baseline.maxLoad},
    display:{load:selected.load,poise:selected.poise,maxLoad:selected.maxLoad,
     armorLabels:selected.armorLabels}};
   rows.push(row);
   console.log('[TARNISHED ARMOR PIECE] '+JSON.stringify(row));
  }catch(e){let row={slot:c.slot,name:c.name,valid:false,error:String(e.message).slice(0,220)};
   rows.push(row);console.log('[TARNISHED ARMOR PIECE] '+JSON.stringify(row));}
 }
 const summary={expected:4,verified:rows.filter(x=>x.valid).length,
  unknown:rows.filter(x=>!x.valid).map(x=>x.name)};
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-armor-four-piece-site.json'),
  JSON.stringify({site:'Tarnished.dev real public v1.17 build-planner',rows,summary},null,2)+'\n');
 console.log('[TARNISHED ARMOR PIECE SUMMARY] '+JSON.stringify(summary));
 if(rows.length!==4||summary.verified===0)throw Error('No site armor data independently observed — do not claim parity');
}
try{await main()}finally{
 try{ws?.close()}catch{}try{proc?.kill('SIGTERM')}catch{}
 await sleep(250);if(proc?.exitCode===null)try{proc.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
