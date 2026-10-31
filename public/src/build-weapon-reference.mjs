import {weaponRequirementComparison,hasDisputedRequirements,hasDisputedAttack,hasDisputedWeight} from './community-weapons.mjs';

const fail=message=>{throw new RangeError(message);};

/** Bounded URL/local-storage weapon identity: never trust a stored display name. */
export function parseBuildWeaponId(value){
 if(value===null||value===undefined||value==='')return null;
 if(typeof value!=='string'||value.length>100||!/^[a-zA-Z0-9-]+$/.test(value))
  fail('Invalid weapon ID in build state.');
 return value;
}
export function parseContentFlag(value){
 if(value===null||value===undefined||value===''||value==='0')return false;
 if(value==='1')return true;
 fail('Invalid game-content setting.');
}
export function buildWeaponOptions(weapons,term='',selectedId=null,limit=35,allowSote=false){
 if(!Array.isArray(weapons)||typeof term!=='string'||term.length>100||
    !Number.isInteger(limit)||limit<1||limit>100||typeof allowSote!=='boolean')
  fail('Invalid weapon search.');
 const needle=term.trim().toLowerCase();
 const permitted=w=>allowSote||w.expansion!=='Shadow of the Erdtree';
 const matches=weapons.filter(w=>permitted(w)&&
  (!needle||w.name.toLowerCase().includes(needle)||w.category.toLowerCase().includes(needle)))
  .sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
 const result=matches.slice(0,limit);
 const selected=weapons.find(w=>w.id===selectedId&&permitted(w));
 if(selected&&!result.some(w=>w.id===selected.id))result.unshift(selected);
 return {matching:matches.length,options:result};
}
/** Requirements and individual weapon weight only — never total equip load or AR. */
export function inspectBuildWeapon(weapons,rawId,stats8,{allowSote=false}={}){
 if(!Array.isArray(weapons)||typeof allowSote!=='boolean')fail('Invalid build weapon catalog.');
 const id=parseBuildWeaponId(rawId);
 if(id===null)return null;
 const weapon=weapons.find(w=>w.id===id);
 if(!weapon)fail('Selected weapon no longer exists in this catalog snapshot.');
 if(weapon.expansion==='Shadow of the Erdtree'&&!allowSote)
  fail('Enable Shadow of the Erdtree weapon references to use this DLC entry.');
 if(!Array.isArray(stats8)||stats8.length!==8||
    stats8.some(v=>!Number.isInteger(v)||v<1||v>99))
  fail('A valid eight-attribute build is required.');
 const stats5=stats8.slice(3);
 const requirementsDisputed=hasDisputedRequirements(weapon);
 const attackDisputed=hasDisputedAttack(weapon);
 const hasRequirements=Array.isArray(weapon.requirements)&&!requirementsDisputed;
 const comparison=hasRequirements?weaponRequirementComparison(weapon,stats5):null;
 return {
  id:weapon.id,name:weapon.name,category:weapon.category,
  expansion:weapon.expansion??'Base game',
  referenceTier:weapon.dataCoverage??'base-community',
  weight:hasDisputedWeight(weapon)?null:weapon.weight??null,
  weightDisputed:hasDisputedWeight(weapon),
  reportedWeight:weapon.weight??null,
  requirements:requirementsDisputed?null:weapon.requirements??null,
  reportedRequirements:weapon.requirements??null,
  requirementsDisputed,attackDisputed,
  attackAtZero:attackDisputed?null:weapon.attack??null,
  reportedAttackAtZero:weapon.attack??null,
  oneHanded:comparison?.oneHanded.canWield??null,
  twoHanded:comparison?.twoHanded.canWield??null,
  applyTwoHandBonus:comparison?.applyTwoHandBonus??null,
  missingOneHanded:comparison?.oneHanded.totalMissing??null,
  sourceUrl:weapon.checkedWith??weapon.sourceUrl??null,
  note:'Community weapon reference, NOT current-patch validated. '+
   (requirementsDisputed?'Wield requirements DISPUTED; no met/not-met claim. ':'')+
   (attackDisputed?'Base attack DISPUTED; no trusted attack amount. ':'')+
   (hasDisputedWeight(weapon)?'Weapon weight DISPUTED; no trusted load contribution. ':'')+
   'Weight is for this single weapon only, not full equipment. +0 attack is NOT AR. No scaling, affinity, reinforcement or damage is calculated.'
 };
}
