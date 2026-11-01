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
function clickCalculate(){
 const nodes=[...document.querySelectorAll('button,[role="button"],input[type="submit"]')];
 const el=nodes.find(x=>/^calculate$/i.test((x.innerText||x.textContent||x.value||'').trim()));
 if(!el)return {clicked:false,reason:'No Calculate button found',candidates:nodes.map(x=>(x.innerText||'').trim()).filter(Boolean).slice(-40)};
 if(el.disabled)return {clicked:false,reason:'Calculate disabled'};
 el.click();
 return {clicked:true,button:el.outerHTML.slice(0,440)};
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
 const cases=[
  {id:'tarnished-armor',url:'https://www.tarnished.dev/armor-optimizer'},
  {id:'our-armor',url:'https://elden-ring-5i9.pages.dev/armor-optimizer/'},
  {id:'tarnished-damage',url:'https://www.tarnished.dev/damage-calculator'},
  {id:'our-damage',url:'https://elden-ring-5i9.pages.dev/damage-calculator/'}
 ];
 const all=[];
 for(const c of cases){
  try{
   const before=await navigate(c.url);
   const click=c.id==='tarnished-armor'?await call(clickCalculate):{clicked:false,reason:'Read-only initial controls'};
   if(click.clicked)await sleep(7000);
   const after=click.clicked?await call(capture):null;
   all.push({...c,before,click,after});
   const change=after?(after.textTail!==before.textTail):null;
   console.log('[NEW PARITY BROWSER] '+JSON.stringify({id:c.id,url:before.url,title:before.title,
    version:before.version,head:before.textHead.slice(0,1100),
    initialTail:before.textTail.slice(-1800),afterTail:after?.textTail.slice(-3500)||null,
    buttons:before.buttons.map(x=>x.text).slice(-30),inputCount:before.inputs.length,
    selects:before.selects.length,click,changed:change}));
  }catch(err){all.push({...c,error:String(err.message)});console.error('[NEW PARITY BROWSER FAILURE] '+JSON.stringify({id:c.id,error:String(err.message)}));}
 }
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-remaining-live-ui.json'),JSON.stringify({date:'2026-11-01',
  scope:'Remaining functionality only; not prior 568 armor field audits',cases:all},null,2)+'\n');
 if(all.some(x=>x.error)||all.some(x=>x.before?.textLength<1800))throw Error('One or more live pages not fully observed');
}
try{await main()}finally{
 try{socket?.close()}catch{}
 try{chrome?.kill('SIGTERM')}catch{}
 await sleep(350);
 if(chrome?.exitCode===null)try{chrome.kill('SIGKILL')}catch{}
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
