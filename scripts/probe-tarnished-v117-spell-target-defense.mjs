#!/usr/bin/env node
/** Fresh residual numeric matrix: actual Damage and Spell result tables, enemy controls and Spell result
 * structure. No earlier weapon AR, level, armor field or Poise re-verifications.
 * Captures actual public v1.17 UI inputs and changed values with real keyboard.
 */
import {spawn} from 'node:child_process';
import {readFile,mkdir,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {waitForChromePage} from './browser-cdp-startup.mjs';
const chromePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chromePath)throw Error('No Chromium');
let chrome,ws,profile,seq=0;
const pending=new Map(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function send(method,params={}){
 const id=++seq;
 return new Promise((ok,bad)=>{
  const timer=setTimeout(()=>{pending.delete(id);bad(Error('Timeout '+method));},20000);
  pending.set(id,{ok,bad,timer});
  ws.send(JSON.stringify({id,method,params}));
 });
}
async function run(fn,...args){
 const expr='('+fn.toString()+')('+args.map(x=>JSON.stringify(x)).join(',')+')';
 const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error('Runtime '+JSON.stringify(r.exceptionDetails).slice(0,300));
 return r.result?.value;
}
function snapshot(){
 const elements=[...document.querySelectorAll('input')].map((e,i)=>({
  i,id:e.id||'',name:e.name||'',value:e.value,checked:e.checked,
  readOnly:e.readOnly,disabled:e.disabled,type:e.type,
  label:(e.closest('label')?.innerText||e.parentElement?.parentElement?.innerText||'').trim().slice(0,85),
  html:e.outerHTML.slice(0,230)
 }));
 const selects=[...document.querySelectorAll('select,[role="combobox"]')].map((e,i)=>({
  i,id:e.id||'',name:e.name||'',value:e.value||'',text:(e.innerText||'').trim().slice(0,130)
 })).slice(0,80);
 return {url:location.href,title:document.title,version:(document.body?.innerText||'').match(/Elden Ring Version:[^\n]*/)?.[0]??null,
  text:(document.body?.innerText||'').slice(0,9000),elements,selects};
}
async function nav(url){
 await send('Page.navigate',{url});await sleep(4200);
 let s=await run(snapshot);if(s.elements.length<25){await sleep(4500);s=await run(snapshot)}
 if(!s.version||!s.version.includes('v1.17'))throw Error('Reference not v1.17 at '+url+' version='+s.version);
 return s;
}
async function keyboard(id,value){
 const before=await run(function(id){const e=document.getElementById(id);
  if(!e)return {found:false};e.scrollIntoView({behavior:'instant',block:'center'});e.focus();
  return {found:true,previous:e.value,readonly:e.readOnly,disabled:e.disabled};
 },id);
 if(!before.found||before.readonly||before.disabled)throw Error('Cannot edit '+id+' '+JSON.stringify(before));
 await send('Input.dispatchKeyEvent',{type:'rawKeyDown',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});
 await send('Input.insertText',{text:String(value)});
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 await sleep(950);
 return await run(function(id){return document.getElementById(id)?.value},id);
}
async function clickRect(rect){
 if(!rect?.found||!Number.isFinite(rect.x)||!Number.isFinite(rect.y)||
    rect.x<0||rect.y<0||rect.x>=rect.width||rect.y>=rect.height)return false;
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x,y:rect.y});
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:rect.x,y:rect.y,button:'left',clickCount:1});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:rect.x,y:rect.y,button:'left',clickCount:1});
 await sleep(650);
 return true;
}
async function chooseOption(exactName){
 const pos=await run(function(exactName){
  const options=[...document.querySelectorAll('[role="option"],.p-multiselect-item')];
  const el=options.find(e=>(e.innerText||e.textContent||'').trim()===exactName);
  if(!el)return{found:false,name:exactName,visible:options.slice(0,10).map(e=>e.innerText)};
  el.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
  const r=el.getBoundingClientRect();
  return{found:true,name:exactName,x:r.left+r.width/2,y:r.top+r.height/2,
   width:innerWidth,height:innerHeight,disabled:el.getAttribute('aria-disabled'),
   text:el.innerText.slice(0,100)};
 },exactName);
 const clicked=pos.found&&pos.disabled!=='true'&&await clickRect(pos);
 return {...pos,clicked};
}
async function openAndSelect(id,exactName){
 const pos=await run(function(id){
  const el=document.getElementById(id)||
   [...document.querySelectorAll('.p-multiselect-label')].
    find(x=>(x.textContent||'').trim()==='Search weapons...')?.
    closest('[data-pc-name="multiselect"]');
  if(!el)return{found:false,reason:'Missing actual public weapon multiselect after label fallback '+id};
  el.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
  const r=el.getBoundingClientRect();
  return{found:true,x:r.left+r.width/2,y:r.top+r.height/2,
   width:innerWidth,height:innerHeight};
 },id);
 if(!await clickRect(pos))return {...pos,clicked:false};
 const filter=await run(function(){return{
  available:!!document.querySelector('.p-multiselect-filter'),
  optionCount:document.querySelectorAll('[role="option"],.p-multiselect-item').length,
  options:[...document.querySelectorAll('[role="option"],.p-multiselect-item')].map(x=>x.innerText.trim()).slice(0,120),
  rootId:document.querySelector('.p-multiselect-panel')?.id||''
 }});
 const direct=await chooseOption(exactName);
 if(direct.clicked)return{id,filter:{...filter,options:filter.options.slice(0,10)},selected:direct,method:'existing visible option'};
 if(!filter.available)return{found:false,reason:'No rendered real search input after opening',id,filter};
 await run(function(){document.querySelector('.p-multiselect-filter')?.focus()});
 await send('Input.insertText',{text:exactName});
 await sleep(850);
 const selected=await chooseOption(exactName);
 return {id,filter,selected};
}
async function main(){
 const pass=Number(process.env.TARNISHED_DEFENSE_PASS);
 if(![1,2].includes(pass))throw Error('TARNISHED_DEFENSE_PASS must be 1 or 2');
 const intelligenceValues=[40,60];
 profile=await mkdtemp(join(tmpdir(),'tarnished-spell-defense-v117-'));
 chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-extensions','--no-first-run','--disable-background-networking',
 '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--remote-allow-origins=*',
 '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const ep=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>chrome.exitCode!==null?'Chrome exit '+chrome.exitCode:null});
 ws=new WebSocket(ep);
 await new Promise((ok,bad)=>{const t=setTimeout(()=>bad(Error('websocket open timeout')),12000);
  ws.addEventListener('open',()=>{clearTimeout(t);ok()},{once:true});
  ws.addEventListener('error',()=>{clearTimeout(t);bad(Error('websocket error'))},{once:true});
 });
 ws.addEventListener('message',evt=>{
  const m=JSON.parse(evt.data),p=pending.get(m.id);if(!p)return;
  pending.delete(m.id);clearTimeout(p.timer);
  if(m.error)p.bad(Error(m.error.message));else p.ok(m.result);
 });
 await send('Runtime.enable');await send('Page.enable');
 const initial=await nav('https://www.tarnished.dev/spell-calculator');
 const host=await run(function(){
  const query='Search offensive sorceries...';
  const e=[...document.querySelectorAll('span,div')].find(x=>
   x.children.length===0&&(x.textContent||'').trim()===query);
  if(!e)return null;
  e.parentElement?.parentElement?.scrollIntoView({behavior:'instant',block:'center'});
  const b=e.parentElement?.getBoundingClientRect();
  return b?{x:b.left+b.width/2,y:b.top+b.height/2,
   width:innerWidth,height:innerHeight}:null;
 });
 if(!host||!await clickRect({...host,found:true}))throw Error('Actual spell selection control missing');
 const spell=await chooseOption('Glintstone Pebble');
 if(!spell.clicked)throw Error('Could not genuinely select Glintstone Pebble');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await sleep(300);
 const staff=await openAndSelect('select-weapons',"Academy Glintstone Staff");
 if(!staff.selected?.clicked)throw Error('Could not genuinely select Astrologers Staff');
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
 await sleep(300);
 const show=await run(function(){
  const e=[...document.querySelectorAll('button,[role="button"]')].find(e=>
   (e.innerText||e.textContent||'').trim()==='Show Table');
  if(!e)return {found:false};
  e.scrollIntoView({block:'center',behavior:'instant'});
  const b=e.getBoundingClientRect();
  return {found:true,x:b.left+b.width/2,y:b.top+b.height/2,
   width:innerWidth,height:innerHeight,disabled:e.disabled,
   hit:document.elementFromPoint(b.left+b.width/2,b.top+b.height/2)?.closest('button')?.innerText};
 });
 if(!show.found||show.disabled||show.hit?.trim()!=='Show Table'||!await clickRect(show))
  throw Error('Actual public Spell Show Table button did not open '+JSON.stringify(show));
 await sleep(1200);
 // Public reference currently only supports its stated ZERO enemy defenses/resistances.
 // A nonexistent enemy-control input must not be guessed or fabricated.
 const referenceDisclaimer=await run(function(){
  const body=document.body.innerText;
  const quote='This calculates based on an enemy with zero defences and resistances';
  return{statedZeroTarget:body.includes(quote),
   hasEnemyDefenseInput:[...document.querySelectorAll('input')].some(e=>/enemy.*defen|magic.*defen|enemy.*negat/i.test(e.id+' '+e.name+' '+e.placeholder))};
 });
 if(!referenceDisclaimer.statedZeroTarget||referenceDisclaimer.hasEnemyDefenseInput)
  throw Error('Public target-scope changed; inspect before accepting another comparison');
 const upgraded=await keyboard('smithinglevel',20);
 if(upgraded!=='20')throw Error('Did not set public +20 smithing input');
 console.log('[ZERO-TARGET REFERENCE LIMIT VERIFIED]',JSON.stringify(referenceDisclaimer));
 const rows=[];
 for(const intelligence of intelligenceValues){
  const raw=await keyboard('intelligence',intelligence);
  if(Number(raw)!==intelligence)throw Error('INT field not set '+intelligence);
  await sleep(400);
  const row=await run(function(intelligence){
   const text=document.body?.innerText||'';
   const matches=[...text.matchAll(/\nAcademy Glintstone Staff\nGlintstone Pebble\n1\n0\n(\d+)\n0\n0\n0\n7\nSorcery\n10\n0\n0\nPrivacy Policy\b/g)];
   const selectedTokens=[...document.querySelectorAll('.p-multiselect-token')].map(n=>n.textContent.trim());
   const stats={int:document.getElementById('intelligence')?.value,
    finalInt:document.getElementById('finalintelligence')?.value,
    smithing:document.getElementById('smithinglevel')?.value,
    somber:document.getElementById('somberlevel')?.value};
   const version=(text.match(/Elden Ring Version:[^\n]*/)||[])[0]??null;
   return{intelligence,magic:matches.length===1?Number(matches[0][1]):null,
    rowCount:matches.length,selectedTokens,version,stats,
    pageLength:text.length};
  },intelligence);
  if(row.magic===null||row.rowCount!==1||
   row.version!=='Elden Ring Version: v1.17'||
   Number(row.stats.int)!==intelligence||
   row.stats.finalInt!==null&&row.stats.finalInt!==undefined&&
    Number(row.stats.finalInt)!==intelligence||
   row.stats.smithing!=='20'||
   !row.selectedTokens.includes("Academy Glintstone Staff")||
   !row.selectedTokens.includes('Glintstone Pebble'))
   throw Error('Fail closed on missing effective source inputs '+JSON.stringify({...row,debugTail:await run(function(){return document.body.innerText.slice(-1600)})}));
  rows.push(row);
  console.log('[REAL TARNISHED SPELL SWEEP ROW]',JSON.stringify({pass,...row}));
 }
 await mkdir(resolve('.audit'),{recursive:true});
 const file=resolve('.audit/tarnished-spell-v117-academy-plus20-pass-'+pass+'.json');
 await writeFile(file,JSON.stringify({
  source:'Tarnished.dev public v1.17',pass,scenario:'Wretch original stats 10 except INT; selected Academy Glintstone Staff +20 and Glintstone Pebble; no effects; target fixed at zero defense/negation',
  targetLimitation:referenceDisclaimer,
  rows,publicUrl:initial.url
 },null,2)+'\n');
 console.log('[REAL SPELL SWEEP SUMMARY]',JSON.stringify({pass,file,rows:rows.map(r=>[r.intelligence,r.magic])}));
}
try{await main()}finally{
 try{ws?.close()}catch{}try{chrome?.kill('SIGTERM')}catch{}
 await sleep(300);if(chrome?.exitCode===null)try{chrome.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
