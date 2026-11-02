import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateManualDamage} from '../public/src/damage-reference-model.mjs';
import {calculateManualMoveSequence} from '../public/src/damage-moveset-sequence.mjs';
import {readFileSync} from 'node:fs';
const attack={physical:200,magic:50,fire:0,lightning:0,holy:0};
const names=['physical','strike','slash','pierce','magic','fire','lightning','holy'];
const enemy=Object.fromEntries(names.map(name=>[name,{defense:100,negation:20}]));
const input={attack,enemy,physicalType:'physical',motionValue:100,attacksPerSecond:1};
test('damage correctly distinguishes attack buffs before defense and final buffs AFTER target negation',()=>{
 const baseline=calculateManualDamage(input);
 const pre=calculateManualDamage({...input,damageMultiplier:2});
 const post=calculateManualDamage({...input,afterNegationMultiplier:2});
 assert.ok(pre.damagePerHit>baseline.damagePerHit);
 assert.ok(post.damagePerHit>baseline.damagePerHit);
 assert.notEqual(pre.damagePerHit,post.damagePerHit,'Different defense stages are not mathematically interchangeable');
 assert.ok(Math.abs(post.damagePerHit-baseline.damagePerHit*2)<0.000005);
 assert.equal(post.afterNegationMultiplier,2);
 for(const type of post.perType){
  const old=baseline.perType.find(x=>x.type===type.type);
  assert.ok(Math.abs(type.afterNegation-old.afterNegation*2)<0.000002);
 }
});
test('per-hit damage and real frame-sequence DPS propagate the post-negation stage independently',()=>{
 const base=calculateManualMoveSequence({attack,enemy,
  moves:[{label:'first',frames:30,hits:1,motionValue:100},
   {label:'second',frames:60,hits:2,hitMotionValues:[50,150]}]});
 const post=calculateManualMoveSequence({attack,enemy,afterNegationMultiplier:2,
  moves:[{label:'first',frames:30,hits:1,motionValue:100},
   {label:'second',frames:60,hits:2,hitMotionValues:[50,150]}]});
 assert.equal(post.totalFrames,90);
 assert.equal(post.attackCount,3);
 assert.ok(Math.abs(post.damagePerSequence-2*base.damagePerSequence)<0.00001);
 assert.ok(Math.abs(post.damagePerSecond-2*base.damagePerSecond)<0.00001);
});
test('post-negation multipliers are bound to actual browser inputs and validated; unknown game buffs remain explicit user choices',()=>{
 assert.throws(()=>calculateManualDamage({...input,afterNegationMultiplier:7}),/must be between 0 and 5|out of range/);
 assert.throws(()=>calculateManualDamage({...input,afterNegationMultiplier:NaN}),/must be between 0 and 5|out of range/);
 const app=readFileSync(new URL('../public/src/damage-reference-app.mjs',import.meta.url),'utf8');
 const page=readFileSync(new URL('../public/damage-calculator/index.html',import.meta.url),'utf8');
 assert.match(app,/afterNegationMultiplier:\$\('damage-post-buff'\)\.value/);
 assert.match(app,/url\.searchParams\.set\('post',c\.afterNegationMultiplier\)/);
 assert.match(page,/id="damage-post-buff"/);
 assert.match(page,/post-negation multiplier/);
});
