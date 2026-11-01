import {makeTarnishedSameInputUrl,TARNISHED_V117_AFFINITIES} from './tarnished-same-input.mjs';
const rows=Object.freeze([["conflict-fire-knights-shortsword","Fire Knight's Shortsword","Standard",0,12,18,10,18,10,false,false],["conflict-radahn-light","Greatsword of Radahn (Light)","None",0,40,30,20,10,10,false,true],["conflict-radahn-lord","Greatsword of Radahn (Lord)","None",10,40,30,20,10,10,false,true],["conflict-madding-hand","Madding Hand","None",0,20,20,20,20,10,false,true],["conflict-queeligns-greatsword","Queelign's Greatsword","Standard",0,20,25,10,20,10,false,false],["conflict-smithscript-axe","Smithscript Axe","Standard",0,20,15,15,15,10,false,false],["conflict-smithscript-dagger","Smithscript Dagger","Standard",0,10,20,20,20,10,false,false],["conflict-stone-sheathed","Stone-Sheathed Sword","None",0,25,15,10,10,10,false,true],["conflict-barbed-staff-spear","Barbed Staff-Spear","None",0,20,25,10,30,10,false,true],["conflict-claws-of-night","Claws of Night","None",0,12,30,10,10,10,false,true],["conflict-falx","Falx","None",0,20,30,10,10,10,false,true],["conflict-messmer-soldier-spear","Messmer Soldier's Spear","Standard",0,30,30,10,10,10,false,false],["conflict-swift-spear","Swift Spear","Standard",0,20,35,10,10,10,false,false],["conflict-ritual-thrusting-shield","Ritual Thrusting Shield","Standard",0,25,25,10,10,10,false,false],["missing-albinauric-shield","Albinauric Shield","Standard",0,20,20,10,10,10,false,false],["missing-brass-shield","Brass Shield","Standard",0,20,20,10,10,10,false,false],["missing-fingerprint-stone-shield","Fingerprint Stone Shield","Standard",0,50,20,10,10,10,false,false],["missing-golden-greatshield","Golden Greatshield","Standard",0,50,20,10,10,10,false,false]]);
const publicCandidates=Object.freeze(rows.map(row=>{
 const [id,weaponName,affinity,upgrade,str,dex,int,fai,arc,twoHanded,somber]=row;
 return Object.freeze({id,weaponName,affinity,upgrade,str,dex,int,fai,arc,twoHanded,somber});
}));
/** 18 high-risk catalog entries: actual Tarnished.dev public v1.17 UI AR
 * independently observed TWICE in fresh Chromium instances and matched to
 * local source-parameter mathematics. Reads documented in:
 * https://github.com/garrison2025/Elden-Ring/actions/runs/41256014056
 * https://github.com/garrison2025/Elden-Ring/actions/runs/41256043633
 * These are AR observations ONLY, not independently validated weight,
 * minimum stat requirements, base +0 attack components or full patch accuracy.
 */
const observedTotals=Object.freeze([111,265,762,138,189,159,78,114,211,168,138,169,132,165,86,93,184,150]);
export const TARNISHED_V117_18_APPROVED_DISPUTED=Object.freeze(
 publicCandidates.map((c,index)=>{
  const affinityId=c.affinity==='None'?-1:TARNISHED_V117_AFFINITIES.indexOf(c.affinity);
  const expectedTotal=observedTotals[index];
  if(affinityId< -1||!Number.isInteger(expectedTotal)||expectedTotal<=0)
   throw new RangeError('Invalid twice-observed Tarnished.dev v1.17 high-risk AR reference.');
  const playerStats=Object.freeze({str:c.str,dex:c.dex,int:c.int,fai:c.fai,arc:c.arc});
  return Object.freeze({
   id:'tarnished-v117-'+c.id,weaponName:c.weaponName,affinity:c.affinity,affinityId,
   upgrade:c.upgrade,twoHanded:c.twoHanded,playerStats,expectedTotal,
   sourceVersion:'1.17',sourceObservedDate:'2026-11-01',
   sourceUrl:makeTarnishedSameInputUrl({weaponName:c.weaponName,
    affinityId,upgrade:c.upgrade,stats:playerStats,twoHanded:c.twoHanded,
    reinforcement:c.somber?'somber':'smithing'}),
   observedDisplay:'Equipped Right Hand 1 / '+c.weaponName+' / '+c.affinity+
    ' / Total AR : '+expectedTotal,
   referenceObservedOnce:true,sourceRepeatable:true,
   evidenceRuns:Object.freeze([41256014056,41256043633]),
   unresolvedSourceFields:Object.freeze(['base attack components','weight','minimum attribute requirements']),
   note:'Same v1.17 competitor UI total and exact input fields in two Chrome visits; source-conflict/unknown catalog fields remain unapproved.'
  });
 })
);
