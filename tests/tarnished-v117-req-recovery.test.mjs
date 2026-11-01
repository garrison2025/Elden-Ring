import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const original=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-direct-requirements-actual10.json',import.meta.url),'utf8'));
const recovered=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-direct-req-recovery-22.json',import.meta.url),'utf8'));
const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));

test('original direct UI requirements remain unchanged; 22 retries add exactly 20 verified facts',()=>{
 assert.equal(original.total,487);
 assert.equal(original.siteObserved,357);
 assert.equal(original.rows.length,487);
 assert.equal(recovered.baseDataset,'scripts/tarnished-v117-direct-requirements-actual10.json');
 assert.equal(recovered.sourceRun,41266643033);
 assert.equal(recovered.independentPasses,2);
 assert.equal(recovered.rows.length,22);
 const ids=new Set(),names=new Set();
 let valid=0,unobserved=0;
 const old=new Map(original.rows.map(x=>[x.id,x]));
 const allNames=new Set(catalog.weapons.map(x=>x.name));
 for(const row of recovered.rows){
  assert.ok(!ids.has(row.id),'duplicate observation ID');
  assert.ok(!names.has(row.name),'duplicate weapon name');
  ids.add(row.id);names.add(row.name);
  assert.ok(allNames.has(row.name));
  assert.equal(old.get(row.id)?.name,row.name);
  assert.equal(old.get(row.id)?.status,'NOT_OBSERVED','must never overwrite an already verified site fact');
  assert.ok(row.sourceShard===0||row.sourceShard===1);
  if(row.status==='DIRECT_SITE_REQ_VERIFIED'){
   ++valid;
   assert.equal(row.observedTwice,true);
   assert.ok(typeof row.siteName==='string'&&row.siteName);
   assert.ok(['Standard','None'].includes(row.affinity));
   assert.equal(row.requirements.length,5);
   assert.ok(row.requirements.every(n=>Number.isInteger(n)&&n>=0&&n<=99));
  }else{
   ++unobserved;
   assert.equal(row.status,'NOT_OBSERVED');
   assert.equal(row.observedTwice,false);
   assert.equal(row.requirements,null);
  }
 }
 assert.equal(valid,20);
 assert.equal(unobserved,2);
 assert.deepEqual(recovered.rows.filter(x=>x.status==='NOT_OBSERVED').map(x=>x.name),
  ['Serpent-hunter','Steel-wire Torch']);
 assert.equal(original.siteObserved+valid,377);
 assert.equal(original.total-(original.siteObserved+valid),110);
 assert.equal(recovered.combinedVerified,377);
 assert.equal(recovered.remainingUnobserved,110);
});

test('three newly observed community discrepancies retain actual v1.17 Req tuples',()=>{
 const expected=[
  ['Regalia Of Eochaid',[12,18,0,0,15],[12,0,0,0,0]],
  ['Staff Of The Avatar',[34,8,0,24,0],[34,0,0,0,0]],
  ['Sword Of Night And Flame',[12,12,24,24,0],[12,12,0,24,0]]
 ];
 const current=new Map(recovered.rows.map(x=>[x.name,x]));
 const oldCommunity=new Map(catalog.weapons.map(x=>[x.name,x]));
 for(const [name,site,old] of expected){
  assert.deepEqual(current.get(name).requirements,site);
  assert.deepEqual(oldCommunity.get(name).requirements,old);
 }
});
