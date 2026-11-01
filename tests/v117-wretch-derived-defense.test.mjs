import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {observedV117WretchDefense as show,estimatedV117WretchUnbuffedDefense as estimate,
 V117_WRETCH_VERIFIED_PROFILE_COUNT as count,V117_WRETCH_DEFENSE_FIELDS as fields} from '../public/src/v117-wretch-derived-defense.mjs';
import {V117_WRETCH_DEFENSE_ONE_AXIS as AX,V117_WRETCH_STAT_NAMES as axis} from '../public/src/v117-wretch-defense-one-axis-direct.mjs';
import {V117_WRETCH_LEVEL_DIRECT as LEVEL} from '../public/src/v117-wretch-level-direct.mjs';
import {V117_WRETCH_MIXED_HOLDOUTS as HOLD} from '../public/src/v117-wretch-holdout-direct.mjs';
const cases=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-derived-four-observed.json',import.meta.url),'utf8'));
test('all 624 original site high-level observations, one-level overlaps and 720 axis reads remain site-exact',()=>{
 assert.equal(Object.keys(LEVEL).length,624);
 assert.equal(fields.length,10);assert.ok(count>=1300);
 for(const [level,[stats,values]] of Object.entries(LEVEL)){
  const r=show(stats);
  assert.equal(r.status,'direct-site-same-input');
  assert.equal(r.level,Number(level));
  assert.deepEqual(r.values,values);
 }
 for(const [i,key] of axis.entries())for(let stat=10;stat<=99;stat++){
  const stats=Array(8).fill(10);stats[i]=stat;
  const r=show(stats);assert.equal(r.status,'direct-site-same-input');
  assert.deepEqual(r.values,AX[key][stat-10]);
 }
});
test('4 earlier independent mixed Wretch reference cases match exact same inputs and 10 numeric cells',()=>{
 const combos=[
  [40,10,10,10,10,10,10,10],[40,30,10,10,10,10,10,10],
  [40,30,25,10,10,10,10,10],[40,30,25,10,10,10,10,40]
 ];
 for(let i=0;i<4;i++){
  assert.deepEqual(show(combos[i]).values,fields.map(k=>Number(cases.observedCases[i].fields[k].replaceAll(',',''))));
  assert.equal(show(combos[i]).status,'direct-site-same-input');
 }
});
test('16 held-out real site mixed profiles are exact only by explicit source lookup; integer approximate estimate fails closed as a claim',()=>{
 assert.equal(HOLD.length,16);
 let exact=0,total=0,maximum=0,different=0;
 for(const [stats,truth] of HOLD){
  const observed=show(stats);
  assert.equal(observed.status,'direct-site-same-input');
  assert.deepEqual(observed.values,truth);
  const pred=estimate(stats);
  for(let k=0;k<10;k++){
   total++;const diff=Math.abs(pred[k]-truth[k]);maximum=Math.max(maximum,diff);
   if(diff===0)exact++;else different++;
  }
 }
 assert.equal(total,160);
 assert.equal(exact,142);assert.equal(different,18);assert.equal(maximum,1);
});
test('not covered Wretch mixed inputs are explicitly estimates, other origin/low-stat context cannot borrow Wretch proof',()=>{
 const mixed=[40,30,25,15,20,25,15,41],r=show(mixed);
 assert.equal(r.status,'estimated-not-site-certified');
 assert.ok(r.values.length===10);
 assert.match(r.note,/NOT directly observed/);
 assert.equal(show(mixed,{origin:'Samurai'}).status,'not-verified-other-origin');
 assert.equal(show([9,10,10,10,10,10,10,10]).values,null);
 for(const invalid of [[100,10,10,10,10,10,10,10],[40,30,25],Array(8).fill(1.3)])
  assert.throws(()=>show(invalid),RangeError);
});
