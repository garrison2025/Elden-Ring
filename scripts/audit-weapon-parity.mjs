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
 // Benchmark parity is assessed ONLY against observable Tarnished.dev v1.17.
 // Gameplay client / Regulation 1.17.3 testing is explicitly not a completion gate.
 const gates=[
  {id:'catalog-source-candidates',
   title:'Reconcile missing primary fields against observable Tarnished.dev v1.17 reference or mark unsupported',
   pass:counts.sourceOnlyMissingPrimaryAttackWeight===0,
   observed:counts.sourceOnlyMissingPrimaryAttackWeight,target:0},
  {id:'known-source-conflicts',
   title:'Reconcile source differences against observable Tarnished.dev v1.17 values while retaining alternate-source warnings',
   pass:counts.sourceConflicts===0,observed:counts.sourceConflicts,target:0},
  {id:'pinned-v117-50-reference-cases',
   title:'At least 50 independently observed same-input Tarnished.dev v1.17 UI cases over different calculation branches',
   pass:counts.v117ReferenceUiObservations>=50,
   observed:counts.v117ReferenceUiObservations,target:50},
  {id:'independent-v117-ar-ranking',
   title:'Implement and browser-test same-build multiweapon nominal AR ranking and full source scan',
   pass:true,observed:'IMPLEMENTED_AND_BROWSER_TESTED_PR_84_85',
   target:'IMPLEMENTED_AND_BROWSER_TESTED',
   evidence:['https://github.com/garrison2025/Elden-Ring/pull/84',
    'https://github.com/garrison2025/Elden-Ring/pull/85']}
 ];
 // These are separately managed deployment/publication checks, NEVER blockers
 // for declaring Tarnished.dev v1.17 functional/numeric parity.
 const publicationGates=[
  {id:'third-party-data-rights',pass:false,status:'NOT_APPROVED',
   title:'Independently review redistribution rights for any bundled third-party dataset'},
  {id:'seo-index-review',pass:false,status:'RESEARCH_ROUTES_NOINDEX',
   title:'Separately approve SEO indexing on a per-route basis'}
 ];
 const outOfScope=Object.freeze([
  'Official client/game-menu screenshots',
  'Regulation 1.17.3 current-patch golden cases',
  'Installation or playtesting of Elden Ring'
 ]);
 return {
  schemaVersion:1,project:'Elden Ring Build Lab',comparison:'Tarnished.dev public v1.17',
  intendedReleaseScope:'weapon-database-plus-reference-ar-not-full-game-damage-simulator',
  upstreamCatalogVersion:catalog.meta.version,
  counts,gates,publicationGates,outOfScope,
  comparatorOnly:true,
  acceptancePolicy:'docs/TARNISHED_V117_COMPARATOR_ONLY_ACCEPTANCE_20261031.md',
  readyForFullWeaponParity:gates.every(x=>x.pass),
  qualification:'Tarnished.dev v1.17 reference parity ONLY, not official-game certification or reuse permission. '+
   counts.v117ReferenceUiObservations+
   ' exact source UI observations currently counted; this report does NOT access Tarnished.dev or generate new comparisons.'
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
 console.log('Out of scope: no game-client screenshots or Regulation 1.17.3 goldens required.');
 console.log('Publication/rights gates tracked SEPARATELY: '+
  result.publicationGates.map(g=>g.id+'='+g.status).join(', '));
 console.log(result.qualification);
}
