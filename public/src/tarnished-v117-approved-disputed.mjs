import {makeTarnishedSameInputUrl,TARNISHED_V117_AFFINITIES} from './tarnished-same-input.mjs';
import {V117_DISPUTED_UI_CANDIDATES} from '../../scripts/tarnished-v117-disputed-candidates.mjs';
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
 V117_DISPUTED_UI_CANDIDATES.map((c,index)=>{
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
