import test from 'node:test';
import assert from 'node:assert/strict';
import {compareTarnishedChromeObservations} from '../scripts/compare-tarnished-chrome-ui.mjs';

const source=()=>({
 weapons:[{name:'Uchigatana',weaponName:'Uchigatana',affinityId:0,
   weaponType:3,paired:false,attack:[[0,100]],
   attributeScaling:[['str',0.8],['dex',0.2]],
   requirements:{str:11,dex:15},attackElementCorrectId:5,
   reinforceTypeId:2,calcCorrectGraphIds:{0:1}}],
 calcCorrectGraphs:{1:[{maxVal:0,maxGrowVal:0,adjPt:1},{maxVal:148,maxGrowVal:1.48,adjPt:1}]},
 attackElementCorrects:{5:{0:{str:true,dex:true}}},
 reinforceTypes:{2:[{attack:{0:1},attributeScaling:{str:1,dex:1,int:1,fai:1,arc:1}}]}
});
const observation=(observedAr=136)=>({
 id:'fresh-uchigatana-qa',
 request:{id:'fresh-uchigatana-qa',weaponName:'Uchigatana',affinity:'Standard',
  str:40,dex:20,int:10,fai:10,arc:10,upgrade:0,twoHanded:false,somber:false},
 status:'INPUT-VERIFIED-AR',verifiedInputs:true,observedAr,
 version:'Elden Ring Version: v1.17',
 url:'https://www.tarnished.dev/build-planner?rh1=Uchigatana',
 browserWeaponBlock:'Equipped Right Hand 1\nUchigatana\nStandard\nTotal AR : '+observedAr
});
const snap=(cases)=>({comparatorVersion:'v1.17',cases});

test('an exact same-input numerical match remains UNPROMOTED until external repeat and review',()=>{
 const a=compareTarnishedChromeObservations(snap([observation()]),source());
 assert.equal(a.counts.total,1);
 assert.equal(a.counts.numericallyMatched,1);
 assert.equal(a.counts.newApprovedCases,0);
 assert.equal(a.results[0].calculated,136);
 assert.equal(a.results[0].status,'matched-unpromoted');
 assert.equal(a.results[0].needsIndependentRepeat,true);
 assert.equal(a.gameClientVerificationRequired,false);
});
test('a numeric mismatch is never treated as match or silenced by arbitrary tolerance',()=>{
 const a=compareTarnishedChromeObservations(snap([observation(137)]),source());
 assert.equal(a.counts.numericMismatches,1);
 assert.equal(a.results[0].status,'numeric-mismatch');
 assert.equal(a.results[0].delta,-1);
 assert.equal(a.counts.newApprovedCases,0);
});
test('unknown UI version, edited controls and absent source variants never become evidence',()=>{
 const changed={...observation(),verifiedInputs:false};
 const missing={...observation(),id:'other',request:{...observation().request,id:'other',weaponName:'Unknown Sword'}};
 const wrongVersion={...observation(),id:'version',request:{...observation().request,id:'version'},version:'v1.16'};
 const a=compareTarnishedChromeObservations(snap([changed,missing,wrongVersion]),source());
 assert.equal(a.counts.numericallyMatched,0);
 assert.equal(a.counts.unverifiedOrBlocked,3);
 assert.deepEqual(a.results.map(x=>x.status),[
  'unverified-live-input','source-variant-unavailable','unverified-live-input'
 ]);
});
test('no source or incomplete capture is rejected rather than recorded as reference pass',()=>{
 assert.throws(()=>compareTarnishedChromeObservations({cases:[]},source()),RangeError);
 assert.throws(()=>compareTarnishedChromeObservations(snap([observation()]),null),RangeError);
 assert.equal(compareTarnishedChromeObservations(snap([{id:'broken'}]),source())
  .results[0].status,'malformed-observation');
});
