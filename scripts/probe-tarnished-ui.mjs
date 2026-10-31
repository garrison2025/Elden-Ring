#!/usr/bin/env node
/* Opt-in read-only Chrome probe of public rendered AR, no paid API or login.
 * Raw UI observation != externally benchmarked number until inputs are verified. */
import {spawn} from 'node:child_process';
import {readFile,mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {waitForChromePage} from './browser-cdp-startup.mjs';
import {V117_ADDITIONAL_UI_CANDIDATES} from './tarnished-v117-extra-candidates.mjs';
const chromePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chromePath)throw Error('GitHub runner has no Chromium');
const cases=[
 {id:'standard-40-40-0-1h',str:40,dex:40,affinity:'Standard',upgrade:0,twoHanded:false},
 {id:'standard-12-15-0-1h',str:12,dex:15,affinity:'Standard',upgrade:0,twoHanded:false},
 {id:'standard-40-40-25-1h',str:40,dex:40,affinity:'Standard',upgrade:25,twoHanded:false},
 {id:'keen-40-40-25-1h',str:40,dex:40,affinity:'Keen',upgrade:25,twoHanded:false},
 {id:'standard-40-40-0-2h',str:40,dex:40,affinity:'Standard',upgrade:0,twoHanded:true},
 {id:'longsword-standard-plus0-min',weaponName:'Longsword',str:10,dex:10,affinity:'Standard',upgrade:0,twoHanded:false},
 {id:'longsword-standard-plus25-40-40',weaponName:'Longsword',str:40,dex:40,affinity:'Standard',upgrade:25,twoHanded:false},
 {id:'longsword-heavy-plus25-60-20',weaponName:'Longsword',str:60,dex:20,affinity:'Heavy',upgrade:25,twoHanded:false},
 {id:'greatsword-standard-plus0-min',weaponName:'Greatsword',str:31,dex:12,affinity:'Standard',upgrade:0,twoHanded:false},
 {id:'greatsword-heavy-plus25-60-12',weaponName:'Greatsword',str:60,dex:12,affinity:'Heavy',upgrade:25,twoHanded:false},
 {id:'greatsword-heavy-plus25-60-12-2h',weaponName:'Greatsword',str:60,dex:12,affinity:'Heavy',upgrade:25,twoHanded:true},
 {id:'claymore-quality-plus12-30-30',weaponName:'Claymore',str:30,dex:30,affinity:'Quality',upgrade:12,twoHanded:false},
 {id:'dismounter-keen-plus25-19-72',weaponName:'Dismounter',str:19,dex:72,affinity:'Keen',upgrade:25,twoHanded:false},
 {id:'fire-knights-greatsword-standard-plus0',weaponName:"Fire Knight's Greatsword",str:30,dex:25,fai:20,affinity:'Standard',upgrade:0,twoHanded:false},
 {id:'fire-knights-greatsword-standard-plus25',weaponName:"Fire Knight's Greatsword",str:30,dex:25,fai:20,affinity:'Standard',upgrade:25,twoHanded:false}
];
const baseCases=cases.length;
cases.push(...V117_ADDITIONAL_UI_CANDIDATES);
if(baseCases!==15||cases.length!==50||new Set(cases.map(c=>c.id)).size!==50)
 throw new RangeError('Reference probe requires 15 prior + 35 NEW DISTINCT candidate input combinations.');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser,profile,socket,id=0;
const promises=new Map();
async function send(method,params={}){
 if(socket?.readyState!==WebSocket.OPEN)throw Error('CDP disconnected');
 return await new Promise((yes,no)=>{
  const n=++id;
  const timeout=setTimeout(()=>{promises.delete(n);no(Error('CDP timeout: '+method));},15000);
  promises.set(n,{yes,no,timeout});
  socket.send(JSON.stringify({id:n,method,params}));
 });
}
async function evaluate(expression){
 const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(result.exceptionDetails)throw Error('Page JS error: '+String(result.exceptionDetails.text||'unknown'));
 return result.result?.value;
}
function browserSnapshot(){
 const text=document.body?.innerText||'';
 const n=text.indexOf('Equipped Right Hand 1');
 return {
  page:location.href,title:document.title,
  version:(text.match(/Elden Ring Version:[^\n]*/i)||[])[0]||'',
  weaponBlock:n>=0?text.slice(n,n+300):'',
  controls:[...document.querySelectorAll('input,select')].slice(0,100).map(el=>({
   tag:el.tagName,id:el.id||'',type:el.type||'',name:el.name||'',
   placeholder:el.getAttribute('placeholder')||'',
   value:String(el.value??'').slice(0,70),checked:el.type==='checkbox'?el.checked:null,
   parent:(el.parentElement?.innerText||'').trim().slice(0,65)
  })).slice(0,55),
  bodySize:text.length,readyState:document.readyState
 };
}
async function start(){
 profile=await mkdtemp(join(tmpdir(),'elden-tarnished-public-'));
 browser=spawn(chromePath,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',
  '--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'
 ],{stdio:['ignore','ignore','pipe']});
 let failed=null;
 browser.on('error',e=>failed=e);
 const endpoint=await waitForChromePage({
  profile,readText:readFile,request:fetch,
  getExitReason:()=>failed?.message||(browser.exitCode!==null?'Chrome exited '+browser.exitCode:null)
 });
 socket=new WebSocket(endpoint);
 await new Promise((yes,no)=>{
  const timeout=setTimeout(()=>no(Error('CDP WebSocket connection timeout')),10000);
  socket.addEventListener('open',()=>{clearTimeout(timeout);yes();},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(timeout);no(Error('CDP WebSocket error'));},{once:true});
 });
 socket.addEventListener('message',event=>{
  const msg=JSON.parse(event.data);
  if(!msg.id)return;
  const entry=promises.get(msg.id);
  if(!entry)return;
  promises.delete(msg.id);clearTimeout(entry.timeout);
  if(msg.error)entry.no(Error(msg.error.message));else entry.yes(msg.result);
 });
 await send('Page.enable');await send('Runtime.enable');
}
async function cleanup(){
 try{socket?.close();}catch{}
 try{browser?.kill('SIGTERM');}catch{}
 await sleep(700);
 if(browser?.exitCode===null)try{browser.kill('SIGKILL');}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
async function main(){
 await start();
 const results=[];
 try{
  for(const c of cases){
   const desiredWeapon=c.weaponName||'Uchigatana';
   const params=new URLSearchParams({
    str:String(c.str),dex:String(c.dex),int:String(c.int??10),fai:String(c.fai??10),arc:String(c.arc??10),
    rh1:desiredWeapon,aRh1:c.affinity,
    smith:String(c.somber?0:c.upgrade),somber:String(c.somber?c.upgrade:0),
    twoHanded:String(c.twoHanded)
   });
   const url='https://www.tarnished.dev/build-planner?'+params;
   try{
    await send('Page.navigate',{url});
    await sleep(3500);
    let snap=await evaluate('('+browserSnapshot.toString()+')()');
    if(!snap.weaponBlock.includes('\n'+desiredWeapon+'\n')){
     await sleep(5000);snap=await evaluate('('+browserSnapshot.toString()+')()');
    }
    const ar=snap.weaponBlock.match(/Total AR\s*:\s*(\d+)/i);
    const get=id=>snap.controls.find(x=>x.id===id);
    const verifiedInputs=Boolean(
     get('strength')?.value===String(c.str)&&
     get('dexterity')?.value===String(c.dex)&&
     get('intelligence')?.value===String(c.int??10)&&
     get('faith')?.value===String(c.fai??10)&&
     get('arcane')?.value===String(c.arc??10)&&
     get('smithinglevel')?.value===String(c.somber?0:c.upgrade)&&
     get('somberlevel')?.value===String(c.somber?c.upgrade:0)&&
     get('twohand')?.checked===c.twoHanded&&
     snap.version.includes('v1.17')&&
     snap.weaponBlock.includes('\n'+desiredWeapon+'\n')&&
     snap.weaponBlock.includes('\n'+c.affinity+'\n')&&
     get('activate-rune')?.checked===false&&
     get('activate-physick')?.checked===false
    );
    const result={
     id:c.id,request:c,
     evidenceTier:cases.indexOf(c)<baseCases?'prior-15-reprobe':'additional-unpromoted-candidate',
     observedAr:ar?Number(ar[1]):null,
     displayedWeapon:snap.weaponBlock.includes('\n'+desiredWeapon+'\n')?desiredWeapon:null,
     version:snap.version,url:snap.page,title:snap.title,
     browserWeaponBlock:snap.weaponBlock,
     controls:snap.controls,
     status:ar&&verifiedInputs?'INPUT-VERIFIED-AR':ar?'rendered-unconfirmed-inputs':'no-rendered-ar',
     verifiedInputs,
     pageReady:snap.readyState,bodySize:snap.bodySize
    };
    results.push(result);
    console.log('[TARNISHED CHROME] '+JSON.stringify({
     id:result.id,status:result.status,
     ar:result.observedAr,version:result.version,verifiedInputs:result.verifiedInputs,
     rightHand:result.browserWeaponBlock.slice(0,160),
     controls:result.controls.slice(0,26)
    }));
   }catch(e){
    results.push({id:c.id,status:'page-error',error:String(e.message).slice(0,250)});
    console.log('[TARNISHED CHROME] '+c.id+' error: '+String(e.message).slice(0,150));
   }
  }
 }finally{await cleanup();}
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-chrome-ui.json'),JSON.stringify({
  source:'tarnished.dev public UI',gameCertified:false,comparatorVersion:'v1.17',
  evidenceStatus:'RAW OBSERVATIONS ONLY; new cases are not counted or promoted until two confirmed external reads and independent AR matching',
  priorCaseCount:baseCases,newCandidateCount:V117_ADDITIONAL_UI_CANDIDATES.length,
  newInputVerified:results.slice(baseCases).filter(c=>c.status==='INPUT-VERIFIED-AR').length,
  cases:results
 },null,2)+'\n');
 console.log('[TARNISHED CHROME] total='+results.length+' rendered='+
  results.filter(x=>x.observedAr!==null).length+
  ' prior-input-verified='+results.slice(0,baseCases).filter(x=>x.status==='INPUT-VERIFIED-AR').length+
  ' NEW-input-verified='+results.slice(baseCases).filter(x=>x.status==='INPUT-VERIFIED-AR').length+
  ' NEW-not-yet-approved='+V117_ADDITIONAL_UI_CANDIDATES.length+
  '; zero new benchmark passes auto-approved');
}
main().catch(async e=>{console.error('[TARNISHED CHROME] fatal: '+String(e));await cleanup();process.exitCode=1;});
