import {loadTier} from './core.mjs';
import {validateBuildSmithingIds} from './build-smithing-handoff.mjs';

/**
 * Explicit equipped item slots, not a shortlist and not an AR/armor database.
 * Weapon weights are sourced from the bundled community weapon catalog.
 * Armor and talisman weights are entered by players from their game screen.
 * The final roll tier is unavailable unless the player explicitly confirms
 * the equipment loadout and ALL selected slots have known weights.
 */
export const LOADOUT_WEAPON_SLOTS=Object.freeze([
 {id:'rh1',label:'Right hand 1'},{id:'rh2',label:'Right hand 2'},
 {id:'rh3',label:'Right hand 3'},{id:'lh1',label:'Left hand 1'},
 {id:'lh2',label:'Left hand 2'},{id:'lh3',label:'Left hand 3'}
]);
export const LOADOUT_MANUAL_SLOTS=Object.freeze([
 {id:'head',label:'Head armor'},{id:'chest',label:'Chest armor'},
 {id:'arms',label:'Arm armor'},{id:'legs',label:'Leg armor'},
 {id:'talisman1',label:'Talisman 1'},{id:'talisman2',label:'Talisman 2'},
 {id:'talisman3',label:'Talisman 3'},{id:'talisman4',label:'Talisman 4'}
]);
const fail=x=>{throw new RangeError(x);};
const validWeight=value=>typeof value==='number'&&Number.isFinite(value)&&
 value>=0&&value<=200&&Math.round(value*1000)===value*1000;
const grams=n=>Math.round(n*1000);
function parseManualWeight(value,label){
 const str=typeof value==='number'?String(value):value;
 if(typeof str!=='string'||! /^(?:0|[1-9][0-9]{0,2})(?:\.[0-9]{1,3})?$/.test(str))
  fail(label+' requires an explicit 0–200 in-game weight with at most 3 decimals.');
 const number=Number(str);
 if(number>200)fail(label+' weight cannot exceed 200.');
 return number;
}
function parseMaximum(value){
 if(value===''||value===null||value===undefined)return null;
 const str=typeof value==='number'?String(value):value;
 if(typeof str!=='string'||! /^(?:0|[1-9][0-9]{0,4})(?:\.[0-9]{1,3})?$/.test(str)||
   Number(str)<=0||Number(str)>10000)
  fail('Enter your displayed in-game maximum equip load (>0 and ≤10000).');
 return Number(str);
}
export function planEquipmentLoadout({weaponSlots,manualSlots,maxLoad='',confirmed=false},weapons){
 if(!Array.isArray(weapons)||typeof confirmed!=='boolean')
  fail('Equipment planning requires a source catalog and an explicit confirmation.');
 if(!weaponSlots||typeof weaponSlots!=='object'||Array.isArray(weaponSlots)||
  !manualSlots||typeof manualSlots!=='object'||Array.isArray(manualSlots))
  fail('Equipment slot data is missing.');
 const map=new Map(weapons.map(w=>[w.id,w]));
 const items=[],unknown=[];
 let subtotal=0,weaponSubtotal=0,manualSubtotal=0;
 const addKnown=(slot,name,weight,source)=>{
  const g=grams(weight);subtotal+=g;
  if(source==='community')weaponSubtotal+=g;else manualSubtotal+=g;
  items.push({slot,name,weight,source,known:true});
 };
 for(const slot of LOADOUT_WEAPON_SLOTS){
  const id=weaponSlots[slot.id];
  if(id===null||id===undefined||id==='')continue; // explicit unequipped
  if(typeof id!=='string'||! /^[a-z0-9-]{1,80}$/.test(id))
   fail('Invalid equipped weapon reference in '+slot.label+'.');
  const weapon=map.get(id);
  if(!weapon)fail('Equipped weapon no longer exists in local source catalog: '+slot.label);
  const weight=weapon.weight;
  if(weight===null||weight===undefined){
   unknown.push(slot.label+' · '+weapon.name);
   items.push({slot:slot.label,name:weapon.name,weight:null,source:'community',known:false});
  }else{
   if(!validWeight(weight))fail('Community weapon weight is invalid: '+weapon.name);
   addKnown(slot.label,weapon.name,weight,'community');
  }
 }
 for(const slot of LOADOUT_MANUAL_SLOTS){
  const entry=manualSlots[slot.id];
  if(entry===null||entry===undefined||entry.mode==='empty')continue; // explicitly not equipped
  if(typeof entry!=='object'||Array.isArray(entry)||entry.mode!=='equipped')
   fail('Choose Empty or Equipped in '+slot.label+'.');
  if(entry.weight===''||entry.weight===null||entry.weight===undefined){
   unknown.push(slot.label);
   items.push({slot:slot.label,name:slot.label,weight:null,source:'player',known:false});
  }else addKnown(slot.label,slot.label,
   parseManualWeight(entry.weight,slot.label),'player');
 }
 const maximum=parseMaximum(maxLoad);
 const allKnown=unknown.length===0;
 const complete=confirmed&&allKnown&&maximum!==null;
 const total=subtotal/1000;
 const tier=complete?loadTier(total,maximum):null;
 return {
  items,unknown,knownSubtotal:total,knownWeaponWeight:weaponSubtotal/1000,
  knownManualWeight:manualSubtotal/1000,maximum,confirmed,
  allKnown,complete,load:tier,selectedCount:items.length,
  caution:!allKnown?'At least one selected item has UNKNOWN weight. Do not treat the known subtotal as total equipped load.':
   !confirmed?'Known subtotal only. Confirm you entered every actually equipped slot before treating this as your complete equipped load.':
   maximum===null?'Enter your actual in-game maximum equip load to obtain a roll tier.':
   'Calculated only for the explicit equipped slots you confirmed. Check actual game status for weight-affecting buffs or gear effects.'
 };
}

/** Build Planner -> equipment page: a safe list of CANDIDATES, not equipped items. */
export function parseEquipCandidates(search){
 if(typeof search!=='string'||search.length>900)fail('Oversized equipment candidate link.');
 const params=new URLSearchParams(search);
 const values=params.getAll('candidates');
 if(!values.length)return [];
 if(values.length!==1||!values[0]||values[0].length>650)
  fail('Invalid equipped-weapon candidate list.');
 return validateBuildSmithingIds(values[0].split(','));
}
export function makeEquipCandidatesUrl(ids,buildUrl){
 const source=validateBuildSmithingIds(ids);
 if(typeof buildUrl!=='string'||buildUrl.length>2048)
  fail('Invalid Build Planner link.');
 const base=new URL(buildUrl);
 if(!['https:','http:'].includes(base.protocol)||
  ! /\/build-planner\/(?:index\.html)?$/.test(base.pathname))
  fail('Candidates must originate from Build Planner.');
 const url=new URL('../equip-load-calculator/',base);
 url.searchParams.set('candidates',source.join(','));
 return url.pathname+url.search;
}
