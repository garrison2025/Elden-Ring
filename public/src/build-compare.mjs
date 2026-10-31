import {CLASSES,STATS,validateStats,buildLevel,runeRange} from './core.mjs';
import {parseBuildWeaponId,inspectBuildWeapon} from './build-weapon-reference.mjs';

/**
 * Browser-only A/B comparison between two explicitly chosen character Builds.
 * Rune budgets are each calculated from that Build's OWN starting origin,
 * not the cost of moving from A to B or the cost of a respec.
 * Weapon details are community source references, NEVER actual AR or damage.
 */
const fail=message=>{throw new RangeError(message);};
export function normalizeBuildComparisonSnapshot(state){
 if(!state||typeof state!=='object'||Array.isArray(state))
  fail('A comparison snapshot must contain a valid Build.');
 const origin=CLASSES.find(c=>c.name===state.origin);
 if(!origin)fail('The compared Build has an unknown starting class.');
 if(typeof state.ownsTarnishedPack!=='boolean'||typeof state.ownsSote!=='boolean')
  fail('The compared Build must declare its content settings.');
 if(origin.dlc&&!state.ownsTarnishedPack)
  fail('This starting class requires Tarnished Pack access.');
 // No coercion: an incomplete/invalid UI field cannot be pinned.
 if(!Array.isArray(state.stats)||state.stats.length!==8||
  state.stats.some(x=>!Number.isInteger(x)))
  fail('Eight confirmed integer attributes are required.');
 const stats=validateStats(state.stats,origin);
 const weaponId=parseBuildWeaponId(state.weaponId);
 return {
  origin:origin.name,stats:[...stats],weaponId,
  ownsTarnishedPack:state.ownsTarnishedPack,ownsSote:state.ownsSote
 };
}
function describe(state,catalog){
 const cls=CLASSES.find(c=>c.name===state.origin);
 const level=buildLevel(cls,state.stats);
 const runeBudget=runeRange(cls.level,level);
 let weapon=null;
 if(state.weaponId!==null){
  if(!Array.isArray(catalog))fail('Local weapon reference catalog is unavailable.');
  const model=inspectBuildWeapon(catalog,state.weaponId,state.stats,{
   allowSote:state.ownsSote
  });
  weapon={
   id:model.id,name:model.name,category:model.category,
   weight:model.weight,oneHanded:model.oneHanded,twoHanded:model.twoHanded,
   missingOneHanded:model.missingOneHanded,sourceTier:model.referenceTier
  };
 }
 return {
  origin:cls.name,originLevel:cls.level,level,
  levelUpPoints:level-cls.level,runeBudget,
  stats:[...state.stats],weapon,
  ownsSote:state.ownsSote,ownsTarnishedPack:state.ownsTarnishedPack
 };
}
export function compareBuildSnapshots(baseline,current,{weapons=null}={}){
 const A=describe(normalizeBuildComparisonSnapshot(baseline),weapons);
 const B=describe(normalizeBuildComparisonSnapshot(current),weapons);
 const statRows=STATS.map((label,i)=>({
  label,baseline:A.stats[i],current:B.stats[i],delta:B.stats[i]-A.stats[i]
 }));
 return {
  baseline:A,current:B,statRows,
  levelDelta:B.level-A.level,
  allocatedDelta:B.levelUpPoints-A.levelUpPoints,
  runeBudgetDelta:B.runeBudget-A.runeBudget,
  changedStats:statRows.filter(row=>row.delta!==0).length,
  sameOrigin:A.origin===B.origin,
  sameWeapon:A.weapon?.id===B.weapon?.id,
  note:'Character levels and level-up rune budgets are independently calculated from each starting origin. The difference is NOT a respec cost, weapon AR, PvE/PvP damage or total equipment load. Weapon requirements/weight are community references, not current-game validated.'
 };
}
