import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DIRECT_V117_CIRCLET_OF_LIGHT as circlet} from '../public/src/tarnished-v117-dlc-circlet.mjs';
import {ARMOR_SOURCE_COUNT,loadPinnedArmorSource,findExactArmor} from '../public/src/armor-source-optin.mjs';
import {siteVerifiedArmorSubset} from '../public/src/tarnished-armor-eligibility.mjs';
import {optimizePinnedArmorMetric} from '../public/src/armor-source-metric-optimizer.mjs';

test('the new DLC candidate is only one newly audited Head row, with unknown other metrics',()=>{
 assert.equal(circlet.name,'Circlet of Light');
 assert.equal(circlet.slot,'Head');
 assert.equal(circlet.weight,1);
 assert.equal(circlet.poise,5);
 assert.equal(circlet.metrics.poise,5);
 assert.equal(Object.keys(circlet.metrics).length,13);
 for(const [key,val] of Object.entries(circlet.metrics))if(key!=='poise')assert.equal(val,null);
 assert.ok(circlet.siteDirectFields.weight);
 assert.ok(circlet.siteDirectFields.poise);
 assert.ok(!circlet.siteDirectFields.physical);
 assert.match(circlet.effectNotModeled,/INT, FAI, ARC/);
});
test('original 568 pinned records stay untouched; two separately verified DLC candidates append',async()=>{
 const raw=Array.from({length:ARMOR_SOURCE_COUNT},(_,i)=>({
  id:'fictional-row-'+i+'-source',name:'FICTIONAL '+i,
  category:['Helm','Chest Armor','Gauntlets','Leg Armor'][i%4],weight:1
 }));
 const source=await loadPinnedArmorSource(async()=>({ok:true,headers:{get:()=>null},
  text:async()=>JSON.stringify(raw)}));
 assert.equal(source.count,568);
 assert.equal(source.armors.length,570);
 assert.equal(source.additionalVerifiedDlcArmorCount,2);
 assert.equal(findExactArmor(source.armors,'Head','Circlet of Light')?.poise,5);
 assert.equal(findExactArmor(source.armors,'Arms','Gravebird Bracelets')?.poise,3);
 assert.equal(siteVerifiedArmorSubset(source.armors,'poise').accepted.length,2);
 assert.equal(siteVerifiedArmorSubset(source.armors,'physical').accepted.length,0);
});
test('the exact 70 Poise combination is COMPUTED, never injected as an answer',()=>{
 const items=[
  circlet,
  {id:'observed-tree-sentinel-armor',name:'Tree Sentinel Armor',slot:'Chest',weight:18.9,poise:39},
  {id:'observed-preceptors-gloves',name:"Preceptor's Gloves",slot:'Arms',weight:2.1,poise:3},
  {id:'observed-tree-sentinel-greaves',name:'Tree Sentinel Greaves',slot:'Legs',weight:11.7,poise:23}
 ];
 const opts={metric:'poise',maxEquipLoad:48.176,reservedWeight:0,tier:'medium',minPoise:0};
 const result=optimizePinnedArmorMetric(items,opts);
 assert.equal(result.metricValue,70);
 assert.ok(Math.abs(result.armorWeight-33.7)<1e-9);
 assert.deepEqual(result.combination.map(x=>x.name),items.map(x=>x.name));
 const withoutCirclet=optimizePinnedArmorMetric(items.slice(1),opts);
 assert.equal(withoutCirclet.metricValue,65);
 assert.equal(optimizePinnedArmorMetric(items,{...opts,excludedIds:[circlet.id]}).metricValue,65);
 const constrained=optimizePinnedArmorMetric(items,{...opts,maxEquipLoad:45});
 assert.ok(constrained.metricValue<70,'Correctly reject >70% load; never hard-code 70');
});
