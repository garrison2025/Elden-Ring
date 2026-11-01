import test from 'node:test';
import assert from 'node:assert/strict';
import {TARNISHED_V117_18_APPROVED_FRESH as fresh} from '../public/src/tarnished-v117-approved-fresh.mjs';
import {TARNISHED_REFERENCE_AR_CASES as previous,TARNISHED_V117_ALL_APPROVED_AR_CASES as all} from '../public/src/tarnished-reference-benchmark.mjs';
import {V117_FRESH_UI_CANDIDATES as proposed} from '../scripts/tarnished-v117-fresh-candidates.mjs';
test('18 new external site data rows have two UI observations, all numbers and inputs; 50 earlier rows remain intact',()=>{
 assert.equal(previous.length,50);assert.equal(fresh.length,18);assert.equal(all.length,68);
 assert.deepEqual(all.slice(0,50),previous);
 assert.deepEqual(all.slice(50),fresh);
 const old=new Set(previous.map(x=>x.id));
 for(const [index,c] of fresh.entries()){
  const input=proposed[index];
  assert.ok(input);assert.equal(c.id,'tarnished-v117-'+input.id);
  assert.equal(old.has(c.id),false);
  assert.deepEqual(c.playerStats,{str:input.str,dex:input.dex,int:input.int,fai:input.fai,arc:input.arc});
  assert.equal(c.weaponName,input.weaponName);
  assert.equal(c.affinity,input.affinity);
  assert.equal(c.upgrade,input.upgrade);
  assert.equal(c.twoHanded,input.twoHanded);
  assert.equal(c.sourceVersion,'1.17');
  assert.equal(c.sourceRepeatable,true);
  assert.deepEqual(c.evidenceRuns,[41255162868,41255239994]);
  assert.ok(c.sourceUrl.startsWith('https://www.tarnished.dev/build-planner?'));
  assert.ok(c.observedDisplay.includes('Total AR : '+c.expectedTotal));
 }
 assert.equal(new Set(all.map(x=>x.id)).size,68);
 assert.deepEqual(fresh.map(x=>x.expectedTotal),[142,517,735,599,556,449,572,785,847,508,748,501,659,671,629,609,568,732]);
});
