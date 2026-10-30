import {validateCommunityCatalog,catalogCategories,searchCatalog,weaponRequirementComparison,
 baseDamageParts,publishedUpgradeParts,cautionForWeapon,ATTRIBUTE_LABELS,requirementsUrl,weaponWieldShortfall} from './community-weapons.mjs';
import {compareWeaponReferences,parseReferenceCompareIds,referenceCompareQuery} from './weapon-compare-reference.mjs';
import {makeArWorkbenchUrl} from './ar-workbench-navigation.mjs';
import {makeWeaponCatalogShareUrl} from './weapon-catalog-navigation.mjs';
const $=id=>document.getElementById(id);
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n;};
const params=new URLSearchParams(location.search);
const cleanStats=value=>{
 if(!value||!/^([0-9]{1,2},){4}[0-9]{1,2}$/.test(value))return null;
 const a=value.split(',').map(Number);return a.every(n=>n>=1&&n<=99)?a:null;
};
const buildStats=cleanStats(params.get('player'))||(
 (()=>{const nums=params.get('stats')?.split(',').map(Number);return nums?.length===8?
 cleanStats(nums.slice(3).join(',')):null})())||[16,14,10,10,10];
for(let i=0;i<5;i++){
 const label=el('label',ATTRIBUTE_LABELS[i]);label.className='stat-field';
 const input=el('input');input.type='number';input.min='1';input.max='99';input.step='1';
 input.inputMode='numeric';input.value=String(buildStats[i]);input.dataset.stat=String(i);
 label.append(input);$('catalog-stats').append(label);
}
let catalog=null,chosen=null,offset=0,lastUpgradeWeaponId=null,comparedIds=[];
function renderReferenceComparison(){
 const add=$('catalog-compare-add');
 if(chosen){
  const selected=comparedIds.includes(chosen.id);
  add.textContent=selected?'Remove from comparison':'Add to reference comparison';
  add.setAttribute('aria-pressed',String(selected));
  add.disabled=!selected&&comparedIds.length>=3;
 }
 const active=comparedIds.length>0;
 $('catalog-compare-count').textContent=comparedIds.length+' of 3 selected';
 $('catalog-compare-clear').disabled=!active;
 $('catalog-compare-copy').disabled=!active;
 $('catalog-compare-table-wrap').hidden=!active;
 if(!active){
  $('catalog-compare-feedback').textContent='Choose a weapon to start.';
  $('catalog-compare-link').value='';
  $('catalog-compare-table').replaceChildren();return;
 }
 let stats=null;
 try{stats=readStats();}catch{ /* share source facts, but skip invalid character stats */ }
 const model=compareWeaponReferences(catalog.weapons,comparedIds,stats);
 const table=$('catalog-compare-table');table.replaceChildren();
 const head=el('thead'),heading=el('tr'),label=el('th','Property');
 label.scope='col';heading.append(label);
 for(const weapon of model.columns){
  const th=el('th');th.scope='col';
  const name=el('span',weapon.name);name.className='compare-name';
  const remove=el('button','Remove');
  remove.type='button';remove.className='compare-remove';
  remove.setAttribute('aria-label','Remove '+weapon.name+' from comparison');
  remove.addEventListener('click',()=>{
   comparedIds=comparedIds.filter(id=>id!==weapon.id);
   renderReferenceComparison();
  });
  th.append(name,remove);heading.append(th);
 }
 head.append(heading);table.append(head);
 const body=el('tbody');
 for(const row of model.rows){
  const tr=el('tr'),th=el('th',row.label);th.scope='row';tr.append(th);
  for(const value of row.values)tr.append(el('td',value));
  body.append(tr);
 }
 table.append(body);
 $('catalog-compare-feedback').textContent=stats===null?
  'Player stats invalid: showing available weapon facts only. '+model.warning:model.warning;
 const query=referenceCompareQuery(comparedIds,stats);
 $('catalog-compare-link').value=location.origin+location.pathname+'?'+query;
}
$('catalog-compare-add').addEventListener('click',()=>{
 if(!chosen||!catalog)return;
 if(comparedIds.includes(chosen.id))comparedIds=comparedIds.filter(id=>id!==chosen.id);
 else if(comparedIds.length<3)comparedIds=[...comparedIds,chosen.id];
 renderReferenceComparison();
});
$('catalog-compare-clear').addEventListener('click',()=>{
 comparedIds=[];renderReferenceComparison();
});
$('catalog-compare-copy').addEventListener('click',async()=>{
 const value=$('catalog-compare-link').value;
 if(!value)return;
 try{
  if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
  await navigator.clipboard.writeText(value);
  $('catalog-compare-feedback').textContent='Comparison link copied. +0 source facts only; not AR.';
 }catch{
  $('catalog-compare-link').focus();$('catalog-compare-link').select();
  $('catalog-compare-feedback').textContent='Copy the selected comparison URL manually.';
 }
});
function renderPublishedUpgrade(){
 const parent=$('catalog-upgrade-reference'),level=$('catalog-upgrade-level');
 if(!chosen?.upgradeReference){parent.hidden=true;lastUpgradeWeaponId=null;return;}
 parent.hidden=false;
 if(lastUpgradeWeaponId!==chosen.id){
  lastUpgradeWeaponId=chosen.id;
  level.replaceChildren();
  for(let value=0;value<=10;value++){
   const option=el('option','+'+value);option.value=String(value);level.append(option);
  }
  level.value='0';
 }
 const display=$('catalog-upgrade-damage');display.replaceChildren();
 for(const part of publishedUpgradeParts(chosen,Number(level.value))){
  const row=el('div');row.className='catalog-value';
  row.append(el('span',part.name+' base'),el('strong',part.amount));display.append(row);
 }
}
// Refresh both the visible +level reference and its AR workbench handoff URL.
$('catalog-upgrade-level').addEventListener('change',renderDetails);
const readStats=()=>{
 const fields=[...$('catalog-stats').querySelectorAll('input[data-stat]')];
 const numbers=fields.map(x=>Number(x.value));
 if(numbers.some((n,i)=>!Number.isInteger(n)||n<1||n>99||fields[i].value.trim()===''))
  throw new RangeError('Character attributes must be whole numbers from 1 to 99.');
 return numbers;
};
const status=(s,error=false)=>{
 $('catalog-status').textContent=s;
 $('catalog-status').className=error?'feedback bad':'feedback';
};
function renderDetails(){
 const box=$('catalog-details');
 if(!chosen){box.hidden=true;renderReferenceComparison();return;}
 box.hidden=false;
 $('catalog-title').textContent=chosen.name;
 const coverage=chosen.dataCoverage??'base-community';
 const dlc=chosen.expansion==='Shadow of the Erdtree';
 const partial=coverage==='requirements-only'||coverage==='requirements-weight-only'||coverage==='name-category-only';
 $('catalog-class').textContent=chosen.category+' · '+(dlc?
  (coverage==='base-reference'?'Shadow of the Erdtree · sourced +0 facts (not AR)':
   coverage==='requirements-weight-only'?'Shadow of the Erdtree · requirements + community weight only':
   coverage==='requirements-only'?'Shadow of the Erdtree · requirements only':
   'Shadow of the Erdtree · name/category only'):
  'Community-reported +0 base data · patch unknown');
 $('catalog-weight').textContent=chosen.weight===null?'Not verified':String(chosen.weight);
 $('catalog-critical').textContent=chosen.critical===null||chosen.critical===0?'Not verified':String(chosen.critical);
 const damage=$('catalog-damage');damage.replaceChildren();
 if(partial)damage.append(el('p','Base attack unavailable; no values are guessed.'));
 for(const part of baseDamageParts(chosen)){
  const row=el('div');row.className='catalog-value';
  row.append(el('span',part.name),el('strong',part.amount));damage.append(row);
 }
 renderPublishedUpgrade();
 const required=$('catalog-required');required.replaceChildren();
 if(chosen.requirements===null)required.append(el('p','Requirements not sourced yet. Wieldability cannot be determined.'));
 else for(let i=0;i<5;i++){
  const row=el('div');row.className='catalog-value';
  row.append(el('span',ATTRIBUTE_LABELS[i]),el('strong',chosen.requirements[i]));
  required.append(row);
 }
 const scaling=$('catalog-scaling');scaling.replaceChildren();
 if(partial)scaling.append(el('p','Base scaling grades not available for this DLC entry.'));
 for(let i=0;!partial&&i<5;i++){
  const row=el('div');row.className='catalog-value';
  row.append(el('span',ATTRIBUTE_LABELS[i]),el('strong',chosen.scaling[i]));scaling.append(row);
 }
 const concerns=$('catalog-warnings');concerns.replaceChildren();
 for(const warning of cautionForWeapon(chosen))concerns.append(el('p',warning));
 $('catalog-verified').replaceChildren();
 if(chosen.sourceUrl){
  const a=el('a','View named DLC weapon and requirements source ↗');
  a.href=chosen.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';
  $('catalog-verified').append(a);
 }
 if(chosen.weightSourceUrl){
  const a=el('a','View attributed community weight source ↗');
  a.href=chosen.weightSourceUrl;a.target='_blank';a.rel='noopener noreferrer';
  $('catalog-verified').append(a);
 }
 if(chosen.requirementsSourceUrl){
  const a=el('a','View attributed attribute requirements source ↗');
  a.href=chosen.requirementsSourceUrl;a.target='_blank';a.rel='noopener noreferrer';
  $('catalog-verified').append(a);
 }
 if(chosen.patchCorrection?.sourceUrl){
  const a=el('a','View Regulation 1.17 physical attack correction ↗');
  a.href=chosen.patchCorrection.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';
  $('catalog-verified').append(a);
 }
 if(chosen.flags?.some(f=>f==='v117-community-attack-conflict'||f==='v117-community-requirement-conflict')){
  const a=el('a','View pinned Regulation 1.17 conflicting source ↗');
  a.href='https://github.com/ThomasJClark/elden-ring-weapon-calculator/blob/3539d87e446f3b9d5b94157f8a2023e28ffea7d2/public/regulation-vanilla-v1.17.js';
  a.target='_blank';a.rel='noopener noreferrer';$('catalog-verified').append(a);
 }
 if(chosen.checkedWith){
  const a=el('a',chosen.flags?.includes('wiki-category-table-base-observation')?'View weapon-class comparison source ↗':'View per-weapon numeric reference ↗');
  a.href=chosen.checkedWith;a.target='_blank';a.rel='noopener noreferrer';
  $('catalog-verified').append(a);
 }
  const buildLink=$('catalog-build-link');
 const buildUrl=new URL('../build-planner/',location.href);
 buildUrl.searchParams.set('weapon',chosen.id);
 const origin=params.get('origin'),eight=params.get('stats');
 if(origin&&origin.length<=60)buildUrl.searchParams.set('origin',origin);
 if(eight&&/^([0-9]{1,2},){7}[0-9]{1,2}$/.test(eight))buildUrl.searchParams.set('stats',eight);
 if(params.get('tarnished')==='1')buildUrl.searchParams.set('tarnished','1');
 if(params.get('sote')==='1')buildUrl.searchParams.set('sote','1');
 buildLink.href=buildUrl.pathname+buildUrl.search;
 const shared=$('catalog-weapon-link');
 let shareStats=null;
 try{shareStats=readStats();}catch{/* share weapon only when character stats invalid */}
 shared.value=makeWeaponCatalogShareUrl(chosen.id,shareStats,location.href);
 $('catalog-weapon-share-feedback').textContent=shareStats?
  'Exact weapon and five character attributes in the same-page link. Community facts only.':
  'Character stats invalid; the link contains the weapon reference only.';
 const arLink=$('catalog-ar-source-link');
 // Carry exactly the current five combat stats, not the full build sheet.
 // Both the external v1.17 source download and local import remain opt-in.
 let arStats=null;
 try{arStats=readStats();}catch{ /* invalid stats: send only weapon name */ }
 arLink.href=makeArWorkbenchUrl(chosen.name,arStats,
  chosen.upgradeReference?Number($('catalog-upgrade-level').value):null);

 try{
  const stats=readStats();
  if(chosen.requirements===null)throw new RangeError('Unknown weapon requirements');
  const result=weaponRequirementComparison(chosen,stats);
  $('catalog-one').textContent=result.oneHanded.canWield?'Requirements met':
    result.oneHanded.totalMissing+' attribute point(s) short';
  $('catalog-two').textContent=result.twoHanded.canWield?
   (result.applyTwoHandBonus?'Requirements met (standard 2H assumed)':'Requirements met (no 2H STR bonus)'):
   result.twoHanded.totalMissing+' point(s) short'+(result.applyTwoHandBonus?' (standard 2H assumed)':' (no 2H STR bonus)');
  $('catalog-two').title=result.applyTwoHandBonus?
   'Standard 1.5× STR assumption only; check paired and special grip rules in-game.':
   'No normal two-hand Strength increase assumed for this category.';
 const link=$('catalog-requirements-link');
  link.href=requirementsUrl(chosen,stats);
  link.hidden=false;
  const summary=weaponWieldShortfall(chosen,stats);
  const format=missing=>missing.map(x=>x.stat+' +'+x.points).join(', ')||'none';
  $('catalog-shortfall').textContent=
   'Missing for 1H: '+format(summary.oneHandMissing)+
   ' · Missing for 2H: '+format(summary.twoHandMissing)+
   (summary.twoHandAssumption?
    ' (ordinary 1.5× STR assumption; not independently game-tested)':
    ' (no ordinary 1.5× STR bonus assumed)')+'.';
 }catch(e){
  $('catalog-one').textContent=chosen.requirements===null?'Requirements unavailable':'Invalid character attributes';
  $('catalog-two').textContent='—';
  $('catalog-requirements-link').hidden=true;
  $('catalog-shortfall').textContent=chosen.requirements===null?
   'Source-reported requirements unknown; missing stats cannot be calculated.':
   'Enter five valid character attributes to calculate missing points.';
 }
 renderReferenceComparison();
}
function showList(reset=false,keepSelected=false){
 if(!catalog)return;
 if(reset)offset=0;
 const term=$('catalog-search').value;
 const category=$('catalog-category').value;
 const sort=$('catalog-sort').value;
 const wield=$('catalog-wield').value;
 const damage=$('catalog-damage-filter').value;
 const coverage=$('catalog-coverage').value;
 const rawWeight=$('catalog-max-weight').value.trim();
 let maxWeight=null;
 if(rawWeight!==''){
  maxWeight=Number(rawWeight);
  if(!Number.isFinite(maxWeight)||maxWeight<0||maxWeight>200){
   $('catalog-results').textContent='Enter a weight limit from 0 to 200.';
   $('catalog-more').hidden=true;
   if(reset){$('catalog-list').replaceChildren();chosen=null;renderDetails();}
   return;
  }
 }
 let data;
 try{
  data=searchCatalog(catalog.weapons,{
   term,category,sort,limit:40,offset,wield,damage,maxWeight,coverage,
   stats:wield==='any'&&sort!=='requirements'?null:readStats()
  });
 }catch(error){
  $('catalog-results').textContent='Correct your character attributes: '+error.message;
  $('catalog-more').hidden=true;
  if(reset){$('catalog-list').replaceChildren();chosen=null;renderDetails();}
  return;
 }
 const list=$('catalog-list');
 if(reset){
  list.replaceChildren();
  if(!keepSelected)chosen=null;
 }
 if(!chosen&&data.results.length)chosen=data.results[0];
 const fragment=document.createDocumentFragment();
 let listStats=null;
 try{listStats=readStats();}catch{/* other catalog filters still usable */}
 for(const w of data.results){
  const btn=el('button');btn.type='button';btn.className='catalog-row';
  btn.setAttribute('aria-label','View '+w.name+' weapon details');
  if(w.id===chosen?.id)btn.classList.add('selected');
  const title=el('span',w.name);title.className='catalog-row-title';
  const detail=el('span',w.category+' · '+(w.dataCoverage==='name-category-only'?
   'DLC name/category only':w.dataCoverage==='requirements-weight-only'?
   'DLC requirements + community weight · attack unknown':w.dataCoverage==='requirements-only'?
   'DLC attribute requirements only':w.dataCoverage==='base-reference'?
   'DLC sourced +0 stats · not AR':'Wt '+w.weight+' · reported +0 base'));
  if(listStats){
   const missing=weaponWieldShortfall(w,listStats);
   detail.textContent+=' · '+(!missing.known?'Requirements unknown':
    missing.oneHandPoints===0?'Ready 1H':
     missing.oneHandMissing.map(x=>x.stat+' +'+x.points).join(', ')+' needed (1H)');
  }
  detail.className='catalog-row-desc';
  const tag=el('span',w.expansion==='Shadow of the Erdtree'?(w.dataCoverage==='base-reference'?'DLC · +0 source':'DLC · partial'):(w.flags?.length?'Review data':'View details'));
  tag.className='catalog-row-tag';
  btn.append(title,detail,tag);
  btn.addEventListener('click',()=>{
   chosen=w;
   for(const prev of list.querySelectorAll('.catalog-row.selected'))
    prev.classList.remove('selected');
   btn.classList.add('selected');renderDetails();
  });
  fragment.append(btn);
 }
 list.append(fragment);
 offset+=data.results.length;
 $('catalog-results').textContent=data.total+' matching entries · '+offset+' shown';
 $('catalog-more').hidden=offset>=data.total;
 renderDetails();
}
$('catalog-clear-filters').addEventListener('click',()=>{
 $('catalog-search').value='';
 $('catalog-category').value='all';
 $('catalog-sort').value='name';
 $('catalog-wield').value='any';
 $('catalog-damage-filter').value='any';
 $('catalog-coverage').value='all';
 $('catalog-max-weight').value='';
 showList(true);
 $('catalog-search').focus();
});
$('catalog-weapon-copy').addEventListener('click',async()=>{
 const url=$('catalog-weapon-link').value;
 if(!chosen||!url)return;
 try{
  if(!navigator.clipboard?.writeText)throw new Error('Clipboard permission unavailable');
  await navigator.clipboard.writeText(url);
  $('catalog-weapon-share-feedback').textContent=
   'Exact weapon link copied. Only five numeric attributes are shared, no game AR.';
 }catch{
  $('catalog-weapon-link').focus();$('catalog-weapon-link').select();
  $('catalog-weapon-share-feedback').textContent=
   'Clipboard unavailable. Copy the selected link manually.';
 }
});
$('catalog-search').addEventListener('input',()=>showList(true));
$('catalog-category').addEventListener('change',()=>showList(true));
$('catalog-sort').addEventListener('change',()=>showList(true));
$('catalog-wield').addEventListener('change',()=>showList(true));
$('catalog-damage-filter').addEventListener('change',()=>showList(true));
$('catalog-coverage').addEventListener('change',()=>showList(true));
$('catalog-max-weight').addEventListener('input',()=>showList(true));
$('catalog-more').addEventListener('click',()=>showList(false));
$('catalog-stats').addEventListener('input',()=>{
 renderDetails();
 if($('catalog-wield').value!=='any')showList(true);
});
try{
 const response=await fetch('../data/community-weapon-catalog.json',{cache:'default'});
 if(!response.ok)throw new Error('The local weapon catalog is unavailable ('+response.status+').');
 catalog=validateCommunityCatalog(await response.json());
 $('catalog-count').textContent=String(catalog.weapons.length);
 for(const category of catalogCategories(catalog.weapons)){
  const opt=el('option',category);opt.value=category;$('catalog-category').append(opt);
 }
 try{comparedIds=parseReferenceCompareIds(params.get('compare'),new Set(catalog.weapons.map(w=>w.id)));}
 catch{comparedIds=[];$('catalog-compare-feedback').textContent='Invalid comparison URL; selection ignored.';}
 const preferred=params.get('weapon');
 if(preferred){chosen=catalog.weapons.find(w=>w.id===preferred)||null;}
 if(chosen)$('catalog-search').value=chosen.name;
 if(!chosen&&comparedIds.length)chosen=catalog.weapons.find(w=>w.id===comparedIds[0])||null;
 showList(true,Boolean(chosen));
 if(chosen)renderDetails();
 renderReferenceComparison();
 status('Loaded '+catalog.weapons.length+' weapon and shield references ('+
  catalog.weapons.filter(w=>w.expansion==='Shadow of the Erdtree').length+
  ' DLC: '+catalog.meta.dlcBaseFactCount+' with sourced +0 facts, '+
  catalog.meta.dlcWeightOnlyCount+' requirements + community weight, '+
  catalog.meta.dlcRequirementOnlyCount+' requirements-only, '+
  catalog.meta.dlcNameOnlyCount+' names-only, '+catalog.meta.dlcUpgradeReferenceCount+
  ' with source-published upgraded BASE attacks). No precise DLC AR is available.');
}catch(e){
 status('Could not load weapon records: '+e.message,true);
 $('catalog-results').textContent='No data loaded';
}
