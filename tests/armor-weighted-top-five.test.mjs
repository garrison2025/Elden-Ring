import test from 'node:test';
import assert from 'node:assert/strict';
import {optimizeWeightedArmor} from '../public/src/armor-weighted-optimizer.mjs';
import {ARMOR_METRICS} from '../public/src/armor-source-optin.mjs';

const slots=['Head','Chest','Arms','Legs'];
const rows=()=>slots.flatMap((slot,s)=>Array.from({length:3},(_,i)=>({
 id:slot+'-'+i,name:'FICTIONAL '+slot+' '+i,slot,
 weight:Number((.6+i*.7+s*.2).toFixed(3)),
 poise:2+s+i*4,
 metrics:{physical:3+i*7+s,magic:-8+i*5+s,
  immunity:8+i*3+s,robustness:6+i*2+s}
})));
const sign=parts=>parts.map(p=>p?.id??'').join('|');
const compare=(a,b)=>{
 if(Math.abs(a.score-b.score)>1e-10)return b.score-a.score;
 return a.weight-b.weight||(sign(a.parts)<sign(b.parts)?-1:sign(a.parts)>sign(b.parts)?1:0);
};
function bruteForce(src,opt){
 const excluded=new Set(opt.excludedIds??[]);
 const groups=slots.map(slot=>{
  if((opt.disabledSlots??[]).includes(slot))return[null];
  const parts=src.filter(x=>x.slot===slot&&!excluded.has(x.id));
  const lock=opt.lockedIds?.[slot];
  return lock?parts.filter(x=>x.id===lock):[null,...parts];
 });
 const usedMetrics=new Set([...Object.keys(opt.weights??{}).filter(k=>Number(opt.weights[k])>0),
  ...Object.keys(opt.minimums??{}),...Object.keys(opt.maximums??{})]);
 if((opt.minPoise??0)>0)usedMetrics.add('poise');
 const factor=opt.tier==='light'?.3:opt.tier==='heavy'?1:.7;
 const winners=[];
 for(const a of groups[0])for(const b of groups[1])
 for(const c of groups[2])for(const d of groups[3]){
  const parts=[a,b,c,d],weight=parts.reduce((v,p)=>v+(p?.weight??0),0);
  if(weight+Number(opt.reservedWeight??0)>=opt.maxEquipLoad*factor-1e-9)continue;
  const values={};let score=0,valid=true;
  for(const key of usedMetrics){
   const metric=ARMOR_METRICS[key];
   const nums=parts.filter(Boolean).map(p=>key==='poise'?p.poise:p.metrics?.[key]);
   if(nums.some(n=>!Number.isFinite(n))){valid=false;break;}
   const raw=metric.kind==='negation'?
    nums.reduce((v,p)=>v-Math.log1p(-p/100),0):nums.reduce((v,p)=>v+p,0);
   values[key]=metric.kind==='negation'?100*(-Math.expm1(-raw)):raw;
   score+=Number(opt.weights?.[key]??0)*raw;
   const lo=key==='poise'?Math.max(opt.minimums?.[key]??0,opt.minPoise??0):opt.minimums?.[key];
   const hi=opt.maximums?.[key];
   if(lo!==undefined&&values[key]<lo-1e-8||hi!==undefined&&values[key]>hi+1e-8){valid=false;break;}
  }
  if(valid)winners.push({score,weight,parts});
 }
 return winners.sort(compare).slice(0,opt.topK??5);
}
function equalRankings(actual,expected){
 assert.equal(actual.status,'optimized-weighted-source-reference');
 assert.equal(actual.ranked.length,expected.length);
 assert.equal(actual.referenceRankingVerified,false);
 for(let i=0;i<expected.length;i++){
  assert.equal(actual.ranked[i].rank,i+1);
  assert.equal(sign(actual.ranked[i].combination),sign(expected[i].parts));
  assert.ok(Math.abs(actual.ranked[i].score-expected[i].score)<1e-6);
  assert.ok(Math.abs(actual.ranked[i].weight-expected[i].weight)<1e-8);
 }
 assert.equal(sign(actual.combination),sign(expected[0].parts));
}
test('top five exact weighted DP matches exhaustive oracle under three roll tiers, mixed scores and negative source negation',()=>{
 const input=rows();
 for(const tier of ['light','medium','heavy']){
  for(const weights of [{poise:1},{physical:1,immunity:0.3},{poise:.4,magic:.8,physical:.2}]){
   const opts={weights,maxEquipLoad:tier==='light'?26:16,reservedWeight:0,tier,topK:5};
   const expected=bruteForce(input,opts);
   assert.ok(expected.length>=5);
   equalRankings(optimizeWeightedArmor(input,opts),expected);
  }
 }
});
test('top five exact constrained branch-and-bound matches exhaustive oracle with joint bounds, reserved gear and locked/empty slots',()=>{
 const opts={weights:{physical:.4,poise:1,magic:.2},
  minimums:{physical:19,poise:20},maximums:{physical:65,magic:40},
  maxEquipLoad:18,reservedWeight:1,tier:'medium',topK:5,
  lockedIds:{Chest:'Chest-1'},disabledSlots:['Legs'],maxNodes:200000};
 const expected=bruteForce(rows(),opts);
 assert.ok(expected.length>=5);
 const got=optimizeWeightedArmor(rows(),opts);
 assert.equal(got.algorithm,'exact-bounded-branch-and-bound');
 equalRankings(got,expected);
});
test('top-one API remains backward compatible; invalid K and exact search budget fail closed',()=>{
 const opts={weights:{poise:1},maxEquipLoad:15,tier:'medium'};
 const original=optimizeWeightedArmor(rows(),opts);
 const expanded=optimizeWeightedArmor(rows(),{...opts,topK:5});
 assert.equal(original.ranked.length,1);
 assert.equal(original.metricValue,expanded.metricValue);
 assert.deepEqual(original.combination,expanded.combination);
 assert.throws(()=>optimizeWeightedArmor(rows(),{...opts,topK:0}),/1–5/);
 assert.throws(()=>optimizeWeightedArmor(rows(),{...opts,topK:6}),/1–5/);
 assert.throws(()=>optimizeWeightedArmor(rows(),{...opts,
  minimums:{poise:1},topK:5,maxNodes:1}),/exceeded/);
});
test('weighted worker and user interface expose five scored sets without implying source-site parity',async()=>{
 const {readFileSync}=await import('node:fs');
 const worker=readFileSync(new URL('../public/src/armor-full-source-worker.mjs',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/src/armor-full-source-app.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/armor-optimizer/index.html',import.meta.url),'utf8');
 assert.match(worker,/metric:'weighted',referenceRankingVerified:false/);
 assert.match(app,/topK:5/);
 assert.match(app,/mode\?String\(item.score\)/);
 assert.match(html,/five exact ranked local combinations/);
 assert.match(html,/ranking parity remain unverified/);
});
