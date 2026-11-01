/**
 * Exact source-optimizer slot restrictions, shared by Poise and all 12 other
 * metrics. A locked piece is mandatory (there is no implicit empty option).
 * Fail closed if it is absent from the chosen source-verified metric subset.
 */
export const ARMOR_RESTRICTABLE_SLOTS=Object.freeze(['Head','Chest','Arms','Legs']);
const fail=message=>{throw new RangeError(message)};
export function restrictedArmorGroups(eligibleRows,sourceRows,{
 lockedIds={},disabledSlots=[],excludedIds=[]
}={}){
 if(!Array.isArray(eligibleRows)||!Array.isArray(sourceRows)||
  !lockedIds||typeof lockedIds!=='object'||Array.isArray(lockedIds)||
  !Array.isArray(disabledSlots)||disabledSlots.length>4||
  !Array.isArray(excludedIds))
  fail('Malformed armor slot restrictions.');
 const locks=Object.keys(lockedIds);
 if(locks.length>4||locks.some(slot=>!ARMOR_RESTRICTABLE_SLOTS.includes(slot))||
  disabledSlots.some(slot=>!ARMOR_RESTRICTABLE_SLOTS.includes(slot))||
  new Set(disabledSlots).size!==disabledSlots.length)
  fail('Unsupported or repeated armor slot restriction.');
 const excluded=new Set(excludedIds),disabled=new Set(disabledSlots);
 for(const slot of locks){
  const id=lockedIds[slot];
  if(typeof id!=='string'||!id||id.length>80)
   fail('Locked '+slot+' requires a valid armor ID.');
  if(disabled.has(slot)||excluded.has(id))
   fail('Locked '+slot+' conflicts with an empty-slot or excluded-item rule.');
  const matches=sourceRows.filter(x=>x?.id===id);
  if(matches.length!==1||matches[0].slot!==slot)
   fail('Locked '+slot+' item does not exist in the selected armor source and slot.');
 }
 return Object.fromEntries(ARMOR_RESTRICTABLE_SLOTS.map(slot=>{
  if(disabled.has(slot))return [slot,[null]];
  const candidates=eligibleRows.filter(x=>x.slot===slot)
   .sort((a,b)=>a.id.localeCompare(b.id));
  if(Object.hasOwn(lockedIds,slot)){
   const piece=candidates.find(x=>x.id===lockedIds[slot]);
   if(!piece)fail('Locked '+slot+' item lacks the selected objective / Poise evidence, '+
    'or is not in the currently verified source subset.');
   return [slot,[piece]];
  }
  return [slot,[null,...candidates]];
 }));
}
