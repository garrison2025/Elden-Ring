import test from 'node:test';
import assert from 'node:assert/strict';
import {optimizeWeightedArmor} from '../public/src/armor-weighted-optimizer.mjs';
const slotNames=['Head','Chest','Arms','Legs'];
const signature=parts=>parts.map(x=>x?.id??'').join('|');
const compare=(a,b)=>Math.abs(a.score-b.score)>1e-10?b.score-a.score:
 a.weight!==b.weight?a.weight-b.weight:
 signature(a.parts)<signature(b.parts)?-1:signature(a.parts)>signature(b.parts)?1:0;
function gen(seed){
 let state=seed;const next=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 return slotNames.flatMap((slot,s)=>Array.from({length:3},(_,i)=>({
  id:slot+'-'+i,name:'TEST '+slot+' '+i,slot,
  weight:(1+Math.floor(next()*50)/10),
  poise:1+Math.floor(next()*12),
  metrics:{
   physical:Math.floor(next()*130-20)/10,
   magic:Math.floor(next()*110-20)/10,
   fire:Math.floor(next()*110-20)/10,
   immunity:Math.floor(next()*40),
   robustness:Math.floor(next()*40)
  }
 })));
}
function oracle(rows,opts){
 const groups=slotNames.map(slot=>[null,...rows.filter(p=>p.slot===slot)]);
 const out=[];const cap=opts.maxEquipLoad*(opts.tier==='light'?.3:opts.tier==='medium'?.7:1)-opts.reservedWeight;
 for(const a of groups[0])for(const b of groups[1])for(const c of groups[2])for(const d of groups[3]){
  const parts=[a,b,c,d],weight=parts.reduce((sum,p)=>sum+(p?.weight??0),0);
  if(weight>=cap-1e-9)continue;
  let total=0,poise=0,physicalSurvival=1,magicSurvival=1,fireSurvival=1;
  for(const p of parts)if(p){
   poise+=p.poise;
   physicalSurvival*=1-p.metrics.physical/100;
   magicSurvival*=1-p.metrics.magic/100;
   fireSurvival*=1-p.metrics.fire/100;
   total+=p.metrics.immunity;
  }
  const physical=100*(1-physicalSurvival),magic=100*(1-magicSurvival);
  if(poise<(opts.minimums?.poise??0)||physical>(opts.maximums?.physical??99))continue;
  const score=opts.weights.poise*poise+
   opts.weights.physical*(-Math.log(physicalSurvival))+
   opts.weights.magic*(-Math.log(magicSurvival))+
   opts.weights.fire*(-Math.log(fireSurvival))+
   opts.weights.immunity*total;
  out.push({parts,weight,score});
 }
 return out.sort(compare).slice(0,5);
}
test('exact four-slot 13-field source optimizer matches FULL independent exhaustive oracle in 24 new seeded mixed-signed scenarios',()=>{
 for(let seed=1;seed<=24;seed++){
  const rows=gen(seed),tier=['light','medium','heavy'][seed%3];
  const opts={topK:5,maxEquipLoad:tier==='light'?65:28,reservedWeight:0.7,
   tier,weights:{poise:1,physical:0.3,magic:0.6,fire:0.1,immunity:0.02},
   minimums:seed%2?{poise:8}:{},maximums:seed%2?{physical:35}:{}};
  const brute=oracle(rows,opts),actual=optimizeWeightedArmor(rows,opts);
  if(!brute.length){assert.equal(actual.status,'no-solution');continue;}
  assert.equal(actual.ranked.length,brute.length,'seed='+seed);
  for(let i=0;i<brute.length;i++){
   assert.equal(signature(actual.ranked[i].combination),signature(brute[i].parts),'seed='+seed+' rank='+i);
   assert.ok(Math.abs(actual.ranked[i].score-brute[i].score)<0.000002,'seed='+seed+' score='+i);
   assert.ok(Math.abs(actual.ranked[i].weight-brute[i].weight)<0.000002,'seed='+seed+' weight='+i);
  }
  assert.equal(actual.referenceRankingVerified,false);
 }
});
