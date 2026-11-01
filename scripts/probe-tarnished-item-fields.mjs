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
const chrome=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chrome)throw Error('No public-site browser installed');
const samples=[
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
async function run(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-weights-public-'));
 browser=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--disable-background-networking',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',
  '--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],
  {stdio:['ignore','ignore','pipe']});
 const endpoint=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>browser.exitCode!==null?'Chrome exited '+browser.exitCode:null});
 socket=new WebSocket(endpoint);
 await new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('WebSocket connection timeout')),10000);
  socket.addEventListener('open',()=>{clearTimeout(timeout);resolve();},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(timeout);reject(Error('WebSocket failure'));},{once:true});
 });
 socket.addEventListener('message',e=>{
  const j=JSON.parse(e.data);const p=pending.get(j.id);if(!p)return;
  pending.delete(j.id);clearTimeout(p.timeout);
  if(j.error)p.reject(Error(j.error.message));else p.resolve(j.result);
 });
 await send('Page.enable');await send('Runtime.enable');
 const results=[];
 for(const c of samples){
  const params=new URLSearchParams({str:'60',dex:'60',int:'30',fai:'30',arc:'30',
   smith:'0',somber:'0',twoHanded:'false'});
  if(c.name){params.set(c.hand,c.name);params.set(c.hand==='rh1'?'aRh1':'aLh1',uniqueAffinity.has(c.name)?'None':'Standard');}
  const url='https://www.tarnished.dev/build-planner?'+params;
  try{
   await send('Page.navigate',{url});await sleep(3500);
   let s=await evaluate('('+snapshot.toString()+')()');
   if(!s.version.includes('v1.17')||(c.name&&!s.buildWeaponBlock.includes('\n'+c.name+'\n'))){
    await sleep(5000);s=await evaluate('('+snapshot.toString()+')()');
   }
   const blockStart='Equipped '+(c.hand==='lh1'?'Left':'Right')+' Hand 1';
   const pos=s.buildWeaponBlock.indexOf(blockStart);
   const next=s.buildWeaponBlock.search(/Equipped (?:Right|Left) Hand [23]/);
   const selected=pos>=0?s.buildWeaponBlock.slice(pos,next>pos?next:pos+420):'';
   const affinity=uniqueAffinity.has(c.name)?'None':'Standard';
   const parsed=s.fields.find(x=>x.id==='Equip Load')?.value.match(/^(\\d+(?:\\.\\d+)?) \\/ (\\d+(?:\\.\\d+)?)/);
   const actual=parsed?Number(parsed[1]):null,cap=parsed?Number(parsed[2]):null;
   const validControls=s.controls.str==='60'&&s.controls.dex==='60'&&s.controls.int==='30'&&
    s.controls.fai==='30'&&s.controls.arc==='30'&&
    s.controls.smith==='0'&&s.controls.somber==='0'&&s.controls.twoHanded===false&&
    s.controls.rune===false&&s.controls.physick===false;
   const verified=Boolean(s.version.includes('v1.17')&&
    new URL(s.url).hostname==='www.tarnished.dev'&&
    new URL(s.url).pathname==='/build-planner'&&
    validControls&&Number.isFinite(actual)&&Number.isFinite(cap)&&cap===48.2&&
    (c.name?selected.includes('\\n'+c.name+'\\n')&&
      selected.includes('\\n'+affinity+'\\n')&&/Total AR\\s*:\\s*\\d+/.test(selected):
      actual===0&&!/Total AR\\s*:\\s*\\d+/.test(s.buildWeaponBlock)));
   const status=verified?'INPUT_AND_ITEM_VERIFIED':'NOT_OBSERVED';
   results.push({id:c.id,requested:c.name,hand:c.hand,affinity:c.name?affinity:null,
    equipLoad:verified?actual:null,equipCap:verified?cap:null,
    status,version:s.version,url:s.url,
    itemBlock:selected.slice(0,420),sourceValue:s.fields.find(x=>x.id==='Equip Load')?.value??null,
    controls:s.controls,fieldAvailability:{individualWeightLabel:s.labels.some(y=>/Weight/i.test(y.text)),
     individualRequirementsLabel:s.context.some(y=>/Requirements/i.test(y.term))}});
   console.log('[FIELD SITE] '+JSON.stringify({id:c.id,status,equipLoad:verified?actual:null,
    cap:verified?cap:null,itemBlock:selected.slice(0,220),version:s.version,url:s.url,
    contexts:s.context.slice(0,8),fields:s.fields.slice(0,20),labels:s.labels.slice(0,8),
    firstText:c.id==='baseline-no-items'?s.firstText:'',textLength:s.textLength}));
  }catch(e){
   results.push({id:c.id,requested:c.name,error:String(e.message)});
   console.log('[FIELD SITE ERROR] '+c.id+' '+e.message);
  }
 }
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-public-field-visibility.json'),
  JSON.stringify({comparator:'Tarnished.dev v1.17',checkedAt:new Date().toISOString(),
   classification:'Public-site UI observations only; item attributes NOT automatically accepted',
   cases:results},null,2)+'\n');
 console.log('[FIELD SITE SUMMARY] '+JSON.stringify({checked:results.length,
  validVersion:results.filter(x=>x.version?.includes('v1.17')).length,
  verifiedItems:results.filter(x=>x.status==='INPUT_AND_ITEM_VERIFIED').length,
  notObserved:results.filter(x=>x.status!=='INPUT_AND_ITEM_VERIFIED').length}));
}
try{await run()}finally{
 try{socket?.close()}catch{}
 try{browser?.kill('SIGTERM')}catch{}
 await sleep(350);
 if(browser?.exitCode===null)try{browser.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
