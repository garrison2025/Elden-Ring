import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';
import {TARNISHED_REFERENCE_AR_CASES} from '../public/src/tarnished-reference-benchmark.mjs';
import {TARNISHED_V117_AFFINITIES} from '../public/src/tarnished-same-input.mjs';
import {V117_ADDITIONAL_UI_CANDIDATES} from './tarnished-v117-extra-candidates.mjs';
import {V117_NEW_OBSERVED_AR,V117_NEW_OBSERVATION_RUN_IDS} from './tarnished-v117-35-observed-ui-totals.mjs';

export function auditComparatorRounding(source){
 if(!source||!Array.isArray(source.weapons)||source.weapons.length!==3296)
  throw new RangeError('Exact pinned v1.17 source required.');
 if(TARNISHED_REFERENCE_AR_CASES.length<15||V117_ADDITIONAL_UI_CANDIDATES.length!==35||
  Object.keys(V117_NEW_OBSERVED_AR).length!==35||V117_NEW_OBSERVATION_RUN_IDS.length!==2)
  throw new RangeError('Two-run 50-input competitor comparison evidence not complete.');
 const cases=[
  ...TARNISHED_REFERENCE_AR_CASES.slice(0,15).map(x=>({
   id:x.id,weaponName:x.weaponName,affinityId:x.affinityId,
   stats:x.playerStats,upgrade:x.upgrade,twoHanded:x.twoHanded,
   observed:x.expectedTotal,provenance:'prior-15'
  })),
  ...V117_ADDITIONAL_UI_CANDIDATES.map(x=>({
   id:x.id,weaponName:x.weaponName,
   affinityId:x.affinity==='None'?-1:TARNISHED_V117_AFFINITIES.indexOf(x.affinity),
   stats:{str:x.str,dex:x.dex,int:x.int,fai:x.fai,arc:x.arc},
   upgrade:x.upgrade,twoHanded:x.twoHanded,
   observed:V117_NEW_OBSERVED_AR[x.id],provenance:'twice-observed-new-35'
  }))
 ];
 const results=[];
 for(const c of cases){
  const variants=source.weapons.filter(w=>(w.weaponName??w.name)===c.weaponName&&
   w.affinityId===c.affinityId);
  if(variants.length!==1||!Number.isInteger(c.observed)){
   results.push({id:c.id,status:'missing-or-ambiguous-input'});continue;
  }
  try{
   const profile=convertCompactRegulation(source,{weaponName:variants[0].name,
    gameVersion:'1.17',sourceReference:'Pinned public JSON, distinct from Tarnished.dev UI'});
   const calc=calculateAr(profile,c.stats,{
    upgrade:c.upgrade,twoHanded:c.twoHanded,affinity:'SOURCE AFFINITY'});
   results.push({id:c.id,observed:c.observed,
    currentComponentFloor:calc.floorComponents,
    alternativeFloorRawSum:calc.floorTotal,
    componentDelta:calc.floorComponents-c.observed,
    rawSumDelta:calc.floorTotal-c.observed,
    status:calc.floorTotal===c.observed?'raw-sum-matches':
     'raw-sum-mismatch'});
  }catch(error){
   results.push({id:c.id,status:'conversion-error',reason:String(error.message).slice(0,150)});
  }
 }
 const matches=field=>results.filter(x=>x[field]===0).length;
 return {
  version:'Tarnished.dev v1.17 public UI',cases:results.length,
  componentFloorMatches:matches('componentDelta'),
  rawSumFloorMatches:matches('rawSumDelta'),
  rawSumMismatches:results.filter(x=>x.rawSumDelta!==0),
  all50MatchFloorRawSum:results.length===50&&matches('rawSumDelta')===50,
  source:'Tarnished.dev actual two-run UI totals, independent downloaded source math',
  gameClientRequired:false,results
 };
}
export async function run(){
 const source=JSON.parse((await downloadV117Source(fetch)).text);
 const report=auditComparatorRounding(source);
 console.log('[COMPARATOR ROUNDING] total='+report.cases+
  ' old-per-component='+report.componentFloorMatches+
  '/50 alternative-floor-after-sum='+report.rawSumFloorMatches+'/50');
 if(report.rawSumMismatches.length)
  console.log('[COMPARATOR ROUNDING] mismatches='+JSON.stringify(report.rawSumMismatches.slice(0,12)));
 console.log('[COMPARATOR ROUNDING] site sources: '+V117_NEW_OBSERVATION_RUN_IDS.join(', '));
 if(!report.all50MatchFloorRawSum)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url==='file://'+process.argv[1])
 await run();
