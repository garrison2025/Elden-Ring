import {DAMAGE_LABELS,ATTRIBUTE_LABELS,weaponRequirementComparison,hasDisputedAttack,hasDisputedRequirements,hasDisputedWeight} from './community-weapons.mjs';
const fail=message=>{throw new RangeError(message)};
const unknown=v=>v===null||v===undefined?'Unknown':String(v);
function validateIds(ids,known){
 if(!Array.isArray(ids)||ids.length<1||ids.length>3||ids.some(x=>typeof x!=='string'||!x||
   x.length>100)||new Set(ids).size!==ids.length)fail('Select 1 to 3 distinct weapon IDs.');
 if(known&&ids.some(x=>!known.has(x)))fail('Unknown weapon ID in comparison link.');
 return ids;
}
function validateStats(stats){
 if(stats===null)return null;
 if(!Array.isArray(stats)||stats.length!==5||
   stats.some(v=>!Number.isInteger(v)||v<1||v>99))fail('Comparison player stats must contain five valid attributes.');
 return stats;
}
/** Strict, bounded comparison-link parsing. No arbitrary names or JSON are trusted. */
export function parseReferenceCompareIds(raw,known){
 if(raw===null||raw==='')return [];
 if(typeof raw!=='string'||raw.length>305)fail('Comparison link is too long.');
 if(!(known instanceof Set))fail('A weapon ID whitelist is required.');
 const ids=raw.split(',');
 return [...validateIds(ids,known)];
}
export function referenceCompareQuery(ids,stats=null){
 validateIds(ids);
 validateStats(stats);
 const params=new URLSearchParams();
 params.set('compare',ids.join(','));
 if(stats!==null)params.set('player',stats.join(','));
 return params.toString();
}
/** Returns sourced +0 facts and basic requirement results, NEVER player AR or damage. */
export function compareWeaponReferences(weapons,ids,stats=null){
 if(!Array.isArray(weapons))fail('Missing weapon catalog.');
 const byId=new Map(weapons.map(w=>[w.id,w]));
 validateIds(ids,new Set(byId.keys()));validateStats(stats);
 const columns=ids.map(id=>byId.get(id));
 const rows=[];
 const add=(label,get)=>rows.push({label,values:columns.map(get)});
 add('Data coverage',w=>w.dataCoverage==='base-reference'?'DLC +0 reference':
   w.dataCoverage==='requirements-weight-only'?'DLC requirements + source weight only':
   w.dataCoverage==='requirements-only'?'DLC requirements only':
   w.dataCoverage==='name-category-only'?'DLC name/class only':'Base-game community +0');
 add('Weapon class',w=>w.category);
 add('Weight',w=>hasDisputedWeight(w)?'DISPUTED (community '+unknown(w.weight)+')':unknown(w.weight));
 add('Source dispute',w=>[
  hasDisputedAttack(w)?'Base attack unresolved':'',
  hasDisputedRequirements(w)?'Requirements unresolved':'',
  hasDisputedWeight(w)?'Weight unresolved':''
 ].filter(Boolean).join(' + ')||'No flagged v1.17 dispute (still community data)');
 add('Critical',w=>unknown(w.critical));
 for(let i=0;i<DAMAGE_LABELS.length;i++){
  add(DAMAGE_LABELS[i]+' +0 base',w=>w.attack===null?'Unknown':
   hasDisputedAttack(w)?'DISPUTED (community '+w.attack[i]+')':String(w.attack[i]));
 }
 for(let i=0;i<ATTRIBUTE_LABELS.length;i++){
  add(ATTRIBUTE_LABELS[i]+' requirement',w=>w.requirements===null?'Unknown':
   hasDisputedRequirements(w)?'DISPUTED (community '+w.requirements[i]+')':String(w.requirements[i]));
 }
 for(let i=0;i<ATTRIBUTE_LABELS.length;i++){
  add(ATTRIBUTE_LABELS[i]+' +0 letter',w=>w.scaling===null?'Unknown':w.scaling[i]==='?'?'Unverified':w.scaling[i]);
 }
 if(stats!==null){
  add('One-hand requirements',w=>{
   if(w.requirements===null)return 'Unknown';
   if(hasDisputedRequirements(w))return 'UNRESOLVED source conflict';
   const x=weaponRequirementComparison(w,stats).oneHanded;
   return x.canWield?'Met':x.totalMissing+' point(s) short';
  });
  add('Two-hand STR assumption',w=>{
   if(w.requirements===null)return 'Unknown';
   if(hasDisputedRequirements(w))return 'UNRESOLVED source conflict';
   const x=weaponRequirementComparison(w,stats);
   return x.twoHanded.canWield?'Met'+(x.applyTwoHandBonus?' (standard 2H)':' (no STR boost)'):
    x.twoHanded.totalMissing+' point(s) short'+(x.applyTwoHandBonus?' (standard 2H)':' (no STR boost)');
  });
 }
 return {columns:columns.map(w=>({id:w.id,name:w.name})),rows,
  warning:'Flagged 1.17 source disagreements are explicitly DISPUTED and cannot produce wieldability results. Community source-reported attack is +0 BASE only (or Unknown), while single-weapon weight is NOT total equipment load. Physical and elemental components are not interchangeable. No total AR, player scaling, upgrades, infusion, DPS, or PvE damage is computed.'};
}
