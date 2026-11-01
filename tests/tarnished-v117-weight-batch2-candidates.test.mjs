import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_WEIGHT_BATCH2_CANDIDATES as cases} from '../scripts/tarnished-v117-weight-batch2-candidates.mjs';
import {getTarnishedV117DirectWeight} from '../public/src/tarnished-v117-public-weights.mjs';
const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
test('30 new item weights were originally missing and now have independent repeated site observations',()=>{
 assert.equal(cases.length,30);
 assert.equal(new Set(cases.map(x=>x.id)).size,30);
 assert.equal(new Set(cases.map(x=>x.name)).size,30);
 for(const c of cases){
  const weapon=catalog.weapons.find(x=>x.name===c.name);
  assert.ok(weapon,c.name);
  assert.equal(weapon.weight,null,c.name);
  assert.ok(weapon.flags.includes('weight-and-base-attack-unknown'),c.name);
  const approved=getTarnishedV117DirectWeight(c.name);
  assert.ok(approved,c.name);
  assert.equal(approved.evidenceRun,41257934288,c.name);
  assert.equal(approved.observedTwice,true,c.name);
  assert.equal(c.affinity,'Standard');
  assert.ok(['rh1','lh1'].includes(c.hand));
  assert.equal(Object.hasOwn(c,'weight'),false);
 }
});
