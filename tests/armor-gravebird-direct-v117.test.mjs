import test from 'node:test';
import assert from 'node:assert/strict';
import {DIRECT_V117_GRAVEBIRD_BRACELETS as x} from '../public/src/tarnished-v117-dlc-gravebird.mjs';
import {DIRECT_V117_CIRCLET_OF_LIGHT as circlet} from '../public/src/tarnished-v117-dlc-circlet.mjs';
import {optimizePinnedArmorMetric} from '../public/src/armor-source-metric-optimizer.mjs';
test('Gravebird Bracelets Weight and Poise independently observed twice; other 12 fields unknown',()=>{
 assert.equal(x.slot,'Arms');assert.equal(x.weight,1.7);assert.equal(x.poise,3);
 assert.equal(Object.keys(x.metrics).length,13);
 for(const [key,value] of Object.entries(x.metrics))assert.equal(value,key==='poise'?3:null);
 assert.match(x.siteDirectFields.weight,/124785346388/);
 assert.match(x.siteDirectFields.poise,/124785346531/);
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
