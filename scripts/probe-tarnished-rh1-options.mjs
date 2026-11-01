#!/usr/bin/env node
/** Inspect the actual visible RH1 dropdown list on public v1.17. No scraping protected APIs. */
import {spawn} from 'node:child_process';
import {readFile,mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {waitForChromePage} from './browser-cdp-startup.mjs';
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chrome)throw Error('No installed Chromium');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let proc,profile,socket,nextId=0;const pending=new Map();
async function send(method,params={}){
 const id=++nextId;return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP '+method+' timeout'));},15000);
  pending.set(id,{resolve,reject,timer});
  socket.send(JSON.stringify({id,method,params}));
 });
}
async function evalPage(fn){
 const r=await send('Runtime.evaluate',{expression:'('+fn.toString()+')()',returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error(r.exceptionDetails.text);
 return r.result?.value;
}
async function inspect(){
 const body=document.body?.innerText||'';
 const rh1Label=document.querySelector('label[for="RH1"]');
 const widget=rh1Label?.nextElementSibling;
 const trigger=widget?.querySelector('.p-dropdown-trigger');
 const head={version:(body.match(/Elden Ring Version:[^\n]*/)||[])[0]||'',
  labelFound:!!rh1Label,widgetMarkup:widget?.outerHTML.slice(0,1100)||null,
  triggerFound:!!trigger};
 if(!trigger)return {...head,status:'NO_VISIBLE_RH1_TRIGGER'};
 trigger.click();await new Promise(r=>setTimeout(r,400));
 const getOptionInfo=()=>[...document.querySelectorAll('[role="option"]')].map(x=>({
  text:(x.textContent||'').trim(),id:x.id||'',value:x.getAttribute('data-pc-section')||''
 }));
 const visible=getOptionInfo();
 const filter=document.querySelector('.p-dropdown-filter');
 const before={totalLoaded:visible.length,samples:visible.slice(0,12),
  matches:visible.filter(x=>/epee|épée|serpent|torch/i.test(x.text)).slice(0,35),
  filterFound:!!filter,panelText:document.querySelector('.p-dropdown-panel')?.innerText.slice(0,500)||''};
 let after=null;
 if(filter){
  const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
  set.call(filter,'Epee');filter.dispatchEvent(new Event('input',{bubbles:true}));
  await new Promise(r=>setTimeout(r,500));
  const results=getOptionInfo();
  after={totalLoaded:results.length,samples:results.slice(0,35),
   filterValue:filter.value,panelText:document.querySelector('.p-dropdown-panel')?.innerText.slice(0,500)||''};
 }
 return {...head,before,after,status:'PUBLIC_RH1_OPTIONS_INSPECTED'};
}
async function main(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-option-'));
 proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',
  '--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const endpoint=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>proc.exitCode!==null?'Exited '+proc.exitCode:null});
 socket=new WebSocket(endpoint);
 await new Promise((res,rej)=>{let timer=setTimeout(()=>rej(Error('CDP connection timeout')),10000);
  socket.addEventListener('open',()=>{clearTimeout(timer);res()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(timer);rej(Error('CDP connection error'))},{once:true});
 });
 socket.addEventListener('message',e=>{
  const m=JSON.parse(e.data),p=pending.get(m.id);if(!p)return;
  pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result);
 });
 await send('Page.enable');await send('Runtime.enable');
 const params=new URLSearchParams({str:'10',dex:'10',int:'10',fai:'10',arc:'10',
  rh1:'Longsword',aRh1:'Standard',smith:'0',somber:'0',twoHanded:'false'});
 await send('Page.navigate',{url:'https://www.tarnished.dev/build-planner?'+params});
 await sleep(2300);
 const result=await evalPage(inspect);
 console.log('[GREAT EPEE RH1 OPTIONS] '+JSON.stringify(result));
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-rh1-options.json'),JSON.stringify(result,null,2)+'\n');
 if(result.version!=='Elden Ring Version: v1.17')throw Error('Wrong website version');
}
try{await main()}finally{
 try{socket?.close()}catch{}
 try{proc?.kill('SIGTERM')}catch{}
 await sleep(250);
 if(proc?.exitCode===null)try{proc.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
