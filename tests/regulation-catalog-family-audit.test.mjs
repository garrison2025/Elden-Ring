import test from 'node:test';
import assert from 'node:assert/strict';
import {auditSourceFamilyCoverage} from '../public/src/regulation-catalog-family-audit.mjs';
test('all community entries can match their true base weapon family despite many affinities',()=>{
 const cat={weapons:[{name:'Greatsword'},{name:"Sword of St. Trina"},{name:'Greatsword'}]};
 const src={weapons:[{name:'Heavy Greatsword',weaponName:'Greatsword',affinityId:1},
  {name:'Greatsword',weaponName:'Greatsword',affinityId:0},
  {name:"Sword of St. Trina",weaponName:"Sword of St. Trina",affinityId:-1}]};
 const r=auditSourceFamilyCoverage(cat,src);
 assert.equal(r.catalogRows,3);assert.equal(r.matchedRows,3);
 assert.equal(r.uniqueSourceFamilies,2);assert.equal(r.missingRows,0);
 assert.equal(r.allMatched,true);assert.equal(r.gameVerified,false);
 assert.deepEqual(r.missingIndices,[]);
});
test('unknown source family is blocked and only row indices are reported',()=>{
 const a=auditSourceFamilyCoverage({weapons:[{name:'Spear'},{name:'Fake Weapon'}]},
  {weapons:[{name:'Spear',weaponName:'Spear'}]});
 assert.equal(a.matchedRows,1);assert.equal(a.missingRows,1);
 assert.equal(a.allMatched,false);assert.deepEqual(a.missingIndices,[1]);
 assert.equal(a.namesOrSourceParamsExported,false);
 assert.ok(!JSON.stringify(a).includes('Fake Weapon'));
});
test('exact-match filter does not silently turn historic network-test names into released items',()=>{
 const r=auditSourceFamilyCoverage({weapons:[{name:'Winged Spear'}]},
  {weapons:[{name:'Spear',weaponName:'Spear'}]});
 assert.equal(r.matchedRows,0);assert.equal(r.missingRows,1);
 assert.throws(()=>auditSourceFamilyCoverage(null,{}),/Invalid/);
 assert.throws(()=>auditSourceFamilyCoverage({weapons:[]},{weapons:[]},{maxExamples:101}),/Invalid/);
});
