import {calculateAr,POWER_STATS,DAMAGE_TYPES,validateArProfile} from './weapon-ar.mjs';

/**
 * Same-stat, optionally different-upgrade comparison of two locally imported,
 * UNVERIFIED profiles. Arithmetic AR delta is NOT final PvE/PvP damage, which
 * depends on defense, absorption, attack motion, buffs and split-damage effects.
 */
export function compareWeaponPair(left,right,stats,{leftUpgrade,rightUpgrade,twoHanded=false}={}){
 validateArProfile(left);validateArProfile(right);
 if(left.provenance.gameVersion!==right.provenance.gameVersion)
  throw new RangeError('Cannot compare weapon profiles from different declared game versions.');
 if(typeof twoHanded!=='boolean')throw new RangeError('Grip setting must be boolean.');
 if(!stats||typeof stats!=='object')throw new RangeError('Player stats are required.');
 for(const stat of POWER_STATS){
  if(!Number.isInteger(stats[stat])||stats[stat]<1||stats[stat]>99)
   throw new RangeError('Invalid player '+stat+' attribute.');
 }
 const a=calculateAr(left,stats,{affinity:'SOURCE AFFINITY',upgrade:leftUpgrade,twoHanded});
 const b=calculateAr(right,stats,{affinity:'SOURCE AFFINITY',upgrade:rightUpgrade,twoHanded});
 const components=DAMAGE_TYPES.map(type=>{
  const first=a.perElement.find(x=>x.element===type)?.displayed??0;
  const second=b.perElement.find(x=>x.element===type)?.displayed??0;
  return {type,left:first,right:second,delta:second-first};
 }).filter(x=>x.left>0||x.right>0);
 return {
  left:a,right:b,components,delta:b.total-a.total,
  grip:twoHanded?'two-handed':'one-handed',
  sharedVersion:left.provenance.gameVersion||'not supplied',
  note:'UNVERIFIED NOMINAL ATTACK RATING ONLY: higher total AR is not necessarily higher actual damage, especially for split elemental damage. This is NOT in-game certified.'
 };
}
