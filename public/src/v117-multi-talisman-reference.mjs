/** Lookup exact same-input multiple-talisman REAL browser observations.
 * These 5 profiles are NOT a general effect stacking algorithm.
 * Reference: Wretch, every raw base attribute exactly 10, all other equipment
 * empty, no rune, Physick, spells, buffs or other selected talismans.
 * The input talisman ORDER must also match the public reference UI proof.
 */
import {validateBuildLoadout} from './build-loadout.mjs';
import {V117_EXACT_TALISMAN_COMBOS as EXACT,
 V117_REFERENCE_REJECTED_TALISMAN_COMBOS as REJECTED} from './v117-talisman-combos-direct.mjs';
const matches=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
export function previewV117ExactTalismanCombination(stats,loadout,{origin='Wretch'}={}){
 if(!Array.isArray(stats)||stats.length!==8||
  stats.some(n=>!Number.isInteger(n)||n<1||n>99))
  throw new RangeError('Provide eight valid integer Build attributes from 1 to 99');
 const state=validateBuildLoadout(loadout);
 const names=state.talismans.filter(Boolean);
 if(names.length<2)return{status:'not-multiple',observation:null};
 const otherEquipment=state.weaponSlots.some(x=>x.id)||
  state.armorSlots.some(x=>x.name)||
  state.spells.some(Boolean)||state.crystalTears.some(Boolean)||!!state.greatRune;
 const exactContext=origin==='Wretch'&&stats.every(x=>x===10)&&!otherEquipment;
 if(!exactContext)
  return{status:'not-site-certified-context',observation:null,
   note:'Multi-talisman site profiles were verified for naked Wretch (10 in all eight attributes) with no other selected equipment or effects only.'};
 const rejection=REJECTED.find(x=>matches(x.names,names));
 if(rejection)return{status:'source-exclusivity-observed',observation:rejection,
   note:'The second Radagon seal was clicked on the real v1.17 multi-select, but it did NOT remain selected. Only Radagon Scarseal persisted. Do not add effects or assert an equipped 1.6 weight for these two items.'};
 const proof=EXACT.find(x=>matches(x.names,names));
 if(!proof)return{status:'combination-not-directly-verified',observation:null,
  note:'No identical actual v1.17 multiple-talisman scenario and selection order was independently observed; no HP/negation/stamina/defense stacking is inferred.'};
 return{status:'direct-site-same-input-combination',observation:proof,
  note:'Exact Wretch10 two-pass actual public Tarnished.dev v1.17 combined-talisman output. This is a reference-screen observation, not proof of game-client rules, reordered input, higher-level Build, other equipment or buffs.'};
}
