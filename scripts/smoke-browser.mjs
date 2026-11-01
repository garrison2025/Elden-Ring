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
 // Newly verified base-vitals readouts: same input as REAL Tarnished v1.17
 // four-scenario browser record; no gear, buffs or rune effects applied.
 await evaluate("(()=>{const s=document.querySelector('#origin');s.value='Wretch';s.dispatchEvent(new Event('change',{bubbles:true}));const set=(i,n)=>{const x=document.querySelector('#stat-grid [data-stat=\\\"'+i+'\\\"]');x.value=String(n);x.dispatchEvent(new Event('input',{bubbles:true}))};set(0,40);set(1,30);set(2,25)})()");
 assert.deepEqual(await evaluate("['base-hp','base-fp','base-stamina','base-equip-load'].map(id=>document.getElementById(id)?.textContent)"),
  ['1,450','173','121','72'],'Real browser base Wretch VIG40/MND30/END25 must match v1.17 UI');
 assert.match(await evaluate("document.querySelector('#base-vitals-note').textContent"),
  /not itself independently checked/,'Exact combined build remains unverified even though curves are site-read');

 // Real Wretch VIG40/MND30/END25 is EXACTLY frozen from Tarnished.dev's
 // independent actual Chrome UI, not an unverified additive estimate.
 assert.deepEqual(await evaluate("['physical','magic','fire','lightning','holy','immunity','robustness','focus','vitality','discovery'].map(k=>document.getElementById('build-def-'+k)?.textContent)"),
  ['101','117','137','97','117','134','104','104','114','110'],
  'Ten exact same-input unbuffed Wretch source fields must be displayed');
 assert.equal(await evaluate("document.querySelector('#build-def-tier').textContent"),
  'Direct same-input public v1.17');

 await evaluate("(()=>{const s=document.querySelector('#origin');s.value='Samurai';s.dispatchEvent(new Event('change',{bubbles:true}))})()");
 assert.equal(await evaluate("document.querySelector('#build-def-physical').textContent"),
  'Unverified','Do not copy naked Wretch outputs to another origin');


 await waitFor('document.querySelector("#build-weapon")?.disabled===false',
  'Build Planner catalog ready');
 await evaluate("document.querySelector('#build-loadout-start').click()");
 await waitFor("document.querySelector('#build-loadout-container')?.hidden===false&&document.querySelector('#build-loadout-weapons select')?.options.length>480",
  'Build Planner opens six source weapon slots after local data load');
 assert.equal(await evaluate("document.querySelectorAll('#build-loadout-weapons select').length"),6);
 assert.equal(await evaluate("document.querySelectorAll('#build-loadout-armor input[type=text]').length"),4);
 assert.equal(await evaluate("document.querySelectorAll('#build-loadout-spells input').length"),10);

 // Three genuine twice-read real v1.17 item selections: test actual
 // browser inputs, source-identity preview, and exact talisman weight.
 await evaluate("(()=>{const s=document.querySelector('#origin');s.value='Wretch';s.dispatchEvent(new Event('change',{bubbles:true}));const t=document.querySelector('#build-loadout-talismans input');t.value='Starscourge Heirloom';t.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#build-v117-isolated-effect-results')?.textContent.includes('STR 10 → 15')",
  'Real selected Starscourge Heirloom reference bonus renders');
 assert.ok((await evaluate("document.querySelector('#build-loadout-results').textContent")).includes('Equipped weight: 0.800'),
  'Real talisman 0.8 load must no longer be silently discarded');
 assert.match(await evaluate("document.querySelector('#build-v117-isolated-effect-results').textContent"),
  /direct-site-same-input-selection/);

 // 14 twice-read talisman expansion: test the actual independent Wretch10
 // baseline HP, displayed negation penalties, discovery and source weights.
 await evaluate("(()=>{const t=document.querySelector('#build-loadout-talismans input');t.value=\"Radagon's Soreseal\";t.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#build-v117-isolated-effect-results')?.textContent.includes('physical -15%')",
  'Radagon Soreseal actual Wretch all-element negative damage negation must not be discarded');
 assert.ok((await evaluate("document.querySelector('#build-v117-isolated-effect-results').textContent")).includes('HP 522'),
  'Radagon Soreseal Wretch actual HP after +5 VIG is 522');
 await evaluate("(()=>{const t=document.querySelector('#build-loadout-talismans input');t.value=\"Erdtree's Favor +2\";t.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#build-v117-isolated-effect-results')?.textContent.includes('Max Equip Load 52.0')",
  'Erdtree Favor +2 real Wretch load cap is 52.0');
 assert.ok((await evaluate("document.querySelector('#build-v117-isolated-effect-results').textContent")).includes('HP 430'),
  'Erdtree Favor +2 exact Wretch10 HP = 430');
 await evaluate("(()=>{const t=document.querySelector('#build-loadout-talismans input');t.value='Silver Scarab';t.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#build-v117-isolated-effect-results')?.textContent.includes('Discovery 185')",
  'Silver Scarab actual Wretch10 Discovery 185 from site');
 assert.ok((await evaluate("document.querySelector('#build-loadout-results').textContent")).includes('Equipped weight: 1.200'),
  'Silver Scarab must contribute its twice observed 1.2 weight');

 // Two-talisman Wretch10 reference pairing, never an inferred sum.
 await evaluate("(()=>{const xs=[...document.querySelectorAll('#build-loadout-talismans input')];xs[0].value=\"Radagon's Scarseal\";xs[0].dispatchEvent(new Event('input',{bubbles:true}));xs[1].value=\"Marika's Scarseal\";xs[1].dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#build-v117-verified-pair')?.textContent.includes('physical -21%')",
  'Two distinct -10% seals must display actual combined -21%, not naive -20%');
 assert.ok((await evaluate("document.querySelector('#build-v117-verified-pair').textContent")).includes('HP 476'),
  'Same-input reference Wretch10 Scarseal combo HP 476');
 await evaluate("(()=>{const xs=[...document.querySelectorAll('#build-loadout-talismans input')];xs[0].value=\"Great-Jar's Arsenal\";xs[0].dispatchEvent(new Event('input',{bubbles:true}));xs[1].value=\"Erdtree's Favor +2\";xs[1].dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#build-v117-verified-pair')?.textContent.includes('Max Equip Load 61.9')",
  'Actual Great-Jar Arsenal and Erdtree Favor +2 combination max-load');
 await evaluate("(()=>{const xs=[...document.querySelectorAll('#build-loadout-talismans input')];xs[1].value='';xs[1].dispatchEvent(new Event('input',{bubbles:true}));xs[0].value='';xs[0].dispatchEvent(new Event('input',{bubbles:true}))})()");
 assert.equal(await evaluate("!!document.querySelector('#build-v117-verified-pair')"),false,
  'Clearing observed pairing removes all stale exact result panels');


 await evaluate("(()=>{const t=document.querySelector('#build-loadout-talismans input');t.value='';t.dispatchEvent(new Event('input',{bubbles:true}));const r=document.querySelector('#build-loadout-rune');r.value=\"Godrick's Great Rune\";r.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#build-v117-isolated-effect-results')?.textContent.includes('VIG 10 → 15')",
  'Actual Godrick rune selected-item +5 each from real Chrome appears');
 assert.match(await evaluate("document.querySelector('#build-v117-isolated-effect-results').textContent"),
  /checkbox still OFF/,'Do not hide reference UI activation discrepancy');
 await evaluate("(()=>{const r=document.querySelector('#build-loadout-rune');r.value='';r.dispatchEvent(new Event('input',{bubbles:true}));const t=document.querySelector('#build-loadout-activations input');t.value='Intelligence-knot Crystal Tear';t.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#build-v117-isolated-effect-results')?.textContent.includes('INT 10 → 20')",
  'Actual one Physick tear source selection result matches ten-point intelligence change');
 await evaluate("(()=>{const t=document.querySelector('#build-loadout-activations input');t.value='';t.dispatchEvent(new Event('input',{bubbles:true}));const o=document.querySelector('#origin');o.value='Samurai';o.dispatchEvent(new Event('change',{bubbles:true}))})()");
 assert.ok(!(await evaluate("document.querySelector('#build-loadout-results').textContent")).includes('build-v117-isolated-effect-results'),
  'Clearing selected effects prevents stale source proof from surviving');
 console.log('[REAL V117 BUILD EFFECTS] Starscourge STR+5 0.8 load, Godrick selected +5×8, Intelligence knot selected INT+10, toggle anomaly disclosed.');
 // Real Chrome exercises the FIVE exactly observed dual/triple talisman
 // scenes separately from individual isolated previews (no invented stacking).
 await evaluate("(()=>{const o=document.querySelector('#origin');o.value='Wretch';o.dispatchEvent(new Event('change',{bubbles:true}));const t=document.querySelectorAll('#build-loadout-talismans input');t[0].value=\"Radagon's Soreseal\";t[1].value=\"Marika's Soreseal\";t[1].dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#build-v117-combined-talisman-reference')?.textContent.includes('physical -32.25%')",
  'Both actually equipped Soreseals must use site displayed -32.25% and not naive -30%');
 assert.ok((await evaluate("document.querySelector('#build-v117-combined-talisman-reference').textContent")).includes('Actual HP 522'),
  'Both Soreseals should show exactly independently read Wretch10 HP 522');
 await evaluate("(()=>{const t=document.querySelectorAll('#build-loadout-talismans input');t[1].value=\"Erdtree's Favor +2\";t[1].dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#build-v117-combined-talisman-reference')?.textContent.includes('Maximum Equip Load 60.6')",
  'Actual Radagon Soreseal + Erdtree Favor Wretch10 load cap is 60.6');
 assert.ok((await evaluate("document.querySelector('#build-v117-combined-talisman-reference').textContent")).includes('Actual HP 542'),
  'Actual Radagon Soreseal + Erdtree Favor HP is 542');
 await evaluate("(()=>{const t=document.querySelectorAll('#build-loadout-talismans input');t[0].value=\"Radagon's Scarseal\";t[1].value=\"Radagon's Soreseal\";t[1].dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#build-v117-combined-talisman-exclusion')?.textContent.includes('did NOT remain selected')",
  'Actual mutually exclusive Radagon seals cannot be treated as a source-verified 2-item scene');
 assert.ok((await evaluate("document.querySelector('#build-loadout-results').textContent")).includes('exact equip load withheld')||
  (await evaluate("document.querySelector('#build-loadout-results').textContent")).includes('exact equip load withheld'),
  'Do not assert an exact equip load for reference-rejected item combination');
 await evaluate("(()=>{const t=document.querySelectorAll('#build-loadout-talismans input');t[0].value='';t[1].value='';t[1].dispatchEvent(new Event('input',{bubbles:true}));const o=document.querySelector('#origin');o.value='Samurai';o.dispatchEvent(new Event('change',{bubbles:true}))})()");




 await evaluate("(()=>{const sel=document.querySelector('#build-loadout-weapons select');sel.value=[...sel.options].find(x=>x.textContent.startsWith('Uchigatana'))?.value;sel.dispatchEvent(new Event('change',{bubbles:true}));const max=document.querySelector('#build-loadout-maximum');max.value='75';max.dispatchEvent(new Event('input',{bubbles:true}))})()");
 assert.ok((await evaluate("document.querySelector('#build-loadout-results').textContent")).includes('Equipped weight: 5.500'),
  'Sourced Uchigatana weight enters the build subtotal');
 await evaluate("(()=>{const sel=document.querySelectorAll('#build-loadout-weapons select')[1];sel.value=[...sel.options].find(x=>x.textContent.startsWith('Albinauric Shield'))?.value;sel.dispatchEvent(new Event('change',{bubbles:true}))})()");
 const unknownWeight=await evaluate("document.querySelector('#build-loadout-results').textContent");
 assert.ok(unknownWeight.includes('Equipped weight: 10.000')&&
  unknownWeight.includes('tarnished-dev-v1.17-direct-ui')&&
  unknownWeight.includes('Roll tier: Light'),
  'Two-run observed v1.17 Albinauric Shield weight 4.5 combines with Uchigatana 5.5');
 await evaluate("(()=>{const i=document.querySelectorAll('#build-loadout-weapons .build-loadout-item input[type=number]')[1];i.value='3.5';i.dispatchEvent(new Event('input',{bubbles:true}))})()");
 const known=await evaluate("document.querySelector('#build-loadout-results').textContent");
 assert.ok(known.includes('Equipped weight: 9.000')&&known.includes('Roll tier: Light'),
  'Manual source-labelled override enables accurate input-only roll tier');
 await evaluate("document.querySelector('#build-loadout-save').click()");
 assert.ok((await evaluate("localStorage.getItem('buildlab:equipment-loadout:v1')")).includes('v117-roster'),
  'Save includes only bounded equipment identifiers and weights');
 await evaluate("document.querySelector('#build-loadout-clear').click()");
 assert.ok((await evaluate("document.querySelector('#build-loadout-results').textContent")).includes('Equipped weight: 0.000'),
  'Clearing all equipped gear produces exact zero load');
 await evaluate("document.querySelector('#build-loadout-restore').click()");
 assert.ok((await evaluate("document.querySelector('#build-loadout-results').textContent")).includes('Equipped weight: 9.000'),
  'Local restore is explicit and exact');
 await evaluate("document.querySelector('#build-loadout-clear').click()");
 console.log('[BROWSER SMOKE] Six-slot build equipment, direct v1.17 observed shield weight and manual override/save/restore PASS.');
 await selectWeapon('Uchigatana');
 const buildArHandoff=await evaluate("(()=>{const a=document.querySelector('#build-weapon-ar-link');const u=new URL(a.href);return {hidden:a.hidden,path:u.pathname,weapon:u.searchParams.get('weapon'),stats:u.searchParams.get('player'),upgrade:u.searchParams.get('upgrade')}})()");
 assert.deepEqual(buildArHandoff,{
  hidden:false,path:'/weapon-ar-calculator/',weapon:'Uchigatana',
  stats:'12,15,9,8,8',upgrade:null
 },'Selected Build weapon and exact Samurai combat stats must reach opt-in AR calculator');
 await selectWeapon('Greatsword');
 const greatAr=await evaluate("new URL(document.querySelector('#build-weapon-ar-link').href).searchParams.get('weapon')");
 assert.equal(greatAr,'Greatsword','Changing selected weapon updates the reference AR handoff');
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
 assert.equal(await evaluate("new URL(document.querySelector('#build-weapon-ar-link').href).searchParams.get('player')"),
  '31,15,9,8,8','Applying weapon requirements updates the combat stats in AR handoff');
 await evaluate("(()=>{const v=document.querySelector('#stat-grid [data-stat=\\\"0\\\"]');v.value='0';v.dispatchEvent(new Event('input',{bubbles:true}))})()");
 assert.equal(await evaluate("document.querySelector('#build-weapon-ar-link').hidden"),
  true,'Invalid Build attributes hide external handoff rather than leaking stale inputs');
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
 await navigate('/weapon-database/');
 await waitFor("document.querySelector('#catalog-quality-summary')?.textContent.includes('without flagged source conflicts')",
  'Weapon catalog displays computed source-availability totals');
 assert.ok((await evaluate("document.querySelector('#catalog-quality-summary').textContent"))
  .includes('does NOT establish current game accuracy'),'Never label source completeness as game certification');
 await evaluate("(()=>{const q=document.querySelector('#catalog-quality');q.value='conflict';q.dispatchEvent(new Event('change',{bubbles:true}));const search=document.querySelector('#catalog-search');search.value='Stone-Sheathed';search.dispatchEvent(new Event('input',{bubbles:true}));})()");
 await waitFor("document.querySelector('#catalog-results').textContent.includes('1 matching entries')",
  'Source conflict filter must expose disputed Stone-Sheathed Sword');
 assert.ok((await evaluate("document.querySelector('#catalog-list').textContent"))
  .includes('Disputed source fields'),'Source dispute is obvious in search result');
 await evaluate("(()=>{document.querySelector('#catalog-search').value='';const q=document.querySelector('#catalog-quality');q.value='source-only';q.dispatchEvent(new Event('change',{bubbles:true}));})()");
 await waitFor("document.querySelector('#catalog-results').textContent.includes('72 matching entries')",
  'Source-only category uses exact 72 recovered primary-unknown records');
 await evaluate("document.querySelector('#catalog-clear-filters').click()");
 assert.equal(await evaluate("document.querySelector('#catalog-quality').value"),'all',
  'Clear all resets quality filtering');
 await evaluate("(()=>{const sort=document.querySelector('#catalog-sort');sort.value='requirements';sort.dispatchEvent(new Event('change',{bubbles:true}));window.catalogFirstSortedRow=document.querySelector('#catalog-list .catalog-row');const stat=document.querySelector('#catalog-stats input[data-stat=\\\"0\\\"]');stat.value='40';stat.dispatchEvent(new Event('input',{bubbles:true}));})()");
 assert.equal(await evaluate("document.querySelector('#catalog-list .catalog-row')!==window.catalogFirstSortedRow"),
  true,'Requirement-based sorting must refresh when stats change even with no wield filter');
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
 assert.equal(await evaluate("document.querySelector('#qar-reference-check')?.hidden"),true,
  'Fictional data must never offer a real Tarnished.dev reference result comparison');

 assert.equal(await evaluate("document.querySelector('#qar-rank-panel').hidden"),false,
  'AR ranking appears only after user-loaded source');
 await evaluate("(()=>{const q=document.querySelector('#qar-rank-search');q.value='Fictional';q.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#qar-rank-run').click()})()");
 await waitFor("document.querySelectorAll('#qar-rank-rows tr').length===4",
  'Four source-defined fictional weapons must appear in the batch ranking');
 const arRank=await evaluate("({rows:[...document.querySelectorAll('#qar-rank-rows tr')].map(tr=>Number(tr.children[3].textContent)),status:document.querySelector('#qar-rank-status').textContent,csv:document.querySelector('#qar-rank-csv').disabled,unmet:document.querySelector('#qar-rank-rows').textContent.includes('NOT MET')})");
 assert.deepEqual(arRank.rows,[...arRank.rows].sort((a,b)=>b-a));
 assert.ok(arRank.status.includes('FICTIONAL QA DATA')&&arRank.unmet&&!arRank.csv);
 await evaluate("(()=>{const q=document.querySelector('#qar-rank-search');q.value='x';q.dispatchEvent(new Event('input',{bubbles:true}))})()");
 assert.equal(await evaluate("document.querySelector('#qar-rank-csv').disabled"),true,
  'Source ranking export must invalidate after query edit');
 await evaluate("(()=>{const q=document.querySelector('#qar-rank-search');q.value='Fictional';q.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#qar-rank-run').click()})()");
 await waitFor("document.querySelector('#qar-rank-results')?.hidden===false",
  'Source ranking can be recalculated after input change');
 await evaluate("(()=>{const cb=document.querySelector('#qar-rank-all');cb.checked=true;cb.dispatchEvent(new Event('change',{bubbles:true}));const q=document.querySelector('#qar-rank-search');q.value='';q.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#qar-rank-run').click()})()");
 await waitFor("document.querySelector('#qar-rank-status')?.textContent.includes('4 results over 4 matching')",
  'Global full-source rank works with no search term and evaluates entire loaded fictional source');
 assert.equal(await evaluate("document.querySelector('#qar-rank-visible-count').textContent.includes('Showing 4 of 4')"),
  true,'A globally sorted full-source UI states total evaluated, not just first page');
 assert.equal(await evaluate("document.querySelector('#qar-rank-more').hidden"),true,
  'Small global queries do not show extra pages');
 await evaluate("(()=>{const track=document.querySelector('#qar-rank-track');track.value='somber';track.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#qar-rank-run').click()})()");
 await waitFor("document.querySelector('#qar-rank-status')?.textContent.includes('0 results over 4 matching')",
  'Somber-only filter excludes invented regular source paths');
 assert.equal(await evaluate("document.querySelector('#qar-rank-csv').disabled"),true,
  'No ranking rows must produce no export');
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
  // Build equipment reads source stats only after explicitly requested and
  // re-renders armor-only totals as actual slots are changed in Chrome.
  await navigate('/build-planner/');
  await evaluate("document.querySelector('#build-loadout-start').click()");
  await waitFor("document.querySelector('#build-loadout-container')?.hidden===false",
   'Build equipment editor is activated before source load');
  assert.equal(await evaluate("document.querySelector('#build-armor-metric-summary')===null"),true,
   'No source-derived armor aggregate can appear before equipment is chosen');
  await evaluate("document.querySelector('#build-loadout-load-armor').click()");
  await waitFor("document.querySelector('#build-loadout-armor-source-status')?.textContent.includes('568 pinned armor items loaded')||document.querySelector('#build-loadout-armor-source-status')?.textContent.includes('unavailable:')",
   'Build opt-in source must load 568 real armor pieces');
  assert.ok((await evaluate("document.querySelector('#build-loadout-armor-source-status').textContent"))
   .includes('568 pinned armor items loaded'),
   'Real Build armor source cannot be silently replaced by synthetic data');
  // New separately verified Circlet armor effect: genuine browser opt-in,
  // exact source-name input and rendered +INT/FAI/ARC preview.
  await evaluate("(()=>{const o=document.querySelector('#origin');o.value='Wretch';o.dispatchEvent(new Event('change',{bubbles:true}));const n=document.querySelectorAll('#build-loadout-armor .build-loadout-item input[type=text]')[0];n.value='Circlet of Light';n.dispatchEvent(new Event('input',{bubbles:true}))})()");
  await waitFor("document.querySelector('#build-direct-effect-result')?.textContent.includes('INT 10 → 11')",
   'Exact selected Circlet must display browser-evidenced +INT, FAI and ARC attribute changes');
  const circletBonus=await evaluate("document.querySelector('#build-direct-effect-result').textContent");
  assert.ok(circletBonus.includes('FAI 10 → 11')&&circletBonus.includes('ARC 10 → 11')&&
   circletBonus.includes('direct-site-observed-baseline'),
   'Build equipment preview must preserve one double-checked unbuffed Wretch site proof');
  console.log('[REAL BUILD CIRCLET EFFECT] PASS: exact source Head +1 INT FAI ARC, no other equipment.');
  await evaluate("(()=>{const names=[...document.querySelectorAll('#build-loadout-armor .build-loadout-item input[type=text]')];if(names.length!==4)throw Error('Expected four armor name slots');names[0].value='All-knowing Helm';names[0].dispatchEvent(new Event('input',{bubbles:true}));names[1].value='All-knowing Armor';names[1].dispatchEvent(new Event('input',{bubbles:true}));})()");
  await waitFor("document.querySelector('#build-armor-metric-summary')?.textContent.includes('16.91%')",
   'Actual two-item Build armor damage negation must stack multiplicatively');
  const armorBuildText=await evaluate("document.querySelector('#build-armor-metric-summary').textContent");
  assert.ok(armorBuildText.includes('29 points')&&armorBuildText.includes('13 source metrics'),
   'Known All-knowing Helm + Armor must yield 21 source poise and 13 live metric rows');
  assert.equal(await evaluate("document.querySelectorAll('#build-armor-metric-summary tbody tr').length"),13);
  console.log('[REAL BUILD ARMOR] Opt-in 568 source; two real armor pieces produce 29 verified Poise and 16.91% direct-field physical negation in Build.');
  // Armor v1.17 functional alignment: visit the real, pinned community
  // source and exercise a non-Poise metric through a real page/Worker.
  // Not a claim of Tarnished.dev same-input armor numeric parity.
  await navigate('/armor-optimizer/');
  assert.equal(await evaluate("document.querySelector('#armor-full-run').disabled"),true,
   'Public armor source must remain opt-in');
  await evaluate("document.querySelector('#armor-full-load').click()");
  await waitFor("document.querySelector('#armor-full-status')?.textContent.includes('Pinned 568')||document.querySelector('#armor-full-status')?.textContent.includes('unavailable:')",
   'Real 568-item armor source loads only after button click');
  const armorLoad=await evaluate("document.querySelector('#armor-full-status').textContent");
  assert.ok(armorLoad.includes('Pinned 568'),'Expected exact pinned public armor source: '+armorLoad);
  await evaluate("(()=>{const q=document.querySelector('#armor-full-metric');q.value='physical';q.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#armor-full-run').click()})()");
  await waitFor("document.querySelector('#armor-full-heading')?.textContent.startsWith('Best Physical negation:')||document.querySelector('#armor-full-status')?.dataset.state==='error'",
   'Full source physical negation Worker solution must become visible');
  assert.ok((await evaluate("document.querySelector('#armor-full-heading').textContent"))
   .includes('Best Physical negation: 32.796079%'),
   'Expected reproducible 568-item source model reference at 75 max load, 18 reserved, medium tier');
  assert.equal(await evaluate("document.querySelectorAll('#armor-full-rows tr').length"),4);
  assert.equal(await evaluate("document.querySelector('#armor-full-results').hidden"),false);
  // The v1.17 comparator exposes both Poise Minimum and damage maxima.
  // Verify the UI now jointly enforces the constraints, rather than
  // post-filtering the unconstrained best armor set.
  await evaluate("(()=>{const p=document.querySelector('#minPoise');p.value='51';p.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#armor-full-run').click()})()");
  await waitFor("document.querySelector('#armor-full-details')?.textContent.includes('Minimum source Poise 51 satisfied')||document.querySelector('#armor-full-status')?.dataset.state==='error'",
   'Exact source physical-negation optimum under 51 Poise and medium roll');
  const joint=await evaluate("(()=>({title:document.querySelector('#armor-full-heading').textContent,details:document.querySelector('#armor-full-details').textContent,poise:[...document.querySelectorAll('#armor-full-rows tr')].reduce((s,tr)=>s+Number(tr.children[3].textContent),0)}))()");
  assert.ok(joint.title.includes('Best Physical negation: 32.796079%'),
   'Pinned 568-item joint Poise/weight constrained physical optimum must match independent source audit');
  assert.ok(joint.poise>=51,'Poise 51 minimum constraint remains strict');
  assert.match(joint.details,/Minimum source Poise 51 satisfied: total [5-9][0-9]/);
  console.log('[REAL ARMOR JOINT] PASS: source 568, max physical negation 32.796079%, source Poise 51+, exact medium-roll cap.');
  console.log('[REAL ARMOR SOURCE] 568-item public-source Worker completed independent physical-negation objective; not a competitor UI golden.');

  // NEW 13-attribute weighted user flow: the already user-loaded verified
  // source is reused. This does not rerun the historical 549 item field audit.
  await evaluate("(()=>{const mode=document.querySelector('#armor-full-mode');mode.value='weighted';mode.dispatchEvent(new Event('change',{bubbles:true}));const min=document.querySelector('#minPoise');min.value='0';min.dispatchEvent(new Event('input',{bubbles:true}));})()");
  assert.equal(await evaluate("document.querySelectorAll('#armor-weighted-rows .armor-weighted-row').length"),13,
   'New weighted form must render all 13 adjustable real metrics');
  assert.equal(await evaluate("document.querySelector('#armor-weighted-panel').hidden"),false,
   'Weighted field controls should be visible after user mode change');
  assert.equal(await evaluate("document.querySelectorAll('#armor-weighted-rows input').length"),39,
   'Each metric needs multiplier, minimum and maximum controls');
  await evaluate("document.querySelector('#armor-full-run').click()");
  await waitFor("document.querySelector('#armor-full-heading')?.textContent.startsWith('Best Weighted 13-attribute score:')||document.querySelector('#armor-full-status')?.dataset.state==='error'",
   'Weighted Worker must report a result or a real bounded-search error');
  const weighted=await evaluate("({heading:document.querySelector('#armor-full-heading').textContent,details:document.querySelector('#armor-full-details').textContent,status:document.querySelector('#armor-full-status').textContent,rows:document.querySelectorAll('#armor-full-rows tr').length})");
  assert.equal(weighted.heading,'Best Weighted 13-attribute score: 71 score',
   'Default Poise-weighted mode must derive actual 71 Poise under the currently set 75/18 medium-roll scenario');
  assert.ok(weighted.details.includes('poise 71')&&weighted.details.includes('NOT Tarnished.dev scoring parity'));
  assert.equal(weighted.rows,4);
  console.log('[REAL WEIGHTED ARMOR] 13 input rows, 39 controls, Worker exact Poise score 71, site evidence gating.');
  await navigate('/weapon-database/?weapon=v117-roster-001');
  await waitFor("document.querySelector('#catalog-title')?.textContent==='Albinauric Shield'",
   'Source-only Albinauric Shield selected in the real catalog');
  assert.equal(await evaluate("document.querySelector('#catalog-v117-panel').hidden"),true,
   'External source facts cannot load without explicit user click');
  assert.equal(await evaluate("document.querySelector('#catalog-v117-export').disabled"),true,
   'Review CSV must stay disabled before the external source is loaded');
  assert.ok((await evaluate("document.querySelector('#catalog-weight').textContent")).includes('4.5 (Tarnished.dev v1.17'),
   'Two-run public Tarnished.dev weight 4.5 is shown with explicit provenance, not zero');
  await evaluate("document.querySelector('#catalog-v117-load').click()");
  await waitFor("document.querySelector('#catalog-v117-status')?.textContent.includes('source variants:')||document.querySelector('#catalog-v117-status')?.textContent.includes('unavailable:')",
   'Pinned neutral source overlay loads or shows a meaningful error');
  const catalogSourceText=await evaluate("document.querySelector('#catalog-v117-status').textContent");
  assert.ok(catalogSourceText.includes('487/487 unique neutral records'),
   'Source must map all 487 catalog names: '+catalogSourceText);
  assert.ok(catalogSourceText.includes('72 of the 72 source-only'),
   'Every primary-attack-unknown row should show source reference +0');
  assert.ok((await evaluate("document.querySelector('#catalog-v117-attack').textContent")).includes('78'),
   'Real Albinauric Shield has public source +0 physical 78');
  assert.ok((await evaluate("document.querySelector('#catalog-damage').textContent")).includes('78'),
   'Accepted v1.17 +0 attack must appear in PRIMARY weapon detail, not just audit overlay');
  assert.ok((await evaluate("document.querySelector('#catalog-warnings').textContent")).includes('487 neutral attack'),
   'Page must declare the authoritative version and source-limited scope');
  assert.ok((await evaluate("document.querySelector('#catalog-weight').textContent")).includes('4.5 (Tarnished.dev v1.17'),
   'Pinned attack source must not override independent v1.17 competitor weight observation; original community row still weights');
  assert.ok(catalogSourceText.includes('All 487 neutral rows now USE v1.17 attack and requirements'),
   'Full source mapping must actually activate versioned catalog calculations');
  assert.ok((await evaluate("document.querySelector('#catalog-v117-differences').textContent")).includes('COMMUNITY WEIGHT MISSING'),
   'Pinned attack source has no weight but the separate twice-observed competitor UI has 4.5');
  assert.ok(catalogSourceText.includes('41 attack and 25 requirement differences'),
   'All 41 existing community attack and 25 requirement disagreements must be visible');
  // The deep-linked item prepopulates the global name search. Clear it to
  // verify totals across the full 487-row corpus, then apply source filters.
  await evaluate("document.querySelector('#catalog-search').value=''");
  for(const [filter,expected] of [
   ['source-only',72],['flagged',9],['attack-difference',41],
   ['requirement-difference',25]
  ]){
   await evaluate("(()=>{const q=document.querySelector('#catalog-v117-filter');q.value='"+filter+"';q.dispatchEvent(new Event('change',{bubbles:true}))})()");
   assert.ok((await evaluate("document.querySelector('#catalog-results').textContent"))
    .includes(expected+' matching entries'),filter+' filter must show exact '+expected+' source cases');
  }
  assert.equal(await evaluate("document.querySelector('#catalog-v117-filter').disabled"),false);
  assert.equal(await evaluate("document.querySelector('#catalog-v117-export').disabled"),false,
   'Review queue becomes available only after source comparison loads');
  await evaluate("document.querySelector('#catalog-v117-export').click()");
  await waitFor("document.querySelector('#catalog-v117-export-status')?.textContent.includes('Downloaded ')",
   'Browser-only CSV review export should report actual unresolved field-level cases');
  assert.ok((await evaluate("document.querySelector('#catalog-v117-export-status').textContent"))
   .includes('No source discrepancy is automatically approved'),
   'CSV export must never be presented as source reconciliation approval');
  console.log('[REAL V1.17 CATALOG] 487 unique neutral matches, 72 unknown attack preview rows, 9 flagged disputes, 41/25 new cross-source differences, no weight guesses.');
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

  await evaluate("(()=>{const q=document.querySelector('#qar-rank-search');q.value='Uchigatana';q.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#qar-rank-run').click()})()");
  await waitFor("document.querySelector('#qar-rank-results')?.hidden===false&&document.querySelectorAll('#qar-rank-rows tr').length>1",
   'Opt-in real v1.17 source yields multiple legal Uchigatana affinity rows');
  const realRank=await evaluate("({values:[...document.querySelectorAll('#qar-rank-rows tr')].map(x=>Number(x.children[3].textContent)),status:document.querySelector('#qar-rank-status').textContent,table:document.querySelector('#qar-rank-rows').textContent})");
  assert.deepEqual(realRank.values,[...realRank.values].sort((a,b)=>b-a));
  assert.ok(realRank.status.includes('Pinned v1.17 reference'));
  assert.ok(realRank.table.includes('172'),'Uchigatana Standard +0 must equal externally observed 172');
  await evaluate("(()=>{const q=document.querySelector('#qar-rank-regular');q.value='25';q.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#qar-rank-run').click()})()");
  await waitFor("document.querySelector('#qar-rank-results')?.hidden===false",
   'Regular +25 same-input ranking computes from source');
  assert.ok((await evaluate("document.querySelector('#qar-rank-rows').textContent")).includes('491'),
   'Source Standard +25 Uchigatana at 40 STR/40 DEX is observed 491');
  const chromeInfo=await evaluate("({stats:[...['str','dex','int','fai','arc'].map(x=>document.querySelector('#qar-'+x).value)],variant:document.querySelector('#qar-affinity').value,upgrade:document.querySelector('#qar-upgrade').value})");
  assert.deepEqual(chromeInfo.stats,['40','40','10','10','10']);
  assert.equal(chromeInfo.upgrade,'0');
  assert.equal(chromeInfo.variant,'Uchigatana');
  const externalLink=await evaluate("(()=>{const p=document.querySelector('#qar-reference-check');const l=new URL(document.querySelector('#qar-reference-link').href);return {hidden:p.hidden,origin:l.origin,path:l.pathname,weapon:l.searchParams.get('rh1'),affinity:l.searchParams.get('aRh1'),smith:l.searchParams.get('smith'),str:l.searchParams.get('str'),dex:l.searchParams.get('dex'),grip:l.searchParams.get('twoHanded')}})()");
  assert.deepEqual(externalLink,{
   hidden:false,origin:'https://www.tarnished.dev',path:'/build-planner',
   weapon:'Uchigatana',affinity:'Standard',smith:'0',str:'40',dex:'40',grip:'false'
  },'One-click reference opens the exact selected v1.17 build controls');
  await evaluate("(()=>{document.querySelector('#qar-reference-value').value='172';document.querySelector('#qar-reference-compare').click()})()");
  assert.match(await evaluate("document.querySelector('#qar-reference-status').textContent"),
   /MATCH.*self.entered/i,'Manual same-input matching is explicitly self-entered, not a verified external fact');
  await evaluate("document.querySelector('#qar-twohand').click()");
  await waitFor("document.querySelector('#qar-total')?.textContent==='180'",
   'Real source computes 180 two-handed Uchigatana +0 at 40/40');
  const changedRef=await evaluate("(()=>{const p=document.querySelector('#qar-reference-check');const u=new URL(document.querySelector('#qar-reference-link').href);return {hidden:p.hidden,grip:u.searchParams.get('twoHanded'),input:document.querySelector('#qar-reference-value').value,status:document.querySelector('#qar-reference-status').textContent}})()");
  assert.equal(changedRef.hidden,false);
  assert.equal(changedRef.grip,'true','Grip changes must update external deep link');
  assert.equal(changedRef.input,'','Old manual reference is cleared when build changes');
  assert.doesNotMatch(changedRef.status,/MATCH/);
  await evaluate("(()=>{document.querySelector('#qar-reference-value').value='172';document.querySelector('#qar-reference-compare').click()})()");
  assert.match(await evaluate("document.querySelector('#qar-reference-status').textContent"),/DIFFERENCE.*\+8/);
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

  await evaluate("(()=>{const q=document.querySelector('#qar-rank-search');q.value='Blasphemous Blade';q.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#qar-rank-somber').value='10';document.querySelector('#qar-rank-regular').value='25';document.querySelector('#qar-rank-run').click()})()");
  await waitFor("document.querySelector('#qar-rank-results')?.hidden===false",
   'Real Somber +10 source AR ranking opens despite separate Regular +25 input');
  const somberRank=await evaluate("({results:[...document.querySelectorAll('#qar-rank-rows tr')].map(tr=>tr.children[2].textContent),status:document.querySelector('#qar-rank-status').textContent})");
  assert.ok(somberRank.results.length>0,'Somber Blasphemous Blade has at least one legal source profile');
  assert.ok(somberRank.results.every(x=>x.includes('Somber +10')),
   'Somber profiles must never use the unrelated Regular +25 input');
  await evaluate("(()=>{const q=document.querySelector('#qar-rank-search');q.value='Uchigatana, Blasphemous Blade';q.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#qar-rank-run').click()})()");
  await waitFor("document.querySelector('#qar-rank-results')?.hidden===false",
   'Two distinct exact source weapon families compare in one ranking');
  const mixed=await evaluate("({rows:document.querySelector('#qar-rank-rows').textContent,count:document.querySelectorAll('#qar-rank-rows tr').length,notice:document.querySelector('#qar-rank-status').textContent})");
  assert.ok(mixed.count>=2&&mixed.rows.includes('Uchigatana')&&mixed.rows.includes('Blasphemous Blade'),
   'Must rank multiple unrelated exact weapon families together');
  assert.ok(mixed.rows.includes('Regular +25')&&mixed.rows.includes('Somber +10'),
   'Regular and Somber paths remain separate in cross-family ranking');
  await evaluate("(()=>{const full=document.querySelector('#qar-rank-all');full.checked=true;full.dispatchEvent(new Event('change',{bubbles:true}));const term=document.querySelector('#qar-rank-search');term.value='';term.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#qar-rank-run').click()})()");
  await waitFor("document.querySelector('#qar-rank-status')?.textContent.includes('matching source variants')&&document.querySelector('#qar-rank-status')?.dataset.state!=='loading'",
   'Full v1.17 source ranking completed without misleading truncated set');
  const globalRank=await evaluate("({notice:document.querySelector('#qar-rank-status').textContent,visible:document.querySelectorAll('#qar-rank-rows tr').length,totalText:document.querySelector('#qar-rank-visible-count').textContent,moreHidden:document.querySelector('#qar-rank-more').hidden,csvDisabled:document.querySelector('#qar-rank-csv').disabled,vals:[...document.querySelectorAll('#qar-rank-rows tr')].map(tr=>Number(tr.children[3].textContent))})");
  assert.match(globalRank.notice,/over 3296 matching source variants/);
  assert.equal(globalRank.visible,100,'Browser renders only first 100 globally sorted rows');
  assert.match(globalRank.totalText,/Showing 100 of /);
  assert.equal(globalRank.moreHidden,false,'Full-source results support progressive pagination');
  assert.equal(globalRank.csvDisabled,false,'Export covers all calculated source ranks, not just 100 shown');
  assert.deepEqual(globalRank.vals,[...globalRank.vals].sort((a,b)=>b-a));
  await evaluate("document.querySelector('#qar-rank-more').click()");
  assert.equal(await evaluate("document.querySelectorAll('#qar-rank-rows tr').length"),200,
   'Pagination displays next 100 globally pre-ranked rows');

  await evaluate("(()=>{const x=document.querySelector('#qar-search');x.value='Blasphemous Blade';x.dispatchEvent(new Event('input',{bubbles:true}))})()");
  await waitFor("document.querySelector('#qar-upgrade')?.options.length===11",
   'Somber-only Blasphemous Blade has +0..+10, never fabricated +25');
  assert.equal(await evaluate("document.querySelector('#qar-upgrade').options[10].value"),'10');
  const arMobile=await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth})");
  assert.ok(arMobile.scroll<=arMobile.width+5,'Real v1.17 source calculator mobile overflow '+JSON.stringify(arMobile));
  console.log('[REAL V1.17 BROWSER] PASS: user-clicked public source, Uchigatana 172 / 180 (2H) / 491 (+25) / Keen 488, Somber +10 cap, 375px mobile');
  await navigate('/build-planner/');
  await waitFor("document.querySelector('#build-weapon')?.disabled===false",
   'Build Planner reloads catalog before external armor source test');
  await evaluate("document.querySelector('#build-loadout-start').click()");
  await waitFor("document.querySelector('#build-loadout-container')?.hidden===false",
   'Build Planner equipment panel active');
  assert.ok((await evaluate("document.querySelector('#build-loadout-armor-source-status').textContent"))
   .includes('not loaded'),'Pinned armor JSON never auto-downloads on page load');
  await evaluate("document.querySelector('#build-loadout-load-armor').click()");
  await waitFor("document.querySelector('#build-loadout-armor-source-status').textContent.includes('568')||document.querySelector('#build-loadout-armor-source-status').textContent.includes('unavailable')",
   'Explicit user armor source load or real error');
  const armorStatus=await evaluate("document.querySelector('#build-loadout-armor-source-status').textContent");
  assert.ok(armorStatus.includes('568'), 'Pinned armor reference failed in Chrome: '+armorStatus);
  await evaluate("(()=>{const e=document.querySelectorAll('#build-loadout-armor .build-loadout-item input[type=text]')[1];e.value='Black Knife Armor';e.dispatchEvent(new Event('input',{bubbles:true}))})()");
  const armorResult=await evaluate("({weight:document.querySelectorAll('#build-loadout-armor .build-loadout-item input[type=number]')[1].value,source:document.querySelectorAll('#build-loadout-armor .build-loadout-item input[type=number]')[1].dataset.source,text:document.querySelector('#build-loadout-results').textContent})");
  assert.equal(armorResult.weight,'9.2');
  assert.equal(armorResult.source,'community');
  assert.ok(armorResult.text.includes('pinned-community-armor-unverified'),
   'Armor result must clearly indicate source unverified, never user/game certification');
  await evaluate("(()=>{const e=document.querySelectorAll('#build-loadout-armor .build-loadout-item input[type=text]')[1];e.value='NOT A REAL ARMOR';e.dispatchEvent(new Event('input',{bubbles:true}))})()");
  assert.equal(await evaluate("document.querySelectorAll('#build-loadout-armor .build-loadout-item input[type=number]')[1].value"),'',
   'Changing armor name clears auto-filled weight rather than reusing a stale source value');


  await navigate('/armor-optimizer/');
  assert.ok((await evaluate("document.querySelector('#armor-full-status').textContent")).includes('not requested'),
   'Full armor reference must never auto-download on page load');
  await evaluate("document.querySelector('#armor-full-load').click()");
  await waitFor("document.querySelector('#armor-full-status').textContent.includes('568')||document.querySelector('#armor-full-status').textContent.includes('unavailable')",
   'Real pinned public armor source or honest load error');
  const exactArmorStatus=await evaluate("document.querySelector('#armor-full-status').textContent");
  assert.ok(exactArmorStatus.includes('568'), 'Full armor source load failed: '+exactArmorStatus);
  assert.ok(exactArmorStatus.includes('0 items lack valid source Poise'),
   'Corrected source now has complete numerically present Poise, while 19 unverified identity items remain excluded by site-verified toggle');
  await evaluate("document.querySelector('#armor-full-run').click()");
  await waitFor("document.querySelector('#armor-full-results')?.hidden===false",
   'The Worker returns an exact source-wide Poise combination under live controls');
  const sourceOptimization=await evaluate("({headline:document.querySelector('#armor-full-heading').textContent,details:document.querySelector('#armor-full-details').textContent,items:document.querySelectorAll('#armor-full-rows tr').length,status:document.querySelector('#armor-full-status').textContent})");
  assert.match(sourceOptimization.headline,/Best Poise: 71 points/);
  assert.equal(sourceOptimization.items,4);
  assert.ok(sourceOptimization.details.includes('roll tier')&&
   sourceOptimization.status.includes('completed in Worker')&&
   sourceOptimization.details.includes('0 records excluded'),
   'Live full-source optimum must disclose source Poise, load tier and excluded unknowns');
  await waitFor("document.querySelectorAll('#armor-local-top-five-rows tr').length===5",
   'Independent exact Armor top-five DP must produce five distinct ranked combinations');
  const topFive=await evaluate("({rows:[...document.querySelectorAll('#armor-local-top-five-rows tr')].map(x=>x.textContent),visible:document.querySelector('#armor-local-top-five').hidden})");
  assert.equal(topFive.visible,false);
  assert.equal(new Set(topFive.rows).size,5,'Local ranked alternatives cannot repeat exactly identical four-piece sets');
  // Same exact public v1.17 Wretch10, Normal-roll, Poise-only reference.
  await evaluate("(()=>{for(const [id,value] of [['maxLoad','48.176'],['reservedWeight','0'],['minPoise','0']])document.getElementById(id).value=value;document.querySelector('#targetTier').value='medium';document.querySelector('#armor-full-site-only').checked=true;const box=document.querySelector('#armor-v117-confirm-wretch');box.checked=true;box.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#armor-full-run').click()})()");
  await waitFor("document.querySelector('#armor-v117-reference-comparison').textContent.includes('local = 70')",
   'Real 70 Poise must match reference score under specifically confirmed Wretch10 constraints');
  await evaluate("(()=>{const e=document.querySelector('#reservedWeight');e.value='1';e.dispatchEvent(new Event('input',{bubbles:true}))})()");
  assert.match(await evaluate("document.querySelector('#armor-v117-reference-comparison').textContent"),/previous source comparison invalidated/,
   'Changing source optimizer constraints must erase previously observed parity claims');
  await evaluate("document.querySelector('#armor-v117-apply-first').click()");
  await waitFor("document.querySelector('#armor-full-results')?.hidden===false&&document.querySelector('#armor-full-rows')?.textContent.includes('Preceptor')",
   'Direct v1.17 rank-one four-piece reference armor must load only from available source pieces');
  const selectedReferenceArmor=await evaluate("({names:document.querySelector('#armor-full-rows').textContent,headline:document.querySelector('#armor-full-heading').textContent})");
  assert.ok(selectedReferenceArmor.names.includes('Circlet of Light')&&
    selectedReferenceArmor.names.includes('Tree Sentinel')&&
    selectedReferenceArmor.names.includes('Preceptor'),
    'Observed rank-one pieces must actually be locked and shown');
  assert.match(selectedReferenceArmor.headline,/70/);
  console.log('[REAL ARMOR SOURCE] PASS: pinned 568 records + 1 direct DLC and verified filtered candidate pool, exact source-constrained 4-slot Worker search.');

 }

 // Regression for the manual-input research armor optimizer: exclude a single
 // result piece, recompute without changing CSV, undo, verify 375px layout.
 await navigate('/armor-optimizer/');
 await waitFor("document.querySelectorAll('#armor-results tr').length>0",
  'Manual armor optimizer produces non-empty initial result table');
 const armorBefore=await evaluate("({csv:document.querySelector('#armor-csv').value,first:document.querySelector('#armor-results .armor-exclude-piece')?.previousElementSibling?.textContent,rows:document.querySelectorAll('#armor-results tr').length})");
 assert.ok(armorBefore.first&&armorBefore.rows>0,'Result rows expose individual armor-piece exclusions');
 await evaluate("document.querySelector('#armor-results .armor-exclude-piece').click()");
 await waitFor("document.querySelector('#armor-excluded-count')?.textContent==='1'",
  'Excluding one shown piece immediately reruns the optimizer');
 const armorAfter=await evaluate("({csv:document.querySelector('#armor-csv').value,table:document.querySelector('#armor-results').textContent,undo:document.querySelectorAll('#armor-excluded-list .armor-undo-piece').length,detail:document.querySelector('#armor-details').textContent})");
 assert.equal(armorAfter.csv,armorBefore.csv,'Exclusions must not mutate the source CSV');
 assert.ok(!armorAfter.table.includes(armorBefore.first),
  'Excluded item must not appear in any of the newly ranked combinations');
 assert.equal(armorAfter.undo,1,'Exactly one reversible piece was excluded');
 assert.ok(armorAfter.detail.includes('1 excluded items'),'Recalculation reports exclusion count');
 await evaluate("document.querySelector('#armor-excluded-list .armor-undo-piece').click()");
 await waitFor("document.querySelector('#armor-excluded-count')?.textContent==='0'",
  'Undo restores excluded piece and recomputes');
 const armorRestored=await evaluate("document.querySelector('#armor-results').textContent");
 assert.ok(armorRestored.includes(armorBefore.first),'Undo restores the original piece to ranked results');
 const armorMobile=await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth})");
 assert.ok(armorMobile.scroll<=armorMobile.width+5,
  '375px armor research optimizer must not overflow: '+JSON.stringify(armorMobile));
 console.log('[BROWSER SMOKE] Armor exact optimizer result exclusions, automatic re-search, undo, CSV integrity and 375px mobile PASS.');
 // A standalone Damage Calculator must be a functional page, not a heading.
 // Use only a local synthetic scenario and explicit user inputs; no API or
 // same-input Tarnished.dev parity claim for the unfinished competitor tool.
 await navigate('/damage-calculator/');
 await waitFor("document.querySelector('#damage-total')?.textContent==='420.248'",
  'Physical AR 500 and defense 100 computes source-model damage');
 assert.equal(await evaluate("document.querySelectorAll('#damage-enemy-fields tr').length"),8);
 await evaluate("(()=>{const e=document.querySelector('#damage-neg-physical');e.value='20';e.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#damage-total')?.textContent==='336.198'",
  'Enemy physical negation applies after individual flat defense');
 await navigate('/damage-calculator/?physical=250&magic=250');
 await waitFor("document.querySelector('#damage-total')?.textContent==='350'",
  'URL handoff produces independent 250 physical + 250 magic channel reductions');
 assert.ok((await evaluate("document.querySelector('#damage-handoff-status').textContent"))
  .includes('not authenticated proof'),'Scenario URLs must not claim v1.17 validation');
 // A magic-only weapon must not inherit the Damage page's fictional 500 Physical AR.
 await navigate('/damage-calculator/?magic=250');
 await waitFor("document.querySelector('#damage-total')?.textContent==='175'",
  'Magic-only URL must have zero physical AR and 175 modeled magic damage');
 assert.equal(await evaluate("document.querySelector('#damage-attack-physical').value"),'0');
 assert.equal(await evaluate("document.querySelector('#damage-attack-magic').value"),'250');
 const damageMobile=await evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth})");
 assert.ok(damageMobile.scroll<=damageMobile.width+5,
  '375px damage calculator must not overflow: '+JSON.stringify(damageMobile));
 // Real per-move frame DPS: no known frames yields no fake numeric output.
 assert.equal(await evaluate("document.querySelector('#damage-frame-dps').textContent"),'—');
 await evaluate("(()=>{document.querySelector('#damage-frame-calculate').click()})()");
 assert.match(await evaluate("document.querySelector('#damage-frame-status').textContent"),/frame count/,
  'Missing animation frames must fail closed rather than guessing DPS');
 await evaluate("(()=>{for(const [id,v] of [['damage-attack-physical','200'],['damage-attack-magic','0'],['damage-def-physical','0'],['damage-neg-physical','0']]){const el=document.getElementById(id);el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}const fr=document.querySelector('[data-frame-field=frames]');fr.value='60';fr.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#damage-frame-calculate').click()})()");
 await waitFor("document.querySelector('#damage-frame-dps').textContent==='180'",
  'Independent 200 physical AR, 0 defense, 100% MV, 60 frames at 60FPS produces 180 source-model DPS');
 console.log('[INDEPENDENT DPS FRAMES] PASS: zero-default frames fail closed, entered 60-frame move yields mathematical DPS 180.');
 console.log('[DAMAGE PREVIEW] PASS: 8 defense pairs, motion/negation formula, split-AR URL handoff, 375px mobile.');
 // Newly added real-v1.17 reference workflows: verify the actually rendered
 // outputs and fail-closed behavior in Chrome, not merely source-file strings.
 await navigate('/damage-calculator/');
 await waitFor("document.querySelector('#damage-v117-ar')?.textContent==='376'",
  'Twice-observed public v1.17 Uchigatana +25 AR visible separately from the manual damage estimate');
 assert.equal(await evaluate("document.querySelector('#damage-v117-single').textContent"),'464');
 await evaluate("(()=>{const x=document.querySelector('#damage-v117-scene');x.value='20,20';x.dispatchEvent(new Event('change',{bubbles:true}))})()");
 await waitFor("document.querySelector('#damage-v117-ar').textContent==='388'&&document.querySelector('#damage-v117-single').textContent==='483'",
  'Real 20/20 reference scene changes exactly and does not reuse stale 15/20 DPS');
 await navigate('/spell-calculator/');
 await waitFor("document.querySelector('#spell-magic')?.textContent==='242'",
  'The exact public Glintstone Pebble v1.17 sample renders without extrapolation');
 await evaluate("(()=>{const x=document.querySelector('#spell-int');x.value='30';x.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#spell-magic').textContent==='267'",
  'Actual independently observed 30 INT sorcery result must show 267');
 await evaluate("(()=>{const x=document.querySelector('#spell-int');x.value='31';x.dispatchEvent(new Event('input',{bubbles:true}))})()");
 assert.equal(await evaluate("document.querySelector('#spell-outcome').hidden"),true,
  'Unobserved INT31 must not show a guessed spell damage');
 assert.equal(await evaluate("getComputedStyle(document.querySelector('#spell-outcome')).display"),'none',
  'Hidden reference damage must not remain visually displayed under CSS .metric-grid display');
 assert.equal(await evaluate("document.querySelector('#spell-magic').textContent"),'—',
  'Previously observed spell damage must clear immediately when input is unsupported');
 assert.match(await evaluate("document.querySelector('#spell-status').textContent"),/NOT OBSERVED/);
 // Independent spell engine: user-triggered pinned catalyst parameter download,
 // not the fixed reference lookup. Verify three actual Tarnished.dev v1.17 rows.
 await evaluate("document.querySelector('#spell-load-math').click()");
 await waitFor("document.querySelector('#spell-math-damage').textContent!=='—'||document.querySelector('#spell-math-status').dataset.state==='error'",
  'Pinned public v1.17 source loads and Glintstone Pebble is calculated from catalyst scaling');
 const spellIndependentStatus=await evaluate("document.querySelector('#spell-math-status').textContent");
 assert.ok(!spellIndependentStatus.includes('Source unavailable')&&
  !spellIndependentStatus.includes('Calculation refused'),
  'Independent source calculation unexpectedly failed: '+spellIndependentStatus);
 await evaluate("(()=>{const e=document.querySelector('#spell-int');e.value='25';e.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#spell-math-damage').textContent==='242'",
  'Real Tarnished v1.17 spell magic at INT25 must be independently calculated to site 242 boundary');
 assert.equal(await evaluate("document.querySelector('#spell-math-raw').textContent"),'243',
  'INT25 one-point source arithmetic boundary remains disclosed, not globally hidden');
 await evaluate("(()=>{const e=document.querySelector('#spell-int');e.value='30';e.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#spell-math-damage').textContent==='267'",
  'Pinned catalyst math Glintstone Pebble INT30 equals actual Tarnished v1.17 267');
 await evaluate("(()=>{const e=document.querySelector('#spell-int');e.value='40';e.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#spell-math-damage').textContent==='315'",
  'Pinned catalyst math Glintstone Pebble INT40 equals actual Tarnished v1.17 315');
 await evaluate("(()=>{const e=document.querySelector('#spell-int');e.value='50';e.dispatchEvent(new Event('input',{bubbles:true}))})()");
 assert.equal(await evaluate("document.querySelector('#spell-math-damage').textContent"),'362');
 assert.match(await evaluate("document.querySelector('#spell-math-status').textContent"),/public site two-pass damage 363/,
  'Actual INT50 Tarnished.dev magic 363 must remain visibly different from source model 362');
 assert.match(await evaluate("document.querySelector('#spell-math-status').textContent"),/SOURCE_MODEL_NUMERIC_MISMATCH/,
  'INT50 genuine one-point discrepancy cannot be hidden by a site-specific fake adjustment');
 await evaluate("(()=>{const e=document.querySelector('#spell-int');e.value='60';e.dispatchEvent(new Event('input',{bubbles:true}))})()");
 await waitFor("document.querySelector('#spell-math-damage').textContent==='410'",
  'Independent source staff model matches twice-observed Tarnished.dev INT60 magic 410');
 await evaluate("(()=>{const e=document.querySelector('#spell-int');e.value='51';e.dispatchEvent(new Event('input',{bubbles:true}))})()");
 assert.match(await evaluate("document.querySelector('#spell-math-status').textContent"),/No same-input Tarnished.dev benchmark/,
  'Unobserved INT51 calculated from source cannot be called actual real-site verified');

 await navigate('/build-planner/');
 await evaluate("document.querySelector('#build-loadout-start').click()");
 await waitFor("document.querySelector('[aria-label=\\\"Choose a twice-observed reference talisman combination\\\"]')!==null",
  'Live Build equipment planner loads exact-source combination presets');
 await evaluate("(()=>{const x=document.querySelector('[aria-label=\\\"Choose a twice-observed reference talisman combination\\\"]');x.value='2';document.querySelector('#build-loadout-talismans .build-armor-metric-panel button').click()})()");
 await waitFor("document.querySelector('#build-v117-combined-talisman-reference')!==null",
  'Twice-observed Radagon and Marika Soreseal combo renders actual public Wretch profile');
 const realBuild=await evaluate("({attrs:[...document.querySelectorAll('#stat-grid [data-stat]')].map(x=>x.value),origin:document.querySelector('#origin').value,selected:document.querySelector('#build-v117-combined-talisman-reference').textContent,maximum:document.querySelector('#build-loadout-maximum').value})");
 assert.equal(realBuild.origin,'Wretch');
 assert.equal(realBuild.maximum,'56.1','Two Soreseals must load the observed buffed equip capacity, not naked Wretch 48.176');
 assert.deepEqual(realBuild.attrs,Array(8).fill('10'));
 assert.ok(realBuild.selected.includes('-32.25%'),
  'Combined Soreseal negative damage negation must be the real observed -32.25%, not -30%');
 const compositionResult=await evaluate("document.querySelector('#build-v117-independent-talisman-stats')?.textContent||''");
 assert.match(compositionResult,/REAL_TARNISHED_V117_ATTRIBUTES_MATCH/,
  'Independent Build combination must mathematically reproduce exact real two-Soreseal site attributes');
 assert.match(compositionResult,/STR 10 \+ 5 = 15/,
  'Real independent strength +5 composition must be visible in Build');

 console.log('[FOUR MODULE BUILD SMOKE] PASS: one-click exact two-Soreseal Wretch10 scenario, real observed -32.25% negation.');
 await navigate('/armor-optimizer/');
 assert.equal(await evaluate("document.querySelector('#armor-v117-apply-first').disabled"),true,
  'The site rank-one armor preset must stay disabled before the user loads the source');
 assert.match(await evaluate("document.querySelector('#armor-v117-reference-comparison').textContent"),
  /Reference comparison disabled/);
 console.log('[FOUR MODULE REF SMOKE] PASS: Damage real AR/DPS scene switch, Spell exact-only/no-interpolation, Armor opt-in guard.');
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
