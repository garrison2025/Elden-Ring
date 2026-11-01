import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const from=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const original=from('../scripts/tarnished-v117-direct-requirements-actual10.json');
const recovered=from('../scripts/tarnished-v117-direct-req-origin-recovery-36.json');
const torch=from('../scripts/tarnished-v117-steel-torch-origin-req.json');

test('real public Steel Torch Req is separate from all previously verified facts',()=>{
 assert.equal(original.rows.find(x=>x.name==='Steel-wire Torch')?.status,'NOT_OBSERVED');
 assert.ok(!recovered.rows.some(x=>x.name==='Steel-wire Torch'));
 assert.equal(torch.independentChromiumReads,2);
 assert.equal(torch.sourceRun,41268725854);
 assert.equal(torch.item.name,'Steel-wire Torch');
 assert.equal(torch.item.originName,'Astrologer');
 assert.deepEqual(torch.item.stats,[8,12,16,7,9]);
 assert.deepEqual(torch.item.siteRequirements,[10,8,0,0,0]);
 assert.equal(torch.item.sitePinnedMismatchCount,0);
 assert.equal(torch.item.verifiedInputAndReqTwice,true);
 assert.equal(torch.previousDirectlyObservedRequirements,458);
 assert.equal(torch.combinedDirectlyObserved,459);
 assert.equal(torch.remainingUnobserved,28);
});
