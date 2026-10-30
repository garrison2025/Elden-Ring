import test from 'node:test';
import assert from 'node:assert/strict';
import {findLocalWeaponFamily,describeLocalWeapon,compareLocalGrips,compareLocalFamilyAffinities} from '../public/src/ar-workbench-core.mjs';

const baseline={str:1,dex:1,int:1,fai:1,arc:1};
function source(){
 const graph=[{maxVal:0,maxGrowVal:0,adjPt:1},{maxVal:148,maxGrowVal:1.48,adjPt:1}];
 const upgrades=(length)=>Array.from({length},(_,n)=>({attack:{0:1+n*.01,1:1+n*.01},
  attributeScaling:baseline}));
 const base={
  weaponName:'Invented Sword',weaponType:13,paired:false,
  attack:[[0,100],[1,40]],attributeScaling:[['str',0.5],['int',0.35]],
  requirements:{str:10,dex:10,int:12,fai:0,arc:0},
  attackElementCorrectId:1,reinforceTypeId:1,calcCorrectGraphIds:{0:1,1:1}
 };
 return {
  weapons:Array.from({length:13},(_,affinityId)=>({
   ...base,affinityId,name:'Fictional affinity '+affinityId
  })),
  calcCorrectGraphs:{1:graph},
  attackElementCorrects:{1:{0:{str:true},1:{int:true}}},
  reinforceTypes:{1:upgrades(26),2:upgrades(11)}
 };
}
test('all thirteen fictional source-defined affinity variants resolve exactly and calculate both elements',()=>{
 const root=source();
 const family=findLocalWeaponFamily(root,'Invented Sword');
 assert.equal(family.matches,13);
 assert.equal(family.defaultName,'Fictional affinity 0');
 assert.deepEqual(family.names,Array.from({length:13},(_,id)=>'Fictional affinity '+id));
 for(const name of family.names){
  const {profile,description}=describeLocalWeapon(root,name,'TEST-v1','synthetic local fixture');
  assert.deepEqual(description.damageTypes,['physical','magic']);
  assert.equal(description.upgradeLevels.length,26);
  const ar=compareLocalGrips(profile,{str:35,dex:20,int:30,fai:10,arc:10},25);
  assert.equal(Number.isInteger(ar.oneHand.total),true);
  assert.match(ar.oneHand.status,/UNVERIFIED/);
 }
});
test('separate special-weapon scope limitations remain disclosed (not certified by conversion)',()=>{
 const root=source();
 root.weapons=[{
  ...root.weapons[0],name:'Fictional paired catalyst',paired:true,
  sorceryTool:true,incantationTool:true,reinforceTypeId:2,
  attack:[[0,100],[1,40],[5,55]]
 }];
 const {profile,description}=describeLocalWeapon(root,'Fictional paired catalyst','TEST-v1','fictional parameters');
 assert.equal(description.upgradeLevels.length,11);
 assert.deepEqual(description.scopeFlags,[
  'paired-grip-moveset-not-modeled','spell-catalyst-scaling-not-modeled',
  'status-buildup-not-modeled','somber-weapon-skill-damage-not-modeled'
 ]);
 const ar=compareLocalGrips(profile,{str:35,dex:20,int:30,fai:10,arc:10},10);
 assert.equal(ar.twoHand.total,ar.oneHand.total);
 assert.throws(()=>compareLocalGrips(profile,{str:35,dex:20,int:30,fai:10,arc:10},25),/no supplied data/);
 const bow={...root.weapons[0],name:'Fictional bow',weaponType:50,paired:false};
 const flag=describeLocalWeapon({...root,weapons:[bow]},'Fictional bow','TEST-v1','fictional parameters').description.scopeFlags;
 assert.ok(flag.includes('ranged-ammunition-and-motion-not-modeled'));
});

test('batch affinity matrix uses exact family and never invents absent +25 somber rows',()=>{
 const root=source();root.weapons[0].reinforceTypeId=2;
 const attrs={str:35,dex:20,int:30,fai:10,arc:10};
 const out=compareLocalFamilyAffinities(root,'Invented Sword','TEST-v1','fictional parameters',
  attrs,{upgrade:25,twoHanded:true});
 assert.equal(out.sourceVariantCount,13);assert.equal(out.available,12);
 assert.equal(out.unavailable,1);assert.equal(out.gameClientVerified,false);
 assert.equal(out.rows[0].status,'upgrade-unavailable');
 assert.match(out.rows[0].reason,/No source upgrade/);
 assert.equal(out.rows[0].total,null);assert.equal(out.rows[0].components,null);
 const computed=out.rows[1];
 const direct=compareLocalGrips(describeLocalWeapon(root,computed.name,'TEST-v1',
  'fictional parameters').profile,attrs,25).twoHand;
 assert.equal(computed.total,direct.total);
 assert.equal(computed.components.physical,
  direct.perElement.find(x=>x.element==='physical').displayed);
 assert.equal(computed.components.magic,
  direct.perElement.find(x=>x.element==='magic').displayed);
 assert.equal(out.rows[1].effectiveStrength,52);
 assert.match(out.note,/UNCERTIFIED/);
});
test('family AR batch compares +0 somber and normal, preserves unmet requirements',()=>{
 const root=source();root.weapons[0].reinforceTypeId=2;
 const input={str:1,dex:1,int:1,fai:1,arc:1};
 const out=compareLocalFamilyAffinities(root,'Fictional affinity 0','TEST-v1',
  'fictional parameters',input,{upgrade:0,twoHanded:false});
 assert.equal(out.available,13);
 assert.deepEqual(out.rows[0].missingRequirements,['str','dex','int']);
 assert.equal(out.rows[0].status,'calculated-unverified');
 assert.deepEqual(out.stats,input);
 assert.throws(()=>compareLocalFamilyAffinities(root,'nonexistent','TEST-v1',
  'fictional parameters',input),/No exact/);
 for(const options of [{upgrade:-1},{upgrade:26},{twoHanded:'true'}])
  assert.throws(()=>compareLocalFamilyAffinities(root,'Invented Sword','TEST-v1',
   'fictional parameters',input,options),RangeError);
 assert.throws(()=>compareLocalFamilyAffinities(root,'Invented Sword','TEST-v1',
  'fictional parameters',{...input,arc:100}),/five player attributes/);
});
