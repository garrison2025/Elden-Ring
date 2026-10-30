import {listCompactWeaponNames,convertCompactRegulation} from './regulation-import.mjs';
import {calculateAr,POWER_STATS} from './weapon-ar.mjs';

/** Research-only pure helpers; accepts ONLY local, user-provided JSON objects. */
export function searchLocalWeapons(names,term='',limit=60){
 if(!Array.isArray(names)||!Number.isInteger(limit)||limit<1||limit>100)throw new RangeError('Invalid weapon search options.');
 if(typeof term!=='string'||term.length>100)throw new RangeError('Search text is too long.');
 const needle=term.trim().toLocaleLowerCase('en-US');
 const results=[];let matches=0;
 for(const name of names){
  if(typeof name!=='string')throw new RangeError('Invalid name list.');
  if(name.toLocaleLowerCase('en-US').includes(needle)){
   matches++;
   if(results.length<limit)results.push(name);
  }
 }
 return {matches,names:results};
}
/** Exact base-weapon family lookup from an already imported local compact JSON.
 * A catalog deep link must not silently pick an unrelated substring match.
 * Preserves numeric affinity order (standard, heavy, keen, ...), using the
 * independently imported source's weaponName mapping, not guessed prefixes.
 */
export function findLocalWeaponFamily(regulation,requestedName){
 if(!regulation||!Array.isArray(regulation.weapons)||
    typeof requestedName!=='string'||!requestedName.trim()||requestedName.length>100)
  throw new RangeError('Invalid local weapon family lookup.');
 const normal=value=>String(value).trim().replace(/[\u2018\u2019]/g,"'").toLocaleLowerCase('en-US');
 const target=normal(requestedName);
 const valid=regulation.weapons.filter(x=>x&&typeof x.name==='string'&&x.name.length<=120&&
  typeof (x.weaponName??x.name)==='string');
 const match=valid.find(x=>normal(x.weaponName??x.name)===target)||
  valid.find(x=>normal(x.name)===target);
 if(!match)return {found:false,family:'',matches:0,names:[],defaultName:''};
 const familyName=match.weaponName??match.name;
 const variants=valid.filter(x=>normal(x.weaponName??x.name)===normal(familyName))
  .sort((a,b)=>{
   const aa=Number.isInteger(a.affinityId)?a.affinityId:100;
   const bb=Number.isInteger(b.affinityId)?b.affinityId:100;
   return aa-bb||a.name.localeCompare(b.name);
  });
 const names=[...new Set(variants.map(x=>x.name))];
 if(names.length>100)throw new RangeError('Weapon family variant limit exceeded.');
 const chosen=variants.find(x=>normal(x.name)===target)?.name||
  variants.find(x=>x.affinityId===0||x.affinityId===-1)?.name||
  names[0];
 return {found:true,family:familyName,matches:names.length,names,defaultName:chosen};
}

export function describeLocalWeapon(regulation,weaponName,gameVersion,sourceReference){
 const profile=convertCompactRegulation(regulation,{weaponName,gameVersion,sourceReference});
 const affinity='SOURCE AFFINITY';
 return {
  profile,
  description:{
   name:profile.label,
   gripMode:profile.gripMode,
   provenance:profile.provenance,
   requirements:profile.requirements,
   upgradeLevels:profile.affinities[affinity].upgrades.map(u=>u.level),
   damageTypes:Object.entries(profile.affinities[affinity].baseDamage).filter(([,v])=>v>0).map(([k])=>k),
   status:'UNVERIFIED — not independently compared against current in-game equipment screens'
  }
 };
}
export function compareLocalGrips(profile,stats,upgrade){
 if(!stats||typeof stats!=='object')throw new RangeError('Player stats are required.');
 for(const key of POWER_STATS){
  if(!Number.isInteger(stats[key])||stats[key]<1||stats[key]>99)throw new RangeError('Invalid '+key+' attribute.');
 }
 const oneHand=calculateAr(profile,stats,{affinity:'SOURCE AFFINITY',upgrade,twoHanded:false});
 const twoHand=calculateAr(profile,stats,{affinity:'SOURCE AFFINITY',upgrade,twoHanded:true});
 return {
  oneHand,twoHand,
  difference:twoHand.total-oneHand.total,
  note:'UNCERTIFIED RESEARCH RESULTS. Local parameter import is not independently verified game AR.'
 };
}
export {listCompactWeaponNames};
