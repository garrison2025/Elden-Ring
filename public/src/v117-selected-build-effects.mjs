/** Limited same-input selection preview for exactly three independently
 * twice-observed public Tarnished.dev v1.17 item selections.
 * Never sum effects from distinct items or feed them into AR/defense/HP.
 * Reference's Great Rune and Physick checkboxes appeared OFF despite their
 * displayed +stats; selection-only proof is NOT game activation verification.
 */
import {validateBuildLoadout} from './build-loadout.mjs';
import {V117_ISOLATED_SELECTED_EFFECTS as ITEMS} from './v117-isolated-effect-goldens.mjs';
const LABELS=['VIG','MND','END','STR','DEX','INT','FAI','ARC'];
export function previewV117SelectedBuildEffects(stats,loadout,{origin='Wretch'}={}){
 if(!Array.isArray(stats)||stats.length!==8||
  stats.some(n=>!Number.isInteger(n)||n<1||n>99))
  throw new RangeError('Eight integer Build stats 1–99 required.');
 const s=validateBuildLoadout(loadout);
 const selected=[
  ...s.talismans.filter(Boolean).map(name=>({kind:'talisman',name})),
  ...s.crystalTears.filter(Boolean).map(name=>({kind:'physick',name})),
  ...(s.greatRune?[{kind:'rune',name:s.greatRune}]:[])
 ];
 const equippedElsewhere=s.weaponSlots.some(x=>x.id)||
  s.armorSlots.some(x=>x.name)||s.spells.some(Boolean);
 const isDirectBaseline=origin==='Wretch'&&stats.every(n=>n===10)&&
  selected.length===1&&!equippedElsewhere;
 const items=[];
 for(const entry of selected){
  const known=ITEMS[entry.kind+':'+entry.name];
  if(!known)continue;
  const cap=known.delta.some((d,i)=>stats[i]+d>99);
  const exact=isDirectBaseline&&!cap;
  const warning=known.checkboxMismatch?
    'Tarnished.dev v1.17 displayed this item selection bonus with its Activate checkbox still OFF. This preview does not assert game activation, duration or real stacking.':
    'This is the isolated reference item effect, not a certified multi-item Build.';
  items.push({
   kind:known.kind,name:known.name,source:'Tarnished.dev public v1.17, two independent real Chrome reads',
   sourceJobs:known.sourceJobs,bonus:[...known.delta],
   values:cap?null:stats.map((n,i)=>n+known.delta[i]),
   status:cap?'unverified-stat-cap':
    exact?'direct-site-same-input-selection':'isolated-effect-arithmetic-not-full-build',
   checkBoxMismatch:known.checkboxMismatch,
   note:(cap?'One or more modified attributes would exceed 99; no final value is inferred. ':
    exact?'The eight output numbers exactly matched one real selected-item Wretch reference scene. ':
    'Single known bonus applied arithmetically, but this entire Build/effects combination was NOT observed. ')+warning
  });
 }
 return{status:items.length?'verified-selection-reference-available':'no-verified-selected-effects',
  labels:LABELS,items,
  unresolved:selected.filter(x=>!ITEMS[x.kind+':'+x.name]).map(x=>x.kind+': '+x.name),
  note:'Single-selection evidence only; never sum multiple selected item bonuses or interpret these results as full game-client stats.'};
}
