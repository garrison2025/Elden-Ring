/** Finite double-browser public v1.17 Rune+Physick *selected-item* evidence.
 * The site displayed changed attributes while BOTH Activate checkboxes were
 * OFF. Never imply it certifies active Rune Arc / Physick effects in-game.
 */
import {validateBuildLoadout} from './build-loadout.mjs';
import {V117_ISOLATED_SELECTED_EFFECTS} from './v117-isolated-effect-goldens.mjs';
const REFERENCE=Object.freeze([15,15,15,15,15,25,15,15]);
export const V117_RUNE_PHYSICK_SELECTED_SCENE=Object.freeze({
 origin:'Wretch',baseline:Object.freeze(Array(8).fill(10)),
 rune:"Godrick's Great Rune",tear:'Intelligence-knot Crystal Tear',
 actualSiteFinal:REFERENCE,activationControls:Object.freeze({rune:false,physick:false}),
 sourceRun:41368151680,
 scope:'One public v1.17 Wretch10 site selected-item context, NOT actual in-game activation'
});
export function exactV117RunePhysickSelectedAttributes(stats,loadout,{origin='Wretch'}={}){
 if(!Array.isArray(stats)||stats.length!==8||stats.some(v=>!Number.isInteger(v)||v<1||v>99))
  throw new RangeError('Expected eight integer character attributes 1–99');
 const state=validateBuildLoadout(loadout);
 const emptyElsewhere=state.weaponSlots.every(x=>!x.id)&&
  state.armorSlots.every(x=>!x.name)&&state.spells.every(x=>!x)&&
  state.talismans.every(x=>!x);
 const tears=state.crystalTears.filter(Boolean);
 if(origin!=='Wretch'||stats.some(n=>n!==10)||!emptyElsewhere||
  state.greatRune!==V117_RUNE_PHYSICK_SELECTED_SCENE.rune||
  tears.length!==1||tears[0]!==V117_RUNE_PHYSICK_SELECTED_SCENE.tear)
  return {status:'NOT_OBSERVED',final:null,reference:null,
   warning:'Only one exact no-other-gear Wretch10 selected Rune + tear scenario has reference evidence.'};
 const rune=V117_ISOLATED_SELECTED_EFFECTS['rune:'+state.greatRune];
 const tear=V117_ISOLATED_SELECTED_EFFECTS['physick:'+tears[0]];
 if(!rune||!tear||rune.delta?.length!==8||tear.delta?.length!==8)
  throw Error('Missing two independent isolated effect sources');
 const independentlyComposed=stats.map((n,i)=>n+rune.delta[i]+tear.delta[i]);
 if(independentlyComposed.some((n,i)=>n!==REFERENCE[i]))
  throw Error('Independently composed attribute changes disagree with two-browser public reference');
 return {status:'EXACT_SAME_INPUT_SELECTED_ONLY_SITE_MATCH',final:independentlyComposed,
  reference:V117_RUNE_PHYSICK_SELECTED_SCENE,
  warning:'Both Activate toggles were OFF in the reference UI despite displayed bonuses. This proves a selected-item display match only, not game activation, derived vitals, AR, duration or arbitrary effects.'};
}
