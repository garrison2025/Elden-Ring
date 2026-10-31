/**
 * Zero-dependency real-browser acceptance smoke: Build -> weapon shortlist ->
 * Smithing -> shared inventory -> manual save/restore/delete, with mobile sizing.
 * Uses preinstalled Chrome/Chromium on GitHub's Ubuntu runner and localhost
 * static assets only. Does not contact any external service or game API.
 * Requires dist/ from npm run build. Node 22+ (native WebSocket).
 */
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {join,resolve,sep,extname} from 'node:path';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';

const root=resolve('dist');
const contentTypes={
 '.html':'text/html; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
 '.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8',
 '.css':'text/css; charset=utf-8','.svg':'image/svg+xml',
 '.png':'image/png','.ico':'image/x-icon'
};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,'http://localhost');
  let part=decodeURIComponent(u.pathname).replace(/^\/+/, '');
  if(!part||part.endsWith('/'))part+='index.html';
  const absolute=resolve(root,part);
  if(!absolute.startsWith(root+sep))throw Error('Invalid path');
  const body=await readFile(absolute);
  res.writeHead(200,{'Content-Type':contentTypes[extname(absolute)]||'application/octet-stream',
   'Cache-Control':'no-store'});
  res.end(body);
 }catch{
  res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');
 }
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chromePath=process.env.CHROME_BIN||
 ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser']
  .find(existsSync);
assert.ok(chromePath,'Browser acceptance requires the preinstalled Chrome/Chromium binary');
await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
const site='http://127.0.0.1:'+server.address().port;
const profile=await mkdtemp(join(tmpdir(),'elden-browser-'));
const chrome=spawn(chromePath,[
 '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-background-networking','--disable-extensions','--no-first-run',
 '--remote-debugging-address=127.0.0.1','--remote-debugging-port=9227',
 '--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'
],{stdio:'ignore'});
let socket=null,serial=0;
const pending=new Map();
const pageErrors=[];
async function connect(){
 let endpoint=null;
 for(let i=0;i<90;i++){
  if(chrome.exitCode!==null)throw Error('Chrome exited before CDP was ready');
  try{
   const resp=await fetch('http://127.0.0.1:9227/json/list');
   const list=await resp.json();
   endpoint=list.find(x=>x.type==='page')?.webSocketDebuggerUrl;
   if(endpoint)break;
  }catch{/* browser still starting */}
  await sleep(150);
 }
 assert.ok(endpoint,'Chrome CDP failed to open');
 socket=new WebSocket(endpoint);
 await new Promise((yes,no)=>{
  socket.addEventListener('open',yes,{once:true});
  socket.addEventListener('error',no,{once:true});
 });
 socket.addEventListener('message',event=>{
  const msg=JSON.parse(event.data);
  if(msg.method==='Runtime.exceptionThrown')
   pageErrors.push(msg.params?.exceptionDetails?.text||'Browser JavaScript exception');
  if(!msg.id)return;
  const entry=pending.get(msg.id);if(!entry)return;
  pending.delete(msg.id);clearTimeout(entry.timer);
  if(msg.error)entry.reject(Error(msg.error.message||'CDP command failed'));
  else entry.resolve(msg.result);
 });
}
function send(method,params={}){
 return new Promise((yes,no)=>{
  const id=++serial;
  const timer=setTimeout(()=>{pending.delete(id);no(Error('CDP timed out: '+method));},15000);
  pending.set(id,{resolve:yes,reject:no,timer});
  socket.send(JSON.stringify({id,method,params}));
 });
}
async function evaluate(expression){
 const data=await send('Runtime.evaluate',{
  expression,returnByValue:true,awaitPromise:true
 });
 if(data.exceptionDetails)throw Error(
  'Browser JS evaluation failed: '+(data.exceptionDetails.text||
   data.exceptionDetails.exception?.description||expression.slice(0,80)));
 return data.result?.value;
}
async function waitFor(expression,label){
 for(let i=0;i<120;i++){
  try{if(await evaluate(expression))return;}catch{/* page navigating */}
  await sleep(100);
 }
 throw Error('Browser wait failed: '+label);
}
async function navigate(path){
 await send('Page.navigate',{url:site+path});
 await waitFor('document.readyState==="complete"','load '+path);
}
async function selectWeapon(name){
 const result=await evaluate(`(()=>{
  const search=document.querySelector('#build-weapon-search');
  search.value=${JSON.stringify(name)};
  search.dispatchEvent(new Event('input',{bubbles:true}));
  const select=document.querySelector('#build-weapon');
  const item=[...select.options].find(x=>x.textContent.startsWith(${JSON.stringify(name+' ·')}));
  if(!item)return {error:'Weapon not in visible catalog options'};
  select.value=item.value;
  select.dispatchEvent(new Event('change',{bubbles:true}));
  const add=document.querySelector('#build-smithing-add');
  if(add.disabled)return {error:'Add selected button disabled'};
  add.click();
  return {count:document.querySelectorAll('#build-smithing-list li').length};
 })()`);
 assert.equal(result.error,undefined,name+' selection: '+result.error);
}
try{
 await connect();
 await send('Page.enable');await send('Runtime.enable');
 await navigate('/build-planner/');
 await waitFor('document.querySelector("#build-weapon")?.disabled===false',
  'Build Planner catalog ready');
 await selectWeapon('Uchigatana');
 await selectWeapon('Greatsword');
 const shortlist=await evaluate('document.querySelectorAll("#build-smithing-list li").length');
 assert.equal(shortlist,2,'Two selected Build weapons must appear');
 const href=await evaluate('document.querySelector("#build-smithing-open").getAttribute("href")');
 assert.ok(href?.startsWith('../weapon-upgrade-calculator/?weapons='),
  'Combined smithing link must carry source IDs only');
 const url=new URL(href,site+'/build-planner/');
 await navigate(url.pathname+url.search);
 await waitFor('document.querySelectorAll("#multi-weapon-rows tr[data-multi-row]").length===2',
  'Two source-matched Smithing rows restored');
 const imported=await evaluate(`[...document.querySelectorAll(
  '#multi-weapon-rows tr[data-multi-row]')].map(row=>({
   name:row.querySelector('[data-multi-field="name"]').value,
   track:row.querySelector('[data-multi-field="track"]').value,
   from:row.querySelector('[data-multi-field="from"]').value,
   to:row.querySelector('[data-multi-field="to"]').value
  }))`);
 assert.deepEqual(imported.map(x=>x.name),['Uchigatana','Greatsword']);
 for(const item of imported)assert.deepEqual(
  [item.track,item.from,item.to],['','',''],
  'Linked weapon must not inherit guessed track or player upgrade level');
 const before=await evaluate('document.querySelector("#multi-export").disabled');
 assert.equal(before,true,'Unconfirmed imported rows cannot export a made-up plan');
 await evaluate(`(()=>{
  const rows=[...document.querySelectorAll('#multi-weapon-rows tr[data-multi-row]')];
  for(const [index,row] of rows.entries()){
   const set=(field,value)=>{
    const element=row.querySelector('[data-multi-field="'+field+'"]');
    element.value=value;element.dispatchEvent(new Event('input',{bubbles:true}));
   };
   set('track','regular');set('from','0');set('to',index===0?'3':'6');
  }
 })()`);
 await waitFor('document.querySelector("#multi-total").textContent==="36"',
  '2-weapon +3/+6 aggregate stones');
 assert.equal(await evaluate('document.querySelector("#multi-missing").textContent'),
  '36','All stones missing with no owned inventory');
 await evaluate(`(()=>{
  const owned=document.querySelector('[data-multi-owned="regular-1"]');
  owned.value='5';owned.dispatchEvent(new Event('input',{bubbles:true}));
 })()`);
 await waitFor('document.querySelector("#multi-missing").textContent==="31"',
  'Shared stock deducted exactly once');
 await evaluate('document.querySelector("#multi-save-local").click()');
 const stored=await evaluate(`(()=>{
  const raw=localStorage.getItem('buildlab:smithing-basket:v1');
  return raw?JSON.parse(raw):null;
 })()`);
 assert.equal(stored?.weapons.length,2);
 assert.equal(stored.inventory['regular-1'],5);
 // Visit without handoff: saved data must never silently load into live rows.
 await navigate('/weapon-upgrade-calculator/');
 await waitFor('document.querySelector("#multi-save-local")!==null','Smithing reload');
 assert.equal(await evaluate('document.querySelectorAll("#multi-weapon-rows tr").length'),0,
  'Saved plans are not auto-restored');
 await evaluate('document.querySelector("#multi-load-local").click()');
 await waitFor('document.querySelectorAll("#multi-weapon-rows tr").length===2',
  'Explicit local restore');
 assert.equal(await evaluate('document.querySelector("#multi-total").textContent'),'36');
 assert.equal(await evaluate('document.querySelector("#multi-missing").textContent'),'31');
 await send('Emulation.setDeviceMetricsOverride',{
  width:375,height:812,deviceScaleFactor:1,mobile:true
 });
 const mobile=await evaluate(`({
  viewport:window.innerWidth,
  documentWidth:document.documentElement.scrollWidth,
  scrollableTables:[...document.querySelectorAll('.multi-upgrade-table')]
   .every(t=>t.closest('.table-wrap')?.scrollWidth>=t.closest('.table-wrap')?.clientWidth)
 })`);
 assert.ok(mobile.documentWidth<=mobile.viewport+5,
  'Mobile page overflows viewport: '+JSON.stringify(mobile));
 assert.equal(mobile.scrollableTables,true,'Mobile table scroll container missing');
 await evaluate('document.querySelector("#multi-delete-local").click()');
 assert.equal(await evaluate(`localStorage.getItem('buildlab:smithing-basket:v1')`),null);
 assert.equal(await evaluate('document.querySelectorAll("#multi-weapon-rows tr").length'),2,
  'Deleting saved copy must not erase onscreen draft');
 assert.deepEqual(pageErrors,[], 'No uncaught page JavaScript errors expected');
 console.log('[BROWSER SMOKE] PASS: Build shortlist → Smithing import → confirmed levels → shared stock → save/reload/restore/delete + 375px mobile viewport');
}catch(error){
 console.error('[BROWSER SMOKE] FAIL:',error.stack||error);
 process.exitCode=1;
}finally{
 for(const {timer,reject} of pending.values()){clearTimeout(timer);reject(Error('Browser terminated'));}
 pending.clear();
 try{socket?.close();}catch{}
 chrome.kill('SIGTERM');
 server.close();
 await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
