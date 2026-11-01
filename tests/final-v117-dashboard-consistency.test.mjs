import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TARNISHED_V117_ALL_DIRECT_WEIGHT_EVIDENCE} from '../public/src/tarnished-v117-public-weights.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');

test('user-facing verification page matches independent evidence tiers with noindex intact',()=>{
 const page=read('../public/validation-status/index.html');
 const readme=read('../README.md');
 const req=JSON.parse(read('../scripts/tarnished-v117-final-req-provenance-487-summary.json'));
 const weight=JSON.parse(read('../scripts/tarnished-v117-final-six-weights.json'));
 assert.equal(TARNISHED_V117_ALL_DIRECT_WEIGHT_EVIDENCE.length,487);
 assert.equal(weight.totalVerified,487);
 assert.equal(req.summary.direct,460);
 assert.equal(req.summary.pinnedOnly,27);
 assert.equal(req.summary.allPinnedValid,487);
 assert.ok(page.includes('Individual weapon weights</span><strong>487 / 487</strong>'));
 assert.ok(page.includes('Minimum five-stat requirements</span><strong>460 / 487</strong>'));
 assert.ok(page.includes('27 are independently pinned-source-only'));
 assert.ok(page.includes('Historical original direct-browser audit: Icerind Hatchet'));
 assert.ok(readme.includes('487/487 directly observed weapon weights'));
 assert.ok(readme.includes('460/487 directly observed five-stat requirements'));
 assert.ok(page.includes('content="noindex,nofollow"'));
 assert.ok(readme.includes('noindex'));
});
