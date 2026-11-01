#!/usr/bin/env node
/** Tarnished.dev is the SOLE numeric comparator. Read visible real UI.
 * This is a feature/schema inventory, not invented armor/spell goldens.
 */
import {spawn} from 'node:child_process';
import {readFile,mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {waitForChromePage} from './browser-cdp-startup.mjs';

const routes=['build-planner','weapon-calculator','armor-optimizer','damage-calculator'];
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable',
 '/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chrome)throw Error('Real Chrome needed to read public site.');
let proc,profile,ws,id=0;const pending=new Map(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function send(method,params={}){
 const n=++id;return new Promise((yes,no)=>{
  const timer=setTimeout(()=>{pending.delete(n);no(Error(method+' timeout'));},15000);
  pending.set(n,{yes,no,timer});ws.send(JSON.stringify({id:n,method,params}));
 });
}
function snapshot(){
 const t=document.body?.innerText||'';
 const textOf=s=>[...document.querySelectorAll(s)].map(x=>x.textContent.trim()).filter(Boolean);
 return {url:location.href,title:document.title,
  heading:textOf('h1').slice(0,2),
  gameVersion:(t.match(/Elden Ring Version:[^\n]*/)||[])[0]||'NOT DISPLAYED',
  headings:textOf('h2,h3').slice(0,35),
  inputs:[...document.querySelectorAll('input')].filter(e=>e.offsetParent!==null).
   map(e=>({id:e.id||null,placeholder:e.getAttribute('placeholder')||null,
    type:e.type||null})).slice(0,100),
  visibleDropdowns:[...document.querySelectorAll('[role="combobox"]')].filter(e=>e.offsetParent!==null).
   map(e=>({id:e.id||null,ariaLabel:e.getAttribute('aria-label')||null,
    nearby:e.parentElement?.parentElement?.textContent?.trim()?.slice(0,75)||null})).slice(0,35),
  buttonLabels:textOf('button').slice(0,55),
  visibleWords:['Weapon','Armor','Talismans','Spells','Damage Calculator',
   'Enemy','Defense','Poise','Spell Buff','Great Rune','Active Effects',
   'Physick','Minimums','Multipliers'].filter(x=>t.includes(x)),
  textLength:t.length};
}
async function main(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-feature-audit-'));
 proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu',
  '--disable-dev-shm-usage','--disable-extensions','--no-first-run',
  '--disable-background-networking','--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=0','--remote-allow-origins=*',
  '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const ep=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>proc.exitCode!==null?'Chrome exited '+proc.exitCode:null});
 ws=new WebSocket(ep);
 await new Promise((yes,no)=>{const timer=setTimeout(()=>no(Error('CDP open')),12000);
  ws.addEventListener('open',()=>{clearTimeout(timer);yes()},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(timer);no(Error('CDP error'))},{once:true});
 });
 ws.addEventListener('message',event=>{
  const m=JSON.parse(event.data),p=pending.get(m.id);
  if(!p)return;pending.delete(m.id);clearTimeout(p.timer);
  if(m.error)p.no(Error(m.error.message));else p.yes(m.result);
 });
 await send('Page.enable');await send('Runtime.enable');
 const out=[];
 for(const route of routes){
  try{
   await send('Page.navigate',{url:'https://www.tarnished.dev/'+route});
   await sleep(2800);
   let v=await send('Runtime.evaluate',{expression:'('+snapshot.toString()+')()',
    awaitPromise:true,returnByValue:true});
   let row=v.result?.value;
   if(!row?.heading?.length||row.gameVersion==='NOT DISPLAYED'){
    await sleep(1600);v=await send('Runtime.evaluate',{expression:'('+snapshot.toString()+')()',
     awaitPromise:true,returnByValue:true});row=v.result?.value;
   }
   if(v.exceptionDetails)throw Error(v.exceptionDetails.text);
   out.push({route,...row});
   console.log('[TARNISHED SOLE BASELINE UI] '+JSON.stringify({route,version:row.gameVersion,
    heading:row.heading,inputCount:row.inputs.length,dropdownCount:row.visibleDropdowns.length,
    buttons:row.buttonLabels.slice(0,14),words:row.visibleWords,
    inputIds:row.inputs.filter(x=>x.id).map(x=>x.id),
    dropdownContexts:row.visibleDropdowns.map(x=>x.nearby).slice(0,18)}));
  }catch(e){out.push({route,error:String(e.message).slice(0,180)});
   console.log('[TARNISHED SOLE BASELINE ERROR] '+route+': '+String(e.message));}
 }
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-live-feature-scope.json'),
  JSON.stringify({site:'Tarnished.dev real public UI',rows:out},null,2)+'\n');
 const status={total:routes.length,rendered:out.filter(r=>!r.error&&
  r.heading?.length&&r.url?.startsWith('https://www.tarnished.dev/')).length,
  versions:out.map(r=>r.gameVersion||'ERROR'),routes};
 console.log('[TARNISHED SOLE BASELINE SUMMARY] '+JSON.stringify(status));
 if(status.rendered!==4)throw Error('All four public calculator pages must really render');
}
try{await main()}finally{
 try{ws?.close()}catch{}try{proc?.kill('SIGTERM')}catch{}
 await sleep(300);if(proc?.exitCode===null)try{proc.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
