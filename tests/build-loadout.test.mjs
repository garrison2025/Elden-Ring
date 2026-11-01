import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
import {emptyBuildLoadout,validateBuildLoadout,evaluateBuildLoadout,encodeBuildLoadout,
 decodeBuildLoadout} from '../public/src/build-loadout.mjs';
const catalog=validateCommunityCatalog(JSON.parse(readFileSync(
 new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8')));
const w=name=>catalog.weapons.find(x=>x.name===name);
test('all 6 weapons, 4 armor, 4 talismans, 10 spells and 2 tears exist in version 1',()=>{
 const state=emptyBuildLoadout();
 assert.equal(state.weaponSlots.length,6);
 assert.equal(state.armorSlots.length,4);
 assert.equal(state.talismans.length,4);
 assert.equal(state.spells.length,10);
 assert.equal(state.crystalTears.length,2);
 assert.deepEqual(decodeBuildLoadout(encodeBuildLoadout(state)),state);
});
test('all equipped weight is exact only if every selected item has a permitted source or user weight',()=>{
 const state=emptyBuildLoadout();
 state.weaponSlots[0].id=w('Uchigatana').id;
 state.weaponSlots[1].id=w('Greatsword').id;
 state.armorSlots[0]={name:'User measured helm',weight:'3.5'};
 state.armorSlots[1]={name:'Unknown chest',weight:''};
 state.talismans[0]='Custom talisman name';
 state.spells[0]='Custom spell';
 state.greatRune='Source unknown Rune';
 state.maxEquipLoad='75';
 const partial=evaluateBuildLoadout(state,catalog);
 assert.equal(partial.exactTotal,null);
 assert.equal(partial.tier,null);
 assert.equal(partial.unknowns.length,1);
 assert.equal(partial.unknowns[0].name,'Unknown chest');
 assert.ok(partial.knownWeight>3.5);
 state.armorSlots[1].weight='7';
 const complete=evaluateBuildLoadout(state,catalog);
 assert.equal(complete.unknowns.length,0);
 assert.equal(complete.exactTotal,partial.knownWeight+7);
 assert.equal(complete.tier.tier,'Medium');
 assert.equal(complete.items.length,4);
 assert.equal(complete.items.filter(x=>x.provenance==='community-source-unverified').length,2);
});
test('five direct competitor v1.17 weights supersede unknown primary records with explicit provenance',()=>{
 const state=emptyBuildLoadout();
 state.weaponSlots[0].id=w('Albinauric Shield').id;
 state.maxEquipLoad='100';
 const first=evaluateBuildLoadout(state,catalog);
 assert.equal(first.exactTotal,4.5);
 assert.equal(first.unknowns.length,0);
 assert.equal(first.items[0].provenance,'tarnished-dev-v1.17-direct-ui');
 state.weaponSlots[0].manualWeight='3.5';
 const second=evaluateBuildLoadout(state,catalog);
 assert.equal(second.exactTotal,3.5);
 assert.equal(second.tier.tier,'Light');
 assert.equal(second.items[0].provenance,'user-entered');
});
test('community-disputed Stone-Sheathed Sword uses real v1.17 competitor 5.0 but preserves user overrides',()=>{
 const state=emptyBuildLoadout();
 state.weaponSlots[0].id=w('Stone-Sheathed Sword').id;
 const outcome=evaluateBuildLoadout(state,catalog,{allowSote:true});
 assert.equal(outcome.exactTotal,5);
 assert.equal(outcome.unknowns.length,0);
 assert.equal(outcome.items[0].provenance,'tarnished-dev-v1.17-direct-ui');
 state.weaponSlots[0].manualWeight='3.5';
 const overridden=evaluateBuildLoadout(state,catalog,{allowSote:true});
 assert.equal(overridden.exactTotal,3.5);
 assert.equal(overridden.items[0].provenance,'user-entered');
});
test('SOTE and Tarnished Pack inventory requires two separate opt in switches',()=>{
 const state=emptyBuildLoadout();
 state.weaponSlots[0].id=w('Milady').id;
 assert.throws(()=>evaluateBuildLoadout(state,catalog),/Enable Shadow/);
 assert.ok(evaluateBuildLoadout(state,catalog,{allowSote:true}));
 state.weaponSlots[1].id=w('Idus Sword').id;
 assert.throws(()=>evaluateBuildLoadout(state,catalog,{allowSote:true}),/Enable Tarnished Pack/);
 assert.ok(evaluateBuildLoadout(state,catalog,{allowSote:true,allowTarnishedPack:true}));
});
test('unknown IDs, malformed text, source-invalid loadout shape, weight mismatches fail closed',()=>{
 const base=emptyBuildLoadout();
 for(const broken of [
  {...base,weaponSlots:[]},
  {...base,spells:[]},
  {...base,crystalTears:['']},
  {...base,greatRune:'<svg>\n'},
  {...base,maxEquipLoad:'0'},
  {...base,maxEquipLoad:'1e4'},
  {...base,weaponSlots:base.weaponSlots.map((s,i)=>i? s:{id:'',manualWeight:'3'})},
  {...base,armorSlots:base.armorSlots.map((s,i)=>i?s:{name:'',weight:'3'})},
  {...base,armorSlots:base.armorSlots.map((s,i)=>i?s:{name:'Helm',weight:'-2'})},
 ])assert.throws(()=>validateBuildLoadout(broken),RangeError);
 const unknown=emptyBuildLoadout();unknown.weaponSlots[0].id='nonexistent';
 assert.throws(()=>evaluateBuildLoadout(unknown,catalog),/Unknown weapon ID/);
 assert.throws(()=>decodeBuildLoadout('{bad JSON}'),RangeError);
 assert.throws(()=>decodeBuildLoadout('x'.repeat(3900)),RangeError);
 assert.throws(()=>decodeBuildLoadout(JSON.stringify({...base,schemaVersion:2})),RangeError);
});
test('build page adds real user-controlled equipment without claiming full effects',()=>{
 const html=readFileSync(new URL('../public/build-planner/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../public/src/build-loadout-app.mjs',import.meta.url),'utf8');
 for(const id of ['build-loadout','build-loadout-start','build-loadout-maximum','build-loadout-calculate',
  'build-loadout-share','build-loadout-export','build-loadout-import','build-loadout-results'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/unknown or disputed weight blocks an exact equip-load claim/);
 assert.match(js,/armorReference:armorReference/);
 assert.match(js,/decodeBuildLoadout/);
 assert.match(js,/navigator\.clipboard\.writeText/);
 assert.match(js,/weapon-ar-calculator/);
});

test('two different new directly observed v1.17 shields contribute exact weight in loadout',()=>{
 const state=emptyBuildLoadout();
 state.weaponSlots[0].id=w('Buckler').id;
 state.weaponSlots[3].id=w('Kite Shield').id;
 state.maxEquipLoad='100';
 const result=evaluateBuildLoadout(state,catalog);
 assert.equal(result.exactTotal,6);
 assert.equal(result.unknowns.length,0);
 assert.equal(result.items.length,2);
 assert.ok(result.items.every(x=>x.provenance==='tarnished-dev-v1.17-direct-ui'));
 assert.equal(result.items.find(x=>x.name==='Buckler').weight,1.5);
 assert.equal(result.items.find(x=>x.name==='Kite Shield').weight,4.5);
});

test('two newly recovered special items contribute exact public v1.17 weights, not zero',()=>{
 const state=emptyBuildLoadout();
 state.weaponSlots[0].id=w('Inseparable Sword').id;
 state.weaponSlots[1].id=w('Jellyfish Shield').id;
 state.maxEquipLoad='100';
 const result=evaluateBuildLoadout(state,catalog);
 assert.equal(result.exactTotal,18);
 assert.equal(result.unknowns.length,0);
 assert.ok(result.items.every(x=>x.provenance==='tarnished-dev-v1.17-direct-ui'));
 assert.equal(result.items.find(x=>x.name==='Inseparable Sword').weight,10);
 assert.equal(result.items.find(x=>x.name==='Jellyfish Shield').weight,8);
});

test('observed v1.17 Staff of the Great Beyond mismatch overrides 2.0 community weight, manual input stays first',()=>{
 const state=emptyBuildLoadout();
 state.weaponSlots[0].id=w('Staff of the Great Beyond').id;
 state.maxEquipLoad='100';
 const verified=evaluateBuildLoadout(state,catalog,{allowSote:true});
 assert.equal(w('Staff of the Great Beyond').weight,2);
 assert.equal(verified.exactTotal,2.5);
 assert.equal(verified.items[0].provenance,'tarnished-dev-v1.17-direct-ui');
 state.weaponSlots[0].manualWeight='2';
 const override=evaluateBuildLoadout(state,catalog,{allowSote:true});
 assert.equal(override.exactTotal,2);
 assert.equal(override.items[0].provenance,'user-entered');
});
