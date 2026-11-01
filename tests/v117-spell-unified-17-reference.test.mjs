import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {calculatePinnedV117PebbleMagic} from '../public/src/v117-spell-scaling-engine.mjs';
import {V117_PEBBLE_STAFF_ROWS,exactPublicPebbleSpell} from '../public/src/tarnished-v117-scoped-reference-scenes.mjs';
const golden=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-spell-17-double-observed-goldens.json',import.meta.url),'utf8'));
const stages=[
 {maxVal:1,maxGrowVal:0,adjPt:1},
 {maxVal:18,maxGrowVal:.2,adjPt:1},
 {maxVal:60,maxGrowVal:.75,adjPt:1},
 {maxVal:80,maxGrowVal:.9,adjPt:1},
 {maxVal:99,maxGrowVal:1,adjPt:1}
];
const modelFixture={
 weapons:[{name:"Astrologer's Staff",sorceryTool:true,requirements:{str:7,int:16},
 attributeScaling:[['str',.12],['int',.89]],attackElementCorrectId:20000,
 reinforceTypeId:1900,calcCorrectGraphIds:{'1':16}}],
 reinforceTypes:{'1900':Array.from({length:26},()=>({attributeScaling:{int:3}}))},
 attackElementCorrects:{'20000':{'1':{int:true}}},
 calcCorrectGraphs:{'16':stages}
};
test('actual Tarnished.dev 17 separate double-Chromium samples match the general corrected spell arithmetic',()=>{
 assert.equal(golden.reference,'Tarnished.dev public v1.17');
 assert.equal(golden.independent_reads_per_profile,2);
 assert.equal(golden.real_browser_run,41362826940);
 const observed=[...golden.rows].sort((a,b)=>a.int-b.int);
 assert.equal(observed.length,17);
 assert.equal(V117_PEBBLE_STAFF_ROWS.length,18);
 assert.deepEqual(V117_PEBBLE_STAFF_ROWS.filter(x=>x.int>=25).map(x=>x.int),observed.map(x=>x.int));
 assert.equal(V117_PEBBLE_STAFF_ROWS[0].int,20);
 assert.equal(calculatePinnedV117PebbleMagic(modelFixture,{intelligence:20}).damage,219);
 for(const row of observed){
  const r=calculatePinnedV117PebbleMagic(modelFixture,{intelligence:row.int});
  assert.equal(r.sourceMathDamage,row.realTarnished,'INT '+row.int);
  assert.equal(r.damage,row.realTarnished,'INT '+row.int);
  assert.equal(r.appliedExactSiteBoundary,false,'No site-case patch permitted');
  assert.equal(r.catalystScalingTruncated,Math.trunc(r.catalystScalingRaw));
  assert.equal(r.status,'INDEPENDENT_MODEL_MATCHES_TARNISHED_V117_SCENE');
  assert.equal(exactPublicPebbleSpell({int:row.int}).reference.magic,row.realTarnished);
 }
});
test('four formerly mismatching INT settings come from one staged rounding rule, not case overrides',()=>{
 for(const [int,magic,integerBuff] of [
  [25,242,177],[35,290,212],[50,363,265],[98,499,365]]){
  const r=calculatePinnedV117PebbleMagic(modelFixture,{intelligence:int});
  assert.equal(r.catalystScalingTruncated,integerBuff);
  assert.equal(r.damage,magic);
  assert.equal(r.appliedExactSiteBoundary,false);
 }
});
test('uncertified inputs do not advertise exact Tarnished website parity',()=>{
 for(const input of [{intelligence:51},{intelligence:25,reinforcement:24},
  {intelligence:25,defense:100},{intelligence:25,negation:10}]){
  const r=calculatePinnedV117PebbleMagic(modelFixture,input);
  assert.equal(r.status,'INDEPENDENT_SOURCE_MODEL_UNVERIFIED_AT_SITE');
  assert.equal(r.referenceCompared,null);
 }
});
test('malformed catalyst context and unmet requirements do not produce invented numeric pass',()=>{
 assert.equal(calculatePinnedV117PebbleMagic(modelFixture,{intelligence:14}).damage,null);
 assert.throws(()=>calculatePinnedV117PebbleMagic(modelFixture,{intelligence:25,staff:'Unknown Staff'}),/Catalyst/);
});
