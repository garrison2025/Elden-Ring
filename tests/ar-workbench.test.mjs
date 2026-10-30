import test from 'node:test';
import assert from 'node:assert/strict';
import {searchLocalWeapons,findLocalWeaponFamily,describeLocalWeapon,compareLocalGrips} from '../public/src/ar-workbench-core.mjs';
const data=()=>{
 const graph=[{maxVal:0,maxGrowVal:0,adjPt:1},{maxVal:148,maxGrowVal:1.48,adjPt:1}];
 const stats={str:1,dex:1,int:1,fai:1,arc:1};
 return {
  weapons:[
   {name:'Fictional Cold Blade',weaponName:'Blade',weaponType:13,paired:false,attack:[[0,100]],
    attributeScaling:[['str',0.8],['dex',0.2]],requirements:{str:10,dex:10},
    attackElementCorrectId:4,reinforceTypeId:2,calcCorrectGraphIds:{0:1}},
   {name:'Fictional Heavy Blade',weaponName:'Blade',weaponType:13,paired:false,attack:[[0,100]],
    attributeScaling:[['str',0.8],['dex',0.2]],requirements:{str:10,dex:10},
    attackElementCorrectId:4,reinforceTypeId:2,calcCorrectGraphIds:{0:1}},
   {name:'Fictional Paired Blades',weaponName:'Blades',weaponType:35,paired:true,attack:[[0,100]],
    attributeScaling:[['str',0.8],['dex',0.2]],requirements:{str:10,dex:10},
    attackElementCorrectId:4,reinforceTypeId:2,calcCorrectGraphIds:{0:1}}
  ],calcCorrectGraphs:{1:graph},
  attackElementCorrects:{4:{0:{str:true,dex:true}}},
  reinforceTypes:{2:[{attack:{0:1},attributeScaling:stats},
   {attack:{0:1.1},attributeScaling:{...stats,str:1.05,dex:1.05}}]}
 };
};
const opts=name=>[data(),name,'synthetic-v1','independently made fictional test'];
const build=name=>describeLocalWeapon(...opts(name));
const stats={str:40,dex:20,int:10,fai:10,arc:10};
test('local research name filter is case insensitive, bounded and does not interpolate or inject HTML',()=>{
 const all=['Fictional Cold Blade','Fictional Heavy Blade','Fictional Paired Blades'];
 assert.deepEqual(searchLocalWeapons(all,'BLade',2),{matches:3,names:all.slice(0,2)});
 assert.deepEqual(searchLocalWeapons(all,'none'),{matches:0,names:[]});
 assert.throws(()=>searchLocalWeapons(all,'x'.repeat(101)),/too long/);
 assert.throws(()=>searchLocalWeapons(all,'',1000),/Invalid weapon/);
});
test('local selected profile compares 1H and 2H for two upgrade levels without bundling game data',()=>{
 const {profile,description}=build('Fictional Heavy Blade');
 assert.equal(description.gripMode,'standard');
 assert.deepEqual(description.upgradeLevels,[0,1]);
 assert.deepEqual(description.damageTypes,['physical']);
 const out=compareLocalGrips(profile,stats,0);
 assert.equal(out.oneHand.total,136);
 assert.equal(out.twoHand.total,152);
 assert.equal(out.difference,16);
 assert.match(out.note,/UNCERTIFIED/);
 const enhanced=compareLocalGrips(profile,stats,1);
 assert.equal(enhanced.oneHand.total,151);
});
test('paired grip does not gain 1.5x effective STR',()=>{
 const {profile}=build('Fictional Paired Blades');
 const r=compareLocalGrips(profile,stats,0);
 assert.equal(r.oneHand.total,r.twoHand.total);
 assert.equal(r.oneHand.effectiveStats.str,40);
 assert.equal(r.twoHand.effectiveStats.str,40);
});
test('missing or out-of-range attributes and reinforcement levels fail closed',()=>{
 const {profile}=build('Fictional Cold Blade');
 assert.throws(()=>compareLocalGrips(profile,{...stats,str:100},0),/Invalid str/);
 assert.throws(()=>compareLocalGrips(profile,stats,2),/no supplied data/);
 assert.throws(()=>describeLocalWeapon(data(),'Unknown','v1','manual'),/matches: 0/);
});

test('malicious prototype-like field names in imported pair lists are rejected',()=>{
 const root=data();
 root.weapons[0].attack.push(['__proto__',123]);
 assert.throws(()=>describeLocalWeapon(root,'Fictional Cold Blade','v1','local'),/Unexpected weapon attack key/);
 const corrupted=data();
 corrupted.weapons[0].attributeScaling.push(['constructor',1]);
 assert.throws(()=>describeLocalWeapon(corrupted,'Fictional Cold Blade','v1','local'),/Unexpected weapon attribute scaling key/);
});

test('pair comparison uses same player stats, independent upgrade levels and split components',async()=>{
 const {compareWeaponPair}=await import('../public/src/ar-weapon-compare.mjs');
 const left=build('Fictional Cold Blade').profile,right=build('Fictional Heavy Blade').profile;
 const out=compareWeaponPair(left,right,stats,{leftUpgrade:0,rightUpgrade:1,twoHanded:true});
 assert.equal(out.left.effectiveStats.str,60);
 assert.equal(out.right.effectiveStats.str,60);
 assert.equal(out.delta,out.right.total-out.left.total);
 assert.equal(out.components[0].type,'physical');
 assert.match(out.note,/not necessarily higher actual damage/);
});
test('pair comparison refuses missing reinforcement and different declared game versions',async()=>{
 const {compareWeaponPair}=await import('../public/src/ar-weapon-compare.mjs');
 const left=build('Fictional Cold Blade').profile,right=build('Fictional Heavy Blade').profile;
 assert.throws(()=>compareWeaponPair(left,right,stats,{leftUpgrade:0,rightUpgrade:20}),/no supplied data/);
 right.provenance.gameVersion='different';
 assert.throws(()=>compareWeaponPair(left,right,stats,{leftUpgrade:0,rightUpgrade:0}),/different declared game versions/);
});

test('exact weapon family resolves original and all source affinity variants without substring guessing',()=>{
 const source=data();
 source.weapons.push({...source.weapons[0],
  name:'Fictional Magic Blade',weaponName:'Blade',affinityId:8});
 source.weapons[0].affinityId=9;source.weapons[1].affinityId=1;
 assert.deepEqual(findLocalWeaponFamily(source,'Blade'),{
  found:true,family:'Blade',matches:3,
  names:['Fictional Heavy Blade','Fictional Magic Blade','Fictional Cold Blade'],
  defaultName:'Fictional Heavy Blade'
 });
 const exact=findLocalWeaponFamily(source,'Fictional Magic Blade');
 assert.equal(exact.defaultName,'Fictional Magic Blade');
 assert.equal(exact.matches,3);
 const paired=findLocalWeaponFamily(source,'Blades');
 assert.equal(paired.matches,1);
 assert.equal(paired.defaultName,'Fictional Paired Blades');
 const miss=findLocalWeaponFamily(source,'Bla');
 assert.equal(miss.found,false);assert.equal(miss.matches,0);
 assert.deepEqual(miss.names,[]);
 assert.throws(()=>findLocalWeaponFamily(source,' '.repeat(2)),/Invalid local/);
});
test('real source family lookup handles punctuation and rejects variant flooding',()=>{
 const root={weapons:[
  {name:"Fire Knight's Shortsword",weaponName:"Fire Knight's Shortsword",affinityId:0},
  {name:"Fire Knight's Cold Shortsword",weaponName:"Fire Knight's Shortsword",affinityId:9},
  {name:"Fire Knight's Heavy Shortsword",weaponName:"Fire Knight's Shortsword",affinityId:1}
 ]};
 const a=findLocalWeaponFamily(root,'Fire Knight’s Shortsword');
 assert.deepEqual(a.names,["Fire Knight's Shortsword","Fire Knight's Heavy Shortsword","Fire Knight's Cold Shortsword"]);
 assert.equal(a.defaultName,"Fire Knight's Shortsword");
 const b=findLocalWeaponFamily(root,"Fire Knight's Cold Shortsword");
 assert.equal(b.defaultName,"Fire Knight's Cold Shortsword");
});
