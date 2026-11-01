/** Independent exact optimizer over explicitly supplied item records.
 * Maximizes summed source-reported Poise under a strictly-lower-than equipped
 * weight threshold; does NOT optimize negation, fashion, buffs, or real
 * gameplay without independently validated source inputs.
 */
import {loadTier} from './core.mjs';
import {restrictedArmorGroups} from './armor-slot-restrictions.mjs';
export const ARMOR_OPT_SLOTS=Object.freeze(['Head','Chest','Arms','Legs']);
const fail=msg=>{throw new RangeError(msg)};
const decimal=(v,label,lower,upper)=>{
 if((typeof v!=='number'&&typeof v!=='string')||
  (typeof v==='string'&&!/^(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(v.trim())))
  fail(label+' must be a non-negative decimal with up to 3 places.');
 const n=Number(v);
 if(!Number.isFinite(n)||n<lower||n>upper)fail(label+' is out of range.');
 return n;
};
const weightUnits=x=>Math.round(x*1000);
const key=rows=>rows.map(x=>x?.id??'').join('|');
export function optimizePinnedArmorPoise(rows,{
 maxEquipLoad,reservedWeight=0,tier='medium',minPoise=0,excludedIds=[],
 lockedIds={},disabledSlots=[]
}={}){
 if(!Array.isArray(rows)||rows.length<1||rows.length>2000)
  fail('A valid loaded public armor source is required.');
 const max=decimal(maxEquipLoad,'Maximum equip load',0.001,999);
 const reserved=decimal(reservedWeight,'Weight of equipped weapons and other gear',0,999);
 if(!['light','medium','heavy'].includes(tier))
  fail('Choose a supported roll tier.');
 if(!Number.isInteger(minPoise)||minPoise<0||minPoise>500)
  fail('Minimum source-reported Poise must be 0–500.');
 if(!Array.isArray(excludedIds)||excludedIds.length>2000||
  excludedIds.some(id=>typeof id!=='string'||id.length>80))
  fail('Invalid excluded armor IDs.');
 const excluded=new Set(excludedIds),seen=new Set();
 const groups=Object.fromEntries(ARMOR_OPT_SLOTS.map(slot=>[slot,[]]));
 let unknownPoise=0,excludedCount=0;
 for(const item of rows){
  if(!item||typeof item.id!=='string'||seen.has(item.id)||
   typeof item.name!=='string'||!ARMOR_OPT_SLOTS.includes(item.slot)||
   !Number.isFinite(item.weight)||item.weight<0||item.weight>100||
   Math.abs(weightUnits(item.weight)/1000-item.weight)>1e-9)
   fail('Invalid or duplicate armor reference item.');
  seen.add(item.id);
  if(excluded.has(item.id)){excludedCount++;continue;}
  if(!Number.isInteger(item.poise)||item.poise<0||item.poise>800){
   unknownPoise++;continue;
  }
  groups[item.slot].push(item);
 }
 const slotGroups=restrictedArmorGroups(
  Object.values(groups).flat(),rows,{lockedIds,disabledSlots,excludedIds});
 const factor=tier==='light'?0.3:tier==='medium'?0.7:1;
 const maxArmorUnits=Math.ceil((max*factor-reserved)*1000-1e-9)-1;
 if(maxArmorUnits<0)return {
  status:'no-solution',reason:'Reserved gear already reaches the requested strict tier threshold.',
  missingPoiseExcluded:unknownPoise,explicitExcluded:excludedCount,
  evaluatedRows:rows.length,combination:null,sourceVerified:false
 };
 let states=new Map([[0,{poise:0,pieces:[]}]]);
 const stages=[];
 for(const slot of ARMOR_OPT_SLOTS){
  const options=slotGroups[slot];
  const next=new Map();
  for(const [used,state] of states){
   for(const item of options){
    const candidateWeight=used+(item?weightUnits(item.weight):0);
    if(candidateWeight>maxArmorUnits)continue;
    const pieces=[...state.pieces,item];
    const poise=state.poise+(item?.poise??0);
    const current=next.get(candidateWeight);
    if(!current||poise>current.poise||
     (poise===current.poise&&key(pieces)<key(current.pieces)))
     next.set(candidateWeight,{poise,pieces});
   }
  }
  states=next;
  stages.push({slot,candidates:options.length,stateCount:states.size});
 }
 let best=null;
 for(const [armorUnits,state] of states){
  if(state.poise<minPoise)continue;
  if(!best||state.poise>best.poise||
   state.poise===best.poise&&armorUnits<best.armorUnits||
   state.poise===best.poise&&armorUnits===best.armorUnits&&
   key(state.pieces)<key(best.pieces))
   best={...state,armorUnits};
 }
 if(!best)return {
  status:'no-solution',
  reason:'No combination meets the minimum Poise and strict weight limit with the available source fields.',
  missingPoiseExcluded:unknownPoise,explicitExcluded:excludedCount,
  evaluatedRows:rows.length,stages,combination:null,sourceVerified:false
 };
 const armorWeight=best.armorUnits/1000;
 const total=armorWeight+reserved;
 const roll=loadTier(total,max);
 // Defend against edge-case floating point threshold rounding.
 if(roll.tier!==(tier==='light'?'Light':tier==='medium'?
  (roll.tier==='Light'?'Light':'Medium'):
  (roll.tier==='Light'?'Light':roll.tier==='Medium'?'Medium':'Heavy')))
  fail('Roll-tier assertion failed; do not publish the source optimization.');
 return {
  status:'optimized-source-reference',sourceVerified:false,
  objective:'maximum additive source-reported poise below selected strict equip threshold',
  armorWeight,totalWeight:total,maxEquipLoad:max,rollTier:roll.tier,
  targetTier:tier,poise:best.poise,
  combination:best.pieces.map((item,i)=>item?{
   id:item.id,name:item.name,slot:ARMOR_OPT_SLOTS[i],
   weight:item.weight,poise:item.poise
  }:{id:null,name:'Empty slot',slot:ARMOR_OPT_SLOTS[i],weight:0,poise:0}),
  missingPoiseExcluded:unknownPoise,explicitExcluded:excludedCount,
  evaluatedRows:rows.length,stages,
  caveat:'Exact optimum for the supplied items and additive source Poise; NOT patch-certified, does not include passives/negation/buffs/Great Runes.'
 };
}
