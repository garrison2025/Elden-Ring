#!/usr/bin/env node
/** Two independent real public v1.17 readouts are needed before AR acceptance.
 * This probe itself stores no pinned-source calculated answers.
 */
import {spawn} from 'node:child_process';
import {readFile,mkdtemp,mkdir,rm,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {waitForChromePage} from './browser-cdp-startup.mjs';
import {getBroadArShard} from './tarnished-v117-broad-ar-30-candidates.mjs';
const shard=Number(process.env.TARNISHED_BROAD_AR_SHARD);
const cases=getBroadArShard(shard);
const binary=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!binary)throw Error('Real Chromium required');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let chrome,profile,socket,id=0;const pending=new Map();
async function send(method,params={}){
 const n=++id;return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{pending.delete(n);reject(Error(method+' timed out'));},20000);
  pending.set(n,{resolve,reject,timeout});
  socket.send(JSON.stringify({id:n,method,params}));
 });
}
async function evaluate(){
 const reply=await send('Runtime.evaluate',{expression:'('+snapshot.toString()+')()',returnByValue:true,awaitPromise:true});
 if(reply.exceptionDetails)throw Error(reply.exceptionDetails.text);
 return reply.result?.value;
}
function snapshot(){
 const text=document.body?.innerText||'';
 const n=text.indexOf('Equipped Right Hand 1');
 const after=n<0?'':text.slice(n+1);
 const k=after.search(/\nEquipped (?:Right|Left) Hand [123]/);
 const block=n<0?'':text.slice(n,k<0?n+950:n+1+k);
 const fields=['strength','dexterity','intelligence','faith','arcane','smithinglevel','somberlevel']
 .map(x=>String(document.getElementById(x)?.value??''));
 const flags=['twohand','activate-rune','activate-physick'].map(x=>document.getElementById(x)?.checked);
 const ar=block.match(/Total AR\s*:\s*(\d+)/);
 return {version:(text.match(/Elden Ring Version:[^\n]*/)||[])[0]||'',
  url:location.href,block:block.slice(0,600),fields,flags,ar:ar?Number(ar[1]):null};
}
async function main(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-broad-ar-'));
 chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',
  '--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const endpoint=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>chrome.exitCode!==null?'Chrome exited '+chrome.exitCode:null});
 socket=new WebSocket(endpoint);
 await new Promise((res,rej)=>{
  const timer=setTimeout(()=>rej(Error('CDP open timeout')),12000);
  socket.addEventListener('open',()=>{clearTimeout(timer);res()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(timer);rej(Error('CDP error'))},{once:true});
 });
 socket.addEventListener('message',e=>{
  const j=JSON.parse(e.data),p=pending.get(j.id);
  if(!p)return;pending.delete(j.id);clearTimeout(p.timeout);
  if(j.error)p.reject(Error(j.error.message));else p.resolve(j.result);
 });
 await send('Page.enable');await send('Runtime.enable');
 const results=[];
 for(const c of cases){
  try{
   const params=new URLSearchParams({str:String(c.str),dex:String(c.dex),int:String(c.int),
    fai:String(c.fai),arc:String(c.arc),rh1:c.weaponName,aRh1:c.affinity,
    smith:String(c.somber?0:c.upgrade),somber:String(c.somber?c.upgrade:0),
    twoHanded:String(c.twoHanded)});
   await send('Page.navigate',{url:'https://www.tarnished.dev/build-planner?'+params});
   await sleep(2750);
   let x=await evaluate();
   if(x.version!=='Elden Ring Version: v1.17'||!x.block.includes('\n'+c.weaponName+'\n')){
    await sleep(2000);x=await evaluate();
   }
   const fields=[c.str,c.dex,c.int,c.fai,c.arc,c.somber?0:c.upgrade,c.somber?c.upgrade:0].map(String);
   const valid=x.version==='Elden Ring Version: v1.17'&&
    new URL(x.url).hostname==='www.tarnished.dev'&&new URL(x.url).pathname==='/build-planner'&&
    x.block.includes('\n'+c.weaponName+'\n')&&x.block.includes('\n'+c.affinity+'\n')&&
    fields.every((v,i)=>v===x.fields[i])&&x.flags[0]===c.twoHanded&&
    x.flags[1]===false&&x.flags[2]===false&&Number.isInteger(x.ar);
   const row={id:c.id,request:c,publicAr:valid?x.ar:null,
    verifiedInputs:valid,version:x.version,
    status:valid?'DIRECT_AR_OBSERVED':'NOT_OBSERVED',
    controls:x.fields,flags:x.flags,siteBlock:x.block};
   results.push(row);
   console.log('[BROAD AR SITE] '+JSON.stringify(row));
  }catch(e){
   const row={id:c.id,request:c,publicAr:null,verifiedInputs:false,
    status:'ERROR',reason:String(e.message).slice(0,180)};
   results.push(row);console.log('[BROAD AR SITE] '+JSON.stringify(row));
  }
 }
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/v117-broad-ar-site-'+shard+'.json'),
  JSON.stringify({source:'Tarnished.dev public v1.17 rendered UI',shard,rows:results},null,2)+'\n');
 console.log('[BROAD AR SITE SUMMARY] '+JSON.stringify({shard,total:results.length,
  verified:results.filter(x=>x.verifiedInputs).length,
  unavailable:results.filter(x=>!x.verifiedInputs).map(x=>x.id)}));
 if(results.length!==6)throw Error('Missing planned cases');
}
try{await main()}finally{
 try{socket?.close()}catch{}try{chrome?.kill('SIGTERM')}catch{}
 await sleep(300);if(chrome?.exitCode===null)try{chrome.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
