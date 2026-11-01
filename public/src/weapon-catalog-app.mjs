import {getTarnishedV117DirectWeight} from './tarnished-v117-public-weights.mjs';
import {validateCommunityCatalog,catalogCategories,searchCatalog,weaponRequirementComparison,
 reportedBaseDamageParts,publishedUpgradeParts,cautionForWeapon,ATTRIBUTE_LABELS,requirementsUrl,weaponWieldShortfall,hasDisputedRequirements,hasDisputedAttack,hasDisputedWeight,catalogSourceQuality,catalogQualityCounts} from './community-weapons.mjs';
import {compareWeaponReferences,parseReferenceCompareIds,referenceCompareQuery} from './weapon-compare-reference.mjs';
import {makeQuickArCalculatorUrl} from './ar-workbench-navigation.mjs';
import {makeWeaponCatalogShareUrl} from './weapon-catalog-navigation.mjs';
import {makeCatalogSmithingHandoff} from './upgrade-catalog-handoff.mjs';
import {validateRecoveredSourceReferences} from './recovered-weapon-reference.mjs';
import {buildRecoveredWeaponPreview} from './recovered-weapon-preview.mjs';
import {downloadV117Source} from './upstream-regulation-v117.mjs';
import {buildV117CatalogOverlay,V117_CATALOG_SOURCE_PAGE} from './v117-catalog-overlay.mjs';
import {buildV117ReconciliationQueue,v117ReconciliationCsv} from './v117-reconciliation-queue.mjs';
import {buildV117ComparatorCatalog} from './v117-comparator-catalog.mjs';
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
let catalog=null,originalCatalog=null,chosen=null,offset=0,lastUpgradeWeaponId=null,comparedIds=[];
let referenceOnlyMap=new Map(),referenceOnlyError=null,v117Overlay=null;
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
 const parts=publishedUpgradeParts(chosen,Number(level.value));
 if(parts===null){
  display.append(el('p','SOURCE CONFLICT or missing reference: upgraded base attack is unavailable. No numbers are inferred.'));
  return;
 }
 for(const part of parts){
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

function renderRecoveredSourcePreview(){
 const section=$('catalog-source-preview'),isSourceOnly=chosen?.flags?.includes('source-v117-neutral-requirements-only');
 section.hidden=!isSourceOnly;
 if(!isSourceOnly)return;
 const out=$('catalog-source-status');
 for(const id of ['catalog-source-attack','catalog-source-scaling','catalog-source-requirements','catalog-source-links'])
  $(id).replaceChildren();
 $('catalog-source-missing').textContent='';
 $('catalog-source-weight').textContent='—';
 $('catalog-source-critical').textContent='—';
 if(referenceOnlyError){
  out.textContent='Source review unavailable: '+referenceOnlyError+'. Original weapon data is not affected.';
  return;
 }
 const raw=referenceOnlyMap.get(chosen.id);
 if(!raw){out.textContent='No matching validated reference available. This value is still unknown.';return;}
 let record;
 try{record=buildRecoveredWeaponPreview(chosen,raw);}
 catch(e){out.textContent='Preview blocked: '+e.message;return;}
 out.textContent=record.sourceConflicts.length?'SOURCE CONFLICT: '+record.sourceConflicts.join(', ')+
  ' · Published data conflict; no game client certification.':
  'PUBLIC COMMUNITY SOURCE ONLY · Not independently certified against App 1.17.2 / Regulation 1.17.3.';
 const render=(id,values)=>{
  const parent=$(id);
  for(const v of values){
   const row=el('div');row.className='catalog-value';
   const a=v.primary===null?'NOT REPORTED':String(v.primary);
   const b=v.secondary===null?'NOT REPORTED':String(v.secondary);
   const explicit=v.explicitThird===undefined?'':' · C (+0 source): '+
    (v.explicitThird===null?'NOT REPORTED':String(v.explicitThird));
   const text=el('strong','A: '+a+' · B: '+b+explicit);
   if(v.evidence==='SOURCE_CONFLICT'||v.evidence==='SECONDARY_NOT_LISTED')text.textContent+=' ⚠';
   text.title=v.evidence.replaceAll('_',' ');
   row.append(el('span',v.label),text);parent.append(row);
  }
 };
 render('catalog-source-attack',record.attack);
 render('catalog-source-scaling',record.scaling);
 render('catalog-source-requirements',record.requirements);
 $('catalog-source-weight').textContent=String(record.weight)+' (two public readings, not certified)';
 $('catalog-source-critical').textContent=String(record.critical)+' (Eldenpedia published)';
 $('catalog-source-missing').textContent=record.thirdSourcedScalingCells+
  ' formerly blank grades have an explicit third-site unupgraded reading, '+
  record.unknownScalingCells+' fields still have no explicit source-grade evidence. '+
  'A blank original column is not proof of "-"; an explicit "-" shown by C is attributed to Fextralife, not the game client.';
 const links=$('catalog-source-links');
 for(const [label,url] of [['Eldenpedia published data',record.sourceAUrl],
  ['Tarnished.app individual page (different from Tarnished.dev)',record.sourceBUrl],
  ['Third named corroborating source (does not prove actual game)',record.sourceCUrl],
  ['Named third-site initial +0 scaling source (unversioned)',record.sourceScalingUrl]]){
  if(!url)continue;
  const a=el('a',label+' ↗');a.href=url;a.target='_blank';a.rel='noopener noreferrer';
  const p=el('p');p.append(a);links.append(p);
 }
 const url=new URL('../game-evidence-queue/',location.href);
 url.searchParams.set('weapon',chosen.id);
 $('catalog-source-qa').href=url.pathname+url.search;
 $('catalog-source-qa').hidden=record.sourceConflicts.length===0;
}

function renderV117SourceFacts(){
 const panel=$('catalog-v117-panel');
 panel.hidden=!chosen||!v117Overlay;
 if(!chosen||!v117Overlay)return;
 const row=v117Overlay.rows.get(chosen.id);
 const summary=$('catalog-v117-summary'),attack=$('catalog-v117-attack');
 const requirements=$('catalog-v117-requirements');
 const differences=$('catalog-v117-differences');
 attack.replaceChildren();requirements.replaceChildren();
 $('catalog-v117-source-link').href=V117_CATALOG_SOURCE_PAGE;
 if(!row||row.status!=='pinned-v117-neutral-reference'){
  summary.textContent='No unique complete pinned v1.17 neutral weapon parameter row found ('+
   (row?.status??'missing')+'). The actual +0 figures are UNKNOWN; no values are invented.';
  differences.textContent='No valid v1.17 source comparison exists for this item.';
  return;
 }
 summary.textContent=(row.sourceOnly?'Source-only catalog entry: original +0 attack and weight UNKNOWN. ':
  row.flaggedSourceDispute?'COMMUNITY SOURCE DISPUTE flagged: preserved; v1.17 source is shown separately. ':
  'Community record with an independent pinned v1.17 source row. ')+
  'Reference affinity: '+row.reinforcement+'. This is a parameter-source reading, NOT a separate competitor website observation.';
 const addValues=(target,labels,arr,community)=>{
  for(let i=0;i<labels.length;i++){
   const node=el('div');node.className='catalog-value';
   const match=community!==null&&community[i]===arr[i];
   const different=community!==null&&!match;
   const caption=labels[i]+(different?' · community '+community[i]+' differs':match?' · agrees':' · community unknown');
   node.append(el('span',caption),el('strong',String(arr[i])));
   target.append(node);
  }
 };
 addValues(attack,['Physical','Magic','Fire','Lightning','Holy'],
  row.attack,row.communityAttack);
 addValues(requirements,ATTRIBUTE_LABELS,row.requirements,row.communityRequirements);
 const notices=[];
 if(row.attackDiff)notices.push('ATTACK DISAGREEMENT: community +0 base differs from pinned v1.17. Neither is silently overwritten.');
 else if(row.communityAttack===null)notices.push('Community base attack UNKNOWN; pinned v1.17 +0 source is now visible for comparison only.');
 if(row.requirementDiff)notices.push('REQUIREMENT DISAGREEMENT: minimum attributes differ between sources; original wield filter remains conservative.');
 if(row.weightIsDisputed)notices.push('WEIGHT DISPUTED: pinned source has no reliable weapon weight; equip-load blocked.');
 else if(row.communityWeight===null)notices.push('WEIGHT UNKNOWN: no source weight supplied; never assume zero.');
 if(!notices.length)notices.push('No numeric +0 attack or requirement disagreement for these source fields. Other community details are not independently verified.');
 differences.textContent=notices.join(' ');
}
function renderDetails(){
 const box=$('catalog-details');
 if(!chosen){box.hidden=true;renderReferenceComparison();return;}
 box.hidden=false;
 $('catalog-title').textContent=chosen.name;
 renderRecoveredSourcePreview();
 renderV117SourceFacts();
 $('catalog-smithing-link').href=makeCatalogSmithingHandoff(chosen,location.href);
 $('catalog-smithing-note').textContent=chosen.upgradeReference?.path==='somber'&&
  chosen.upgradeReference?.status==='community-published-base-attack'&&
  chosen.upgradeReference?.sourceUrl===chosen.checkedWith?
  'The published community reinforcement reference labels this a Somber +10 track. The planner will suggest Somber, but you must confirm it in your game. A reference +level is NOT your current upgrade level.':
  'No independently sourced upgrade track is attached to this catalog record. Choose Regular or Somber from the actual game smithing menu. Neither track nor current +level is inferred.';
 const coverage=chosen.dataCoverage??'base-community';
 const dlc=chosen.expansion==='Shadow of the Erdtree';
 const pack=chosen.expansion==='Tarnished Pack';
 const partial=coverage==='requirements-only'||coverage==='requirements-weight-only'||coverage==='name-category-only';
 const comparator=chosen.v117Comparator===true;
 $('catalog-class').textContent=comparator?
  chosen.category+' · accepted public v1.17 neutral reference (not player AR)':
  chosen.category+' · '+(dlc?
  (coverage==='base-reference'?'Shadow of the Erdtree · sourced +0 facts (not AR)':
   coverage==='requirements-weight-only'?'Shadow of the Erdtree · requirements + community weight only':
   coverage==='requirements-only'?'Shadow of the Erdtree · requirements only':
   'Shadow of the Erdtree · name/category only'):
  pack?(coverage==='base-reference'?'Tarnished Pack · sourced community +0 base (not AR)':
  'Tarnished Pack · version-labelled requirements and weight; +0 attack UNKNOWN'):
  'Community-reported +0 base data · patch unknown');
 const publicWeight=getTarnishedV117DirectWeight(chosen.name);
 $('catalog-weight').textContent=publicWeight?
  String(publicWeight.weight)+' (Tarnished.dev v1.17 public UI, twice observed)'+
   (hasDisputedWeight(chosen)?' · community conflict '+String(chosen.weight):''):
  hasDisputedWeight(chosen)?'SOURCE CONFLICT — unavailable':
   chosen.weight===null?'Not verified':String(chosen.weight);
 $('catalog-critical').textContent=chosen.critical===null||chosen.critical===0?'Not verified':String(chosen.critical);
 const damage=$('catalog-damage');damage.replaceChildren();
 if(partial&&!Array.isArray(chosen.attack))damage.append(el('p','Base attack unavailable; no values are guessed.'));
 if(comparator)damage.append(el('p','Pinned v1.17 +0 attack accepted in comparator mode. This is not player AR.'));
 if(hasDisputedAttack(chosen))
  damage.append(el('p','SOURCE CONFLICT: values below are disputed COMMUNITY +0 readings, NOT confirmed in-game figures. See accuracy dossier.'));
 for(const part of reportedBaseDamageParts(chosen)){
  const row=el('div');row.className='catalog-value';
  row.append(el('span',part.name),el('strong',
   String(part.amount)+(hasDisputedAttack(chosen)?' (DISPUTED)':'')));damage.append(row);
 }
 renderPublishedUpgrade();
 const required=$('catalog-required');required.replaceChildren();
 if(chosen.requirements===null){
  required.append(el('p','Requirements not sourced yet. Wieldability cannot be determined.'));
 }else{
  if(hasDisputedRequirements(chosen))
   required.append(el('p','SOURCE CONFLICT: these are disputed COMMUNITY values, not confirmed game requirements. No definitive meets/does-not-meet verdict.'));
  for(let i=0;i<5;i++){
   const row=el('div');row.className='catalog-value';
   row.append(el('span',ATTRIBUTE_LABELS[i]),el('strong',
    String(chosen.requirements[i])+(hasDisputedRequirements(chosen)?' (DISPUTED)':'')));
   required.append(row);
  }
 }
 const scaling=$('catalog-scaling');scaling.replaceChildren();
 if(partial)scaling.append(el('p','Initial scaling grades are not verified in this neutral comparison view; use the versioned AR calculator.'));
 for(let i=0;!partial&&i<5;i++){
  const row=el('div');row.className='catalog-value';
  row.append(el('span',ATTRIBUTE_LABELS[i]),el('strong',chosen.scaling[i]));scaling.append(row);
 }
 const concerns=$('catalog-warnings');concerns.replaceChildren();
 if(comparator){
  concerns.append(el('p','v1.17 comparator: 487 neutral attack and requirement rows are taken from the pinned v1.17 parameter source. The AR engine separately matches 50 same-input Tarnished.dev v1.17 UI cases; 487 individual site observations are NOT claimed.'));
  if((chosen.weight===null||hasDisputedWeight(chosen))&&!publicWeight)concerns.append(el('p',
   'v1.17 reference weight unavailable or disputed. Weight and equip-load filters cannot assume zero or resolve this from the attack source.'));
  if(publicWeight)concerns.append(el('p',
   'Separate Tarnished.dev v1.17 Build Calculator equip-load observation: '+publicWeight.weight+
   '. Independently read twice, not derived from the pinned weapon attack source. Original community weight and conflicting-source flags remain unchanged.'));

  if(partial)concerns.append(el('p','Critical, letter scaling and equipment effects are not inferred from a neutral source row.'));
 }else for(const warning of cautionForWeapon(chosen))concerns.append(el('p',warning));
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
 if(chosen.thirdPartyBasePlusZero){
  const t=chosen.thirdPartyBasePlusZero;
  $('catalog-verified').append(el('p',
   'Provisional additional published +0 Base: '+t.observedComponents.join(' / ')+
   ' (Physical / Magic / Fire / Lightning / Holy). This matches pinned Regulation 1.17, but the site has NOT stated a current 1.17.3 patch or demonstrated source independence. Not a verified game-client +0 or AR; original wiki source conflict remains open.'));
  const link=el('a','Inspect third public +0 Base column ↗');
  link.href=t.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';
  $('catalog-verified').append(link);
 }
 if(chosen.sourceAttackDisagreement&&chosen.sourceWeightDisagreement){
  const atk=chosen.sourceAttackDisagreement,wt=chosen.sourceWeightDisagreement;
  $('catalog-verified').append(el('p',
    'Stone-Sheathed Sword published +0 discrepancy: the named +0 and Japanese initial-value tables and AtlasForge show PHYSICAL 89, whereas the same wiki page headline shows 119. Candidate +0 89, critical 100 and C/D scaling are visible as DISPUTED SOURCE FACTS ONLY. Source version is not game-client verified. This community record remains excluded from reliable +0 catalogue filtering. The separate opt-in pinned v1.17 AR calculator can still compute the versioned source variant.'));
  $('catalog-verified').append(el('p',
    'Source weight discrepancy: wiki reports '+wt.retainedCommunityWeight+
    ', Japanese and AtlasForge references report '+wt.alternativeWeight+
    '. The weight and any complete equipment-load/roll-tier result remain BLOCKED.'));
  for(const s of [...atk.supports,atk.conflict,
   {url:wt.secondSourceUrl,field:'Alternative weight 5'}]){
   const a=el('a','Inspect published '+s.field+' ↗');
   a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';
   $('catalog-verified').append(a);
  }
 }
 if(chosen.secondarySourceDisagreement){
  const problem=chosen.secondarySourceDisagreement;
  const note=el('p','Ritual Thrusting Shield secondary sources disagree on weight (10 vs 9) and required Strength (13 vs 15). The version-labelled figures are only attributed readings. Community-mode weight and wield verdicts remain BLOCKED because source readings disagree. The optional pinned v1.17 panel can show versioned requirements, but it does not resolve weight.');
  $('catalog-verified').append(note);
  for(const item of [problem.currentVersionLabelled,...problem.alternatives]){
   const a=el('a','View conflicting public equipment source ↗');
   a.href=item.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';
   $('catalog-verified').append(a);
  }
 }
 if(chosen.currentPatchRequirementCorroboration){
  const q=chosen.currentPatchRequirementCorroboration;
  const evidence=el('p','Current Regulation 1.17.3-labelled secondary reference supports FAI 20 (pinned v1.17); other community source reports 13. Not game screenshot verified; automatic wield verdict remains unavailable.');
  $('catalog-verified').append(evidence);
  const a=el('a','View independently published current-patch requirement FAI 20 ↗');
  a.href=q.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';
  $('catalog-verified').append(a);
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
  'Exact weapon and five character attributes in the same-page link. '+(comparator?'Pinned v1.17 comparator mode must be loaded on the receiving browser.':'Community source mode.'):
  'Character stats invalid; the link contains the weapon reference only.';
 const arLink=$('catalog-ar-source-link');
 // Carry exactly the current five combat stats, not the full build sheet.
 // Both the external v1.17 source download and local import remain opt-in.
 let arStats=null;
 try{arStats=readStats();}catch{ /* invalid stats: send only weapon name */ }
 arLink.href=makeQuickArCalculatorUrl(chosen.name,arStats,
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
  $('catalog-one').textContent=hasDisputedRequirements(chosen)?
   'SOURCE CONFLICT — requirements not confirmed':
   chosen.requirements===null?'Requirements unavailable':'Invalid character attributes';
  $('catalog-two').textContent='—';
  $('catalog-requirements-link').hidden=true;
  $('catalog-shortfall').textContent=hasDisputedRequirements(chosen)?
   chosen.secondarySourceDisagreement?'Secondary references disagree on Ritual Thrusting Shield STR requirement; no definitive wieldability verdict is available.':
   'Community and Regulation requirements disagree. No definitive wieldability verdict or numeric requirements handoff is available; see the accuracy dossier.':
   chosen.requirements===null?
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
 const quality=$('catalog-quality').value;
 const sourceFilter=$('catalog-v117-filter').value;
 // Source filters are grounded in the immutable original overlay. Once the user
 // explicitly accepts comparator mode, damage and requirement filters use the
 // matching pinned v1.17 VIEW; weight remains community-only or unavailable.
 const filteredWeapons=!v117Overlay||sourceFilter==='all'?catalog.weapons:
  catalog.weapons.filter(w=>{
   const row=v117Overlay.rows.get(w.id);
   if(!row||row.status!=='pinned-v117-neutral-reference')return false;
   if(sourceFilter==='source-only')return row.sourceOnly;
   if(sourceFilter==='flagged')return row.flaggedSourceDispute;
   if(sourceFilter==='attack-difference')return row.attackDiff;
   if(sourceFilter==='requirement-difference')return row.requirementDiff;
   if(sourceFilter==='any-difference')return row.attackDiff||row.requirementDiff;
   return false;
  });
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
  data=searchCatalog(filteredWeapons,{
   term,category,sort,limit:40,offset,wield,damage,maxWeight,coverage,quality,
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
  const sourceState=catalogSourceQuality(w);
  const detail=el('span',w.category+' · '+(w.v117Comparator?
   'v1.17 reference attack/requirements · weight '+(getTarnishedV117DirectWeight(w.name)?.weight??(hasDisputedWeight(w)?'disputed':w.weight??'unknown')):
   referenceOnlyMap.has(w.id)?
    'Sourced +0 preview available (not certified)':w.dataCoverage==='name-category-only'?
   'DLC name/category only':w.expansion==='Tarnished Pack'?
   (w.dataCoverage==='base-reference'?'Tarnished Pack · separately sourced +0 base (not AR)':
    'Tarnished Pack · sourced requirements and weight · +0 attack UNKNOWN'):w.dataCoverage==='requirements-weight-only'?
   'DLC requirements + community weight · attack unknown':w.dataCoverage==='requirements-only'?
   'DLC attribute requirements only':w.dataCoverage==='base-reference'?
   'DLC sourced +0 stats · not AR':'Wt '+w.weight+' · reported +0 base'));
  if(listStats){
   const missing=weaponWieldShortfall(w,listStats);
   detail.textContent+=' · '+(!missing.known?'Requirements unknown':
    missing.oneHandPoints===0?'Ready 1H':
     missing.oneHandMissing.map(x=>x.stat+' +'+x.points).join(', ')+' needed (1H)');
  }
  detail.textContent+=' · '+(w.v117Comparator?'v1.17 comparison mode active':
   sourceState.conflict?'⚠ Disputed source fields':
    sourceState.sourceOnly?'Primary attack/weight UNKNOWN':
    sourceState.complete?'+0 / requirements / weight reported (not patch verified)':
    'Partial source fields');
  detail.className='catalog-row-desc';
  const tag=el('span',w.v117Comparator?'v1.17 reference':
   referenceOnlyMap.has(w.id)?'Research-only +0 preview':w.expansion==='Tarnished Pack'?(w.dataCoverage==='base-reference'?'Tarnished Pack · +0 source':'Tarnished Pack · partial'):
   w.expansion==='Shadow of the Erdtree'?(w.dataCoverage==='base-reference'?'DLC · +0 source':'DLC · partial'):(w.flags?.length?'Review data':'View details'));
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
 $('catalog-quality').value='all';
 $('catalog-v117-filter').value='all';
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
$('catalog-quality').addEventListener('change',()=>showList(true));
$('catalog-v117-filter').addEventListener('change',()=>showList(true));
$('catalog-max-weight').addEventListener('input',()=>showList(true));
$('catalog-more').addEventListener('click',()=>showList(false));
$('catalog-v117-export').addEventListener('click',()=>{
 if(!catalog||!v117Overlay)return;
 const status=$('catalog-v117-export-status');
 try{
  const rows=buildV117ReconciliationQueue(originalCatalog??catalog,v117Overlay);
  const csv=v117ReconciliationCsv(rows);
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='elden-ring-v117-source-review-queue.csv';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status.textContent='Downloaded '+rows.length+
   ' open field-level review cases. No source discrepancy is automatically approved, and no weapon weights were guessed.';
 }catch(error){
  status.textContent='Review export unavailable: '+String(error?.message??error).slice(0,160);
 }
});
$('catalog-v117-load').addEventListener('click',async()=>{
 const button=$('catalog-v117-load'),statusText=$('catalog-v117-status');
 if(!catalog||v117Overlay){return;}
 button.disabled=true;
 statusText.textContent='Fetching exact pinned public v1.17 JSON on your request; no source data is bundled or stored…';
 try{
  const {text,summary}=await downloadV117Source(fetch);
  const overlay=buildV117CatalogOverlay(originalCatalog??catalog,JSON.parse(text));
  // User chose Tarnished.dev v1.17 as the ONLY numeric comparison standard.
  // Accept all uniquely mapped +0 attack and requirement rows together, not
  // one speculative conflict-by-conflict approval. Abort if coverage breaks.
  const accepted=buildV117ComparatorCatalog(originalCatalog??catalog,overlay);
  catalog=accepted.catalog;
  if(chosen)chosen=catalog.weapons.find(w=>w.id===chosen.id)??null;
  v117Overlay=overlay;
  const counts=overlay.summary;
  statusText.textContent='Loaded '+summary.entries+' source variants: '+counts.sourceMapped+
   '/'+counts.total+' unique neutral records, '+counts.sourceOnlyMapped+
   ' of the 72 source-only catalog records now show pinned +0 reference; '+
   counts.flaggedDisputesMapped+' flagged source disputes have side-by-side evidence; '+
   counts.neutralAttackDifferences+' attack and '+counts.neutralRequirementDifferences+
   ' requirement differences across '+counts.anyNumericalDifferences+' distinct weapons ('+
   counts.unflaggedNumericalDifferences+' not previously flagged). '+
   'All '+accepted.summary.mapped+' neutral rows now USE v1.17 attack and requirements in details and filters; '+
   accepted.summary.weightNotSupplied+' weights remain absent and '+accepted.summary.weightConflictsRemain+
   ' disputed weights remain blocked. '+
   'This is reference-parameter coverage, NOT '+counts.total+' individually observed Tarnished.dev page results.';
  button.hidden=true;
  $('catalog-v117-filter').disabled=false;
  $('catalog-v117-export').disabled=false;
  $('catalog-v117-export-status').textContent='Optional provenance audit of differences in the ORIGINAL community sources. The selected v1.17 comparison values are already active; weight remains unsupported where missing or disputed.';
  $('catalog-quality-summary').textContent='v1.17 comparison mode active: all '+accepted.summary.mapped+
   ' records have version-matched neutral attack and requirements. '+
   accepted.summary.weightNotSupplied+' records lack weight and '+
   accepted.summary.weightConflictsRemain+' weight conflicts remain. AR numeric comparisons cover 50 independent site cases, not all 487 records.';
  showList(true,true);
  renderV117SourceFacts();
 }catch(error){
  statusText.textContent='Source comparison unavailable: '+String(error?.message??error).slice(0,250)+
   '. Original community catalog remains usable.';
  button.disabled=false;
 }
});
$('catalog-stats').addEventListener('input',()=>{
 renderDetails();
 if($('catalog-wield').value!=='any'||$('catalog-sort').value==='requirements')
  showList(true);
});
try{
 const response=await fetch('../data/community-weapon-catalog.json',{cache:'default'});
 if(!response.ok)throw new Error('The local weapon catalog is unavailable ('+response.status+').');
 catalog=validateCommunityCatalog(await response.json());
 originalCatalog=catalog;
 // Reference-only source evidence never enters catalog.weapons or any calculator.
 try{
  const res=await fetch('../data/v117-recovered-72-reference.json',{cache:'default'});
  if(!res.ok)throw new Error('HTTP '+res.status);
  const evidence=await res.json();
  validateRecoveredSourceReferences(evidence,catalog);
  referenceOnlyMap=new Map(evidence.records.map(w=>[w.id,w]));
 }catch(e){
  referenceOnlyError=e.message;
  referenceOnlyMap=new Map();
 }

 $('catalog-count').textContent=String(catalog.weapons.length);
 const counts=catalogQualityCounts(catalog.weapons);
 $('catalog-quality-summary').textContent=
  counts.complete+' of '+counts.total+' entries have +0/requirement/weight fields without flagged source conflicts; '+
  counts.partial+' are incomplete or disputed, including '+counts.conflict+
  ' with explicitly flagged source disputes and '+counts.sourceOnly+
  ' research-only, non-promoted candidate previews. Source-field availability does NOT establish current game accuracy.';
 for(const category of catalogCategories(catalog.weapons)){
  const opt=el('option',category);opt.value=category;$('catalog-category').append(opt);
 }
 try{comparedIds=parseReferenceCompareIds(params.get('compare'),new Set(catalog.weapons.map(w=>w.id)));}
 catch{comparedIds=[];$('catalog-compare-feedback').textContent='Invalid comparison URL; selection ignored.';}
 const preferred=(catalog.meta.legacyWeaponIdAliases||{})[params.get('weapon')]||params.get('weapon');
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
  ' with source-published upgraded BASE attacks; plus '+
  catalog.meta.tarnishedPackCount+' Tarnished Pack weapons/shields ('+
  catalog.meta.tarnishedPackBaseFactCount+' with cited community +0 base attack; '+
  catalog.meta.tarnishedPackWeightedRequirementsCount+' requirements/weight only)). No precise DLC or Tarnished Pack AR is available.');
}catch(e){
 status('Could not load weapon records: '+e.message,true);
 $('catalog-results').textContent='No data loaded';
}
