import test from 'node:test';
import assert from 'node:assert/strict';
import {CLASSES,classForName,buildLevel,optimizeClasses,runeCostForLevel,runeRange,targetFromRunes,loadTier} from '../public/src/core.mjs';
test('all twelve starting classes have level-consistent attributes',()=>{
  assert.equal(CLASSES.length,12);assert.equal(CLASSES.filter(c=>c.dlc).length,2);
  for(const c of CLASSES){assert.equal(c.stats.reduce((a,b)=>a+b,0),c.level+79);assert.equal(buildLevel(c,c.stats),c.level)}
});
test('rune cost known vectors',()=>{assert.equal(runeCostForLevel(1),673);assert.equal(runeCostForLevel(2),689);assert.equal(runeCostForLevel(49),14535);assert.equal(runeCostForLevel(99),60265)});
test('rune cumulative totals match community reference',()=>{
 for(const [to,total] of [[50,262472],[100,1997878],[125,3984881],[150,7112459],[200,18253715],[713,1692566842]])assert.equal(runeRange(1,to),total);
});
test('rune budget forward simulation',()=>{
 assert.deepEqual(targetFromRunes(1,673),{level:2,remaining:0});assert.equal(targetFromRunes(1,runeRange(1,100)).level,100);
});
test('classes cannot drop stats below original or exceed cap',()=>{
 const s=classForName('Samurai');assert.throws(()=>buildLevel(s,[10,11,13,12,15,9,8,8]));assert.throws(()=>buildLevel(s,[100,11,13,12,15,9,8,8]));assert.equal(buildLevel(s,[13,11,13,12,15,9,8,8]),10);
});
test('optimizer can include or exclude DLC origins',()=>{
 assert.equal(optimizeClasses([40,20,25,30,30,10,10,10],false).length,10);
 assert.equal(optimizeClasses([40,20,25,30,30,10,10,10],true).length,12);
 assert.ok(optimizeClasses([40,20,25,30,30,10,10,10],true)[0].level>=1);
});
test('boundary conditions follow Bandai Namco',()=>{
 assert.equal(loadTier(29.9,100).tier,'Light');assert.equal(loadTier(30,100).tier,'Medium');assert.equal(loadTier(69.9,100).tier,'Medium');assert.equal(loadTier(70,100).tier,'Heavy');assert.equal(loadTier(100,100).tier,'Overloaded');
});
test('input validation prevents misleading results',()=>{
 assert.throws(()=>runeRange(100,50));assert.throws(()=>runeCostForLevel(0));assert.throws(()=>runeRange(1,714));assert.throws(()=>loadTier(-2,100));assert.throws(()=>targetFromRunes(1,-1));
});

test('rune farming runs use exact target cost less existing budget',async()=>{
 const {farmingRunsNeeded,runeRange}=await import('../public/src/core.mjs');
 const need=runeRange(10,20);
 assert.equal(farmingRunsNeeded(10,20,0,need),1);
 assert.equal(farmingRunsNeeded(10,20,need,100),0);
 assert.equal(farmingRunsNeeded(10,20,0,Math.max(1,Math.floor(need/2))),3);
 assert.throws(()=>farmingRunsNeeded(10,20,0,0));
 assert.throws(()=>farmingRunsNeeded(10,20,-1,100));
 assert.throws(()=>farmingRunsNeeded(10,20,0,1.5));
});
test('share links parse eight bounded attributes only',async()=>{
 const {parseSharedStats}=await import('../public/src/core.mjs');
 assert.deepEqual(parseSharedStats('40,20,25,30,30,10,10,10'),[40,20,25,30,30,10,10,10]);
 for(const value of [null,'40,20,25','40,20,25,30,30,10,10,100','40,20,25,30,30,10,10,<svg>','40,20,25,30,30,10,10,0','40,20,25,30,30,10,10,10,9'])assert.equal(parseSharedStats(value),null);
});
