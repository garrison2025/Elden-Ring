import test from 'node:test';
import assert from 'node:assert/strict';
import {buildV117CatalogOverlay} from '../public/src/v117-catalog-overlay.mjs';
import {buildV117ComparatorCatalog} from '../public/src/v117-comparator-catalog.mjs';
import {searchCatalog,weaponRequirementComparison,hasDisputedAttack,
 hasDisputedWeight,hasDisputedRequirements} from '../public/src/community-weapons.mjs';

const input=()=>({weapons:[
 {id:'missing',name:'Missing Blade',category:'Straight Sword',attack:null,
  requirements:[10,10,0,0,0],weight:null,scaling:null,dataCoverage:'requirements-only',
  flags:['source-v117-neutral-requirements-only','weight-and-base-attack-unknown']},
 {id:'changed',name:'Changed Blade',category:'Straight Sword',
  attack:[90,0,0,0,0],requirements:[12,12,0,0,0],weight:4,
  upgradeReference:{path:'regular',attackByLevel:[]},flags:[
  'v117-community-attack-conflict','v117-community-requirement-conflict']},
 {id:'weight',name:'Weight Blade',category:'Shield',attack:[60,0,0,0,0],
  requirements:[11,0,0,0,0],weight:9,
  flags:['tarnished-pack-requirement-secondary-conflict',
   'tarnished-pack-weight-secondary-conflict']}
]});
const source=()=>({weapons:[
 {name:'Missing Blade',weaponName:'Missing Blade',affinityId:0,reinforceTypeId:1,
  attack:[[0,78]],requirements:{str:10,dex:10}},
 {name:'Changed Blade',weaponName:'Changed Blade',affinityId:0,reinforceTypeId:1,
  attack:[[0,110]],requirements:{str:14,dex:13}},
 {name:'Weight Blade',weaponName:'Weight Blade',affinityId:-1,reinforceTypeId:1,
  attack:[[0,60]],requirements:{str:13}}
],reinforceTypes:{1:[{attack:{0:1}}]}});

test('all family rows become usable with explicitly accepted 1.17 attack and requirements; originals untouched',()=>{
 const original=input(),before=structuredClone(original);
 const overlay=buildV117CatalogOverlay(original,source());
 const {catalog,summary}=buildV117ComparatorCatalog(original,overlay);
 assert.deepEqual(original,before);
 assert.deepEqual(summary,{mapped:3,recoveredAttack:1,overriddenAttack:1,
  overriddenRequirements:2,weightNotSupplied:1,weightConflictsRemain:1});
 const [missing,changed,weight]=catalog.weapons;
 assert.deepEqual(missing.attack,[78,0,0,0,0]);
 assert.equal(missing.weight,null);
 assert.equal(missing.v117Comparator,true);
 assert.deepEqual(changed.attack,[110,0,0,0,0]);
 assert.deepEqual(changed.requirements,[14,13,0,0,0]);
 assert.equal(changed.upgradeReference,null,'Different old upgrade table cannot leak into comparator mode');
 assert.equal(hasDisputedAttack(changed),false);
 assert.equal(hasDisputedRequirements(changed),false);
 assert.equal(hasDisputedRequirements(weight),false);
 assert.equal(hasDisputedWeight(weight),true,'Tarnished parameter source lacks weight');
 assert.equal(searchCatalog(catalog.weapons,{damage:'physical'}).total,3);
 assert.equal(searchCatalog(catalog.weapons,{damage:'physical',maxWeight:5}).total,1);
 assert.equal(searchCatalog(catalog.weapons,{wield:'one',
  stats:[14,13,10,10,10]}).total,3);
 assert.equal(weaponRequirementComparison(weight,[13,10,10,10,10]).oneHanded.canWield,true);
});
test('reject partial, duplicate, invalid and not-versioned records without silent fallback',()=>{
 const original=input(),overlay=buildV117CatalogOverlay(original,source());
 overlay.rows.delete('missing');
 assert.throws(()=>buildV117ComparatorCatalog(original,overlay),/complete versioned/);
 const o2=buildV117CatalogOverlay(original,source());
 o2.rows.get('missing').attack[0]=-1;
 assert.throws(()=>buildV117ComparatorCatalog(original,o2),/invalid v1.17/);
 const o3=buildV117CatalogOverlay(original,source());
 o3.rows.get('missing').sourceGameVersion='1.16';
 assert.throws(()=>buildV117ComparatorCatalog(original,o3),/invalid v1.17/);
});
