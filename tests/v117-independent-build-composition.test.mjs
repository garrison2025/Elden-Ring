import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateV117BuildTalismanAttributeComposition as run} from '../public/src/v117-build-talisman-composition.mjs';
import {V117_EXACT_TALISMAN_COMBOS} from '../public/src/v117-talisman-combos-direct.mjs';
const wretch=Array(8).fill(10);
test('independent selected talisman attribute engine reproduces all five actual public Wretch10 combined sets',()=>{
 for(const scene of V117_EXACT_TALISMAN_COMBOS){
  const s=run(wretch,scene.names);
  assert.equal(s.status,'REAL_TARNISHED_V117_ATTRIBUTES_MATCH',scene.names.join(' + '));
  assert.deepEqual(s.final,scene.stats);
  assert.equal(s.reference?.maxEquipLoad,scene.maxEquipLoad);
  assert.ok(s.computedVitals,'An observed combination needs an independently derived numeric output');
  assert.deepEqual({
   hp:s.computedVitals.HP,fp:s.computedVitals.FP,stamina:s.computedVitals.Stamina,
   discovery:s.computedVitals.Discovery,load:s.computedVitals.maxEquipLoad,
   weight:s.computedVitals.weight,negation:s.computedVitals.damageNegation
  },{
   hp:scene.vitals.HP,fp:scene.vitals.FP,stamina:scene.vitals.Stamina,
   discovery:scene.vitals.Discovery,load:scene.maxEquipLoad,
   weight:scene.weight,negation:scene.negation.physical
  });

 }
});
test('composed different baseline never claims whole-site combined parity',()=>{
 const s=run([12,10,10,10,10,10,10,10],["Radagon's Soreseal","Marika's Soreseal"]);
 assert.equal(s.status,'COMPOSED_ATTRIBUTES_NOT_FULL_SITE_CERTIFIED');
 assert.deepEqual(s.final,[17,15,15,15,15,15,15,15]);
 assert.equal(s.reference,null);
});
test('invalid talisman families and unknown effect blocked instead of making up numbers',()=>{
 const bad=run(wretch,["Radagon's Scarseal","Radagon's Soreseal"]);
 assert.equal(bad.status,'INCOMPATIBLE_TALISMANS');
 assert.equal(bad.final,null);
 const unknown=run(wretch,['A fictional talisman']);
 assert.equal(unknown.status,'UNKNOWN_EFFECT');
 assert.equal(unknown.final,null);
});
test('one stat cap blocks unsupported equipment bonus beyond 99',()=>{
 const s=run([99,10,10,10,10,10,10,10],["Radagon's Soreseal"]);
 assert.equal(s.status,'UNVERIFIED_99_STAT_CAP');
 assert.equal(s.final,null);
});
