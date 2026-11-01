/**
 * The ONE armor attribute effect directly established from actual
 * Tarnished.dev public v1.17 Build Planner with two independent Chromium
 * reads: the Circlet of Light increases INT, FAI and ARC by +1 on a naked
 * Wretch 10/10/10/10/10/10/10/10.
 *
 * This is deliberately a standalone EQUIPMENT PREVIEW, not proof that an
 * arbitrary Build's final attributes, defenses, spell damage or AR match the
 * reference. Other equipped effects and stacking remain UNKNOWN.
 */
import {validateBuildLoadout} from './build-loadout.mjs';
import {DIRECT_V117_CIRCLET_OF_LIGHT} from './tarnished-v117-dlc-circlet.mjs';
const slots=['vig','mnd','end','str','dex','int','fai','arc'];
const fail=x=>{throw new RangeError(x)};
export function previewDirectV117ArmorAttributeEffect(stats,loadout,reference){
 if(!Array.isArray(stats)||stats.length!==8||
   stats.some(x=>!Number.isInteger(x)||x<1||x>99))
  fail('Need eight validated base attributes 1–99.');
 const state=validateBuildLoadout(loadout);
 const head=state.armorSlots[0];
 const noEffect={status:'no-proven-effect',observed:null,preview:null,
  note:'No separately supported armor attribute effect is activated; other selected items are name-only or unsupported.'};
 if(head.name!==DIRECT_V117_CIRCLET_OF_LIGHT.name)return noEffect;
 if(!Array.isArray(reference)||reference.length>2000)
  return {...noEffect,status:'source-not-loaded',
   note:'Explicitly load the pinned 568-piece source plus independently verified DLC item before showing Circlet bonuses.'};
 const matches=reference.filter(x=>x.id===DIRECT_V117_CIRCLET_OF_LIGHT.id&&
   x.name===head.name&&x.slot==='Head'&&x.weight===1&&x.poise===5&&
   x.siteDirectFields?.weight&&x.siteDirectFields?.poise);
 if(matches.length!==1||head.weightSource!=='community'||Number(head.weight)!==1)
  return {...noEffect,status:'unverified-item-identity',
   note:'A typed name, manual weight or changed source does not prove a Circlet bonus. Re-select the exact loaded source item.'};
 if(stats.some((x,i)=>DIRECT_V117_CIRCLET_OF_LIGHT.directlyObservedAttributeChanges[slots[i]]&&x>=99))
  return {...noEffect,status:'unverified-stat-cap',
   note:'At stat 99, the exact final equipment bonus was not independently browser-verified; no invented 100.'};
 const bonuses=slots.map(k=>DIRECT_V117_CIRCLET_OF_LIGHT.directlyObservedAttributeChanges[k]??0);
 const preview=stats.map((x,i)=>x+bonuses[i]);
 const nakedWretch=stats.every(x=>x===10)&&
  state.weaponSlots.every(x=>!x.id)&&state.armorSlots.slice(1).every(x=>!x.name)&&
  state.talismans.every(x=>!x)&&state.crystalTears.every(x=>!x)&&
  !state.greatRune&&state.spells.every(x=>!x);
 return {status:nakedWretch?'direct-site-observed-baseline':'isolated-verified-bonus-not-full-build',
  observed:{item:'Circlet of Light',weight:1,poise:5,bonuses:{int:1,fai:1,arc:1},
   reference:'Tarnished.dev v1.17 2 independent browser reads, run 41280906636'},
  preview,bonuses,
  note:nakedWretch?
   'Exact same-input Tarnished.dev Wretch 10 baseline: INT/FAI/ARC each 11. No armor defense/spell result is certified.':
   'This is ONLY the separately observed Circlet +1/+1/+1 isolated effect applied arithmetically. Complete equipment, spell scaling, stacking and game-version correctness are NOT verified.'
 };
}
