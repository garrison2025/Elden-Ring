import {calculateAr,validateArProfile,POWER_STATS,DAMAGE_TYPES} from './weapon-ar.mjs';

/**
 * Every explicitly supplied reinforcement step, including somber +0–+10 and
 * normal +0–+25. Never infer a missing step or game-only skill/status damage.
 */
export function calculateSourceUpgradeProgression(profile,stats){
 const p=validateArProfile(profile);
 if(!stats||typeof stats!=='object'||Array.isArray(stats)||
    !POWER_STATS.every(s=>Number.isInteger(stats[s])&&stats[s]>=1&&stats[s]<=99))
  throw new RangeError('Five combat stats from 1 to 99 are required.');
 const affinities=Object.keys(p.affinities);
 if(affinities.length!==1)
  throw new RangeError('Select exactly one imported weapon affinity.');
 const affinity=affinities[0],upgrades=p.affinities[affinity].upgrades;
 const byLevel=new Map(upgrades.map(u=>[u.level,u]));
 const highest=Math.max(...byLevel.keys());
 const rows=[];
 for(let level=0;level<=highest;level++){
  if(!byLevel.has(level)){
   rows.push({level,status:'upgrade-unavailable',oneHand:null,twoHand:null,
    delta:null,oneComponents:null,twoComponents:null,effectiveStrength:null,
    missingRequirements:[],note:'Source has no parameters for this level; no interpolation.'});
   continue;
  }
  const one=calculateAr(p,stats,{affinity,upgrade:level,twoHanded:false});
  const two=calculateAr(p,stats,{affinity,upgrade:level,twoHanded:true});
  rows.push({level,status:'calculated-unverified',oneHand:one.total,twoHand:two.total,
   delta:two.total-one.total,
   oneComponents:Object.fromEntries(DAMAGE_TYPES.map(d=>[d,
    one.perElement.find(e=>e.element===d)?.displayed??0])),
   twoComponents:Object.fromEntries(DAMAGE_TYPES.map(d=>[d,
    two.perElement.find(e=>e.element===d)?.displayed??0])),
   effectiveStrength:{one:one.effectiveStats.str,two:two.effectiveStats.str},
   missingRequirements:[...new Set([...one.missingRequirements,...two.missingRequirements])],
   note:'Nominal equipment AR only; skill, status, ammo, motion and enemy damage excluded.'});
 }
 return {weaponName:p.label,gripMode:p.gripMode??'standard',
  sourceVersion:p.provenance.gameVersion??null,reinforcementSystem:
   highest===10&&upgrades.length===11?'11-step-source-table':
   highest===25&&upgrades.length===26?'26-step-source-table':'partial-or-other-source-table',
  suppliedLevels:upgrades.length,highestLevel:highest,rows,
  gameClientVerified:false,
  note:'UNCERTIFIED source-derived nominal AR. 11-step rows do not verify game weapon-skill scaling or identify item rarity.'};
}
