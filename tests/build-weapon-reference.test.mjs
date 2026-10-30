import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseBuildWeaponId,parseContentFlag,buildWeaponOptions,inspectBuildWeapon} from '../public/src/build-weapon-reference.mjs';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
const catalog=validateCommunityCatalog(JSON.parse(await readFile('public/data/community-weapon-catalog.json','utf8')));
const find=name=>catalog.weapons.find(w=>w.name===name);
const stats=[40,20,25,16,17,16,16,10];

test('weapon IDs are bounded, whitelisted during lookup and unsuitable URL fields fail closed',()=>{
 const milady=find('Milady');
 assert.equal(parseBuildWeaponId(null),null);
 assert.equal(parseBuildWeaponId(''),null);
 assert.equal(parseBuildWeaponId(milady.id),milady.id);
 for(const v of ['../../admin','<img>','foo,bar','abc def','x'.repeat(101),3])
  assert.throws(()=>parseBuildWeaponId(v),/Invalid weapon ID/);
 assert.throws(()=>inspectBuildWeapon(catalog.weapons,'not-a-real-id',stats),/no longer exists/);
 assert.equal(parseContentFlag(null),false);
 assert.equal(parseContentFlag('0'),false);
 assert.equal(parseContentFlag('1'),true);
 assert.throws(()=>parseContentFlag('true'),/Invalid game-content/);
});
test('DLC weapon cannot be selected without explicit SOTE reference availability',()=>{
 const milady=find('Milady'),spear=find('Greatsword');
 assert.throws(()=>inspectBuildWeapon(catalog.weapons,milady.id,stats),/Enable Shadow/);
 const result=inspectBuildWeapon(catalog.weapons,milady.id,stats,{allowSote:true});
 assert.equal(result.weight,6.5);
 assert.equal(result.oneHanded,false);
 assert.equal(result.twoHanded,false);
 assert.equal(result.attackAtZero[0],116);
 assert.match(result.note,/NOT AR/);
 assert.equal(inspectBuildWeapon(catalog.weapons,spear.id,stats).weight,23);
 assert.equal(inspectBuildWeapon(catalog.weapons,null,stats),null);
});
test('missing reference fields stay null and cannot become fabricated equipment weight',()=>{
 const nameOnly=find("Bloodfiend's Fork");
 const requirementsOnly=find("Leda's Sword");
 const onlyName=inspectBuildWeapon(catalog.weapons,nameOnly.id,stats,{allowSote:true});
 assert.equal(onlyName.weight,null);
 assert.equal(onlyName.requirements,null);
 assert.equal(onlyName.oneHanded,null);
 assert.equal(onlyName.attackAtZero,null);
 const onlyRequirements=inspectBuildWeapon(catalog.weapons,requirementsOnly.id,stats,{allowSote:true});
 assert.equal(onlyRequirements.weight,null);
 assert.ok(Array.isArray(onlyRequirements.requirements));
 assert.equal(onlyRequirements.attackAtZero,null);
 for(const invalid of [[1,1,1],[40,20,25,16,17,16,16,100],[40,20,25,16,17,16,16,0]])
   assert.throws(()=>inspectBuildWeapon(catalog.weapons,find('Greatsword').id,invalid),/eight-attribute/);
});
test('weapon lookup filters content packs and search caps options without dropping selected id',()=>{
 const milady=find('Milady');
 assert.equal(buildWeaponOptions(catalog.weapons,'Milady',null,35,false).matching,0);
 assert.equal(buildWeaponOptions(catalog.weapons,'Milady',null,35,true).matching,1);
 const all=buildWeaponOptions(catalog.weapons,'',milady.id,35,true);
 assert.equal(all.options.some(w=>w.id===milady.id),true);
 assert.ok(all.options.length<=36);
 assert.equal(buildWeaponOptions(catalog.weapons,'',milady.id,35,false).options.some(w=>w.id===milady.id),false);
 assert.equal(buildWeaponOptions(catalog.weapons,'FoobarNotWeapon',null,35,true).matching,0);
 assert.throws(()=>buildWeaponOptions(catalog.weapons,'x'.repeat(101)),/Invalid weapon search/);
});
test('build and weapon catalogue retain separate pack gates and local draft safety',async()=>{
 const html=await readFile('public/build-planner/index.html','utf8');
 const app=await readFile('public/src/app.mjs','utf8');
 for(const id of ['build-tarnished-pack','build-sote','build-weapon-search','build-weapon',
  'build-weapon-summary','build-weapon-detail-link'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(app,/classOptions\(sel,extra\.checked\)/);
 assert.match(app,/validateCommunityCatalog\(await response\.json\(\)\)/);
 assert.match(app,/weaponId:selectedWeaponId/);
 assert.match(app,/ownsTarnishedPack:extra\.checked/);
 assert.match(app,/ownsSote:sote\.checked/);
 assert.match(app,/parsed\.version!==1&&parsed\.version!==2/);
 assert.match(app,/localStorage\.removeItem\(savedKey\)/);
 assert.match(app,/parseBuildWeaponId\(query\.get\('weapon'\)\)/);
 assert.doesNotMatch(app,/eval\(/);
});