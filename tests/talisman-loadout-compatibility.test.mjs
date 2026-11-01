import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyBuildLoadout,evaluateBuildLoadout} from '../public/src/build-loadout.mjs';
import {reviewTalismanLoadoutCompatibility as review} from '../public/src/talisman-loadout-compatibility.mjs';
import {observedV117TalismanPair} from '../public/src/v117-selected-pair-preview.mjs';
import {previewV117ExactTalismanCombination} from '../public/src/v117-multi-talisman-reference.mjs';
import {readFileSync} from 'node:fs';

const equip=(...names)=>{
 const state=emptyBuildLoadout();
 names.forEach((n,i)=>{state.talismans[i]=n;});
 state.maxEquipLoad='100';
 return state;
};
const evaluate=(...names)=>evaluateBuildLoadout(equip(...names),{weapons:[]});
const base=Array(8).fill(10);

test('a same-name talisman in two slots cannot claim an equipped total or roll tier',()=>{
 const x=evaluate('Silver Scarab','Silver Scarab');
 assert.equal(x.compatibility.status,'UNWEARABLE');
 assert.deepEqual(x.compatibility.conflicts.map(c=>c.type),['duplicate-item']);
 assert.equal(x.compatibility.conflicts[0].evidence,'independent-documentation-only');
 assert.equal(x.exactTotal,null);
 assert.equal(x.tier,null);
 assert.ok(x.knownWeight>0); // A raw arithmetic sum is NOT a wearable load.
 assert.match(x.warnings.join(' '),/NOT an actual equipped weight/);
});

test('Radagon variants are blocked in both directly observed source orders',()=>{
 for(const names of [
  ["Radagon's Scarseal","Radagon's Soreseal"],
  ["Radagon's Soreseal","Radagon's Scarseal"]
 ]){
  const x=evaluate(...names);
  assert.equal(x.compatibility.status,'UNWEARABLE');
  assert.equal(x.exactTotal,null);
  assert.equal(x.tier,null);
  const c=x.compatibility.conflicts[0];
  assert.equal(c.evidence,'direct-site-both-orders-plus-independent-documentation');
  assert.match(c.note,/Both Radagon seal click orders/);
 }
 const directlyMeasured=equip("Radagon's Scarseal","Radagon's Soreseal");
 assert.equal(previewV117ExactTalismanCombination(base,directlyMeasured).status,'source-exclusivity-observed');
 const reverse=equip("Radagon's Soreseal","Radagon's Scarseal");
 assert.equal(previewV117ExactTalismanCombination(base,reverse).status,'source-exclusivity-observed');
});

test('Marika variant restriction is directly observed in both orders, without inventing combined numerics',()=>{
 for(const names of [
  ["Marika's Scarseal","Marika's Soreseal"],
  ["Marika's Soreseal","Marika's Scarseal"]
 ]){
  const x=evaluate(...names);
  assert.equal(x.compatibility.status,'UNWEARABLE');
  assert.equal(x.exactTotal,null);
  assert.equal(x.compatibility.conflicts[0].evidence,'direct-site-both-orders-plus-independent-documentation');
  assert.equal(previewV117ExactTalismanCombination(base,equip(...names)).status,'source-exclusivity-observed');
 }
});

test('mixed conflict with third talisman cannot be masked by valid individual weights',()=>{
 const x=evaluate("Radagon's Soreseal","Marika's Scarseal","Marika's Soreseal");
 assert.equal(x.compatibility.conflicts.length,1);
 assert.equal(x.compatibility.conflicts[0].family,'Marika seal variants');
 assert.equal(x.exactTotal,null);
 assert.equal(x.tier,null);
});

test('known good mixed pairs preserve source exact numbers and ordinary equip-weight calculation',()=>{
 const valid=equip("Radagon's Scarseal","Marika's Scarseal");
 const a=evaluateBuildLoadout(valid,{weapons:[]});
 assert.equal(a.compatibility.status,'NO_DOCUMENTED_CONFLICT');
 assert.equal(a.exactTotal,1.6);
 assert.equal(a.tier.tier,'Light');
 assert.equal(observedV117TalismanPair(base,valid).record.metrics.physical,-21);
 const b=equip("Radagon's Soreseal","Marika's Soreseal");
 assert.equal(evaluateBuildLoadout(b,{weapons:[]}).exactTotal,1.6);
 assert.equal(previewV117ExactTalismanCombination(base,b).observation.negation.physical,-32.25);
});

test('unknown distinct items do not invent conflicts and still prevent unverified weight totals',()=>{
 const x=evaluate('Unknown talisman A','Unknown talisman B');
 assert.equal(x.compatibility.status,'NO_DOCUMENTED_CONFLICT');
 assert.equal(x.compatibility.conflicts.length,0);
 assert.equal(x.exactTotal,null);
 assert.equal(x.unknowns.length,2);
 assert.match(x.compatibility.note,/does NOT certify/);
});

test('compatibility API rejects malformed inputs rather than producing an empty safe verdict',()=>{
 assert.throws(()=>review([]),TypeError);
 assert.throws(()=>review(['A','B','C',null]),TypeError);
 assert.throws(()=>review('Radagon'),TypeError);
});

test('Build page explicitly shows blocked loadouts and unmatched multi-effect evidence limits',()=>{
 const js=readFileSync(new URL('../public/src/build-loadout-app.mjs',import.meta.url),'utf8');
 for(const s of [
  'Unwearable talisman selection',
  'Raw source-weight sum (NOT an equipped load)',
  'Talisman compatibility blocks this build',
  'Combined talisman effects not source-verified for these inputs'
 ])assert.ok(js.includes(s),s);
});

test('documented upgrade tiers and named alternate variants cannot yield a wearable equip load',()=>{
 const cases=[
  [
    "Erdtree's Favor",
    "Erdtree's Favor +2",
    "Erdtree's Favor upgrade variants"
  ],
  [
    "Arsenal Charm",
    "Great-Jar's Arsenal",
    "Arsenal load-boost variants"
  ],
  [
    "Crimson Amber Medallion +1",
    "Crimson Amber Medallion +3",
    "Crimson Amber Medallion upgrade variants"
  ],
  [
    "Cerulean Amber Medallion",
    "Cerulean Amber Medallion +2",
    "Cerulean Amber Medallion upgrade variants"
  ],
  [
    "Viridian Amber Medallion +1",
    "Viridian Amber Medallion +3",
    "Viridian Amber Medallion upgrade variants"
  ],
  [
    "Dragoncrest Shield Talisman +2",
    "Dragoncrest Greatshield Talisman",
    "Dragoncrest physical-defense variants"
  ],
  [
    "Warrior Jar Shard",
    "Shard of Alexander",
    "Alexander shard variants"
  ],
  [
    "Crimson Seed Talisman",
    "Crimson Seed Talisman +1",
    "Crimson Seed upgrade variants"
  ],
  [
    "Cerulean Seed Talisman",
    "Cerulean Seed Talisman +1",
    "Cerulean Seed upgrade variants"
  ]
];
 for(const [a,b,family] of cases){
  for(const names of [[a,b],[b,a]]){
   const x=evaluate(...names);
   assert.equal(x.compatibility.status,'UNWEARABLE',names.join(' + '));
   assert.equal(x.compatibility.conflicts.length,1);
   assert.equal(x.compatibility.conflicts[0].family,family);
   const actuallyObservedExactOrder=new Set([
    "Erdtree's Favor|Erdtree's Favor +2",
    'Arsenal Charm|Arsenal Charm +1',
    'Crimson Amber Medallion|Crimson Amber Medallion +1'
   ]).has(names.join('|'));
   assert.equal(x.compatibility.conflicts[0].evidence,
    actuallyObservedExactOrder?
     'direct-site-one-order-plus-independent-documentation':'independent-documentation-only');
   assert.equal(x.compatibility.conflicts[0].exactSelectorOrderObserved,actuallyObservedExactOrder);
   assert.equal(x.exactTotal,null);
   assert.equal(x.tier,null);
   assert.ok(x.unknowns.some(v=>v.slot==='Talisman compatibility'));
  }
 }
});

test('upgrade-family detection catches three variants once without making cross-family false positives',()=>{
 const conflict=review(["Erdtree's Favor","Erdtree's Favor +1","Erdtree's Favor +2",'']);
 assert.equal(conflict.conflicts.length,1);
 assert.deepEqual(conflict.conflicts[0].names,["Erdtree's Favor","Erdtree's Favor +1","Erdtree's Favor +2"]);
 for(const names of [
  ["Great-Jar's Arsenal","Erdtree's Favor +2"],
  ["Crimson Amber Medallion +2","Cerulean Amber Medallion +3"],
  ["Radagon's Soreseal","Marika's Soreseal"],
  ['Warrior Jar Shard','Silver Scarab']
 ]){
  assert.equal(evaluate(...names).compatibility.status,'NO_DOCUMENTED_CONFLICT',names.join(' + '));
 }
});

test('eight exact two-pass public v1.17 click observations are exposed without interpolating effect outputs',async()=>{
 const {V117_DIRECT_SELECTOR_EXCLUSIONS:cases}=await import('../public/src/v117-talisman-selector-exclusions-direct.mjs');
 assert.equal(cases.length,8);
 for(const x of cases){
  assert.equal(x.independentChromiumPasses,2);
  const actual=previewV117ExactTalismanCombination(base,equip(...x.names));
  const wanted=x.selectorOutcome==='NONE_SELECTED'?
   'source-duplicate-toggle-observed':'source-exclusivity-observed';
  assert.equal(actual.status,wanted,x.names.join(' → '));
  assert.deepEqual(actual.observation.actualSelectedNames,x.actualSelectedNames);
  assert.equal(Object.hasOwn(actual.observation,'negation'),false,'no invented numeric goldens');
 }
 const unmeasured=previewV117ExactTalismanCombination(base,
  equip("Erdtree's Favor +2","Erdtree's Favor"));
 assert.equal(unmeasured.status,'combination-not-directly-verified');
});

test('direct-site selector evidence never propagates into unmeasured reverse, tiers or extra selections',()=>{
 for(const names of [
  ["Erdtree's Favor +2","Erdtree's Favor"],
  ["Erdtree's Favor +1","Erdtree's Favor +2"],
  ["Arsenal Charm","Great-Jar's Arsenal"],
  ['Crimson Amber Medallion +1','Crimson Amber Medallion +3'],
  ["Marika's Scarseal","Marika's Soreseal","Silver Scarab"],
  ["Radagon's Scarseal","Radagon's Soreseal","Starscourge Heirloom"]
 ]){
  const x=evaluate(...names);
  assert.equal(x.compatibility.status,'UNWEARABLE');
  const conflict=x.compatibility.conflicts.find(q=>q.type==='exclusive-family');
  assert.ok(conflict);
  assert.equal(conflict.exactSelectorOrderObserved,false);
  assert.equal(conflict.evidence,'independent-documentation-only');
  assert.match(conflict.note,/NOT been tested twice/);
  assert.equal(x.exactTotal,null);
 }
 for(const names of [
  ["Radagon's Scarseal","Radagon's Soreseal"],
  ["Radagon's Soreseal","Radagon's Scarseal"],
  ["Marika's Scarseal","Marika's Soreseal"],
  ["Marika's Soreseal","Marika's Scarseal"]
 ]){
  const conflict=evaluate(...names).compatibility.conflicts[0];
  assert.equal(conflict.exactSelectorOrderObserved,true);
  assert.equal(conflict.evidence,'direct-site-both-orders-plus-independent-documentation');
 }
});
