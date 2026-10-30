import {convertCompactRegulation} from './regulation-import.mjs';
import {calculateAr,POWER_STATS} from './weapon-ar.mjs';

/**
 * Secondary, independently published *regulation-derived* figures from a
 * site that names ELDEN RING Regulation 1.17.3, build 25827938.
 * These are not independently observed in-game equipment-screen screenshots.
 *
 * Table: https://almanauts.com/eldenring/weapons/
 * It labels results "AR at min. stats" / fully upgraded. The comparator uses
 * a documented baseline of 10 for non-required or sub-10 attributes; this
 * keeps the full modeled character stat vector explicit rather than inferred.
 */
export const CURRENT_REFERENCE_VERSION='1.17.3';
export const CURRENT_REFERENCE_BUILD='25827938';
export const CURRENT_REFERENCE_URL='https://almanauts.com/eldenring/weapons/';
export const CURRENT_REFERENCE_CHECKED_DATE='2026-10-29';
export const CURRENT_REFERENCE_SAMPLES=Object.freeze([
 Object.freeze({id:'build-25827938-01',name:"Royal Greatsword",expectedTotal:788,requirements:Object.freeze([26,18,22,0,0])}),
 Object.freeze({id:'build-25827938-02',name:"Rellana's Twin Blades",expectedTotal:700,requirements:Object.freeze([13,16,16,16,0])}),
 Object.freeze({id:'build-25827938-03',name:"Blasphemous Blade",expectedTotal:652,requirements:Object.freeze([22,15,0,21,0])}),
 Object.freeze({id:'build-25827938-04',name:"Sword of Night and Flame",expectedTotal:615,requirements:Object.freeze([12,12,24,24,0])}),
 Object.freeze({id:'build-25827938-05',name:"Treespear",expectedTotal:611,requirements:Object.freeze([15,22,0,18,0])}),
 Object.freeze({id:'build-25827938-06',name:"Dragon Greatclaw",expectedTotal:650,requirements:Object.freeze([30,14,0,0,0])}),
 Object.freeze({id:'build-25827938-07',name:"Carian Knight's Sword",expectedTotal:503,requirements:Object.freeze([10,10,18,0,0])}),
 Object.freeze({id:'build-25827938-08',name:"Ancient Meteoric Ore Greatsword",expectedTotal:717,requirements:Object.freeze([35,10,0,0,19])}),
 Object.freeze({id:'build-25827938-09',name:"Fire Knight's Greatsword",expectedTotal:584,requirements:Object.freeze([22,18,0,12,0])}),
 Object.freeze({id:'build-25827938-10',name:"Great Club",expectedTotal:715,requirements:Object.freeze([35,0,0,0,0])}),
 Object.freeze({id:'build-25827938-11',name:"Longsword",expectedTotal:308,requirements:Object.freeze([10,10,0,0,0])}),
 Object.freeze({id:'build-25827938-12',name:"Reduvia",expectedTotal:265,requirements:Object.freeze([5,13,0,0,13])}),
 Object.freeze({id:'build-25827938-13',name:"Rabbath's Cannon",expectedTotal:756,requirements:Object.freeze([28,16,0,0,0])}),
 Object.freeze({id:'build-25827938-14',name:"Jar Cannon",expectedTotal:672,requirements:Object.freeze([34,12,0,0,0])})
]);
const fail=s=>{throw new RangeError(s)};
const keys=POWER_STATS;
const rec=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);

/**
 * Strictly compare reported +max AR against the pinned older 1.17 converter,
 * with explicit 2026-reference requirements. Do not mark the older source as
 * regulation-1.17.3-certified merely because these 14 examples agree.
 */
export function auditCurrentReferenceAr(source,{
 samples=CURRENT_REFERENCE_SAMPLES,sourceVersion='1.17',
 sourceReference='Pinned public community regulation'
}={}){
 if(!rec(source)||!Array.isArray(source.weapons)||!source.weapons.length||
    !Array.isArray(samples)||!samples.length||samples.length>100||
    typeof sourceVersion!=='string'||!sourceVersion.trim()||
    typeof sourceReference!=='string'||!sourceReference.trim())
  fail('Invalid source or current-version reference samples.');
 const seen=new Set(),errors=[],groups=new Set();
 let compared=0,matched=0;
 for(const sample of samples){
  if(!rec(sample)||typeof sample.id!=='string'||!/^build-[0-9]{8}-[0-9]{2,3}$/.test(sample.id)||
     seen.has(sample.id)||typeof sample.name!=='string'||!sample.name.trim()||sample.name.length>120||
     !Number.isInteger(sample.expectedTotal)||sample.expectedTotal<0||sample.expectedTotal>20000||
     !Array.isArray(sample.requirements)||sample.requirements.length!==5||
     sample.requirements.some(x=>!Number.isInteger(x)||x<0||x>99))
   fail('Invalid or duplicate current reference sample.');
  seen.add(sample.id);
  groups.add(sample.name);
  const options=source.weapons.filter(w=>w?.name===sample.name &&
    (w.affinityId===0||w.affinityId===-1));
  if(options.length!==1){
   errors.push({id:sample.id,reason:options.length?'ambiguous-neutral-affinity':'not-in-pinned-source'});
   continue;
  }
  const item=options[0],raw=keys.map(k=>item.requirements?.[k]??0);
  if(raw.some((n,i)=>n!==sample.requirements[i])){
   errors.push({id:sample.id,reason:'published-requirements-differ'});
   continue;
  }
  const stats=Object.fromEntries(keys.map((k,i)=>[k,Math.max(10,sample.requirements[i])]));
  try{
   const profile=convertCompactRegulation(source,{
    weaponName:item.name,gameVersion:sourceVersion,sourceReference});
   const upgrades=profile.affinities['SOURCE AFFINITY'].upgrades;
   const last=upgrades.at(-1)?.level;
   if(last!==25&&last!==10)throw new RangeError('Unsupported reinforcement limit.');
   const result=calculateAr(profile,stats,{upgrade:last,twoHanded:false});
   compared++;
   if(result.total===sample.expectedTotal)matched++;
   else errors.push({id:sample.id,reason:'published-total-ar-differs'});
  }catch{
   errors.push({id:sample.id,reason:'source-conversion-or-calculation-error'});
  }
 }
 return {
  schemaVersion:1,auditType:'SECONDARY 1.17.3 REFERENCE vs PINNED 1.17 MATH',
  benchmarkGameBuild:CURRENT_REFERENCE_BUILD,
  benchmarkRegulation:CURRENT_REFERENCE_VERSION,
  benchmarkPublishedDate:CURRENT_REFERENCE_CHECKED_DATE,
  benchmarkCount:samples.length,
  uniqueWeaponNames:groups.size,
  compared,matched,failed:samples.length-matched,
  failures:errors,allMatched:matched===samples.length,
  sourceVersionCompared:sourceVersion,
  parameterVersionExactMatch:sourceVersion===CURRENT_REFERENCE_VERSION,
  currentGameScreenshotCount:0,
  gameClientVerified:false,releaseGatePassed:false,
  sourceDataExported:false,
  note:'Exact numeric agreement with a separately published game-param-derived 1.17.3 table. This is not screenshot-verified current-game AR, and it does not independently prove that the entire older 1.17 dataset matches 1.17.3.'
 };
}
