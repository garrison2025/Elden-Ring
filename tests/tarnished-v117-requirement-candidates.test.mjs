import test from 'node:test';
import assert from 'node:assert/strict';
import {REQUIREMENT_CANDIDATES as samples,getRequirementsShard} from '../scripts/tarnished-v117-requirement-candidates.mjs';
test('12 non-overlapping public UI Req: shards cover exactly all 487 weapon names',()=>{
 assert.equal(samples.length,487);
 assert.equal(new Set(samples.map(x=>x.name)).size,487);
 assert.equal(new Set(samples.map(x=>x.id)).size,487);
 assert.deepEqual(Array.from({length:12},(_,i)=>getRequirementsShard(i)).flat(),samples);
 assert.ok(samples.every(x=>!Object.hasOwn(x,'requirements')&&x.siteNames.length>=1));
 assert.equal(samples.filter(x=>x.previouslyWeightVerified).length,481);
});
