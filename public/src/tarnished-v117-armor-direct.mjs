/** Directly observed Tarnished.dev v1.17 ONLY.
 * Four separate actual Build Planner armor selections, at Wretch base stats
 * and zero buffs. This is not a blanket certification of 568 armor records.
 * CI requires the actual public browser values to match twice.
 */
export const TARNISHED_V117_ARMOR_FOUR=Object.freeze([
 Object.freeze({name:'All-knowing Helm',slot:'Head',weight:4.6,poise:7}),
 Object.freeze({name:'All-knowing Armor',slot:'Chest',weight:10.7,poise:22}),
 Object.freeze({name:'All-knowing Gauntlets',slot:'Arms',weight:3.5,poise:5}),
 Object.freeze({name:'All-knowing Greaves',slot:'Legs',weight:6.6,poise:13})
]);
const key=(s,slot)=>slot+'|'+s.toLowerCase().replace(/[^a-z0-9]/g,'');
const evidence=new Map(TARNISHED_V117_ARMOR_FOUR.map(x=>[key(x.name,x.slot),x]));
/** A field-by-field override, not new fake community data:
 * only weight and Poise are public-site verified. Other 12 sourced armor
 * metrics stay unchanged and explicitly unverified against Tarnished.dev.
 */
export function applyTarnishedV117DirectArmorFields(rows){
 if(!Array.isArray(rows))throw new TypeError('Armor rows must be a source array.');
 const encountered=new Set();let corrected=0;
 const updated=rows.map(item=>{
  const id=key(item.name,item.slot),actual=evidence.get(id);
  if(!actual)return item;
  if(encountered.has(id))throw new RangeError('Ambiguous armor identity in public site overlay.');
  encountered.add(id);corrected++;
  return {...item,weight:actual.weight,poise:actual.poise,
   metrics:{...item.metrics,poise:actual.poise},
   siteDirectFields:{
    weight:'Tarnished.dev public v1.17, directly read twice',
    poise:'Tarnished.dev public v1.17, directly read twice'
   }};
 });
 if(corrected!==0&&corrected!==TARNISHED_V117_ARMOR_FOUR.length)
  throw new RangeError('Incomplete exact armor source matching; no partial parity override.');
 return {armors:updated,directlyCorrectedArmorCount:corrected,
  correctedFields:corrected*2,
  otherArmorFieldsNumericallyVerified:false};
}
