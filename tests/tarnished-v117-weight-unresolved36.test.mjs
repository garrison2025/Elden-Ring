import test from 'node:test';
import assert from 'node:assert/strict';
import {V117_WEIGHT_UNRESOLVED36,getUnresolvedAliasShard} from '../scripts/tarnished-v117-weight-unresolved36.mjs';
test('four nine-item shards cover 36 names exactly once',()=>{
 const shards=Array.from({length:4},(_,i)=>getUnresolvedAliasShard(i));
 assert.deepEqual(shards.flat(),V117_WEIGHT_UNRESOLVED36);
 assert.equal(V117_WEIGHT_UNRESOLVED36.length,36);
 assert.equal(new Set(V117_WEIGHT_UNRESOLVED36.map(x=>x.name)).size,36);
 assert.equal(V117_WEIGHT_UNRESOLVED36.find(x=>x.name==='Miséricorde').siteNames[0],'Misericorde');
 assert.equal(V117_WEIGHT_UNRESOLVED36.find(x=>x.name==='Rivers Of Blood').siteNames[0],'Rivers of Blood');
});
