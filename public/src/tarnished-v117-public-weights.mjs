/** Limited public Tarnished.dev v1.17 single-item Equip Load observations.
 * Not from another community database or an inferred AR/scaling formula.
 * Each value is the delta versus 0.0 empty equip load in TWO independently
 * opened Chromium pages, with valid weapon selection/affinity/AR/controls.
 * The 3.5 Longsword both-hand control passed in BOTH rounds.
 * Exact audit: https://github.com/garrison2025/Elden-Ring/actions/runs/41257042883
 * No game-client version equivalence or third-party code reuse is claimed.
 */
const rows=Object.freeze([
 ['Albinauric Shield',4.5,'missing-primary-weight'],
 ['Brass Shield',7,'missing-primary-weight'],
 ['Fingerprint Stone Shield',29,'missing-primary-weight'],
 ['Golden Greatshield',17,'missing-primary-weight'],
 ['Great Turtle Shell',5.5,'missing-primary-weight'],
 ['Stone-Sheathed Sword',5,'known-community-weight-disagreement'],
 ["Fire Knight's Shortsword",2,'matched-community-weight'],
 ['Greatsword of Radahn (Light)',19,'matched-community-weight'],
 ['Ritual Thrusting Shield',10,'matched-community-weight']
]);
export const TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE=Object.freeze(
 rows.map(([weaponName,weight,evidenceCategory])=>Object.freeze({
  weaponName,weight,evidenceCategory,source:'Tarnished.dev public Build Calculator',
  comparatorVersion:'1.17',observedDate:'2026-11-01',
  evidenceRun:41257042883,observedTwice:true,verifiedSingleItem:true,
  baseAttackVerified:false,requirementsVerified:false,
  gameClientVerified:false
 }))
);
const map=new Map(TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE.map(v=>[v.weaponName,v]));
export function getTarnishedV117DirectWeight(weaponName){
 return typeof weaponName==='string'?map.get(weaponName)??null:null;
}
