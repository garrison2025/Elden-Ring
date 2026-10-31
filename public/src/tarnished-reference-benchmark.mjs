import {convertCompactRegulation} from './regulation-import.mjs';
import {calculateAr,POWER_STATS} from './weapon-ar.mjs';

/** Named public UI observations: first rendered through site scraping then
 * read in a real GitHub-hosted Chrome browser; five cases from run 41180413857.
 * A reference may count as repeatable only when independently observed in a
 * later browser run with the exact UI inputs confirmed. None certifies game.
 * Tarnished.dev and Tarnished.app are unrelated sources.
 */
export const TARNISHED_REFERENCE_AR_CASES=Object.freeze([
 Object.freeze({
  id:'tarnished-v117-uchigatana-standard-plus0-40str40dex-1h',
  weaponName:'Uchigatana',affinity:'Standard',affinityId:0,
  playerStats:Object.freeze({str:40,dex:40,int:10,fai:10,arc:10}),
  upgrade:0,twoHanded:false,expectedTotal:172,
  sourceVersion:'1.17',sourceObservedDate:'2026-10-31',
  sourceUrl:'https://www.tarnished.dev/build-planner?str=40&dex=40&int=10&fai=10&arc=10&rh1=Uchigatana&aRh1=Standard&smith=0&somber=0&twoHanded=false',
  observedDisplay:'Equipped Right Hand 1 / Uchigatana / Standard / Scaling D-D / Total AR : 172',
  referenceObservedOnce:true,sourceRepeatable:true,
  note:'Observed in public rendered page and independently repeated by free GitHub-hosted Chrome. Requires final checkbox/input verification in the live browser probe before benchmark release.'
 }),
 Object.freeze({
  id:'tarnished-v117-uchigatana-standard-plus0-min12-15-1h',
  weaponName:'Uchigatana',affinity:'Standard',affinityId:0,
  playerStats:Object.freeze({str:12,dex:15,int:10,fai:10,arc:10}),
  upgrade:0,twoHanded:false,expectedTotal:133,
  sourceVersion:'1.17',sourceObservedDate:'2026-10-31',
  sourceUrl:'https://www.tarnished.dev/build-planner?str=12&dex=15&int=10&fai=10&arc=10&rh1=Uchigatana&aRh1=Standard&smith=0&somber=0&twoHanded=false',
  observedDisplay:'Equipped Right Hand 1 / Uchigatana / Standard / Scaling D/D/-/-/- / Total AR : 133',
  referenceObservedOnce:true,sourceRepeatable:false,
  note:'Observed as rendered site AR by GitHub-hosted Chromium #41180413857. Requires an additional independently input-verified live Chrome pass.'
 }),
 Object.freeze({
  id:'tarnished-v117-uchigatana-standard-plus25-40str40dex-1h',
  weaponName:'Uchigatana',affinity:'Standard',affinityId:0,
  playerStats:Object.freeze({str:40,dex:40,int:10,fai:10,arc:10}),
  upgrade:25,twoHanded:false,expectedTotal:491,
  sourceVersion:'1.17',sourceObservedDate:'2026-10-31',
  sourceUrl:'https://www.tarnished.dev/build-planner?str=40&dex=40&int=10&fai=10&arc=10&rh1=Uchigatana&aRh1=Standard&smith=25&somber=0&twoHanded=false',
  observedDisplay:'Equipped Right Hand 1 / Uchigatana / Standard / Scaling D/C/-/-/- / Total AR : 491',
  referenceObservedOnce:true,sourceRepeatable:false,
  note:'Observed as rendered site AR by GitHub-hosted Chromium #41180413857. Requires an additional independently input-verified live Chrome pass.'
 }),
 Object.freeze({
  id:'tarnished-v117-uchigatana-keen-plus25-40str40dex-1h',
  weaponName:'Uchigatana',affinity:'Keen',affinityId:2,
  playerStats:Object.freeze({str:40,dex:40,int:10,fai:10,arc:10}),
  upgrade:25,twoHanded:false,expectedTotal:488,
  sourceVersion:'1.17',sourceObservedDate:'2026-10-31',
  sourceUrl:'https://www.tarnished.dev/build-planner?str=40&dex=40&int=10&fai=10&arc=10&rh1=Uchigatana&aRh1=Keen&smith=25&somber=0&twoHanded=false',
  observedDisplay:'Equipped Right Hand 1 / Uchigatana / Keen / Scaling E/A/-/-/- / Total AR : 488',
  referenceObservedOnce:true,sourceRepeatable:false,
  note:'Observed as rendered site AR by GitHub-hosted Chromium #41180413857. Requires an additional independently input-verified live Chrome pass.'
 }),
 Object.freeze({
  id:'tarnished-v117-uchigatana-standard-plus0-40str40dex-2h',
  weaponName:'Uchigatana',affinity:'Standard',affinityId:0,
  playerStats:Object.freeze({str:40,dex:40,int:10,fai:10,arc:10}),
  upgrade:0,twoHanded:true,expectedTotal:180,
  sourceVersion:'1.17',sourceObservedDate:'2026-10-31',
  sourceUrl:'https://www.tarnished.dev/build-planner?str=40&dex=40&int=10&fai=10&arc=10&rh1=Uchigatana&aRh1=Standard&smith=0&somber=0&twoHanded=true',
  observedDisplay:'Equipped Right Hand 1 / Uchigatana / Standard / Scaling D/D/-/-/- / Total AR : 180',
  referenceObservedOnce:true,sourceRepeatable:false,
  note:'Observed as rendered site AR by GitHub-hosted Chromium #41180413857. Requires an additional independently input-verified live Chrome pass.'
 })
]);
const fail=s=>{throw new RangeError(s)};
const same=(a,b)=>a.every((x,i)=>x===b[i]);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
export function auditTarnishedV117ReferenceAR(source,{cases=TARNISHED_REFERENCE_AR_CASES}={}){
 if(!record(source)||!Array.isArray(source.weapons)||source.weapons.length===0||
  !Array.isArray(cases)||cases.length<1||cases.length>100)
  fail('Source must be a non-empty regulation and samples must be present.');
 const seen=new Set(),results=[];
 for(const item of cases){
  if(!record(item)||typeof item.id!=='string'||item.id.length>120||seen.has(item.id)||
   typeof item.weaponName!=='string'||!item.weaponName.trim()||item.weaponName.length>120||
   !['Standard','Heavy','Keen','Quality','Magic','Fire','Flame Art','Lightning','Sacred','Poison','Blood','Cold','Occult','None'].includes(item.affinity)||
   !Number.isInteger(item.affinityId)||item.affinityId<0||item.affinityId>50||
   !Number.isInteger(item.upgrade)||item.upgrade<0||item.upgrade>25||
   typeof item.twoHanded!=='boolean'||
   !record(item.playerStats)||!POWER_STATS.every(s=>Number.isInteger(item.playerStats[s])&&
     item.playerStats[s]>=1&&item.playerStats[s]<=99)||
   !Number.isInteger(item.expectedTotal)||item.expectedTotal<1||item.expectedTotal>20000||
   item.sourceVersion!=='1.17'||!/^https:\/\/www\.tarnished\.dev\/(?:build-planner|weapon-calculator)\?/.test(item.sourceUrl)||
   !/^\d{4}-\d\d-\d\d$/.test(item.sourceObservedDate)||
   typeof item.observedDisplay!=='string'||!item.observedDisplay.includes('Total AR : ' + item.expectedTotal)||
   item.referenceObservedOnce!==true||typeof item.sourceRepeatable!=='boolean')
   fail('Malformed benchmark or unsupported external source/claim.');
  seen.add(item.id);
  const variants=source.weapons.filter(w=>(w?.weaponName??w?.name)===item.weaponName&&w.affinityId===item.affinityId);
  if(variants.length!==1){results.push({
    id:item.id,weapon:item.weaponName,expected:item.expectedTotal,actual:null,
    status:variants.length?'ambiguous-weapon-variant':'source-variant-missing',
    sourceRepeatable:item.sourceRepeatable});continue;}
  const w=variants[0];
  try{
   const profile=convertCompactRegulation(source,{
    weaponName:w.name,gameVersion:'1.17',sourceReference:'Pinned public community 1.17 data'
   });
   const result=calculateAr(profile,item.playerStats,{
    affinity:'SOURCE AFFINITY',upgrade:item.upgrade,twoHanded:item.twoHanded});
   results.push({
    id:item.id,weapon:item.weaponName,expected:item.expectedTotal,actual:result.total,
    status:result.total===item.expectedTotal?'numeric-match':'numeric-mismatch',
    sourceRepeatable:item.sourceRepeatable,missingRequirements:result.missingRequirements.length>0
   });
  }catch(error){
   results.push({id:item.id,weapon:item.weaponName,expected:item.expectedTotal,actual:null,
    status:'conversion-blocked',reason:String(error.message).slice(0,160),
    sourceRepeatable:item.sourceRepeatable});
  }
 }
 const matched=results.filter(x=>x.status==='numeric-match').length;
 const failed=results.length-matched;
 const rechecked=results.filter(x=>x.sourceRepeatable).length;
 const unique=new Set(cases.map(x=>x.weaponName)).size;
 const gripCases=new Set(cases.map(x=>String(x.twoHanded)));
 const upgradeCases=new Set(cases.map(x=>x.upgrade));
 const affinityCases=new Set(cases.map(x=>x.affinity));
 // No green release badge from single result or a capture that can't be retrieved.
 const referenceReleaseReady=failed===0&&results.length>=12&&
  rechecked===results.length&&unique>=4&&gripCases.size===2&&
  upgradeCases.size>=3&&affinityCases.size>=3;
 return {
  source:'tarnished.dev (not tarnished.app)',version:'1.17',
  candidateCount:results.length,matched,failed,recheckedReferenceCases:rechecked,
  referenceReleaseReady,
  currentGameClientVerified:false,regulation1173Certified:false,
  screenshotCount:0,results
 };
}
