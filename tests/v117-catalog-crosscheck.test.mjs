import test from 'node:test';
import assert from 'node:assert/strict';
import {compareDlcWithV117} from '../public/src/v117-catalog-crosscheck.mjs';

const source=()=>({
 weapons:[
  {name:'Test Sword',weaponName:'Test Sword',affinityId:0,reinforceTypeId:1,
   requirements:{str:12,dex:10},attack:[[0,100],[2,20]]},
  {name:'Flame Test Sword',weaponName:'Test Sword',affinityId:2,reinforceTypeId:2,
   requirements:{str:12,dex:10},attack:[[0,120],[2,80]]},
  {name:'Unique Spear',weaponName:'Unique Spear',affinityId:-1,reinforceTypeId:1,
   requirements:{str:15,dex:12,fai:20},attack:[[0,50]]}
 ],
 reinforceTypes:{
  1:[{attack:{0:1.2,2:1.5}}],
  2:[{attack:{0:1,2:1}}]
 }
});
const catalog=()=>({
 weapons:[
  {name:'Test Sword',expansion:'Shadow of the Erdtree',
   attack:[120,0,30,0,0],requirements:[12,10,0,0,0]},
  {name:'Unique Spear',expansion:'Shadow of the Erdtree',
   attack:[60,0,0,0,0],requirements:[15,12,0,20,0]},
  {name:'Base Longsword',attack:[100,0,0,0,0],requirements:[8,10,0,0,0]}
 ]});
test('source-vs-wiki comparison uses reinforcement +0 multiplier and exact neutral affinity',()=>{
 const result=compareDlcWithV117(catalog(),source());
 assert.equal(result.catalogDlcCount,2);
 assert.equal(result.compared,2);
 assert.deepEqual(result.unmatched,[]);
 assert.deepEqual(result.ambiguous,[]);
 assert.equal(result.attackConflicts,0);
 assert.equal(result.requirementConflicts,0);
 assert.equal(result.differences.length,0);
 assert.equal(result.gameVerified,false);
});
test('independent source disagreements are identified by field without making an automatic correction',()=>{
 const cat=catalog();
 cat.weapons[0].attack[2]=32;
 cat.weapons[1].requirements[3]=13;
 const original=structuredClone(cat);
 const report=compareDlcWithV117(cat,source());
 assert.equal(report.attackConflicts,1);
 assert.equal(report.requirementConflicts,1);
 assert.deepEqual(report.differences.map(x=>x.name),['Test Sword','Unique Spear']);
 assert.deepEqual(cat,original);
 assert.deepEqual(report.differences[0].sourceAttack,[120,0,30,0,0]);
 assert.deepEqual(report.differences[1].sourceRequirements,[15,12,0,20,0]);
});
test('missing, ambiguous or malformed source input is surfaced instead of guessed',()=>{
 const cat=catalog(),src=source();
 src.weapons=src.weapons.filter(w=>w.weaponName!=='Unique Spear');
 assert.deepEqual(compareDlcWithV117(cat,src).unmatched,['Unique Spear']);
 src.weapons.push({...src.weapons[0],affinityId:-1});
 assert.deepEqual(compareDlcWithV117(cat,src).ambiguous,['Test Sword']);
 const corrupt=source();delete corrupt.reinforceTypes['1'];
 assert.throws(()=>compareDlcWithV117(cat,corrupt),/Missing \+0 reinforce/);
 assert.throws(()=>compareDlcWithV117({},src),/Invalid catalog/);
});
