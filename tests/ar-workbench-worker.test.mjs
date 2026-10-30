import test from 'node:test';
import assert from 'node:assert/strict';
const data=()=>{
 const stats={str:1,dex:1,int:1,fai:1,arc:1};
 return {
  weapons:[{name:'Imaginary Starter Sword',weaponName:'Fictional',weaponType:13,
   attack:[[0,100]],attributeScaling:[['str',0.8],['dex',0.2]],
   requirements:{str:10,dex:10},attackElementCorrectId:1,reinforceTypeId:1,
   calcCorrectGraphIds:{0:1}}],
  calcCorrectGraphs:{1:[{maxVal:0,maxGrowVal:0,adjPt:1},{maxVal:148,maxGrowVal:1.48,adjPt:1}]},
  attackElementCorrects:{1:{0:{str:true,dex:true}}},
  reinforceTypes:{1:[{attack:{0:1},attributeScaling:stats}]}
 };
};
// The worker message contract is tested in a real Node module environment,
// with a mock for the browser worker's self.postMessage transport.
const sent=[];
globalThis.self={postMessage:m=>sent.push(m)};
await import('../public/src/ar-workbench-worker.mjs');
const command=m=>{sent.length=0;globalThis.self.onmessage({data:m});return sent.at(-1)};
test('worker loads local synthetic compact JSON, searches and calculates without remote calls',()=>{
 let r=command({op:'load',text:JSON.stringify(data()),version:'synthetic-v1',reference:'invented local input'});
 assert.equal(r.op,'loaded');assert.equal(r.count,1);
 assert.equal(r.preview.names[0],'Imaginary Starter Sword');
 r=command({op:'search',term:'starter'});
 assert.equal(r.op,'search-results');assert.equal(r.result.matches,1);
 r=command({op:'select',name:'Imaginary Starter Sword'});
 assert.equal(r.op,'selected');assert.deepEqual(r.description.upgradeLevels,[0]);
 r=command({op:'compare',stats:{str:40,dex:20,int:10,fai:10,arc:10},upgrade:0});
 assert.equal(r.op,'compared');assert.equal(r.result.oneHand.total,136);assert.equal(r.result.twoHand.total,152);
});
test('worker rejects missing upgrade and clears previously loaded weapon dataset',()=>{
 let r=command({op:'compare',stats:{str:40,dex:20,int:10,fai:10,arc:10},upgrade:25});
 assert.equal(r.op,'error');assert.match(r.message,/no supplied data/);
 r=command({op:'clear'});assert.equal(r.op,'cleared');
 r=command({op:'search',term:''});assert.equal(r.op,'error');assert.match(r.message,/Import a local/);
 r=command({op:'load',text:'not-json',version:'synthetic-v1',reference:'invented test'});
 assert.equal(r.op,'error');assert.equal(r.phase,'load');
});

test('one-click fictional demo loads, compares and can be cleared without uploads',()=>{
 let r=command({op:'demo'});
 assert.equal(r.op,'loaded');assert.equal(r.synthetic,true);assert.equal(r.count,4);
 assert.ok(r.preview.names.every(x=>x.includes('Fictional')&&x.includes('QA ONLY')));
 r=command({op:'select',name:'Fictional Bronze Sword — QA ONLY'});
 assert.equal(r.op,'selected');
 r=command({op:'compare',stats:{str:40,dex:20,int:10,fai:10,arc:10},upgrade:0});
 assert.equal(r.op,'compared');assert.equal(r.result.oneHand.total,136);assert.equal(r.result.twoHand.total,152);
 assert.equal(command({op:'clear'}).op,'cleared');
 assert.equal(command({op:'compare',stats:{str:40,dex:20,int:10,fai:10,arc:10},upgrade:0}).op,'error');
});

test('worker compares two invented weapon profiles with separate reinforcement levels',()=>{
 let res=command({op:'demo'});assert.equal(res.op,'loaded');
 res=command({op:'select',name:'Fictional Bronze Sword — QA ONLY'});
 assert.equal(res.op,'selected');
 res=command({op:'selectB',name:'Fictional Heavy Sword — QA ONLY'});
 assert.equal(res.op,'selectedB');
 assert.deepEqual(res.description.upgradeLevels,[0,1]);
 res=command({op:'compare-weapons',requestId:27,
  stats:{str:40,dex:20,int:10,fai:10,arc:10},leftUpgrade:0,rightUpgrade:1,twoHanded:false});
 assert.equal(res.op,'compared-weapons');assert.equal(res.requestId,27);
 assert.equal(res.result.left.total,136);
 assert.ok(res.result.right.total>res.result.left.total);
 assert.ok(res.result.components.length>0);
 assert.match(res.result.note,/NOT in-game certified/);
});
test('worker rejects unprovided enhancement or missing B and clears both profiles',()=>{
 assert.equal(command({op:'compare-weapons',
  stats:{str:40,dex:20,int:10,fai:10,arc:10},leftUpgrade:0,rightUpgrade:25,twoHanded:false}).op,'error');
 assert.equal(command({op:'clear'}).op,'cleared');
 const r=command({op:'compare-weapons',stats:{str:40,dex:20,int:10,fai:10,arc:10},leftUpgrade:0,rightUpgrade:0});
 assert.equal(r.op,'error');assert.match(r.message,/Choose two weapon entries/);
});

test('comparison and grip worker responses return request IDs for UI stale-result filtering',()=>{
 command({op:'demo'});
 command({op:'select',name:'Fictional Bronze Sword — QA ONLY'});
 command({op:'selectB',name:'Fictional Heavy Sword — QA ONLY'});
 const stats={str:40,dex:20,int:10,fai:10,arc:10};
 let answer=command({op:'compare',requestId:1001,stats,upgrade:0});
 assert.equal(answer.op,'compared');assert.equal(answer.requestId,1001);
 answer=command({op:'compare-weapons',requestId:2002,stats,leftUpgrade:0,rightUpgrade:0,twoHanded:true});
 assert.equal(answer.op,'compared-weapons');assert.equal(answer.requestId,2002);
});

test('research worker audits the entire synthetic dataset and never approves publication',()=>{
 let r=command({op:'demo'});assert.equal(r.op,'loaded');
 r=command({op:'audit'});
 assert.equal(r.op,'audit-complete');
 assert.equal(r.report.totals.records,4);
 assert.equal(r.report.totals.convertible,4);
 assert.equal(r.report.totals.blocked,0);
 assert.equal(r.report.scopeReview.needsReview,4);
 assert.equal(r.report.scopeReview.partialUpgradeRows,4);
 assert.equal(r.report.candidateModelScopeComplete,false);
 assert.equal(r.report.publishable,false);
 assert.ok(!JSON.stringify(r.report).includes('Fictional Bronze Sword'));
 assert.equal(command({op:'clear'}).op,'cleared');
 r=command({op:'audit'});
 assert.equal(r.op,'error');assert.equal(r.phase,'audit');
});

test('worker sends anonymous audit progress and never reveals original item names in report',()=>{
 const all=[];
 const original=self.postMessage;
 self.postMessage=m=>all.push(m);
 try{
  self.onmessage({data:{op:'demo'}});
  all.length=0;
  self.onmessage({data:{op:'audit'}});
  assert.equal(all[0].op,'audit-progress');
  assert.deepEqual(all[0].progress,{processed:4,total:4});
  assert.equal(all[1].op,'audit-complete');
  assert.ok(!JSON.stringify(all[1].report).includes('Fictional Bronze Sword'));
  assert.ok(!JSON.stringify(all[1].report).includes('Invented regression fixture'));
 }finally{self.postMessage=original;}
});

test('worker resolves source-defined base weapon to actual affinity variants and returns correlated request IDs',()=>{
 const source={
  ...data(),
  weapons:[
   {...data().weapons[0],name:'Invented Claymore',weaponName:'Claymore',affinityId:0},
   {...data().weapons[0],name:'Heavy Invented Claymore',weaponName:'Claymore',affinityId:1}
  ]
 };
 let response=command({op:'load',text:JSON.stringify(source),version:'fictional',reference:'self-produced synthetic'});
 assert.equal(response.op,'loaded');
 response=command({op:'family',requestId:14,name:'Claymore'});
 assert.equal(response.op,'family-results');
 assert.equal(response.requestId,14);
 assert.equal(response.result.matches,2);
 assert.equal(response.result.defaultName,'Invented Claymore');
 response=command({op:'select',requestId:17,name:'Heavy Invented Claymore'});
 assert.equal(response.op,'selected');assert.equal(response.requestId,17);
 response=command({op:'search',requestId:20,term:'heavy'});
 assert.equal(response.op,'search-results');assert.equal(response.requestId,20);
 response=command({op:'family',requestId:21,name:'No such variant'});
 assert.equal(response.op,'family-results');assert.equal(response.result.found,false);
 assert.equal(command({op:'clear'}).op,'cleared');
});
