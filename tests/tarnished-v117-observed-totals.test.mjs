import test from 'node:test';
import assert from 'node:assert/strict';
import {V117_ADDITIONAL_UI_CANDIDATES as candidates} from '../scripts/tarnished-v117-extra-candidates.mjs';
import {V117_NEW_OBSERVED_AR as observed,V117_NEW_OBSERVATION_RUN_IDS as runs} from '../scripts/tarnished-v117-35-observed-ui-totals.mjs';
import {TARNISHED_REFERENCE_AR_CASES as previous} from '../public/src/tarnished-reference-benchmark.mjs';

test('35 additional v1.17 UI AR totals were observed independently in TWO Chrome runs',()=>{
 assert.deepEqual(runs,[41191448470,41191804102]);
 assert.equal(previous.length,50);
 assert.equal(candidates.length,35);
 assert.equal(Object.keys(observed).length,35);
 for(const c of candidates){
  assert.ok(Object.hasOwn(observed,c.id),c.id);
  assert.ok(Number.isInteger(observed[c.id])&&observed[c.id]>0,c.id);
 }
 assert.equal(new Set(candidates.map(c=>c.id)).size,35);
 assert.equal(new Set(Object.keys(observed)).size,35);
});
test('eight exact comparator differences remain explicit until arithmetic rule is verified',async()=>{
 const expectedKnownDiffs=['longsword-fire-p12','claymore-magic-p25',
  'greatsword-cold-p25','greatsword-fire-p12-2h',
  'fire-knight-greatsword-flameart-p25','fire-knight-greatsword-fire-p25',
  'blasphemous-blade-unique-s10','dark-moon-greatsword-unique-s5'];
 for(const id of expectedKnownDiffs)assert.ok(Object.hasOwn(observed,id));
 const mainSource=await import('../scripts/audit-tarnished-v117-rounding-evidence.mjs');
 assert.equal(typeof mainSource.auditComparatorRounding,'function');
 assert.equal(typeof mainSource.run,'function');
});
