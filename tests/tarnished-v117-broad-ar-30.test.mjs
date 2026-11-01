import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_BROAD_AR_30} from '../scripts/tarnished-v117-broad-ar-30-candidates.mjs';
const m=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-broad-ar-30-verified.json',import.meta.url),'utf8'));
test('thirty real public v1.17 AR cases agreed twice and matched pinned source',()=>{
 assert.equal(m.runId,41271639218);
 assert.equal(m.independentBrowserPasses,2);
 assert.equal(m.counts.total,30);
 assert.equal(m.counts.matched,30);
 assert.equal(m.counts.mismatched,0);
 assert.equal(m.counts.unobserved,0);
 assert.equal(m.counts.regularAffinities,13);
 assert.equal(m.counts.somberWeaponCases,4);
 assert.equal(m.rows.length,30);
 const planned=new Map(V117_BROAD_AR_30.map(x=>[x.id,x]));
 assert.equal(new Set(m.rows.map(x=>x.id)).size,30);
 for(const row of m.rows){
  const c=planned.get(row.id);
  assert.ok(c,row.id);
  assert.equal(row.observedTwice,true);
  assert.equal(row.delta,0);
  assert.equal(row.publicSiteAr,row.pinnedLocalAr);
  assert.equal(row.weapon,c.weaponName);
  assert.equal(row.affinity,c.affinity);
  assert.equal(row.upgrade,c.upgrade);
  assert.deepEqual(row.stats,{str:c.str,dex:c.dex,int:c.int,fai:c.fai,arc:c.arc});
  assert.equal(row.twoHanded,c.twoHanded);
  assert.equal(row.reinforcement,c.somber?'somber':'regular');
 }
});
