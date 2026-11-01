import test from 'node:test';
import assert from 'node:assert/strict';
import {TARNISHED_V117_18_APPROVED_DISPUTED as cases} from '../public/src/tarnished-v117-approved-disputed.mjs';
import {V117_DISPUTED_UI_CANDIDATES as inputs} from '../scripts/tarnished-v117-disputed-candidates.mjs';
import {TARNISHED_REFERENCE_AR_CASES as original,TARNISHED_V117_ALL_APPROVED_AR_CASES as all,
 auditTarnishedV117ReferenceAR} from '../public/src/tarnished-reference-benchmark.mjs';
test('18 high-risk AR numbers are independently observed twice, compared and locked as 86 references',()=>{
 assert.equal(original.length,50);
 assert.equal(cases.length,18);
 assert.equal(all.length,86);
 assert.deepEqual(all.slice(68),cases);
 assert.equal(new Set(all.map(x=>x.id)).size,86);
 assert.deepEqual(cases.map(x=>x.expectedTotal),[111,265,762,138,189,159,78,114,211,168,138,169,132,165,86,93,184,150]);
 for(const [i,c] of cases.entries()){
  const x=inputs[i];assert.ok(x);
  assert.equal(c.id,'tarnished-v117-'+x.id);
  assert.equal(c.weaponName,x.weaponName);
  assert.equal(c.affinity,x.affinity);
  assert.equal(c.upgrade,x.upgrade);
  assert.deepEqual(c.playerStats,{str:x.str,dex:x.dex,int:x.int,fai:x.fai,arc:x.arc});
  assert.equal(c.twoHanded,x.twoHanded);
  assert.equal(c.sourceRepeatable,true);
  assert.deepEqual(c.evidenceRuns,[41256014056,41256043633]);
  assert.ok(c.observedDisplay.includes('Total AR : '+c.expectedTotal));
  assert.ok(c.sourceUrl.startsWith('https://www.tarnished.dev/build-planner?'));
  assert.ok(c.unresolvedSourceFields.includes('weight'));
 }
});
test('86 is within exact benchmark limits and does not claim missing catalog fields complete',()=>{
 assert.ok(all.length<=100,'Current comparator audit per-run safeguards cap at 100 input cases');
 assert.equal(new Set(all.map(x=>x.weaponName)).size>15,true);
 assert.equal(typeof auditTarnishedV117ReferenceAR,'function');
});
