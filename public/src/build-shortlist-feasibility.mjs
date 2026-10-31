import {CLASSES,validateStats,buildLevel,runeRange} from './core.mjs';
import {weaponRequirementComparison,standardTwoHandAssumption,hasDisputedRequirements} from './community-weapons.mjs';
import {validateBuildSmithingIds} from './build-smithing-handoff.mjs';

const fail=message=>{throw new RangeError(message);};
const KEYS=['STR','DEX','INT','FAI','ARC'];

/**
 * Preview-only, source-scoped feasibility for a *shortlist* of individual
 * candidate weapons. Candidates are NOT assumed to be equipped together:
 * individual weights are intentionally never summed as equipment load.
 * 2H is a per-weapon standard Strength approximation, not simultaneous use.
 */
export function planShortlistWielding(ids,weapons,rawStats,origin,{allowSote=false}={}){
 const safe=validateBuildSmithingIds(ids);
 const cls=CLASSES.find(c=>c.name===origin?.name);
 if(!Array.isArray(weapons)||!cls||typeof allowSote!=='boolean')
  fail('Valid Build origin, content setting and weapon catalog required.');
 // Avoid coercing empty or incomplete Build inputs.
 if(!Array.isArray(rawStats)||rawStats.length!==8||
  rawStats.some(v=>!Number.isInteger(v)))
  fail('Provide all eight valid integer character stats.');
 const stats=validateStats(rawStats,cls),player=stats.slice(3);
 const map=new Map(weapons.map(w=>[w.id,w]));
 const currentLevel=buildLevel(cls,stats);
 let fullySourced=true,allSafeToApply=true;
 const maxNeeds={
  one:[...player],two:[...player]
 };
 const rows=safe.map(id=>{
  const w=map.get(id);
  if(!w)fail('Shortlist contains an unknown source weapon ID.');
  if(w.expansion==='Shadow of the Erdtree'&&!allowSote)
   fail('Enable Shadow of the Erdtree references to plan this DLC weapon.');
  const conflict=hasDisputedRequirements(w);
  const known=Array.isArray(w.requirements)&&!conflict;
  if(!known){fullySourced=false;allSafeToApply=false;}
  let one=null,two=null,twoBonus=false;
  if(known){
   const comparison=weaponRequirementComparison(w,player);
   twoBonus=standardTwoHandAssumption(w);
   const asRow=grip=>({
    canWield:grip.canWield,
    totalMissing:grip.totalMissing,
    missing:grip.rows.filter(x=>x.missing>0).map(x=>({
     stat:x.key.toUpperCase(),points:x.missing
    })),
    minimumStats:[...grip.neededRaw]
   });
   one=asRow(comparison.oneHanded);
   two=asRow(comparison.twoHanded);
   for(let i=0;i<5;i++){
    maxNeeds.one[i]=Math.max(maxNeeds.one[i],one.minimumStats[i]);
    maxNeeds.two[i]=Math.max(maxNeeds.two[i],two.minimumStats[i]);
   }
  }
  return {
   id:w.id,name:w.name,category:w.category,
   expansion:w.expansion??'Base game',
   weight:Number.isFinite(w.weight)?w.weight:null,
   coverage:w.dataCoverage??'base-community',
   requirementsKnown:known,requirementsDisputed:conflict,
   oneHand:one,twoHand:two,standardTwoHandBonus:twoBonus
  };
 });
 const target=grip=>{
  // Current values are kept or increased; no respec / lowering below origin.
  const next=[...stats.slice(0,3),...maxNeeds[grip]];
  const level=buildLevel(cls,next);
  const steps=level-currentLevel;
  const delta=next.map((v,i)=>v-stats[i]);
  return {
   targetStats:next,level,additionalLevels:steps,
   additionalRunes:runeRange(currentLevel,level),
   delta,shortfalls:KEYS.map((stat,i)=>({stat,points:delta[i+3]}))
    .filter(item=>item.points>0),
   canApply:allSafeToApply
  };
 };
 return {
  weaponCount:rows.length,rows,currentLevel,
  allRequirementsKnown:fullySourced,allSafeToApply,
  oneHand:target('one'),twoHand:target('two'),
  note:'Candidate weapons are checked separately against the same character stats. No combination of weapons is assumed equipped, no total load or attack rating is calculated. Two-handing may apply standard 1.5× Strength only for eligible weapon categories, and exceptional weapon movesets may differ. Community requirements are not independent current-patch game verification.'
 };
}
