import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateRawV117Reference,auditRawMathParity} from '../public/src/regulation-parity.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';

const fixture=()=>{
 const graph=[{maxVal:0,maxGrowVal:0,adjPt:1},{maxVal:148,maxGrowVal:1.48,adjPt:1}];
 const req={str:10,dex:10};
 const reinforce=[
  {attack:{0:1,1:1,2:1,3:1,4:1},attributeScaling:{str:1,dex:1,int:1,fai:1,arc:1}},
  {attack:{0:1.25,1:1.25,2:1.25,3:1.25,4:1.25},attributeScaling:{str:1.1,dex:1.1,int:1.1,fai:1.1,arc:1.1}}
 ];
 const weapon=(name,fields={})=>({
  name,weaponName:name,weaponType:3,requirements:req,
  attack:[[0,100]],attributeScaling:[['str',0.8],['dex',0.2]],
  attackElementCorrectId:5,reinforceTypeId:2,calcCorrectGraphIds:{0:1},
  ...fields
 });
 return {
  weapons:[
   weapon('Fictional Longsword'),
   weapon('Fictional Paired Blade',{paired:true,weaponType:35}),
   weapon('Fictional Bow',{weaponType:50}),
   weapon('Fictional Elemental Sword',{
    attack:[[0,100],[1,50]],attributeScaling:[['str',0.8],['dex',0.2],['int',0.5]],
    attackElementCorrectId:6,calcCorrectGraphIds:{0:1,1:1},
    requirements:{str:10,dex:10,int:20}
   }),
   weapon('Fictional Numeric Override',{
    attack:[[0,100]],attackElementCorrectId:7
   })
  ],
  calcCorrectGraphs:{0:graph,1:graph},
  attackElementCorrects:{
   5:{0:{str:true,dex:true}},
   6:{0:{str:true,dex:true},1:{int:true}},
   7:{0:{str:0.55,dex:true}}
  },
  reinforceTypes:{2:reinforce},
  statusSpEffectParams:{},
  scalingTiers:[]
 };
};
const stats={str:40,dex:20,int:30,fai:10,arc:10};
test('raw source arithmetic matches independently converted synthetic weapon AR',()=>{
 const source=fixture();
 for(const weapon of source.weapons){
  const profile=convertCompactRegulation({...source,weapons:[weapon]},{
   weaponName:weapon.name,gameVersion:'synthetic',sourceReference:'made up synthetic fixture'
  });
  for(const upgrade of [0,1])for(const twoHanded of [false,true]){
   const raw=calculateRawV117Reference(source,weapon,stats,{upgrade,twoHanded});
   const calc=calculateAr(profile,stats,{upgrade,twoHanded});
   assert.equal(calc.total,raw.total,weapon.name);
   assert.equal(calc.effectiveStats.str,raw.actualStrength,weapon.name);
   assert.deepEqual(calc.perElement.map(x=>x.element),raw.parts.map(x=>x.element));
   for(let i=0;i<raw.parts.length;i++)
    assert.ok(Math.abs(calc.perElement[i].raw-raw.parts[i].raw)<1e-6,weapon.name);
  }
 }
});
test('whole-source parity covers 12 boundary and attribute-focus scenarios per row; output remains anonymous',()=>{
 const source=fixture(),progress=[];
 const report=auditRawMathParity(source,{gameVersion:'synthetic',sourceReference:'synthetic fixture',
  onProgress:p=>progress.push(p)});
 assert.equal(report.totalRows,5);
 assert.equal(report.converted,5);
 assert.equal(report.scenarioCount,12);
 assert.equal(report.compared,60);
 assert.equal(report.mismatched,0);
 assert.equal(report.unsupported,0);
 assert.equal(report.parityPass,true);
 assert.equal(report.gameVerified,false);
 assert.equal(report.sourceParametersExported,false);
 assert.deepEqual(progress,[{processed:5,total:5}]);
 assert.ok(!JSON.stringify(report).includes('Fictional Longsword'));
 assert.match(report.note,/NOT|Not|not/);
});
test('numeric override, unmet requirements and bow 2H are compared without fake game data',()=>{
 const source=fixture();
 const bow=source.weapons[2];
 const b=calculateRawV117Reference(source,bow,stats,{twoHanded:false});
 assert.equal(b.actualStrength,60);
 assert.equal(b.strengthBonusApplied,true);
 const paired=source.weapons[1];
 const p=calculateRawV117Reference(source,paired,stats,{twoHanded:true});
 assert.equal(p.actualStrength,40);
 const penalized=calculateRawV117Reference(source,source.weapons[3],
  {...stats,int:5},{upgrade:0});
 const magic=penalized.parts.find(x=>x.element==='magic');
 assert.equal(magic.raw,30);
 const withOverride=calculateRawV117Reference(source,source.weapons[4],stats,{upgrade:1});
 assert.ok(withOverride.total>100);
});
test('invalid and missing source rows are rejected, never interpolated',()=>{
 const src=fixture();
 assert.throws(()=>calculateRawV117Reference(src,src.weapons[0],stats,{upgrade:25}),
  /Upgrade row missing/);
 const corrupt=structuredClone(src);delete corrupt.attackElementCorrects[5];
 assert.throws(()=>calculateRawV117Reference(corrupt,src.weapons[0],stats),
  /Missing raw attack-correction/);
 const invalid=structuredClone(src);invalid.weapons[0].attack=[[0,100]];
 delete invalid.reinforceTypes[2][0].attack[0];
 assert.throws(()=>calculateRawV117Reference(invalid,invalid.weapons[0],stats),
  /Missing raw reinforcement multiplier/);
 assert.throws(()=>auditRawMathParity({...src,weapons:[]}),/Invalid raw AR audit input/);
});
test('one broken variant makes whole-source parity report fail, with row index only',()=>{
 const source=fixture();
 source.weapons[2].attackElementCorrectId=4321;
 const report=auditRawMathParity(source,{gameVersion:'synthetic',sourceReference:'synthetic fixture'});
 assert.equal(report.parityPass,false);
 assert.equal(report.converted,4);
 assert.ok(report.errorsByReason['converter-failure']>=1);
 assert.equal(report.examples[0].index,2);
 assert.ok(!JSON.stringify(report).includes('Fictional Bow'));
});
