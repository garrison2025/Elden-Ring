import test from 'node:test';
import assert from 'node:assert/strict';
import {DIRECT_V117_GRAVEBIRD_BRACELETS as x} from '../public/src/tarnished-v117-dlc-gravebird.mjs';
import {DIRECT_V117_CIRCLET_OF_LIGHT as circlet} from '../public/src/tarnished-v117-dlc-circlet.mjs';
import {optimizePinnedArmorMetric} from '../public/src/armor-source-metric-optimizer.mjs';
import {siteVerifiedArmorSubset} from '../public/src/tarnished-armor-eligibility.mjs';
import {weightedVerifiedArmorSubset,optimizeWeightedArmor} from '../public/src/armor-weighted-optimizer.mjs';
test('Gravebird Bracelets all 13 metrics independently verified twice from real Wretch site outputs',()=>{
 assert.equal(x.slot,'Arms');assert.equal(x.weight,1.7);assert.equal(x.poise,3);
 assert.equal(Object.keys(x.metrics).length,13);
 assert.deepEqual(x.metrics,{poise:3,physical:1.6,strike:1.7,slash:1.7,pierce:1.5,
  magic:2.1,fire:1.9,lightning:2.3,holy:2.3,
  immunity:17,robustness:8,focus:13,vitality:12});
 assert.ok(Object.keys(x.siteDirectFields).length>=14);
 assert.match(x.siteDirectFields.weight,/124786798063/);
 assert.match(x.siteDirectFields.poise,/124786798232/);
 assert.match(x.effectNotModeled,/remain unverified/);
});
test('actual ranked reference #2 combination 70 Poise, 33.3 load is calculated and not a hardcoded result',()=>{
 const pieces=[circlet,
  {id:'tree-chest',name:'Tree Sentinel Armor',slot:'Chest',weight:18.9,poise:39},
  x,
  {id:'tree-legs',name:'Tree Sentinel Greaves',slot:'Legs',weight:11.7,poise:23}
 ];
 const output=optimizePinnedArmorMetric(pieces,{
  metric:'poise',maxEquipLoad:48.176,reservedWeight:0,tier:'medium'
 });
 assert.equal(output.metricValue,70);assert.equal(output.armorWeight,33.3);
 assert.deepEqual(output.combination.map(it=>it.name),pieces.map(it=>it.name));
 assert.ok(output.totalWeight<48.176*0.7);
});

test('all 13 double-verified Gravebird values are eligible for both single and joint weighted objectives',()=>{
 const keys=Object.keys(x.metrics);
 assert.equal(keys.length,13);
 for(const key of keys)assert.deepEqual(siteVerifiedArmorSubset([x],key).accepted.map(i=>i.id),[x.id]);
 const subset=weightedVerifiedArmorSubset([x],keys);
 assert.deepEqual(subset.accepted.map(i=>i.id),[x.id]);
 const r=optimizeWeightedArmor([x],{maxEquipLoad:15,tier:'medium',
  weights:{physical:1,poise:0.01},minimums:{immunity:17}});
 assert.equal(r.status,'optimized-weighted-source-reference');
 assert.equal(r.metricTotals.physical,1.6);
 assert.equal(r.metricTotals.poise,3);
 assert.equal(r.metricTotals.immunity,17);
 assert.equal(r.armorWeight,1.7);
});
