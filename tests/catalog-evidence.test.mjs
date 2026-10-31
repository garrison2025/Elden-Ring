import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 getCatalogEvidence,catalogEvidenceRow,catalogEvidencePanel,injectCatalogEvidence
} from '../scripts/catalog-evidence.mjs';
const catalog=JSON.parse(readFileSync(
 new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
const status=readFileSync(
 new URL('../public/validation-status/index.html',import.meta.url),'utf8');

test('data-quality audit derives all exact observed counts and conflict types from bundled catalog',()=>{
 const evidence=getCatalogEvidence(catalog);
 const c=evidence.counts;
 assert.equal(c.total,catalog.weapons.length);
 assert.equal(c.baseGame,306);
 assert.equal(c.dlc,102);
 assert.equal(c.tarnishedPack,8);
 assert.equal(c.tarnishedPackBaseFacts,8);
 assert.equal(c.tarnishedPackSecondaryConflicts,1);
 assert.equal(c.versionedRequirementCorroborations,1);
 assert.equal(c.unversionedBaseCrosschecks,6);
 assert.equal(c.total,416);
 assert.equal(c.dlcBaseAttackSourced,101);
 assert.equal(c.requirementsPresent,416);
 assert.equal(c.weaponWeightsPresent,416);
 assert.equal(c.baseAttackPresent,415);
 assert.equal(c.publishedRoundedUpgradeTables,6);
 assert.equal(c.completeArProfiles,0);
 assert.equal(c.attackSourceConflicts,6);
 assert.equal(c.requirementSourceConflicts,1);
 assert.equal(c.recordsWithSourceConflicts,
  new Set(catalog.weapons.filter(w=>(w.flags||[]).some(f=>
   f==='v117-community-attack-conflict'||f==='v117-community-requirement-conflict'))
   .map(w=>w.id)).size);
 assert.equal(evidence.conflicts.length,c.recordsWithSourceConflicts);
 assert.equal(evidence.provenance.reportedGameVersion,
  'not established; do not assume 1.17.3 compatibility');
 assert.equal(evidence.schemaVersion,1);
});
test('each contested game field is named but NEVER silently resolved or certified',()=>{
 const evidence=getCatalogEvidence(catalog);
 for(const ref of evidence.conflicts){
  const record=catalog.weapons.find(w=>w.id===ref.id);
  assert.ok(record);
  assert.equal(ref.attackConflict,(record.flags||[]).includes('v117-community-attack-conflict'));
  assert.equal(ref.requirementConflict,(record.flags||[]).includes('v117-community-requirement-conflict'));
  assert.ok(ref.catalogPath.startsWith('/weapon-database/?weapon='));
 }
 const panel=catalogEvidencePanel(evidence);
 assert.ok(panel.includes('Unresolved community source disagreement'));
 assert.ok(panel.includes('not game-client QA'));
 assert.ok(panel.includes('UNKNOWN, not zero'));
 assert.ok(panel.includes('not</strong> proof of current-patch accuracy'));
 assert.ok(!panel.includes('364, partial'));
 assert.ok(!panel.includes('57 DLC names'));
});
test('catalog evidence counters change immediately when actual source flags change',()=>{
 const copy=structuredClone(catalog);
 const initial=getCatalogEvidence(copy);
 const safe=copy.weapons.find(w=>!(w.flags||[]).includes('v117-community-attack-conflict')&&
  !(w.flags||[]).includes('v117-community-requirement-conflict'));
 assert.ok(safe);
 safe.flags=[...(safe.flags||[]),'v117-community-attack-conflict'];
 const next=getCatalogEvidence(copy);
 assert.equal(next.counts.attackSourceConflicts,initial.counts.attackSourceConflicts+1);
 assert.equal(next.counts.recordsWithSourceConflicts,initial.counts.recordsWithSourceConflicts+1);
 assert.equal(next.counts.total,initial.counts.total);
});
test('generated validation status replaces one row and one panel and escapes source names',()=>{
 const evidence=getCatalogEvidence(catalog);
 assert.ok(status.includes('<tr data-catalog-audit-row>'));
 assert.ok(status.includes('<section data-catalog-audit-panel></section>'));
 const html=injectCatalogEvidence(status,evidence);
 assert.ok(html.includes(catalogEvidenceRow(evidence)));
 assert.ok(html.includes(catalogEvidencePanel(evidence)));
 assert.ok(html.includes('Community weapon catalog (416 entries)'));
 assert.ok(html.includes('Source snapshot version:'));
 assert.ok(html.includes('../catalog-evidence.json'));
 assert.ok(html.includes('noindex,nofollow'));
 assert.ok(!html.includes('Community weapon catalog (364, partial)'));
 assert.ok(!html.includes('data-catalog-audit-panel></section>'));
 assert.throws(()=>injectCatalogEvidence(html,evidence),RangeError);
 assert.throws(()=>injectCatalogEvidence(status.replace('<section data-catalog-audit-panel></section>',''),evidence),RangeError);
 assert.throws(()=>injectCatalogEvidence(status.replace('<tr data-catalog-audit-row>','<tr>'),evidence),RangeError);
 const forged=structuredClone(catalog);
 forged.weapons.find(w=>(w.flags||[]).includes('v117-community-attack-conflict')).name='<img src=x onerror=alert(1)>';
 const dangerousPanel=catalogEvidencePanel(getCatalogEvidence(forged));
 assert.ok(dangerousPanel.includes('&lt;img src=x onerror=alert(1)&gt;'));
 assert.ok(!dangerousPanel.includes('<img src=x onerror=alert(1)>'));
});
test('invalid catalog provenance or source record counts cannot generate a release audit',()=>{
 assert.throws(()=>getCatalogEvidence({...catalog,meta:{...catalog.meta,count:405}}),RangeError);
 assert.throws(()=>getCatalogEvidence(null),RangeError);
});
