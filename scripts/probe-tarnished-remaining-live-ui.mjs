#!/usr/bin/env node
/**
 * Narrow READ-ONLY live browser probe for unverified Tarnished.dev optimizer behavior.
 * No old armor item/AR/Build-level audits rerun. Captures real DOM and attempts
 * one default Calculate; never fabricates results from documentation text.
 */
import {spawn} from 'node:child_process';
import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {waitForChromePage} from './browser-cdp-startup.mjs';
const chromePath=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable',
 '/usr/bin/chromium','/usr/bin/chromium-browser'].find(existsSync);
if(!chromePath)throw Error('Chromium not installed');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let chrome,profile,socket,seq=0;
const pending=new Map();
async function send(method,params={}){
 const id=++seq;
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},22000);
  pending.set(id,{resolve,reject,timer});
  socket.send(JSON.stringify({id,method,params}));
 });
}
async function call(fn,...args){
 const r=await send('Runtime.evaluate',{expression:'('+fn.toString()+')('+args.map(a=>JSON.stringify(a)).join(',')+')',returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error(r.exceptionDetails.text);
 return r.result?.value;
}
function capture(){
 const body=document.body?.innerText||'';
 const inputs=[...document.querySelectorAll('input')].map((el,i)=>({
  i,id:el.id||'',name:el.name||'',type:el.type||'',value:el.value,checked:el.checked,
  label:(el.closest('label')?.innerText||el.parentElement?.parentElement?.innerText||'').trim().slice(0,130),
  outer:el.outerHTML.slice(0,420)
 })).slice(0,190);
 const selects=[...document.querySelectorAll('select,.p-dropdown,.p-multiselect')].map((el,i)=>({
  i,tag:el.tagName,id:el.id||'',text:(el.innerText||'').trim().slice(0,160),
  parent:(el.parentElement?.innerText||'').trim().slice(0,210),
  html:el.outerHTML.slice(0,360)
 })).slice(0,75);
 const buttons=[...document.querySelectorAll('button,[role="button"]')].map((el,i)=>({
  i,text:(el.innerText||el.getAttribute('aria-label')||'').trim().slice(0,95),
  html:el.outerHTML.slice(0,300)
 })).filter(b=>b.text).slice(0,130);
 const tail=body.slice(-13500);
 return {
  url:location.href,title:document.title,ready:document.readyState,
  version:(body.match(/Elden Ring Version:[^\n]*/)||[])[0]||'',
  textLength:body.length,textHead:body.slice(0,7800),textTail:tail,
  inputs,selects,buttons
 };
}

function changeNumber(id,value){
 const e=document.getElementById(id);if(!e)return {ok:false,why:'missing'};
 const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
 setter.call(e,String(value));
 e.dispatchEvent(new Event('input',{bubbles:true}));
 e.dispatchEvent(new Event('change',{bubbles:true}));
 return {ok:true,value:e.value};
}
function poiseOnly(){
 const results=[];
 for(const e of document.querySelectorAll('input[id$="_multiplier"]')){
  if(e.id==='poise_multiplier')continue;
  const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')?.set;
  setter.call(e,'0');
  e.dispatchEvent(new Event('input',{bubbles:true}));
  e.dispatchEvent(new Event('change',{bubbles:true}));
  results.push({name:e.id,value:e.value});
 }
 return results;
}
function buttonRect(label){
 const nodes=[...document.querySelectorAll('button,[role="button"]')];
 const el=nodes.find(x=>(x.innerText||x.textContent||'').trim()===label);
 if(!el)return {found:false,reason:'Button missing',label};
 if(el.disabled)return {found:false,reason:'Button disabled',label};
 el.scrollIntoView({behavior:'instant',block:'center',inline:'center'});
 const r=el.getBoundingClientRect();
 const x=r.x+r.width/2,y=r.y+r.height/2;const target=document.elementFromPoint(x,y)?.closest('button');return {found:true,label,x,y,width:innerWidth,height:innerHeight,hit:(target?.innerText||'').trim(),html:el.outerHTML.slice(0,260)};
}
async function trustedClick(label){
 const r=await call(buttonRect,label);
 if(!r.found)return r;
 if(r.x<0||r.x>=r.width||r.y<0||r.y>=r.height||r.hit!==label)return {...r,clicked:false,reason:'Missed viewport target; abort click'};
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:r.x,y:r.y});
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x:r.x,y:r.y,button:'left',clickCount:1});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:r.x,y:r.y,button:'left',clickCount:1});
 return {...r,clicked:true};
}
async function configureOurArmor(){
 const fields=[['maxLoad','48.176'],['reservedWeight','0'],['minPoise','0']];
 const changes=await call(function(fields){
  return fields.map(([id,value])=>{
   const e=document.getElementById(id);if(!e)return{id,error:'missing'};
   const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
   setter.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));
   return{id,value:e.value};
  });
 },fields);
 const load=await trustedClick('Load pinned 568-item public armor reference');
 await sleep(6500);
 const loaded=await call(function(){return{status:document.getElementById('armor-full-status')?.innerText,
  runDisabled:document.getElementById('armor-full-run')?.disabled,
  count:document.getElementById('armor-full-slot-head')?.options?.length};});
 let run={found:false,reason:'not ready'};
 if(!loaded.runDisabled)run=await trustedClick('Optimize selected combat metric under my weight limit');
 if(run.clicked)await sleep(14000);
 const result=await call(function(){return{
  status:document.getElementById('armor-full-status')?.innerText,
  heading:document.getElementById('armor-full-heading')?.innerText,
  details:document.getElementById('armor-full-details')?.innerText,
  rows:[...(document.getElementById('armor-full-rows')?.querySelectorAll('tr')||[])].map(e=>e.innerText),
  hidden:document.getElementById('armor-full-results')?.hidden,
  maxLoad:document.getElementById('maxLoad')?.value,
  reservedWeight:document.getElementById('reservedWeight')?.value,
  minPoise:document.getElementById('minPoise')?.value,
  metric:document.getElementById('armor-full-metric')?.value,
  siteOnly:document.getElementById('armor-full-site-only')?.checked
 };});
 return {changes,load,loaded,run,result};
}
async function navigate(url){
 await send('Page.navigate',{url});
 await sleep(3600);
 let snap=await call(capture);
 if(snap.textLength<1800){await sleep(3200);snap=await call(capture);}
 return snap;
}
async function main(){
 profile=await mkdtemp(join(tmpdir(),'tarnished-remaining-'));
 chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu',
 '--disable-dev-shm-usage','--disable-extensions','--no-first-run',
 '--disable-background-networking','--remote-debugging-address=127.0.0.1',
 '--remote-debugging-port=0','--remote-allow-origins=*',
 '--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
 const endpoint=await waitForChromePage({profile,readText:readFile,request:fetch,
  getExitReason:()=>chrome.exitCode!==null?'Chrome exit '+chrome.exitCode:null});
 socket=new WebSocket(endpoint);
 await new Promise((resolve,reject)=>{
  const t=setTimeout(()=>reject(Error('CDP open timeout')),13000);
  socket.addEventListener('open',()=>{clearTimeout(t);resolve()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(t);reject(Error('CDP open error'))},{once:true});
 });
 socket.addEventListener('message',e=>{
  const m=JSON.parse(e.data),p=pending.get(m.id);if(!p)return;
  pending.delete(m.id);clearTimeout(p.timer);
  if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result);
 });
 await send('Runtime.enable');await send('Page.enable');
 const cases=[{id:'tarnished-armor',url:'https://www.tarnished.dev/armor-optimizer'}];
 const all=[];
 for(const c of cases){
  try{
   const before=await navigate(c.url);
   let configuration=null,click={clicked:false,reason:'Control read only'};
   if(c.id==='tarnished-armor'){
    await call(function(){window.__armorClickEvents=[];document.addEventListener('click',e=>window.__armorClickEvents.push({at:Date.now(),trusted:e.isTrusted,button:(e.target.closest('button')?.innerText||'').trim()}),true)});
    configuration=await call(function(){return [...document.querySelectorAll('input[id$="_multiplier"]')].map(e=>({id:e.id,value:e.value}))});
    await sleep(650);
    click=await trustedClick('Calculate Best Armor');
    if(click.clicked){
     const checks=[];
     for(let n=0;n<8;n++){
      await sleep(6000);
      const snapshot=await call(capture);
      const progress=await call(function(){const b=[...document.querySelectorAll('button')].find(x=>(x.innerText||'').trim()==='Calculate Best Armor');return{
       buttonDisabled:b?.disabled,buttonHtml:b?.outerHTML.slice(0,500),armorWeight:document.getElementById('curr-equip')?.value,
       pageTextLength:document.body?.innerText?.length,
       poiseMultiplier:document.getElementById('poise_multiplier')?.value,
       physicalMultiplier:document.getElementById('physical_absorption_multiplier')?.value,
       dialogs:[...document.querySelectorAll('[role="dialog"],.p-toast,.p-progress-spinner')].map(x=>x.innerText?.slice(0,600))
      };});
      checks.push({afterSeconds:(n+1)*6,textChanged:snapshot.textTail!==before.textTail,progress,tail:snapshot.textTail.slice(-700)});
      if(snapshot.textTail!==before.textTail)break;
     }
     configuration={poiseOnly:configuration,checks};
    }
   }
   if(c.id==='our-armor'){
    configuration=await configureOurArmor();
    click=configuration.run;
   }
   const after=click.clicked?await call(capture):null;
   const targets=c.id==='tarnished-armor'?((await send('Target.getTargets')).targetInfos||[]).map(t=>({type:t.type,url:t.url,title:t.title})):null;
   const clickEvents=c.id==='tarnished-armor'?await call(function(){return window.__armorClickEvents||[]}):null;
   all.push({...c,before,configuration,click,clickEvents,targets,after});
   const change=after?(after.textTail!==before.textTail):null;
   console.log('[NEW PARITY BROWSER] '+JSON.stringify({id:c.id,url:before.url,title:before.title,
    version:before.version,head:before.textHead.slice(0,1100),
    initialTail:before.textTail.slice(-1800),afterTail:after?.textTail.slice(-3500)||null,
    buttons:before.buttons.map(x=>x.text).slice(-30),inputs:before.inputs.map(x=>({id:x.id,value:x.value,checked:x.checked,label:x.label.slice(0,62)})).slice(0,c.id==='tarnished-armor'?95:12),inputCount:before.inputs.length,
    selects:before.selects.slice(0,c.id==='tarnished-armor'?35:4).map(x=>({id:x.id,text:x.text,parent:x.parent})),configuration,click,clickEvents,targets,changed:change}));
  }catch(err){all.push({...c,error:String(err.message)});console.error('[NEW PARITY BROWSER FAILURE] '+JSON.stringify({id:c.id,error:String(err.message)}));}
 }
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-remaining-live-ui.json'),JSON.stringify({date:'2026-11-01',
  scope:'Remaining functionality only; not prior 568 armor field audits',cases:all},null,2)+'\n');
 if(all.some(x=>x.error)||all.some(x=>x.before?.textLength<300))throw Error('One or more live pages not fully observed');
}
try{await main()}finally{
 try{socket?.close()}catch{}
 try{chrome?.kill('SIGTERM')}catch{}
 await sleep(350);
 if(chrome?.exitCode===null)try{chrome.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
