/**
 * Independent spell attack arithmetic from explicitly user-loaded v1.17
 * catalyst parameters, not copied Tarnished.dev output lookup.
 * Glintstone Pebble's 152 Magic base attack: publicly documented AtkParam 40000.
 * No bundled third-party weapon-regulation table or paid runtime API.
 *
 * Reference site's public v1.17 Spell UI calculates from the TRUNCATED
 * integer Sorcery Scaling value, then rounds the final damage to nearest
 * integer. This differs from directly flooring the fractional scaling output.
 * Verified numerically against 17 real same-input double-Chromium readings.
 * Other staffs/spells/enemies/effects are not automatically source certified.
 */
import {defenseMultiplier} from './damage-reference-model.mjs';
import {V117_PEBBLE_STAFF_ROWS,V117_PEBBLE_ACADEMY_STAFF_ROWS,V117_PEBBLE_ACADEMY_PLUS20_ROWS} from './tarnished-v117-scoped-reference-scenes.mjs';
export const PEBBLE_BASE_MAGIC=152;
/** Simple, uncharged, one-hit pure-magic spell coefficients from separate public
 * individual spell references. Not multi-hit, school boosts or actual 1.17.3 game goldens.
 * https://eldenring.wiki.gg/wiki/Great_Glintstone_Shard
 * https://eldenring.wiki.gg/wiki/Glintstone_Arc
 * https://eldenring.wiki.gg/wiki/Swift_Glintstone_Shard
 * https://eldenring.wiki.gg/wiki/Comet
 */
export const V117_SIMPLE_SORCERIES=Object.freeze({
 'Glintstone Pebble':Object.freeze({magic:152,fp:7,intRequirement:10}),
 'Great Glintstone Shard':Object.freeze({magic:211,fp:12,intRequirement:16}),
 'Swift Glintstone Shard':Object.freeze({magic:114,fp:5,intRequirement:12}),
 'Glintstone Arc':Object.freeze({magic:148,fp:9,intRequirement:13}),
 'Comet':Object.freeze({magic:292,chargedMagic:365,fp:24,intRequirement:52})
});
export const V117_GREAT_SHARD_DIRECT=Object.freeze([
 Object.freeze({int:40,magic:437,fp:12,intRequirement:16}),
 Object.freeze({int:60,magic:570,fp:12,intRequirement:16}),
 Object.freeze({int:80,magic:646,fp:12,intRequirement:16})
]);

/** Distinct v1.17 public Spell UI rows, each independently read in two Chromium
 * sessions with identical real effective selected inputs. These are goldens,
 * not a replacement for the separately published attack coefficients.
 * Raw source: Actions run 41373017465 + follow-up Comet charged two-row probe.
 */
export const V117_OTHER_SIMPLE_SORCERY_DIRECT=Object.freeze({
 'Swift Glintstone Shard':Object.freeze([
  Object.freeze({int:40,magic:236}),Object.freeze({int:60,magic:308}),Object.freeze({int:80,magic:349})
 ]),
 'Glintstone Arc':Object.freeze([
  Object.freeze({int:40,magic:306}),Object.freeze({int:60,magic:400}),Object.freeze({int:80,magic:453})
 ]),
 'Comet':Object.freeze([
  Object.freeze({int:60,magic:788}),Object.freeze({int:80,magic:894})
 ]),
 'Comet:charged':Object.freeze([
  Object.freeze({int:60,magic:986}),Object.freeze({int:80,magic:1117})
 ])
});

const fail=s=>{throw new RangeError(s)};
const rec=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const mapPairs=(x,label)=>{
 if(!Array.isArray(x))fail('Malformed '+label+' array');
 const out={};
 for(const pair of x){
  if(!Array.isArray(pair)||pair.length!==2||Object.hasOwn(out,String(pair[0])))
   fail('Ambiguous '+label+' pair');
  out[String(pair[0])]=pair[1];
 }
 return out;
};
function curve(stages,stat){
 if(!Array.isArray(stages)||stages.length<2||stages.length>50)fail('Invalid catalyst curve');
 for(let i=1;i<stages.length;i++){
  const before=stages[i-1],after=stages[i];
  if(!rec(before)||!rec(after)||![before.maxVal,before.maxGrowVal,before.adjPt,
   after.maxVal,after.maxGrowVal].every(Number.isFinite)||after.maxVal<=before.maxVal)
   fail('Malformed catalyst scaling stage');
  if(stat>after.maxVal&&i<stages.length-1)continue;
  const ratio=Math.max(0,Math.min(1,(stat-before.maxVal)/(after.maxVal-before.maxVal)));
  const t=before.adjPt>0?ratio**before.adjPt:
   before.adjPt<0?1-(1-ratio)**(-before.adjPt):ratio;
  return before.maxGrowVal+(after.maxGrowVal-before.maxGrowVal)*t;
 }
 fail('No catalyst correction curve at this Intelligence');
}
export function calculatePinnedV117PebbleMagic(root,{
 staff="Astrologer's Staff",intelligence,reinforcement=25,
 spell='Glintstone Pebble',charged=false,
 strength=10,defense=0,negation=0
}={}){
 if(!rec(root)||!Array.isArray(root.weapons)||!rec(root.reinforceTypes)||
  !rec(root.calcCorrectGraphs)||!rec(root.attackElementCorrects))
  fail('Load a validated public v1.17 compact source first.');
 if(!Number.isInteger(intelligence)||intelligence<1||intelligence>99||
  !Number.isInteger(strength)||strength<1||strength>99)
  fail('Use integer character attributes 1–99.');
 if(!Number.isInteger(reinforcement)||reinforcement<0||reinforcement>25)
  fail('Unsupported catalyst reinforcement level.');
 if(!Number.isFinite(defense)||defense<0||defense>100000||
  !Number.isFinite(negation)||negation< -100||negation>100)
  fail('Invalid target defense or negation.');
 if(typeof staff!=='string'||staff.length>120||!staff.trim())fail('Choose an exact catalyst name.');
 const spellParam=Object.hasOwn(V117_SIMPLE_SORCERIES,spell)?V117_SIMPLE_SORCERIES[spell]:null;
 if(!spellParam)fail('Spell is not a supported uncharged single-hit pure-magic coefficient.');
 if(typeof charged!=='boolean')fail('Charged flag must be an explicit boolean.');
 if(charged&&(spell!=='Comet'||!Number.isFinite(spellParam.chargedMagic)))
  fail('Charged damage is only source-backed for Comet in this calculator.');
 if(intelligence<spellParam.intRequirement)return {status:'UNSUPPORTED_SPELL_REQUIREMENTS',damage:null,
  warning:spell+' requires INT '+spellParam.intRequirement+'. No damage certified with unmet spell requirements.'};
 const selected=root.weapons.filter(x=>x.name===staff&&x.sorceryTool===true);
 if(selected.length!==1)fail('Catalyst is missing, not unique, or is not a sorcery tool.');
 const item=selected[0],req=item.requirements;
 if(!rec(req)||strength<(req.str??0)||intelligence<(req.int??0))
  return {status:'UNSUPPORTED_REQUIREMENTS',damage:null,
   warning:'Weapon requirement penalty is not certified; meet catalyst requirements first.'};
 const scalings=mapPairs(item.attributeScaling,'attribute scaling');
 const coeff=scalings.int;
 if(!Number.isFinite(coeff)||coeff<=0)fail('Catalyst INT scaling is missing.');
 const corrections=root.attackElementCorrects[String(item.attackElementCorrectId)];
 if(!rec(corrections)||!rec(corrections['1'])||corrections['1'].int!==true||
  Object.keys(corrections['1']).some(key=>key!=='int'))
  fail('This catalyst magic scaling has unsupported cross-attribute rules.');
 const reinforcementTable=root.reinforceTypes[String(item.reinforceTypeId)];
 const upgraded=reinforcementTable?.[reinforcement];
 if(!rec(upgraded)||!rec(upgraded.attributeScaling)||
  !Number.isFinite(upgraded.attributeScaling.int))
  fail('Requested catalyst upgrade is not in the pinned source.');
 const graphId=item.calcCorrectGraphIds?.['1'];
 const stages=root.calcCorrectGraphs[String(graphId)];
 const bonus=coeff*upgraded.attributeScaling.int*curve(stages,intelligence);
 const scalar=1+bonus;
 // Source-site calculation stages: spell buff starts at 100, gets its
 // attribute bonus, then Math.trunc truncates the SPELL BUFF (not damage).
 // A spell's attack parameter is then applied to the INTEGER spell buff.
 // Finally Math.round is applied to damage after the 0-defense 0.9 rule.
 // Do not use floor(152*scalar*.9): that caused 1-point differences.
 const catalystScalingRaw=100*scalar;
 const catalystScalingTruncated=Math.trunc(catalystScalingRaw);
 const spellAttackCoefficient=charged?spellParam.chargedMagic:spellParam.magic;
 const rawMagic=catalystScalingTruncated*(spellAttackCoefficient/100);
 const beforeNegation=rawMagic*defenseMultiplier(rawMagic,defense);
 const calculated=Math.round(beforeNegation*(1-negation/100));
 const total=calculated;
 const verifiedStaffScenes=spell==='Glintstone Pebble'&&!charged?
  staff==="Astrologer's Staff"&&reinforcement===25?V117_PEBBLE_STAFF_ROWS:
  staff==='Academy Glintstone Staff'&&reinforcement===25?V117_PEBBLE_ACADEMY_STAFF_ROWS:
  staff==='Academy Glintstone Staff'&&reinforcement===20?V117_PEBBLE_ACADEMY_PLUS20_ROWS:null:
  staff==="Astrologer's Staff"&&reinforcement===25?
  spell==='Great Glintstone Shard'&&!charged?V117_GREAT_SHARD_DIRECT:
  V117_OTHER_SIMPLE_SORCERY_DIRECT[charged?spell+':charged':spell]??null:null;
 const supportedReference=verifiedStaffScenes&&
  strength===10&&defense===0&&negation===0?
   verifiedStaffScenes.find(x=>x.int===intelligence):null;
 const referenceCompared=supportedReference?{
  publicSiteMagic:supportedReference.magic,
  exactMatch:total===supportedReference.magic,
  sourceRuns:2
 }:null;
 return {
  status:referenceCompared?.exactMatch?'INDEPENDENT_MODEL_MATCHES_TARNISHED_V117_SCENE':
   referenceCompared?'SOURCE_MODEL_NUMERIC_MISMATCH':'INDEPENDENT_SOURCE_MODEL_UNVERIFIED_AT_SITE',
  spell,charged,staff,intelligence,reinforcement,strength,
  spellBaseMagic:spellAttackCoefficient,catalystScalar:scalar,
  magicBeforeDefense:rawMagic,defense,negation,
  catalystScalingRaw,catalystScalingTruncated,
  sourceMathDamage:calculated,damage:total,
  appliedExactSiteBoundary:false,referenceCompared,
  provenance:'Pinned public v1.17 catalyst graph and independently attributed spell attack parameter; source downloaded on user action; not bundled.',
  warning:'37 direct same-input v1.17 source result comparisons cover five spell kinds (Pebble 24, Great Shard 3, Swift Shard 3, Arc 3, Comet normal 2, Comet charged 2), strictly Wretch other stats 10, Astrologer +25 for non-Pebble scenes, and zero enemy defense/negation. Comet charged is the single projectile ONLY and does not model its additional AoE impact, splash, status, casting motions or repeated hits. Other catalysts, seals, buffs, named enemy defense, AoE and current 1.17.3 game-client parity are NOT certified.'
 };
}

/** Explicit name for parameterized function; legacy Pebble entrypoint remains compatible. */
export const calculatePinnedV117SimpleSorceryMagic=calculatePinnedV117PebbleMagic;
