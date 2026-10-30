import {POWER_STATS} from './weapon-ar.mjs';
import {makeUnreviewedArObservation} from './ar-observation.mjs';
import {parseArWorkbenchHandoff} from './ar-workbench-navigation.mjs';
const handoff=parseArWorkbenchHandoff(location.search);
import {downloadV117Source,V117_PROVENANCE} from './upstream-regulation-v117.mjs';
const get=id=>document.getElementById(id);
const feedback=(s,bad=false)=>{
 get('arw-feedback').textContent=s;
 get('arw-feedback').className=bad?'feedback bad':'feedback';
};
let sensitivityRevision=0;
const clearSensitivity=()=>{
 sensitivityRevision++;
 get('arw-sensitivity-results').hidden=true;
 get('arw-sensitivity-rows').replaceChildren();
 get('arw-sensitivity-summary').textContent='';
};
let progressionRevision=0,recheckRevision=0;
const clearProgression=()=>{
 progressionRevision++;
 get('arw-progression-results').hidden=true;
 get('arw-progression-rows').replaceChildren();
 get('arw-progression-summary').textContent='';
};
const clearRecheck=()=>{
 recheckRevision++;
 get('arw-recheck-results').hidden=true;
 get('arw-recheck-summary').textContent='';
 get('arw-recheck-drift').textContent='—';
 get('arw-recheck-game-gap').textContent='—';
};
let familyRevision=0;
const clearFamily=()=>{
 familyRevision++;
 get('arw-family-results').hidden=true;
 get('arw-family-rows').replaceChildren();
 get('arw-family-summary').textContent='';
};
let latestGripResults=null;
const clear=()=>{
 clearFamily();clearProgression();clearRecheck();clearSensitivity();
 latestGripResults=null;
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
 input.value=String(handoff.stats?.[POWER_STATS.indexOf(stat)]??(stat==='str'?40:stat==='dex'?20:10));
 label.append(input);get('arw-stats').append(label);
}
let worker;
try{worker=new Worker(new URL('./ar-workbench-worker.mjs',import.meta.url),{type:'module'});}
catch(e){feedback('Your browser does not support the local research worker: '+e.message,true);}
let fileLoaded=false,selected=false,upgrades=[],syntheticMode=false;
let currentRequirements=null,searchRevision=0,selectRevision=0,selectBRevision=0;
let pendingUpgradeFromLink=handoff.upgrade;
let selectedB=false,bUpgrades=[],comparisonRevision=0,gripRevision=0;
let auditReport=null,mathReport=null;
let sourceLoadRevision=0,sourceLoadController=null;
const initialWeaponQuery=handoff.weapon;
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
const setOptions=(records,preferred='')=>{
 const select=get('arw-select');select.replaceChildren();
 for(const name of records){const option=new Option(name,name);select.add(option);}
 select.disabled=records.length===0;
 if(preferred&&records.includes(preferred))select.value=preferred;
 const second=get('arw-compare-select');second.replaceChildren();
 for(const name of records)second.add(new Option(name,name));
 second.disabled=records.length===0;
 if(records.length>1)second.selectedIndex=1;
 selected=false;selectedB=false;bUpgrades=[];currentRequirements=null;
 get('arw-upgrade-max').disabled=true;get('arw-apply-requirements').disabled=true;
 get('arw-family-run').disabled=true;
 get('arw-progression-run').disabled=true;get('arw-sensitivity-run').disabled=true;
 gripRevision++;clear();clearPair();get('arw-upgrade').replaceChildren();get('arw-compare-upgrade').replaceChildren();
 if(!records.length)get('arw-results-count').textContent='No matching weapon names.';
};
function selectCurrent(){
 if(!fileLoaded||get('arw-select').disabled||!get('arw-select').value)return;
 selected=false;gripRevision++;clear();clearPair();
 get('arw-upgrade-max').disabled=true;get('arw-apply-requirements').disabled=true;
 get('arw-progression-run').disabled=true;get('arw-sensitivity-run').disabled=true;
 send({op:'select',requestId:++selectRevision,name:get('arw-select').value});
}
function selectSecond(){
 const second=get('arw-compare-select');
 selectedB=false;bUpgrades=[];clearPair();get('arw-compare-upgrade').replaceChildren();
 if(!fileLoaded||second.disabled||!second.value)return;
 send({op:'selectB',requestId:++selectBRevision,name:second.value});
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
  if(m.phase==='stat-sensitivity'){
   if(m.requestId!==sensitivityRevision)return;
   get('arw-sensitivity-feedback').textContent='Attribute sensitivity failed: '+m.message;return;
  }
  if(m.phase==='upgrade-progression'){
   if(m.requestId!==progressionRevision)return;
   get('arw-progression-feedback').textContent='Upgrade progression failed: '+m.message;return;
  }
  if(m.phase==='recheck-observation'){
   if(m.requestId!==recheckRevision)return;
   get('arw-recheck-feedback').textContent='Observation recheck failed: '+m.message;return;
  }
  if(m.phase==='family-compare'){
   if(m.requestId!==familyRevision)return;
   get('arw-family-feedback').textContent='Family comparison failed: '+m.message;return;
  }
  if(m.phase==='search'||m.phase==='family'){
   if(m.requestId!==searchRevision)return;
   get('arw-results-count').textContent='Search error: '+m.message;
   return;
  }
  if(m.phase==='select'&&m.requestId!==selectRevision)return;
  if(m.phase==='selectB'&&m.requestId!==selectBRevision)return;
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
  if(m.phase==='select')currentRequirements=null;
  gripRevision++;clear();clearPair();feedback(m.message,true);return;
 }
 if(m.op==='cleared'){
  clearAudit();
  fileLoaded=false;selected=false;selectedB=false;upgrades=[];bUpgrades=[];syntheticMode=false;
  currentRequirements=null;searchRevision++;selectRevision++;selectBRevision++;
  get('arw-upgrade-max').disabled=true;get('arw-apply-requirements').disabled=true;
  get('arw-family-run').disabled=true;get('arw-progression-run').disabled=true;get('arw-sensitivity-run').disabled=true;
  get('arw-recheck-run').disabled=true;
  gripRevision++;clearPair();clearFamily();clearProgression();clearRecheck();clearSensitivity();get('arw-compare-select').replaceChildren();
  get('arw-compare-upgrade').replaceChildren();
  get('arw-file-status').textContent='No file loaded';
  get('arw-select').replaceChildren();get('arw-select').disabled=true;get('arw-search').value='';
  get('arw-upgrade').replaceChildren();get('arw-description').textContent='—';
  get('arw-results-count').textContent='—';clear();feedback('Local file cleared from worker memory.');return;
 }
 if(m.op==='loaded'){
  clearAudit();get('arw-audit-run').disabled=false;get('arw-parity-run').disabled=false;
  fileLoaded=true;syntheticMode=Boolean(m.synthetic);
   get('arw-recheck-run').disabled=syntheticMode;
  get('arw-file-status').textContent=m.count.toLocaleString('en-US')+
    (syntheticMode?' FICTIONAL demo entries (not game weapons).':' locally imported weapon names in memory.');
  get('arw-search').value='';get('arw-results-count').textContent=m.preview.matches+' results; only first '+m.preview.names.length+' shown.';
  setOptions(m.preview.names);
  feedback(syntheticMode?'FICTIONAL DEMO: all computed AR values are invented.':
    'Third-party parameter JSON loaded into local worker memory. NO independent in-game AR certification.');
  if(initialWeaponQuery&&!syntheticMode){
    get('arw-search').value=initialWeaponQuery;
    send({op:'family',requestId:++searchRevision,name:initialWeaponQuery});
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
 if(m.op==='family-results'){
  if(m.requestId!==searchRevision)return;
  if(!m.result.found){
   setOptions([]);
   get('arw-results-count').textContent='Exact weapon family not found in imported source. Search a source-defined name instead.';
   get('arw-handoff-context').textContent='Requested catalog weapon: '+initialWeaponQuery+'. No matching source family; values are not guessed.';
   return;
  }
  setOptions(m.result.names,m.result.defaultName);
  get('arw-results-count').textContent=m.result.matches+' sourced variants for '+m.result.family+
   '; selected: '+m.result.defaultName+'.';
  get('arw-handoff-context').textContent='Linked weapon: '+m.result.family+
   ' · '+m.result.matches+' source-defined affinity/weapon variants. Player stats '+(handoff.stats?'carried from weapon database.':'use local defaults.')+
   ' Still NOT certified current-game AR.';
  selectCurrent();selectSecond();return;
 }
 if(m.op==='search-results'){
  if(m.requestId!==searchRevision)return;
  get('arw-results-count').textContent=m.result.matches+' matching names; first '+m.result.names.length+' shown.';
  setOptions(m.result.names);if(m.result.names.length){selectCurrent();selectSecond();}return;
 }
 if(m.op==='stat-sensitivity-result'){
  if(m.requestId!==sensitivityRevision)return;
  const out=m.result,body=get('arw-sensitivity-rows');body.replaceChildren();
  get('arw-sensitivity-summary').textContent=out.weaponName+
   ' · Source: '+out.parameterSourceVersion+
   ' · Upgrade +'+out.upgrade+' · '+(out.twoHanded?'two-handed':'one-handed')+
   ' · Baseline nominal AR '+out.baselineTotal+
   ' · Unmet base requirements: '+(out.missingRequirementsBefore.join(', ')||'none')+
   '. All values are UNVERIFIED game-menu AR.';
  for(const item of out.rows){
   const tr=make('tr',''),calc=item.spentPoints>0;
   const cells=[
    labels[item.stat], '+'+item.requestedPoints, item.spentPoints,
    calc?item.statBefore+' → '+item.statAfter:'At 99',
    calc?item.total:'—',calc?(item.gain>=0?'+':'')+item.gain:'—',
    calc?item.gainPerPoint.toFixed(2):'—',
    ...['physical','magic','fire','lightning','holy'].map(
     d=>calc?(item.componentGains[d]>=0?'+':'')+item.componentGains[d]:'—'),
    (item.status==='capped-at-99'?'Clipped at 99. ':'')+
    (item.requirementsNewlyMet.length?'Now meets '+item.requirementsNewlyMet.join(', ')+'. ':'')+
    (item.missingRequirementsAfter.length?'Still unmet '+item.missingRequirementsAfter.join(', ')+'. ':'')+
    (calc?'Nominal AR only':'No more points available')
   ];
   for(const cell of cells)tr.append(make('td',cell));
   body.append(tr);
  }
  get('arw-sensitivity-results').hidden=false;
  get('arw-sensitivity-feedback').textContent=syntheticMode?
   'FICTIONAL STAT ANALYSIS — numbers are invented, not Elden Ring values.':
   'Calculated from source-defined scaling. These are not game-client goldens or optimal builds.';
  return;
 }
 if(m.op==='upgrade-progression-result'){
  if(m.requestId!==progressionRevision)return;
  const out=m.result,body=get('arw-progression-rows');body.replaceChildren();
  get('arw-progression-summary').textContent=out.weaponName+' · '+out.reinforcementSystem+
   ' · source levels: '+out.suppliedLevels+' · maximum +'+out.highestLevel+
   '. One- and two-handed values are source-derived, not game-client certified.';
  for(const step of out.rows){
   const row=make('tr',''),available=step.status==='calculated-unverified';
   const values=['+'+step.level,available?step.oneHand:'—',available?step.twoHand:'—',
    available?(step.delta>=0?'+':'')+step.delta:'—',
    ...['physical','magic','fire','lightning','holy'].map(
     key=>available?step.oneComponents[key]:'—'),
    available?(step.missingRequirements.length?
     'Unmet: '+step.missingRequirements.join(', ')+'. ':'')+
     'No skills, status or target-defense model':step.note];
   for(const value of values)row.append(make('td',value));
   body.append(row);
  }
  get('arw-progression-results').hidden=false;
  get('arw-progression-feedback').textContent=syntheticMode?
   'FICTIONAL reinforcement table — invented values only.':
   'Exact imported source progression calculated locally. NOT current game AR verified.';
  return;
 }
 if(m.op==='recheck-observation-result'){
  if(m.requestId!==recheckRevision)return;
  const item=m.result;
  get('arw-recheck-drift').textContent=
   item.differenceFreshMinusStored??'—';
  get('arw-recheck-game-gap').textContent=
   item.differenceFreshMinusGame??'—';
  get('arw-recheck-summary').textContent=item.reason;
  get('arw-recheck-feedback').textContent='Result: '+item.status+
   '. Draft stored fields consistent: '+item.storedFieldsConsistent+
   '. Always UNREVIEWED; screenshot not inspected.';
  get('arw-recheck-results').hidden=false;
  return;
 }
 if(m.op==='family-compared'){
  if(m.requestId!==familyRevision)return;
  const out=m.result,body=get('arw-family-rows');body.replaceChildren();
  get('arw-family-summary').textContent=out.family+' · '+out.sourceVariantCount+
   ' source variants · '+out.available+' nominally calculated · '+out.unavailable+
   ' unavailable / blocked · +'+out.upgrade+' · '+(out.twoHanded?'two-hand':'one-hand')+
   '. Research values; NOT independently verified.';
  for(const item of out.rows){
   const tr=make('tr','');
   const columns=[item.name,item.total===null?'—':item.total,
    ...['physical','magic','fire','lightning','holy'].map(
     d=>item.components===null?'—':(item.components[d]??0)),
    item.status==='calculated-unverified'?
     (item.missingRequirements.length?'Unmet: '+item.missingRequirements.join(', ')+'. ':'')+
      (item.scopeFlags.length?item.scopeFlags.join('; '):'Nominal AR only; not game verified'):
     item.status+': '+item.reason];
   for(const value of columns)tr.append(make('td',value));
   body.append(tr);
  }
  get('arw-family-results').hidden=false;
  get('arw-family-feedback').textContent=syntheticMode?
   'FICTIONAL TEST MATRIX — all values are invented.':
   'Computed from source-defined affinities. NOT independent game-client goldens.';
  return;
 }
 if(m.op==='selected'){
  if(m.requestId!==selectRevision)return;
  selected=true;upgrades=m.description.upgradeLevels;currentRequirements=m.description.requirements;
  get('arw-description').textContent=m.description.name+' · '+m.description.gripMode+
   ' grip · '+m.description.damageTypes.join(' + ')+' damage types · source '+m.description.provenance.gameVersion+
   ' · Required: '+POWER_STATS.map(a=>a.toUpperCase()+' '+currentRequirements[a]).join(', ')+
   '. Scope limits: '+(m.description.scopeFlags?.join(', ')||'no specific flags detected')+
   '. Skills, movesets and enemy damage remain unmodeled; game-client AR unverified.';
  const u=get('arw-upgrade');
  const previous=u.value===''?null:Number(u.value);
  u.replaceChildren();
  for(const n of upgrades)u.add(new Option('+'+n,String(n)));
  const preferred=pendingUpgradeFromLink!==null?pendingUpgradeFromLink:previous;
  if(preferred!==null&&upgrades.includes(preferred))u.value=String(preferred);
  pendingUpgradeFromLink=null;
  get('arw-upgrade-max').disabled=false;get('arw-apply-requirements').disabled=false;
  get('arw-family-run').disabled=false;get('arw-progression-run').disabled=false;get('arw-sensitivity-run').disabled=false;
  requestCalculation();requestComparison();return;
 }
 if(m.op==='selectedB'){
  if(m.requestId!==selectBRevision)return;
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
  latestGripResults=m.result;
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
get('arw-upgrade-max').addEventListener('click',()=>{
 if(!selected||!upgrades.length)return;
 const max=Math.max(...upgrades),field=get('arw-upgrade');field.value=String(max);
 clear();requestCalculation();requestComparison();
});
get('arw-apply-requirements').addEventListener('click',()=>{
 if(!selected||!currentRequirements)return;
 for(const field of get('arw-stats').querySelectorAll('input[data-arw-stat]')){
  const required=currentRequirements[field.dataset.arwStat];
  field.value=String(Math.max(10,required??0));
 }
 clear();requestCalculation();requestComparison();
 feedback('Applied this weapon\'s minimum attribute requirements (at least 10 in other stats). '+ 
  'The linked catalog values were not changed; use higher stats if desired.');
});
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
get('arw-search').addEventListener('input',()=>{if(fileLoaded)send({op:'search',requestId:++searchRevision,term:get('arw-search').value});});
get('arw-select').addEventListener('change',selectCurrent);
get('arw-compare-select').addEventListener('change',selectSecond);
get('arw-upgrade').addEventListener('change',()=>{clear();requestCalculation();requestComparison();});
get('arw-compare-upgrade').addEventListener('change',requestComparison);
get('arw-compare-grip').addEventListener('change',requestComparison);
get('arw-compare-run').addEventListener('click',requestComparison);
get('arw-stats').addEventListener('input',()=>{clear();requestCalculation();requestComparison();});
get('arw-compare').addEventListener('click',requestCalculation);
get('arw-sensitivity-grip').addEventListener('change',clearSensitivity);
get('arw-sensitivity-run').addEventListener('click',()=>{
 clearSensitivity();
 if(!selected||!fileLoaded)return;
 try{
  const stats=readStats(),upgrade=Number(get('arw-upgrade').value);
  if(!upgrades.includes(upgrade))throw new RangeError('Choose a source-defined upgrade first.');
  get('arw-sensitivity-feedback').textContent='Comparing individual stat gains locally…';
  send({op:'stat-sensitivity',requestId:sensitivityRevision,stats,upgrade,
   twoHanded:get('arw-sensitivity-grip').value==='two'});
 }catch(error){
  get('arw-sensitivity-feedback').textContent='Cannot compare stat gains: '+error.message;
 }
});
get('arw-progression-run').addEventListener('click',()=>{
 clearProgression();
 if(!selected||!fileLoaded)return;
 try{
  get('arw-progression-feedback').textContent='Calculating every supplied reinforcement level locally…';
  send({op:'upgrade-progression',requestId:progressionRevision,stats:readStats()});
 }catch(error){get('arw-progression-feedback').textContent=error.message;}
});
get('arw-recheck-run').addEventListener('click',async()=>{
 clearRecheck();
 if(!fileLoaded||syntheticMode){
  get('arw-recheck-feedback').textContent='Load a real source candidate, not the fictional demo.';
  return;
 }
 const file=get('arw-recheck-file').files?.[0];
 if(!file||!file.name.toLowerCase().endsWith('.json')||file.size>120000){
  get('arw-recheck-feedback').textContent='Choose a single local UNREVIEWED .json file (max 120 kB).';return;
 }
 const id=recheckRevision;
 get('arw-recheck-feedback').textContent='Re-evaluating this draft from the active source. No screenshot is inspected.';
 try{
  const text=await file.text();
  if(id!==recheckRevision||!fileLoaded)return;
  send({op:'recheck-observation',requestId:id,text});
 }catch(error){
  if(id===recheckRevision)get('arw-recheck-feedback').textContent=error.message;
 }
});
get('arw-family-grip').addEventListener('change',clearFamily);
get('arw-family-run').addEventListener('click',()=>{
 clearFamily();
 if(!selected||!fileLoaded)return;
 try{
  const stats=readStats(),upgrade=Number(get('arw-upgrade').value);
  if(!upgrades.includes(upgrade))throw new RangeError('Choose a sourced +level first.');
  get('arw-family-feedback').textContent='Calculating exact family affinities in a local worker…';
  send({op:'family-compare',requestId:familyRevision,
   name:get('arw-select').value,stats,upgrade,
   twoHanded:get('arw-family-grip').value==='two'});
 }catch(error){
  get('arw-family-feedback').textContent='Family comparison unavailable: '+error.message;
 }
});
get('arw-observation-export').addEventListener('click',()=>{
 const feedbackNode=get('arw-observation-feedback');
 try{
  if(!selected||!latestGripResults)
   throw new RangeError('Calculate a sourced weapon AR before recording a game-menu observation.');
  const raw=get('arw-observed-total').value.trim();
  if(!/^(?:0|[1-9][0-9]{0,4})$/.test(raw))
   throw new RangeError('Enter the actual integer AR shown in the game menu.');
  const twoHanded=get('arw-observation-grip').value==='two';
  const candidate=twoHanded?latestGripResults.twoHand:latestGripResults.oneHand;
  const draft=makeUnreviewedArObservation({
   weaponName:get('arw-select').value,
   sourceVersion:candidate.provenance.gameVersion,
   gameAppVersion:get('arw-observation-app').value,
   regulationVersion:get('arw-observation-reg').value,
   platform:get('arw-observation-platform').value,
   observedAt:get('arw-observation-date').value,
   evidenceReference:get('arw-observation-reference').value,
   stats:readStats(),upgrade:Number(get('arw-upgrade').value),twoHanded,
   observedTotal:Number(raw),candidateTotal:candidate.total,synthetic:syntheticMode
  });
  const blob=new Blob([JSON.stringify(draft,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob),anchor=make('a','');
  anchor.href=url;anchor.download='ar-game-menu-observation-UNREVIEWED.json';
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  feedbackNode.textContent='Downloaded UNREVIEWED draft. Candidate minus game menu: '+
   draft.candidateCalculation.differenceCandidateMinusObserved+
   '. Matching values are NOT independent verification; retain your screenshot for review.';
 }catch(error){feedbackNode.textContent='Cannot export observation: '+error.message;}
});
get('arw-handoff-context').textContent=initialWeaponQuery?
 'From weapon database: '+initialWeaponQuery+(handoff.stats?' · 5 character stats were transferred.':' · using default character stats.')+
 '. Click Load public v1.17 dataset or import local JSON; no external source auto-downloads.':
 'Open this tool from a weapon record to carry your five character attributes into the private research calculator.';
feedback('Click to load pinned public 1.17 data in your browser, or supply a local JSON file. No regulation dataset ships with the site.');
