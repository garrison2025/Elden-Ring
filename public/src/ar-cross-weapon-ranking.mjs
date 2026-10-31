import {POWER_STATS,DAMAGE_TYPES,calculateAr} from './weapon-ar.mjs';
import {describeLocalWeapon} from './ar-workbench-core.mjs';

export const RANKING_MAX_VARIANTS=240;
const fail=message=>{throw new RangeError(message);};
const nameOf=w=>w.weaponName??w.name;
const maxUpgrade=w=>w?.reinforceTypeId;
const sortable=(a,b)=>b.total-a.total||a.family.localeCompare(b.family)||
 a.affinityId-b.affinityId||a.name.localeCompare(b.name);
const affinityAllowed=(w,affinityId)=>affinityId==='all'||w.affinityId===affinityId;

/**
 * Rank distinct source-defined variants by nominal AR for the SAME stats/grip.
 * Use exactly the existing, independently authored calculateAr path. Never
 * substitute community catalog +0 facts, guessed reinforcement paths or
 * external user-entered AR for a valid source profile.
 */
export function rankLocalWeaponVariants(regulation,{
 term,affinityId='all',stats,regularUpgrade=0,somberUpgrade=0,twoHanded=false,
 gameVersion='v1.17-reference',sourceReference='User-loaded reference data'
}={}){
 if(!regulation||!Array.isArray(regulation.weapons)||regulation.weapons.length>50000||
   typeof term!=='string'||term.trim().length<2||term.length>100)
  fail('Enter at least two characters to select a bounded weapon group.');
 if(!stats||Array.isArray(stats)||typeof stats!=='object'||
  POWER_STATS.some(s=>!Number.isInteger(stats[s])||stats[s]<1||stats[s]>99))
  fail('Enter five whole character attributes from 1 to 99.');
 if(affinityId!=='all'&&(!Number.isInteger(affinityId)||affinityId< -1||affinityId>12))
  fail('Invalid source affinity filter.');
 if(!Number.isInteger(regularUpgrade)||regularUpgrade<0||regularUpgrade>25||
  !Number.isInteger(somberUpgrade)||somberUpgrade<0||somberUpgrade>10||
  typeof twoHanded!=='boolean')
  fail('Choose legal regular +0..25, somber +0..10, and grip inputs.');
 const needle=term.trim().toLocaleLowerCase('en-US');
 const matches=regulation.weapons.filter(w=>w&&typeof w.name==='string'&&
  typeof nameOf(w)==='string'&&
  (w.name.toLocaleLowerCase('en-US').includes(needle)||
   nameOf(w).toLocaleLowerCase('en-US').includes(needle))&&
  affinityAllowed(w,affinityId))
  .sort((a,b)=>nameOf(a).localeCompare(nameOf(b))||
    (a.affinityId??99)-(b.affinityId??99)||a.name.localeCompare(b.name));
 // Never silently rank an alphabetically truncated subset as a global top.
 if(matches.length>RANKING_MAX_VARIANTS)return {
  status:'too-broad',totalMatches:matches.length,rankedCount:0,
  excludedCount:0,excludedExamples:[],rows:[],
  message:'Found '+matches.length+' source variants; narrow the weapon name or affinity to at most '+
   RANKING_MAX_VARIANTS+' variants. No partial top-AR ranking was fabricated.'
 };
 const rows=[],excluded=[];
 for(const weapon of matches){
  const sourceName=weapon.name;
  try{
   const {profile,description}=describeLocalWeapon(regulation,sourceName,gameVersion,sourceReference);
   const available=description.upgradeLevels;
   const somber=available.length===11;
   const upgrade=somber?somberUpgrade:regularUpgrade;
   if(!available.includes(upgrade)){
    excluded.push({name:sourceName,reason:'Upgrade +'+upgrade+' is absent from source reinforcement path.'});
    continue;
   }
   const result=calculateAr(profile,stats,{affinity:'SOURCE AFFINITY',upgrade,twoHanded});
   if(!Number.isInteger(result.total)||result.total<0||!Array.isArray(result.perElement))
    throw new RangeError('Source did not produce a valid integer nominal AR.');
   rows.push({
    name:sourceName,family:description.referenceFamily,
    affinityId:description.referenceAffinityId,
    reinforcement:somber?'somber':'regular',
    upgrade,total:result.total,
    requirementsMet:result.missingRequirements.length===0,
    missingRequirements:result.missingRequirements,
    components:Object.fromEntries(DAMAGE_TYPES.map(d=>[
     d,result.perElement.find(x=>x.element===d)?.displayed??0])),
    scopeFlags:description.scopeFlags,gripMode:description.gripMode
   });
  }catch(error){
   excluded.push({name:sourceName,reason:String(error?.message??error).slice(0,180)});
  }
 }
 rows.sort(sortable);
 return {
  status:'complete-query',term:term.trim(),affinityId,regularUpgrade,somberUpgrade,
  totalMatches:matches.length,rankedCount:rows.length,excludedCount:excluded.length,
  excludedExamples:excluded.slice(0,12),rows,gameVersion,
  note:'Nominal AR ranking only; source parameters are not game-client certified. Higher AR is not necessarily higher enemy damage. Out-of-requirement weapons remain visible but flagged.'
 };
}

/** Deterministic, Excel-safe CSV from the ACTUALLY displayed calculation only. */
export function rankingToCsv(result,{sourceLabel='Unverified source'}={}){
 if(!result||result.status!=='complete-query'||!Array.isArray(result.rows)||
  typeof sourceLabel!=='string'||sourceLabel.length>300)
  fail('Calculate a complete source-scoped ranking before exporting.');
 const q=value=>{
  let text=String(value??'');
  // Spreadsheet formula injection: name strings are untrusted external data.
  if(/^[\s\t\r\n]*[=+@-]/.test(text))text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
 };
 const columns=['Rank','Weapon variant','Family','Affinity source ID','Reinforcement','Level',
  'Nominal total AR','Physical','Magic','Fire','Lightning','Holy',
  'Meets requirements','Missing requirements','Unmodelled mechanics','Game/source version','Source provenance'];
 const lines=[columns.map(q).join(',')];
 result.rows.forEach((r,i)=>lines.push([
  i+1,r.name,r.family,r.affinityId,r.reinforcement,r.upgrade,r.total,
  ...DAMAGE_TYPES.map(d=>r.components[d]),r.requirementsMet?'Yes':'No',
  r.missingRequirements.join(' / '),r.scopeFlags.join(' / '),
  result.gameVersion??'unverified',sourceLabel
 ].map(q).join(',')));
 return '\uFEFF'+lines.join('\r\n')+'\r\n';
}
