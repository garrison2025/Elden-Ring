import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {validateCommunityCatalog,catalogCategories,searchCatalog,baseDamageParts,
 cautionForWeapon,weaponRequirementComparison,requirementsUrl} from '../public/src/community-weapons.mjs';
const catalog=validateCommunityCatalog(JSON.parse(await readFile(resolve('public/data/community-weapon-catalog.json'),'utf8')));
const find=name=>catalog.weapons.find(w=>w.name===name);
test('source-attributed 364 real weapon references with 57 DLC requirements-only, stripped of images and prose',()=>{
 assert.equal(catalog.weapons.length,364);
 assert.equal(catalog.meta.count,364);
 assert.match(catalog.meta.version,/not established/);
 assert.match(catalog.meta.sourceRevision,/^[a-f0-9]{40}$/);
 for(const row of catalog.weapons){
  for(const k of ['description','image','defence','lore'])assert.ok(!Object.hasOwn(row,k));
 }
 assert.ok(catalogCategories(catalog.weapons).length>20);
});
test('real weapon facts and independently checked corrections are present',()=>{
 const sword=find('Greatsword');
 assert.equal(sword.attack[0],164);
 assert.deepEqual(sword.requirements,[31,12,0,0,0]);
 assert.equal(sword.weight,23);
 assert.equal(find('Hand Axe').attack[0],113);
 assert.deepEqual(find('Hand Axe').requirements,[9,8,0,0,0]);
 const royal=find('Royal Greatsword');
 assert.deepEqual(royal.attack,[112,134,0,0,0]);
 assert.equal(royal.critical,100);
 assert.match(royal.checkedWith,/wiki.gg/);
 assert.equal(find('Serpentbone Blade').attack[0],120);
 assert.equal(find('Star Fist').critical,100);
 assert.deepEqual(baseDamageParts(royal),[
  {name:'Physical',amount:112},{name:'Magic',amount:134}]);
});
test('duplicate names remain distinct and are flagged rather than silently merged',()=>{
 const rows=catalog.weapons.filter(x=>x.name==='Erdtree Seal');
 assert.equal(rows.length,2);
 assert.notEqual(rows[0].id,rows[1].id);
 rows.forEach(w=>assert.match(cautionForWeapon(w).join(' '),/duplicate/));
});
test('search, category filtering, numeric sort and pagination work',()=>{
 const q=searchCatalog(catalog.weapons,{term:'GREATsword'});
 assert.ok(q.total>=8);
 assert.ok(q.results.some(x=>x.name==='Greatsword'));
 const k=searchCatalog(catalog.weapons,{category:'Katana',sort:'weight'});
 assert.ok(k.results.every(x=>x.category==='Katana'));
 for(let i=1;i<k.results.length;i++)assert.ok(k.results[i].weight>=k.results[i-1].weight);
 const a=searchCatalog(catalog.weapons,{limit:40,offset:0});
 const b=searchCatalog(catalog.weapons,{limit:40,offset:40});
 assert.equal(a.results.length,40);assert.equal(b.results.length,40);
 assert.equal(new Set([...a.results,...b.results].map(x=>x.id)).size,80);
});
test('chosen real weapon requirements carry into existing calculator',()=>{
 const sword=find('Greatsword'),stats=[21,12,10,10,10];
 const result=weaponRequirementComparison(sword,stats);
 assert.equal(result.oneHanded.canWield,false);
 assert.equal(result.oneHanded.missing[0],10);
 assert.equal(result.twoHanded.canWield,true);
 assert.equal(result.twoHanded.effectiveStrength,31);
 const url=requirementsUrl(sword,stats);
 assert.match(url,/weapon-requirements/);
 assert.ok(url.includes('req=31%2C12%2C0%2C0%2C0'));
 assert.ok(url.includes('player=21%2C12%2C10%2C10%2C10'));
});
test('reject invalid values, duplicate IDs, corrupted stats and unsupported sort',()=>{
 const bad=structuredClone(catalog);
 bad.weapons[0].attack[0]='invalid';
 assert.throws(()=>validateCommunityCatalog(bad),/Invalid base damage/);
 assert.throws(()=>validateCommunityCatalog({...catalog,meta:{...catalog.meta,count:10}}),/record count/);
 assert.throws(()=>validateCommunityCatalog({...catalog,meta:{...catalog.meta,count:365},weapons:[...catalog.weapons,catalog.weapons[0]]}),/Duplicate weapon ID/);
 assert.throws(()=>searchCatalog(catalog.weapons,{sort:'unknown'}),/Invalid catalog search/);
});

test('12 upstream unknown scaling grades are explicitly flagged and never guessed',()=>{
 const marked=catalog.weapons.filter(x=>x.flags?.includes('unknown-scaling-letter'));
 assert.equal(marked.length,12);
 assert.ok(marked.every(x=>x.scaling.includes('?')));
 assert.match(cautionForWeapon(marked[0]).join(' '),/unknown/);
});

test('character requirement filter returns only current wieldable weapons',()=>{
 const stats=[21,12,10,10,10];
 const one=searchCatalog(catalog.weapons,{wield:'one',stats,limit:100});
 const two=searchCatalog(catalog.weapons,{wield:'standard-two',stats,limit:100});
 assert.ok(two.total>=one.total);
 assert.ok(one.results.every(w=>weaponRequirementComparison(w,stats).oneHanded.canWield));
 assert.ok(two.results.every(w=>weaponRequirementComparison(w,stats).twoHanded.canWield));
 assert.ok(!one.results.some(w=>w.name==='Greatsword'));
 assert.ok(two.results.some(w=>w.name==='Greatsword')||
  searchCatalog(catalog.weapons,{term:'Greatsword',wield:'standard-two',stats}).results.some(w=>w.name==='Greatsword'));
});
test('do not apply a guaranteed ordinary melee two-hand bonus to bows, fists or staves',()=>{
 const stats=[12,20,10,10,10];
 const bow=catalog.weapons.find(w=>w.category==='Bow'&&w.requirements[0]>12);
 if(bow){
  const {oneHanded,twoHanded}=weaponRequirementComparison(bow,stats);
  assert.equal(twoHanded.effectiveStrength,12);
  assert.equal(twoHanded.canWield,oneHanded.canWield);
 }
 const fist=catalog.weapons.find(w=>w.category==='Fist');
 assert.ok(fist);
 assert.equal(weaponRequirementComparison(fist,stats).twoHanded.effectiveStrength,12);
});
test('filters combine class, damage and weight without treating raw base as AR',()=>{
 const q=searchCatalog(catalog.weapons,{category:'Katana',damage:'physical',maxWeight:7,sort:'weight'});
 assert.ok(q.results.length>0);
 assert.ok(q.results.every(w=>w.category==='Katana'&&w.weight<=7&&w.attack[0]>0));
 assert.throws(()=>searchCatalog(catalog.weapons,{wield:'one'}),/Character/);
 assert.throws(()=>searchCatalog(catalog.weapons,{maxWeight:-1}),/Invalid catalog search/);
 assert.throws(()=>searchCatalog(catalog.weapons,{damage:'bleed'}),/Invalid catalog search/);
});

test('57 real DLC records have sourced requirements and do not invent base damage or scaling',()=>{
 const dlc=catalog.weapons.filter(w=>w.dataCoverage==='requirements-only');
 assert.equal(dlc.length,57);
 assert.equal(catalog.meta.baseCommunityCount,307);
 assert.equal(catalog.meta.dlcRequirementOnlyCount,57);
 assert.ok(dlc.every(w=>w.attack===null&&w.weight===null&&w.critical===null&&w.scaling===null));
 assert.ok(dlc.every(w=>w.sourceUrl?.startsWith('https://')&&w.requirements.length===5));
 const milady=find('Milady');
 assert.equal(milady.category,'Light Greatsword');
 assert.deepEqual(milady.requirements,[12,17,0,0,0]);
 assert.equal(baseDamageParts(milady).length,0);
 assert.match(cautionForWeapon(milady).join(' '),/UNVERIFIED/);
 assert.equal(find('Great Katana').category,'Great Katana');
 assert.deepEqual(find('Rellana\'s Twin Blades')?.requirements??null,null);
});
test('partial DLC numeric fields are not silently coerced to zero or used for misleading sorting and filters',()=>{
 const dlc=catalog.weapons.filter(w=>w.dataCoverage==='requirements-only');
 const source=searchCatalog(catalog.weapons,{coverage:'dlc',limit:100});
 assert.equal(source.total,57);
 assert.equal(source.results.length,57);
 assert.equal(searchCatalog(catalog.weapons,{coverage:'base'}).total,307);
 assert.equal(searchCatalog(catalog.weapons,{term:'Milady',damage:'physical'}).total,0);
 assert.equal(searchCatalog(catalog.weapons,{term:'Milady',maxWeight:200}).total,0);
 const low=searchCatalog(catalog.weapons,{term:'Milady',wield:'one',stats:[12,17,10,10,10]});
 assert.equal(low.total,1);
 const rejected=structuredClone(catalog);
 const index=rejected.weapons.findIndex(w=>w.name==='Milady');
 rejected.weapons[index].attack=[0,0,0,0,0];
 assert.throws(()=>validateCommunityCatalog(rejected),/Partial DLC rows/);
 assert.equal(searchCatalog(catalog.weapons,{sort:'base',limit:100}).results.some(w=>w.dataCoverage==='requirements-only'),false);
});
test('conservative 2H calculations do not grant strength boost to new paired/special DLC types',()=>{
 const stats=[9,20,10,10,10];
 for(const name of ['Backhand Blade','Dane\'s Footwork','Chilling Perfume Bottle','Dueling Shield']){
  const w=find(name);assert.ok(w);
  const output=weaponRequirementComparison(w,stats);
  assert.equal(output.twoHanded.effectiveStrength,9);
 }
});
