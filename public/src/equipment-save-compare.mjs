import {
 LOADOUT_WEAPON_SLOTS,LOADOUT_MANUAL_SLOTS,planEquipmentLoadout
} from './equipment-loadout.mjs';

export const EQUIPMENT_SAVE_KEY='buildlab:equipment-plan:v1';
export const EQUIPMENT_SAVE_VERSION=1;
export const EQUIPMENT_SAVE_MAX_BYTES=7000;
const fail=msg=>{throw new RangeError(msg);};

function normalize(raw,weapons,{unconfirm=false}={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||
  !raw.weaponSlots||typeof raw.weaponSlots!=='object'||Array.isArray(raw.weaponSlots)||
  !raw.manualSlots||typeof raw.manualSlots!=='object'||Array.isArray(raw.manualSlots)||
  typeof raw.confirmed!=='boolean')
  fail('Equipment snapshot has an invalid structure.');
 if(typeof raw.maxLoad!=='string'&&typeof raw.maxLoad!=='number')
  fail('Saved in-game maximum load must be numeric text.');
 const weaponSlots={};
 for(const slot of LOADOUT_WEAPON_SLOTS){
  if(!Object.hasOwn(raw.weaponSlots,slot.id))
   fail('Equipment snapshot is missing '+slot.label+'.');
  const id=raw.weaponSlots[slot.id];
  if(typeof id!=='string')fail('Weapon slot IDs must be strings.');
  weaponSlots[slot.id]=id;
 }
 const manualSlots={};
 for(const slot of LOADOUT_MANUAL_SLOTS){
  if(!Object.hasOwn(raw.manualSlots,slot.id))fail('Equipment snapshot is missing '+slot.label+'.');
  const value=raw.manualSlots[slot.id];
  if(!value||typeof value!=='object'||Array.isArray(value)||
   !['empty','equipped'].includes(value.mode))
   fail('Invalid equipped/empty choice for '+slot.label+'.');
  if(value.mode==='equipped'){
   if(typeof value.weight!=='string'&&typeof value.weight!=='number'&&value.weight!==null)
    fail('Invalid weight type for '+slot.label+'.');
   manualSlots[slot.id]={mode:'equipped',weight:value.weight??''};
  }else manualSlots[slot.id]={mode:'empty',weight:''};
 }
 const snapshot={weaponSlots,manualSlots,
  maxLoad:String(raw.maxLoad),confirmed:unconfirm?false:raw.confirmed};
 // Existing verified rules reject unknown IDs, illegal weights and bad maximum.
 planEquipmentLoadout(snapshot,weapons);
 return snapshot;
}
export function normalizeEquipmentSnapshot(raw,weapons){
 return normalize(raw,weapons);
}
export function serializeEquipmentSnapshot(raw,weapons){
 const value=normalize(raw,weapons,{unconfirm:true});
 const data={version:EQUIPMENT_SAVE_VERSION,...value};
 const text=JSON.stringify(data);
 if(text.length>EQUIPMENT_SAVE_MAX_BYTES)
  fail('Saved equipment plan exceeds the browser storage limit.');
 return text;
}
export function parseEquipmentSnapshot(raw,weapons){
 if(typeof raw!=='string'||raw.length<2||raw.length>EQUIPMENT_SAVE_MAX_BYTES)
  fail('Saved equipment plan is missing or oversized.');
 let object;
 try{object=JSON.parse(raw);}catch{fail('Saved equipment plan contains invalid JSON.');}
 if(!object||typeof object!=='object'||Array.isArray(object)||
  object.version!==EQUIPMENT_SAVE_VERSION)
  fail('Unsupported saved equipment plan version.');
 // Never trust stale confirmation from a browser record.
 return normalize(object,weapons,{unconfirm:true});
}
/** Compare the real selected slots, not the Build Planner candidate shortlist. */
export function compareEquipmentSnapshots(baseline,current,weapons){
 const A=normalize(baseline,weapons),B=normalize(current,weapons);
 const left=planEquipmentLoadout(A,weapons),right=planEquipmentLoadout(B,weapons);
 const byId=new Map(weapons.map(w=>[w.id,w]));
 const slots=[
  ...LOADOUT_WEAPON_SLOTS.map(slot=>{
   const describe=(value)=>{
    const id=value.weaponSlots[slot.id];
    const weapon=id?byId.get(id):null;
    return {identity:id||'empty',
     label:weapon?.name??'Empty',
     weight:weapon?(weapon.weight??null):0};
   };
   return {slot:slot.label,kind:'weapon',A:describe(A),B:describe(B)};
  }),
  ...LOADOUT_MANUAL_SLOTS.map(slot=>{
   const describe=value=>{
    const item=value.manualSlots[slot.id];
    return {identity:item.mode,
      label:item.mode==='empty'?'Empty':'Equipped (manual)',
      weight:item.mode==='empty'?0:
       item.weight===''?null:Number(item.weight)};
   };
   return {slot:slot.label,kind:'manual',A:describe(A),B:describe(B)};
  })
 ].map(row=>({...row,changed:row.A.identity!==row.B.identity||
   row.A.weight!==row.B.weight}));
 return {
  baseline:left,current:right,
  rows:slots,changedSlots:slots.filter(row=>row.changed).length,
  fullyKnown:left.allKnown&&right.allKnown,
  // Do NOT claim that a partial subtotal delta is the actual weight change.
  weightDelta:left.allKnown&&right.allKnown?
   Math.round((right.knownSubtotal-left.knownSubtotal)*1000)/1000:null,
  percentDelta:left.complete&&right.complete?
   right.load.percent-left.load.percent:null,
  exactTiers:left.complete&&right.complete,
  note:'Only actual equipped slots are compared. Missing weights are UNKNOWN, not zero. A saved local plan is restored unconfirmed; reconfirm it from the actual game before treating either roll tier as verified. Community weapon weights are not independently game-client certified.'
 };
}
