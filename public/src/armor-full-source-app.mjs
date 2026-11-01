import {comparePoiseResultToPublicReference,V117_ARMOR_POISE_REFERENCE} from './tarnished-v117-scoped-reference-scenes.mjs';
import {siteVerifiedArmorSubset} from './tarnished-armor-eligibility.mjs';
import {weightedVerifiedArmorSubset} from './armor-weighted-optimizer.mjs';
import {ARMOR_METRICS} from './armor-source-optin.mjs';
import {loadPinnedArmorSource} from './armor-source-optin.mjs';
const $=id=>document.getElementById(id);
const slotNames=['Head','Chest','Arms','Legs'];
const slotId=slot=>'armor-full-slot-'+slot.toLowerCase();
const slotRestrictions=()=>{
 const lockedIds={},disabledSlots=[];
 for(const slot of slotNames){
  const value=$(slotId(slot)).value;
  if(value==='empty')disabledSlots.push(slot);
  else if(value!=='auto')lockedIds[slot]=value;
 }
 return {lockedIds,disabledSlots};
};
const populateSlots=rows=>{
 for(const slot of slotNames){
  const select=$(slotId(slot));
  select.replaceChildren();
  for(const [value,label] of [['auto','Any item or empty'],['empty','Keep slot empty']]){
   const option=document.createElement('option');
   option.value=value;option.textContent=label;select.append(option);
  }
  for(const item of rows.filter(x=>x.slot===slot).sort((a,b)=>a.name.localeCompare(b.name))){
   const option=document.createElement('option');
   option.value=item.id;option.textContent='Lock: '+item.name;
   select.append(option);
  }
  select.disabled=false;
 }
};
const status=(message,error=false)=>{
 $('armor-full-status').textContent=message;
 $('armor-full-status').dataset.state=error?'error':'ready';
};
let armors=null,worker=null,revision=0;
const metricNames=Object.keys(ARMOR_METRICS);
const weightedFields=new Map();
for(const key of metricNames){
 const meta=ARMOR_METRICS[key];
 const row=document.createElement('div');row.className='armor-weighted-row';
 const title=document.createElement('span');title.textContent=meta.label;title.className='armor-weighted-name';
 const controls={};
 for(const [field,label] of [['weights','Multiplier'],['minimums','Minimum'],['maximums','Maximum']]){
  const wrap=document.createElement('label');wrap.className='armor-weighted-field';
  const cap=document.createElement('span');cap.textContent=label;wrap.append(cap);
  const input=document.createElement('input');input.type='number';input.step='0.1';
  input.setAttribute('aria-label',meta.label+' '+label);
  if(field==='weights'){input.min='0';input.max='10';input.value=key==='poise'?'1':'0';}
  else{input.placeholder='None';if(meta.kind==='resistance')input.min='0';}
  input.addEventListener('input',()=>invalidate());
  wrap.append(input);row.append(wrap);controls[field]=input;
 }
 row.prepend(title);$('armor-weighted-rows').append(row);
 weightedFields.set(key,controls);
}
const weightedOptions=()=>{
 const weights={},minimums={},maximums={};
 for(const [key,row] of weightedFields){
  weights[key]=row.weights.value;
  minimums[key]=row.minimums.value;
  maximums[key]=row.maximums.value;
 }
 return {weights,minimums,maximums};
};
const weightedMode=()=>$('armor-full-mode').value==='weighted';
const toggleMode=()=>{
 $('armor-weighted-panel').hidden=!weightedMode();
 $('armor-full-metric').closest('label').hidden=weightedMode();
 invalidate();
};
$('armor-full-mode').addEventListener('change',toggleMode);

try{worker=new Worker(new URL('./armor-full-source-worker.mjs',import.meta.url),{type:'module'});}
catch(error){status('Browser cannot start local optimization Worker: '+error.message,true);
 $('armor-full-load').disabled=true;}
const invalidate=()=>{
 revision++;
 $('armor-full-results').hidden=true;
 $('armor-full-rows').replaceChildren();
 const ref=$('armor-v117-reference-comparison');
 if(ref){ref.textContent='Constraints changed; previous source comparison invalidated. Re-run with matching inputs.';ref.dataset.state='unverified';}
 if(armors){
  $('armor-full-run').disabled=false;
  status('Constraints changed; run source optimizer again.');
 }
};
const parseExclude=()=>{
 const names=$('armor-full-exclude').value.split(',').map(x=>x.trim()).filter(Boolean);
 if(names.length>50||new Set(names.map(x=>x.toLowerCase())).size!==names.length)
  throw new RangeError('Enter at most 50 different exact armor names, separated by commas.');
 const excluded=[];
 for(const name of names){
  const matches=armors.filter(x=>x.name.toLowerCase()===name.toLowerCase());
  if(matches.length!==1)throw new RangeError(
   'Missing or ambiguous community armor name: '+name+'. Use a unique exact item name.');
  excluded.push(matches[0].id);
 }
 return excluded;
};
$('armor-full-load').addEventListener('click',async()=>{
 if(!worker)return;
 const button=$('armor-full-load');button.disabled=true;
 status('Downloading the pinned public armor JSON on your explicit request…');
 try{
  const source=await loadPinnedArmorSource(fetch);
  armors=source.armors;
  populateSlots(armors);
  const missing=armors.filter(x=>x.poise===null).length;
  status('Pinned '+source.count+' source armor items + '+(source.additionalVerifiedDlcArmorCount??0)+
   ' independently checked DLC item loaded; '+(source.directTarnishedV117ArmorCount??0)+
   ' weight and Poise pairs directly matched Tarnished.dev v1.17; '+(source.siteTwelveMetricArmorCount??0)+' stat-stable armor pieces also have 12 same-input negation/resistance fields. Contextual equipment effects and other pieces remain unverified. '+ 
   missing+' items lack valid source Poise. For any chosen objective, missing metric rows are independently excluded. '+
   'Values and item availability are not current-game certified.');
  $('armor-full-run').disabled=false;button.hidden=true;
  $('armor-v117-apply-first').disabled=false;
 }catch(error){button.disabled=false;status('Source unavailable: '+error.message+'. Manual optimizer remains usable.',true);}
});
$('armor-full-run').addEventListener('click',()=>{
 if(!armors||!worker)return;
 invalidate();
 try{
  const value=$('minPoise').value.trim();
  if(!/^(?:0|[1-9]\d{0,2})$/.test(value))throw new RangeError('Enter a whole minimum Poise 0–500.');
  const options={
   maxEquipLoad:$('maxLoad').value,
   reservedWeight:$('reservedWeight').value,
   tier:$('targetTier').value,
   minPoise:Number(value),
   metric:weightedMode()?'weighted':$('armor-full-metric').value,
   ...(weightedMode()?weightedOptions():{}),
   excludedIds:parseExclude(),
   ...slotRestrictions()
  };
  const restrict=$('armor-full-site-only').checked;
  const active=weightedMode()?metricNames.filter(key=>
    Number(options.weights[key])>0||options.minimums[key]!==''||
    options.maximums[key]!==''||(key==='poise'&&options.minPoise>0)):null;
  const verified=weightedMode()?
    weightedVerifiedArmorSubset(armors,active):
    siteVerifiedArmorSubset(armors,options.metric);
  const candidateRows=restrict?verified.accepted:armors;
  if(!candidateRows.length)throw new RangeError('No Tarnished.dev-verified candidates support '+options.metric+'.');
  const requestId=++revision;
  $('armor-full-run').disabled=true;
  status((restrict?
   'Individually field-verified '+options.metric+': '+candidateRows.length+' candidates, '+
    verified.excluded.length+' other rows excluded. ':
   'Unverified source-only research: '+candidateRows.length+' candidates. ')+
   'Exact local computation; weighted scoring is NOT Tarnished.dev scoring parity…');
  worker.postMessage({op:'optimize',requestId,armors:candidateRows,options});
 }catch(error){status('Cannot start source optimizer: '+error.message,true);}
});
worker?.addEventListener('message',event=>{
 const m=event.data||{};if(m.requestId!==revision)return;
 $('armor-full-run').disabled=false;
 if(m.op==='error'){status('Exact source optimization blocked: '+m.message,true);return;}
 if(m.op!=='result')return;
 const r=m.result;
 const compare=$('armor-v117-reference-comparison');
 compare.dataset.state='unverified';
 if(!weightedMode()&&$('armor-v117-confirm-wretch').checked&&
    $('armor-full-site-only').checked&&r.status!=='no-solution'){
  const locks=slotRestrictions();
  const difference=comparePoiseResultToPublicReference({
   maxEquipLoad:$('maxLoad').value,reservedWeight:$('reservedWeight').value,
   tier:$('targetTier').value,minPoise:Number($('minPoise').value),
   metric:$('armor-full-metric').value,poise:r.poise,combination:r.combination,
   excludedIds:parseExclude(),...locks
  });
  if(difference.reference){
   compare.textContent='Same-input v1.17 public maximum Poise = '+
    difference.reference.maximumPoise+'; local = '+r.poise+'. '+difference.status+
    (difference.listedReferenceRank?' · local set appears in observed reference top rows at position '+difference.listedReferenceRank+'. ':' · The exact four-piece and tie-ranked order are not established as identical. ')+
    difference.warning;
   compare.dataset.state=difference.status.includes('MISMATCH')?'error':'ready';
  }else{
   compare.textContent='Reference scenario not identical: the benchmark requires unmodified slots/exclusions, maximum load 48.176, reserved 0, normal roll, minimum Poise 0, and Poise-only objective.';
  }
 }else{
  compare.textContent='No same-input optimizer parity asserted. Confirm the Wretch10 reference scene and site-verified Poise-only data to compare maximum Poise.';
 }
 $('armor-full-rows').replaceChildren();
 $('armor-full-results').hidden=false;
 if(r.status==='no-solution'){
  $('armor-full-heading').textContent='No feasible armor combination from reported source data';
  $('armor-full-details').textContent=r.reason+' '+
   r.missingMetricExcluded+' items excluded for missing '+r.metricLabel+'; '+
   (r.missingPoiseExcluded??0)+' additionally excluded due to unknown source Poise; '+
   r.explicitExcluded+' excluded by name.';
  status('No source-supported combination met the selected constraints. No result was invented.',true);
  return;
 }
 $('armor-full-heading').textContent='Best '+r.metricLabel+': '+
  r.metricValue+(r.metricUnit==='%'?'%':r.metricUnit==='score'?' score':' points');
 $('armor-full-details').textContent=
  'Armor weight '+r.armorWeight.toFixed(3)+' + reserved gear = '+
  r.totalWeight.toFixed(3)+' / max '+r.maxEquipLoad.toFixed(3)+
  '; roll tier '+r.rollTier+'. '+r.missingMetricExcluded+
  ' records excluded due to unavailable '+r.metricLabel+'; '+r.explicitExcluded+
  ' explicitly excluded. '+(r.minPoise>0?
   'Minimum source Poise '+r.minPoise+' satisfied: total '+r.poise+'. ':
   '')+(r.missingPoiseExcluded?
   r.missingPoiseExcluded+' pieces missing source Poise excluded. ':'')+
  (r.metricUnit==='%'?'Rounded per-piece source negation is combined multiplicatively; ':'')+
  (r.metric==='weighted'?
   'Independent local weighted score; NOT Tarnished.dev scoring parity. Metric totals: '+
     Object.entries(r.metricTotals).map(([k,v])=>k+' '+v).join(' · ')+'. ':
   '')+
  'This local optimizer finds a subset optimum; its exact recommended four-piece set has NOT been compared against the Tarnished.dev optimizer UI.';
 for(const piece of r.combination){
  const row=document.createElement('tr');
  for(const value of [piece.slot,piece.name,String(piece.weight),
   piece.poise===null?'Unknown':String(piece.poise),
   String(piece.metricValue)+(r.metricUnit==='%'?'%':'')]){
   const td=document.createElement('td');td.textContent=value;row.append(td);
  }
  $('armor-full-rows').append(row);
 }
 status('Exact local '+r.metricLabel+' optimization completed in Worker. '+
  r.stages.map(x=>x.slot+': '+x.stateCount+' states').join(' · ')+
  '. Search outputs require an independent same-input comparison before being labeled Tarnished.dev optimizer parity.');
});
$('armor-v117-confirm-wretch').addEventListener('change',invalidate);
$('armor-v117-apply-first').addEventListener('click',()=>{
 if(!armors)return;
 const first=V117_ARMOR_POISE_REFERENCE.ranked[0];
 const selected={Head:first.head,Chest:first.chest,Arms:first.arms,Legs:first.legs};
 // Deliberate click: this replaces the previous four slot locks and objective
 // with the precisely observed site rank-one equipment, not its algorithm.
 $('maxLoad').value='48.176';$('reservedWeight').value='0';
 $('targetTier').value='medium';$('minPoise').value='0';
 $('armor-full-mode').value='single';$('armor-full-metric').value='poise';
 $('armor-full-site-only').checked=true;
 $('armor-full-exclude').value='';
 $('armor-v117-confirm-wretch').checked=true;
 for(const slot of slotNames){
  const matches=armors.filter(x=>x.name===selected[slot]&&x.slot===slot);
  if(matches.length!==1){status('Reference piece missing from loaded armor dataset: '+selected[slot],true);return;}
  const ctrl=$(slotId(slot));
  if(![...ctrl.options].some(x=>x.value===matches[0].id)){
   status('Reference piece cannot be selected in '+slot,true);return;
  }
 }
 for(const slot of slotNames)$(slotId(slot)).value=armors.find(x=>x.slot===slot&&x.name===selected[slot]).id;
 toggleMode();
 invalidate();
 $('armor-full-run').click();
});
$('armor-full-site-only').addEventListener('change',invalidate);
for(const id of ['maxLoad','reservedWeight','targetTier','minPoise','armor-full-exclude','armor-full-metric',
 ...slotNames.map(slotId)]){
 $(id).addEventListener(['targetTier','armor-full-metric',...slotNames.map(slotId)].includes(id)?'change':'input',invalidate);
}
