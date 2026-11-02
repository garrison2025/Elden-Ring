import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateManualMoveSequence} from '../public/src/damage-moveset-sequence.mjs';
const attack={physical:200,magic:0,fire:0,lightning:0,holy:0};
const enemy=Object.fromEntries(['physical','strike','slash','pierce','magic','fire','lightning','holy']
 .map(k=>[k,{defense:0,negation:0}]));
const run=moves=>calculateManualMoveSequence({attack,enemy,moves});
test('frame-sequence engine calculates independent damage per real supplied animation times',()=>{
 const result=run([
  {label:'Move A',frames:30,hits:1,motionValue:50},
  {label:'Move B',frames:30,hits:2,motionValue:150}
 ]);
 assert.equal(result.perMove[0].perHitDamage,90);
 assert.equal(result.perMove[1].perHitDamage,270);
 assert.equal(result.perMove[1].sequenceDamage,540);
 assert.equal(result.damagePerSequence,630);
 assert.equal(result.totalFrames,60);
 assert.equal(result.damagePerSecond,630);
 assert.equal(result.attackCount,3);
});
test('zero frames, omitted motion, and more than 8 attacks cannot produce fake DPS',()=>{
 assert.throws(()=>run([{label:'A',frames:0,hits:1,motionValue:100}]),/frames/);
 assert.throws(()=>run([{label:'A',frames:60,hits:1}]),/motion value/);
 assert.throws(()=>run(Array.from({length:9},()=>({label:'A',frames:1,hits:1,motionValue:100}))),/1–8/);
});
test('manual enemy negation reduces each hit before exact frame-rate DPS',()=>{
 const result=calculateManualMoveSequence({attack,enemy:{...enemy,physical:{defense:0,negation:20}},
  moves:[{label:'one hit',motionValue:100,frames:30,hits:1}]});
 assert.equal(result.damagePerSequence,144);
 assert.equal(result.damagePerSecond,288);
});


test('multi-hit sequence calculates each distinct motion value through defense separately',()=>{
 const result=run([{label:'two different hits',frames:45,hits:2,hitMotionValues:[50,150]}]);
 assert.deepEqual(result.perMove[0].hitMotionValues,[50,150]);
 assert.deepEqual(result.perMove[0].hitDamages,[90,270]);
 assert.equal(result.perMove[0].perHitDamage,null);
 assert.equal(result.perMove[0].sequenceDamage,360);
 assert.equal(result.damagePerSecond,480);
 assert.equal(result.attackCount,2);
});
test('multi-hit motion values validate length, range and missing values without inventing hits',()=>{
 assert.throws(()=>run([{label:'bad',frames:60,hits:2,hitMotionValues:[100]}]),/exactly 2/);
 assert.throws(()=>run([{label:'bad',frames:60,hits:2,hitMotionValues:[100,501]}]),/out of range/);
 assert.throws(()=>run([{label:'bad',frames:60,hits:2,hitMotionValues:[100,null]}]),/out of range/);
 assert.throws(()=>run([{label:'bad',frames:60,hits:2}]),/motion value/);
});
test('different hit values apply defense and negation to each hit separately',()=>{
 const result=calculateManualMoveSequence({
  attack,enemy:{...enemy,physical:{defense:0,negation:20}},
  moves:[{label:'split',frames:60,hits:2,hitMotionValues:[50,150]}]
 });
 assert.deepEqual(result.perMove[0].hitDamages,[72,216]);
 assert.equal(result.damagePerSequence,288);
 assert.equal(result.damagePerSecond,288);
});
