import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE as evidence,getTarnishedV117DirectWeight as get} from '../public/src/tarnished-v117-public-weights.mjs';
const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
test('9 small, independently two-pass observed site weights are versioned and source explicit',()=>{
 assert.equal(evidence.length,9);
 assert.equal(new Set(evidence.map(x=>x.weaponName)).size,9);
 for(const x of evidence){
  assert.ok(catalog.weapons.some(w=>w.name===x.weaponName));
  assert.equal(x.observedTwice,true);
  assert.equal(x.comparatorVersion,'1.17');
  assert.equal(x.evidenceRun,41257042883);
  assert.equal(x.baseAttackVerified,false);
  assert.equal(x.requirementsVerified,false);
  assert.ok(x.weight>0&&Number.isFinite(x.weight));
 }
 assert.equal(get('Stone-Sheathed Sword').weight,5);
 assert.equal(get('Albinauric Shield').weight,4.5);
 assert.equal(get('Brass Shield').weight,7);
 assert.equal(get('Fingerprint Stone Shield').weight,29);
 assert.equal(get('Golden Greatshield').weight,17);
 assert.equal(get('Great Turtle Shell').weight,5.5);
 assert.equal(get('Moonveil'),null);
 assert.equal(get(null),null);
});
test('community catalog remains intact and source disagreements are NOT silently erased',()=>{
 const stone=catalog.weapons.find(x=>x.name==='Stone-Sheathed Sword');
 assert.equal(stone.weight,3.5);
 assert.ok(stone.flags.includes('stone-sheathed-weight-source-conflict'));
 for(const name of ['Albinauric Shield','Brass Shield','Fingerprint Stone Shield',
  'Golden Greatshield','Great Turtle Shell']){
  const w=catalog.weapons.find(x=>x.name===name);
  assert.equal(w.attack,null);
  assert.equal(w.weight,null);
  assert.equal(w.dataCoverage,'requirements-only');
 }
});
