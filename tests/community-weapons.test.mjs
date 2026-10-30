import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {validateCommunityCatalog,catalogCategories,searchCatalog,baseDamageParts,
 cautionForWeapon,weaponRequirementComparison,requirementsUrl,publishedUpgradeParts} from '../public/src/community-weapons.mjs';
const catalog=validateCommunityCatalog(JSON.parse(await readFile(resolve('public/data/community-weapon-catalog.json'),'utf8')));
const find=name=>catalog.weapons.find(w=>w.name===name);
test('source-attributed 409 references with 102 DLC weapons and shields, stripped of images and prose',()=>{
 assert.equal(catalog.weapons.length,409);
 assert.equal(catalog.meta.count,409);
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
 const spiked=find('Spiked Spear');
 assert.equal(spiked.critical,100);
 assert.deepEqual(spiked.requirements,[14,16,0,0,0]);
 assert.match(spiked.checkedWith,/wiki\.gg\/wiki\/Spiked_Spear/);
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
 for(let i=1;i<k.results.length;i++){
  const previous=k.results[i-1].weight,current=k.results[i].weight;
  // Missing DLC weight sorts after known values; null must never mean zero.
  assert.ok(previous===null||current===null||current>=previous);
  if(previous===null)assert.equal(current,null);
 }
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
 assert.throws(()=>validateCommunityCatalog({...catalog,meta:{...catalog.meta,count:410},weapons:[...catalog.weapons,catalog.weapons[0]]}),/Duplicate weapon ID/);
 assert.throws(()=>searchCatalog(catalog.weapons,{sort:'unknown'}),/Invalid catalog search/);
});

test('catalog coverage counts cannot silently drift from actual referenced facts',()=>{
 const corrupt=structuredClone(catalog);
 corrupt.meta.dlcBaseFactCount++;
 assert.throws(()=>validateCommunityCatalog(corrupt),/Catalog coverage metadata mismatch/);
 const corruptUpgrades=structuredClone(catalog);
 corruptUpgrades.meta.dlcUpgradeReferenceCount=0;
 assert.throws(()=>validateCommunityCatalog(corruptUpgrades),/Catalog coverage metadata mismatch/);
});
test('crossbows allow sourced standard two-hand Strength requirement reduction, not damage scaling',()=>{
 const bow=find('Repeating Crossbow'),spread=find('Spread Crossbow');
 const a=weaponRequirementComparison(bow,[9,15,10,10,10]);
 assert.equal(a.oneHanded.canWield,false);
 assert.equal(a.twoHanded.canWield,true);
 assert.equal(a.twoHanded.effectiveStrength,13);
 assert.equal(a.applyTwoHandBonus,true);
 const b=weaponRequirementComparison(spread,[8,17,10,10,10]);
 assert.equal(b.oneHanded.canWield,false);
 assert.equal(b.twoHanded.canWield,true);
 assert.equal(b.twoHanded.effectiveStrength,12);
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

test('DLC roster has 102 sourced unique weapons/shields and three explicit data tiers',()=>{
 const dlc=catalog.weapons.filter(w=>w.expansion==='Shadow of the Erdtree');
 assert.equal(dlc.length,102);
 assert.equal(new Set(dlc.map(w=>w.name)).size,102);
 assert.equal(catalog.meta.baseCommunityCount,307);
 assert.equal(catalog.meta.dlcCatalogCount,102);
 assert.equal(catalog.meta.dlcBaseFactCount,21);
 assert.equal(catalog.meta.dlcRequirementOnlyCount,52);
 assert.equal(catalog.meta.dlcNameOnlyCount,29);
 assert.equal(dlc.filter(w=>w.dataCoverage==='base-reference').length,21);
 assert.equal(dlc.filter(w=>w.dataCoverage==='requirements-only').length,52);
 assert.equal(dlc.filter(w=>w.dataCoverage==='name-category-only').length,29);
 assert.ok(dlc.every(w=>w.sourceUrl?.startsWith('https://')&&w.arParameters===undefined));
 for(const name of ["Rellana's Twin Blades","Rakshasa's Great Katana","Smithscript Dagger",
  "Smithscript Cirque","Spear of the Impaler","Staff of the Great Beyond","Verdigris Greatshield",
  "Sword of Night","Nanaya's Torch"]){
  assert.equal(dlc.filter(w=>w.name===name).length,1);
 }
});
test('nine wiki cross-checked DLC base facts, no invented upgrade or affinity values',()=>{
 const examples=[
  ['Milady',116,6.5,[12,17,0,0,0]],
  ['Backhand Blade',105,2,[10,13,0,0,0]],
  ['Great Katana',145,9,[14,18,0,0,0]],
  ["Dragon-Hunter's Great Katana",152,10.5,[15,20,0,0,0]],
  ['Dueling Shield',125,9,[15,14,0,0,0]],
  ["Rellana's Twin Blades",103,8,[13,16,16,16,0]],
  ["Rakshasa's Great Katana",155,9.5,[12,27,0,0,0]],
  ['Smithscript Dagger',67,1.5,[5,11,11,11,0]],
  ['Smithscript Cirque',100,2,[9,14,11,11,0]]
 ];
 for(const [name,physical,weight,req] of examples){
  const w=find(name);
  assert.equal(w.dataCoverage,'base-reference');
  assert.equal(w.attack[0],physical);
  assert.equal(w.weight,weight);
  assert.deepEqual(w.requirements,req);
  assert.match(w.checkedWith,/eldenring\.wiki\.gg/);
  assert.match(cautionForWeapon(w).join(' '),/AR is UNSUPPORTED/);
  assert.equal(Object.hasOwn(w,'arParameters'),false);
 }
 assert.deepEqual(find("Rellana's Twin Blades").attack,[103,66,66,0,0]);
});
test('partial rows keep missing data null; cannot compare unknown requirements',()=>{
 const nameOnly=find("Bloodfiend's Fork"), reqOnly=find("Leda's Sword");
 assert.equal(nameOnly.dataCoverage,'name-category-only');
 assert.equal(nameOnly.requirements,null);
 assert.equal(nameOnly.weight,null);
 assert.equal(nameOnly.attack,null);
 assert.equal(reqOnly.dataCoverage,'requirements-only');
 assert.ok(Array.isArray(reqOnly.requirements));
 assert.equal(reqOnly.weight,null);
 assert.throws(()=>weaponRequirementComparison(nameOnly,[20,20,20,20,20]),/not documented/);
 assert.equal(searchCatalog(catalog.weapons,{term:"Bloodfiend's Fork",wield:'one',stats:[99,99,99,99,99]}).total,0);
 assert.equal(searchCatalog(catalog.weapons,{term:"Bloodfiend's Fork",damage:'physical'}).total,0);
 assert.equal(searchCatalog(catalog.weapons,{term:"Bloodfiend's Fork",maxWeight:200}).total,0);
 assert.equal(searchCatalog(catalog.weapons,{term:'Milady',damage:'physical'}).total,1);
 assert.equal(searchCatalog(catalog.weapons,{term:'Milady',maxWeight:6}).total,0);
 assert.equal(searchCatalog(catalog.weapons,{term:'Milady',maxWeight:7}).total,1);
 assert.equal(searchCatalog(catalog.weapons,{term:'Milady',wield:'one',stats:[12,17,10,10,10]}).total,1);
 assert.equal(searchCatalog(catalog.weapons,{coverage:'dlc',limit:100}).total,102);
 assert.equal(searchCatalog(catalog.weapons,{coverage:'base'}).total,307);
 const invalid=structuredClone(catalog);
 invalid.weapons.find(w=>w.name==="Bloodfiend\u0027s Fork").requirements=[0,0,0,0,0];
 assert.throws(()=>validateCommunityCatalog(invalid),/must be null/);
 const invalidAttack=structuredClone(catalog);
 invalidAttack.weapons.find(w=>w.name==="Leda's Sword").attack=[0,0,0,0,0];
 assert.throws(()=>validateCommunityCatalog(invalidAttack),/Partial DLC rows/);
});
test('nine more individually sourced DLC +0 fact rows include split damage and requirements',()=>{
 const examples=[
  ['Spear of the Impaler',[85,0,102,0,0],9.5,[14,35,0,18,0]],
  ['Sword of Night',[110,33,0,0,0],6.5,[11,20,0,0,0]],
  ['Star-Lined Sword',[82,82,0,0,0],5,[10,23,21,0,0]],
  ['Obsidian Lamina',[120,0,0,0,0],6.5,[12,25,0,0,17]],
  ['Poleblade of the Bud',[131,0,0,0,0],10,[14,22,0,0,20]],
  ["Queelign's Greatsword",[117,0,35,0,0],7.5,[14,18,0,12,0]],
  ['Shadow Sunflower Blossom',[114,0,0,0,114],16,[24,8,0,25,0]],
  ['Pata',[104,0,0,0,0],4,[11,15,0,0,0]],
  ['Repeating Crossbow',[74,0,0,0,0],6,[13,15,0,0,0]]
 ];
 for(const [name,attack,weight,requirements] of examples){
  const w=find(name);assert.ok(w);
  assert.equal(w.dataCoverage,'base-reference');
  assert.deepEqual(w.attack,attack);
  assert.equal(w.weight,weight);
  assert.deepEqual(w.requirements,requirements);
  assert.equal(w.critical,100);
  assert.match(w.checkedWith,/^https:\/\/eldenring\.wiki\.gg\/wiki\//);
  assert.equal(Object.hasOwn(w,'arParameters'),false);
 }
});
test('three +0–+10 somber published BASE attack tables never imply exact AR parameters',()=>{
 const expected={
  'Sword of Night':[[110,33,0,0,0],[269,80,0,0,0]],
  "Rakshasa's Great Katana":[[155,0,0,0,0],[379,0,0,0,0]],
  'Repeating Crossbow':[[74,0,0,0,0],[259,0,0,0,0]],
  'Tooth Whip':[[109,0,0,0,0],[267,0,0,0,0]]
 };
 assert.equal(catalog.meta.dlcUpgradeReferenceCount,4);
 for(const [name,[first,last]] of Object.entries(expected)){
  const w=find(name);
  assert.equal(w.upgradeReference.path,'somber');
  assert.equal(w.upgradeReference.attackByLevel.length,11);
  assert.deepEqual(w.upgradeReference.attackByLevel[0],first);
  assert.deepEqual(w.upgradeReference.attackByLevel[10],last);
  assert.equal(w.upgradeReference.sourceUrl,w.checkedWith);
  assert.deepEqual(publishedUpgradeParts(w,10).map(x=>x.amount),last.filter(x=>x>0));
  assert.match(cautionForWeapon(w).join(' '),/not precise reinforcement multipliers/);
  assert.equal(Object.hasOwn(w,'arParameters'),false);
 }
 assert.equal(publishedUpgradeParts(find('Milady'),10),null);
 assert.throws(()=>publishedUpgradeParts(find('Sword of Night'),11),/Invalid published upgrade level/);
 const changed=structuredClone(catalog);
 changed.weapons.find(x=>x.name==='Sword of Night').upgradeReference.attackByLevel[0][0]=0;
 assert.throws(()=>validateCommunityCatalog(changed),/Upgrade \+0 must match/);
 const truncated=structuredClone(catalog);
 truncated.weapons.find(x=>x.name==='Sword of Night').upgradeReference.attackByLevel.pop();
 assert.throws(()=>validateCommunityCatalog(truncated),/Upgrade reference requires/);
});
test('three further source-linked DLC weapons are safely available for base attack and requirement lookup',()=>{
 const reference=[
  ['Spread Crossbow',[68,0,0,0,0],5,[11,17,0,0,0]],
  ['Spirit Sword',[92,59,0,0,0],2.5,[8,16,16,0,0]],
  ['Tooth Whip',[109,0,0,0,0],3,[10,24,0,0,0]]
 ];
 for(const [name,attack,weight,requirements] of reference){
  const row=find(name);assert.equal(row.dataCoverage,'base-reference');
  assert.deepEqual(row.attack,attack);assert.equal(row.weight,weight);
  assert.deepEqual(row.requirements,requirements);
  assert.equal(row.critical,100);
  assert.ok(row.checkedWith.startsWith('https://eldenring.wiki.gg/wiki/'));
  assert.equal(Object.hasOwn(row,'arParameters'),false);
 }
 assert.deepEqual(find('Tooth Whip').upgradeReference.attackByLevel.map(x=>x[0]),
  [109,124,140,156,172,188,203,219,235,251,267]);
 assert.equal(searchCatalog(catalog.weapons,{term:'Spirit Sword',damage:'magic'}).total,1);
});
test('conservative 2H calculations do not grant strength boost to new paired/special DLC types',()=>{
 const stats=[9,20,10,10,10];
 for(const name of ['Backhand Blade','Dane\'s Footwork','Chilling Perfume Bottle','Dueling Shield']){
  const w=find(name);assert.ok(w);
  const output=weaponRequirementComparison(w,stats);
  assert.equal(output.twoHanded.effectiveStrength,9);
 }
});
