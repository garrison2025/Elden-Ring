/** Wretch defense, four resistances and discovery from REAL PUBLIC v1.17 site.
 *
 * Three different evidence levels:
 * 1. Exact same eight-stat Wretch inputs from 720 single-axis, 624 full-level,
 *    16 held-out profiles or 4 previously frozen Build snapshots: site values.
 * 2. Other naked Wretch 10–99 input vectors: derived INTEGER estimate only.
 *    16 independent holdouts -> 142/160 exact, remaining 18 off by 1;
 *    that is NOT a global error guarantee and not site numeric parity.
 * 3. Other origin or below-10 attribute: output UNKNOWN.
 * All outputs are BASE character stats with NO armor, talismans, buffs or runes.
 */
import {V117_WRETCH_DEFENSE_ONE_AXIS as AX,V117_WRETCH_STAT_NAMES as KEYS,
 V117_WRETCH_DEFENSE_FIELD_NAMES as FIELDS} from './v117-wretch-defense-one-axis-direct.mjs';
import {V117_WRETCH_LEVEL_DIRECT as LEVEL} from './v117-wretch-level-direct.mjs';
import {V117_WRETCH_MIXED_HOLDOUTS as HOLD} from './v117-wretch-holdout-direct.mjs';

const oldFrozen=[
 [[40,10,10,10,10,10,10,10],[87,103,123,83,103,126,96,96,106,110]],
 [[40,30,10,10,10,10,10,10],[95,111,131,91,111,130,100,100,110,110]],
 [[40,30,25,10,10,10,10,10],[101,117,137,97,117,134,104,104,114,110]],
 [[40,30,25,10,10,10,10,40],[124,141,161,121,173,160,130,130,160,140]]
];
const fieldCount=FIELDS.length;
const baseline=Array.from({length:90},(_,i)=>
 FIELDS.map((_,k)=>Math.min(...KEYS.map(axis=>AX[axis][i][k]))));
const bonuses=Object.fromEntries(KEYS.map(axis=>[
 axis,AX[axis].map((row,i)=>row.map((value,k)=>value-baseline[i][k]))
]));
const baseLevel=Array(713).fill(null);
for(let i=0;i<90;i++)baseLevel[i]=baseline[i];
const matches=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((x,i)=>x===b[i]);
for(const [level,record] of Object.entries(LEVEL)){
 const n=Number(level),stats=record[0],values=record[1];
 const base=values.map((x,k)=>x-KEYS.reduce((sum,axis,i)=>sum+bonuses[axis][stats[i]-10][k],0));
 if(baseLevel[n-1]&&!matches(baseLevel[n-1],base))
  throw new Error('Reference source level overlap disagrees: '+level);
 baseLevel[n-1]=base;
}
if(baseLevel.some(x=>!Array.isArray(x)||x.length!==fieldCount))
 throw new Error('Missing site-derived naked Wretch level profile.');

const directByStats=new Map();
const add=(stats,vals,source)=>{
 const key=stats.join(',');
 if(directByStats.has(key)&&!matches(directByStats.get(key).values,vals))
  throw new Error('Conflicting real site naked Wretch snapshots at '+key);
 directByStats.set(key,{status:'direct-site-same-input',values:vals,source});
};
for(const [stats,values] of oldFrozen)add(stats,values,'Tarnished.dev v1.17 real Build 4-profile run 41281523364');
for(const [stats,values] of HOLD)add(stats,values,'16 independent actual Chromium holdouts');
for(const [level,record] of Object.entries(LEVEL))add(record[0],record[1],'Actual v1.17 level-shard profile at '+level);
for(const axis of KEYS){
 for(let stat=10;stat<=99;stat++){
  const values=KEYS.map(k=>k===axis?stat:10);
  add(values,AX[axis][stat-10],'Actual v1.17 '+axis+' single-axis '+stat);
 }
}
const checked=stats=>Array.isArray(stats)&&stats.length===8&&
 stats.every(n=>Number.isInteger(n)&&n>=1&&n<=99);
export const V117_WRETCH_DEFENSE_FIELDS=FIELDS;

/** Research estimate from integer one-axis differences; NOT certified exact. */
export function estimatedV117WretchUnbuffedDefense(stats){
 if(!checked(stats))throw new RangeError('Eight whole attribute levels from 1 to 99 required.');
 if(stats.some(s=>s<10))return null;
 const lvl=stats.reduce((a,b)=>a+b,0)-79;
 const base=baseLevel[lvl-1];
 return Object.freeze(base.map((n,k)=>n+
  KEYS.reduce((s,key,i)=>s+bonuses[key][stats[i]-10][k],0)));
}
export function observedV117WretchDefense(stats,{origin='Wretch'}={}){
 if(!checked(stats))throw new RangeError('Eight whole attribute levels from 1 to 99 required.');
 if(origin!=='Wretch')return{status:'not-verified-other-origin',values:null,
  level:stats.reduce((a,b)=>a+b,0)-79,
  note:'Actual reference defenses were measured for naked Wretch only; another origin is not independently certified.'};
 if(stats.some(s=>s<10))return{status:'not-verified-below-10',values:null,
  level:stats.reduce((a,b)=>a+b,0)-79,
  note:'Reference sweeps cover naked Wretch attributes 10–99 only.'};
 const level=stats.reduce((a,b)=>a+b,0)-79;
 const exact=directByStats.get(stats.join(','));
 if(exact)return{status:exact.status,values:exact.values,level,
  note:'Real Tarnished.dev v1.17 SAME-EIGHT-ATTRIBUTE naked Wretch browser result. '+exact.source+
   '. Does not include equipped armor, rune, Physick or buffs.'};
 return{status:'estimated-not-site-certified',values:estimatedV117WretchUnbuffedDefense(stats),
  level,note:'Derived from real naked-Wretch v1.17 level and single-attribute measurements, NOT directly observed for this mixed combination. 16 independent held-out builds: 142/160 fields equal, the other 18 differed by 1; this is NOT an error bound for arbitrary builds. No equipment effects.'};
}
/** Keep the provenance explicit in independent tests without exposing internals as parity. */
export const V117_WRETCH_VERIFIED_PROFILE_COUNT=directByStats.size;
