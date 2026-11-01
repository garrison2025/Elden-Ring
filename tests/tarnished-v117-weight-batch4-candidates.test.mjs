import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_WEIGHT_BATCH4_CANDIDATES as cases} from '../scripts/tarnished-v117-weight-batch4-candidates.mjs';
import {getTarnishedV117DirectWeight as get} from '../public/src/tarnished-v117-public-weights.mjs';
const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
test('32 locally weighted source-sensitive cases: 31 approved observations, one unobserved torch',()=>{
 assert.equal(cases.length,32);
 assert.equal(cases.filter(x=>x.segment==='source-sensitive').length,20);
 assert.equal(new Set(cases.map(x=>x.id)).size,32);
 assert.equal(new Set(cases.map(x=>x.name)).size,32);
 for(const x of cases){
  const item=catalog.weapons.find(y=>y.name===x.name);
  assert.ok(item,x.name);
  assert.ok(typeof item.weight==='number'&&item.weight>0,x.name);
  const actual=get(x.name);
  if(x.name==='Beast-repellent Torch')assert.equal(actual,null,'public competitor did not activate torch');
  else{
   assert.ok(actual,x.name);
   assert.equal(actual.evidenceRun,41260697800,x.name);
   assert.equal(actual.observedTwice,true,x.name);
   assert.equal(actual.evidenceCategory,x.name==='Staff of the Great Beyond'?'known-community-weight-disagreement':'matched-community-weight');
  }
  assert.deepEqual(x.affinities,['Standard','None']);
  assert.equal(Object.hasOwn(x,'observedWeight'),false);
 }
});
