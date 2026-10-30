import test from 'node:test';
import assert from 'node:assert/strict';
import {convertCompactRegulation,listCompactWeaponNames} from '../public/src/regulation-import.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';
const fixture=()=>{
 const graph=[{maxVal:0,maxGrowVal:0,adjPt:1},{maxVal:148,maxGrowVal:1.48,adjPt:1}];
 const attr={str:1,dex:1,int:1,fai:1,arc:1};
 return {weapons:[
   {name:'Invented Alpha Sword',weaponName:'Fictional',weaponType:13,paired:false,
    attack:[[0,100]],attributeScaling:[['str',0.8],['dex',0.2]],
    requirements:{str:10,dex:10},attackElementCorrectId:5,reinforceTypeId:2,calcCorrectGraphIds:{0:1}},
   {name:'Invented Paired Blade',weaponType:35,paired:true,
    attack:[[0,100]],attributeScaling:[['str',0.8],['dex',0.2]],
    requirements:{str:10,dex:10},attackElementCorrectId:5,reinforceTypeId:2,calcCorrectGraphIds:{0:1}}
  ],
  calcCorrectGraphs:{1:graph},
  attackElementCorrects:{5:{0:{str:true,dex:true}}},
  reinforceTypes:{2:[
   {attack:{0:1},attributeScaling:attr},
   {attack:{0:1.1},attributeScaling:{...attr,str:1.05,dex:1.05}}
  ]}};
};
const opts=name=>({weaponName:name,gameVersion:'synthetic-v1',sourceReference:'local artificial test'});
const stats={str:40,dex:20,int:10,fai:10,arc:10};
test('local compact-regulation input produces unverified AR profile matching synthetic vectors',()=>{
 const profile=convertCompactRegulation(fixture(),opts('Invented Alpha Sword'));
 assert.equal(profile.gripMode,'standard');
 assert.equal(profile.provenance.status,'manual-unverified');
 assert.equal(profile.provenance.gameVersion,'synthetic-v1');
 assert.equal(profile.affinities['SOURCE AFFINITY'].correctionCurves.physical[40],0.4);
 assert.equal(calculateAr(profile,stats,{affinity:'SOURCE AFFINITY'}).total,136);
 assert.equal(calculateAr(profile,stats,{affinity:'SOURCE AFFINITY',upgrade:1}).total,151);
 assert.equal(calculateAr(profile,stats,{affinity:'SOURCE AFFINITY',twoHanded:true}).total,152);
});
test('paired weapon does not apply two handed STR to AR or requirements',()=>{
 const profile=convertCompactRegulation(fixture(),opts('Invented Paired Blade'));
 assert.equal(profile.gripMode,'paired');
 const result=calculateAr(profile,stats,{affinity:'SOURCE AFFINITY',twoHanded:true});
 assert.equal(result.effectiveStats.str,40);
 assert.equal(result.total,136);
 assert.equal(result.strengthBonusApplied,false);
});
test('importer rejects unknown, duplicate or incomplete game data, not guessing missing values',()=>{
 const base=fixture();
 assert.deepEqual(listCompactWeaponNames(base),['Invented Alpha Sword','Invented Paired Blade']);
 assert.throws(()=>convertCompactRegulation(base,opts('Not found')),/matches: 0/);
 const duplicate=structuredClone(base);duplicate.weapons.push(structuredClone(base.weapons[0]));
 assert.throws(()=>convertCompactRegulation(duplicate,opts('Invented Alpha Sword')),/matches: 2/);
 const bad=fixture();bad.calcCorrectGraphs={};
 assert.throws(()=>convertCompactRegulation(bad,opts('Invented Alpha Sword')),/Missing scaling graph/);
 const broken=fixture();delete broken.reinforceTypes['2'][0].attack['0'];
 assert.throws(()=>convertCompactRegulation(broken,opts('Invented Alpha Sword')),/out of allowed range/);
});
test('physical and split scaling maps independent elements',()=>{
 const data=fixture(),a=data.weapons[0];
 a.attack.push([1,50]);a.calcCorrectGraphIds[1]=1;data.attackElementCorrects[5][1]={int:true};
 data.reinforceTypes[2].forEach(row=>{row.attack[1]=1;});
 a.attributeScaling.push(['int',0.5]);
 const p=convertCompactRegulation(data,opts('Invented Alpha Sword'));
 assert.equal(calculateAr(p,stats,{affinity:'SOURCE AFFINITY'}).perElement.length,2);
});
