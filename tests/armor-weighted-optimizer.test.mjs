import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARMOR_METRICS} from '../public/src/armor-source-optin.mjs';
import {optimizeWeightedArmor,weightedVerifiedArmorSubset} from '../public/src/armor-weighted-optimizer.mjs';
const slots=['Head','Chest','Arms','Legs'];
const rows=()=>slots.flatMap((slot,i)=>Array.from({length:3},(_,j)=>({
 id:slot+'-'+j,name:'FICTIONAL '+slot+' '+j,slot,
 weight:Number((0.5+j*0.8+i*0.2).toFixed(1)),
 poise:2+i*3+j*5,metrics:{
  poise:2+i*3+j*5,physical:j*9+i*2,magic:j*6+i*2,
  fire:j*3+i,immunity:5+j*11+i,robustness:6+i+j*7
 }
})));
function oracle(src,opt){
 const factor=opt.tier==='light'?.3:opt.tier==='heavy'?1:.7;
 const groups=slots.map(slot=>[null,...src.filter(x=>x.slot===slot)]);
 let best=null;
 const keys=Object.keys(ARMOR_METRICS).filter(key=>Number(opt.weights?.[key]||0)>0||
  opt.minimums?.[key]!==undefined||opt.maximums?.[key]!==undefined||(key==='poise'&&opt.minPoise>0));
 for(const a of groups[0])for(const b of groups[1])for(const c of groups[2])for(const d of groups[3]){
  const all=[a,b,c,d],weight=all.reduce((s,x)=>s+(x?.weight||0),0);
  if(weight+Number(opt.reservedWeight||0)>=opt.maxEquipLoad*factor-1e-9)continue;
  const values={};let valid=true,score=0;
  for(const key of keys){
   const m=ARMOR_METRICS[key],selected=all.filter(Boolean);
   if(selected.some(p=>!Number.isFinite(key==='poise'?p.poise:p.metrics?.[key]))){valid=false;break;}
   const sum=selected.reduce((s,x)=>s+(key==='poise'?x.poise:x.metrics[key]),0);
   const neg=m.kind==='negation'?100*(1-selected.reduce((product,x)=>
    product*(1-(x.metrics[key])/100),1)):null;
   values[key]=neg??sum;
   const min=opt.minimums?.[key],max=opt.maximums?.[key];
   if(min!==undefined&&values[key]<min-1e-8||max!==undefined&&values[key]>max+1e-8){valid=false;break;}
   if(key==='poise'&&values[key]<Number(opt.minPoise||0)){valid=false;break;}
   score+=Number(opt.weights?.[key]||0)*(m.kind==='negation'?
    selected.reduce((s,x)=>s-Math.log1p(-x.metrics[key]/100),0):sum);
  }
  if(valid&&(!best||score>best.score+1e-10||
   Math.abs(score-best.score)<=1e-10&&weight<best.weight))best={score,weight,all,values};
 }
 return best;
}
test('independent 13-metric controls are fully defined and no hidden hardcoded score',()=>{
 assert.equal(Object.keys(ARMOR_METRICS).length,13);
 const src=readFileSync(new URL('../public/src/armor-weighted-optimizer.mjs',import.meta.url),'utf8');
 assert.match(src,/NOT Tarnished\.dev/);
 assert.match(src,/maxNodes=1500000/);
 assert.ok(!src.includes('return {score:70}'));
});
test('weighted exact weight-only DP agrees with exhaustive brute force at varied tiers and negatives',()=>{
 const src=rows();
 for(const tier of ['light','medium','heavy'])
 for(const weight of [{poise:1},{physical:1,immunity:0.2},{poise:0.3,fire:0.7,magic:0.6}]){
  const opts={weights:weight,maxEquipLoad:12,reservedWeight:0,tier};
  const expected=oracle(src,opts),actual=optimizeWeightedArmor(src,opts);
  if(!expected){assert.equal(actual.status,'no-solution');continue;}
  assert.equal(actual.status,'optimized-weighted-source-reference');
  assert.ok(Math.abs(expected.score-actual.metricValue)<2e-6);
  assert.ok(Math.abs(expected.weight-actual.armorWeight)<1e-8);
 }
});
test('joint metric minimum and maximum bounds require true source combination, not per-piece addition of negation',()=>{
 const src=rows();
 const opts={weights:{physical:1,poise:0.3,immunity:0.02},
  minimums:{physical:15,poise:22},maximums:{physical:42,immunity:110},
  maxEquipLoad:14,tier:'medium',maxNodes:500000};
 const expected=oracle(src,opts),actual=optimizeWeightedArmor(src,opts);
 assert.ok(expected);
 assert.equal(actual.status,'optimized-weighted-source-reference');
 assert.equal(actual.algorithm,'exact-bounded-branch-and-bound');
 assert.ok(Math.abs(expected.score-actual.metricValue)<2e-6);
 assert.ok(Math.abs(expected.weight-actual.armorWeight)<1e-8);
 assert.ok(actual.metricTotals.physical>=15&&actual.metricTotals.physical<=42);
 assert.ok(actual.metricTotals.poise>=22);
});
test('poise minimum from original form applies in weighted mode even without Poise multiplier',()=>{
 const opts={weights:{physical:1},minPoise:31,maxEquipLoad:15,tier:'medium'};
 const a=optimizeWeightedArmor(rows(),opts),b=oracle(rows(),opts);
 assert.ok(b);
 assert.equal(a.status,'optimized-weighted-source-reference');
 assert.ok(a.poise>=31);
 assert.ok(Math.abs(a.metricValue-b.score)<2e-6);
});
test('locked and disabled armor slots constrain exactly and reject incompatible or absent source',()=>{
 const src=rows();
 const opts={maxEquipLoad:15,tier:'medium',weights:{poise:1},
  lockedIds:{Head:'Head-1'},disabledSlots:['Arms']};
 const v=optimizeWeightedArmor(src,opts);
 assert.equal(v.combination[0].id,'Head-1');
 assert.equal(v.combination[2].id,null);
 assert.throws(()=>optimizeWeightedArmor(src,{...opts,disabledSlots:['Head']}),/conflicts/);
 assert.throws(()=>optimizeWeightedArmor(src,{...opts,lockedIds:{Head:'INVALID'}}),/does not exist/);
});
test('unknown active-field data are excluded; nonactive incomplete fields never block a valid objective',()=>{
 const src=[
  {id:'a',slot:'Head',name:'Proof only poise',weight:1,poise:7,metrics:{poise:7,physical:null}},
  {id:'b',slot:'Head',name:'Proof with physical',weight:2,poise:4,metrics:{poise:4,physical:12}}
 ];
 const onlyPoise=optimizeWeightedArmor(src,{maxEquipLoad:10,weights:{poise:1}});
 assert.equal(onlyPoise.combination[0].id,'a');
 const physical=optimizeWeightedArmor(src,{maxEquipLoad:10,weights:{physical:1}});
 assert.equal(physical.combination[0].id,'b');
 assert.equal(physical.missingMetricExcluded,1);
});
test('site verified mode uses intersection of all ACTIVE fields, excludes DLC-only Poise from physical',()=>{
 const rows=[
  {id:'circlet',name:'Circlet of Light',slot:'Head',weight:1,poise:5,
   siteDirectFields:{weight:'proof',poise:'proof'},metrics:{poise:5,physical:null}},
  {id:'helm',name:'Existing proven',slot:'Head',weight:1,poise:6,
   siteDirectFields:{weight:'proof',poise:'proof',physical:'proof'},metrics:{poise:6,physical:10}}
 ];
 assert.equal(weightedVerifiedArmorSubset(rows,['poise']).accepted.length,2);
 assert.deepEqual(weightedVerifiedArmorSubset(rows,['poise','physical']).accepted.map(x=>x.id),['helm']);
});
test('no solution, contradictory bounds, malformed weights and failed exact-search budget never silently approximate',()=>{
 const src=rows();
 assert.equal(optimizeWeightedArmor(src,{weights:{poise:1},
  minimums:{poise:500},maxEquipLoad:10}).status,'no-solution');
 assert.throws(()=>optimizeWeightedArmor(src,{weights:{poise:1},
  minimums:{poise:40},maximums:{poise:20},maxEquipLoad:10}),/Minimum exceeds maximum/);
 assert.throws(()=>optimizeWeightedArmor(src,{weights:{poise:-1},maxEquipLoad:10}),/outside the permitted range/);
 assert.throws(()=>optimizeWeightedArmor(src,{weights:{unknown:1},maxEquipLoad:10}),/Unknown/);
 assert.throws(()=>optimizeWeightedArmor(src,{weights:{poise:1},
  minimums:{poise:1},maxEquipLoad:100,maxNodes:1}),/exceeded/);
 assert.throws(()=>optimizeWeightedArmor(src,{weights:{},maxEquipLoad:10}),/at least one positive/);
});
test('user facing weighted controls and Worker dispatch are connected',()=>{
 const html=readFileSync(new URL('../public/armor-optimizer/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/src/armor-full-source-app.mjs',import.meta.url),'utf8');
 const worker=readFileSync(new URL('../public/src/armor-full-source-worker.mjs',import.meta.url),'utf8');
 for(const id of ['armor-full-mode','armor-weighted-panel','armor-weighted-rows'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(app,/weightedVerifiedArmorSubset/);
 assert.match(app,/weightedOptions/);
 assert.match(worker,/optimizeWeightedArmor/);
});
