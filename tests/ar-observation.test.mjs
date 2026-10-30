import test from 'node:test';
import assert from 'node:assert/strict';
import {makeUnreviewedArObservation} from '../public/src/ar-observation.mjs';

const example=()=>({
 weaponName:'Fictional Heavy Sword',sourceVersion:'pinned-v1.17',
 gameAppVersion:'1.17.2',regulationVersion:'1.17.3',platform:'PC',
 observedAt:'2026-10-31',evidenceReference:'local game-menu screenshot 001.png',
 stats:{str:60,dex:20,int:10,fai:10,arc:10},upgrade:25,twoHanded:true,
 observedTotal:850,candidateTotal:850
});
test('independent game menu observation is an unreviewed draft even at exact parity',()=>{
 const o=makeUnreviewedArObservation(example());
 assert.equal(o.candidateCalculation.numericMatch,true);
 assert.equal(o.reviewStatus,'UNREVIEWED');
 assert.equal(o.gameClientVerified,false);
 assert.equal(o.publicationApproved,false);
 assert.equal(o.sourceEvidence.screenshotReviewed,false);
 assert.equal(o.candidateCalculation.parameterSourceVersion,'pinned-v1.17');
 assert.equal(o.regulationVersion,'1.17.3');
 assert.deepEqual(Object.keys(o.exactInputs.stats),['str','dex','int','fai','arc']);
});
test('the observed game total and candidate total remain independently recorded',()=>{
 const o=makeUnreviewedArObservation({...example(),observedTotal:847});
 assert.equal(o.candidateCalculation.differenceCandidateMinusObserved,3);
 assert.equal(o.candidateCalculation.numericMatch,false);
 assert.equal(o.expectedOutputs.totalAr,847);
});
test('draft rejects fictional modes, missing evidence and invalid game state',()=>{
 const cases=[
 {synthetic:true},{evidenceReference:''},{gameAppVersion:''},{regulationVersion:''},
 {platform:''},{observedAt:'2026-02-30'},{observedAt:'yesterday'},
 {upgrade:26},{stats:{...example().stats,str:100}},{twoHanded:'true'},
 {observedTotal:NaN},{candidateTotal:1.5},{weaponName:'   '}
 ];
 for(const fields of cases)
  assert.throws(()=>makeUnreviewedArObservation({...example(),...fields}),RangeError);
});
