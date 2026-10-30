import {materialCatalog,planUpgradeMaterials} from './upgrade-materials.mjs';

/**
 * Manual upgrade basket: multiple separately identified weapon copies
 * with explicit, player-confirmed smithing tracks and upgrade levels.
 * Material stock is deducted ONCE from summed requirements, never per weapon.
 */
const reject=message=>{throw new RangeError(message);};
const TRACKS=['regular','somber'];
const catalog=[...materialCatalog('regular'),...materialCatalog('somber')];
const keys=new Set(catalog.map(row=>row.key));
const safeName=name=>typeof name==='string'&&name.trim().length>0&&
 name.trim().length<=100&&!/[\u0000-\u001f\u007f]/.test(name);

export function planWeaponUpgradeBasket(weapons,inventory={}){
 if(!Array.isArray(weapons)||weapons.length<1||weapons.length>8)
  reject('Add 1 to 8 weapon upgrade plans.');
 if(!inventory||typeof inventory!=='object'||Array.isArray(inventory))
  reject('Owned material inventory must be an object.');
 for(const [key,owned] of Object.entries(inventory)){
  if(!keys.has(key)||!Number.isSafeInteger(owned)||owned<0||owned>999999)
   reject('Unexpected inventory key or quantity: '+String(key).slice(0,50));
 }
 const required=Object.fromEntries(catalog.map(row=>[row.key,0]));
 const rows=weapons.map((weapon,index)=>{
  if(!weapon||typeof weapon!=='object'||Array.isArray(weapon)||
   !safeName(weapon.name)||!TRACKS.includes(weapon.track))
   reject('Weapon '+(index+1)+': enter its label and confirm regular or somber track.');
  // The canonical material calculator validates levels, ordering, and steps.
  const plan=planUpgradeMaterials(weapon.track,weapon.from,weapon.to);
  for(const part of plan.allMaterials)required[part.key]+=part.required;
  return {
   position:index+1,name:weapon.name.trim(),track:plan.track,
   from:plan.from,to:plan.to,upgradeSteps:plan.totalSteps,
   totalStones:plan.totalStones,
   materials:plan.materials.map(({key,label,required:count})=>({
    key,label,required:count
   }))
  };
 });
 const allMaterials=catalog.map(row=>{
  const need=required[row.key],owned=inventory[row.key]??0;
  return {...row,track:row.key.startsWith('regular-')?'regular':'somber',
   required:need,owned,missing:Math.max(0,need-owned),
   leftover:Math.max(0,owned-need)};
 });
 const materials=allMaterials.filter(x=>x.required>0||x.owned>0);
 const totalStones=allMaterials.reduce((sum,x)=>sum+x.required,0);
 const totalMissing=allMaterials.reduce((sum,x)=>sum+x.missing,0);
 return {
  schemaVersion:1,weaponCount:rows.length,weapons:rows,
  materials,allMaterials,totalStones,totalMissing,
  totalSteps:rows.reduce((sum,row)=>sum+row.upgradeSteps,0),
  regularStones:allMaterials.filter(x=>x.track==='regular').reduce((s,x)=>s+x.required,0),
  somberStones:allMaterials.filter(x=>x.track==='somber').reduce((s,x)=>s+x.required,0),
  caution:'Manually selected smithing tracks and levels only. Quantities are summed once before subtracting inventory. No weapon AR, upgrade eligibility, rune costs, game-client parity or drops are inferred.'
 };
}
const csvCell=value=>{
 const raw=String(value??'');
 const guarded=/^[\s\uFEFF]*[=+@-]/.test(raw)?"'"+raw:raw;
 return '"'+guarded.replace(/"/g,'""')+'"';
};
/** Named plans + aggregate inventory, not a pretend per-weapon allocation. */
export function weaponUpgradeBasketCsv(result){
 if(!result||result.schemaVersion!==1||!Array.isArray(result.weapons)||
  !Array.isArray(result.materials))
  reject('Calculate a valid multi-weapon plan before export.');
 const lines=[['section','weapon','track','from','to','steps','stones',
   'material','required','owned','missing','leftover']];
 for(const w of result.weapons)
  lines.push(['weapon',w.name,w.track,w.from,w.to,w.upgradeSteps,w.totalStones,
   '','','','','']);
 for(const m of result.materials)
  lines.push(['aggregate','','','','','','',m.label,m.required,m.owned,m.missing,m.leftover]);
 lines.push(['total',result.weaponCount,'','', '',result.totalSteps,
  result.totalStones,'','', '',result.totalMissing,'']);
 return lines.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
