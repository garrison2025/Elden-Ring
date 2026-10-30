import test from 'node:test';
import assert from 'node:assert/strict';
import {materialCatalog,stoneForStep,planUpgradeMaterials,materialsCsv} from '../public/src/upgrade-materials.mjs';
test('regular +0 to +25 consumes 12 of each grade and one ancient stone',()=>{
 const p=planUpgradeMaterials('regular',0,25);
 assert.equal(p.totalSteps,25);assert.equal(p.totalStones,97);
 for(let i=1;i<=8;i++)assert.equal(p.allMaterials.find(x=>x.key==='regular-'+i).required,12);
 assert.equal(p.allMaterials.find(x=>x.key==='regular-ancient').required,1);
 assert.equal(stoneForStep('regular',1).amount,2);
 assert.equal(stoneForStep('regular',2).amount,4);
 assert.equal(stoneForStep('regular',3).amount,6);
 assert.equal(stoneForStep('regular',4).label,'Smithing Stone [2]');
 assert.equal(stoneForStep('regular',25).label,'Ancient Dragon Smithing Stone');
});
test('somber +0 to +10 takes nine unique stones and one ancient',()=>{
 const p=planUpgradeMaterials('somber',0,10);
 assert.equal(p.totalSteps,10);assert.equal(p.totalStones,10);
 assert.equal(p.materials.length,10);
 assert.equal(p.materials.find(x=>x.key==='somber-ancient').required,1);
 assert.equal(stoneForStep('somber',8).label,'Somber Smithing Stone [8]');
});
test('partial intervals respect previous upgrades and no materials when target equals current',()=>{
 const r=planUpgradeMaterials('regular',2,5);
 assert.deepEqual(r.steps.map(s=>s.amount),[6,2,4]);
 assert.equal(r.totalStones,12);
 assert.equal(r.materials.find(x=>x.key==='regular-1').required,6);
 const s=planUpgradeMaterials('somber',8,10);
 assert.equal(s.totalStones,2);
 assert.equal(planUpgradeMaterials('regular',20,20).totalStones,0);
});
test('owned material inventory subtracts missing quantities without going negative',()=>{
 const p=planUpgradeMaterials('regular',0,3,{'regular-1':7,'regular-ancient':10});
 assert.equal(p.materials[0].required,12);assert.equal(p.materials[0].missing,5);
 assert.equal(p.allMaterials.find(x=>x.key==='regular-ancient').leftover,10);
 assert.equal(p.totalMissing,5);
});
test('invalid level, inventory and track rejected',()=>{
 assert.throws(()=>planUpgradeMaterials('regular',2,1),/below/);
 assert.throws(()=>planUpgradeMaterials('regular',0,26),/0 to 25/);
 assert.throws(()=>planUpgradeMaterials('somber',0,11),/0 to 10/);
 assert.throws(()=>planUpgradeMaterials('other',0,1),/regular or somber/);
 assert.throws(()=>planUpgradeMaterials('regular','',5),/whole/);
 assert.throws(()=>planUpgradeMaterials('regular',0,1,{'regular-1':-1}),/Owned/);
 assert.throws(()=>planUpgradeMaterials('regular',0,1,{'regular-1':1.2}),/Owned/);
 assert.throws(()=>planUpgradeMaterials('regular',0,1,{'somber-1':1}),/Unknown/);
});
test('catalog counts and CSV safely quote labels',()=>{
 assert.equal(materialCatalog('regular').length,9);
 assert.equal(materialCatalog('somber').length,10);
 const result=planUpgradeMaterials('somber',9,10);
 assert.match(materialsCsv(result),/Somber Ancient Dragon Smithing Stone/);
 assert.equal(materialsCsv(result).trim().split('\r\n').length,2);
});
