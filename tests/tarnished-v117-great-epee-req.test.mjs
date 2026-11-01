import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const parse=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const base=parse('../scripts/tarnished-v117-direct-requirements-actual10.json');
const recovered=parse('../scripts/tarnished-v117-direct-req-recovery-22.json');
const high=parse('../scripts/tarnished-v117-direct-req-high-gap-recovery-47.json');
const origin=parse('../scripts/tarnished-v117-direct-req-origin-recovery-36.json');
const epee=parse('../scripts/tarnished-v117-great-epee-direct-req.json');
test('Great epee is genuine newly verified direct v1.17 Req, total 460',()=>{
 assert.equal(epee.independentBrowserPasses,2);
 assert.equal(epee.sourceRun,41268947125);
 assert.equal(epee.weapon.actualSiteName,'Great epee');
 assert.equal(epee.weapon.affinity,'Standard');
 assert.deepEqual(epee.weapon.requirements,[15,16,0,0,0]);
 assert.equal(epee.weapon.sitePinnedMismatch,0);
 assert.equal(base.rows.find(x=>x.name==='Great Épée').status,'NOT_OBSERVED');
 assert.equal(recovered.rows.filter(x=>x.status==='DIRECT_SITE_REQ_VERIFIED').length,20);
 assert.equal(high.rows.filter(x=>x.status==='DIRECT_SITE_REQ_VERIFIED').length,46);
 assert.equal(origin.rows.filter(x=>x.status==='DIRECT_SITE_REQ_VERIFIED').length,35);
 // Steel-Wire Torch was separately certified and merged in PR #117; do not require its file on this earlier branch.
 assert.equal(base.siteObserved+20+46+35,458);
 assert.equal(epee.previousVerified,459); // PR #117 separately added Steel-Wire Torch
 assert.equal(epee.totalDirectVerified,460);
 assert.equal(epee.remainingNotDirectlyObserved,27);
});
