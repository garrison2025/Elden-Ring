import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planWeaponUpgradeBasket} from '../public/src/upgrade-multi-weapon.mjs';
import {
 SMITHING_BASKET_STORAGE_KEY,SMITHING_BASKET_STORAGE_VERSION,
 SMITHING_BASKET_MAX_JSON,makeSmithingBasketSnapshot,parseSmithingBasketSnapshot
} from '../public/src/upgrade-basket-storage.mjs';

const weapons=[
 {name:'Uchigatana',track:'regular',from:'0',to:'6'},
 {name:'Sword of Night',track:'somber',from:'3',to:'10'}
];
const stock={'regular-1':5,'regular-2':1,'somber-4':3};
const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');

test('opt-in snapshot round-trips confirmed mixed tracks and shared inventory without extra fields',()=>{
 const saved=makeSmithingBasketSnapshot(weapons,stock);
 assert.equal(saved.version,SMITHING_BASKET_STORAGE_VERSION);
 assert.equal(SMITHING_BASKET_STORAGE_KEY,'buildlab:smithing-basket:v1');
 assert.deepEqual(saved.weapons,[
  {name:'Uchigatana',track:'regular',from:0,to:6},
  {name:'Sword of Night',track:'somber',from:3,to:10}
 ]);
 assert.deepEqual(saved.inventory,stock);
 assert.deepEqual(Object.keys(saved).sort(),['inventory','version','weapons']);
 const loaded=parseSmithingBasketSnapshot(JSON.stringify(saved));
 assert.deepEqual(loaded,saved);
 const plan=planWeaponUpgradeBasket(loaded.weapons,loaded.inventory);
 assert.equal(plan.weaponCount,2);
 assert.equal(plan.totalStones,31);
 assert.equal(plan.totalMissing,24); // Somber [4] has only 1 required; surplus stock is not deducted from other types.
});
test('saved basket does not imply content access, weapon source parameters, current game patch or AR',()=>{
 const saved=makeSmithingBasketSnapshot([
  {...weapons[0],id:'sote-reference-068',ar:99999,
   userAccount:'irrelevant',upgradeReference:{path:'somber'}}
 ],{'regular-1':0,'somber-3':0});
 const serialized=JSON.stringify(saved);
 for(const name of ['id','ar','userAccount','upgradeReference','GamePatch','sourceUrl'])
  assert.equal(serialized.includes('"'+name+'"'),false);
 assert.deepEqual(saved.inventory,{});
});
test('bad, stale, oversized, empty and corrupt saves fail before replacing UI',()=>{
 for(const raw of [
  '', '{', '[]', '{}', 'null', JSON.stringify({version:2,weapons,inventory:stock}),
  JSON.stringify({version:1,weapons:[],inventory:{}}),
  JSON.stringify({version:1,weapons:Array.from({length:9},()=>weapons[0]),inventory:{}}),
  JSON.stringify({version:1,weapons:[{name:'one',track:'regular',from:null,to:5}],inventory:{}}),
  JSON.stringify({version:1,weapons:[{name:'one',track:'regular',from:0,to:''}],inventory:{}}),
  JSON.stringify({version:1,weapons:[{name:'one',track:'bad',from:0,to:2}],inventory:{}}),
  JSON.stringify({version:1,weapons:[{name:'one',track:'somber',from:5,to:25}],inventory:{}}),
  JSON.stringify({version:1,weapons:[{name:'one',track:'regular',from:6,to:4}],inventory:{}}),
  JSON.stringify({version:1,weapons:[{name:'one',track:'regular',from:0,to:25}],inventory:{'invalid':5}}),
  JSON.stringify({version:1,weapons:[{name:'one',track:'regular',from:0,to:25}],inventory:{'regular-1':-1}}),
  JSON.stringify({version:1,weapons:[weapons[0]],inventory:null}),
  ' '.repeat(SMITHING_BASKET_MAX_JSON+1)
 ])assert.throws(()=>parseSmithingBasketSnapshot(raw),RangeError,raw.slice(0,45));
 assert.throws(()=>makeSmithingBasketSnapshot([],{}),RangeError);
 assert.throws(()=>makeSmithingBasketSnapshot([weapons[0]],{'regular-2':1.5}),RangeError);
});
test('missing inventory quantities do not get invented, surplus is safe',()=>{
 const saved=makeSmithingBasketSnapshot([weapons[0]],{'regular-1':900,'regular-2':0});
 assert.deepEqual(saved.inventory,{'regular-1':900});
 const loaded=parseSmithingBasketSnapshot(JSON.stringify(saved));
 const plan=planWeaponUpgradeBasket(loaded.weapons,loaded.inventory);
 assert.equal(plan.totalMissing,12);
 assert.equal(plan.allMaterials.find(x=>x.key==='regular-1').leftover,888);
});
test('website includes accessible opt-in controls and only user clicks interact with browser storage',()=>{
 const html=read('weapon-upgrade-calculator/index.html');
 const app=read('src/upgrade-materials-app.mjs');
 const storage=read('src/upgrade-basket-storage.mjs');
 for(const id of ['multi-save-local','multi-load-local','multi-delete-local','multi-storage-feedback']){
  assert.equal(html.split('id="'+id+'"').length-1,1,id);
  assert.ok(app.includes("'"+id+"'"),id+' must be wired');
 }
 assert.ok(app.includes("localStorage.setItem(SMITHING_BASKET_STORAGE_KEY"));
 assert.ok(app.includes("localStorage.getItem(SMITHING_BASKET_STORAGE_KEY"));
 assert.ok(app.includes("localStorage.removeItem(SMITHING_BASKET_STORAGE_KEY"));
 assert.ok(app.includes("const saved=parseSmithingBasketSnapshot(raw)"));
 assert.ok(app.indexOf("const saved=parseSmithingBasketSnapshot(raw)")<
   app.indexOf("multiRows.replaceChildren(detached)"));
 assert.ok(app.includes('document.createDocumentFragment()'));
 assert.ok(html.includes('Saving is optional.'));
 assert.ok(html.includes('Restore replaces the current multi-weapon list'));
 assert.ok(!storage.includes('localStorage.'));
 assert.ok(html.includes('noindex,follow'));
});
