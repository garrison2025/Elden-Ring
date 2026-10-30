import test from 'node:test';
import assert from 'node:assert/strict';
import {HISTORICAL_AR_REPORTS,auditHistoricalPlayerAr} from '../public/src/external-ar-evidence.mjs';

const compact=()=>{
 const graph=[{maxVal:0,maxGrowVal:0,adjPt:1},{maxVal:148,maxGrowVal:1.48,adjPt:1}];
 return {
  weapons:[{name:'Invented Alpha Sword',weaponType:13,paired:false,
   attack:[[0,100]],attributeScaling:[['str',0.8],['dex',0.2]],
   requirements:{str:10,dex:10},attackElementCorrectId:5,reinforceTypeId:2,calcCorrectGraphIds:{0:1}}],
  calcCorrectGraphs:{1:graph},
  attackElementCorrects:{5:{0:{str:true,dex:true}}},
  reinforceTypes:{2:[{attack:{0:1},attributeScaling:{str:1,dex:1,int:1,fai:1,arc:1}}]}
 };
};
const syntheticSample=()=>({
 id:'synthetic-report-1',weaponName:'Invented Alpha Sword',
 upgrade:0,twoHanded:false,stats:{str:40,dex:20,int:10,fai:10,arc:10},
 expectedTotal:136,sourceUrl:'https://example.org/fixture',sourceDate:'2024-01-01',
 evidenceTier:'synthetic-regression-only'
});
test('three public user reports have URLs, explicit Strength/grip/upgrade cases, never current-game certification',()=>{
 assert.equal(HISTORICAL_AR_REPORTS.length,3);
 assert.deepEqual(HISTORICAL_AR_REPORTS.map(x=>x.expectedTotal),[826,853,841]);
 assert.deepEqual(HISTORICAL_AR_REPORTS.map(x=>[x.stats.str,x.twoHanded]),
  [[54,true],[66,true],[91,false]]);
 assert.ok(HISTORICAL_AR_REPORTS.every(x=>x.weaponName==='Heavy Greatsword'&&x.upgrade===25));
 assert.ok(HISTORICAL_AR_REPORTS.every(x=>x.sourceUrl.startsWith('https://www.reddit.com/r/Eldenring/')));
 assert.ok(HISTORICAL_AR_REPORTS.every(x=>x.evidenceTier==='historical-public-player-claim-not-screenshot'));
 assert.ok(HISTORICAL_AR_REPORTS.every(x=>x.assumedNonScalingStats===true));
});
test('separate external-player evidence cross-check matches invented fixture and never certifies current game',()=>{
 const result=auditHistoricalPlayerAr(compact(),{samples:[syntheticSample()],
  gameVersion:'synthetic-v1',sourceReference:'synthetic-only'});
 assert.equal(result.checked,1);
 assert.equal(result.matched,1);
 assert.equal(result.failed,0);
 assert.deepEqual(result.failures,[]);
 assert.equal(result.matchRate,100);
 assert.equal(result.gameClientVerified,false);
 assert.equal(result.currentRegulationVerified,false);
 assert.equal(result.releaseGatePassed,false);
 assert.equal(result.screenshotEvidenceCount,0);
 assert.ok(!JSON.stringify(result).includes('Invented Alpha Sword'));
});
test('a reported source mismatch cannot be silently changed, and only its anonymous ID appears in results',()=>{
 const sample=syntheticSample();sample.expectedTotal=135;
 const data=compact();const original=structuredClone(data);
 const result=auditHistoricalPlayerAr(data,{samples:[sample],gameVersion:'synthetic',
  sourceReference:'invented'});
 assert.equal(result.checked,1);
 assert.equal(result.failed,1);
 assert.deepEqual(result.failures,[{id:'synthetic-report-1',reason:'historical-reported-ar-differs'}]);
 assert.deepEqual(data,original);
});
test('reject duplicate identifiers, unsafe evidence, invalid stats and arbitrary malformed sources',()=>{
 const s=syntheticSample();
 assert.throws(()=>auditHistoricalPlayerAr(compact(),{samples:[s,{...s}]}),/Malformed/);
 assert.throws(()=>auditHistoricalPlayerAr(compact(),{samples:[{...s,sourceUrl:'http://localhost/'}]}),/Malformed/);
 assert.throws(()=>auditHistoricalPlayerAr(compact(),{samples:[{...s,stats:{...s.stats,str:100}}]}),/Malformed/);
 assert.throws(()=>auditHistoricalPlayerAr(compact(),{samples:[{...s,expectedTotal:NaN}]}),/Malformed/);
 assert.throws(()=>auditHistoricalPlayerAr(compact(),{samples:[]}),/Invalid/);
 assert.throws(()=>auditHistoricalPlayerAr(null,{samples:[s]}),/Invalid/);
});
test('source conversion failure is recorded without making guessed AR or leaking source data',()=>{
 const sample=syntheticSample();sample.weaponName='Not A Weapon';
 const r=auditHistoricalPlayerAr(compact(),{samples:[sample],gameVersion:'fictional',sourceReference:'fictional'});
 assert.equal(r.failed,1);
 assert.equal(r.matched,0);
 assert.deepEqual(r.failures,[{id:sample.id,reason:'conversion-or-ar-calculation-failed'}]);
});
