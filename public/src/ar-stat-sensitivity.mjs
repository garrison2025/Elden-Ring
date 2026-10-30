import {calculateAr,validateArProfile,POWER_STATS,DAMAGE_TYPES} from './weapon-ar.mjs';

/**
 * Local, single-variable AR sensitivity at explicitly supplied upgrade level.
 *
 * Each row increases ONLY the named combat attribute, holding the remaining
 * four attributes and weapon parameters unchanged. No claim of globally
 * optimal level allocation, player level, actual target damage, buffs or
 * live-game correctness is implied.
 */
export function calculateStatInvestmentSensitivity(profile,stats,{
 upgrade=0,twoHanded=false,increments=[1,5,10]
}={}){
 const p=validateArProfile(profile);
 if(!stats||typeof stats!=='object'||Array.isArray(stats)||
   !POWER_STATS.every(s=>Number.isInteger(stats[s])&&stats[s]>=1&&stats[s]<=99))
  throw new RangeError('All five combat stats must be integers between 1 and 99.');
 if(!Number.isInteger(upgrade)||upgrade<0||upgrade>25)
  throw new RangeError('Upgrade must be an integer between 0 and 25.');
 if(typeof twoHanded!=='boolean')
  throw new RangeError('Two-handed setting must be a boolean.');
 if(!Array.isArray(increments)||increments.length<1||increments.length>10||
   new Set(increments).size!==increments.length||
   !increments.every(n=>Number.isInteger(n)&&n>=1&&n<=99))
  throw new RangeError('Increments must be unique positive integers between 1 and 99.');
 const names=Object.keys(p.affinities);
 if(names.length!==1)
  throw new RangeError('Select an exact single-affinity source profile.');
 const affinity=names[0];
 const base=calculateAr(p,stats,{affinity,upgrade,twoHanded});
 const baselineParts=Object.fromEntries(DAMAGE_TYPES.map(d=>[d,
  base.perElement.find(x=>x.element===d)?.displayed??0]));
 const rows=[];
 for(const stat of POWER_STATS){
  for(const requestedPoints of increments){
   const points=Math.min(requestedPoints,99-stats[stat]);
   if(points===0){
    rows.push({stat,requestedPoints,spentPoints:0,statBefore:stats[stat],
     statAfter:stats[stat],status:'stat-at-99-cap',
     total:null,gain:null,gainPerPoint:null,componentGains:null,
     requirementsNewlyMet:[],missingRequirementsAfter:base.missingRequirements,
     reason:'Stat already 99; no additional level can be invested.'});
    continue;
   }
   const changed={...stats,[stat]:stats[stat]+points};
   const result=calculateAr(p,changed,{affinity,upgrade,twoHanded});
   const componentGains=Object.fromEntries(DAMAGE_TYPES.map(d=>[d,
    (result.perElement.find(x=>x.element===d)?.displayed??0)-baselineParts[d]]));
   const gain=result.total-base.total;
   rows.push({stat,requestedPoints,spentPoints:points,statBefore:stats[stat],
    statAfter:changed[stat],status:points<requestedPoints?'capped-at-99':'calculated-unverified',
    total:result.total,gain,gainPerPoint:gain/points,componentGains,
    requirementsNewlyMet:base.missingRequirements.filter(x=>
     !result.missingRequirements.includes(x)),
    missingRequirementsAfter:result.missingRequirements,
    reason:points<requestedPoints?'Requested increment clipped to the 99 stat cap.':
     'One attribute increased with other attributes held constant.'});
  }
 }
 return {
  weaponName:p.label,affinity,upgrade,twoHanded,gripMode:base.gripMode,
  parameterSourceVersion:p.provenance.gameVersion??null,
  inputStats:{...stats},effectiveStrength:base.effectiveStats.str,
  baselineTotal:base.total,baselineComponents:baselineParts,
  missingRequirementsBefore:base.missingRequirements,
  increments:[...increments],rows,
  gameClientVerified:false,publicationApproved:false,
  note:'UNCERTIFIED parameter-derived nominal equipment AR sensitivity. This is not an optimal build, spell/skill scaling, rune-level calculator, or enemy damage prediction.'
 };
}
