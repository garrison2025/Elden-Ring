#!/usr/bin/env node
/** Opt-in, read-only: independently rendered Icerind Hatchet v1.17 AR values. */
import {spawn} from 'node:child_process';
import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {waitForChromePage} from './browser-cdp-startup.mjs';
const path=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!path)throw Error('No Chromium');
const cases=[
 ['baseline-60-60',[60,60,30,30,30]],
 ['dex59',[60,59,30,30,30]],
 ['str59',[59,60,30,30,30]],
 ['low-20-20',[20,20,10,10,10]],
 ['mid-30-30',[30,30,10,10,10]],
 ['mid-40-40',[40,40,10,10,10]],
 ['high-99',[99,99,99,99,99]],
 ['minimum-12-16',[12,16,10,10,10]]
];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let proc,profile,socket,serial=0;const pending=new Map();
async function send(method,params={}){
 const id=++serial;return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{pending.delete(id);reject(Error(method+' timed out'));},16000);
  pending.set(id,{resolve,reject,timer});
  socket.send(JSON.stringify({id,method,params}));
 });
}
async function evalPage(fn){
 const r=await send('Runtime.evaluate',{expression:'('+fn.toString()+')()',returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error('DOM runtime failure: '+r.exceptionDetails.text);
 return r.result?.value;
}
function snapshot(){
 const body=document.body?.innerText||'';
 const begin=body.indexOf('Equipped Right Hand 1');
 const tail=begin<0?'':body.slice(begin+1);
 const end=tail.search(/\nEquipped (?:Left|Right) Hand [123]/);
 const block=begin<0?'':body.slice(begin,end<0?begin+650:begin+1+end);
 const m=block.match(/Total AR\s*:\s*(\d+)/);
 return {version:(body.match(/Elden Ring Version:[^\n]*/)||[])[0]||'',url:location.href,
  block:block.slice(0,400),ar:m?Number(m[1]):null,
  stats:['strength','dexterity','intelligence','faith','arcane'].map(k=>document.getElementById(k)?.value??null),
  smith:document.getElementById('smithinglevel')?.value,
  somber:document.getElementById('somberlevel')?.value,
  twoHanded:document.getElementById('twohand')?.checked,
  rune:document.getElementById('activate-rune')?.checked,
  physick:document.getElementById('activate-physick')?.checked
 };
}
async function main(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-icerind-grid-'));
 proc=spawn(path,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--remote-allow-origins=*',
  '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const endpoint=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>proc.exitCode!==null?'Exited '+proc.exitCode:null});
 socket=new WebSocket(endpoint);
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(Error('CDP connection timed out')),10000);
  socket.addEventListener('open',()=>{clearTimeout(timer);resolve()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(timer);reject(Error('WebSocket error'))},{once:true});
 });
 socket.addEventListener('message',e=>{
  const m=JSON.parse(e.data),p=pending.get(m.id);if(!p)return;
  pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result);
 });
 await send('Page.enable');await send('Runtime.enable');
 const outputs=[];
 for(const [id,stats] of cases){
  const [str,dex,int,fai,arc]=stats;
  const params=new URLSearchParams({rh1:'Icerind Hatchet',aRh1:'None',
   str:String(str),dex:String(dex),int:String(int),fai:String(fai),arc:String(arc),
   smith:'0',somber:'0',twoHanded:'false'});
  await send('Page.navigate',{url:'https://www.tarnished.dev/build-planner?'+params});
  await sleep(2600);
  let s=await evalPage(snapshot);
  if(!s.version.includes('v1.17')||!s.block.includes('\nIcerind Hatchet\n')){
   await sleep(1800);s=await evalPage(snapshot);
  }
  const valid=s.version==='Elden Ring Version: v1.17' &&
   new URL(s.url).hostname==='www.tarnished.dev'&&new URL(s.url).pathname==='/build-planner'&&
   s.block.includes('\nIcerind Hatchet\n')&&s.block.includes('\nNone\n')&&
   s.stats.every((v,i)=>v===String(stats[i]))&&s.smith==='0'&&s.somber==='0'&&
   s.twoHanded===false&&s.rune===false&&s.physick===false;
  const row={id,stats,observedAr:valid?s.ar:null,verifiedInputs:valid&&Number.isInteger(s.ar),
   version:s.version,block:s.block,controls:{stats:s.stats,smith:s.smith,somber:s.somber,
    twoHanded:s.twoHanded,rune:s.rune,physick:s.physick}};
  outputs.push(row);console.log('[ICERIND SITE] '+JSON.stringify(row));
 }
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/icerind-v117-direct-ui.json'),JSON.stringify({source:'Public Tarnished.dev v1.17 rendered +0 AR',rows:outputs},null,2)+'\n');
 console.log('[ICERIND SITE SUMMARY] '+JSON.stringify({total:outputs.length,verified:outputs.filter(x=>x.verifiedInputs).length}));
 if(outputs.length!==8||outputs.some(x=>!x.verifiedInputs))throw Error('Not all eight public UI cases were directly observed');
}
try{await main()}finally{
 try{socket?.close()}catch{}
 try{proc?.kill('SIGTERM')}catch{}
 await sleep(300);
 if(proc?.exitCode===null)try{proc.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
