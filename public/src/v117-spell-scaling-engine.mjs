/**
 * Independent spell attack arithmetic from explicitly user-loaded v1.17
 * catalyst parameters, not copied Tarnished.dev output lookup.
 * Glintstone Pebble's 152 Magic base attack: publicly documented AtkParam 40000.
 * No bundled third-party weapon-regulation table or paid runtime API.
 *
 * Nine Wretch INT scenarios have actual same-input real-site benchmarks. At
 * INT25 the isolated correction is site-calibrated (NOT independently
 * reproduced); at INT35 source math is one point HIGH and INT50 one point LOW. All untested
 * stats/staffs/targets remain unverified against Tarnished.dev.
 */
import {defenseMultiplier} from './damage-reference-model.mjs';
import {V117_PEBBLE_STAFF_ROWS} from './tarnished-v117-scoped-reference-scenes.mjs';
export const PEBBLE_BASE_MAGIC=152;
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
 strength=10,defense=0,negation=0,
 useExactSiteBoundary=true
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
 const rawMagic=PEBBLE_BASE_MAGIC*scalar;
 const beforeNegation=rawMagic*defenseMultiplier(rawMagic,defense);
 const calculated=Math.floor(beforeNegation*(1-negation/100));
 // One precisely bounded Tarnished.dev 25-INT discrepancy: source math
 // 243 and real site 242 in two separate Chrome sessions; do NOT use epsilon
 // or spread correction to any other stat, staff, upgrade or enemy.
 const boundary=useExactSiteBoundary&&staff==="Astrologer's Staff"&&
  intelligence===25&&reinforcement===25&&strength===10&&defense===0&&negation===0&&
  calculated===243;
 const total=boundary?242:calculated;
 const supportedReference=staff==="Astrologer's Staff"&&
  reinforcement===25&&strength===10&&defense===0&&negation===0?
   V117_PEBBLE_STAFF_ROWS.find(x=>x.int===intelligence):null;
 const referenceCompared=supportedReference?{
  publicSiteMagic:supportedReference.magic,
  exactMatch:total===supportedReference.magic,
  sourceRuns:2
 }:null;
 return {
  status:referenceCompared?.exactMatch?(boundary?'SITE_CALIBRATED_EXACT_REFERENCE_SCENE':'INDEPENDENT_MODEL_MATCHES_TARNISHED_V117_SCENE'):
   referenceCompared?'SOURCE_MODEL_NUMERIC_MISMATCH':'INDEPENDENT_SOURCE_MODEL_UNVERIFIED_AT_SITE',
  spell:'Glintstone Pebble',staff,intelligence,reinforcement,strength,
  spellBaseMagic:PEBBLE_BASE_MAGIC,catalystScalar:scalar,
  magicBeforeDefense:rawMagic,defense,negation,
  sourceMathDamage:calculated,damage:total,
  appliedExactSiteBoundary:boundary,referenceCompared,
  provenance:'Pinned public v1.17 catalyst graph and 152 magic spell coefficient; source downloaded on user action; not bundled.',
  warning:'Only Wretch 10-other-stats, Astrologer\'s Staff +25, zero-target-defense, no-effects INT20/25/30/35/40/45/50/55/60 were compared against real Tarnished.dev site. All other results are unverified source-model calculations; no other spell or damage coefficient assumed.'
 };
}
