import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculateManualMoveSequence} from '../public/src/damage-moveset-sequence.mjs';

const app=readFileSync(new URL('../public/src/damage-reference-app.mjs',import.meta.url),'utf8');
test('browser UI exposes explicit per-hit values and forwards them to the engine',()=>{
 assert.match(app,/name:'hitMvs'/);
 assert.match(app,/entry\.hitMotionValues=tokens\.map\(Number\)/);
 assert.match(app,/if\(!hitsRaw\|\|!framesRaw\|\|\(!perHitRaw&&!uniformRaw\)\)/);
 assert.match(app,/if\(tokens\.some\(s=>!s\|\|!/);
});
test('independent per-hit motion values change calculated sequence damage',()=>{
 const attack={physical:200,magic:0,fire:0,lightning:0,holy:0};
 const enemy=Object.fromEntries(['physical','strike','slash','pierce','magic','fire','lightning','holy']
  .map(type=>[type,{defense:0,negation:0}]));
 const result=calculateManualMoveSequence({attack,enemy,moves:[
  {label:'multi-hit',frames:60,hits:2,hitMotionValues:[50,150]}
 ]});
 assert.deepEqual(result.perMove[0].hitDamages,[90,270]);
 assert.equal(result.damagePerSecond,360);
 assert.throws(()=>calculateManualMoveSequence({attack,enemy,moves:[
  {label:'invalid',frames:60,hits:2,hitMotionValues:[100]}
 ]}),/exactly 2/);
});
