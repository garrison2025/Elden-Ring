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
 assert.equal(audit.counts.v117ReferenceUiObservations,50);
 assert.equal(audit.readyForFullWeaponParity,false);
});
test('reference-only parity gates retain 50 competitor cases and exclude real-game certification',()=>{
 const audit=summarizeWeaponParity(catalog,TARNISHED_REFERENCE_AR_CASES);
 assert.equal(audit.gates.length,4);
 assert.equal(audit.gates.filter(g=>g.pass).length,2);
 assert.equal(audit.gates.find(g=>g.id==='pinned-v117-50-reference-cases').target,50);
 assert.match(audit.qualification,/reference parity ONLY/);
 assert.equal(audit.comparatorOnly,true);
 assert.equal(audit.outOfScope.length,3);
 assert.ok(audit.outOfScope.some(x=>x.includes('Regulation 1.17.3')));
 assert.ok(audit.gates.every(g=>!g.id.includes('client-certification')));
 assert.ok(audit.gates.every(g=>!g.id.includes('rights')));
 assert.equal(audit.gates.find(g=>g.id==='independent-v117-ar-ranking').pass,true);
 assert.match(audit.qualification,/50 exact source UI observations/);
});
test('duplicate observed sample IDs never inflate independently repeated Tarnished benchmarks',()=>{
 const observations=TARNISHED_REFERENCE_AR_CASES;
 assert.throws(()=>summarizeWeaponParity(catalog,[...observations,observations[0]]),
  /Repeated external UI sample ID/);
});
test('rights/index approvals remain separate from competitor-only validation; source labels remain truthful',()=>{
 const audit=summarizeWeaponParity(catalog,TARNISHED_REFERENCE_AR_CASES);
 assert.deepEqual(audit.publicationGates.map(g=>g.id),
  ['third-party-data-rights','seo-index-review']);
 assert.ok(audit.publicationGates.every(g=>!g.pass));
 assert.equal(audit.upstreamCatalogVersion,'not established; do not assume 1.17.3 compatibility');
 assert.equal(audit.readyForFullWeaponParity,false,'15/50 source matches and unreconciled facts are NOT full parity');
 assert.match(audit.qualification,/not official-game certification/i);
});
