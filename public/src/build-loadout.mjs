import {loadTier} from './core.mjs';
import {hasDisputedWeight} from './community-weapons.mjs';

export const LOADOUT_WEAPON_SLOTS=Object.freeze(['Right hand 1','Right hand 2','Right hand 3','Left hand 1','Left hand 2','Left hand 3']);
export const LOADOUT_ARMOR_SLOTS=Object.freeze(['Head','Chest','Arms','Legs']);
export const LOADOUT_TALISMAN_SLOTS=4,LOADOUT_SPELL_SLOTS=10;
const err=message=>{throw new RangeError(message);};
const text=(value,label,max=100)=>{
 if(typeof value!=='string'||value.length>max||/[\u0000-\u001f\u007f]/.test(value))
  err(label+' must be short plain text.');
 return value.trim();
};
const weight=(value,label)=>{
 if(value===''||value===null||value===undefined)return null;
 if(typeof value!=='number'&&typeof value!=='string')err(label+' must be a decimal.');
 if(typeof value==='string'&&!/^(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(value.trim()))err(label+' must be a decimal from 0 to 999.');
 const n=Number(value);
 if(!Number.isFinite(n)||n<0||n>999||Math.round(n*1000)/1000!==n)
  err(label+' must be a decimal from 0 to 999.');
 return n;
};
const namedSlots=(n)=>Array.from({length:n},()=>({name:'',weight:''}));
export function emptyBuildLoadout(){
 return {
  schemaVersion:1,
  weaponSlots:LOADOUT_WEAPON_SLOTS.map(()=>({id:'',manualWeight:''})),
  armorSlots:namedSlots(LOADOUT_ARMOR_SLOTS.length),
  talismans:Array(LOADOUT_TALISMAN_SLOTS).fill(''),
  spells:Array(LOADOUT_SPELL_SLOTS).fill(''),
  crystalTears:['',''],greatRune:'',maxEquipLoad:''
 };
}
export function validateBuildLoadout(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||value.schemaVersion!==1)
  err('Unsupported loadout version (expected schemaVersion 1).');
 const w=value.weaponSlots,a=value.armorSlots;
 if(!Array.isArray(w)||w.length!==6||!Array.isArray(a)||a.length!==4||
  !Array.isArray(value.talismans)||value.talismans.length!==4||
  !Array.isArray(value.spells)||value.spells.length!==10||
  !Array.isArray(value.crystalTears)||value.crystalTears.length!==2)
  err('Expected six weapons, four armor pieces, four talismans, ten spells and two crystal tears.');
 const weapons=w.map((slot,i)=>{
  if(!slot||typeof slot!=='object'||Array.isArray(slot))err('Weapon slot '+i+' missing.');
  const id=text(slot.id,'Weapon ID',100);
  const m=weight(slot.manualWeight,'Manual weapon weight');
  if(!id&&m!==null)err('Cannot set weight for an empty weapon slot.');
  return {id,manualWeight:m===null?'':String(m)};
 });
 const armor=a.map((slot,i)=>{
  if(!slot||typeof slot!=='object'||Array.isArray(slot))err('Armor slot '+i+' missing.');
  const name=text(slot.name,'Armor name');
  const m=weight(slot.weight,'Armor weight');
  if(!name&&m!==null)err('Cannot set weight without an armor name.');
  return {name,weight:m===null?'':String(m)};
 });
 const strings=(items,label)=>items.map(v=>text(v,label));
 const cap=weight(value.maxEquipLoad,'Max equip load');
 if(cap!==null&&cap<=0)err('Max equip load must be positive.');
 return {schemaVersion:1,weaponSlots:weapons,armorSlots:armor,
  talismans:strings(value.talismans,'Talisman'),
  spells:strings(value.spells,'Spell'),
  crystalTears:strings(value.crystalTears,'Crystal tear'),
  greatRune:text(value.greatRune,'Great Rune'),
  maxEquipLoad:cap===null?'':String(cap)};
}
/** Never silently interpret a missing or disputed source weight as zero.
 * Only explicit zero-weight empty equipment slots contribute zero.
 * A user override is always labelled user-entered, not game-verified.
 */
export function evaluateBuildLoadout(input,catalog,{allowSote=false,allowTarnishedPack=false}={}){
 const state=validateBuildLoadout(input);
 if(!catalog||!Array.isArray(catalog.weapons))err('A validated local weapon catalog is required.');
 const map=new Map(catalog.weapons.map(w=>[w.id,w]));
 const items=[],unknowns=[];
 let knownWeight=0;
 for(let i=0;i<6;i++){
  const slot=state.weaponSlots[i];
  if(!slot.id)continue;
  const found=map.get(slot.id);
  if(!found)err('Unknown weapon ID in '+LOADOUT_WEAPON_SLOTS[i]+'. No substituted weapon.');
  if(found.expansion==='Shadow of the Erdtree'&&!allowSote)
   err('Enable Shadow of the Erdtree before using '+found.name+'.');
  if(found.expansion==='Tarnished Pack'&&!allowTarnishedPack)
   err('Enable Tarnished Pack before using '+found.name+'.');
  const manual=weight(slot.manualWeight,'Manual weapon weight');
  const sourced=typeof found.weight==='number'&&Number.isFinite(found.weight)&&
    found.weight>=0&&!hasDisputedWeight(found)?found.weight:null;
  const amount=manual??sourced;
  if(amount===null)unknowns.push({slot:LOADOUT_WEAPON_SLOTS[i],name:found.name,
   reason:'Primary weight missing or source-disputed; supply a value from your own game menu.'});
  else knownWeight+=amount;
  items.push({slot:LOADOUT_WEAPON_SLOTS[i],name:found.name,weight:amount,
   provenance:manual!==null?'user-entered':'community-source-unverified'});
 }
 for(let i=0;i<4;i++){
  const slot=state.armorSlots[i];
  if(!slot.name)continue;
  const amount=weight(slot.weight,'Armor weight');
  if(amount===null)unknowns.push({slot:LOADOUT_ARMOR_SLOTS[i],name:slot.name,
   reason:'Armor weight has not been provided.'});
  else knownWeight+=amount;
  items.push({slot:LOADOUT_ARMOR_SLOTS[i],name:slot.name,weight:amount,
   provenance:'user-entered'});
 }
 const exactTotal=unknowns.length?null:Math.round(knownWeight*1000)/1000;
 let tier=null;
 if(exactTotal!==null&&state.maxEquipLoad!=='')tier=loadTier(exactTotal,state.maxEquipLoad);
 return {state,items,unknowns,knownWeight:Math.round(knownWeight*1000)/1000,
  exactTotal,tier,status:unknowns.length?'PARTIAL':'USER_SOURCE_ONLY',
  warnings:[
   'No armor, talisman, crystal tear, Great Rune, status or spell effects are applied to character stats, defenses or AR.',
   'Community weapon weights are source-reported, not independently certified to the current game.',
   ...(unknowns.length?['Equip-load tier withheld because one or more selected equipment weights are unknown.']:[])
  ]};
}
export function encodeBuildLoadout(input){
 const obj=validateBuildLoadout(input);
 const json=JSON.stringify(obj);
 if(json.length>3800)err('Loadout link is too long; export a local JSON file instead.');
 return json;
}
export function decodeBuildLoadout(source){
 if(typeof source!=='string'||source.length>3800)err('Oversized or malformed loadout link.');
 let value;try{value=JSON.parse(source)}catch{err('Invalid loadout JSON.');}
 return validateBuildLoadout(value);
}
