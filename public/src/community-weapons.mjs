import {compareWeaponRequirements} from './requirements.mjs';

export const DAMAGE_LABELS=Object.freeze(['Physical','Magic','Fire','Lightning','Holy']);
export const ATTRIBUTE_LABELS=Object.freeze(['STR','DEX','INT','FAI','ARC']);
const fail=m=>{throw new RangeError(m);};
const ATTACK_CONFLICT='v117-community-attack-conflict';
const REQUIREMENT_CONFLICT='v117-community-requirement-conflict';
const WEIGHT_CONFLICT='v117-community-weight-conflict';
/** Distinguish documented community values from unresolved patch disagreements. */
export const hasDisputedAttack=w=>(w?.flags??[]).includes(ATTACK_CONFLICT);
export const hasDisputedRequirements=w=>(w?.flags??[]).includes(REQUIREMENT_CONFLICT);
export const hasDisputedWeight=w=>(w?.flags??[]).includes(WEIGHT_CONFLICT);

/**
 * Validates a 2026-10-30 snapshot of factual community weapon properties.
 * Base +0 attack is not Attack Rating (AR); no scaling/upgrade math is inferred.
 * Does not confer the right to redistribute game artwork or text.
 */
export function validateCommunityCatalog(catalog){
 if(!catalog||typeof catalog!=='object'||catalog.schemaVersion!==1||
    !Array.isArray(catalog.weapons)||catalog.weapons.length<1||catalog.weapons.length>5000)
  fail('Invalid community weapon data schema.');
 if(!catalog.meta||catalog.meta.count!==catalog.weapons.length||
    typeof catalog.meta.source!=='string'||typeof catalog.meta.version!=='string')
  fail('Catalog provenance or record count is missing.');
 const ids=new Set();
 for(const [i,w] of catalog.weapons.entries()){
  if(!w||typeof w!=='object'||typeof w.id!=='string'||!w.id||
    typeof w.name!=='string'||!w.name.trim()||w.name.length>120||
    typeof w.category!=='string'||!w.category.trim())fail('Malformed weapon entry '+i);
  if(ids.has(w.id))fail('Duplicate weapon ID '+i);
  ids.add(w.id);
  const dlc=w.expansion==='Shadow of the Erdtree';
  const pack=w.expansion==='Tarnished Pack';
  const coverage=w.dataCoverage??'base-community';
  if(pack&&(!['requirements-weight-only','base-reference'].includes(coverage)||w.arParameters!=null||
    w.parameterReference?.regulation!=='1.17.3'||
    w.parameterReference?.gameBuild!=='25827938'||
    !w.sourceUrl?.startsWith('https://www.gamesradar.com/')||
    w.requirementsSourceUrl!=='https://almanauts.com/eldenring/weapons/'||
    w.weightSourceUrl!=='https://almanauts.com/eldenring/weapons/'))
   fail('Tarnished Pack entries require attributed 1.17.3 requirements and weight at row '+i);
  if(pack&&coverage==='base-reference'&&(
    !w.checkedWith?.startsWith('https://eldenring.wiki.gg/wiki/')||
    w.baseFactsProvenance?.type!=='single-community-weapon-page-plus-zero'||
    w.baseFactsProvenance?.versionVerified!==false||
    !(w.flags??[]).includes('wiki-pack-pluszero-not-game-version-certified')))
   fail('Pack +0 base facts must cite one weapon wiki page and remain game-unverified at row '+i);
  if(w.currentPatchRequirementCorroboration!==undefined){
   const p=w.currentPatchRequirementCorroboration;
   if(w.id!=='sote-reference-051'||!hasDisputedRequirements(w)||
      p.field!=='requirements'||p.sourceUrl!=='https://almanauts.com/eldenring/tiers/weapons-fist/'||
      p.sourcePatchUrl!=='https://almanauts.com/eldenring/patches/1-17-3/'||
      p.regulation!=='1.17.3'||p.referenceBuild!=='25827938'||
      p.evidenceClass!=='independent-version-labelled-secondary-game-parameter-reference'||
      p.matchesPinnedV117!==true||p.gameClientVerified!==false||
      p.publicationApproved!==false||!Array.isArray(p.values)||
      p.values.join(',')!=='8,8,13,20,0'||w.requirements.join(',')!=='8,8,13,13,0')
    fail('Current-patch requirement corroboration has drifted or claims false verification.');
  }
  if(dlc&&!['requirements-only','requirements-weight-only','name-category-only','base-reference'].includes(coverage))
   fail('Unknown DLC data coverage at row '+i);
  if(dlc&&(!w.sourceUrl?.startsWith('https://')||w.arParameters!==undefined&&w.arParameters!==null))
   fail('DLC provenance missing or unchecked AR parameters inserted at row '+i);
  const missingAttack=coverage==='requirements-only'||coverage==='requirements-weight-only'||coverage==='name-category-only';
  if(missingAttack&&(w.attack!==null||w.critical!==null||w.scaling!==null))
   fail('Partial DLC rows must keep unavailable attack, critical and scaling null: '+i);
  if((coverage==='requirements-only'||coverage==='name-category-only')&&w.weight!==null)
   fail('Unavailable DLC weight must be null: '+i);
  if(coverage==='requirements-weight-only'&&
     (!Number.isFinite(w.weight)||w.weight<0||w.weight>200||
      !(pack||w.weightSourceUrl?.startsWith('https://github.com/hakkache/Elden-Ring-Dataset-API/blob/')||w.weightSourceUrl?.startsWith('https://eldenring.wiki.gg/wiki/'))))
   fail('Source and weight required for DLC partial weighted entry '+i);
  if(w.requirementsSourceUrl!==undefined&&!pack&&
     !w.requirementsSourceUrl.startsWith('https://github.com/hakkache/Elden-Ring-Dataset-API/blob/'))
   fail('Invalid independently attributed requirement source '+i);
  if(coverage==='name-category-only'&&w.requirements!==null)
   fail('Unknown DLC requirements must be null: '+i);
  if(coverage==='base-reference'&&(!(dlc||pack)||!w.checkedWith?.startsWith('https://eldenring.wiki.gg/wiki/')))
   fail('Expansion +0 reference requires named numeric source: '+i);
  if(!missingAttack&&(!Number.isFinite(w.weight)||w.weight<0||w.weight>200||
    !Number.isInteger(w.critical)||w.critical<0||w.critical>300))
   fail('Invalid weight or critical at row '+i);
  if(!missingAttack&&(!Array.isArray(w.attack)||w.attack.length!==5||
    w.attack.some(v=>!Number.isInteger(v)||v<0||v>5000)||!w.attack.some(v=>v>0)))
   fail('Invalid base damage '+i);
  if(coverage!=='name-category-only'&&(!Array.isArray(w.requirements)||w.requirements.length!==5||
    w.requirements.some(v=>!Number.isInteger(v)||v<0||v>99)))fail('Invalid requirements '+i);
  if(!missingAttack&&(!Array.isArray(w.scaling)||w.scaling.length!==5||
    w.scaling.some(v=>typeof v!=='string'||!/^(?:S|A|B|C|D|E|-|\?)$/i.test(v))))
   fail('Invalid scaling-letter metadata '+i);
  if(w.upgradeReference!==undefined){
   const ref=w.upgradeReference;
   if(!dlc||coverage!=='base-reference'||!ref||ref.path!=='somber'||
      ref.status!=='community-published-base-attack'||ref.sourceUrl!==w.checkedWith||
      !Array.isArray(ref.attackByLevel)||ref.attackByLevel.length!==11)
    fail('Upgrade reference requires sourced DLC somber rows at '+i);
   for(const [level,attack] of ref.attackByLevel.entries()){
    if(!Array.isArray(attack)||attack.length!==5||
       attack.some((v,j)=>!Number.isInteger(v)||v<0||v>5000||
       (level>0&&v<ref.attackByLevel[level-1][j])))
      fail('Invalid published upgrade attack +'+level+' at row '+i);
   }
   if(ref.attackByLevel[0].some((v,j)=>v!==w.attack[j]))
    fail('Upgrade +0 must match original source base attack at row '+i);
  }
  if(w.patchCorrection!==undefined&&(!w.patchCorrection?.sourceUrl?.startsWith('https://almanauts.com/')||!Number.isInteger(w.patchCorrection.correctedValue)||w.patchCorrection.correctedValue!==w.attack[0]))fail('Invalid patch correction source '+i);
  if(w.flags!==undefined&&(!Array.isArray(w.flags)||w.flags.some(x=>typeof x!=='string'||x.length>65)))
   fail('Invalid quality flags '+i);
 }
 const dlcRows=catalog.weapons.filter(w=>w.expansion==='Shadow of the Erdtree');
 const packRows=catalog.weapons.filter(w=>w.expansion==='Tarnished Pack');
 const totals={
  baseCommunityCount:catalog.weapons.filter(w=>!w.expansion).length,
  tarnishedPackCount:packRows.length,
  tarnishedPackWeightedRequirementsCount:packRows.filter(w=>w.dataCoverage==='requirements-weight-only').length,
  tarnishedPackBaseFactCount:packRows.filter(w=>w.dataCoverage==='base-reference').length,
  currentPatchRequirementsCorroborationCount:catalog.weapons.filter(w=>w.currentPatchRequirementCorroboration!==undefined).length,
  dlcCatalogCount:dlcRows.length,
  dlcBaseFactCount:dlcRows.filter(w=>w.dataCoverage==='base-reference').length,
  dlcWeightOnlyCount:dlcRows.filter(w=>w.dataCoverage==='requirements-weight-only').length,
  dlcRequirementOnlyCount:dlcRows.filter(w=>w.dataCoverage==='requirements-only').length,
  dlcNameOnlyCount:dlcRows.filter(w=>w.dataCoverage==='name-category-only').length,
  dlcUpgradeReferenceCount:dlcRows.filter(w=>w.upgradeReference!==undefined).length,
  v117SourceConflictCount:dlcRows.filter(w=>(w.flags??[]).some(s=>s===ATTACK_CONFLICT||s===REQUIREMENT_CONFLICT||s===WEIGHT_CONFLICT)).length
 };
 for(const [key,value] of Object.entries(totals))
  if(catalog.meta[key]!==value)fail('Catalog coverage metadata mismatch: '+key);
 return catalog;
}
export function catalogCategories(weapons){
 return [...new Set(weapons.map(x=>x.category))].sort((a,b)=>a.localeCompare(b));
}
// A list of categories whose grip is not the ordinary two-handing melee
// assumption. This is intentionally conservative and never verifies game AR.
const NO_STANDARD_TWO_HAND=new Set([
 'Ballista','Bow','Greatbow','Light Bow',
 'Glintstone Staff','Sacred Seal','Fist','Claw',
 'Backhand Blade','Beast Claw','Perfume Bottle','Hand-to-Hand Art',
 'Thrusting Shield','Throwing Blade','Small Shield','Medium Shield',
 'Greatshield','Torch'
]);
const SOURCE_VERIFIED_TWO_HAND_EXCEPTION_NAMES=new Set([
 "Ansbach's Longbow","Beast Claw","Nanaya's Torch",
 "Dancing Blade of Ranah","Curseblade's Cirque","Death Knight's Twin Axes",
 "Golem Fist","Golden Lion Shield","Thiollier's Hidden Needle"
]);
const SPECIAL_PAIRED_NAMES=new Set([
 "Rellana's Twin Blades","Death Knight's Twin Axes","Falx",
 "Dancing Blade of Ranah"
]);
export function standardTwoHandAssumption(weapon){
 return SOURCE_VERIFIED_TWO_HAND_EXCEPTION_NAMES.has(weapon.name)||
  (!NO_STANDARD_TWO_HAND.has(weapon.category)&&!SPECIAL_PAIRED_NAMES.has(weapon.name));
}
export function weaponRequirementComparison(weapon,stats){
 if(!weapon)fail('Weapon selection is missing.');
 if(hasDisputedRequirements(weapon))
  fail('Weapon requirements have an unresolved community-versus-Regulation source conflict; wieldability is unavailable.');
 if(!Array.isArray(weapon.requirements))fail('Weapon attribute requirements are not documented; comparison is unavailable.');
 return compareWeaponRequirements(stats,weapon.requirements,{
  applyTwoHandBonus:standardTwoHandAssumption(weapon)});
}
/**
 * Source-reported requirements only. Missing requirements remain UNKNOWN;
 * no actual game-client wield test or AR values are inferred.
 */
export function weaponWieldShortfall(weapon,stats){
 if(!Array.isArray(stats)||stats.length!==5||
  !stats.every(n=>Number.isInteger(n)&&n>=1&&n<=99))
  throw new RangeError('Five integer character attributes from 1 to 99 are required.');
 if(!Array.isArray(weapon?.requirements)||hasDisputedRequirements(weapon))return {
  known:false,sourceDisputed:hasDisputedRequirements(weapon),
  oneHandPoints:null,twoHandPoints:null,
  oneHandMissing:[],twoHandMissing:[],twoHandAssumption:false
 };
 const result=weaponRequirementComparison(weapon,stats);
 const missing=grip=>grip.rows.filter(x=>x.missing>0).map(x=>({
  stat:x.key.toUpperCase(),points:x.missing
 }));
 return {
  known:true,sourceDisputed:false,oneHandPoints:result.oneHanded.totalMissing,
  twoHandPoints:result.twoHanded.totalMissing,
  oneHandMissing:missing(result.oneHanded),
  twoHandMissing:missing(result.twoHanded),
  twoHandAssumption:result.applyTwoHandBonus
 };
}
function validateSearch({term,category,sort,limit,offset,wield,damage,maxWeight,stats,coverage}){
 if(typeof term!=='string'||term.length>100||
    typeof category!=='string'||category.length>100||
    !['name','weight','base','requirements'].includes(sort)||
    !Number.isInteger(limit)||limit<1||limit>100||
    !Number.isInteger(offset)||offset<0||
    !['any','one','standard-two'].includes(wield)||
    !['all','base','dlc','tarnished'].includes(coverage)||
    !['any','physical','magic','fire','lightning','holy'].includes(damage)||
    !(maxWeight===null||(typeof maxWeight==='number'&&Number.isFinite(maxWeight)&&maxWeight>=0&&maxWeight<=200)))
  fail('Invalid catalog search parameters.');
 if(wield!=='any'||sort==='requirements'){
  // Requirement sorting also needs valid character stats, even without a wield filter.
  compareWeaponRequirements(stats,[0,0,0,0,0]);
 }
}
export function searchCatalog(weapons,{
 term='',category='all',sort='name',limit=50,offset=0,
 wield='any',damage='any',maxWeight=null,stats=null,coverage='all'
}={}){
 if(!Array.isArray(weapons))fail('Invalid weapon catalog.');
 const options={term,category,sort,limit,offset,wield,damage,maxWeight,stats,coverage};
 validateSearch(options);
 const q=term.trim().toLocaleLowerCase('en-US');
 const damageIndex={physical:0,magic:1,fire:2,lightning:3,holy:4}[damage];
 const matches=weapons.filter(w=>{
  if(coverage==='dlc'&&w.expansion!=='Shadow of the Erdtree')return false;
  if(coverage==='tarnished'&&w.expansion!=='Tarnished Pack')return false;
  if(coverage==='base'&&w.expansion)return false;
  if(category!=='all'&&w.category!==category)return false;
  if(q&&!w.name.toLocaleLowerCase('en-US').includes(q)&&
    !w.category.toLocaleLowerCase('en-US').includes(q))return false;
  if(maxWeight!==null&&(w.weight===null||hasDisputedWeight(w)||w.weight>maxWeight))return false;
  if(damage!=='any'&&
   (hasDisputedAttack(w)||!(Array.isArray(w.attack)&&w.attack[damageIndex]>0)))
   return false;
  if(wield!=='any'){
   if(!Array.isArray(w.requirements)||hasDisputedRequirements(w))return false;
   const result=weaponRequirementComparison(w,stats);
   if(wield==='one'&&!result.oneHanded.canWield)return false;
   if(wield==='standard-two'&&!result.twoHanded.canWield)return false;
  }
  return true;
 });
 matches.sort((a,b)=>{
  if(sort==='requirements'){
   const left=weaponWieldShortfall(a,stats),right=weaponWieldShortfall(b,stats);
   if(!left.known||!right.known)
    return left.known?-1:right.known?1:a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
   return left.oneHandPoints-right.oneHandPoints||
    left.twoHandPoints-right.twoHandPoints||
    a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
  }
  if(sort==='weight'){
   const left=hasDisputedWeight(a)?null:a.weight;
   const right=hasDisputedWeight(b)?null:b.weight;
   if(left===null||right===null)return left===null?(right===null?0:1):-1;
   return left-right||a.name.localeCompare(b.name);
  }
  if(sort==='base'){
   const left=hasDisputedAttack(a)?null:a.attack;
   const right=hasDisputedAttack(b)?null:b.attack;
   if(!left||!right)return !left?(!right?0:1):-1;
   return right.reduce((n,v)=>n+v,0)-left.reduce((n,v)=>n+v,0)||a.name.localeCompare(b.name);
  }
  return a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
 });
 return {total:matches.length,results:matches.slice(offset,offset+limit)};
}
/** Attribution-only: may expose disputed community numbers, never use for calculations. */
export function reportedBaseDamageParts(weapon){
 if(!Array.isArray(weapon?.attack))return [];
 return DAMAGE_LABELS.map((name,i)=>({name,amount:weapon.attack[i]})).filter(x=>x.amount>0);
}
/** Fail closed: missing or source-disputed +0 attack has NO numeric result. */
export function baseDamageParts(weapon){
 if(hasDisputedAttack(weapon)||!Array.isArray(weapon?.attack))return null;
 return reportedBaseDamageParts(weapon);
}
/** Only observed, published base attack integers; never AR or a numeric multiplier. */
export function publishedUpgradeParts(weapon,level){
 if(!Number.isInteger(level)||level<0||level>10)fail('Invalid published upgrade level.');
 if(hasDisputedAttack(weapon)||!weapon?.upgradeReference)return null;
 const parts=weapon.upgradeReference.attackByLevel[level];
 if(!Array.isArray(parts)||parts.length!==5)fail('Missing published upgrade row; interpolation prohibited.');
 return DAMAGE_LABELS.map((name,i)=>({name,amount:parts[i]})).filter(x=>x.amount>0);
}
export function cautionForWeapon(w){
 const flags=new Set(w.flags??[]);
 const warnings=[];
 if(w.dataCoverage==='requirements-weight-only')warnings.push(w.expansion==='Tarnished Pack'?
   'Tarnished Pack / Tarnished Edition ownership required. Requirements and weight are from a patch-labelled 1.17.3 secondary source, NOT independently inspected game-menu evidence. +0 base attack, critical, scaling and AR remain UNKNOWN.':
   'Requirements and single-weapon weight are sourced from a secondary community dataset. +0 attack, critical, scaling and upgrade values remain UNKNOWN. Source not independently game-verified for current regulation.');
 if(w.dataCoverage==='requirements-only')warnings.push(
   'DLC reference: attribute requirements listed, but +0 attack, weight, critical and scaling are UNVERIFIED (not zero).');
 if(w.dataCoverage==='name-category-only')warnings.push(
   'DLC roster only: attribute requirements, base attack, weight, critical, reinforcement and scaling are UNVERIFIED. Wield checks are unavailable.');
 if(w.dataCoverage==='base-reference')warnings.push(
   w.expansion==='Tarnished Pack'?
   'Pack +0 base attack/crit/letter scaling are from a named community weapon-page reference, not a separately verified Regulation 1.17.3 game-client menu. No precise AR, infusion curves or upgrades are inferred.':
   'DLC +0 reference facts cross-checked against the linked community wiki; current regulation not independently tested. Exact AR is UNSUPPORTED without reinforcement, affinity and full numeric scaling parameters.');
 if(w.upgradeReference)warnings.push(
   'The +0 to +10 values are published rounded BASE attacks only, not precise reinforcement multipliers, infusion data, or AR.');
 if(flags.has('duplicate-name-in-source'))warnings.push('Community source contains duplicate entries with this name; confirm the correct item.');
 if(flags.has('suspicious-critical-in-source'))warnings.push('Critical value in the upstream source is suspicious. Treat it as unverified.');
 if(flags.has('malformed-physical-field-in-source'))warnings.push('Upstream physical attack field is malformed. Do not rely on this number.');
 if(flags.has('zero-physical-mixed-entry-check'))warnings.push('Physical attack needs independent cross-check.');
 if(flags.has('v117-community-attack-conflict'))warnings.push(
  'SOURCE CONFLICT: the wiki +0 base attack differs from game-derived Regulation 1.17 parameters after its +0 reinforcement multiplier. Exact version/patch parity has NOT been verified; treat this +0 number as disputed.');
 if(flags.has(WEIGHT_CONFLICT))warnings.push(
  'SOURCE CONFLICT: weapon weight disagrees between sources. Do not compute a complete equipped load or roll tier from this disputed weight.');
 if(flags.has('v117-community-requirement-conflict'))warnings.push(
  'SOURCE CONFLICT: the wiki attribute requirement differs from public game-derived Regulation 1.17 parameters. Current regulation and independent gameplay evidence are needed before selecting a definitive requirement.');
 if(w.currentPatchRequirementCorroboration)warnings.push(
  'CURRENT 1.17.3 SECONDARY REFERENCE: Madding Hand FAI 20 independently agrees with pinned Regulation 1.17; an unversioned wiki still gives 13. Evidence favors 20 for the version-labelled parameter reference, but no original game-client screenshot has been independently inspected. This source conflict still blocks definitive automatic wield checks.');
 if(flags.has('wiki-category-table-base-observation'))warnings.push('Base +0 figures sourced from a named row in a wiki category comparison table; not independently tested in the current regulation. See source link.');
 if(flags.has('conflicting-or-malformed-zero-grade'))warnings.push('At least one +0 scaling letter is inconsistent or malformed across community tables and is deliberately UNKNOWN (?).');
 if(flags.has('secondary-requirements-or-weight-corrected'))warnings.push('An earlier community dataset requirement or weight was corrected using the individual weapon page.');
 if(flags.has('unknown-scaling-letter'))warnings.push('One or more base scaling grades are unknown (?) in the source. They are NOT estimated.');
 if(flags.has('conflicting-weapon-plus-zero-observation'))warnings.push('Conflicting +0 source observations; attack, scaling and critical intentionally remain UNKNOWN. Source requires manual reconciliation.');
 if(flags.has('secondary-weight-overridden-by-individual-wiki'))warnings.push('Secondary community weight disagreed; individual wiki source is used instead. Not current-regulation game-certified.');
 if(flags.has('1.17-physical-attack-corrected'))warnings.push('Physical +0 base attack corrected using a documented Regulation 1.17 change; other fields are not game-certified.');
 if(flags.has('published-upgrade-table-conflict-not-imported'))warnings.push('Community published upgrade rows contain contradictions; +1..+10 attack values deliberately withheld.');
 if(flags.has('selected-values-cross-checked'))warnings.push('Selected base figures independently cross-checked; full patch/AR still unverified.');
 return warnings;
}
export function requirementsUrl(weapon,player,base='../'){
 if(hasDisputedRequirements(weapon))
  fail('Disputed source requirements cannot be shared as definitive weapon requirements.');
 const url=new URL(base+'weapon-requirements/', 'https://buildlab.example/');
 url.searchParams.set('player',player.join(','));
 url.searchParams.set('req',weapon.requirements.join(','));
 return url.pathname+url.search;
}
