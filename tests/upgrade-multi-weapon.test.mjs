import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planUpgradeMaterials} from '../public/src/upgrade-materials.mjs';
import {planWeaponUpgradeBasket,weaponUpgradeBasketCsv} from '../public/src/upgrade-multi-weapon.mjs';

const materials=(result,key)=>result.allMaterials.find(x=>x.key===key);
const plans=[
 {name:'Uchigatana',track:'regular',from:0,to:6},
 {name:'Greatsword',track:'regular',from:4,to:7},
 {name:'Sword of Night',track:'somber',from:8,to:10}
];
test('exact mixed basket sums source material schedules and subtracts owned stock once',()=>{
 const basket=planWeaponUpgradeBasket(plans,{
  'regular-1':4,'regular-2':10,'somber-9':1
 });
 assert.equal(basket.weaponCount,3);
 assert.equal(basket.totalStones,38);
 assert.equal(basket.regularStones,36);
 assert.equal(basket.somberStones,2);
 assert.equal(basket.totalSteps,6+3+2);
 assert.equal(basket.totalMissing,23);
 assert.deepEqual(basket.weapons.map(x=>x.totalStones),[24,12,2]);
 assert.equal(materials(basket,'regular-1').required,12);
 assert.equal(materials(basket,'regular-1').owned,4);
 assert.equal(materials(basket,'regular-1').missing,8);
 assert.equal(materials(basket,'regular-2').required,22);
 assert.equal(materials(basket,'regular-2').owned,10);
 assert.equal(materials(basket,'regular-2').missing,12);
 assert.equal(materials(basket,'regular-3').required,2);
 assert.equal(materials(basket,'somber-9').missing,0);
 assert.equal(materials(basket,'somber-ancient').missing,1);
 assert.equal(basket.caution.includes('No weapon AR'),true);
});
test('same weapon can be planned twice and inventory is not subtracted twice',()=>{
 const two=[{name:'Duplicate weapon',track:'somber',from:0,to:10},
  {name:'Duplicate weapon',track:'somber',from:0,to:10}];
 const basket=planWeaponUpgradeBasket(two,{'somber-1':1,'somber-ancient':1});
 assert.equal(basket.totalStones,20);
 assert.equal(basket.totalMissing,18);
 assert.equal(materials(basket,'somber-1').required,2);
 assert.equal(materials(basket,'somber-1').missing,1);
 assert.equal(materials(basket,'somber-ancient').required,2);
 assert.equal(materials(basket,'somber-ancient').missing,1);
 assert.equal(basket.weapons.length,2);
});
test('completed plans have zero required stones, owned surplus remains leftovers',()=>{
 const result=planWeaponUpgradeBasket([
  {name:'already done',track:'regular',from:25,to:25},
  {name:'another done',track:'somber',from:10,to:10}
 ],{'regular-ancient':3});
 assert.equal(result.totalStones,0);
 assert.equal(result.totalMissing,0);
 assert.equal(result.totalSteps,0);
 assert.equal(result.materials.length,1);
 assert.equal(materials(result,'regular-ancient').leftover,3);
});
test('basket parity with original single-weapon plan and full +25/+10 counts',()=>{
 for(const [track,to,needed] of [['regular',25,97],['somber',10,10]]){
  const individual=planUpgradeMaterials(track,0,to);
  const basket=planWeaponUpgradeBasket([{name:'a',track,from:'0',to:String(to)}]);
  assert.equal(basket.totalStones,needed);
  assert.equal(basket.totalStones,individual.totalStones);
  assert.deepEqual(basket.weapons[0].materials.map(x=>x.required),
   individual.materials.map(x=>x.required));
 }
});
test('reject partial, malformed and over-capacity basket without mutating shared state',()=>{
 assert.throws(()=>planWeaponUpgradeBasket([]),/1 to 8/);
 assert.throws(()=>planWeaponUpgradeBasket(Array.from({length:9},(_,i)=>({
  name:String(i),track:'regular',from:0,to:25}))),/1 to 8/);
 for(const row of [
  {name:'',track:'regular',from:0,to:25},
  {name:'x'.repeat(121),track:'regular',from:0,to:25},
  {name:'\u0001bad',track:'regular',from:0,to:25},
  {name:'x',track:'unverified',from:0,to:10},
  {name:'x',track:'regular',from:24,to:26},
  {name:'x',track:'somber',from:9,to:11},
  {name:'x',track:'regular',from:6,to:5},
  {name:'x',track:'regular',from:'',to:25}
 ])assert.throws(()=>planWeaponUpgradeBasket([row]),RangeError);
 for(const owned of [{invalid:2},{'somber-1':-1},{'regular-1':1000000},
  {'regular-1':1.5},null,[]])
  assert.throws(()=>planWeaponUpgradeBasket([plans[0]],owned),RangeError);
});
test('CSV includes named rows, combined inventory and neutralizes spreadsheet formulas',()=>{
 const basket=planWeaponUpgradeBasket([
  {name:'=SUM(A1:A9)',track:'regular',from:0,to:1},
  {name:'Uchigatana',track:'somber',from:0,to:2}
 ],{'regular-1':1});
 const csv=weaponUpgradeBasketCsv(basket);
 assert.ok(csv.startsWith('"section","weapon","track"'));
 assert.ok(csv.includes('"\'=SUM(A1:A9)"'));
 assert.ok(csv.includes('"aggregate"'));
 assert.ok(csv.includes('"Smithing Stone [1]"'));
 assert.ok(csv.includes('"Somber Smithing Stone [2]"'));
 assert.ok(csv.includes('"total"'));
 assert.ok(csv.endsWith('\r\n'));
 assert.equal(csv.includes('undefined'),false);
 assert.throws(()=>weaponUpgradeBasketCsv({}),RangeError);
});
test('existing material calculator remains standalone and new page fields are wired',()=>{
 const html=readFileSync(new URL('../public/weapon-upgrade-calculator/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../public/src/upgrade-materials-app.mjs',import.meta.url),'utf8');
 for(const id of [
  'multi-upgrade-title','multi-add-current','multi-add-blank','multi-clear',
  'multi-upgrade-feedback','multi-weapon-rows','multi-owned-inputs',
  'multi-reset-owned','multi-upgrade-results','multi-count','multi-total',
  'multi-missing','multi-upgrade-summary','multi-material-rows','multi-export'
 ]){
  assert.equal(html.split('id="'+id+'"').length-1,1,id+' missing or duplicate');
 }
 for(const id of ['multi-add-current','multi-add-blank','multi-clear','multi-weapon-rows',
  'multi-owned-inputs','multi-reset-owned','multi-upgrade-results','multi-count',
  'multi-total','multi-missing','multi-material-rows','multi-export']){
  assert.ok(js.includes("'"+id+"'"),id+' not wired in app');
 }
 assert.ok(js.includes("planWeaponUpgradeBasket(readMultiRows(),readMultiInventory())"));
 assert.ok(js.includes("name=handoff.weaponName||")||js.includes("const name=handoff.weaponName||"));
 assert.ok(html.includes('noindex,follow'));
 assert.ok(js.includes("el('export-list').addEventListener"));
});
