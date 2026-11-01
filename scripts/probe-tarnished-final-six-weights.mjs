#!/usr/bin/env node
/** Actual public v1.17 six unresolved item weight verification, including zero.
 * No DOM source inference; no >0 item-load acceptance shortcut.
 */
import {spawn} from 'node:child_process';
import {readFile,mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {waitForChromePage} from './browser-cdp-startup.mjs';
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chrome)throw Error('Requires real Chrome');
const items=[
 {name:'Cipher Pata',siteNames:['Cipher Pata'],affinities:['None','Standard']},
 {name:'Dragon Communion Seal',siteNames:['Dragon Communion Seal'],affinities:['None']},
 {name:'Erdtree Seal',siteNames:['Erdtree Seal'],affinities:['None']},
 {name:'Frenzied Flame Seal',siteNames:['Frenzied Flame Seal'],affinities:['None']},
 {name:'Golden Order Seal',siteNames:['Golden Order Seal'],affinities:['None']},
 {name:'Great Épée',siteNames:['Great epee'],affinities:['Standard']}
];
const delay=ms=>new Promise(f=>setTimeout(f,ms));let proc,profile,ws,id=0;
const pending=new Map();
async function send(method,params={}){
 const next=++id;
 return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{pending.delete(next);reject(Error(method+' timeout'));},16000);
  pending.set(next,{resolve,reject,timeout});
  ws.send(JSON.stringify({id:next,method,params}));
 });
}
async function evaluate(){
 const x=await send('Runtime.evaluate',{expression:'('+snapshot.toString()+')()',returnByValue:true,awaitPromise:true});
 if(x.exceptionDetails)throw Error(x.exceptionDetails.text);
 return x.result?.value;
}
function snapshot(){
 const body=document.body?.innerText||'';
 const from=body.indexOf('Equipped Right Hand 1');
 const tail=from<0?'':body.slice(from+1);
 const n=tail.search(/\nEquipped (?:Right|Left) Hand [123]/);
 const block=from<0?'':body.slice(from,n<0?from+600:from+1+n);
 const input=document.getElementById('Equip Load');
 const loadRaw=String(input?.value??'');
 const parts=loadRaw.split(' / ');
 const parse=x=>/^\d+(?:\.\d+)?$/.test(x)?Number(x):null;
 const load=parts.length===2?parse(parts[0]):null;
 const cap=parts.length===2?parse(parts[1].split(' ')[0]):null;
 return {version:(body.match(/Elden Ring Version:[^\n]*/)||[])[0]||'',
  url:location.href,block:block.slice(0,400),loadRaw,load,cap,
  controls:['strength','dexterity','intelligence','faith','arcane','smithinglevel','somberlevel'].map(k=>document.getElementById(k)?.value??null),
  twoHanded:document.getElementById('twohand')?.checked,
  rune:document.getElementById('activate-rune')?.checked,
  physick:document.getElementById('activate-physick')?.checked};
}
const inputs=[99,99,99,99,99,0,0];
const baseValid=s=>s.version==='Elden Ring Version: v1.17'&&
 new URL(s.url).hostname==='www.tarnished.dev'&&
 new URL(s.url).pathname==='/build-planner'&&
 s.controls.length===7&&s.controls.every((x,i)=>x===String(inputs[i]))&&
 s.twoHanded===false&&s.rune===false&&s.physick===false&&
 Number.isFinite(s.load)&&Number.isFinite(s.cap);
async function observe(name,affinity){
 const params=new URLSearchParams({str:'99',dex:'99',int:'99',fai:'99',arc:'99',smith:'0',somber:'0',twoHanded:'false'});
 if(name){params.set('rh1',name);params.set('aRh1',affinity);}
 await send('Page.navigate',{url:'https://www.tarnished.dev/build-planner?'+params});
 await delay(2500);
 let x=await evaluate();
 if(!baseValid(x)||name&&!x.block.includes('\n'+name+'\n')){
  await delay(1600);x=await evaluate();
 }
 const active=name?x.block.includes('\n'+name+'\n')&&x.block.includes('\n'+affinity+'\n'):x.block.includes('Select equipped weapon...');
 return {requestedName:name||null,affinity:affinity||null,validInputs:baseValid(x),active,
  itemBlock:x.block,load:x.load,cap:x.cap,loadRaw:x.loadRaw,version:x.version};
}
async function main(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-zero-weight-'));
 proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--disable-background-networking','--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const endpoint=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>proc.exitCode!==null?'Chrome exit '+proc.exitCode:null});
 ws=new WebSocket(endpoint);
 await new Promise((res,rej)=>{
  const timer=setTimeout(()=>rej(Error('CDP open timeout')),10000);
  ws.addEventListener('open',()=>{clearTimeout(timer);res()},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(timer);rej(Error('CDP connection failure'))},{once:true});
 });
 ws.addEventListener('message',e=>{
  const m=JSON.parse(e.data),p=pending.get(m.id);
  if(!p)return;pending.delete(m.id);clearTimeout(p.timeout);
  if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result);
 });
 await send('Page.enable');await send('Runtime.enable');
 const baseline=await observe(null,null);
 const control=await observe('Longsword','Standard');
 const controlValid=baseline.validInputs&&baseline.active&&baseline.load===0&&
  control.validInputs&&control.active&&control.load===3.5&&control.cap===baseline.cap;
 console.log('[WEIGHT CONTROL] '+JSON.stringify({baseline,control,controlValid}));
 if(!controlValid)throw Error('Empty 0 and known Longsword 3.5 public-site control not both verified');
 const rows=[];
 for(const c of items){
  let good=null,attempts=[];
  for(const siteName of c.siteNames){
   for(const affinity of c.affinities){
    try{
     const shot=await observe(siteName,affinity);
     const qualified=shot.validInputs&&shot.active&&shot.cap===baseline.cap&&shot.load>=0;
     const attempt={name:c.name,siteName,affinity,status:qualified?'DIRECT_WEIGHT_OBSERVED':'NOT_OBSERVED',
      weight:qualified?shot.load:null,inputsVerified:shot.validInputs,
      exactItemActivated:shot.active,loadRaw:shot.loadRaw,block:shot.itemBlock.slice(0,280)};
     attempts.push(attempt);
     console.log('[WEIGHT SIX ATTEMPT] '+JSON.stringify(attempt));
     if(qualified){good=attempt;break;}
    }catch(e){attempts.push({name:c.name,siteName,affinity,status:'ERROR',error:String(e.message).slice(0,130)});}
   }if(good)break;
  }
  const row={name:c.name,...(good??{status:'NOT_OBSERVED',weight:null}),attempts};
  rows.push(row);
  console.log('[WEIGHT SIX ROW] '+JSON.stringify({name:row.name,status:row.status,weight:row.weight??null,siteName:row.siteName??null}));
 }
 const result={site:'Tarnished.dev PUBLIC v1.17 rendered UI',actualStats:[99,99,99,99,99],
  control:{empty:baseline.load,positiveLongsword:control.load,capacity:baseline.cap,verified:controlValid},
  rows};
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-v117-weight-final-six.json'),JSON.stringify(result,null,2)+'\n');
 console.log('[WEIGHT SIX SUMMARY] '+JSON.stringify({total:rows.length,observed:rows.filter(x=>x.status==='DIRECT_WEIGHT_OBSERVED').length,
  zeroObserved:rows.filter(x=>x.status==='DIRECT_WEIGHT_OBSERVED'&&x.weight===0).length,
  missing:rows.filter(x=>x.status!=='DIRECT_WEIGHT_OBSERVED').map(x=>x.name)}));
}
try{await main()}finally{
 try{ws?.close()}catch{}
 try{proc?.kill('SIGTERM')}catch{}
 await delay(280);if(proc?.exitCode===null)try{proc.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
