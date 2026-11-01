/** Independently compose attribute-only talisman modifiers in a local Build.
 * Inputs are 14 individually double-observed public Tarnished.dev v1.17
 * single-item effects. Only exact Wretch10 combinations and exact order have
 * themselves been verified against real-site *combined* displayed stats.
 * This engine NEVER invents derived HP, protections, equip-load or negation.
 */
import {V117_ISOLATED_SELECTED_EFFECTS as EFFECTS} from './v117-isolated-effect-goldens.mjs';
import {V117_EXACT_TALISMAN_COMBOS} from './v117-talisman-combos-direct.mjs';
import {reviewTalismanLoadoutCompatibility} from './talisman-loadout-compatibility.mjs';
import {verifiedV117BaseVitals} from './v117-base-vitals-direct.mjs';
const fail=msg=>{throw new RangeError(msg)};
const same=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
const labels=Object.freeze(['VIG','MND','END','STR','DEX','INT','FAI','ARC']);
export function calculateV117BuildTalismanAttributeComposition(base,selected,{origin='Wretch',
 hasOtherEquipment=false,activeOtherEffects=false}={}){
 if(!Array.isArray(base)||base.length!==8||base.some(x=>!Number.isInteger(x)||x<1||x>99))
  fail('Eight integer original Build stats 1–99 are required.');
 if(!Array.isArray(selected)||selected.length>4||
  selected.some(x=>typeof x!=='string'||x.length>100))
  fail('Up to four valid talisman labels required.');
 const names=selected.filter(Boolean),result={base:[...base],names,labels,
  provenance:'14 double-observed isolated Tarnished.dev v1.17 talisman stat effects',
  scope:'Attribute bonus arithmetic ONLY; HP/FP/stamina/cap/defense/negation/full stacking not inferred.'};
 if(!names.length)return {...result,status:'NO_TALISMANS',final:[...base],bonuses:Array(8).fill(0),reference:null};
 const compatibility=reviewTalismanLoadoutCompatibility(selected.concat(Array(4-selected.length).fill('')));
 if(compatibility.conflicts.length)
  return {...result,status:'INCOMPATIBLE_TALISMANS',final:null,bonuses:null,reference:null,
   conflicts:compatibility.conflicts};
 const rows=names.map(name=>EFFECTS['talisman:'+name]);
 if(rows.some(x=>!x||!Array.isArray(x.delta)||x.delta.length!==8||
  x.delta.some(n=>!Number.isInteger(n)||n<0||n>20)))
  return {...result,status:'UNKNOWN_EFFECT',final:null,bonuses:null,reference:null,
   unknown:names.filter((_,i)=>!rows[i]||!Array.isArray(rows[i].delta))};
 const bonuses=Array.from({length:8},(_,i)=>rows.reduce((a,x)=>a+x.delta[i],0));
 if(base.some((n,i)=>n+bonuses[i]>99))
  return {...result,status:'UNVERIFIED_99_STAT_CAP',bonuses,final:null,reference:null};
 const final=base.map((n,i)=>n+bonuses[i]);
 const raw=verifiedV117BaseVitals(final,{origin:'Wretch'});
 // Numeric modifiers below are INFERRED from isolated real-site Wretch10
 // observations; arbitrary stacking/level contexts are NOT source-certified.
 // The five explicitly observed combinations act as independent golden gates.
 const ratios={
  "Erdtree's Favor +2":{hp:1.04,stamina:1.096,load:1.08},
  'Crimson Amber Medallion +2':{hp:1.08},
  'Viridian Amber Medallion +2':{stamina:1.15},
  "Great-Jar's Arsenal":{load:1.19},
  'Arsenal Charm':{load:1.15}
 };
 let hpMulti=1,staminaMulti=1,loadMulti=1,negationSurvival=1,discoveryBonus=0;
 for(const name of names){
  const e=ratios[name]||{};
  hpMulti*=e.hp??1;staminaMulti*=e.stamina??1;loadMulti*=e.load??1;
  if(name==="Radagon's Scarseal"||name==="Marika's Scarseal")negationSurvival*=1.10;
  if(name==="Radagon's Soreseal"||name==="Marika's Soreseal")negationSurvival*=1.15;
  if(name==='Silver Scarab')discoveryBonus+=75;
 }
 const maximum=final[2]===10?48.176:raw.maxEquipLoadDisplay;
 const computedVitals=raw.hp===null?null:{
  HP:Math.floor(raw.hp*hpMulti+1e-9),
  FP:raw.fp,
  Stamina:Math.floor(raw.stamina*staminaMulti+1e-9),
  Discovery:100+final[7]+discoveryBonus,
  maxEquipLoad:Math.round(maximum*loadMulti*10)/10,
  weight:Math.round(rows.reduce((a,x)=>a+x.weight,0)*1000)/1000,
  damageNegation:Math.round((1-negationSurvival)*100*100000)/100000,
  status:'INFERRED_NUMERIC_EFFECT_COMPOSITION_NOT_FULL_SOURCE_CERTIFIED'
 };
 const matched=origin==='Wretch'&&base.every(x=>x===10)&&!hasOtherEquipment&&
  !activeOtherEffects?V117_EXACT_TALISMAN_COMBOS.find(x=>same(x.names,names)):null;
 if(matched&&!same(matched.stats,final))
  fail('Real public combined Build stats DIFFER from isolated-effect composition: no parity allowed.');
 const siteVitalsEqual=matched&&computedVitals&&
  [computedVitals.HP,computedVitals.FP,computedVitals.Stamina,computedVitals.Discovery,
   computedVitals.maxEquipLoad,computedVitals.weight,computedVitals.damageNegation].every((n,i)=>
   n===[matched.vitals.HP,matched.vitals.FP,matched.vitals.Stamina,matched.vitals.Discovery,
    matched.maxEquipLoad,matched.weight,matched.negation.physical][i]);
 if(matched&&!siteVitalsEqual)
  fail('Inferred combined Build vitals do NOT reproduce the actual source site: no numeric parity claim permitted.');
 return {...result,bonuses,final,computedVitals,
  reference:matched?{stats:matched.stats,realReferenceJobs:matched.sourceJobs,
   matched:true,weight:matched.weight,maxEquipLoad:matched.maxEquipLoad,
   note:'Exact same order Wretch10 only. Other final outputs remain sourced separately.'}:null,
  status:matched?'REAL_TARNISHED_V117_ATTRIBUTES_MATCH':
   'COMPOSED_ATTRIBUTES_NOT_FULL_SITE_CERTIFIED'};
}
