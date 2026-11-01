#!/usr/bin/env node
/** Read-only public v1.17 visible DOM probe. No inferred Req/weight facts. */
import {spawn} from 'node:child_process';
import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {existsSync} from 'node:fs';
import {waitForChromePage} from './browser-cdp-startup.mjs';

const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chrome)throw Error('Chromium is required to inspect public rendered site');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const cases=[
 {name:'Great Épée',aliases:['Great Epee','Great Épée','Great Epée','Great EPEE'],affinities:['Standard','None']},
 {name:'Serpent-hunter',aliases:['Serpent-Hunter','Serpent-hunter'],affinities:['None']},
 {name:'Steel-wire Torch',aliases:['Steel-Wire Torch','Steel-wire Torch'],affinities:['None']}
];
let chromeProc,profile,socket,serial=0;
const pending=new Map();
async function send(method,params={}){
 return new Promise((resolve,reject)=>{
  const id=++serial;
  const timer=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'));},16000);
  pending.set(id,{resolve,reject,timer});
  socket.send(JSON.stringify({id,method,params}));
 });
}
async function evalPage(expression){
 const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error('Browser evaluation failed: '+r.exceptionDetails.text);
 return r.result?.value;
}
function snap(){
 const body=document.body?.innerText||'';
 const start=body.indexOf('Equipped Right Hand 1');
 const tail=start<0?'':body.slice(start+1);
 const end=tail.search(/\nEquipped (?:Right|Left) Hand [123]/);
 const block=start<0?'':body.slice(start,end>=0?start+1+end:start+700);
 const req=block.match(/\bReq:\s*(\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)/);
 const ar=block.match(/Total AR\s*:\s*(\d+)/);
 const dropdowns=[...document.querySelectorAll('.p-dropdown')].filter(x=>
  /weapon|hand|rh1|great|torch/i.test(x.id+' '+(x.getAttribute('aria-label')||'')+' '+(x.textContent||''))).
  slice(0,12).map(x=>({id:x.id||'',label:x.querySelector('.p-dropdown-label')?.textContent?.trim()||'',
   text:(x.textContent||'').slice(0,115)}));
 return {url:location.href,version:(body.match(/Elden Ring Version:[^\n]*/)||[])[0]||'',
  controls:['strength','dexterity','intelligence','faith','arcane','smithinglevel','somberlevel'].map(id=>document.getElementById(id)?.value??null),
  twoHanded:document.getElementById('twohand')?.checked,
  rune:document.getElementById('activate-rune')?.checked,
  physick:document.getElementById('activate-physick')?.checked,
  block:block.slice(0,450),req:req?.slice(1).map(Number)||null,
  ar:ar?Number(ar[1]):null,dropdowns};
}
async function main(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-last-three-'));
 chromeProc=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--disable-extensions','--no-first-run','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',
  '--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const endpoint=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>chromeProc.exitCode!==null?'Chrome exited '+chromeProc.exitCode:null});
 socket=new WebSocket(endpoint);
 await new Promise((res,rej)=>{
  const timer=setTimeout(()=>rej(Error('CDP opening timed out')),10000);
  socket.addEventListener('open',()=>{clearTimeout(timer);res()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(timer);rej(Error('CDP open error'))},{once:true});
 });
 socket.addEventListener('message',event=>{
  const msg=JSON.parse(event.data),p=pending.get(msg.id);
  if(!p)return;pending.delete(msg.id);clearTimeout(p.timer);
  if(msg.error)p.reject(Error(msg.error.message));else p.resolve(msg.result);
 });
 await send('Page.enable');await send('Runtime.enable');
 const rows=[];
 for(const c of cases){
  for(const stats of [10,99]){
   let best=null,attempts=[];
   const aliases=stats===10?c.aliases:c.aliases.slice(0,2);
   for(const name of aliases){
    for(const affinity of c.affinities){
     const params=new URLSearchParams({rh1:name,aRh1:affinity,
      str:String(stats),dex:String(stats),int:String(stats),fai:String(stats),arc:String(stats),
      smith:'0',somber:'0',twoHanded:'false'});
     try{
      await send('Page.navigate',{url:'https://www.tarnished.dev/build-planner?'+params});
      await sleep(2100);
      let s=await evalPage('('+snap.toString()+')()');
      if(!s.version.includes('v1.17')){await sleep(1700);s=await evalPage('('+snap.toString()+')()');}
      const valid= s.version==='Elden Ring Version: v1.17' &&
       new URL(s.url).hostname==='www.tarnished.dev'&&
       new URL(s.url).pathname==='/build-planner'&&
       s.controls.every((v,i)=>v===String(i<5?stats:0))&&
       s.twoHanded===false&&s.rune===false&&s.physick===false;
      const active=s.block.includes('\n'+name+'\n')&&s.block.includes('\n'+affinity+'\n');
      const row={name:c.name,attemptedName:name,affinity,stats,valid,active,
       status:!valid?'INVALID_INPUT':!active?'NOT_ACTIVATED':
        s.req?'DIRECT_REQ_RENDERED':s.ar!==null?'ACTIVATED_REQ_HIDDEN':'ACTIVATED_NO_NUMERIC_FIELD',
       observedReq:valid&&active?s.req:null,observedAr:valid&&active?s.ar:null,
       screenshotNotTaken:true,siteVersion:s.version,
       controls:s.controls,block:s.block,dropdowns:s.dropdowns};
      attempts.push(row);
      console.log('[LAST THREE ATTEMPT] '+JSON.stringify(row));
      if(valid&&active){best=row;break;}
     }catch(e){attempts.push({name:c.name,attemptedName:name,affinity,stats,status:'ERROR',
      error:String(e.message).slice(0,150)});}
    }
    if(best)break;
   }
   rows.push({name:c.name,stats,best,attempts});
  }
 }
 const report={source:'real public Tarnished.dev v1.17 rendered Build Planner',
  scope:'Public weapon activation and displayed fields only; not inferred from AR or community/pinned sources',
  cases:rows};
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-last-three-selection.json'),JSON.stringify(report,null,2)+'\n');
 console.log('[LAST THREE SUMMARY] '+JSON.stringify(rows.map(x=>({name:x.name,stats:x.stats,
  status:x.best?.status??'NOT_OBSERVED',requirements:x.best?.observedReq??null,ar:x.best?.observedAr??null}))));
}
try{await main()}finally{
 try{socket?.close()}catch{}
 try{chromeProc?.kill('SIGTERM')}catch{}
 await sleep(250);
 if(chromeProc?.exitCode===null)try{chromeProc.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
