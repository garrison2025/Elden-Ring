import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const original=load('../scripts/tarnished-v117-direct-requirements-actual10.json');
const first=load('../scripts/tarnished-v117-direct-req-recovery-22.json');
const second=load('../scripts/tarnished-v117-direct-req-high-gap-recovery-47.json');
const third=load('../scripts/tarnished-v117-direct-req-origin-recovery-36.json');

test('real selected classes and public Req produce exactly 35 new nonoverlapping observed facts',()=>{
 assert.equal(original.siteObserved,357);
 assert.equal(third.sourceRun,41267709648);
 assert.equal(third.independentPasses,2);
 assert.equal(third.rows.length,36);
 assert.equal(third.baseVerified,423);
 const previous=new Set([...first.rows,...second.rows].map(x=>x.id));
 const base=new Map(original.rows.map(x=>[x.id,x]));
 let found=0,missing=0;const names=new Set();
 for(const x of third.rows){
  assert.ok(!previous.has(x.id),'must not replace a previously observed or retried fact');
  assert.ok(!names.has(x.name),'duplicate class-switched item');names.add(x.name);
  assert.ok(['NOT_OBSERVED','REQ_NOT_EXPOSED_AT_WRETCH10'].includes(base.get(x.id)?.status));
  assert.ok(Number.isInteger(x.sourceShard)&&x.sourceShard>=0&&x.sourceShard<6);
  if(x.status==='DIRECT_SITE_REQ_VERIFIED'){
   found++;
   assert.equal(x.observedTwice,true);
   assert.ok(typeof x.originName==='string'&&x.originName);
   assert.equal(x.originStats.length,8);
   assert.ok(x.originStats.every(n=>Number.isInteger(n)&&n>=1&&n<=99));
   assert.ok(x.requirements.length===5&&x.requirements.every(n=>Number.isInteger(n)&&n>=0&&n<=99));
   assert.ok(['Standard','None'].includes(x.affinity));
  }else{
   missing++;
   assert.equal(x.status,'NOT_OBSERVED');
   assert.equal(x.requirements,null);
   assert.equal(x.observedTwice,false);
  }
 }
 assert.equal(found,35);
 assert.equal(missing,1);
 assert.deepEqual(third.rows.filter(x=>x.status==='NOT_OBSERVED').map(x=>x.name),['Frenzied Flame Seal']);
 assert.equal(357+20+46+found,458);
 assert.equal(487-458,29);
 assert.equal(third.combinedVerified,458);
 assert.equal(third.remainingUnobserved,29);
 assert.equal(third.siteVsPinnedMismatches,0);
});
