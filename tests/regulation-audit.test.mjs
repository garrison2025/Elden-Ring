import test from 'node:test';
import assert from 'node:assert/strict';
import {auditCompactRegulation} from '../public/src/regulation-audit.mjs';
const fixture=()=>{
 const graph=[{maxVal:0,maxGrowVal:0,adjPt:1},{maxVal:148,maxGrowVal:1.48,adjPt:1}];
 const atr={str:1,dex:1,int:1,fai:1,arc:1};
 const base={weaponType:13,attack:[[0,100]],attributeScaling:[['str',0.8],['dex',0.2]],
  requirements:{str:10,dex:10},attackElementCorrectId:5,reinforceTypeId:2,calcCorrectGraphIds:{0:1}};
 return {
  weapons:[
   {...base,name:'Invented Alpha Sword'},
   {...base,name:'Invented Beta Bow',weaponType:51,attack:[[0,80]]},
   {...base,name:'Invented Gamma Sword',sorceryTool:true,attack:[[0,100],[7,44]]}
  ],
  calcCorrectGraphs:{1:graph},attackElementCorrects:{5:{0:{str:true,dex:true}}},
  reinforceTypes:{2:[{attack:{0:1},attributeScaling:atr}]}
 };
};
const opts={gameVersion:'fictional-1',sourceReference:'Synthetic local test data'};
test('whole dataset structural report is aggregate-only and NEVER a release approval',()=>{
 const report=auditCompactRegulation(fixture(),opts);
 assert.equal(report.totals.records,3);
 assert.equal(report.totals.convertible,3);
 assert.equal(report.totals.blocked,0);
 assert.equal(report.candidateStructureComplete,true);
 assert.equal(report.publishable,false);
 assert.equal(report.conversionCoverage,100);
 assert.deepEqual(report.byGripMode,{standard:2,paired:0,'forced-two-hand':1});
 assert.deepEqual(report.byReinforcementLength,{'1 level':3});
 assert.equal(report.byDamageType.physical,3);
 assert.equal(report.excludedMechanics.spellToolEntries,1);
 assert.equal(report.excludedMechanics.statusEffectEntries,1);
 assert.equal(report.scopeReview.needsReview,3);
 assert.equal(report.scopeReview.partialUpgradeRows,3);
 assert.equal(report.scopeReview.byReason['status-buildup-not-modeled'],1);
 assert.equal(report.scopeReview.byReason['spell-tool-formula-not-modeled'],1);
 assert.equal(report.scopeReview.byReason['incomplete-or-unknown-upgrade-coverage'],3);
 assert.equal(report.scopeReview.limitedModelCandidates,0);
 assert.equal(report.candidateModelScopeComplete,false);
 assert.ok(!Object.hasOwn(report,'sourceReference'));
 assert.ok(!JSON.stringify(report).includes('Invented Alpha Sword'));
});
test('invalid correction tables, reinforcement rows and duplicate names are classified individually',()=>{
 const data=fixture();
 data.weapons[0].calcCorrectGraphIds={0:999};
 data.weapons[1].reinforceTypeId=999;
 data.weapons.push(structuredClone(data.weapons[2]));
 const result=auditCompactRegulation(data,opts);
 assert.equal(result.totals.records,4);
 assert.equal(result.totals.blocked,4);
 assert.equal(result.totals.duplicateEntries,2);
 assert.equal(result.invalidByReason['missing-correction-graph'],1);
 assert.equal(result.invalidByReason['missing-reinforcement-table'],1);
 assert.equal(result.invalidByReason['duplicate-exact-name'],2);
 assert.deepEqual(result.anonymousExamples.map(x=>x.index),[0,1,2,3]);
 assert.equal(result.publishable,false);
});
test('missing names, empty dataset and bad option values fail closed',()=>{
 const data=fixture();
 data.weapons[0].name='';
 let r=auditCompactRegulation(data,opts);
 assert.equal(r.invalidByReason['invalid-item-name'],1);
 assert.throws(()=>auditCompactRegulation({...data,weapons:[]},opts),/1 to 50000/);
 assert.throws(()=>auditCompactRegulation(data,{...opts,gameVersion:''}),/gameVersion/);
 assert.throws(()=>auditCompactRegulation(data,{...opts,maxExamples:101}),/maxExamples/);
 r=auditCompactRegulation(data,{...opts,maxExamples:0});
 assert.deepEqual(r.anonymousExamples,[]);
});
test('batch audit examines valid subset and refuses hidden inherited table IDs',()=>{
 const data=fixture();
 data.weapons[0].reinforceTypeId='toString';
 const r=auditCompactRegulation(data,opts);
 assert.equal(r.totals.blocked,1);
 assert.equal(r.totals.convertible,2);
 assert.equal(r.invalidByReason['missing-reinforcement-table'],1);
});

test('full reinforcement tables yield limited-model candidates without claiming real-game validity',()=>{
 const data=fixture();
 data.weapons=[data.weapons[0]];
 data.reinforceTypes[2]=Array.from({length:11},(_,i)=>({
  attack:{0:1+i/10},attributeScaling:{str:1,dex:1,int:1,fai:1,arc:1}
 }));
 const progress=[];
 const report=auditCompactRegulation(data,{...opts,onProgress:v=>progress.push(v)});
 assert.equal(report.totals.convertible,1);
 assert.equal(report.scopeReview.needsReview,0);
 assert.equal(report.scopeReview.limitedModelCandidates,1);
 assert.equal(report.candidateModelScopeComplete,true);
 assert.equal(report.publishable,false);
 assert.deepEqual(progress,[{processed:1,total:1}]);
});
test('progress and anonymized report exclude raw provenance',()=>{
 const data=fixture(),progress=[];
 const report=auditCompactRegulation(data,{...opts,
  sourceReference:'Secret local path and private weapon list',
  onProgress:v=>progress.push(v),maxExamples:0});
 assert.equal(report.sourceReferenceProvided,true);
 assert.ok(!JSON.stringify(report).includes('Secret local path'));
 assert.deepEqual(progress,[{processed:3,total:3}]);
 assert.throws(()=>auditCompactRegulation(data,{...opts,onProgress:'wrong'}),/onProgress/);
});
