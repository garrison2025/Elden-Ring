import test from 'node:test';
import assert from 'node:assert/strict';
import {auditTarnishedV117ReferenceAR,TARNISHED_REFERENCE_AR_CASES} from '../public/src/tarnished-reference-benchmark.mjs';
const fixture=()=>({
 weapons:[{name:'Uchigatana',weaponName:'Uchigatana',affinityId:0,weaponType:3,paired:false,
   attack:[[0,100]],attributeScaling:[['str',0.8],['dex',0.2]],
   requirements:{str:11,dex:15},attackElementCorrectId:5,reinforceTypeId:2,calcCorrectGraphIds:{0:1}}],
 calcCorrectGraphs:{1:[{maxVal:0,maxGrowVal:0,adjPt:1},{maxVal:148,maxGrowVal:1.48,adjPt:1}]},
 attackElementCorrects:{5:{0:{str:true,dex:true}}},
 reinforceTypes:{2:[{attack:{0:1},attributeScaling:{str:1,dex:1,int:1,fai:1,arc:1}}]}
});
const sample=(opts={})=>({...structuredClone(TARNISHED_REFERENCE_AR_CASES[0]),...opts});
test('source sample is precisely labelled v1.17, actual rendered AR and nonrepeatable URL',()=>{
 const x=TARNISHED_REFERENCE_AR_CASES[0];
 assert.equal(x.expectedTotal,172);
 assert.equal(x.weaponName,'Uchigatana');
 assert.equal(x.affinity,'Standard');
 assert.equal(x.upgrade,0);
 assert.equal(x.sourceRepeatable,false);
 assert.match(x.sourceUrl,/str=40&dex=40/);
 assert.equal(x.sourceVersion,'1.17');
});
test('synthetic example is only a comparison harness, never promoted as game-certified',()=>{
 const s=sample({expectedTotal:136,
   observedDisplay:'Synthetic check Total AR : 136'});
 const r=auditTarnishedV117ReferenceAR(fixture(),{cases:[s]});
 assert.equal(r.candidateCount,1);
 assert.equal(r.results[0].actual,136);
 assert.equal(r.results[0].status,'numeric-match');
 assert.equal(r.matched,1);
 assert.equal(r.recheckedReferenceCases,0);
 assert.equal(r.referenceReleaseReady,false);
 assert.equal(r.currentGameClientVerified,false);
});
test('numeric disagreement and no-data cases are reported, never silently passed',()=>{
 const x=auditTarnishedV117ReferenceAR(fixture());
 assert.equal(x.results[0].actual,136);
 assert.equal(x.results[0].expected,172);
 assert.equal(x.results[0].status,'numeric-mismatch');
 assert.equal(x.referenceReleaseReady,false);
 const missing=auditTarnishedV117ReferenceAR({...fixture(),weapons:[{...fixture().weapons[0],name:'Other',weaponName:'Other'}]});
 assert.equal(missing.results[0].status,'source-variant-missing');
 assert.equal(missing.results[0].actual,null);
});
test('never count unobserved AR or an injected game client verification flag',()=>{
 for(const invalid of [
  {sourceUrl:'https://tarnished.app/weapons/uchigatana'},
  {expectedTotal:999},
  {sourceVersion:'1.17.3'},
  {playerStats:{str:40,dex:40,int:10,fai:10,arc:100}},
  {affinityId:999}
 ]){
  assert.throws(()=>auditTarnishedV117ReferenceAR(fixture(),{
   cases:[sample(invalid)]}),RangeError);
 }
 const duplicate=sample();
 assert.throws(()=>auditTarnishedV117ReferenceAR(fixture(),{cases:[duplicate,duplicate]}),RangeError);
});
