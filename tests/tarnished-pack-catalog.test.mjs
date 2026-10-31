import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 validateCommunityCatalog,searchCatalog,baseDamageParts,
 reportedBaseDamageParts,weaponWieldShortfall,cautionForWeapon
} from '../public/src/community-weapons.mjs';
import {getCatalogCoverage} from '../scripts/home-catalog-coverage.mjs';
import {LOADOUT_WEAPON_SLOTS,LOADOUT_MANUAL_SLOTS,planEquipmentLoadout}
 from '../public/src/equipment-loadout.mjs';

const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
const fields=[
 ['Reverse-Bladed Sword','Backhand Blade',3,[9,11,0,0,0]],
 ['Idus Sword','Light Greatsword',7,[10,15,0,0,0]],
 ['Hefty Scimitar','Curved Greatsword',9.5,[13,11,0,0,0]],
 ['Reed Great Katana','Great Katana',10,[11,16,0,0,0]],
 ['Ritual Thrusting Shield','Thrusting Shield',10,[13,12,0,0,0]],
 ["Leontiel's Greatsword",'Greatsword',9.5,[13,26,0,0,0]],
 ['Golden Order Flail','Flail',5,[9,16,0,26,0]],
 ['Silver Grooved Shield','Medium Shield',3,[9,12,0,0,0]]
];
const pack=catalog.weapons.filter(w=>w.expansion==='Tarnished Pack');

test('full 2026 Tarnished Pack armament set is present with traceable requirements/weight, not fictional +0 attack',()=>{
 assert.equal(validateCommunityCatalog(catalog),catalog);
 assert.equal(catalog.weapons.length,416);
 assert.equal(pack.length,8);
 assert.equal(catalog.meta.baseCommunityCount,306);
 assert.equal(catalog.meta.dlcCatalogCount,102);
 assert.equal(catalog.meta.tarnishedPackCount,8);
 assert.equal(catalog.meta.tarnishedPackWeightedRequirementsCount,8);
 assert.equal(catalog.meta.v117SourceConflictCount,7);
 assert.equal(new Set(catalog.weapons.map(w=>w.id)).size,416);
 assert.equal(new Set(pack.map(w=>w.name)).size,8);
 for(const [name,category,weight,requirements] of fields){
  const w=pack.find(w=>w.name===name);assert.ok(w,name);
  assert.equal(w.category,category);
  assert.equal(w.weight,weight);
  assert.deepEqual(w.requirements,requirements);
  assert.equal(w.attack,null);
  assert.equal(w.critical,null);
  assert.equal(w.scaling,null);
  assert.equal(baseDamageParts(w),null);
  assert.deepEqual(reportedBaseDamageParts(w),[]);
  assert.equal(w.dataCoverage,'requirements-weight-only');
  assert.equal(w.parameterReference.regulation,'1.17.3');
  assert.equal(w.parameterReference.gameBuild,'25827938');
  assert.equal(w.requirementsSourceUrl,'https://almanauts.com/eldenring/weapons/');
  assert.equal(w.weightSourceUrl,w.requirementsSourceUrl);
  assert.ok(cautionForWeapon(w).some(s=>s.includes('NOT independently inspected')));
 }
});

test('source-separated filter does not misclassify Tarnished Pack weapons as original base game or SOTE',()=>{
 assert.equal(searchCatalog(catalog.weapons,{coverage:'base'}).total,306);
 assert.equal(searchCatalog(catalog.weapons,{coverage:'dlc'}).total,102);
 assert.equal(searchCatalog(catalog.weapons,{coverage:'tarnished'}).total,8);
 assert.equal(searchCatalog(catalog.weapons,{coverage:'tarnished',term:'Silver Grooved'}).total,1);
 assert.equal(searchCatalog(catalog.weapons,{coverage:'tarnished',damage:'physical'}).total,0,
  'Unknown +0 attack must never be inferred physical from a patch-labelled max-upgrade total');
 assert.equal(searchCatalog(catalog.weapons,{coverage:'tarnished',maxWeight:3}).total,2);
 assert.deepEqual(getCatalogCoverage(catalog),{
  weapons:416,dlc:102,dlcBaseFacts:101,tarnishedPack:8
 });
});

test('Tarnished Pack requirements can power one-hand checks without implying AR',()=>{
 const chosen=pack.find(x=>x.name==='Golden Order Flail');
 const missing=weaponWieldShortfall(chosen,[9,16,10,20,10]);
 assert.equal(missing.known,true);
 assert.equal(missing.oneHandPoints,6);
 assert.equal(missing.oneHandMissing.find(x=>x.stat==='FAI')?.points,6);
 const supplied=weaponWieldShortfall(chosen,[9,16,10,26,10]);
 assert.equal(supplied.oneHandPoints,0);
});

test('sourced 1.17.3 pack weight can be included in an explicitly player-confirmed complete loadout',()=>{
 const weapon=pack.find(w=>w.name==='Idus Sword');
 const weaponSlots=Object.fromEntries(LOADOUT_WEAPON_SLOTS.map(x=>[x.id,'']));
 const manualSlots=Object.fromEntries(LOADOUT_MANUAL_SLOTS.map(x=>[x.id,{mode:'empty',weight:''}]));
 weaponSlots.rh1=weapon.id;
 const out=planEquipmentLoadout({weaponSlots,manualSlots,maxLoad:'75',confirmed:true},catalog.weapons);
 assert.equal(out.complete,true);
 assert.equal(out.knownSubtotal,7);
 assert.equal(out.selectedCount,1);
 assert.equal(out.knownWeaponWeight,7);
 assert.equal(out.unknown.length,0);
});

test('version/attribute/source tampering and fabricated +0 numbers are refused',()=>{
 const base=structuredClone(catalog);
 for(const mutate of [
  w=>{w.attack=[100,0,0,0,0];},
  w=>{w.critical=100;},
  w=>{w.scaling=['D','E','-','-','-'];},
  w=>{w.requirements=[10,15,0,0,0];w.requirementsSourceUrl='https://fake.example.org';},
  w=>{w.parameterReference.regulation='1.17';},
  w=>{w.weightSourceUrl='https://fake.example.org';},
  w=>{w.sourceUrl='https://fake.example.org';}
 ]){
  const copy=structuredClone(base);mutate(copy.weapons.find(w=>w.name==='Idus Sword'));
  assert.throws(()=>validateCommunityCatalog(copy),RangeError);
 }
 const badCount=structuredClone(base);badCount.meta.tarnishedPackCount=7;
 assert.throws(()=>validateCommunityCatalog(badCount),/metadata mismatch/);
});
