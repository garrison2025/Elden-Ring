import {convertCompactRegulation} from './regulation-import.mjs';
import {calculateAr,POWER_STATS} from './weapon-ar.mjs';

/**
 * Historical player-reported AR observations (NOT verified screenshots, and
 * NOT evidence of Regulation 1.17.3 parity).
 *
 * The source reports 3 Heavy Greatsword +25 examples. Only Strength is material
 * to this Heavy affinity's attack scaling. DEX 12 meets the weapon's requirement;
 * remaining attributes are explicit 10-point neutral assumptions, not quoted.
 */
export const HISTORICAL_AR_REPORTS=Object.freeze([
 Object.freeze({
  id:'player-heavy-greatsword-54str-2h-2024',
  weaponName:'Heavy Greatsword',upgrade:25,twoHanded:true,
  stats:Object.freeze({str:54,dex:12,int:10,fai:10,arc:10}),
  expectedTotal:826,
  sourceUrl:'https://www.reddit.com/r/Eldenring/comments/1ahuhm4/',
  sourceDate:'2024-02-03',
  evidenceTier:'historical-public-player-claim-not-screenshot',
  assumedNonScalingStats:true
 }),
 Object.freeze({
  id:'player-heavy-greatsword-66str-2h-2024',
  weaponName:'Heavy Greatsword',upgrade:25,twoHanded:true,
  stats:Object.freeze({str:66,dex:12,int:10,fai:10,arc:10}),
  expectedTotal:853,
  sourceUrl:'https://www.reddit.com/r/Eldenring/comments/1ahuhm4/',
  sourceDate:'2024-02-03',
  evidenceTier:'historical-public-player-claim-not-screenshot',
  assumedNonScalingStats:true
 }),
 Object.freeze({
  id:'player-heavy-greatsword-91str-1h-2024',
  weaponName:'Heavy Greatsword',upgrade:25,twoHanded:false,
  stats:Object.freeze({str:91,dex:12,int:10,fai:10,arc:10}),
  expectedTotal:841,
  sourceUrl:'https://www.reddit.com/r/Eldenring/comments/1dxyvfs/',
  sourceDate:'2024-07-08',
  evidenceTier:'historical-public-player-claim-not-screenshot',
  assumedNonScalingStats:true
 })
]);

const fail=m=>{throw new RangeError(m);};
const isRecord=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);

/**
 * Compare explicitly sourced, externally reported AR with the imported 1.17
 * parameter model. The output is aggregate-only, never game-certifying.
 * A future independent game-menu screenshot requires a separate evidence tier.
 */
export function auditHistoricalPlayerAr(regulation,{
 gameVersion='1.17',sourceReference='Pinned community parameter snapshot',
 samples=HISTORICAL_AR_REPORTS
}={}){
 if(!isRecord(regulation)||!Array.isArray(regulation.weapons)||!Array.isArray(samples)||
    samples.length<1||samples.length>50)fail('Invalid external AR audit inputs.');
 const seen=new Set(),failures=[];let matched=0,checked=0;
 for(const sample of samples){
  if(!isRecord(sample)||typeof sample.id!=='string'||
   !/^[a-z0-9-]{5,90}$/.test(sample.id)||seen.has(sample.id)||
   typeof sample.weaponName!=='string'||sample.weaponName.length>120||
   !Number.isInteger(sample.upgrade)||sample.upgrade<0||sample.upgrade>25||
   typeof sample.twoHanded!=='boolean'||!Number.isInteger(sample.expectedTotal)||
   sample.expectedTotal<0||sample.expectedTotal>20000||!isRecord(sample.stats)||
   !POWER_STATS.every(s=>Number.isInteger(sample.stats[s])&&sample.stats[s]>=1&&sample.stats[s]<=99)||
   typeof sample.sourceUrl!=='string'||!sample.sourceUrl.startsWith('https://')||
   typeof sample.sourceDate!=='string'||!/^20\d\d-\d\d-\d\d$/.test(sample.sourceDate)||
   typeof sample.evidenceTier!=='string')
   fail('Malformed or unsupported external AR evidence sample.');
  seen.add(sample.id);
  checked++;
  try{
   const profile=convertCompactRegulation(regulation,{
    weaponName:sample.weaponName,gameVersion,sourceReference});
   const result=calculateAr(profile,sample.stats,{
    upgrade:sample.upgrade,twoHanded:sample.twoHanded});
   if(result.total===sample.expectedTotal)matched++;
   else failures.push({id:sample.id,reason:'historical-reported-ar-differs'});
  }catch{
   failures.push({id:sample.id,reason:'conversion-or-ar-calculation-failed'});
  }
 }
 return {
  auditType:'HISTORICAL EXTERNAL PLAYER REPORTS — NOT SCREENSHOT GOLDENS',
  checked,matched,failed:checked-matched,failures,
  sourceCategory:'public-player-posts-2024',
  matchRate:Math.round(matched/checked*10000)/100,
  sameGameVersionConfirmed:false,gameClientVerified:false,
  screenshotEvidenceCount:0,
  currentRegulationVerified:false,
  releaseGatePassed:false,
  note:'Matches historical Reddit-reported AR under explicit non-scaling stat assumptions. No matching 2026 regulation version or independent game-menu screenshot is available. Numeric parity is a regression signal, not proof of accuracy.'
 };
}
