import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('research site requires explicit indexing approval and has noindex-readable robots',async()=>{
 const build=await read('scripts/build.mjs');
 assert.match(build,/RELEASE_INDEX_APPROVED==='1'/);
 assert.match(build,/url&&indexApproved&&\!intentionallyNoindex/);
 assert.match(build,/noindex,follow/);
 assert.match(build,/User-agent: \*/);
 assert.match(build,/Allow: \//);
 assert.match(build,/if\(url&&indexApproved\)/);
 const page=await read('public/weapon-data-workbench/index.html');
 assert.match(page,/noindex,nofollow/);
});
test('catalog level change refreshes the actual AR handoff link',async()=>{
 const app=await read('public/src/weapon-catalog-app.mjs');
 assert.match(app,/catalog-upgrade-level'\)\.addEventListener\('change',renderDetails\)/);
 assert.match(app,/makeArWorkbenchUrl\(chosen.name,arStats,/);
});
test('game client observation UI is offline and blocks demo evidence masquerading as real',async()=>{
 const html=await read('public/weapon-data-workbench/index.html');
 const app=await read('public/src/ar-workbench-app.mjs');
 for(const field of ['arw-observation-app','arw-observation-reg','arw-observation-platform',
  'arw-observation-date','arw-observation-grip','arw-observed-total',
  'arw-observation-reference','arw-observation-export'])assert.ok(html.includes(field));
 assert.match(app,/makeUnreviewedArObservation/);
 assert.match(app,/synthetic:syntheticMode/);
 assert.match(app,/candidateCalculation\.differenceCandidateMinusObserved/);
});
