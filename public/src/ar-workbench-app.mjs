import {POWER_STATS} from './weapon-ar.mjs';
import {downloadV117Source,V117_PROVENANCE} from './upstream-regulation-v117.mjs';
const get=id=>document.getElementById(id);
const feedback=(s,bad=false)=>{
 get('arw-feedback').textContent=s;
 get('arw-feedback').className=bad?'feedback bad':'feedback';
};
const clear=()=>{
 get('arw-onehand').textContent='—';get('arw-twohand').textContent='—';
 get('arw-delta').textContent='—';get('arw-effective').textContent='—';
 get('arw-components').replaceChildren();get('arw-comparison').hidden=true;
 get('arw-rounding-summary').textContent='—';
};
const make=(tag,value)=>{const e=document.createElement(tag);e.textContent=String(value);return e;};
const labels={str:'Strength',dex:'Dexterity',int:'Intelligence',fai:'Faith',arc:'Arcane'};
for(const stat of POWER_STATS){
 const label=make('label',labels[stat]);label.className='stat-field';
 const input=make('input','');input.type='number';input.min='1';input.max='99';input.step='1';
 input.inputMode='numeric';input.dataset.arwStat=stat;
 input.value=stat==='str'?'40':stat==='dex'?'20':'10';
 label.append(input);get('arw-stats').append(label);
}
let worker;
try{worker=new Worker(new URL('./ar-workbench-worker.mjs',import.meta.url),{type:'module'});}
catch(e){feedback('Your browser does not support the local research worker: '+e.message,true);}
let fileLoaded=false,selected=false,upgrades=[],syntheticMode=false;
let selectedB=false,bUpgrades=[],comparisonRevision=0,gripRevision=0;
let auditReport=null,mathReport=null;
let sourceLoadRevision=0,sourceLoadController=null;
const initialWeaponQuery=(()=>{const value=new URLSearchParams(location.search).get('weapon');return value&&value.length<=100?value:'';})();
const cancelPinnedLoad=()=>{sourceLoadRevision++;sourceLoadController?.abort();sourceLoadController=null;get('arw-load-upstream').disabled=false;};
const clearMathAudit=()=>{
 mathReport=null;
 get('arw-parity-run').disabled=true;get('arw-parity-download').disabled=true;
 get('arw-parity-results').hidden=true;
 for(const id of ['arw-parity-total','arw-parity-converted','arw-parity-cases',
  'arw-parity-mismatches','arw-parity-unsupported'])
  get(id).textContent='—';
 get('arw-parity-reasons').replaceChildren();
 get('arw-parity-feedback').textContent='Load a source dataset to compare raw parameter arithmetic against the converter.';
};
const clearAudit=()=>{
 auditReport=null;clearMathAudit();
 get('arw-audit-run').disabled=true;get('arw-audit-download').disabled=true;
 get('arw-audit-results').hidden=true;
 get('arw-audit-reasons').replaceChildren();
 get('arw-audit-scope-reasons').replaceChildren();
 for(const id of ['arw-audit-total','arw-audit-converted','arw-audit-blocked','arw-audit-coverage',
  'arw-audit-review','arw-audit-limited'])
  get(id).textContent='—';
 get('arw-audit-feedback').textContent='Load data or the fictional demo to run a full structural audit.';
};
const clearPair=()=>{
 comparisonRevision++;
 get('arw-compare-results').hidden=true;
 get('arw-pair-rows').replaceChildren();
 get('arw-pair-rounding-summary').textContent='—';
 for(const key of ['arw-pair-a','arw-pair-b','arw-pair-delta'])get(key).textContent='—';
};
const readStats=()=>{
 const stats={};
 for(const el of get('arw-stats').querySelectorAll('input[data-arw-stat]')){
  if(!/^(?:[1-9]|[1-9][0-9])$/.test(el.value.trim()))
   throw new RangeError('All attributes must be whole numbers from 1 to 99.');
  stats[el.dataset.arwStat]=Number(el.value);
 }
 return stats;
};
const send=(message)=>{if(!worker)throw new Error('Browser worker unavailable.');worker.postMessage(message);};
const setOptions=(records)=>{
 const select=get('arw-select');select.replaceChildren();
 for(const name of records){const option=new Option(name,name);select.add(option);}
 select.disabled=records.length===0;
 const second=get('arw-compare-select');second.replaceChildren();
 for(const name of records)second.add(new Option(name,name));
 second.disabled=records.length===0;
 if(records.length>1)second.selectedIndex=1;
 selected=false;selectedB=false;bUpgrades=[];
 gripRevision++;clear();clearPair();get('arw-upgrade').replaceChildren();get('arw-compare-upgrade').replaceChildren();
 if(!records.length)get('arw-results-count').textContent='No matching weapon names.';
};
function selectCurrent(){
 if(!fileLoaded||get('arw-select').disabled||!get('arw-select').value)return;
 selected=false;gripRevision++;clear();clearPair();
 send({op:'select',name:get('arw-select').value});
}
function selectSecond(){
 const second=get('arw-compare-select');
 selectedB=false;bUpgrades=[];clearPair();get('arw-compare-upgrade').replaceChildren();
 if(!fileLoaded||second.disabled||!second.value)return;
 send({op:'selectB',name:second.value});
}
function requestCalculation(){
 gripRevision++;
 if(!selected)return;
 try{
  const stats=readStats(),upgrade=Number(get('arw-upgrade').value);
  if(!upgrades.includes(upgrade))throw new RangeError('Selected upgrade level has no source data.');
  send({op:'compare',requestId:gripRevision,stats,upgrade});
 }catch(e){clear();feedback(e.message,true);}
}
function requestComparison(){
 clearPair();
 if(!selected||!selectedB)return;
 try{
  const stats=readStats();
  const leftUpgrade=Number(get('arw-upgrade').value);
  const rightUpgrade=Number(get('arw-compare-upgrade').value);
  if(!upgrades.includes(leftUpgrade)||!bUpgrades.includes(rightUpgrade))
   throw new RangeError('Choose supplied reinforcement levels for both weapons.');
  send({op:'compare-weapons',requestId:comparisonRevision,stats,leftUpgrade,rightUpgrade,
   twoHanded:get('arw-compare-grip').value==='two'});
 }catch(e){get('arw-pair-feedback').textContent=e.message;}
}
if(worker)worker.onmessage=({data:m})=>{
 if(m.op==='error'){
  if(m.phase==='math-audit'){
   get('arw-parity-run').disabled=false;
   get('arw-parity-feedback').textContent='Math parity check failed: '+m.message;
   return;
  }
  if(m.phase==='audit'){
   get('arw-audit-run').disabled=false;
   get('arw-audit-feedback').textContent='Audit failed: '+m.message;
   return;
  }
  if(m.phase==='compare-weapons'||m.phase==='selectB'){
   if(m.phase==='selectB')selectedB=false;
   clearPair();get('arw-pair-feedback').textContent=m.message;return;
  }
  if(m.phase==='load'){fileLoaded=false;get('arw-select').replaceChildren();get('arw-select').disabled=true;get('arw-file-status').textContent='No file loaded';}
  if(m.phase==='select')selected=false;
  gripRevision++;clear();clearPair();feedback(m.message,true);return;
 }
 if(m.op==='cleared'){
  clearAudit();
  fileLoaded=false;selected=false;selectedB=false;upgrades=[];bUpgrades=[];syntheticMode=false;
  gripRevision++;clearPair();get('arw-compare-select').replaceChildren();
  get('arw-compare-upgrade').replaceChildren();
  get('arw-file-status').textContent='No file loaded';
  get('arw-select').replaceChildren();get('arw-select').disabled=true;get('arw-search').value='';
  get('arw-upgrade').replaceChildren();get('arw-description').textContent='—';
  get('arw-results-count').textContent='—';clear();feedback('Local file cleared from worker memory.');return;
 }
 if(m.op==='loaded'){
  clearAudit();get('arw-audit-run').disabled=false;get('arw-parity-run').disabled=false;
  fileLoaded=true;syntheticMode=Boolean(m.synthetic);
  get('arw-file-status').textContent=m.count.toLocaleString('en-US')+
    (syntheticMode?' FICTIONAL demo entries (not game weapons).':' locally imported weapon names in memory.');
  get('arw-search').value='';get('arw-results-count').textContent=m.preview.matches+' results; only first '+m.preview.names.length+' shown.';
  setOptions(m.preview.names);
  feedback(syntheticMode?'FICTIONAL DEMO: all computed AR values are invented.':
    'Third-party parameter JSON loaded into local worker memory. NO independent in-game AR certification.');
  if(initialWeaponQuery&&!syntheticMode){
    get('arw-search').value=initialWeaponQuery;
    send({op:'search',term:initialWeaponQuery});
  }else if(m.preview.names.length){selectCurrent();selectSecond();}
  return;
 }
 if(m.op==='math-audit-progress'){
  get('arw-parity-feedback').textContent=
   'Compared '+m.progress.processed+' of '+m.progress.total+' weapon/affinity rows in local worker…';
  return;
 }
 if(m.op==='math-audit-complete'){
  mathReport=m.report;
  get('arw-parity-run').disabled=false;get('arw-parity-download').disabled=false;
  get('arw-parity-results').hidden=false;
  for(const [id,value] of Object.entries({
   'arw-parity-total':m.report.totalRows,
   'arw-parity-converted':m.report.converted,
   'arw-parity-cases':m.report.compared,
   'arw-parity-mismatches':m.report.mismatched,
   'arw-parity-unsupported':m.report.unsupported
  }))get(id).textContent=String(value);
  const reasons=get('arw-parity-reasons');reasons.replaceChildren();
  for(const [key,count] of Object.entries(m.report.errorsByReason)){
   const row=make('tr','');row.append(make('td',key),make('td',count));reasons.append(row);
  }
  if(!reasons.childElementCount){
   const row=make('tr',''),cell=make('td','No arithmetic differences or conversion failures found.');
   cell.colSpan=2;row.append(cell);reasons.append(row);
  }
  get('arw-parity-feedback').textContent=m.report.parityPass?
   'Source arithmetic agrees with our converted AR across audited cases. NOT independently game verified.':
   'Differences or unsupported cases found. See anonymous audit report. NOT game validated.';
  return;
 }
 if(m.op==='audit-progress'){
  get('arw-audit-feedback').textContent=
   'Checked '+m.progress.processed.toLocaleString('en-US')+' of '+
   m.progress.total.toLocaleString('en-US')+' records in local worker…';
  return;
 }
 if(m.op==='audit-complete'){
  auditReport=m.report;get('arw-audit-run').disabled=false;
  get('arw-audit-download').disabled=false;
  get('arw-audit-results').hidden=false;
  get('arw-audit-total').textContent=String(m.report.totals.records);
  get('arw-audit-converted').textContent=String(m.report.totals.convertible);
  get('arw-audit-blocked').textContent=String(m.report.totals.blocked);
  get('arw-audit-coverage').textContent=m.report.conversionCoverage+'%';
  get('arw-audit-review').textContent=String(m.report.scopeReview.needsReview);
  get('arw-audit-limited').textContent=m.report.scopeReview.limitedModelCoverage+'%';
  const scope=get('arw-audit-scope-reasons');scope.replaceChildren();
  for(const [reason,count] of Object.entries(m.report.scopeReview.byReason)){
   const tr=make('tr','');tr.append(make('td',reason),make('td',count));scope.append(tr);
  }
  if(!scope.childElementCount){
   const tr=make('tr',''),cell=make('td','No detectable limited-model scope flags.');
   cell.colSpan=2;tr.append(cell);scope.append(tr);
  }
  const tbody=get('arw-audit-reasons');tbody.replaceChildren();
  for(const [reason,count] of Object.entries(m.report.invalidByReason)){
   const row=make('tr','');
   row.append(make('td',reason),make('td',count));tbody.append(row);
  }
  if(!tbody.childElementCount){
   const row=make('tr','');const cell=make('td','No structural conversion failures detected.');
   cell.colSpan=2;row.append(cell);tbody.append(row);
  }
  get('arw-audit-feedback').textContent=(syntheticMode?'FICTIONAL DEMO · ':'')+
   'Structural conversion: '+m.report.conversionCoverage+'%; '+
   m.report.scopeReview.needsReview+' convertible record(s) still require scope review. '+
   'This is NOT current-game validation or a data-distribution authorization.';
  return;
 }
 if(m.op==='search-results'){
  get('arw-results-count').textContent=m.result.matches+' matching names; first '+m.result.names.length+' shown.';
  setOptions(m.result.names);if(m.result.names.length){selectCurrent();selectSecond();}return;
 }
 if(m.op==='selected'){
  selected=true;upgrades=m.description.upgradeLevels;
  get('arw-description').textContent=m.description.name+' · '+m.description.gripMode+
   ' grip · '+m.description.damageTypes.join(' + ')+' damage types · '+m.description.provenance.gameVersion;
  const u=get('arw-upgrade');u.replaceChildren();
  for(const n of upgrades)u.add(new Option('+'+n,String(n)));
  requestCalculation();requestComparison();return;
 }
 if(m.op==='selectedB'){
  selectedB=true;bUpgrades=m.description.upgradeLevels;
  const select=get('arw-compare-upgrade');select.replaceChildren();
  for(const n of bUpgrades)select.add(new Option('+'+n,String(n)));
  get('arw-pair-feedback').textContent='Weapon B: '+m.description.name;
  requestComparison();return;
 }
 if(m.op==='compared-weapons'){
  if(m.requestId!==comparisonRevision)return;
  const {left,right,delta,components}=m.result;
  get('arw-pair-a').textContent=String(left.total);
  get('arw-pair-b').textContent=String(right.total);
  get('arw-pair-delta').textContent=(delta>=0?'+':'')+delta;
  const tbody=get('arw-pair-rows');tbody.replaceChildren();
  for(const component of components){
   const row=make('tr','');
   for(const value of [component.type,component.left,component.right,
     (component.delta>=0?'+':'')+component.delta])row.append(make('td',value));
   tbody.append(row);
  }
  get('arw-compare-results').hidden=false;
  get('arw-pair-rounding-summary').textContent=
   'Rounding variants (sum of component floors / floor raw sum): A '+left.floorComponents+
   ' / '+left.floorTotal+', B '+right.floorComponents+' / '+right.floorTotal+
   '. Active rule: '+left.calculationRules.rounding+'.';
  get('arw-pair-feedback').textContent=syntheticMode?
   'FICTIONAL TEST — both weapon AR values are invented.':
   'UNVERIFIED nominal AR. A higher total does not establish higher real damage.';
  return;
 }
 if(m.op==='compared'){
  if(m.requestId!==gripRevision)return;
  const {oneHand,twoHand,difference}=m.result;
  get('arw-onehand').textContent=oneHand.total;
  get('arw-twohand').textContent=twoHand.total;
  get('arw-delta').textContent=(difference>=0?'+':'')+difference;
  get('arw-effective').textContent=oneHand.effectiveStats.str+' / '+twoHand.effectiveStats.str;
  const tbody=get('arw-components');tbody.replaceChildren();
  for(const before of oneHand.perElement){
   const after=twoHand.perElement.find(x=>x.element===before.element);
   const row=make('tr','');
   for(const value of [before.element,before.displayed,after?.displayed??0]){
    row.append(make('td',value));
   }
   tbody.append(row);
  }
  get('arw-comparison').hidden=false;
  get('arw-rounding-summary').textContent=
    'Rounding variants (sum of floored components / floor total raw AR): 1H '+
    oneHand.floorComponents+' / '+oneHand.floorTotal+', 2H '+
    twoHand.floorComponents+' / '+twoHand.floorTotal+
    '. Applied: '+oneHand.calculationRules.rounding+'; requirement rule: '+
    oneHand.calculationRules.requirements+'.';
  feedback(syntheticMode?'FICTIONAL DEMO ONLY — values are invented, NOT Elden Ring AR.':
 'Calculated with your imported parameters. Results remain UNVERIFIED game AR.');
 }
};
get('arw-load-upstream').addEventListener('click',async()=>{
 if(!worker){feedback('This browser cannot start the local AR worker.',true);return;}
 cancelPinnedLoad();
 const revision=sourceLoadRevision;
 const controller=new AbortController();sourceLoadController=controller;
 const button=get('arw-load-upstream');button.disabled=true;
 get('arw-upstream-status').textContent='Downloading pinned public 1.17 JSON from GitHub into this browser on your request…';
 try{
  const {text,summary}=await downloadV117Source(fetch,{signal:controller.signal});
  if(revision!==sourceLoadRevision)return;
  get('arw-version').value='1.17 (community snapshot)';
  get('arw-source').value=V117_PROVENANCE;
  gripRevision++;clear();clearPair();clearAudit();selected=false;selectedB=false;fileLoaded=false;
  send({op:'clear'});
  send({op:'load',text,version:'1.17',reference:V117_PROVENANCE});
  get('arw-upstream-status').textContent=
   summary.entries.toLocaleString('en-US')+' source weapon/affinity variants downloaded. '+
   'Calculation remains a research preview. Run the complete structural audit below.';
 }catch(error){
  if(revision!==sourceLoadRevision)return;
  get('arw-upstream-status').textContent=
   'Could not load the source: '+error.message+
   ' Use the upstream file link and local JSON import as a fallback.';
  feedback('Public v1.17 source download did not complete. No third-party script ran.',true);
 }finally{
  if(revision===sourceLoadRevision){button.disabled=false;sourceLoadController=null;}
 }
});
get('arw-load').addEventListener('click',async()=>{
 cancelPinnedLoad();
 const file=get('arw-file').files?.[0];
 if(!file){feedback('Choose a .json file first.',true);return;}
 if(!file.name.toLowerCase().endsWith('.json')||file.size>16_000_000){
  feedback('Only a local .json file smaller than 16 MB is supported. No .js execution.',true);return;
 }
 const version=get('arw-version').value.trim(),reference=get('arw-source').value.trim();
 if(!version||version.length>60||!reference||reference.length>300){
  feedback('Enter an explicit game version and data provenance before loading.',true);return;
 }
 gripRevision++;clear();clearPair();clearAudit();selected=false;selectedB=false;fileLoaded=false;
 get('arw-file-status').textContent='Reading local file…';
 try{
  send({op:'clear'});send({op:'load',text:await file.text(),version,reference});
  feedback('Parsing and checking names in a dedicated browser worker…');
 }catch(e){feedback(e.message,true);}
});
get('arw-clear').addEventListener('click',()=>{cancelPinnedLoad();get('arw-file').value='';send({op:'clear'});get('arw-upstream-status').textContent='No remote source loaded.';});
get('arw-parity-run').addEventListener('click',()=>{
 if(!fileLoaded)return;
 clearMathAudit();
 get('arw-parity-feedback').textContent='Checking raw source arithmetic against converted AR in memory…';
 send({op:'math-audit'});
});
get('arw-parity-download').addEventListener('click',()=>{
 if(!mathReport)return;
 const raw=JSON.stringify(mathReport,null,2)+'\n';
 const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));
 const node=make('a','');node.href=url;node.download='v117-ar-parity-report.json';
 document.body.append(node);node.click();node.remove();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
});
get('arw-audit-run').addEventListener('click',()=>{
 if(!fileLoaded)return;
 clearAudit();get('arw-audit-feedback').textContent='Checking every entry in a background worker…';
 send({op:'audit'});
});
get('arw-audit-download').addEventListener('click',()=>{
 if(!auditReport)return;
 const data=JSON.stringify(auditReport,null,2)+'\n';
 const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));
 const node=make('a','');node.href=url;node.download='ar-structure-audit.json';
 document.body.append(node);node.click();node.remove();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
});
get('arw-demo').addEventListener('click',()=>{cancelPinnedLoad();get('arw-file').value='';send({op:'demo'});});
get('arw-search').addEventListener('input',()=>{if(fileLoaded)send({op:'search',term:get('arw-search').value});});
get('arw-select').addEventListener('change',selectCurrent);
get('arw-compare-select').addEventListener('change',selectSecond);
get('arw-upgrade').addEventListener('change',()=>{clear();requestCalculation();requestComparison();});
get('arw-compare-upgrade').addEventListener('change',requestComparison);
get('arw-compare-grip').addEventListener('change',requestComparison);
get('arw-compare-run').addEventListener('click',requestComparison);
get('arw-stats').addEventListener('input',()=>{clear();requestCalculation();requestComparison();});
get('arw-compare').addEventListener('click',requestCalculation);
feedback('Click to load pinned public 1.17 data in your browser, or supply a local JSON file. No regulation dataset ships with the site.');
