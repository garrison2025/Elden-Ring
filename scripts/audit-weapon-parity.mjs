/**
 * A release-readiness REPORT, not a certification or test runner against an
 * external game client. Sources: checked-in catalog and independently observed,
 * pinned Tarnished.dev v1.17 reference UI cases.
 *
 * Run: npm run audit:weapon-parity
 * This reports NOT_READY without failing CI; only an actual broken invariant
 * should fail a software test. No requests, scraping or paid API.
 */
import {readFile} from 'node:fs/promises';
import {validateCommunityCatalog,hasDisputedAttack,hasDisputedRequirements,
 hasDisputedWeight} from '../public/src/community-weapons.mjs';
import {TARNISHED_REFERENCE_AR_CASES} from '../public/src/tarnished-reference-benchmark.mjs';

const conflicting=w=>hasDisputedAttack(w)||hasDisputedRequirements(w)||hasDisputedWeight(w);
export function summarizeWeaponParity(catalog,benchmarks){
 validateCommunityCatalog(catalog);
 if(!Array.isArray(benchmarks))throw new TypeError('Expected an array of actual reference observations.');
 const weapons=catalog.weapons;
 const counts={
  total:weapons.length,
  baseGame:weapons.filter(w=>!w.expansion).length,
  shadowOfTheErdtree:weapons.filter(w=>w.expansion==='Shadow of the Erdtree').length,
  tarnishedPack:weapons.filter(w=>w.expansion==='Tarnished Pack').length,
  reportedPrimaryAttack:weapons.filter(w=>Array.isArray(w.attack)).length,
  reportedPrimaryRequirements:weapons.filter(w=>Array.isArray(w.requirements)).length,
  reportedPrimaryWeight:weapons.filter(w=>Number.isFinite(w.weight)).length,
  sourceOnlyMissingPrimaryAttackWeight:weapons.filter(w=>
   w.flags?.includes('source-v117-neutral-requirements-only')&&
   w.attack===null&&w.weight===null).length,
  sourceConflicts:weapons.filter(conflicting).length,
  primaryThreeFieldsWithNoKnownConflict:weapons.filter(w=>
   Array.isArray(w.attack)&&Array.isArray(w.requirements)&&
   Number.isFinite(w.weight)&&!conflicting(w)).length,
  embeddedPreciseArProfiles:weapons.filter(w=>w.arParameters!=null).length,
  v117ReferenceUiObservations:benchmarks.filter(c=>
   c.sourceVersion==='1.17'&&c.referenceObservedOnce===true&&
   c.sourceRepeatable===true&&Number.isInteger(c.expectedTotal)).length
 };
 const observedIds=benchmarks.map(c=>c.id);
 if(new Set(observedIds).size!==observedIds.length)
  throw new RangeError('Repeated external UI sample ID is not new independent evidence.');
 if(counts.primaryThreeFieldsWithNoKnownConflict+counts.sourceConflicts+
    counts.sourceOnlyMissingPrimaryAttackWeight>counts.total)
  throw new RangeError('Overlapping source-quality categories cannot be reported as disjoint.');
 const gates=[
  {id:'catalog-source-candidates',title:'Review 72 research-only primary attack/weight gaps',
   pass:counts.sourceOnlyMissingPrimaryAttackWeight===0,
   observed:counts.sourceOnlyMissingPrimaryAttackWeight,target:0},
  {id:'known-source-conflicts',title:'Resolve 9 explicitly known community numerical source disagreements',
   pass:counts.sourceConflicts===0,observed:counts.sourceConflicts,target:0},
  {id:'pinned-v117-50-reference-cases',title:'Reach at least 50 externally observed, exact-input v1.17 cases across stated coverage',
   pass:counts.v117ReferenceUiObservations>=50,
   observed:counts.v117ReferenceUiObservations,target:50},
  {id:'independent-v117-ar-ranking',title:'Verified multi-weapon same-build AR ranking rather than only one selected AR or +0 fact comparisons',
   pass:false,observed:'NOT_IMPLEMENTED',target:'IMPLEMENTED_AND_BROWSER_TESTED'},
  {id:'dataset-rights-and-version-review',title:'Document source rights and version scope for each release dataset; v1.17 is not Regulation 1.17.3 certification',
   pass:false,observed:'NOT_APPROVED',target:'REVIEWED_WITH_EVIDENCE'},
  {id:'v117-patch-client-certification',title:'Separate current-game-client goldens from third-party v1.17 UI observations',
   pass:false,observed:'NO_CERTIFIED_SUITE_RECOVERED_IN_THIS_AUDIT',
   target:'VERSIONED_INDEPENDENT_GAME_EVIDENCE'}
 ];
 return {
  schemaVersion:1,project:'Elden Ring Build Lab',comparison:'Tarnished.dev public v1.17',
  intendedReleaseScope:'weapon-database-plus-reference-ar-not-full-game-damage-simulator',
  upstreamCatalogVersion:catalog.meta.version,
  counts,gates,
  readyForFullWeaponParity:gates.every(x=>x.pass),
  qualification:'SOURCE FIELD COVERAGE IS NOT ACCURACY, COPYRIGHT PERMISSION OR CURRENT GAME CERTIFICATION. The 15 observations apply only to exact v1.17 inputs; no new external measurements are performed by this audit.'
 };
}
export async function runWeaponParityAudit(){
 const raw=JSON.parse(await readFile(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
 return summarizeWeaponParity(raw,TARNISHED_REFERENCE_AR_CASES);
}
if(process.argv[1]&&new URL('file://'+process.argv[1]).pathname===new URL(import.meta.url).pathname){
 const result=await runWeaponParityAudit();
 console.log('Weapon v1.17 parity readiness: '+(result.readyForFullWeaponParity?'READY':'NOT_READY'));
 console.log('Real catalog counts: '+JSON.stringify(result.counts));
 for(const gate of result.gates)
  console.log((gate.pass?'PASS':'BLOCKED')+' '+gate.id+': '+gate.observed+' / '+gate.target);
 console.log(result.qualification);
}
