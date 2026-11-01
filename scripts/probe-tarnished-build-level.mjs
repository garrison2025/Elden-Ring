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

import {CLASSES,buildLevel} from '../public/src/core.mjs';
const WRETCH=CLASSES.find(x=>x.name==='Wretch');
const ALL=[[10,10,10,10,10],[20,10,10,10,10],[10,40,10,10,10],[10,10,60,10,10],[10,10,10,50,10],[10,10,10,10,70],[30,30,30,30,30],[99,99,99,99,99],[60,25,15,20,10],[12,18,38,22,15],[33,12,12,45,12],[23,67,12,12,12],[45,45,45,11,11],[45,10,10,45,10],[10,10,10,10,11],[11,10,10,10,10],[20,20,20,20,20],[80,80,12,12,12],[40,40,20,20,20],[14,70,10,10,35]];
const levelSamples=ALL.map((five,index)=>({id:'level-'+String(index+1).padStart(2,'0'),
 stats:[10,10,10,...five],
 expected:buildLevel(WRETCH,[10,10,10,...five])}));
async function run(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-build-level-'));
 browser=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',
  '--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const endpoint=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>browser.exitCode!==null?'Chrome exited '+browser.exitCode:null});
 socket=new WebSocket(endpoint);
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('CDP timeout')),10000);
  socket.addEventListener('open',()=>{clearTimeout(timeout);resolve()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(timeout);reject(Error('WebSocket connection failure'))},{once:true});
 });
 socket.addEventListener('message',e=>{
  const j=JSON.parse(e.data),p=pending.get(j.id);if(!p)return;
  pending.delete(j.id);clearTimeout(p.timeout);
  if(j.error)p.reject(Error(j.error.message));else p.resolve(j.result);
 });
 await send('Page.enable');await send('Runtime.enable');
 const observations=[];
 for(const c of levelSamples){
  const five=c.stats.slice(3);
  const params=new URLSearchParams({str:String(five[0]),dex:String(five[1]),
   int:String(five[2]),fai:String(five[3]),arc:String(five[4]),
   smith:'0',somber:'0',twoHanded:'false'});
  const url='https://www.tarnished.dev/build-planner?'+params;
  try{
   await send('Page.navigate',{url});await sleep(2000);
   let snap=await evaluate('('+buildSnapshot.toString()+')()');
   if(!snap.version.includes('v1.17')||!snap.characterLevel) {
    await sleep(2000);snap=await evaluate('('+buildSnapshot.toString()+')()');
   }
   const valid=Boolean(snap.version==='Elden Ring Version: v1.17'&&
    /^https:\/\/www\.tarnished\.dev\/build-planner/.test(snap.url)&&
    snap.classLabel==='Wretch'&&
    c.stats.every((n,i)=>snap.statValues[i]===String(n))&&
    Number.isInteger(snap.characterLevel)&&
    snap.runeOff&&snap.physickOff);
   const record={id:c.id,stats:c.stats,class:'Wretch',local:c.expected,
    publicLevel:valid?snap.characterLevel:null,verified:valid,
    siteData:snap,delta:valid?c.expected-snap.characterLevel:null};
   observations.push(record);
   console.log('[BUILD LEVEL SITE] '+JSON.stringify({id:c.id,stats:c.stats,
    level:record.publicLevel,local:c.expected,valid,delta:record.delta,
    selectedClass:snap.classLabel,siteStatValues:snap.statValues}));
  }catch(err){
   observations.push({id:c.id,stats:c.stats,local:c.expected,publicLevel:null,
    verified:false,reason:String(err?.message??err)});
  }
 }
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-build-level-public.json'),
  JSON.stringify({site:'Tarnished.dev public v1.17',samples:observations},null,2)+'\n');
 console.log('[BUILD LEVEL SUMMARY] '+JSON.stringify({total:observations.length,
  verified:observations.filter(x=>x.verified).length,
  matched:observations.filter(x=>x.verified&&x.delta===0).length,
  mismatched:observations.filter(x=>x.verified&&x.delta!==0).length,
  notObserved:observations.filter(x=>!x.verified).length}));
}
function buildSnapshot(){
 const text=document.body?.innerText||'';
 const ids=['vigor','mind','endurance','strength','dexterity','intelligence','faith','arcane'];
 const vals=ids.map(k=>String(document.getElementById(k)?.value??''));
 const classLabels=[...document.querySelectorAll('select')].map(x=>x.selectedOptions?.[0]?.textContent?.trim()??x.value);
 const lvl=String(document.getElementById('total-level')?.value??'');
 return {version:(text.match(/Elden Ring Version:[^\n]*/i)||[])[0]||'',
  url:location.href,classLabel:classLabels.includes('Wretch')?'Wretch':classLabels.join('|').slice(0,120),
  characterLevel:/^\d+$/.test(lvl)?Number(lvl):null,
  statValues:vals,runeOff:document.getElementById('activate-rune')?.checked===false,
  physickOff:document.getElementById('activate-physick')?.checked===false};
}
try{await run()}finally{
 try{socket?.close()}catch{}
 try{browser?.kill('SIGTERM')}catch{}
 await sleep(350);
 if(browser?.exitCode===null)try{browser.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
