import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditSourceFamilyCoverage} from '../public/src/regulation-catalog-family-audit.mjs';
const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
test('two-way family audit excludes ONLY exact named Unarmed pseudo-state, not actual shields',()=>{
 const cat={weapons:[{name:'Greatsword'},{name:"Sword of St. Trina"}]};
 const src={weapons:[
  {name:'Heavy Greatsword',weaponName:'Greatsword',affinityId:1,weaponType:5},
  {name:'Greatsword',weaponName:'Greatsword',affinityId:0,weaponType:5},
  {name:"Sword of St. Trina",weaponName:"Sword of St. Trina",affinityId:-1,weaponType:3},
  {name:'Unarmed',weaponName:'Unarmed',affinityId:-1,weaponType:35}
 ]};
 const a=auditSourceFamilyCoverage(cat,src);
 assert.equal(a.uniqueSourceFamilies,3);
 assert.equal(a.sourceWearableFamilies,2);
 assert.equal(a.matchedRows,2);
 assert.equal(a.unlistedPlayableCount,0);
 assert.equal(a.excludedNonEquipmentCount,1);
 assert.equal(a.completeForPinnedSource,true);
 assert.deepEqual(a.missingIndices,[]);
});
test('reverse gate exposes a real missing shield rather than claiming one-way completeness',()=>{
 const c={weapons:[{name:'Greatsword'}]},s={weapons:[
  {name:'Greatsword',affinityId:0,weaponType:5},
  {name:'Brass Shield',affinityId:0,weaponType:67},
  {name:'Unarmed',affinityId:-1,weaponType:35}
 ]};
 const a=auditSourceFamilyCoverage(c,s);
 assert.equal(a.allMatched,true,'one-way old checker wrongly passed this');
 assert.equal(a.unlistedPlayableCount,1);
 assert.deepEqual(a.unlistedPlayable,[{name:'Brass Shield',weaponType:67}]);
 assert.equal(a.completeForPinnedSource,false);
});
test('each named 1.17 partial record is unique, retains source requirements, and cannot claim +0 AR',()=>{
 const entries=catalog.weapons.filter(w=>w.flags?.includes('source-v117-neutral-requirements-only'));
 const counts={};
 for(const w of entries){
  counts[w.category]=(counts[w.category]||0)+1;
  assert.equal(w.dataCoverage,'requirements-only');
  assert.equal(w.weight,null);assert.equal(w.attack,null);assert.equal(w.critical,null);
  assert.equal(w.scaling,null);
  assert.equal(w.requirements.length,5);
  assert.match(w.sourceVersion,/Regulation 1\.17/);
 }
 assert.equal(entries.length,72);
 assert.deepEqual(counts,{
  'Medium Shield':27,'Greatshield':25,'Curved Sword':1,
  'Small Shield':17,'Sacred Seal':1,'Greatsword':1
 });
 assert.equal(catalog.meta.count,487);
 assert.equal(catalog.meta.baseCommunityCount,377);
 assert.equal(new Set(catalog.weapons.map(w=>w.name)).size,487);
 assert.ok(!catalog.weapons.some(w=>w.name==='Unarmed'));
 assert.equal(catalog.weapons.filter(w=>w.name==='Erdtree Seal').length,1);
});
test('sourced requirements cannot be modified independently of pinned source',()=>{
 const one={weapons:[{name:'Brass Shield',category:'Medium Shield',requirements:[16,0,0,0,0],
  flags:['source-v117-neutral-requirements-only']}]};
 const src={weapons:[{name:'Brass Shield',weaponType:67,affinityId:0,
  requirements:{str:16}}]};
 assert.equal(auditSourceFamilyCoverage(one,src).completeForPinnedSource,false);
 assert.throws(()=>auditSourceFamilyCoverage({weapons:[{...one.weapons[0],requirements:[9,0,0,0,0]}]},src),RangeError);
 assert.throws(()=>auditSourceFamilyCoverage({weapons:[{...one.weapons[0],category:'Greatshield'}]},src),RangeError);
 assert.throws(()=>auditSourceFamilyCoverage({weapons:[...one.weapons,...one.weapons]},src),RangeError);
 assert.throws(()=>auditSourceFamilyCoverage(null,{}),/Invalid/);
});
