import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {exactPublicUchigatanaDamage,exactPublicPebbleSpell,
 V117_ARMOR_POISE_REFERENCE,comparePoiseResultToPublicReference} from '../public/src/tarnished-v117-scoped-reference-scenes.mjs';
const gold=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-residual-3x2-observed-goldens.json',import.meta.url),'utf8'));

test('actual source damage rows match independent two-browser source matrix exactly',()=>{
 for(const row of gold.damage){
  const o=exactPublicUchigatanaDamage({str:row.str,dex:row.dex});
  assert.equal(o.status,'REFERENCE_UI_OBSERVED_TWICE');
  assert.deepEqual([o.reference.ar,o.reference.dpsSingle,o.reference.dpsPaired],
   [row.ar,row.dpsSingle,row.dpsPaired]);
 }
});

test('source lookup rejects unobserved damage inputs and context instead of extrapolation',()=>{
 for(const input of [{str:19,dex:20},{str:15,dex:20,upgrade:24},
  {str:15,dex:20,twoHanded:true},{str:15,dex:20,effects:true},
  {str:15,dex:20,enemy:'Malenia'},{str:15,dex:20,origin:'Hero'},
  {str:15,dex:20,otherStats:[10,11,10]}])
  assert.equal(exactPublicUchigatanaDamage(input).status,'NOT_OBSERVED');
});

test('spell reference rows equal independent observed values and do not interpolate',()=>{
 for(const row of gold.spell){
  const x=exactPublicPebbleSpell({int:row.int});
  assert.equal(x.status,'REFERENCE_UI_OBSERVED_TWICE');
  assert.deepEqual([x.reference.magic,x.reference.fp,x.reference.bullets],
    [row.magic,row.fp,row.bullets]);
 }
 for(const input of [{int:31},{int:25,spell:'Comet'},
  {int:25,catalyst:'Meteorite Staff'},{int:25,enemyDefense:100},
  {int:25,smithing:24},{int:25,effects:true},
  {int:25,otherStats:[10,10,10,10,10,10,11]}])
  assert.equal(exactPublicPebbleSpell(input).status,'NOT_OBSERVED');
});

test('site Poise-only reference has observed rank order and conservative tie status',()=>{
 assert.equal(V117_ARMOR_POISE_REFERENCE.maximumPoise,70);
 const options={maxEquipLoad:48.176,reservedWeight:0,tier:'medium',
  minPoise:0,metric:'poise',poise:70,
  combination:[
   {name:'Circlet of Light'}, {name:'Tree Sentinel Armor'},
   {name:'Gravebird Bracelets'}, {name:'Tree Sentinel Greaves'}
  ]};
 const seen=comparePoiseResultToPublicReference(options);
 assert.equal(seen.status,'SAME_POISE_AND_LISTED_REFERENCE_COMBINATION');
 assert.equal(seen.listedReferenceRank,2);
 assert.equal(comparePoiseResultToPublicReference({...options,
  combination:[{name:'Other'},{name:'Other'},{name:'Other'},{name:'Other'}]}).status,
  'SAME_POISE_BUT_REFERENCE_RANK_NOT_PROVEN');
 assert.equal(comparePoiseResultToPublicReference({...options,poise:68}).status,'POISE_VALUE_MISMATCH');
 for(const extra of [{maxEquipLoad:50},{tier:'light'},{reservedWeight:1},
  {minPoise:1},{metric:'magic'},{excludedIds:['abc']},{lockedIds:{Head:'abc'}},
  {disabledSlots:['Legs']},{weighted:true}]){
  assert.equal(comparePoiseResultToPublicReference({...options,...extra}).status,
   'REFERENCE_SCENARIO_NOT_IDENTICAL');
 }
});

test('new spell page remains noindex and clearly labels source observations',()=>{
 const html=readFileSync(new URL('../public/spell-calculator/index.html',import.meta.url),'utf8');
 assert.match(html,/noindex,follow/);
 assert.match(html,/not<\/strong> a standalone catalyst-scaling engine/i);
 assert.match(html,/spell-reference-app\.mjs/);
 const damage=readFileSync(new URL('../public/damage-calculator/index.html',import.meta.url),'utf8');
 assert.match(damage,/damage-v117-scene/);
 assert.match(damage,/damage-v117-evidence-status/);
 const armor=readFileSync(new URL('../public/armor-optimizer/index.html',import.meta.url),'utf8');
 assert.match(armor,/armor-v117-confirm-wretch/);
 assert.match(armor,/armor-v117-apply-first/);
});
