import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectArmorSource} from '../public/src/armor-source-optin.mjs';
import {optimizePinnedArmorMetric} from '../public/src/armor-source-metric-optimizer.mjs';
const fictional=()=>Array.from({length:568},(_,i)=>({
 id:'fixture-'+String(i).padStart(7,'0')+'-testing',
 name:'FICTIONAL '+i,
 category:['Helm','Chest Armor','Gauntlets','Leg Armor'][i%4],
 weight:0.5
}));
test('valid negative armor defense is a real numeric source field (and is NOT zero or missing)',()=>{
 const data=fictional();
 data[0].dmgNegation=[{name:'Phy',amount:-5},{name:'Magic',amount:-4.9},
  {name:'Fire',amount:-2.3},{name:'Ligt',amount:-5.1}];
 data[0].resistance=[{name:'Poise',amount:5},{name:'Immunity',amount:42},
  {name:'Vitality',amount:26}];
 data[1].resistance=[{name:'Poise',amount:-5}];
 data[2].dmgNegation=[{name:'Phy',amount:-100}];
 const parsed=inspectArmorSource(JSON.stringify(data)).armors;
 assert.equal(parsed[0].metrics.physical,-5);
 assert.equal(parsed[0].metrics.magic,-4.9);
 assert.equal(parsed[0].metrics.fire,-2.3);
 assert.equal(parsed[0].metrics.lightning,-5.1);
 assert.equal(parsed[0].metrics.poise,5);
 assert.equal(parsed[1].metrics.poise,null,'negative Poise is invalid');
 assert.equal(parsed[2].metrics.physical,null,'-100% is outside valid signed model bounds');
});
test('negative negation increases damage and must never rank above an empty slot unless constrained',()=>{
 const x={id:'helmet',slot:'Head',name:'SCARAB-TEST',weight:1,poise:5,
  metrics:{physical:-5}};
 const ordinary=optimizePinnedArmorMetric([x],{metric:'physical',maxEquipLoad:10,tier:'medium'});
 assert.equal(ordinary.status,'optimized-source-reference');
 assert.equal(ordinary.metricValue,0,'empty head wins against increased damage');
 assert.equal(ordinary.missingMetricExcluded,0,'negative defense is valid data');
 assert.equal(ordinary.combination[0].id,null);
 const forced=optimizePinnedArmorMetric([x],{
  metric:'physical',maxEquipLoad:10,tier:'medium',minPoise:5
 });
 assert.equal(forced.status,'optimized-source-reference');
 assert.equal(forced.metricValue,-5,'forced scarab makes effective negation negative');
 assert.equal(forced.combination[0].id,'helmet');
 assert.equal(forced.missingMetricExcluded,0);
 assert.equal(forced.poise,5);
});
test('negative damage negation must compound multiplicatively with a positive piece',()=>{
 const a={id:'minus',slot:'Head',name:'FICTIONAL MINUS',weight:1,poise:2,
  metrics:{fire:-5}};
 const b={id:'plus',slot:'Chest',name:'FICTIONAL PLUS',weight:1,poise:7,
  metrics:{fire:20}};
 const result=optimizePinnedArmorMetric([a,b],{metric:'fire',maxEquipLoad:10,minPoise:9});
 assert.equal(result.status,'optimized-source-reference');
 // 1 - (1.05 * 0.80) = 0.16 = 16% effective negation
 assert.equal(result.metricValue,16);
 assert.equal(result.poise,9);
});
