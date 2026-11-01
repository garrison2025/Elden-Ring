import test from 'node:test';
import assert from 'node:assert/strict';
import {V117_WEIGHT_REMAINING380,getRemainingWeightShard} from '../scripts/tarnished-v117-weight-remaining380.mjs';
test('all remaining 380 names are covered exactly once by 12 deterministic shards',()=>{
 const shards=Array.from({length:12},(_,i)=>getRemainingWeightShard(i));
 const flat=shards.flat();
 assert.equal(flat.length,380);
 assert.deepEqual(flat,V117_WEIGHT_REMAINING380);
 assert.equal(new Set(flat.map(x=>x.name)).size,380);
 assert.equal(new Set(flat.map(x=>x.id)).size,380);
 assert.ok(shards.every(x=>x.length===31||x.length===32));
 assert.ok(flat.every(x=>!Object.hasOwn(x,'weight')&&!Object.hasOwn(x,'observedWeight')));
});
