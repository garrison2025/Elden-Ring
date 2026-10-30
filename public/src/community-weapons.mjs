import {compareWeaponRequirements} from './requirements.mjs';

export const DAMAGE_LABELS=Object.freeze(['Physical','Magic','Fire','Lightning','Holy']);
export const ATTRIBUTE_LABELS=Object.freeze(['STR','DEX','INT','FAI','ARC']);
const fail=m=>{throw new RangeError(m);};

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
  if(!Number.isFinite(w.weight)||w.weight<0||w.weight>200||
     !Number.isInteger(w.critical)||w.critical<0||w.critical>300)
   fail('Invalid weight or critical at row '+i);
  if(!Array.isArray(w.attack)||w.attack.length!==5||
    w.attack.some(v=>!Number.isInteger(v)||v<0||v>5000))fail('Invalid base damage '+i);
  if(!Array.isArray(w.requirements)||w.requirements.length!==5||
    w.requirements.some(v=>!Number.isInteger(v)||v<0||v>99))fail('Invalid requirements '+i);
  if(!Array.isArray(w.scaling)||w.scaling.length!==5||
    w.scaling.some(v=>typeof v!=='string'||!/^(?:S|A|B|C|D|E|-)$/i.test(v)))
   fail('Invalid scaling-letter metadata '+i);
  if(w.flags!==undefined&&(!Array.isArray(w.flags)||w.flags.some(x=>typeof x!=='string'||x.length>65)))
   fail('Invalid quality flags '+i);
 }
 return catalog;
}
export function catalogCategories(weapons){
 return [...new Set(weapons.map(x=>x.category))].sort((a,b)=>a.localeCompare(b));
}
export function searchCatalog(weapons,{term='',category='all',sort='name',limit=50,offset=0}={}){
 if(!Array.isArray(weapons)||typeof term!=='string'||term.length>100||
    typeof category!=='string'||category.length>100||
    !['name','weight','base'].includes(sort)||!Number.isInteger(limit)||limit<1||limit>100||
    !Number.isInteger(offset)||offset<0)fail('Invalid catalog search parameters.');
 const q=term.trim().toLocaleLowerCase('en-US');
 const matches=weapons.filter(w=>
    (category==='all'||w.category===category)&&
    (!q||w.name.toLocaleLowerCase('en-US').includes(q)||
      w.category.toLocaleLowerCase('en-US').includes(q)));
 matches.sort((a,b)=>{
  if(sort==='weight')return a.weight-b.weight||a.name.localeCompare(b.name);
  if(sort==='base')return b.attack.reduce((n,v)=>n+v,0)-a.attack.reduce((n,v)=>n+v,0)||a.name.localeCompare(b.name);
  return a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
 });
 return {total:matches.length,results:matches.slice(offset,offset+limit)};
}
export function weaponRequirementComparison(weapon,stats){
 if(!weapon||!Array.isArray(weapon.requirements))fail('Weapon selection is missing.');
 return compareWeaponRequirements(stats,weapon.requirements);
}
export function baseDamageParts(weapon){
 return DAMAGE_LABELS.map((name,i)=>({name,amount:weapon.attack[i]})).filter(x=>x.amount>0);
}
export function cautionForWeapon(w){
 const flags=new Set(w.flags??[]);
 const warnings=[];
 if(flags.has('duplicate-name-in-source'))warnings.push('Community source contains duplicate entries with this name; confirm the correct item.');
 if(flags.has('suspicious-critical-in-source'))warnings.push('Critical value in the upstream source is suspicious. Treat it as unverified.');
 if(flags.has('malformed-physical-field-in-source'))warnings.push('Upstream physical attack field is malformed. Do not rely on this number.');
 if(flags.has('zero-physical-mixed-entry-check'))warnings.push('Physical attack needs independent cross-check.');
 if(flags.has('selected-values-cross-checked'))warnings.push('Selected base figures independently cross-checked; full patch/AR still unverified.');
 return warnings;
}
export function requirementsUrl(weapon,player,base='../'){
 const url=new URL(base+'weapon-requirements/', 'https://buildlab.example/');
 url.searchParams.set('player',player.join(','));
 url.searchParams.set('req',weapon.requirements.join(','));
 return url.pathname+url.search;
}
