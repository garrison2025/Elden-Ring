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
 await waitFor(
  'location.href==='+JSON.stringify(site+path)+'&&document.readyState==="complete"',
  'complete navigation '+path);
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
 await waitFor('document.querySelectorAll("#build-wield-rows tr").length===2',
  'Build shortlist must display per-candidate wield checks');
 assert.equal(await evaluate('document.querySelector("#build-wield-apply-one").disabled'),
  false,'Sourced shortlist should allow manual one-hand stat target');
 assert.equal(await evaluate(`document.querySelector('#stat-grid [data-stat="3"]').value`),
  '12','Samurai starting STR before wield target');
 await evaluate('document.querySelector("#build-wield-apply-one").click()');
 await waitFor(`document.querySelector('#stat-grid [data-stat="3"]').value==="31"`,
  'One-hand Greatsword requirement raised STR to 31');
 assert.equal(await evaluate('document.querySelector("#build-level").textContent'),
  '28','One-hand shortlist target should add 19 levels');
 await evaluate('document.querySelector("#reset-build").click()');
 await waitFor(`document.querySelector('#stat-grid [data-stat="3"]').value==="12"`,
  'Reset baseline before two-hand test');
 await evaluate('document.querySelector("#build-wield-apply-two").click()');
 await waitFor(`document.querySelector('#stat-grid [data-stat="3"]').value==="21"`,
  'Standard two-hand Greatsword target should only need STR 21');
 assert.equal(await evaluate('document.querySelector("#build-level").textContent'),
  '18','Two-hand shortlist target should add 9 levels');
 await evaluate('document.querySelector("#reset-build").click()');
 await waitFor('document.querySelector("#build-level").textContent==="9"',
  'Restore Samurai base Build for A/B test');
 // Real browser: pin A and compare live B without mutating saved Builds.
 await evaluate('document.querySelector("#build-ab-pin").click()');
 await waitFor('document.querySelector("#build-ab-results").hidden===false',
  'Build A/B panel becomes visible after pin');
 assert.equal(await evaluate('document.querySelectorAll("#build-ab-rows tr").length'),11,
  'A/B table must show 3 level/rune metrics and 8 attributes');
 assert.equal(await evaluate('document.querySelector("#build-ab-origin-a").textContent'),'Samurai');
 await evaluate(`(()=>{
  const vigor=document.querySelector('#stat-grid [data-stat="0"]');
  vigor.value=String(Number(vigor.value)+1);
  vigor.dispatchEvent(new Event('input',{bubbles:true}));
 })()`);
 await waitFor(`document.querySelectorAll('#build-ab-rows tr')[3]
   ?.lastElementChild?.textContent==='+1'`,'Vigor delta +1');
 assert.equal(await evaluate(`document.querySelectorAll('#build-ab-rows tr')[0]
  .lastElementChild.textContent`),'+1','Build B level +1 after Vigor increase');
 await evaluate(`(()=>{
  const cls=document.querySelector('#origin');cls.value='Wretch';
  cls.dispatchEvent(new Event('change',{bubbles:true}));
 })()`);
 await waitFor(`document.querySelector('#build-ab-origin-b').textContent==='Wretch'`,
  'Different-origin comparison');
 assert.equal(await evaluate('document.querySelector("#build-ab-origin-a").textContent'),'Samurai',
  'Pinned Build A must survive B origin change');
 await send('Emulation.setDeviceMetricsOverride',{
  width:375,height:812,deviceScaleFactor:1,mobile:true
 });
 const buildMobile=await evaluate(`({
  viewport:window.innerWidth,
  documentWidth:document.documentElement.scrollWidth,
  tableScrollable:document.querySelector('.build-ab-table')
   ?.closest('.table-wrap')?.scrollWidth>=
   document.querySelector('.build-ab-table')?.closest('.table-wrap')?.clientWidth,
  wieldScrollable:document.querySelector('.build-wield-table')
   ?.closest('.table-wrap')?.scrollWidth>=
   document.querySelector('.build-wield-table')?.closest('.table-wrap')?.clientWidth
 })`);
 assert.ok(buildMobile.documentWidth<=buildMobile.viewport+5,
  'Mobile Build comparison overflows page: '+JSON.stringify(buildMobile));
 assert.equal(buildMobile.tableScrollable,true);
 assert.equal(buildMobile.wieldScrollable,true);
 await send('Emulation.setDeviceMetricsOverride',{
  width:1280,height:850,deviceScaleFactor:1,mobile:false
 });
 // Keep the selected weapon shortlist intact after editing the Build.
 const shortlist=await evaluate('document.querySelectorAll("#build-smithing-list li").length');
 assert.equal(shortlist,2,'Two selected Build weapons must appear');
 const href=await evaluate('document.querySelector("#build-smithing-open").getAttribute("href")');
 assert.ok(href?.startsWith('/weapon-upgrade-calculator/?weapons='),
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

 // Separate fresh-browser journey: share pinned A plus edited B and verify that
 // re-opening the URL restores both source weapons and all live character stats.
 await send('Emulation.setDeviceMetricsOverride',{
  width:1280,height:850,deviceScaleFactor:1,mobile:false
 });
 await navigate('/build-planner/');
 await waitFor('document.querySelector("#build-weapon")?.disabled===false',
  'Build source catalog ready for A/B link share');
 await selectWeapon('Greatsword');
 await evaluate('document.querySelector("#build-ab-pin").click()');
 await selectWeapon('Uchigatana');
 await evaluate(`(()=>{
  const vigor=document.querySelector('#stat-grid [data-stat="0"]');
  vigor.value=String(Number(vigor.value)+1);
  vigor.dispatchEvent(new Event('input',{bubbles:true}));
 })()`);
 await evaluate('document.querySelector("#build-ab-share").click()');
 await waitFor('document.querySelector("#build-ab-share-url")?.value.includes("compare=")',
  'Shareable two-Build URL generated');
 const comparisonUrl=await evaluate('document.querySelector("#build-ab-share-url").value');
 assert.ok(comparisonUrl.startsWith(site+'/build-planner/'),
  'Share URL uses same origin and canonical planner path');
 const sharedParams=new URL(comparisonUrl);
 assert.equal(sharedParams.searchParams.get('origin'),'Samurai');
 assert.equal(sharedParams.searchParams.get('stats').split(',')[0],'13');
 assert.ok(sharedParams.searchParams.get('weapon'),'Build B source weapon ID required');
 await navigate(sharedParams.pathname+sharedParams.search);
 await waitFor(`document.querySelector('#build-ab-results')?.hidden===false&&
 document.querySelector('#build-ab-weapon-a')?.textContent.includes('Greatsword')&&
 document.querySelector('#build-ab-weapon-b')?.textContent.includes('Uchigatana')`,
 'Deep-linked A/B comparison restored with distinct source weapons');
 assert.equal(await evaluate('document.querySelector("#build-ab-origin-a").textContent'),
  'Samurai');
 assert.equal(await evaluate('document.querySelector("#build-ab-origin-b").textContent'),
  'Samurai');
 assert.equal(await evaluate(`document.querySelectorAll('#build-ab-rows tr')[3]
  .lastElementChild.textContent`),'+1');
 assert.equal(await evaluate(`document.querySelector('#stat-grid [data-stat="0"]').value`),'13');
 // Legacy single-build link still opens without pinning A.
 await navigate('/build-planner/?origin=Samurai&stats=12,11,13,12,15,9,8,8');
 await waitFor('document.querySelector("#build-ab-pin")!==null','Legacy Build link');
 assert.equal(await evaluate('document.querySelector("#build-ab-results").hidden'),
  true,'Legacy Build URL must not import a stale pinned baseline');


 // Source catalog candidates are NOT automatically equipped; players must
 // select six actual weapon slots and explicitly enter armor/talisman weights.
 await navigate('/build-planner/');
 await waitFor("document.querySelector('#build-weapon')?.disabled===false",
  'Build catalog for equipment candidate handoff');
 await selectWeapon('Uchigatana');
 await selectWeapon('Greatsword');
 const equipHref=await evaluate("document.querySelector('#build-equipment-open')?.getAttribute('href')");
 assert.ok(equipHref?.startsWith('/equip-load-calculator/?candidates='),
  'Build candidate handoff must not carry equipped slot declarations');
 const equipmentUrl=new URL(equipHref,site);
 assert.equal(equipmentUrl.searchParams.has('equipped'),false);
 await navigate(equipmentUrl.pathname+equipmentUrl.search);
 await waitFor("document.querySelector('#equipment-weapon-fields select')?.disabled===false",
  'Source equipment selection catalog ready');
 assert.equal(await evaluate("[...document.querySelectorAll('#equipment-weapon-fields select')].filter(n=>n.value!=='').length"),
  0,'Candidate list must never auto-equip weapons');
 assert.equal(await evaluate("document.querySelector('#equipment-tier').textContent"),'—',
  'Empty, unconfirmed loadout has no final roll tier');
 await evaluate("(()=>{const ids=new URLSearchParams(location.search).get('candidates').split(',');const s=[...document.querySelectorAll('#equipment-weapon-fields select')];s[0].value=ids[0];s[0].dispatchEvent(new Event('change',{bubbles:true}));s[3].value=ids[1];s[3].dispatchEvent(new Event('change',{bubbles:true}));const rows=[...document.querySelectorAll('#equipment-manual-fields .equipment-manual-row')];for(const [n,v] of [[0,'5.5'],[4,'']]){const kind=rows[n].querySelector('select');kind.value='equipped';kind.dispatchEvent(new Event('change',{bubbles:true}));if(v!==''){const weight=rows[n].querySelector('input');weight.value=v;weight.dispatchEvent(new Event('input',{bubbles:true}));}}const max=document.querySelector('#equipment-maximum');max.value='100';max.dispatchEvent(new Event('input',{bubbles:true}));const confirm=document.querySelector('#equipment-confirm');confirm.checked=true;confirm.dispatchEvent(new Event('change',{bubbles:true}));})()");
 assert.equal(await evaluate("document.querySelector('#equipment-tier').textContent"),'—',
  'A missing equipped talisman weight must block tier even when confirmed');
 assert.ok((await evaluate("document.querySelector('#equipment-unknown').textContent")).includes('Talisman 1'),
  'Show missing talisman weight explicitly');
 await evaluate("(()=>{const row=document.querySelectorAll('#equipment-manual-fields .equipment-manual-row')[4];const input=row.querySelector('input');input.value='0.5';input.dispatchEvent(new Event('input',{bubbles:true}));})()");
 assert.equal(await evaluate("document.querySelector('#equipment-confirm').checked"),false,
  'Editing any equipped item invalidates previous manual confirmation');
 await evaluate("(()=>{const n=document.querySelector('#equipment-confirm');n.checked=true;n.dispatchEvent(new Event('change',{bubbles:true}));})()");
 await waitFor("document.querySelector('#equipment-tier').textContent!=='—'",
  'Complete, explicitly confirmed equipment load produces tier');
 const total=Number(await evaluate("document.querySelector('#equipment-total').textContent"));
 const localCatalog=JSON.parse(await readFile(join(root,'data/community-weapon-catalog.json'),'utf8'));
 const equipmentIds=equipmentUrl.searchParams.get('candidates').split(',');
 const expected=localCatalog.weapons.filter(w=>equipmentIds.includes(w.id))
  .reduce((acc,w)=>acc+w.weight,0)+6;
 assert.ok(Math.abs(total-expected)<0.001,
  'Actual equipped weights summed once; expected '+expected+' got '+total);
 assert.equal(await evaluate("document.querySelector('#equipment-percent').textContent"),
  total.toFixed(2)+'%','Percentage must follow actual 100 max load');
 await send('Emulation.setDeviceMetricsOverride',{
  width:375,height:812,deviceScaleFactor:1,mobile:true
 });
 const mobileLoad=await evaluate("({width:window.innerWidth,scroll:document.documentElement.scrollWidth})");
 assert.ok(mobileLoad.scroll<=mobileLoad.width+5,
  '375px equipment page overflow: '+JSON.stringify(mobileLoad));
 await evaluate("document.querySelector('#equipment-clear').click()");
 assert.equal(await evaluate("document.querySelector('#equipment-tier').textContent"),'—',
  'Clear must remove confirmed tier');
 assert.equal(await evaluate("[...document.querySelectorAll('#equipment-weapon-fields select')].filter(n=>n.value!=='').length"),
  0,'Clear must unequip all selected weapons');

 assert.deepEqual(pageErrors,[], 'No uncaught page JavaScript errors expected');
 console.log('[BROWSER SMOKE] PASS: explicit slot-based equipped load and 375px mobile + wield shortlist targets/mobile + Build A/B pin/edit/share/reopen/origin/mobile + Build shortlist → Smithing import → confirmed levels → shared stock → save/reload/restore/delete + 375px mobile viewport');
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
