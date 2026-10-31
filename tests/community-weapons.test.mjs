import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {validateCommunityCatalog,catalogCategories,searchCatalog,baseDamageParts,
 cautionForWeapon,weaponRequirementComparison,requirementsUrl,publishedUpgradeParts,hasDisputedWeight,hasDisputedAttack,reportedBaseDamageParts} from '../public/src/community-weapons.mjs';
const catalog=validateCommunityCatalog(JSON.parse(await readFile(resolve('public/data/community-weapon-catalog.json'),'utf8')));
const find=name=>catalog.weapons.find(w=>w.name===name);
test('source-attributed 416 armaments with 102 Shadow of the Erdtree and 8 Tarnished Pack and shields, stripped of images and prose',()=>{
 assert.equal(catalog.weapons.length,416);
 assert.equal(catalog.meta.count,416);
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
 assert.throws(()=>validateCommunityCatalog({...catalog,meta:{...catalog.meta,count:catalog.weapons.length+1},weapons:[...catalog.weapons,catalog.weapons[0]]}),/Duplicate weapon ID/);
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
 const marked=catalog.weapons.filter(x=>!x.expansion&&x.flags?.includes('unknown-scaling-letter'));
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
 assert.equal(catalog.meta.baseCommunityCount,306);
 assert.equal(catalog.meta.dlcCatalogCount,102);
 assert.equal(catalog.meta.dlcBaseFactCount,102);
 assert.equal(catalog.meta.dlcWeightOnlyCount,0);
 assert.equal(catalog.meta.dlcRequirementOnlyCount,0);
 assert.equal(catalog.meta.dlcNameOnlyCount,0);
 assert.equal(dlc.filter(w=>w.dataCoverage==='base-reference').length,102);
 assert.equal(dlc.filter(w=>w.dataCoverage==='requirements-only').length,0);
 assert.equal(dlc.filter(w=>w.dataCoverage==='requirements-weight-only').length,0);
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
test('all DLC rows have requirements and weight; only independently disputed +0 physical stays null',()=>{
 const dlc=catalog.weapons.filter(w=>w.expansion==='Shadow of the Erdtree');
 assert.equal(dlc.length,102);
 assert.ok(dlc.every(w=>w.requirements?.length===5));
 assert.ok(dlc.every(w=>Number.isFinite(w.weight)&&w.weight>=0));
 const partial=dlc.filter(w=>w.dataCoverage==='requirements-weight-only');
 assert.equal(partial.length,0);
 const stone=find('Stone-Sheathed Sword');
 assert.equal(stone.dataCoverage,'base-reference');
 assert.equal(stone.weight,3.5);
 assert.deepEqual(stone.requirements,[16,8,0,0,0]);
 assert.deepEqual(stone.attack,[89,0,0,0,0]);assert.equal(stone.critical,100);
 assert.deepEqual(stone.scaling,['C','D','-','-','-']);
 assert.equal(hasDisputedAttack(stone),true);
 assert.equal(hasDisputedWeight(stone),true);
 assert.equal(baseDamageParts(stone),null,'Reported 89 must not unlock trusted attack calculation');
 assert.deepEqual(reportedBaseDamageParts(stone),[{name:'Physical',amount:89}]);
 assert.equal(searchCatalog(catalog.weapons,{term:'Stone-Sheathed Sword',damage:'physical'}).total,0);
 assert.equal(searchCatalog(catalog.weapons,{term:'Stone-Sheathed Sword',maxWeight:3}).total,0);
 assert.equal(searchCatalog(catalog.weapons,{term:'Stone-Sheathed Sword',maxWeight:4}).total,0);
 assert.equal(searchCatalog(catalog.weapons,{term:'Stone-Sheathed Sword',wield:'one',stats:[99,99,99,99,99]}).total,1);
 assert.equal(searchCatalog(catalog.weapons,{coverage:'dlc',limit:100}).total,102);
 assert.equal(searchCatalog(catalog.weapons,{coverage:'base'}).total,306);
 const bad=structuredClone(catalog);
 bad.weapons.find(w=>w.name==='Stone-Sheathed Sword').attack=[119,0,0,0,0];
 assert.throws(()=>validateCommunityCatalog(bad),/Stone-Sheathed Sword/);
 const badSource=structuredClone(catalog);
 badSource.weapons.find(w=>w.name==='Stone-Sheathed Sword').sourceWeightDisagreement.secondSourceUrl='http://example.test';
 assert.throws(()=>validateCommunityCatalog(badSource),/Stone-Sheathed Sword/);
 const badTotals=structuredClone(catalog);
 badTotals.meta.dlcWeightOnlyCount=1;
 assert.throws(()=>validateCommunityCatalog(badTotals),/coverage metadata mismatch/);
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
  'Tooth Whip':[[109,0,0,0,0],[267,0,0,0,0]],
  'Euporia':[[84,0,0,0,100],[205,0,0,0,245]],
  "Bloodfiend's Sacred Spear":[[115,0,0,0,0],[281,0,0,0,0]]
 };
 assert.equal(catalog.meta.dlcUpgradeReferenceCount,6);
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
test('nine verified wiki.gg +0 armament facts and DLC 1.17 corrections stay exact',()=>{
 const rows=[["Ancient Meteoric Ore Greatsword",[154,46,0,0,0],22,100,[35,10,0,0,19],["D","E","-","-","D"],"Ancient_Meteoric_Ore_Greatsword"],["Greatsword of Solitude",[120,0,0,0,0],15.5,100,[27,13,0,0,0],["B","E","-","-","-"],"Greatsword_of_Solitude"],["Black Steel Greathammer",[140,0,0,0,42],12,100,[25,11,0,17,0],["C","E","-","D","-"],"Black_Steel_Greathammer"],["Bloodfiend's Arm",[147,0,0,0,0],20,100,[28,11,0,0,16],["D","E","-","-","D"],"Bloodfiend%27s_Arm"],["Euporia",[84,0,0,0,100],8.5,100,[16,16,0,24,0],["D","D","-","D","-"],"Euporia"],["Greatsword of Damnation",[123,0,0,0,79],8,100,[20,15,0,20,0],["D","E","-","D","-"],"Greatsword_of_Damnation"],["Black Steel Greatshield",[119,0,0,0,0],18,100,[35,0,0,0,0],["D","-","-","-","-"],"Black_Steel_Greatshield"],["Carian Sorcery Sword",[38,69,0,0,0],2.5,110,[10,19,16,0,0],["E","D","D","-","-"],"Carian_Sorcery_Sword"],["Ansbach's Longbow",[74,0,0,0,0],4.5,100,[9,43,0,0,0],["E","D","-","-","-"],"Ansbach%27s_Longbow"]];
 for(const [name,attack,weight,critical,req,scale,source] of rows){
  const weapon=find(name);
  assert.ok(weapon);
  assert.equal(weapon.dataCoverage,'base-reference');
  assert.deepEqual(weapon.attack,attack);
  assert.equal(weapon.weight,weight);
  assert.equal(weapon.critical,critical);
  assert.deepEqual(weapon.requirements,req);
  assert.deepEqual(weapon.scaling,scale);
  assert.equal(weapon.checkedWith,'https://eldenring.wiki.gg/wiki/'+source);
  assert.equal(Object.hasOwn(weapon,'arParameters'),false);
 }
 assert.equal(find('Ansbach\'s Longbow').requirements[1],43);
 assert.equal(find('Black Steel Greatshield').weight,18);
 assert.equal(find('Carian Sorcery Sword').critical,110);
 assert.equal(searchCatalog(catalog.weapons,{term:'Euporia',damage:'holy'}).total,1);
 assert.equal(searchCatalog(catalog.weapons,{term:'Black Steel Greatshield',maxWeight:17}).total,0);
});
test('Euporia published split somber base attack progression preserves holy component without AR extrapolation',()=>{
 const weapon=find('Euporia');
 assert.deepEqual(weapon.upgradeReference.attackByLevel.map(row=>row[0]),
   [84,96,108,120,132,144,157,169,181,193,205]);
 assert.deepEqual(weapon.upgradeReference.attackByLevel.map(row=>row[4]),
   [100,114,129,143,158,172,187,201,216,230,245]);
 assert.deepEqual(publishedUpgradeParts(weapon,10),
   [{name:'Physical',amount:205},{name:'Holy',amount:245}]);
 assert.equal(catalog.meta.dlcUpgradeReferenceCount,6);
 assert.match(cautionForWeapon(weapon).join(' '),/not precise reinforcement multipliers/);
});
test('sourced Ansbach Longbow exception permits only documented 2H Strength requirements',()=>{
 const bow=find("Ansbach's Longbow");
 const result=weaponRequirementComparison(bow,[8,43,10,10,10]);
 assert.equal(result.oneHanded.canWield,false);
 assert.equal(result.twoHanded.canWield,true);
 assert.equal(result.applyTwoHandBonus,true);
 assert.equal(result.twoHanded.effectiveStrength,12);
 assert.equal(searchCatalog(catalog.weapons,{term:"Ansbach's Longbow",wield:'one',stats:[8,43,10,10,10]}).total,0);
 assert.equal(searchCatalog(catalog.weapons,{term:"Ansbach's Longbow",wield:'standard-two',stats:[8,43,10,10,10]}).total,1);
});
test('conservative 2H calculations do not grant strength boost to new paired/special DLC types',()=>{
 const stats=[9,20,10,10,10];
 for(const name of ['Backhand Blade','Dane\'s Footwork','Chilling Perfume Bottle','Dueling Shield']){
  const w=find(name);assert.ok(w);
  const output=weaponRequirementComparison(w,stats);
  assert.equal(output.twoHanded.effectiveStrength,9);
 }
});

test('thirteen newly sourced DLC +0 facts and patch correction survive refactors',()=>{
 const facts=[
 ['Beast Claw',[98,0,0,0,0],3,100],
 ["Nanaya's Torch",[55,0,99,0,0],3.5,100],
 ['Verdigris Greatshield',[194,0,0,0,0],28,100],
 ['Claws of Night',[79,51,0,0,0],3,110],
 ['Chilling Perfume Bottle',[0,112,0,0,0],1,100],
 ['Deadly Poison Perfume Bottle',[98,0,0,0,0],1,100],
 ['Firespark Perfume Bottle',[0,0,118,0,0],1,100],
 ['Frenzyflame Perfume Bottle',[0,0,112,0,0],1,100],
 ['Lightning Perfume Bottle',[0,0,0,118,0],1,100],
 ['Barbed Staff-Spear',[86,0,0,0,86],7.5,100],
 ['Black Steel Twinblade',[112,0,0,0,33],8,100],
 ['Bonny Butchering Knife',[134,0,0,0,0],8.5,100],
 ["Fire Knight's Greatsword",[147,0,44,0,0],16,100]
 ];
 for(const [name,attack,weight,critical] of facts){
  const w=find(name);assert.ok(w,name);assert.equal(w.dataCoverage,'base-reference');
  assert.deepEqual(w.attack,attack,name);assert.equal(w.weight,weight,name);assert.equal(w.critical,critical,name);
  assert.match(w.checkedWith,/^https:\/\/eldenring\.wiki\.gg\/wiki\//);
  assert.equal(Object.hasOwn(w,'arParameters'),false);
 }
 const carian=find('Carian Sorcery Sword');
 assert.deepEqual(carian.attack,[38,69,0,0,0]);
 assert.equal(carian.patchCorrection.correctedValue,38);
 assert.match(carian.patchCorrection.sourceUrl,/almanauts.com/);
 const bad=structuredClone(catalog);
 bad.weapons.find(w=>w.name==='Carian Sorcery Sword').patchCorrection.correctedValue=69;
 assert.throws(()=>validateCommunityCatalog(bad),/Invalid patch correction/);
 for(const name of ['Barbed Staff-Spear','Claws of Night']){
  const w=find(name);assert.equal(w.upgradeReference,undefined);
  assert.match(cautionForWeapon(w).join(' '),/contradictions/);
 }
});
test('two-handed Strength exceptions are source-scoped, not blindly applied to all claws and torches',()=>{
 for(const [name,str] of [['Beast Claw',9],["Nanaya's Torch",8]]){
  const w=find(name);
  const stats=[str,...w.requirements.slice(1).map(n=>Math.max(n,1))];
  const result=weaponRequirementComparison(w,stats);
  assert.equal(result.oneHanded.canWield,false);
  assert.equal(result.twoHanded.canWield,true);
 }
});

test('another fourteen cited +0 DLC rows use current single-weapon sources, not conflicting CSV weights',()=>{
 const facts=[
 ["Leda's Sword",[101,0,0,0,65],7.5,[11,22,0,19,0]],
 ['Dryleaf Arts',[86,0,0,0,0],1,[8,8,0,0,0]],
 ['Sword of Darkness',[93,0,0,0,93],4,[14,11,0,24,0]],
 ['Sword of Light',[93,0,0,0,93],4,[14,11,0,24,0]],
 ["Thiollier's Hidden Needle",[70,45,0,0,0],0.5,[10,22,15,0,0]],
 ['Velvet Sword of St. Trina',[95,61,0,0,0],2.5,[10,12,14,0,0]],
 ['Spirit Glaive',[121,36,0,0,0],6.5,[14,17,16,0,0]],
 ['Staff of the Great Beyond',[27,0,0,0,0],2,[7,0,25,25,0]],
 ['Golem Fist',[110,0,0,0,0],6,[24,8,11,11,0]],
 ['Golden Lion Shield',[97,0,0,0,0],5.5,[11,0,0,0,0]],
 ["Moonrithyll's Knight Sword",[124,80,0,0,0],18,[20,14,18,0,0]],
 ['Sword Lance',[132,0,0,0,0],9,[21,11,0,0,0]],
 ['Greatsword of Radahn (Light)',[129,83,0,0,0],19,[32,24,15,0,0]],
 ['Greatsword of Radahn (Lord)',[129,83,0,0,0],19,[32,24,15,0,0]]
 ];
 for(const [name,attack,weight,req] of facts){
  const w=find(name);
  assert.equal(w.dataCoverage,'base-reference',name);
  assert.deepEqual(w.attack,attack,name);assert.equal(w.weight,weight,name);
  assert.deepEqual(w.requirements,req,name);assert.equal(w.critical,100);
  assert.match(w.checkedWith,/^https:\/\/eldenring\.wiki\.gg\/wiki\//);
  assert.equal(Object.hasOwn(w,'arParameters'),false);
 }
 for(const name of ['Staff of the Great Beyond','Golem Fist','Greatsword of Radahn (Light)'])
  assert.match(cautionForWeapon(find(name)).join(' '),/disagreed/);
 const stone=find('Stone-Sheathed Sword');
 assert.deepEqual(stone.attack,[89,0,0,0,0]);
 assert.equal(stone.dataCoverage,'base-reference');
 assert.match(cautionForWeapon(stone).join(' '),/Conflicting \+0/);
 assert.match(stone.conflictSourceUrl,/Stone-Sheathed_Sword/);
});
test('special paired and fist 2H requirements follow named published exceptions only',()=>{
 for(const name of ['Greatsword of Radahn (Light)','Greatsword of Radahn (Lord)',
  'Golem Fist','Golden Lion Shield',"Thiollier's Hidden Needle"]){
  const w=find(name),req=w.requirements;
  const stats=[Math.ceil(req[0]*2/3),...req.slice(1).map(n=>Math.max(1,n))];
  assert.equal(weaponRequirementComparison(w,stats).twoHanded.canWield,true,name);
  assert.equal(weaponRequirementComparison(w,stats).applyTwoHandBonus,true,name);
 }
});

test('seven further per-weapon wiki sourced DLC +0 records and Bloodfiend somber base data',()=>{
 const data=[["Dancing Blade of Ranah",[88,0,0,0,0],3.5,100,[9,20,0,0,0],["-","B","-","-","-"]],["Curseblade's Cirque",[108,0,0,0,0],4.5,100,[9,22,0,0,0],["E","C","-","-","-"]],["Death Knight's Longhaft Axe",[113,0,0,73,0],11.5,100,[23,10,0,18,0],["D","E","-","D","-"]],["Death Knight's Twin Axes",[101,0,0,65,0],5.5,100,[14,12,0,16,0],["D","D","-","D","-"]],["Bloodfiend's Sacred Spear",[115,0,0,0,0],8,100,[22,12,0,0,13],["E","E","-","-","C"]],["Horned Warrior's Greatsword",[130,0,0,0,0],13,100,[19,16,0,13,0],["D","D","-","D","-"]],["Flowerstone Gavel",[121,0,0,0,0],6,100,[14,8,0,0,15],["D","D","-","-","D"]]];
 for(const [name,attack,weight,critical,requirements,scale] of data){
  const w=find(name);assert.equal(w.dataCoverage,'base-reference',name);
  assert.deepEqual(w.attack,attack,name);assert.equal(w.weight,weight,name);
  assert.equal(w.critical,critical,name);assert.deepEqual(w.requirements,requirements,name);
  assert.deepEqual(w.scaling,scale,name);assert.match(w.checkedWith,/^https:\/\/eldenring\.wiki\.gg/);
 }
 const w=find("Bloodfiend's Sacred Spear");
 assert.deepEqual(w.upgradeReference.attackByLevel.map(x=>x[0]),
  [115,131,148,165,181,198,215,231,248,265,281]);
 assert.deepEqual(publishedUpgradeParts(w,10),[{name:'Physical',amount:281}]);
 assert.equal(catalog.meta.dlcUpgradeReferenceCount,6);
 const stone=find('Stone-Sheathed Sword');
 assert.equal(stone.weight,3.5);assert.deepEqual(stone.attack,[89,0,0,0,0]);
 assert.equal(stone.dataCoverage,'base-reference');
 assert.equal(stone.weightSourceUrl,'https://eldenring.wiki.gg/wiki/Straight_Swords');
});
test('named 2H paired/backhand exceptions have per-item requirement evidence',()=>{
 for(const name of ['Dancing Blade of Ranah',"Curseblade's Cirque","Death Knight's Twin Axes"]){
  const w=find(name),stats=[Math.ceil(w.requirements[0]*2/3),...w.requirements.slice(1).map(n=>Math.max(1,n))];
  const result=weaponRequirementComparison(w,stats);
  assert.equal(result.oneHanded.canWield,false);
  assert.equal(result.twoHanded.canWield,true);
 }
});

test('101 source-reported DLC base +0 records are separated by per-item vs category-table confidence',()=>{
 const dlc=catalog.weapons.filter(w=>w.expansion==='Shadow of the Erdtree');
 const full=dlc.filter(w=>w.dataCoverage==='base-reference');
 assert.equal(full.length,102);
 const category=full.filter(w=>w.flags?.includes('wiki-category-table-base-observation'));
 assert.equal(category.length,33);
 assert.equal(full.filter(w=>!w.flags?.includes('wiki-category-table-base-observation')).length,69);
 assert.ok(category.every(w=>w.checkedWith?.startsWith('https://eldenring.wiki.gg/wiki/')));
 assert.ok(category.every(w=>Array.isArray(w.attack)&&w.attack.some(n=>n>0)));
 assert.ok(category.every(w=>cautionForWeapon(w).join(' ').includes('category comparison table')));
 const madding=find('Madding Hand');assert.deepEqual(madding.requirements,[8,8,13,13,0]);
 assert.deepEqual(madding.attack,[53,0,63,0,0]);
 const main=find('Main-gauche');assert.equal(main.weight,2);assert.equal(main.critical,110);
 assert.deepEqual(main.attack,[79,0,0,0,0]);
 const exceptional=["Falx","Swift Spear","Messmer Soldier's Spear"];
 for(const name of exceptional){
  const w=find(name);
  assert.equal(w.dataCoverage,'base-reference');
  assert.ok(w.scaling.includes('?'));
  assert.match(cautionForWeapon(w).join(' '),/UNKNOWN|unknown/i);
 }
 const stone=find('Stone-Sheathed Sword');
 assert.deepEqual(stone.attack,[89,0,0,0,0]);
 assert.ok(stone.flags.includes('conflicting-weapon-plus-zero-observation'));
 assert.equal(catalog.meta.dlcUpgradeReferenceCount,6);
 const bad=structuredClone(catalog);
 bad.weapons.find(w=>w.name==='Falx').scaling=['D','D','-','-','-'];
 assert.doesNotThrow(()=>validateCommunityCatalog(bad)); // grades pass schema; conflict status remains a provenance requirement, not a certified numeric validation
});

test('seven independently observed 1.17 conflicts stay review-flagged without overwriting community stats',()=>{
 const attack=["Fire Knight's Shortsword","Greatsword of Radahn (Light)","Greatsword of Radahn (Lord)","Queelign's Greatsword","Smithscript Axe","Smithscript Dagger"];
 const req='Madding Hand';
 assert.equal(catalog.meta.v117SourceConflictCount,7);
 for(const name of attack){
  const w=find(name);
  assert.ok(w.flags.includes('v117-community-attack-conflict'),name);
  assert.match(cautionForWeapon(w).join(' '),/SOURCE CONFLICT/);
 }
 const m=find(req);
 assert.deepEqual(m.requirements,[8,8,13,13,0]); // source 1.17 reports 20 FAI; do not overwrite
 assert.ok(m.flags.includes('v117-community-requirement-conflict'));
 assert.match(cautionForWeapon(m).join(' '),/SOURCE CONFLICT/);
 const broken=structuredClone(catalog);broken.meta.v117SourceConflictCount=0;
 assert.throws(()=>validateCommunityCatalog(broken),/metadata mismatch/);
});

test('canonical released names resolve from catalog with stable IDs and network-test-only Winged Spear is absent',()=>{
 const names=["Prince of Death's Staff",'Sword of St. Trina','Velvet Sword of St. Trina'];
 for(const n of names)assert.ok(find(n),n);
 assert.equal(find('Winged Spear'),undefined);
 assert.equal(find('Spear').attack[0],114);
 assert.equal(find('Prince Of Death\'s Star'),undefined);
 assert.equal(find('Sword Of St Trina'),undefined);
 assert.ok(catalog.meta.corrections.includes('Closed Network Test-only Winged Spear'));
});
