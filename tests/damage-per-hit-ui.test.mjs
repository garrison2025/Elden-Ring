import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateManualMoveSequence} from '../public/src/damage-moveset-sequence.mjs';

const source=readFileSync(new URL('../public/src/damage-reference-app.mjs',import.meta.url),'utf8');
test('browser input exposes per-hit motion values and forwards them into sequence engine',()=>{
 assert.match(source,/data\.frameField=meta\.name/);
 assert.match(source,/name:'hitMvs'/);
 assert.match(source,/result\.hitMotionValues=parts\.map\(Number\)/);
 assert.match(source,/calculateManualMoveSequence\(/);
});
test('two unequal hit motion values produce unequal damage and valid sequence DPS',()=>{
 const attack={physical:200,magic:0,fire:0,lightning:0,holy:0};
 const enemy=Object.fromEntries(['physical','strike','slash','pierce','magic','fire','lightning','holy']
  .map(type=>[type,{defense:0,negation:0}]));
 const r=calculateManualMoveSequence({attack,enemy,
  moves:[{label:'Double hit',frames:45,hits:2,hitMotionValues:[50,150]}]});
 assert.deepEqual(r.perMove[0].hitDamages,[90,270]);
 assert.equal(r.damagePerSecond,480);
});
test('mismatched hit count is rejected rather than quietly reusing a value',()=>{
 const attack={physical:200,magic:0,fire:0,lightning:0,holy:0};
 const enemy=Object.fromEntries(['physical','strike','slash','pierce','magic','fire','lightning','holy']
  .map(type=>[type,{defense:0,negation:0}]));
 assert.throws(()=>calculateManualMoveSequence({attack,enemy,
  moves:[{label:'Invalid',frames:45,hits:2,hitMotionValues:[50]}]}),/exactly 2/);
});
