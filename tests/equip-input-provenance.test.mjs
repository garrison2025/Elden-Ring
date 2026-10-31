import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadTier} from '../public/src/core.mjs';
import {LOADOUT_WEAPON_SLOTS,LOADOUT_MANUAL_SLOTS,planEquipmentLoadout} from '../public/src/equipment-loadout.mjs';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';

const read=path=>readFileSync(new URL('../public/'+path,import.meta.url),'utf8');
const catalog=validateCommunityCatalog(JSON.parse(read('data/community-weapon-catalog.json')));
const blank=()=>({
 weaponSlots:Object.fromEntries(LOADOUT_WEAPON_SLOTS.map(slot=>[slot.id,''])),
 manualSlots:Object.fromEntries(LOADOUT_MANUAL_SLOTS.map(slot=>[slot.id,{mode:'empty',weight:''}])),
 maxLoad:'75',confirmed:true
});

test('load tiers distinguish UNKNOWN missing input from deliberate numeric zero',()=>{
 for(const unknown of ['', '   ',null,undefined,false,true,[],{},'0x10','1e2']){
  assert.throws(()=>loadTier(unknown,75),RangeError,JSON.stringify(unknown));
  assert.throws(()=>loadTier(20,unknown),RangeError,JSON.stringify(unknown));
 }
 assert.equal(loadTier(0,75).tier,'Light','explicit numeric zero is valid');
 assert.equal(loadTier('0','75').tier,'Light','explicit decimal string zero is valid');
 assert.equal(loadTier('29.99','100').tier,'Light');
 assert.equal(loadTier('30','100').tier,'Medium');
 assert.equal(loadTier('70','100').tier,'Heavy');
 assert.equal(loadTier('100','100').tier,'Overloaded');
});

test('no omitted weapon or armor slot can be interpreted as deliberately unequipped',()=>{
 const all=blank();
 assert.equal(LOADOUT_WEAPON_SLOTS.length+LOADOUT_MANUAL_SLOTS.length,14);
 assert.equal(planEquipmentLoadout(all,catalog.weapons).complete,true,
   'explicitly confirmed all-empty slots with zero actual weight remain valid');
 for(const slot of LOADOUT_WEAPON_SLOTS){
  const state=blank();delete state.weaponSlots[slot.id];
  assert.throws(()=>planEquipmentLoadout(state,catalog.weapons),RangeError,slot.id);
  state.weaponSlots[slot.id]=null;
  assert.throws(()=>planEquipmentLoadout(state,catalog.weapons),RangeError,'null '+slot.id);
  state.weaponSlots[slot.id]='';
  assert.equal(planEquipmentLoadout(state,catalog.weapons).complete,true);
 }
 for(const slot of LOADOUT_MANUAL_SLOTS){
  const state=blank();delete state.manualSlots[slot.id];
  assert.throws(()=>planEquipmentLoadout(state,catalog.weapons),RangeError,slot.id);
  state.manualSlots[slot.id]=null;
  assert.throws(()=>planEquipmentLoadout(state,catalog.weapons),RangeError,'null '+slot.id);
  state.manualSlots[slot.id]={mode:'empty',weight:''};
  assert.equal(planEquipmentLoadout(state,catalog.weapons).complete,true);
 }
});

test('equipped but unknown weight cannot turn into zero through an explicit mode choice',()=>{
 const state=blank();
 state.manualSlots.head={mode:'equipped',weight:''};
 const result=planEquipmentLoadout(state,catalog.weapons);
 assert.equal(result.knownSubtotal,0);
 assert.equal(result.complete,false);
 assert.equal(result.load,null);
 assert.deepEqual(result.unknown,['Head armor']);
 state.manualSlots.head={mode:'equipped',weight:'0'};
 assert.equal(planEquipmentLoadout(state,catalog.weapons).complete,true);
});

test('catalog disputes and provenance counts remain unchanged',()=>{
 assert.equal(catalog.weapons.length,487);
 assert.equal(catalog.meta.v117SourceConflictCount,7);
 assert.equal(catalog.weapons.filter(w=>w.flags?.includes('v117-community-attack-conflict')).length,6);
 assert.equal(catalog.weapons.filter(w=>w.flags?.includes('v117-community-requirement-conflict')).length,1);
});

test('initial simple calculator is blank; DOM script handles empties without yielding tiers',()=>{
 const html=read('equip-load-calculator/index.html');
 const app=read('src/app.mjs');
 const weight=html.match(/<input id="gear-weight"[^>]*>/)?.[0]??'';
 const maximum=html.match(/<input id="max-load"[^>]*>/)?.[0]??'';
 assert.ok(weight&&!/\svalue=/.test(weight));
 assert.ok(maximum&&!/\svalue=/.test(maximum));
 assert.match(html,/No example weights are prefilled/);
 assert.match(app,/if\(\$\('#gear-weight'\)\.value\.trim\(\)===''\|\|\$\('#max-load'\)\.value\.trim\(\)===''\)/);
 assert.match(app,/Enter your current equipped weight and maximum load from the game to calculate/);
 assert.match(app,/if\(safe\(q\.get\('weight'\)\)\)/,
   'explicit validated URL handoff may populate genuinely supplied values');
});
