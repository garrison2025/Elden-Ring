import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarizeWeaponParity,runWeaponParityAudit} from '../scripts/audit-weapon-parity.mjs';
import {TARNISHED_REFERENCE_AR_CASES} from '../public/src/tarnished-reference-benchmark.mjs';
const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));

test('weapon parity audit exposes real source coverage rather than claiming all weapons finished',async()=>{
 const audit=await runWeaponParityAudit();
 assert.equal(audit.comparison,'Tarnished.dev public v1.17');
 assert.equal(audit.counts.total,487);
 assert.equal(audit.counts.baseGame,377);
 assert.equal(audit.counts.shadowOfTheErdtree,102);
 assert.equal(audit.counts.tarnishedPack,8);
 assert.equal(audit.counts.reportedPrimaryAttack,415);
 assert.equal(audit.counts.reportedPrimaryRequirements,487);
 assert.equal(audit.counts.reportedPrimaryWeight,415);
 assert.equal(audit.counts.primaryThreeFieldsWithNoKnownConflict,406);
 assert.equal(audit.counts.sourceOnlyMissingPrimaryAttackWeight,72);
 assert.equal(audit.counts.sourceConflicts,9);
 assert.equal(audit.counts.embeddedPreciseArProfiles,0);
 assert.equal(audit.counts.v117ReferenceUiObservations,15);
 assert.equal(audit.readyForFullWeaponParity,false);
});
test('not-ready blockers preserve 50-case target and game-client/source-rights distinctions',()=>{
 const audit=summarizeWeaponParity(catalog,TARNISHED_REFERENCE_AR_CASES);
 assert.equal(audit.gates.length,6);
 assert.equal(audit.gates.filter(g=>g.pass).length,0);
 assert.equal(audit.gates.find(g=>g.id==='pinned-v117-50-reference-cases').target,50);
 assert.match(audit.qualification,/NOT ACCURACY/);
 assert.match(audit.qualification,/15 observations/);
});
test('duplicate observed sample IDs never inflate independently repeated Tarnished benchmarks',()=>{
 const observations=TARNISHED_REFERENCE_AR_CASES;
 assert.throws(()=>summarizeWeaponParity(catalog,[...observations,observations[0]]),
  /Repeated external UI sample ID/);
});
test('source-report changes cannot be interpreted as licensing or latest-game AR validation',()=>{
 const audit=summarizeWeaponParity(catalog,TARNISHED_REFERENCE_AR_CASES);
 assert.equal(audit.gates.find(g=>g.id==='dataset-rights-and-version-review').pass,false);
 assert.equal(audit.gates.find(g=>g.id==='v117-patch-client-certification').pass,false);
 assert.equal(audit.upstreamCatalogVersion,'not established; do not assume 1.17.3 compatibility');
});
