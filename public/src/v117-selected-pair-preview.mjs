/** Exactly four confirmed TWO-talisman v1.17 selected pair numerical rows.
 * No generic stacking; only matching ordered names, naked Wretch base 10,
 * no other selected gear/effects yield source-direct site proof. The
 * reference is public Tarnished.dev v1.17, not game 1.17.3.
 */
import {validateBuildLoadout} from './build-loadout.mjs';
import {V117_SELECTED_TALISMAN_PAIR_DIRECT as PAIRS} from './v117-selected-talisman-pair-direct.mjs';
export function observedV117TalismanPair(stats,loadout,{origin='Wretch'}={}){
 if(!Array.isArray(stats)||stats.length!==8||
  stats.some(x=>!Number.isInteger(x)||x<1||x>99))
  throw new RangeError('Eight validated base character attributes required.');
 const state=validateBuildLoadout(loadout);
 const names=state.talismans.filter(Boolean);
 const pair=PAIRS.find(x=>x.combo.length===names.length&&
  x.combo.every((value,i)=>value===names[i]));
 if(!pair)return{
  status:'no-direct-matching-talisman-pair',record:null,
  note:'No exactly matching ordered two-talisman real-site v1.17 scene was observed; do not infer joint effects.'
 };
 const exact=origin==='Wretch'&&stats.every(x=>x===10)&&
  !state.greatRune&&state.crystalTears.every(x=>!x)&&
  state.weaponSlots.every(x=>!x.id)&&state.armorSlots.every(x=>!x.name)&&
  state.spells.every(x=>!x);
 if(!exact)return{
  status:'matching-names-unverified-context',record:null,
  note:'These talisman names were double-read ONLY together on naked Wretch all 10, no other gear/effects. No site parity claim for this Build.'
 };
 return{
  status:'direct-site-same-input-selected-pair',
  record:pair,
  note:'Exactly the same two selected talismans, in this selection order, Wretch all 10 with no other equipment/active effect. Both independent real Chromium v1.17 runs gave identical actual numbers. This is NOT universal stacking/game-client parity.'
 };
}
