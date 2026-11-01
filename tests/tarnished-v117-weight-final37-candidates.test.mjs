import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_WEIGHT_FINAL37_CANDIDATES as cases} from '../scripts/tarnished-v117-weight-final37-candidates.mjs';
import {getTarnishedV117DirectWeight as get} from '../public/src/tarnished-v117-public-weights.mjs';
const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
test('37 distinct final missing weights correspond only to canonical NULL entries',()=>{
 assert.equal(cases.length,37);
 assert.equal(new Set(cases.map(x=>x.name)).size,37);
 assert.equal(new Set(cases.map(x=>x.id)).size,37);
 for(const c of cases){
  const w=catalog.weapons.find(x=>x.name===c.name);
  assert.ok(w,c.name);
  assert.equal(w.weight,null,c.name);
  const source=get(c.name);
  assert.ok(source,c.name);
  assert.equal(source.evidenceRun,41259504988,c.name);
  assert.equal(source.observedTwice,true,c.name);
  assert.deepEqual(c.affinities,['Standard','None']);
  assert.equal(Object.hasOwn(c,'weight'),false);
 }
});
