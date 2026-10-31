import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 validateConflictEvidence,conflictDossierHtml,injectConflictDossier
} from '../scripts/weapon-conflict-dossier.mjs';

const read=p=>JSON.parse(readFileSync(new URL('../public/'+p,import.meta.url),'utf8'));
const catalog=read('data/community-weapon-catalog.json');
const ledger=read('data/weapon-conflict-evidence.json');
const status=readFileSync(new URL('../public/validation-status/index.html',import.meta.url),'utf8');
const copy=()=>structuredClone(ledger);

test('seven independently attributable source disputes stay UNREVIEWED',()=>{
 const result=validateConflictEvidence(catalog,ledger);
 assert.equal(result.entries.length,7);
 assert.equal(result.currentPatchCorroborationCount,1);
 assert.equal(result.entries.filter(x=>x.field==='baseAttack').length,6);
 assert.equal(result.entries.filter(x=>x.field==='requirements').length,1);
 assert.equal(result.gameClientVerified,false);
 assert.equal(result.screenshotCount,0);
 assert.equal(result.app,'1.17.2');
 assert.equal(result.regulation,'1.17.3');
 assert.deepEqual(new Set(result.entries.map(x=>x.id)),
  new Set(catalog.weapons.filter(w=>(w.flags||[]).includes('v117-community-attack-conflict')||
   (w.flags||[]).includes('v117-community-requirement-conflict')).map(w=>w.id)));
 assert.deepEqual(result.entries.find(x=>x.id==='sote-reference-051').sourceCommunity,[8,8,13,13,0]);
 assert.deepEqual(result.entries.find(x=>x.id==='sote-reference-051').sourcePinned,[8,8,13,20,0]);
 assert.deepEqual(result.entries.find(x=>x.id==='sote-reference-051').currentPatchCorroboration.observedValues,[8,8,13,20,0]);
 assert.equal(result.entries.find(x=>x.id==='sote-reference-051').currentPatchCorroboration.gameClientVerified,false);
 assert.deepEqual(result.entries.find(x=>x.id==='sote-reference-071').sourceCommunity,[133,0,0,0,0]);
 assert.deepEqual(result.entries.find(x=>x.id==='sote-reference-071').sourcePinned,[131,0,0,0,0]);
 assert.ok(result.entries.every(x=>x.sourceUrl.startsWith('https://')));
});
test('source dossier contains both readings, exact mismatched component and manual QA steps',()=>{
 const dossier=validateConflictEvidence(catalog,ledger);
 const html=conflictDossierHtml(dossier);
 assert.ok(html.includes('Seven unresolved weapon-source disagreements'));
 assert.ok(html.includes('Madding Hand'));
 assert.ok(html.includes('Current-patch corroboration: 1 of 7 historical disagreements'));
 assert.ok(html.includes('1.17.3 secondary data supports pinned'));
 assert.ok(html.includes('FAI: 13 / 20'));
 assert.ok(html.includes('PHY: 133 / 131'));
 assert.ok(html.includes('FIRE: 32 / 22'));
 assert.ok(html.includes('not character AR'));
 assert.ok(html.includes('source disagreement')||html.includes('source disagreements'));
 assert.ok(html.includes('Current accepted game screenshot count: 0'));
 assert.ok(html.includes('data/weapon-conflict-evidence.json'));
 assert.ok(html.includes('weapon-data-workbench'));
 assert.equal((html.match(/<tr><th scope="row"><a href="..\/weapon-database/g)||[]).length,7);
 const rendered=injectConflictDossier(status,dossier);
 assert.ok(rendered.includes(html));
 assert.throws(()=>injectConflictDossier(rendered,dossier),RangeError);
});
test('build rejects missing or added source flags, changed references, stale IDs and invented approvals',()=>{
 const cases=[
  d=>d.cases.pop(),
  d=>{d.cases[0].community[2]=999;},
  d=>{d.cases[0].pinned=[...d.cases[0].community];},
  d=>{d.cases[0].id='missing';},
  d=>{d.cases[1].id=d.cases[0].id;},
  d=>{d.cases[0].wiki='javascript:alert(1)';},
  d=>{d.cases[0].other='http://insecure.example';},
  d=>{d.verification.gameClientVerified=true;},
  d=>{d.verification.publicationApproved=true;},
  d=>{d.verification.acceptedCurrentGameScreenshots=1;},
  d=>{d.cases[0].gameClientVerified=true;},
  d=>{d.cases[0].reviewStatus='VERIFIED';},
  d=>{d.cases[0].screenshotCount=1;},
  d=>{d.requiredGameVersion.regulation='1.17';},
  d=>{d.status='CONFIRMED';},
  d=>{d.cases.find(c=>c.id==='sote-reference-051').currentPatchCorroboration.observedValues[3]=13;},
  d=>{d.cases.find(c=>c.id==='sote-reference-051').currentPatchCorroboration.notVerifiedByGameClient=false;}
 ];
 for(const change of cases){
  const d=copy();change(d);
  assert.throws(()=>validateConflictEvidence(catalog,d),RangeError,
   'Mutated ledger should not pass: '+change.toString());
 }
 const modified=structuredClone(catalog);
 modified.weapons.find(w=>w.id==='sote-reference-051').requirements[3]=20;
 assert.throws(()=>validateConflictEvidence(modified,ledger),RangeError);
 const unflagged=structuredClone(catalog);
 unflagged.weapons.find(w=>w.id==='sote-reference-032').flags=
  unflagged.weapons.find(w=>w.id==='sote-reference-032').flags
  .filter(s=>s!=='v117-community-attack-conflict');
 assert.throws(()=>validateConflictEvidence(unflagged,ledger),RangeError);
});
test('constrained source text is HTML escaped, not treated as executable markup',()=>{
 const mod=structuredClone(catalog);
 mod.weapons.find(w=>w.id==='sote-reference-051').name='<svg onload=alert(1)>';
 const html=conflictDossierHtml(validateConflictEvidence(mod,ledger));
 assert.ok(html.includes('&lt;svg onload=alert(1)&gt;'));
 assert.ok(!html.includes('<svg onload=alert(1)>'));
});
