import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_WEIGHT_BATCH4_CANDIDATES as cases} from '../scripts/tarnished-v117-weight-batch4-candidates.mjs';
import {getTarnishedV117DirectWeight as get} from '../public/src/tarnished-v117-public-weights.mjs';
const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
test('32 previously unobserved, locally weighted direct comparator candidates cover 20 source risks',()=>{
 assert.equal(cases.length,32);
 assert.equal(cases.filter(x=>x.segment==='source-sensitive').length,20);
 assert.equal(new Set(cases.map(x=>x.id)).size,32);
 assert.equal(new Set(cases.map(x=>x.name)).size,32);
 for(const x of cases){
  const item=catalog.weapons.find(y=>y.name===x.name);
  assert.ok(item,x.name);
  assert.ok(typeof item.weight==='number'&&item.weight>0,x.name);
  assert.equal(get(x.name),null,x.name+' should not be pre-approved without real UI evidence');
  assert.deepEqual(x.affinities,['Standard','None']);
  assert.equal(Object.hasOwn(x,'observedWeight'),false);
 }
});
