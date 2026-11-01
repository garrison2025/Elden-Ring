import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const from=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const base=from('../scripts/tarnished-v117-direct-requirements-actual10.json');
const arRecovery=from('../scripts/tarnished-v117-direct-req-recovery-22.json');
const highRecovery=from('../scripts/tarnished-v117-direct-req-high-gap-recovery-47.json');

test('actual v1.17 direct requirements accumulate across independent, nonoverlapping sources',()=>{
 assert.equal(base.siteObserved,357);
 assert.equal(arRecovery.rows.filter(x=>x.status==='DIRECT_SITE_REQ_VERIFIED').length,20);
 assert.equal(highRecovery.sourceRun,41266993579);
 assert.equal(highRecovery.independentPasses,2);
 assert.equal(highRecovery.rows.length,47);
 const observed=highRecovery.rows.filter(x=>x.status==='DIRECT_SITE_REQ_VERIFIED');
 const missing=highRecovery.rows.filter(x=>x.status==='NOT_OBSERVED');
 assert.equal(observed.length,46);
 assert.deepEqual(missing.map(x=>x.name),['Great Épée']);
 assert.equal(highRecovery.siteVsPinnedMismatches,0);
 assert.equal(highRecovery.newlyVerified,46);
 const baseMap=new Map(base.rows.map(x=>[x.id,x]));
 const previousIds=new Set(arRecovery.rows.map(x=>x.id));
 const seen=new Set();
 for(const row of highRecovery.rows){
  assert.ok(!seen.has(row.id),'duplicate high-gap sample');
  seen.add(row.id);
  assert.ok(!previousIds.has(row.id),'must not reuse earlier AR-gap sample');
  assert.equal(baseMap.get(row.id)?.name,row.name);
  assert.equal(baseMap.get(row.id)?.status,'NOT_OBSERVED','original verified site facts are immutable');
  assert.ok(Number.isInteger(row.sourceShard)&&row.sourceShard>=0&&row.sourceShard<6);
  if(row.status==='DIRECT_SITE_REQ_VERIFIED'){
   assert.equal(row.observedTwice,true);
   assert.equal(row.requirements.length,5);
   assert.ok(row.requirements.every(x=>Number.isInteger(x)&&x>=0&&x<=99));
   assert.ok(['None','Standard'].includes(row.affinity));
  }else{
   assert.equal(row.observedTwice,false);
   assert.equal(row.requirements,null);
  }
 }
 assert.equal(357+20+46,423);
 assert.equal(487-(357+20+46),64);
 assert.equal(highRecovery.combinedVerified,423);
 assert.equal(highRecovery.remainingUnobserved,64);
});
