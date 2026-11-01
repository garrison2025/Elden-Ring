import test from 'node:test';
import assert from 'node:assert/strict';
import {V117_FRESH_UI_CANDIDATES} from '../scripts/tarnished-v117-fresh-candidates.mjs';
import {V117_ADDITIONAL_UI_CANDIDATES} from '../scripts/tarnished-v117-extra-candidates.mjs';
import {TARNISHED_REFERENCE_AR_CASES} from '../public/src/tarnished-reference-benchmark.mjs';
import {makeTarnishedSameInputUrl,TARNISHED_V117_AFFINITIES} from '../public/src/tarnished-same-input.mjs';

test('18 new Tarnished v1.17 candidates are distinct and valid, without manufactured AR numbers',()=>{
 assert.equal(V117_FRESH_UI_CANDIDATES.length,18);
 const prior=new Set([...V117_ADDITIONAL_UI_CANDIDATES,...TARNISHED_REFERENCE_AR_CASES].map(c=>c.id));
 const freshIds=new Set();
 for(const c of V117_FRESH_UI_CANDIDATES){
  assert.equal(freshIds.has(c.id),false,c.id);
  freshIds.add(c.id);
  assert.equal(prior.has(c.id),false,c.id);
  assert.equal(Object.hasOwn(c,'expectedTotal'),false);
  assert.equal(Object.hasOwn(c,'observedAr'),false);
  const affinityId=c.affinity==='None'?-1:TARNISHED_V117_AFFINITIES.indexOf(c.affinity);
  const url=makeTarnishedSameInputUrl({weaponName:c.weaponName,affinityId,upgrade:c.upgrade,stats:{
   str:c.str,dex:c.dex,int:c.int,fai:c.fai,arc:c.arc},twoHanded:c.twoHanded,
   reinforcement:c.somber?'somber':'smithing'});
  assert.ok(url.startsWith('https://www.tarnished.dev/build-planner?'));
 }
});
