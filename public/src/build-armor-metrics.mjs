/**
 * Read-only Build Planner view of the 13 source-reported armor metrics.
 * All four slots must uniquely match the explicitly loaded, pinned community
 * armor source. Never treat unknown pieces/fields as zero, and never convert
 * these armor-only source values into overall player/defense/active-buff stats.
 */
import {ARMOR_METRICS} from './armor-source-optin.mjs';
import {LOADOUT_ARMOR_SLOTS,validateBuildLoadout} from './build-loadout.mjs';
const fail=msg=>{throw new RangeError(msg)};
const valid=(v,kind)=>Number.isFinite(v)&&v>=0&&v<=(kind==='negation'?99:800)&&
 (kind!=='resistance'||Number.isInteger(v));
const round=x=>Math.round(x*1e6)/1e6;
export function summarizeEquippedArmorMetrics(input,reference){
 const state=validateBuildLoadout(input);
 const selected=state.armorSlots.map((s,i)=>({name:s.name,slot:LOADOUT_ARMOR_SLOTS[i]}))
  .filter(x=>x.name);
 if(reference===null){
  return {status:'source-not-loaded',sourceLoaded:false,equipped: selected.length,
   matched:0,missingNames:selected.map(x=>x.name),metrics:null};
 }
 if(!Array.isArray(reference)||reference.length>2000)
  fail('The explicitly loaded pinned armor reference is missing or invalid.');
 const used=[],missingNames=[];
 for(const part of selected){
  const name=part.name.trim().toLocaleLowerCase('en-US');
  const matches=reference.filter(r=>r?.slot===part.slot&&
   typeof r.name==='string'&&r.name.trim().toLocaleLowerCase('en-US')===name);
  if(matches.length!==1){missingNames.push(part.name);used.push(null);}
  else used.push(matches[0]);
 }
 const metrics={};
 for(const [key,meta] of Object.entries(ARMOR_METRICS)){
  const values=used.map(piece=>piece?.metrics?.[key]);
  const missing=values.filter(v=>!valid(v,meta.kind)).length;
  let value=null;
  if(selected.length>0&&missing===0){
   if(meta.kind==='negation')
    value=round(100*(1-values.reduce((remain,v)=>remain*(1-v/100),1)));
   else value=values.reduce((sum,v)=>sum+v,0);
  }
  metrics[key]={label:meta.label,kind:meta.kind,
   unit:meta.kind==='negation'?'%':'points',
   value,known:values.length-missing,total:selected.length,missing};
 }
 return {
  status:selected.length===0?'no-equipped-armor':
   missingNames.length?'partial-source-armor':
   Object.values(metrics).some(x=>x.value===null)?'partial-metric-fields':
   'complete-source-armor',
  sourceLoaded:true,equipped:selected.length,
  matched:used.filter(Boolean).length,
  missingNames,metrics,
  caveat:'Armor pieces only, opt-in pinned community-source statistics. '+
   'Negation is multiplicative over source-rounded percentages; resistances/poise are additive. '+
   'No talismans, Great Runes, weapon passives, active effects, player defenses, '+
   'game-client testing or separate Tarnished.dev v1.17 same-input goldens.'
 };
}
