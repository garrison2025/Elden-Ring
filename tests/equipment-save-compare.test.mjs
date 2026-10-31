import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
import {LOADOUT_WEAPON_SLOTS,LOADOUT_MANUAL_SLOTS} from '../public/src/equipment-loadout.mjs';
import {
 EQUIPMENT_SAVE_KEY,EQUIPMENT_SAVE_VERSION,EQUIPMENT_SAVE_MAX_BYTES,
 normalizeEquipmentSnapshot,serializeEquipmentSnapshot,parseEquipmentSnapshot,
 compareEquipmentSnapshots
} from '../public/src/equipment-save-compare.mjs';
const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const catalog=validateCommunityCatalog(JSON.parse(read('data/community-weapon-catalog.json')));
const w=name=>catalog.weapons.find(x=>x.name===name);
const source=catalog.weapons;
const blank=()=>({
 weaponSlots:Object.fromEntries(LOADOUT_WEAPON_SLOTS.map(s=>[s.id,''])),
 manualSlots:Object.fromEntries(LOADOUT_MANUAL_SLOTS.map(s=>[s.id,{mode:'empty',weight:''}])),
 maxLoad:'75',confirmed:false
});
const build=()=>{
 const s=blank();s.weaponSlots.rh1=w('Uchigatana').id;
 s.manualSlots.head={mode:'equipped',weight:'5.5'};s.confirmed=true;
 return s;
};

test('manual local storage round-trips only explicit 6+8 slots and always resets confirmation',()=>{
 const original=build(),payload=serializeEquipmentSnapshot(original,source);
 const json=JSON.parse(payload);
 assert.equal(EQUIPMENT_SAVE_KEY,'buildlab:equipment-plan:v1');
 assert.equal(EQUIPMENT_SAVE_VERSION,1);
 assert.equal(json.version,1);
 assert.equal(json.confirmed,false);
 assert.deepEqual(Object.keys(json).sort(),
  ['confirmed','manualSlots','maxLoad','version','weaponSlots']);
 assert.equal(json.weaponSlots.rh1,w('Uchigatana').id);
 assert.equal(json.manualSlots.head.weight,'5.5');
 assert.equal(json.maxLoad,'75');
 const restored=parseEquipmentSnapshot(payload,source);
 assert.equal(restored.confirmed,false);
 assert.deepEqual(restored.weaponSlots,original.weaponSlots);
 assert.deepEqual(restored.manualSlots,original.manualSlots);
 assert.equal(restored.maxLoad,original.maxLoad);
 assert.equal(normalizeEquipmentSnapshot(original,source).confirmed,true);
});

test('real equipped A/B differences depend on selected slots and not candidate shortlists',()=>{
 const A=build(),B=build();
 B.weaponSlots.rh1=w('Greatsword').id;
 B.manualSlots.head={mode:'equipped',weight:'7.5'};
 const result=compareEquipmentSnapshots(A,B,source);
 const expected=w('Greatsword').weight-w('Uchigatana').weight+2;
 assert.equal(result.changedSlots,2);
 assert.equal(result.rows.length,14);
 assert.equal(result.rows.filter(row=>row.changed).length,2);
 assert.equal(result.baseline.complete,true);
 assert.equal(result.current.complete,true);
 assert.equal(result.exactTiers,true);
 assert.ok(Math.abs(result.weightDelta-expected)<0.001);
 assert.ok(Math.abs(result.percentDelta-
  (result.current.load.percent-result.baseline.load.percent))<1e-12);
 assert.equal(result.rows.find(x=>x.slot==='Right hand 1').A.label,'Uchigatana');
 assert.equal(result.rows.find(x=>x.slot==='Right hand 1').B.label,'Greatsword');
 assert.equal(result.rows.find(x=>x.slot==='Head armor').A.weight,5.5);
 assert.equal(result.rows.find(x=>x.slot==='Head armor').B.weight,7.5);
});
test('unknown source or blank equipped armor weight never yields a fake exact delta or roll tier',()=>{
 const A=build(),B=build();
 B.manualSlots.talisman1={mode:'equipped',weight:''};
 const partial=compareEquipmentSnapshots(A,B,source);
 assert.equal(partial.changedSlots,1);
 assert.equal(partial.weightDelta,null);
 assert.equal(partial.percentDelta,null);
 assert.equal(partial.exactTiers,false);
 assert.equal(partial.current.knownSubtotal,partial.baseline.knownSubtotal);
 assert.deepEqual(partial.current.unknown,['Talisman 1']);
 const unknown={id:'unknown-weight',name:'Reference weapon',weight:null};
 const U=blank();U.weaponSlots.rh1=unknown.id;U.confirmed=true;
 const check=compareEquipmentSnapshots(blank(),U,[unknown]);
 assert.equal(check.weightDelta,null);
 assert.equal(check.current.load,null);
 assert.equal(check.current.knownSubtotal,0);
});
test('saved but unconfirmed baseline never inherits a previously confirmed roll tier',()=>{
 const original=build();
 const stored=parseEquipmentSnapshot(serializeEquipmentSnapshot(original,source),source);
 const diff=compareEquipmentSnapshots(stored,original,source);
 assert.equal(diff.baseline.complete,false);
 assert.equal(diff.current.complete,true);
 assert.equal(diff.exactTiers,false);
 assert.equal(diff.percentDelta,null);
 assert.equal(diff.changedSlots,0);
 assert.equal(diff.weightDelta,0);
});
test('corrupt, stale, invalid or oversized saves fail closed',()=>{
 const good=JSON.parse(serializeEquipmentSnapshot(build(),source));
 const mutate=fn=>{const v=structuredClone(good);fn(v);return JSON.stringify(v);};
 const invalid=[
  '', 'bad', 'null','[]','{}',
  mutate(v=>{v.version=2;}),
  mutate(v=>{delete v.weaponSlots.rh1;}),
  mutate(v=>{delete v.manualSlots.legs;}),
  mutate(v=>{v.manualSlots.head={mode:'equipped',weight:'5.9999'};}),
  mutate(v=>{v.manualSlots.head={mode:'missing',weight:'5'};}),
  mutate(v=>{v.weaponSlots.rh1='stale-or-unknown-id';}),
  mutate(v=>{v.weaponSlots.rh1='javascript:alert(1)';}),
  mutate(v=>{v.confirmed='yes';}),
  mutate(v=>{v.maxLoad='Infinity';}),
  mutate(v=>{v.manualSlots.head={mode:'equipped',weight:{bad:true}};}),
  ' '.repeat(EQUIPMENT_SAVE_MAX_BYTES+1)
 ];
 for(const text of invalid)
  assert.throws(()=>parseEquipmentSnapshot(text,source),RangeError,text.slice(0,50));
 assert.throws(()=>serializeEquipmentSnapshot(null,source),RangeError);
});
test('pin returns independent copy, preventing reference aliasing when editor changes',()=>{
 const editor=build(),pin=normalizeEquipmentSnapshot(editor,source);
 editor.manualSlots.head.weight='10';
 editor.weaponSlots.rh1='';
 assert.equal(pin.manualSlots.head.weight,'5.5');
 assert.equal(pin.weaponSlots.rh1,w('Uchigatana').id);
});
test('visible save and comparison controls have correct safety wiring',()=>{
 const html=read('equip-load-calculator/index.html');
 const app=read('src/equipment-loadout-app.mjs');
 const css=read('assets/style.css');
 const ids=['equipment-save','equipment-restore','equipment-delete-save',
  'equipment-save-feedback','equipment-ab-pin','equipment-ab-from-save',
  'equipment-ab-clear','equipment-ab-status','equipment-ab-results',
  'equipment-ab-summary-a','equipment-ab-summary-b',
  'equipment-ab-rows','equipment-ab-difference'];
 for(const id of ids){
  assert.equal(html.split('id="'+id+'"').length-1,1,'duplicate/missing '+id);
  assert.ok(app.includes("'"+id+"'"),'unwired '+id);
 }
 assert.ok(app.includes('localStorage.setItem(EQUIPMENT_SAVE_KEY'));
 assert.ok(app.includes('localStorage.getItem(EQUIPMENT_SAVE_KEY'));
 assert.ok(app.includes('localStorage.removeItem(EQUIPMENT_SAVE_KEY'));
 assert.ok(app.includes('parseEquipmentSnapshot(raw,catalog.weapons)'));
 assert.ok(app.includes('confirmed.checked=false'));
 assert.ok(app.includes('compareEquipmentSnapshots(pinnedEquipment,read(),catalog.weapons)'));
 assert.ok(css.includes('.equipment-ab-table{min-width:580px}'));
 assert.ok(html.includes('A restored record is always'));
 assert.ok(html.includes('not the Build Planner weapon shortlist'));
 assert.ok(!read('src/equipment-save-compare.mjs').includes('localStorage'));
});
