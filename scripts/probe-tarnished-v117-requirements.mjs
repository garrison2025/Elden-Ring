#!/usr/bin/env node
/** Read-only exact-input public v1.17 DOM probe for individual item weight and
 * stat-requirement field availability. No private APIs, no bundled site data.
 * A mere AR match is NOT evidence of these independent item fields.
 */
import {spawn} from 'node:child_process';
import {readFile,mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {existsSync} from 'node:fs';
import {waitForChromePage} from './browser-cdp-startup.mjs';
import {V117_WEIGHT_BATCH2_CANDIDATES} from './tarnished-v117-weight-batch2-candidates.mjs';
import {V117_WEIGHT_FINAL37_CANDIDATES} from './tarnished-v117-weight-final37-candidates.mjs';
import {V117_WEIGHT_BATCH4_CANDIDATES} from './tarnished-v117-weight-batch4-candidates.mjs';
import {getRemainingWeightShard} from './tarnished-v117-weight-remaining380.mjs';
import {getUnresolvedAliasShard} from './tarnished-v117-weight-unresolved36.mjs';
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chrome)throw Error('No public-site browser installed');
const historicSamples=[
 {id:'baseline-no-items',name:'',hand:'rh1'},
 {id:'known-longsword-rh1',name:'Longsword',hand:'rh1'},
 {id:'known-longsword-lh1',name:'Longsword',hand:'lh1'},
 {id:'missing-albinauric-shield',name:'Albinauric Shield',hand:'lh1'},
 {id:'missing-brass-shield',name:'Brass Shield',hand:'lh1'},
 {id:'missing-fingerprint-stone-shield',name:'Fingerprint Stone Shield',hand:'lh1'},
 {id:'missing-golden-greatshield',name:'Golden Greatshield',hand:'lh1'},
 {id:'missing-great-turtle-shell',name:'Great Turtle Shell',hand:'lh1'},
 {id:'conflict-stone-sheathed',name:'Stone-Sheathed Sword',hand:'rh1'},
 {id:'conflict-fire-knights-shortsword',name:"Fire Knight's Shortsword",hand:'rh1'},
 {id:'conflict-radahn-light',name:'Greatsword of Radahn (Light)',hand:'rh1'},
 {id:'conflict-ritual-thrusting-shield',name:'Ritual Thrusting Shield',hand:'lh1'}
];
const batch2=process.env.TARNISHED_WEIGHT_BATCH==='2';
const batch3=process.env.TARNISHED_WEIGHT_BATCH==='3';
const batch4=process.env.TARNISHED_WEIGHT_BATCH==='4';
const batch5=process.env.TARNISHED_WEIGHT_BATCH==='5';
const batch6=process.env.TARNISHED_WEIGHT_BATCH==='6';
const aliasShard=batch6?Number(process.env.TARNISHED_WEIGHT_SHARD):null;
const bulkShard=batch5?Number(process.env.TARNISHED_WEIGHT_SHARD):null;
const samples=batch6?[...historicSamples.slice(0,3),...getUnresolvedAliasShard(aliasShard)]:batch5?[...historicSamples.slice(0,3),...getRemainingWeightShard(bulkShard)]:batch4?[...historicSamples.slice(0,3),...V117_WEIGHT_BATCH4_CANDIDATES]:batch3?[...historicSamples.slice(0,3),...V117_WEIGHT_FINAL37_CANDIDATES]:
 batch2?[...historicSamples.slice(0,3),...V117_WEIGHT_BATCH2_CANDIDATES]:historicSamples;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const uniqueAffinity=new Set(['Stone-Sheathed Sword','Greatsword of Radahn (Light)']);
let browser,profile,socket,serial=0;const pending=new Map();
async function send(method,params={}){
 const id=++serial;
 return new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>{pending.delete(id);reject(Error(method+' timed out'));},16000);
  pending.set(id,{resolve,reject,timeout});
  socket.send(JSON.stringify({id,method,params}));
 });
}
async function evaluate(expression){
 const response=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(response.exceptionDetails)throw Error('Runtime exception '+response.exceptionDetails.text);
 return response.result?.value;
}
function snapshot(){
 const text=document.body?.innerText||'';
 const contexts=[];
 const pattern=/Equip Load|Requirements|Weight|Encumbrance|Weapon AR|Scaling|Guard/gim;
 for(const match of text.matchAll(pattern)){
  contexts.push({term:match[0],excerpt:text.slice(Math.max(0,match.index-120),
   Math.min(text.length,match.index+300))});
  if(contexts.length>=20)break;
 }
 const outputEls=[...document.querySelectorAll('input,output,[id]')]
  .filter(e=>/(load|weight|encumbrance|requirement|attack|ar|shield|guard)/i.test(
   [e.id,e.name,e.getAttribute('aria-label'),e.getAttribute('placeholder')].join(' ')))
  .slice(0,45).map(e=>({tag:e.tagName,id:e.id,type:e.type||'',
   text:(e.textContent||'').trim().slice(0,80),value:String(e.value??'').slice(0,70)}));
 const exactLabels=[...document.querySelectorAll('label,span,h3,p,th,td')]
  .filter(e=>/^(?:Equip Load|Weight|Requirements|Strength|Dexterity|Guard|Scaling:)$/i.test(
   (e.textContent||'').trim()))
  .slice(0,20).map(e=>({tag:e.tagName,text:(e.textContent||'').trim(),
   parent:(e.parentElement?.innerText||'').trim().slice(0,280),
   html:(e.parentElement?.outerHTML||'').slice(0,450)}));
 const from=text.indexOf('Equipped Left Hand 1'),to=text.indexOf('Equipped Right Hand 2');
 const block=from>=0?text.slice(from,to>from?to:from+1100):'';
 return {buildWeaponBlock:block,
  controls:{str:document.getElementById('strength')?.value,
   dex:document.getElementById('dexterity')?.value,
   int:document.getElementById('intelligence')?.value,
   fai:document.getElementById('faith')?.value,
   arc:document.getElementById('arcane')?.value,
   smith:document.getElementById('smithinglevel')?.value,
   somber:document.getElementById('somberlevel')?.value,
   twoHanded:document.getElementById('twohand')?.checked,
   rune:document.getElementById('activate-rune')?.checked,
   physick:document.getElementById('activate-physick')?.checked},
  version:(text.match(/Elden Ring Version:[^\n]*/i)||[])[0]||'',
  title:document.title,url:location.href,
  status:document.readyState,context:contexts,fields:outputEls,labels:exactLabels,
  firstText:text.slice(0,2300),textLength:text.length};
}

import {getRequirementsShard,getArGapRequirementShard,getHighGapRequirementShard} from './tarnished-v117-requirement-candidates.mjs';
const index=Number(process.env.TARNISHED_REQUIREMENT_SHARD);
const mode=process.env.TARNISHED_REQUIREMENT_TARGET;
const targeted=mode==='ar-gap'||mode==='high-gap';
const requirementSamples=mode==='ar-gap'?getArGapRequirementShard(index):mode==='high-gap'?getHighGapRequirementShard(index):getRequirementsShard(index);
const reqPattern=/(?:^|\n)Req:\s*(\d+)\/(\d+)\/(\d+)\/(\d+)\/(\d+)/;
async function run(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-v117-public-req-'));
 browser=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',
  '--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const endpoint=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>browser.exitCode!==null?'Chrome exited '+browser.exitCode:null});
 socket=new WebSocket(endpoint);
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('CDP connection timeout')),10000);
  socket.addEventListener('open',()=>{clearTimeout(timeout);resolve()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(timeout);reject(Error('CDP connection failure'))},{once:true});
 });
 socket.addEventListener('message',e=>{
  const j=JSON.parse(e.data),p=pending.get(j.id);if(!p)return;
  pending.delete(j.id);clearTimeout(p.timeout);
  if(j.error)p.reject(Error(j.error.message));else p.resolve(j.result);
 });
 await send('Page.enable');await send('Runtime.enable');
 const results=[];
 for(const c of requirementSamples){
  let good=null,last=null;
  try{
   for(const candidateName of c.siteNames){
    for(const affinity of c.affinities){
     const params=new URLSearchParams({str:'10',dex:'10',int:'10',fai:'10',arc:'10',
      smith:'0',somber:'0',twoHanded:'false'});
     params.set(c.hand,candidateName);
     params.set(c.hand==='lh1'?'aLh1':'aRh1',affinity);
     await send('Page.navigate',{url:'https://www.tarnished.dev/build-planner?'+params});
     await sleep(2200);
     let s=await evaluate('('+snapshot.toString()+')()');
     if(!s.version.includes('v1.17')||!s.buildWeaponBlock.includes('\n'+candidateName+'\n')){
      await sleep(2000);s=await evaluate('('+snapshot.toString()+')()');
     }
     const pos=s.buildWeaponBlock.indexOf('Equipped '+(c.hand==='lh1'?'Left':'Right')+' Hand 1');
     const part=pos<0?'':s.buildWeaponBlock.slice(pos);
     const selected=part.split(/\nEquipped (?:Left|Right) Hand [123]/)[0];
     const m=selected.match(reqPattern);
     const controls=s.controls;
     const valid=controls.str==='10'&&controls.dex==='10'&&controls.int==='10'&&
      controls.fai==='10'&&controls.arc==='10'&&controls.smith==='0'&&
      controls.somber==='0'&&controls.twoHanded===false&&
      controls.rune===false&&controls.physick===false;
     const onSite=s.version==='Elden Ring Version: v1.17'&&
      new URL(s.url).hostname==='www.tarnished.dev'&&
      new URL(s.url).pathname==='/build-planner';
     const active=selected.includes('\n'+candidateName+'\n')&&
      selected.includes('\n'+affinity+'\n');
     const five=m?.slice(1).map(Number)??null;
     const verified=Boolean(onSite&&valid&&active&&five&&five.length===5&&
      five.every(v=>Number.isInteger(v)&&v>=0&&v<=99)&&five.some(v=>v>1));
     const observation={id:c.id,name:c.name,siteName:candidateName,affinity,
      status:verified?'INPUT_AND_REQ_VERIFIED':'NOT_OBSERVED',
      requirements:verified?five:null,verifiedInputs:valid&&onSite,
      version:s.version,siteUrl:s.url,selectedBlock:selected.slice(0,400),
      controls:s.controls,previouslyWeightVerified:c.previouslyWeightVerified};
     if(targeted)console.log('[REQ AR GAP ATTEMPT] '+JSON.stringify({
      id:c.id,name:c.name,candidateName,affinity,valid,onSite,active,
      displayedRequirements:five,siteStatValues:controls,selectedText:selected.slice(0,260),
      reason:verified?'DIRECT_REQ':!active?'WEAPON_OR_AFFINITY_NOT_ACTIVE':!m?'REQ_NOT_RENDERED':'VALIDATION_FAILED'
     }));
     last=observation;
     if(verified){good=observation;break;}
    }
    if(good)break;
   }
   const final=good??last??{id:c.id,name:c.name,status:'NOT_OBSERVED'};
   results.push(final);
   console.log('[REQ SITE] '+JSON.stringify(final));
  }catch(e){
   const failed={id:c.id,name:c.name,status:'NOT_OBSERVED',error:String(e?.message??e)};
   results.push(failed);console.log('[REQ ERROR] '+JSON.stringify(failed));
  }
 }
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-public-requirements.json'),JSON.stringify({
  source:'Public Tarnished.dev v1.17 Build Planner Req: text, raw UI',
  stats:[10,10,10,10,10],shard:index,observedDate:new Date().toISOString(),
  cases:results},null,2)+'\n');
 console.log('[REQ SITE SUMMARY] '+JSON.stringify({shard:index,total:results.length,
  observed:results.filter(x=>x.status==='INPUT_AND_REQ_VERIFIED').length,
  unobserved:results.filter(x=>x.status!=='INPUT_AND_REQ_VERIFIED').length}));
}
try{await run()}finally{
 try{socket?.close()}catch{}
 try{browser?.kill('SIGTERM')}catch{}
 await sleep(350);
 if(browser?.exitCode===null)try{browser.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
