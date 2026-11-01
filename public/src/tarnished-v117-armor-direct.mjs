import {TARNISHED_V117_ARMOR_RECOVERED} from './tarnished-v117-armor-recovered.mjs';
import {TARNISHED_V117_ARMOR_STABLE_METRICS} from './tarnished-v117-armor-12-fields.mjs';
import {TARNISHED_V117_WIDE_ARMOR_GOLDENS} from './tarnished-v117-armor-wide.mjs';
/** Actual user-approved comparator: Tarnished.dev public v1.17.
 * 543 initial unique candidates plus six site-verified distinct aliases were
 * selected twice under empty Wretch baseline. Weight and Poise on 549 items,
 * plus 12 extra metrics on 514 stat-stable items, are independently observed.
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
const stableFields=new Map(TARNISHED_V117_ARMOR_STABLE_METRICS.map(x=>[x.id,x]));
const recoveredById=new Map(TARNISHED_V117_ARMOR_RECOVERED.map(x=>[x.id,x]));
if(recoveredById.size!==6||TARNISHED_V117_ARMOR_RECOVERED.length!==6)
 throw Error('Incomplete six direct-site recovered armor aliases.');
for(const e of TARNISHED_V117_ARMOR_RECOVERED){
 if(wide.has(e.id)||stableFields.has(e.id)||e.sourceSlot!==e.siteSlot||
  !e.twoIndependentSiteReads)
  throw Error('Recovered armor would shadow other verified site evidence or has unproved slot.');
}
if(TARNISHED_V117_ARMOR_STABLE_METRICS.length!==514||stableFields.size!==514)
 throw Error('Incomplete 514 item Tarnished.dev 12-metric double-read evidence.');
for(const x of TARNISHED_V117_ARMOR_STABLE_METRICS){
 const measured=wide.get(x.id);
 if(!measured||measured.name!==x.name||measured.slot!==x.slot)
  throw Error('Armor metric goldens do not map to the existing double-read weight/Poise evidence.');
 if(Object.keys(x.metrics).length!==12)
  throw Error('Incomplete twelve armor metrics for '+x.name);
}
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
 let corrected=0,wideCorrected=0,stableCorrected=0,recoveredCorrected=0;
 const updated=rows.map(item=>{
  if(seenIds.has(item.id))throw new RangeError('Ambiguous duplicate armor ID in source.');
  seenIds.add(item.id);
  const legacy=originalFour.get(key(item.name,item.slot));
  if(legacy)oldFourMatched.add(key(item.name,item.slot));
  const candidate=wide.get(item.id);
  if(candidate&&(candidate.name!==item.name||candidate.slot!==item.slot))
   throw new RangeError('Direct-site armor fixture identity changed: '+item.id);
  if(candidate&&legacy&&(candidate.weight!==legacy.weight||candidate.poise!==legacy.poise))
   throw Error('Conflicting real-site observations for '+item.name);
  const recovered=recoveredById.get(item.id);
  if(recovered&&(recovered.sourceName!==item.name||recovered.sourceSlot!==item.slot))
   throw new RangeError('Recovered Tarnished.dev armor alias identity differs from original source: '+item.id);
  const actual=candidate??legacy??recovered;
  if(!actual)return item;
  const stable=stableFields.get(item.id);
  if(stable&&(stable.name!==item.name||stable.slot!==item.slot))
   throw new RangeError('Ambiguous Tarnished.dev derived-metric identity '+item.id);
  corrected++;
  if(candidate)wideCorrected++;
  if(recovered)recoveredCorrected++;
  if(stable)stableCorrected++;
  const metricProof=stable?Object.fromEntries(Object.keys(stable.metrics).map(metric=>[
   metric,'Tarnished.dev v1.17, two real browser reads, Wretch 10 baseline, final character stats unchanged'
  ])):{};
  return {...item,name:recovered?.siteName??item.name,
   slot:recovered?.siteSlot??item.slot,weight:actual.weight,poise:actual.poise,
   metrics:{...item.metrics,...(stable?.metrics??{}),poise:actual.poise},
   siteDirectFields:{
    weight:'Tarnished.dev public v1.17, directly read twice',
    poise:'Tarnished.dev public v1.17, directly read twice',
    ...metricProof
   }};
 });
 if(oldFourMatched.size>0&&oldFourMatched.size!==4)
  throw new RangeError('Incomplete original four armor reference identities.');
 return {armors:updated,directlyCorrectedArmorCount:corrected,
  wideDirectEvidenceCount:wideCorrected,
  recoveredDistinctArmorCount:recoveredCorrected,
  siteTwelveMetricArmorCount:stableCorrected,
  siteAdditionalMetricFields:stableCorrected*12,
  correctedFields:corrected*2+stableCorrected*12,
  otherArmorFieldsNumericallyVerified:false,
  anySiteDerivedDefenseEvidence:stableCorrected>0,
  siteUnsupportedCandidateCount:25-recoveredCorrected};
}
