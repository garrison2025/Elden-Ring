#!/usr/bin/env node
/** Read only: actual Damage and Spell result tables, enemy controls and Spell result
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
async function main(){
 profile=await mkdtemp(join(tmpdir(),'remaining-v117-build-'));
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
 ws.addEventListener('message',evt=>{const m=JSON.parse(evt.data),p=pending.get(m.id);if(!p)return;
  pending.delete(m.id);clearTimeout(p.timer);if(m.error)p.bad(Error(m.error.message));else p.ok(m.result);
 });
 await send('Runtime.enable');await send('Page.enable');
 const results={schemaVersion:1,site:'Tarnished.dev public v1.17',
  target:'Remaining actual Damage/Spell result table controls only',pages:[]};
 for(const [name,url] of [
  ['damage','https://www.tarnished.dev/damage-calculator'],
  ['spell','https://www.tarnished.dev/spell-calculator']
 ]){
  const first=await nav(url);
  // Inspect the actual React/PrimeReact search host and open its public
  // options with a real pointer, without guessing a weapon or spell.
  const host=await run(function(name){
   const query=name==='damage'?'Search weapons...':'Search offensive sorceries...';
   const e=[...document.querySelectorAll('span,div')].find(x=>
    x.children.length===0&&(x.textContent||'').trim()===query);
   if(!e)return{found:false,query};
   const p=e.parentElement,pp=p?.parentElement;
   pp?.scrollIntoView({behavior:'instant',block:'center',inline:'center'});
   const b=p?.getBoundingClientRect();
   return{found:true,query,
    leaf:e.outerHTML.slice(0,500),
    parent:p?.outerHTML.slice(0,1600),grandparent:pp?.outerHTML.slice(0,2400),
    point:b?{x:b.x+b.width/2,y:b.y+b.height/2,width:innerWidth,height:innerHeight}:null};
  },name);
  console.log('[LIVE '+name.toUpperCase()+' SEARCH HOST]',JSON.stringify(host).slice(0,8000));
  if(host.point&&host.point.x>0&&host.point.x<host.point.width&&
   host.point.y>0&&host.point.y<host.point.height){
   const {x,y}=host.point;
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
   await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});
   await send('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});
   await sleep(800);
   const opened=await run(function(){return{
    visibleOptionText:[...document.querySelectorAll('[role="option"],.p-multiselect-item,.p-dropdown-item')].
     filter(e=>e.getBoundingClientRect().width>0).map(e=>e.innerText.slice(0,130)).slice(0,40),
    focused:document.activeElement?.outerHTML.slice(0,850),
    newInputs:[...document.querySelectorAll('input')].filter(e=>e.getBoundingClientRect().width>0).
      map(e=>({placeholder:e.placeholder,id:e.id,value:e.value,html:e.outerHTML.slice(0,440)})).slice(-20),
    pageTail:document.body?.innerText.slice(-1200)
   }});
   console.log('[LIVE '+name.toUpperCase()+' ACTUAL OPTIONS]',JSON.stringify(opened).slice(0,11000));
  }
  const controls=await run(function(){
   return {
    buttons:[...document.querySelectorAll('button,[role="button"]')].map((e,i)=>({
     i,text:(e.innerText||e.textContent||'').trim().slice(0,140),title:e.getAttribute('title'),
     html:e.outerHTML.slice(0,320)
    })).filter(x=>x.text).slice(-60),
    searches:[...document.querySelectorAll('input')].filter(e=>
      /search|spell|weapon/i.test((e.placeholder||'')+(e.getAttribute('aria-label')||''))).
      map(e=>({placeholder:e.placeholder,html:e.outerHTML.slice(0,500),
       parent:e.parentElement?.outerHTML.slice(0,750)})),
    tables:[...document.querySelectorAll('table,[role="grid"]')].map(e=>({head:e.innerText.slice(0,400),
      html:e.outerHTML.slice(0,300)})),
    buttonsWithShowTable:[...document.querySelectorAll('button')].filter(e=>
      /Show Table/i.test(e.innerText||e.textContent||'')).map(e=>e.outerHTML.slice(0,450))
   };
  });
  console.log('[LIVE '+name.toUpperCase()+' CONTROLS]',JSON.stringify(controls).slice(0,11000));
  const rect=await run(function(){
   const e=[...document.querySelectorAll('button,[role="button"]')].find(e=>
    (e.innerText||e.textContent||'').trim()==='Show Table');
   if(!e)return{found:false};
   e.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
   const b=e.getBoundingClientRect();
   return{found:true,x:b.left+b.width/2,y:b.top+b.height/2,inner:e.innerText,
    width:innerWidth,height:innerHeight,disabled:e.disabled,
    hit:document.elementFromPoint(b.left+b.width/2,b.top+b.height/2)?.closest('button')?.innerText};
  });
  if(rect.found&&!rect.disabled&&rect.hit?.trim()==='Show Table'&&
   rect.x>=0&&rect.x<rect.width&&rect.y>=0&&rect.y<rect.height){
   await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x,y:rect.y});
   await send('Input.dispatchMouseEvent',{type:'mousePressed',x:rect.x,y:rect.y,button:'left',clickCount:1});
   await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:rect.x,y:rect.y,button:'left',clickCount:1});
  }
  await sleep(1800);
  const after=await run(snapshot);
  const revealed=await run(function(){
   return{
    htmlTables:[...document.querySelectorAll('table,[role="grid"]')].map(e=>({
     text:e.innerText.slice(0,1400),rows:e.querySelectorAll('tr').length,
     hidden:e.closest('[hidden]')!==null
    })),
    textTail:document.body.innerText.slice(-4800),
    dialogs:[...document.querySelectorAll('[role=dialog],dialog')].map(x=>x.innerText.slice(0,800))
   }
  });
  const record={name,url,version:first.version,firstText:first.text.slice(-1300),
   openTablePointer:rect,afterText:after.text.slice(-2700),revealed,controls};
  results.pages.push(record);
  console.log('[LIVE '+name.toUpperCase()+' ACTUAL TABLE]',JSON.stringify({
   pointer:rect,table:revealed.htmlTables,dialogs:revealed.dialogs,
   tail:revealed.textTail
  }).slice(0,13000));
 }
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-damage-spell-actual-tables-v117.json'),
  JSON.stringify(results,null,2)+'\n');
 if(results.pages.some(x=>x.version!=='Elden Ring Version: v1.17'))
  throw Error('Version mismatch: cannot audit other reference');
}
try{await main()}finally{
 try{ws?.close()}catch{}try{chrome?.kill('SIGTERM')}catch{}
 await sleep(300);if(chrome?.exitCode===null)try{chrome.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
