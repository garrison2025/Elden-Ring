#!/usr/bin/env node
/** Read-only public v1.17 control experiment: can a valid lower-STR origin
 * make the site's previously hidden Club minimum Req appear? No inference.
 */
import {spawn} from 'node:child_process';
import {readFile,mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {waitForChromePage} from './browser-cdp-startup.mjs';
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chrome)throw Error('Chromium not available');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let proc,profile,socket,id=0;const pending=new Map();
async function send(method,params={}){
 const current=++id;return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{pending.delete(current);reject(Error(method+' timeout'));},15000);
  pending.set(current,{resolve,reject,timeout});
  socket.send(JSON.stringify({id:current,method,params}));
 });
}
async function evaluate(fn){
 const r=await send('Runtime.evaluate',{expression:'('+fn.toString()+')()',returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error(r.exceptionDetails.text);
 return r.result?.value;
}
function inspect(){
 const body=document.body?.innerText||'';
 const slots=[...document.querySelectorAll('select')].map(s=>({
  id:s.id||'',name:s.name||'',selected:s.selectedOptions?.[0]?.textContent?.trim()||'',
  choices:[...s.options].slice(0,20).map(o=>(o.textContent||'').trim())
 }));
 const origin=slots.find(x=>x.choices.includes('Astrologer')&&x.choices.includes('Wretch'));
 const p=body.indexOf('Equipped Right Hand 1');
 const block=p<0?'':body.slice(p,p+750).split(/\nEquipped (?:Left|Right) Hand [123]/)[0];
 return {version:(body.match(/Elden Ring Version:[^\n]*/i)||[])[0]||'',
  url:location.href,origin:origin||null,
  stats:['vigor','mind','endurance','strength','dexterity','intelligence','faith','arcane'].map(k=>({id:k,value:document.getElementById(k)?.value??null})),
  selectedWeaponText:block,
  hasReq:/\bReq:\s*\d+\/\d+\/\d+\/\d+\/\d+/.test(block)};
}
function chooseAstrologer(){
 const select=[...document.querySelectorAll('select')].find(s=>
  [...s.options].some(o=>(o.textContent||'').trim()==='Astrologer')&&
  [...s.options].some(o=>(o.textContent||'').trim()==='Wretch'));
 if(!select)return {status:'NO_ORIGIN_SELECT',sample:[...document.querySelectorAll('select')].slice(0,4).map(s=>s.outerHTML.slice(0,450))};
 const item=[...select.options].find(o=>(o.textContent||'').trim()==='Astrologer');
 Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(select,item.value);
 select.dispatchEvent(new Event('input',{bubbles:true}));
 select.dispatchEvent(new Event('change',{bubbles:true}));
 return {status:'SELECT_DISPATCHED',selected:select.selectedOptions?.[0]?.textContent?.trim(),value:select.value};
}
function lowerStrength(){
 const input=document.getElementById('strength');
 if(!input)return {status:'NO_STRENGTH_INPUT'};
 Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'8');
 input.dispatchEvent(new Event('input',{bubbles:true}));
 input.dispatchEvent(new Event('change',{bubbles:true}));
 return {status:'INPUT_DISPATCHED',value:input.value};
}
async function main(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-origin-req-'));
 proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-extensions',
  '--no-first-run','--disable-background-networking','--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],
  {stdio:['ignore','ignore','pipe']});
 const endpoint=await waitForChromePage({profile,readText:readFile,request:fetch,getExitReason:()=>proc.exitCode!==null?'Exited '+proc.exitCode:null});
 socket=new WebSocket(endpoint);
 await new Promise((resolve,reject)=>{
  const to=setTimeout(()=>reject(Error('CDP connection timeout')),10000);
  socket.addEventListener('open',()=>{clearTimeout(to);resolve()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(to);reject(Error('CDP socket error'))},{once:true});
 });
 socket.addEventListener('message',e=>{
  const j=JSON.parse(e.data),v=pending.get(j.id);if(!v)return;
  pending.delete(j.id);clearTimeout(v.timeout);
  if(j.error)v.reject(Error(j.error.message));else v.resolve(j.result);
 });
 await send('Page.enable');await send('Runtime.enable');
 const params=new URLSearchParams({rh1:'Club',aRh1:'Standard',str:'10',dex:'10',int:'10',
  fai:'10',arc:'10',smith:'0',somber:'0',twoHanded:'false'});
 await send('Page.navigate',{url:'https://www.tarnished.dev/build-planner?'+params});
 await sleep(2500);
 const before=await evaluate(inspect);
 const action=await evaluate(chooseAstrologer);
 await sleep(1300);
 const afterOrigin=await evaluate(inspect);
 const lower=await evaluate(lowerStrength);
 await sleep(1300);
 const afterStrength=await evaluate(inspect);
 const report={scope:'Read-only class-switch viability pilot; NOT a verified direct Req record',
  before,action,afterOrigin,lower,afterStrength};
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/origin-req-pilot.json'),JSON.stringify(report,null,2)+'\n');
 console.log('[ORIGIN REQ PILOT] '+JSON.stringify(report));
 if(before.version!=='Elden Ring Version: v1.17')throw Error('Public comparator version mismatch; no evidence accepted');
}
try{await main()}finally{
 try{socket?.close()}catch{}
 try{proc?.kill('SIGTERM')}catch{}
 await sleep(200);
 if(proc?.exitCode===null)try{proc.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
