import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 validateCommunityCatalog,baseDamageParts,reportedBaseDamageParts,cautionForWeapon
} from '../public/src/community-weapons.mjs';
import {validateConflictEvidence,conflictDossierHtml} from '../scripts/weapon-conflict-dossier.mjs';
import {getCatalogEvidence} from '../scripts/catalog-evidence.mjs';

const read=path=>JSON.parse(readFileSync(new URL('../public/data/'+path,import.meta.url),'utf8'));
const catalog=read('community-weapon-catalog.json');
const ledger=read('weapon-conflict-evidence.json');
const expected=new Map([
 ['sote-reference-032',[75,0,22,0,0]],
 ['sote-reference-041',[127,82,0,0,0]],
 ['sote-reference-042',[127,82,0,0,0]],
 ['sote-reference-064',[122,0,36,0,0]],
 ['sote-reference-071',[131,0,0,0,0]],
 ['sote-reference-058',[62,0,0,0,0]]
]);

test('all six historically disputed +0 attacks have distinct linked unversioned Base rows matching pinned values',()=>{
 assert.equal(validateCommunityCatalog(catalog),catalog);
 const audit=validateConflictEvidence(catalog,ledger);
 assert.equal(audit.entries.length,7,'historical disputes are never automatically cleared');
 assert.equal(audit.unversionedBaseCorroborationCount,6);
 assert.equal(audit.currentPatchCorroborationCount,1,'separate version-labelled Madding requirement');
 assert.equal(audit.gameClientVerified,false);
 assert.equal(audit.screenshotCount,0);
 assert.equal(catalog.meta.unversionedThirdPartyPlusZeroMatchesCount,6);
 assert.equal(getCatalogEvidence(catalog).counts.unversionedBaseCrosschecks,6);
 assert.equal(ledger.thirdPartyBaseCrosscheck.gameClientVerified,false);
 assert.equal(ledger.thirdPartyBaseCrosscheck.extractionLineageIndependentlyVerified,false);
 assert.equal(new Set(audit.entries.filter(x=>x.thirdPartyBasePlusZero).map(x=>x.thirdPartyBasePlusZero.sourceUrl)).size,6);
 for(const [id,expectedAttack] of expected){
  const weapon=catalog.weapons.find(x=>x.id===id);
  const row=ledger.cases.find(x=>x.id===id);
  const computed=audit.entries.find(x=>x.id===id);
  assert.ok(weapon&&row&&computed,id);
  assert.deepEqual(row.pinned,expectedAttack,id);
  assert.deepEqual(weapon.thirdPartyBasePlusZero.observedComponents,expectedAttack,id);
  assert.deepEqual(row.thirdPartyBasePlusZero.observedComponents,expectedAttack,id);
  assert.deepEqual(computed.thirdPartyBasePlusZero.observedComponents,expectedAttack,id);
  assert.equal(weapon.thirdPartyBasePlusZero.sourceUrl,row.thirdPartyBasePlusZero.sourceUrl);
  assert.match(weapon.thirdPartyBasePlusZero.sourceUrl,/^https:\/\/tarnished\.app\/weapons\//);
  assert.equal(weapon.thirdPartyBasePlusZero.sourcePatchVersion,'not-declared');
  assert.equal(weapon.thirdPartyBasePlusZero.dataLineageIndependentlyEstablished,false);
  assert.equal(weapon.thirdPartyBasePlusZero.gameClientVerified,false);
  assert.equal(baseDamageParts(weapon),null,id+' third source must NOT unlock trusted AR input');
  assert.ok(reportedBaseDamageParts(weapon).length>0,'original disagreeing community reading preserved');
  assert.ok(cautionForWeapon(weapon).some(t=>t.includes('PROVISIONAL THIRD-PARTY +0 SOURCE')));
  assert.ok(weapon.flags.includes('v117-community-attack-conflict'));
 }
 assert.equal(catalog.weapons.filter(x=>x.thirdPartyBasePlusZero).length,6);
 const madding=catalog.weapons.find(x=>x.name==='Madding Hand');
 assert.equal(madding.thirdPartyBasePlusZero,undefined);
 assert.equal(madding.requirements[3],13,'1.17.3 secondary FAI 20 does not falsify legacy source reading');
});

test('source reconciliation table publishes exact third links and unverified provenance, not a completed game-client finding',()=>{
 const html=conflictDossierHtml(validateConflictEvidence(catalog,ledger));
 assert.ok(html.includes('Unversioned third-source +0 checks: 6 of 6'));
 assert.ok(html.includes('Third public Base'));
 assert.ok(html.includes('patch/lineage unverified'));
 assert.ok(html.includes('current App/Regulation'));
 assert.ok(html.includes('all six original source disagreements stay open')||
           html.includes('All six original source disagreements stay open'));
 for(const row of ledger.cases.filter(x=>x.field==='baseAttack'))
  assert.ok(html.includes(row.thirdPartyBasePlusZero.sourceUrl));
 assert.ok(html.includes('Current accepted game screenshot count: 0'));
 assert.equal((html.match(/<tr><th scope="row"><a href="..\/weapon-database/g)||[]).length,7);
 const front=readFileSync(new URL('../public/src/weapon-catalog-app.mjs',import.meta.url),'utf8');
 assert.match(front,/chosen\.thirdPartyBasePlusZero/);
 assert.match(front,/Provisional additional published \+0 Base/);
 assert.match(front,/original wiki source conflict remains open/);
});

test('corrupted third-source references, vectors, provenance or fake approval are rejected',()=>{
 const mutations=[
  row=>{row.thirdPartyBasePlusZero.sourceUrl='https://example.org/fake';},
  row=>{row.thirdPartyBasePlusZero.observedComponents[0]+=1;},
  row=>{row.thirdPartyBasePlusZero.referenceVersion='1.17.3';},
  row=>{row.thirdPartyBasePlusZero.independenceFromPinnedSource='yes';},
  row=>{row.thirdPartyBasePlusZero.gameClientVerified=true;},
  row=>{row.thirdPartyBasePlusZero.publicationApproved=true;},
  row=>{delete row.thirdPartyBasePlusZero;}
 ];
 for(const mutate of mutations){
  const altered=structuredClone(ledger);
  mutate(altered.cases.find(c=>c.id==='sote-reference-064'));
  assert.throws(()=>validateConflictEvidence(catalog,altered),RangeError);
 }
 const alteredSummary=structuredClone(ledger);
 alteredSummary.thirdPartyBaseCrosscheck.corroboratedPinnedSourceCount=7;
 assert.throws(()=>validateConflictEvidence(catalog,alteredSummary),RangeError);
 for(const mutate of [
  w=>{w.thirdPartyBasePlusZero.observedComponents[0]+=1;},
  w=>{w.thirdPartyBasePlusZero.sourceUrl='https://example.org/';},
  w=>{w.thirdPartyBasePlusZero.gameClientVerified=true;},
  w=>{w.thirdPartyBasePlusZero.sourcePatchVersion='1.17.3';},
  w=>{w.flags=w.flags.filter(x=>x!=='v117-community-attack-conflict');}
 ]){
  const changed=structuredClone(catalog);mutate(changed.weapons.find(x=>x.id==='sote-reference-041'));
  assert.throws(()=>validateCommunityCatalog(changed),RangeError);
  assert.throws(()=>validateConflictEvidence(changed,ledger),RangeError);
 }
});
