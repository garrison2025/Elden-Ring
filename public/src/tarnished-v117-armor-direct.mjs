import {TARNISHED_V117_WIDE_ARMOR_GOLDENS} from './tarnished-v117-armor-wide.mjs';
/** Actual user-approved comparator: Tarnished.dev public v1.17.
 * 543 unique candidate items were selected in the real site twice,
 * under empty Wretch baseline. Only Weight and Poise are proven.
 * Existing original four remain independently provable even when the
 * client passes fictional test IDs rather than pinned-source IDs.
 */
export const TARNISHED_V117_ARMOR_FOUR=Object.freeze([
 Object.freeze({name:'All-knowing Helm',slot:'Head',weight:4.6,poise:7}),
 Object.freeze({name:'All-knowing Armor',slot:'Chest',weight:10.7,poise:22}),
 Object.freeze({name:'All-knowing Gauntlets',slot:'Arms',weight:3.5,poise:5}),
 Object.freeze({name:'All-knowing Greaves',slot:'Legs',weight:6.6,poise:13})
]);
const key=(s,slot)=>slot+'|'+s.toLowerCase().replace(/[^a-z0-9]/g,'');
const originalFour=new Map(TARNISHED_V117_ARMOR_FOUR.map(x=>[key(x.name,x.slot),x]));
const wide=new Map(TARNISHED_V117_WIDE_ARMOR_GOLDENS.map(x=>[x.id,x]));
if(TARNISHED_V117_WIDE_ARMOR_GOLDENS.length!==543||wide.size!==543)
 throw Error('Tarnished.dev armor double-read fixture incomplete.');
for(const ref of TARNISHED_V117_ARMOR_FOUR){
 const match=TARNISHED_V117_WIDE_ARMOR_GOLDENS.filter(x=>key(x.name,x.slot)===key(ref.name,ref.slot));
 if(match.length!==1||match[0].weight!==ref.weight||match[0].poise!==ref.poise)
  throw Error('Original four direct armor reads contradict bulk-site observations.');
}
export function applyTarnishedV117DirectArmorFields(rows){
 if(!Array.isArray(rows))throw new TypeError('Armor rows must be a source array.');
 const seenIds=new Set(),oldFourMatched=new Set();
 let corrected=0,wideCorrected=0;
 const updated=rows.map(item=>{
  if(seenIds.has(item.id))throw new RangeError('Duplicate armor ID in source.');
  seenIds.add(item.id);
  const legacy=originalFour.get(key(item.name,item.slot));
  if(legacy)oldFourMatched.add(key(item.name,item.slot));
  const candidate=wide.get(item.id);
  if(candidate&&(candidate.name!==item.name||candidate.slot!==item.slot))
   throw new RangeError('Direct-site armor fixture identity changed: '+item.id);
  if(candidate&&legacy&&(candidate.weight!==legacy.weight||candidate.poise!==legacy.poise))
   throw Error('Conflicting real-site observations for '+item.name);
  const actual=candidate??legacy;
  if(!actual)return item;
  corrected++;
  if(candidate)wideCorrected++;
  return {...item,weight:actual.weight,poise:actual.poise,
   metrics:{...item.metrics,poise:actual.poise},
   siteDirectFields:{
    weight:'Tarnished.dev public v1.17, directly read twice',
    poise:'Tarnished.dev public v1.17, directly read twice'
   }};
 });
 if(oldFourMatched.size>0&&oldFourMatched.size!==4)
  throw new RangeError('Incomplete original four armor reference identities.');
 return {armors:updated,directlyCorrectedArmorCount:corrected,
  wideDirectEvidenceCount:wideCorrected,correctedFields:corrected*2,
  otherArmorFieldsNumericallyVerified:false,
  siteUnsupportedCandidateCount:25};
}
