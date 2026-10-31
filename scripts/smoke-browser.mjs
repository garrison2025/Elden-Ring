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
import {waitForChromePage} from './browser-cdp-startup.mjs';

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
let chrome=null,profile=null,socket=null,serial=0;
const pending=new Map();
const pageErrors=[];
const maxDiagnostics=1000;
async function stopChrome(child){
 if(child.exitCode!==null||child.signalCode!==null)return;
 const stopped=new Promise(resolve=>child.once('close',resolve));
 child.kill('SIGTERM');
 await Promise.race([stopped,sleep(1200)]);
 if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');
}
async function connect(){
 const failures=[];
 // Retry only Chrome startup; a failed game-tool assertion is NEVER retried
 // or suppressed. Ephemeral debugging port avoids collisions in shared CI.
 for(let attempt=1;attempt<=2;attempt++){
  const dir=await mkdtemp(join(tmpdir(),'elden-browser-'));
  const candidate=spawn(chromePath,[
   '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
   '--disable-background-networking','--disable-extensions','--no-first-run',
   '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',
   '--remote-allow-origins=*','--user-data-dir='+dir,'about:blank'
  ],{stdio:['ignore','ignore','pipe']});
  let stderr='',spawnError=null;
  candidate.stderr?.on('data',data=>{
   stderr=(stderr+String(data)).slice(-maxDiagnostics);
  });
  candidate.on('error',error=>{spawnError=error;});
  try{
   const endpoint=await waitForChromePage({
    profile:dir,readText:readFile,request:fetch,
    getExitReason:()=>spawnError?.message||
     (candidate.exitCode!==null?'exit code '+candidate.exitCode:null)||
     (candidate.signalCode?'signal '+candidate.signalCode:null)
   });
   socket=new WebSocket(endpoint);
   let timer;
   try{
    await new Promise((yes,no)=>{
     timer=setTimeout(()=>no(Error('Chrome CDP WebSocket open timeout')),10000);
     socket.addEventListener('open',yes,{once:true});
     socket.addEventListener('error',()=>no(Error('Chrome CDP WebSocket error')),{once:true});
     socket.addEventListener('close',()=>no(Error('Chrome CDP WebSocket closed early')),{once:true});
    });
   }finally{clearTimeout(timer);}
   chrome=candidate;profile=dir;
   console.log('[BROWSER SMOKE] Chrome CDP started on assigned ephemeral port (attempt '+attempt+').');
   break;
  }catch(error){
   const note='attempt '+attempt+': '+String(error?.message??error).slice(0,250)+
    (stderr?' | Chrome stderr: '+stderr.replace(/\s+/g,' ').slice(-700):'');
   failures.push(note);
   console.warn('[BROWSER SMOKE] Startup retry diagnostic: '+note);
   try{socket?.close();}catch{}
   socket=null;
   await stopChrome(candidate);
   await rm(dir,{recursive:true,force:true}).catch(()=>{});
   if(attempt===2)throw Error('Chrome startup failed after two bounded attempts: '+failures.join(' || '));
  }
 }
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


 // Real Chrome A/B equipment journey: save a confirmed setup; reload as
 // unconfirmed (never silently grant a roll tier); pin and edit slot-by-slot.
 await send('Emulation.setDeviceMetricsOverride',{
  width:1280,height:850,deviceScaleFactor:1,mobile:false
 });
 await navigate('/equip-load-calculator/');
 await waitFor("document.querySelector('#equipment-weapon-fields select')?.disabled===false",
  'Equipment catalog ready for local save');
 await evaluate("(()=>{const sel=document.querySelector('#equipment-weapon-fields select');const match=[...sel.options].find(x=>x.textContent.startsWith('Uchigatana '));if(!match)throw Error('Uchigatana missing');sel.value=match.value;sel.dispatchEvent(new Event('change',{bubbles:true}));const row=document.querySelector('#equipment-manual-fields .equipment-manual-row');const status=row.querySelector('select');status.value='equipped';status.dispatchEvent(new Event('change',{bubbles:true}));const weight=row.querySelector('input');weight.value='5.5';weight.dispatchEvent(new Event('input',{bubbles:true}));const maximum=document.querySelector('#equipment-maximum');maximum.value='100';maximum.dispatchEvent(new Event('input',{bubbles:true}));const check=document.querySelector('#equipment-confirm');check.checked=true;check.dispatchEvent(new Event('change',{bubbles:true}));})()");
 await waitFor("document.querySelector('#equipment-tier').textContent!=='—'",
  'Explicitly confirmed initial loadout');
 await evaluate("document.querySelector('#equipment-save').click()");
 await waitFor("document.querySelector('#equipment-save-feedback').textContent.includes('Equipment saved')",
  'Save equipment on user action');
 const rawEquip=await evaluate("localStorage.getItem('buildlab:equipment-plan:v1')");
 assert.equal(JSON.parse(rawEquip).confirmed,false,
  'Saved equipment never preserves confirmed roll status');
 await navigate('/equip-load-calculator/');
 await waitFor("document.querySelector('#equipment-weapon-fields select')?.disabled===false",
  'Fresh equipment page after local save');
 assert.equal(await evaluate("document.querySelector('#equipment-weapon-fields select').value"),'',
  'Saved equipment must never auto-restore');
 await evaluate("document.querySelector('#equipment-restore').click()");
 await waitFor("document.querySelector('#equipment-manual-fields .equipment-manual-row input').value==='5.5'",
  'Explicit saved equipment restore');
 assert.equal(await evaluate("document.querySelector('#equipment-confirm').checked"),false,
  'Restoring equipment must require new game confirmation');
 assert.equal(await evaluate("document.querySelector('#equipment-tier').textContent"),'—',
  'Restored equipment cannot carry forward an old roll tier');
 await evaluate("document.querySelector('#equipment-ab-from-save').click()");
 await waitFor("document.querySelector('#equipment-ab-results').hidden===false",
  'Saved gear pinned as A without overwriting B');
 assert.equal(await evaluate("document.querySelectorAll('#equipment-ab-rows tr').length"),
  14,'Six weapon and eight manual gear slots shown in A/B comparison');
 await evaluate("(()=>{const sel=document.querySelector('#equipment-weapon-fields select');const target=[...sel.options].find(x=>x.textContent.startsWith('Greatsword '));if(!target)throw Error('Greatsword missing');sel.value=target.value;sel.dispatchEvent(new Event('change',{bubbles:true}));const input=document.querySelector('#equipment-manual-fields .equipment-manual-row input');input.value='7.5';input.dispatchEvent(new Event('input',{bubbles:true}));})()");
 await waitFor("document.querySelector('#equipment-ab-difference').textContent.includes('2 of 14 equipped slots changed')",
  'A/B accurately counts two changed actual equipment slots');
 assert.ok((await evaluate("document.querySelector('#equipment-ab-difference').textContent")).includes(
  'Both plans must be explicitly confirmed'), 'Unconfirmed saved A cannot claim roll tier');
 const abRows=await evaluate("[...document.querySelectorAll('#equipment-ab-rows tr')].filter(r=>r.classList.contains('equipment-ab-changed')).map(r=>r.querySelector('th').textContent)");
 assert.deepEqual(abRows,['Right hand 1','Head armor']);
 await send('Emulation.setDeviceMetricsOverride',{
  width:375,height:812,deviceScaleFactor:1,mobile:true
 });
 const compareMobile=await evaluate("({width:window.innerWidth,documentWidth:document.documentElement.scrollWidth,scrollable:document.querySelector('.equipment-ab-table').closest('.table-wrap').scrollWidth>=document.querySelector('.equipment-ab-table').closest('.table-wrap').clientWidth})");
 assert.ok(compareMobile.documentWidth<=compareMobile.width+5,
  'Mobile equipment A/B page exceeds viewport: '+JSON.stringify(compareMobile));
 assert.equal(compareMobile.scrollable,true,'A/B comparison table must scroll on phone');
 await evaluate("document.querySelector('#equipment-delete-save').click()");
 assert.equal(await evaluate("localStorage.getItem('buildlab:equipment-plan:v1')"),null,
  'Delete saved equipment clears only browser record');
 assert.equal(await evaluate("document.querySelector('#equipment-ab-results').hidden"),false,
  'Deleting saved equipment must preserve on-screen A/B comparison');

 // Browser-visible source audit must match the exact static JSON and
 // contain unresolved source flags without implying game-client certification.
 await send('Emulation.setDeviceMetricsOverride',{
  width:1280,height:850,deviceScaleFactor:1,mobile:false
 });
 await navigate('/validation-status/');
 await waitFor('document.querySelector("#catalog-evidence")!==null',
  'Data-quality audit section rendered by production build');
 const evidenceStatus=await evaluate(`(async()=>{
  const json=await (await fetch('../catalog-evidence.json')).json();
  const page=document.querySelector('#catalog-evidence').textContent;
  const row=document.querySelector('[data-catalog-audit-row]').textContent;
  const robots=document.querySelector('meta[name="robots"]')?.content;
  return {count:json.counts.total,dlc:json.counts.dlc,
   attackConflicts:json.counts.attackSourceConflicts,
   requirementConflicts:json.counts.requirementSourceConflicts,
   conflictRows:document.querySelectorAll('#catalog-evidence table')[1].querySelectorAll('tbody tr').length,
   pageMatches:page.includes(String(json.counts.total))&&
    page.includes('not game-client QA')&&
    row.includes(String(json.counts.total)),
   robots};
 })()`);
 assert.equal(evidenceStatus.count,487,'Built catalog status must match source');
 assert.equal(evidenceStatus.dlc,102);
 assert.equal(evidenceStatus.attackConflicts,6);
 assert.equal(evidenceStatus.requirementConflicts,1);
 assert.equal(evidenceStatus.conflictRows,7);
 assert.equal(evidenceStatus.pageMatches,true,
  'Accuracy page should explain counts and game-client verification limits');
 assert.equal(evidenceStatus.robots,'noindex,nofollow');
 const conflictStatus=await evaluate(`(async()=>{
  const evidence=await(await fetch('../data/weapon-conflict-evidence.json')).json();
  const panel=document.querySelector('#conflict-dossier');
  const rows=[...panel.querySelectorAll('tbody tr')].map(t=>t.textContent);
  return {
   present:!!panel,number:rows.length,sourceCount:evidence.cases.length,
   unverified:evidence.verification.gameClientVerified===false&&
    evidence.verification.acceptedCurrentGameScreenshots===0,
   madding:rows.find(s=>s.includes('Madding Hand'))?.includes('FAI: 13 / 20'),
   smithscript:rows.find(s=>s.includes('Smithscript Axe'))?.includes('PHY: 133 / 131'),
   sourceLinks:panel.querySelectorAll('a[href^="https://"]').length,
   explicitDisclaimer:panel.textContent.includes('not character AR')&&
    panel.textContent.includes('UNREVIEWED')
  };
 })()`);
 assert.equal(conflictStatus.present,true);
 assert.equal(conflictStatus.number,7);
 assert.equal(conflictStatus.sourceCount,7);
 assert.equal(conflictStatus.unverified,true);
 assert.equal(conflictStatus.madding,true);
 assert.equal(conflictStatus.smithscript,true);
 assert.ok(conflictStatus.sourceLinks>=15,'Seven per-weapon source links must be rendered');
 assert.equal(conflictStatus.explicitDisclaimer,true);

 // End-to-end local seven-conflict compact-file probe: a synthetic browser
 // fixture must compare all 7 without claiming game file or screenshot proof.
 await waitFor("document.querySelector('#reg-seven-run')?.disabled===false",
  'Local seven-conflict file comparator worker ready');
 await evaluate(`(async()=>{
  const [cat,ledger]=await Promise.all([
   fetch('../data/community-weapon-catalog.json').then(x=>x.json()),
   fetch('../data/weapon-conflict-evidence.json').then(x=>x.json())
  ]);
  const names=new Map(cat.weapons.map(w=>[w.id,w.name]));
  const root={weapons:ledger.cases.map(x=>({
   name:names.get(x.id),affinityId:0,reinforceTypeId:1,
   attack:x.field==='baseAttack'?x.pinned.map((v,i)=>[i,v]).filter(p=>p[1]>0):[[0,10]],
   requirements:x.field==='requirements'?
    Object.fromEntries(['str','dex','int','fai','arc'].map((k,i)=>[k,x.pinned[i]])):
    {str:10}
  })),reinforceTypes:{1:[{attack:{0:1,1:1,2:1,3:1,4:1}}]}};
  const transfer=new DataTransfer();
  transfer.items.add(new File([JSON.stringify(root)],'fixture-SYNTHETIC.json',{type:'application/json'}));
  document.querySelector('#reg-seven-file').files=transfer.files;
  document.querySelector('#reg-seven-app').value='1.17.2';
  document.querySelector('#reg-seven-regulation').value='1.17.3';
  document.querySelector('#reg-seven-source').value='SYNTHETIC browser test, NOT actual game data';
  document.querySelector('#reg-seven-run').click();
 })()`);
 await waitFor("document.querySelector('#reg-seven-results')?.hidden===false",
  'Synthetic seven-weapon compact file comparison completed in isolated browser worker');
 const localProbe=await evaluate(`(()=>{
  const root=document.querySelector('#reg-seven-results');
  return {rows:root.querySelectorAll('tbody tr').length,
   pinned:document.querySelector('#reg-seven-summary').textContent.includes('7 match pinned 1.17'),
   unreviewed:document.querySelector('#reg-seven-version').textContent.includes('Game verified: NO'),
   noUpload:document.querySelector('#reg-seven-audit').textContent.includes('No upload'),
   downloadable:document.querySelector('#reg-seven-download').disabled===false};
 })()`);
 assert.equal(localProbe.rows,7);
 assert.equal(localProbe.pinned,true);
 assert.equal(localProbe.unreviewed,true);
 assert.equal(localProbe.noUpload,true);
 assert.equal(localProbe.downloadable,true);
 await evaluate("document.querySelector('#reg-seven-clear').click()");
 assert.equal(await evaluate("document.querySelector('#reg-seven-results').hidden"),true);
 assert.equal(await evaluate("document.querySelector('#reg-seven-file').files.length"),0);

 // Synthetic FILE HANDLING smoke only (not real gameplay evidence). The
 // fingerprint library reads local PNG-like bytes, never image uploads.
 await waitFor("document.querySelector('#conflict-capture-case')?.disabled===false",
  'Seven-case manual observation form sourced from local JSON');
 assert.equal(await evaluate("document.querySelector('#conflict-capture-case').options.length"),
  7,'Exactly seven source-dispute evidence cases selectable');
 assert.equal(await evaluate("document.querySelector('#conflict-capture-case').selectedOptions[0].textContent.includes('Madding Hand')"),
  true,'High-priority requirements case should be first');
 assert.equal(await evaluate("document.querySelectorAll('#conflict-capture-values input').length"),
  5,'Five independently typed observed components required');
 assert.equal(await evaluate("document.querySelector('#conflict-capture-count').textContent.includes('0 / 7')"),
  true,'No actual game evidence may be fabricated or prefilled');
 // Clicking without game evidence must not record a case.
 await evaluate("document.querySelector('#conflict-capture-add').click()");
 await waitFor("document.querySelector('#conflict-capture-feedback').textContent.includes('not recorded')",
  'Missing screenshots explicitly rejected');
 assert.equal(await evaluate("document.querySelector('#conflict-capture-count').textContent.includes('0 / 7')"),
  true,'Rejected observation must not advance even local collection count');
 await evaluate(`(()=>{
  const fields=document.querySelectorAll('#conflict-capture-values input');
  [8,8,13,13,0].forEach((n,i)=>{fields[i].value=String(n);
   fields[i].dispatchEvent(new Event('input',{bubbles:true}));});
  const set=(id,value)=>{const input=document.getElementById('conflict-capture-'+id);
   input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));};
  set('app','1.17.2');set('regulation','1.17.3');
  set('platform','PC / Windows');set('date','2026-10-31');
  for(const name of ['plus-zero','default','details']){
   document.getElementById('conflict-capture-'+name).checked=true;
  }
  const png=[137,80,78,71,13,10,26,10];
  const assign=(id,tag,filename)=>{
   // Dummy signature bytes below exercise plumbing only. NOT game images.
   const bytes=new Uint8Array([...png,...Array.from({length:22},(_,i)=>i+tag)]);
   const file=new File([bytes],filename,{type:'image/png'});
   const transfer=new DataTransfer();transfer.items.add(file);
   document.getElementById('conflict-capture-'+id).files=transfer.files;
  };
  assign('title-image',2,'synthetic-title.png');
  assign('weapon-image',7,'synthetic-weapon.png');
 })()`);
 await evaluate("document.querySelector('#conflict-capture-add').click()");
 await waitFor("document.querySelector('#conflict-capture-feedback').textContent.includes('Recorded Madding Hand')",
  'Local two-image SHA256 and one unreviewed observation');
 const captureStatus=await evaluate(`({
  count:document.querySelector('#conflict-capture-count').textContent,
  feedback:document.querySelector('#conflict-capture-feedback').textContent,
  row:[...document.querySelectorAll('#conflict-capture-progress tr')]
   .find(x=>x.textContent.includes('Madding Hand'))?.textContent,
  noUploads:document.querySelector('#conflict-capture').textContent.includes('not uploaded')
 })`);
 assert.ok(captureStatus.count.includes('1 / 7'));
 assert.ok(captureStatus.count.includes('0 independently reviewed'));
 assert.ok(captureStatus.row.includes('matches-community-source'));
 assert.ok(captureStatus.row.includes('UNREVIEWED'));
 assert.ok(captureStatus.feedback.includes('NOT verified gameplay'));
 assert.equal(captureStatus.noUploads,true);
 await evaluate("document.querySelector('#conflict-capture-export').click()");
 await waitFor("document.querySelector('#conflict-capture-feedback').textContent.includes('Downloaded an UNREVIEWED 1/7')",
  'Browser-local evidence bundle export, explicitly unreviewed');
 await send('Emulation.setDeviceMetricsOverride',{
  width:375,height:812,deviceScaleFactor:1,mobile:true
 });
 const formMobile=await evaluate(`({width:window.innerWidth,documentWidth:document.documentElement.scrollWidth})`);
 assert.ok(formMobile.documentWidth<=formMobile.width+5,
  '375px screenshot evidence form overflows page: '+JSON.stringify(formMobile));
 await evaluate("document.querySelector('#conflict-capture-clear').click()");
 assert.equal(await evaluate("document.querySelector('#conflict-capture-count').textContent.includes('0 / 7')"),
  true,'Clear collection must delete the in-memory draft');



 // Fully local synthetic file plumbing: create an UNREVIEWED seven-case
 // JSON via the same writer, re-import it, and compare two local image byte
 // digests. This does NOT fabricate real in-game observations.
 await waitFor("document.querySelector('#conflict-recheck-import')?.disabled===false",
  'Seven-case source evidence reimport ready');
 const syntheticJson=await evaluate(`(async()=>{
  const source=await(await fetch('../data/weapon-conflict-evidence.json')).json();
  const catalog=await(await fetch('../data/community-weapon-catalog.json')).json();
  const capture=await import('../src/conflict-game-capture.mjs');
  const fingerprints=await import('../src/ar-screenshot-fingerprint.mjs');
  const signature=[137,80,78,71,13,10,26,10];
  const file=(tag,name)=>new File([new Uint8Array(
   [...signature,...Array.from({length:22},(_,i)=>i+tag)])],
   name,{type:'image/png'});
  const title=file(2,'synthetic-title.png');
  const weapon=file(7,'synthetic-weapon.png');
  const [a,b]=await Promise.all([
   fingerprints.fingerprintLocalScreenshot(title),
   fingerprints.fingerprintLocalScreenshot(weapon)
  ]);
  const draft=capture.makeConflictCaptureDraft(source,catalog,{
   caseId:'sote-reference-051',observed:[8,8,13,13,0],
   appVersion:'1.17.2',regulationVersion:'1.17.3',
   platform:'PC / Windows',observedAt:'2026-10-31',
   checkedPlusZero:true,checkedDefaultAffinity:true,
   checkedWeaponDetails:true,titleScreenshot:a,weaponScreenshot:b
  });
  return JSON.stringify(capture.bundleConflictCaptureDrafts(source,catalog,[draft]),null,2);
 })()`);
 assert.ok(syntheticJson.includes('UNREVIEWED')&&
  !syntheticJson.includes('"gameClientVerified": true'),
  'Only unreviewed synthetic file metadata may enter browser smoke');
 await evaluate(`(()=>{
  const json=${JSON.stringify(syntheticJson)};
  const file=new File([json],'synthetic-UNREVIEWED-checklist.json',{type:'application/json'});
  const dt=new DataTransfer();dt.items.add(file);
  document.querySelector('#conflict-recheck-json').files=dt.files;
  document.querySelector('#conflict-recheck-import').click();
 })()`);
 await waitFor("document.querySelector('#conflict-recheck-feedback').textContent.includes('structure and source readings revalidated')",
  'Previously exported seven-case checklist imported and re-derived');
 assert.equal(await evaluate("document.querySelector('#conflict-recheck-summary').textContent.includes('1 unreviewed player transcription')"),
  true);
 assert.equal(await evaluate("document.querySelector('#conflict-recheck-case').options.length"),
  1,'Only captured case eligible for original image recheck');
 await evaluate("document.querySelector('#conflict-recheck-hashes').click()");
 await waitFor("document.querySelector('#conflict-recheck-hash-result').textContent.includes('failed')",
  'Cannot validate originals when user has not reselected files');
 await evaluate(`(()=>{
  const header=[137,80,78,71,13,10,26,10];
  const attach=(id,tag)=>{
   const file=new File([new Uint8Array([...header,...Array.from(
    {length:22},(_,i)=>i+tag)])],'original-'+tag+'.png',{type:'image/png'});
   const dt=new DataTransfer();dt.items.add(file);
   document.querySelector('#conflict-recheck-'+id).files=dt.files;
  };
  attach('title-file',2);attach('weapon-file',7);
  document.querySelector('#conflict-recheck-hashes').click();
 })()`);
 await waitFor("document.querySelector('#conflict-recheck-hash-result').textContent.includes('Both original files match imported bytes')",
  'Both reselected synthetic originals match imported SHA256 fingerprints');
 assert.ok((await evaluate("document.querySelector('#conflict-recheck-hash-result').textContent")).includes('UNREVIEWED'));
 await evaluate(`(()=>{
  const header=[137,80,78,71,13,10,26,10];
  const bad=new File([new Uint8Array([...header,...Array.from(
   {length:22},(_,i)=>i+23)])],'altered-weapon.png',{type:'image/png'});
  const dt=new DataTransfer();dt.items.add(bad);
  document.querySelector('#conflict-recheck-weapon-file').files=dt.files;
  document.querySelector('#conflict-recheck-hashes').click();
 })()`);
 await waitFor("document.querySelector('#conflict-recheck-hash-result').textContent.includes('bytes-mismatch')",
  'Changed image bytes explicitly reported rather than approved');
 const importMobile=await evaluate(`({
  viewport:window.innerWidth,page:document.documentElement.scrollWidth,
  safe:document.querySelector('#conflict-recheck-hash-result').textContent.includes('UNREVIEWED')
 })`);
 assert.ok(importMobile.page<=importMobile.viewport+5,
  '375px evidence recheck UI overflows: '+JSON.stringify(importMobile));
 assert.equal(importMobile.safe,true);
 await evaluate("document.querySelector('#conflict-recheck-clear').click()");
 assert.equal(await evaluate("document.querySelector('#conflict-recheck-results').hidden"),
  true,'Imported original file references and summaries clear from UI');


 // End-to-end propagation of the seven source disputes into actual
 // player-facing tooling. No current-game measurements are invented.
 await send('Emulation.setDeviceMetricsOverride',{
  width:1280,height:850,deviceScaleFactor:1,mobile:false
 });
 await navigate('/weapon-database/?weapon=sote-reference-051&player=20,20,20,15,10');
 await waitFor("document.querySelector('#catalog-one')?.textContent.includes('SOURCE CONFLICT')",
  'Disputed Madding Hand no longer claims requirements met');
 assert.equal(await evaluate("document.querySelector('#catalog-requirements-link').hidden"),
  true,'Disputed requirements must never enter unmarked numeric requirements URL');
 assert.ok((await evaluate("document.querySelector('#catalog-shortfall').textContent"))
  .includes('No definitive wieldability verdict'));
 assert.ok((await evaluate("document.querySelector('#catalog-required').textContent"))
  .includes('DISPUTED'));
 await evaluate("document.querySelector('#catalog-compare-add').click()");
 await waitFor("document.querySelector('#catalog-compare-table')?.textContent.includes('UNRESOLVED source conflict')",
  'Source-disputed wield verdict withheld from weapon comparison');
 await navigate('/weapon-database/?weapon=sote-reference-071&player=99,99,99,99,99');
 await waitFor("document.querySelector('#catalog-title')?.textContent.includes('Smithscript Axe')",
  'Disputed Smithscript Axe source reference selected');
 assert.ok((await evaluate("document.querySelector('#catalog-damage').textContent"))
  .includes('DISPUTED'),'Attack source conflict is visible next to +0 figures');
 await evaluate("document.querySelector('#catalog-compare-add').click()");
 await waitFor("document.querySelector('#catalog-compare-table')?.textContent.includes('DISPUTED (community 133)')",
  'Community attack readings labelled disputed in side-by-side comparison');
 await navigate('/build-planner/?origin=Samurai&stats=12,11,13,12,15,9,8,8&sote=1&weapon=sote-reference-051');
 await waitFor("document.querySelector('#build-weapon-summary')?.textContent.includes('requirements DISPUTED')",
  'Selected disputed weapon carries unknown wieldability into Build Planner');
 assert.ok(!(await evaluate("document.querySelector('#build-weapon-summary').textContent"))
  .includes('requirements met'),'Never infer Madding Hand requirement pass from wiki FAI 13');
 await send('Emulation.setDeviceMetricsOverride',{
  width:375,height:812,deviceScaleFactor:1,mobile:true
 });
 const disputesMobile=await evaluate("({width:window.innerWidth,scroll:document.documentElement.scrollWidth})");
 assert.ok(disputesMobile.scroll<=disputesMobile.width+5,
  'Mobile disputed Build output overflow '+JSON.stringify(disputesMobile));

 // Accessible reference AR calculator must not auto-download the optional
 // upstream game-derived source. Exercise the actual shared AR Worker with a
 // visibly FICTIONAL local fixture; never confuse this demo with real AR.
 await navigate('/weapon-ar-calculator/?weapon=Fictional%20Bronze%20Sword%20%E2%80%94%20QA%20ONLY&player=40%2C20%2C10%2C10%2C10&upgrade=0');
 assert.equal(await evaluate("document.querySelector('#qar-workspace').hidden"),true,
  'Source must stay opt-in; no automatic external source download');
 await evaluate("document.querySelector('#qar-demo').click()");
 await waitFor("document.querySelector('#qar-workspace')?.hidden===false",
  'Fictional AR source loads inside Worker');
 await waitFor("document.querySelector('#qar-onehand')?.textContent==='136'",
  'Independent local demo AR 1H matches known fictional fixture');
 assert.equal(await evaluate("document.querySelector('#qar-twohand-total')?.textContent"),'152',
  'Two-hand fixture has distinct scaling');
 assert.ok((await evaluate("document.querySelector('#qar-source-status')?.textContent"))
  .includes('FICTIONAL DEMO'),'No game-data accuracy claim for synthetic worker data');
 await evaluate("document.querySelector('#qar-twohand').click()");
 await waitFor("document.querySelector('#qar-total')?.textContent==='152'",
  'Switching grip recomputes selected v1.17-style AR');
 const qaMobile=await evaluate("({width:window.innerWidth,scroll:document.documentElement.scrollWidth})");
 assert.ok(qaMobile.scroll<=qaMobile.width+5,
  '375px reference AR calculator must not overflow: '+JSON.stringify(qaMobile));
 console.log('[BROWSER SMOKE] Weapon AR calculator loads only on click, matches fictional 136/152 Worker outputs, changes grip, and fits mobile.');
 // Optional real external-parameter end-to-end check, isolated from the
 // deterministic browser smoke. CI performs the explicit user click; the
 // production calculator NEVER fetches third-party data on page load.
 if(process.env.RUN_REAL_V117_BROWSER==='1'){
  await navigate('/weapon-ar-calculator/?weapon=Uchigatana&player=40%2C40%2C10%2C10%2C10&upgrade=0');
  assert.equal(await evaluate("document.querySelector('#qar-workspace').hidden"),true,
   'Pinned source must not be fetched before explicit user action');
  await evaluate("document.querySelector('#qar-load-source').click()");
  try{
   await waitFor("document.querySelector('#qar-source-status')?.textContent.includes('3,296')||document.querySelector('#qar-source-status')?.textContent.includes('Checked 3296')||document.querySelector('#qar-source-status')?.dataset.state==='error'||document.querySelector('#qar-onehand')?.textContent==='172'",
    'Actual opt-in public v1.17 source data or meaningful error status');
  }catch(error){
   const diagnostic=await evaluate("({source:document.querySelector('#qar-source-status')?.textContent,feedback:document.querySelector('#qar-feedback')?.textContent,loaded:document.querySelector('#qar-workspace')?.hidden,ar:document.querySelector('#qar-onehand')?.textContent})");
   throw Error(error.message+': '+JSON.stringify(diagnostic));
  }
  const sourceStatus=await evaluate("document.querySelector('#qar-source-status').textContent");
  assert.ok(!sourceStatus.includes('Unable to load')&&!sourceStatus.includes('cannot')&&
   !sourceStatus.includes('Could not'), 'Pinned source fetch failed in real Chrome: '+sourceStatus);
  await waitFor("document.querySelector('#qar-onehand')?.textContent==='172'",
   'Real pinned v1.17 source AR matches verified Tarnished.dev Uchigatana Standard +0 40/40');
  const chromeInfo=await evaluate("({stats:[...['str','dex','int','fai','arc'].map(x=>document.querySelector('#qar-'+x).value)],variant:document.querySelector('#qar-affinity').value,upgrade:document.querySelector('#qar-upgrade').value})");
  assert.deepEqual(chromeInfo.stats,['40','40','10','10','10']);
  assert.equal(chromeInfo.upgrade,'0');
  assert.equal(chromeInfo.variant,'Uchigatana');
  await evaluate("document.querySelector('#qar-twohand').click()");
  await waitFor("document.querySelector('#qar-total')?.textContent==='180'",
   'Real source computes 180 two-handed Uchigatana +0 at 40/40');
  await evaluate("document.querySelector('#qar-twohand').click()");
  await waitFor("document.querySelector('#qar-total')?.textContent==='172'",
   'Switching back to one-handed reverts to 172');
  await evaluate("(()=>{const el=document.querySelector('#qar-upgrade');el.value='25';el.dispatchEvent(new Event('change',{bubbles:true}))})()");
  await waitFor("document.querySelector('#qar-onehand')?.textContent==='491'",
   'Real source calculates Standard +25 at STR40 DEX40 = 491');
  const keen=await evaluate("(()=>{const e=document.querySelector('#qar-affinity');const o=[...e.options].find(x=>x.value.includes('Keen'));if(!o)return null;e.value=o.value;e.dispatchEvent(new Event('change',{bubbles:true}));return o.value})()");
  assert.ok(keen,'Keen Uchigatana must exist in pinned source variant family');
  await waitFor("document.querySelector('#qar-upgrade')?.options.length===26",
   'Keen Uchigatana uses normal +0..+25 reinforcement');
  await evaluate("(()=>{const el=document.querySelector('#qar-upgrade');el.value='25';el.dispatchEvent(new Event('change',{bubbles:true}))})()");
  await waitFor("document.querySelector('#qar-onehand')?.textContent==='488'",
   'Real source calculates Keen +25 STR40 DEX40 = 488');
  await evaluate("(()=>{const x=document.querySelector('#qar-search');x.value='Blasphemous Blade';x.dispatchEvent(new Event('input',{bubbles:true}))})()");
  await waitFor("document.querySelector('#qar-upgrade')?.options.length===11",
   'Somber-only Blasphemous Blade has +0..+10, never fabricated +25');
  assert.equal(await evaluate("document.querySelector('#qar-upgrade').options[10].value"),'10');
  const arMobile=await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth})");
  assert.ok(arMobile.scroll<=arMobile.width+5,'Real v1.17 source calculator mobile overflow '+JSON.stringify(arMobile));
  console.log('[REAL V1.17 BROWSER] PASS: user-clicked public source, Uchigatana 172 / 180 (2H) / 491 (+25) / Keen 488, Somber +10 cap, 375px mobile');
 }
 assert.deepEqual(pageErrors,[], 'No uncaught page JavaScript errors expected');
 console.log('[BROWSER SMOKE] PASS: disputed weapon requirement/attack fail-closed UI + local seven-case JSON reimport/original-hash recheck + local unreviewed screenshot SHA256 capture/mobile + seven-way current-game-unreviewed discrepancy ledger + source-derived 408-weapon audit + explicit slot-based equipped load and 375px mobile + wield shortlist targets/mobile + Build A/B pin/edit/share/reopen/origin/mobile + Build shortlist → Smithing import → confirmed levels → shared stock → save/reload/restore/delete + 375px mobile viewport');
}catch(error){
 console.error('[BROWSER SMOKE] FAIL:',error.stack||error);
 process.exitCode=1;
}finally{
 for(const {timer,reject} of pending.values()){clearTimeout(timer);reject(Error('Browser terminated'));}
 pending.clear();
 try{socket?.close();}catch{}
 if(chrome)await stopChrome(chrome);
 server.close();
 if(profile)await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
