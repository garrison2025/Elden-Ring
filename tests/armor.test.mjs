import test from 'node:test';
import assert from 'node:assert/strict';
import {optimizeArmor,parseArmorCsv,armorCsv,validateArmorItems} from '../public/src/armor-optimizer.mjs';
import {ARMOR_FICTIONAL_EXAMPLE} from '../public/data/armor-example.mjs';
const limits={maxLoad:100,reservedWeight:10,targetTier:'medium',minPoise:0,poiseWeight:0};
test('exact search finds highest scoring four-slot combination inside threshold',()=>{
 const rows=[
  {slot:'head',name:'A',weight:5,score:8,poise:3},
  {slot:'head',name:'B',weight:10,score:16,poise:7},
  {slot:'chest',name:'C',weight:20,score:20,poise:12},
  {slot:'chest',name:'D',weight:30,score:31,poise:20},
  {slot:'hands',name:'E',weight:3,score:4,poise:2},
  {slot:'legs',name:'F',weight:8,score:10,poise:5}
 ];
 const r=optimizeArmor(rows,limits);
 assert.equal(r.top[0].score,61);
 assert.equal(r.top[0].totalWeight,61);
 assert.equal(r.top[0].items[1].name,'D');
 assert.equal(r.evaluated,3*3*2*2);
});
test('strict 70 percent threshold excludes exactly 70',()=>{
 const rows=[{slot:'head',name:'Heavy helm',weight:60,score:10,poise:0},
             {slot:'head',name:'Light helm',weight:59.999,score:9,poise:0}];
 const r=optimizeArmor(rows,limits);
 assert.equal(r.top[0].items[0].name,'Light helm');
 assert.equal(r.top[0].totalWeight,69.999);
});
test('empty pieces allowed, minimum poise and no feasible cases distinguish',()=>{
 const rows=[{slot:'head',name:'Only',weight:1,score:5,poise:10}];
 let r=optimizeArmor(rows,{...limits,minPoise:10});
 assert.equal(r.top[0].poise,10);
 r=optimizeArmor(rows,{...limits,minPoise:20});
 assert.equal(r.top.length,0);
});
test('poise weight affects objective without calling it actual damage negation',()=>{
 const rows=[
   {slot:'head',name:'Flexible',weight:4,score:9,poise:0},
   {slot:'head',name:'Sturdy',weight:4,score:2,poise:15}
 ];
 const withScore=optimizeArmor(rows,{...limits,poiseWeight:0});
 const withPoise=optimizeArmor(rows,{...limits,poiseWeight:1});
 assert.equal(withScore.top[0].items[0].name,'Flexible');
 assert.equal(withPoise.top[0].items[0].name,'Sturdy');
 assert.match(withPoise.note,/does not calculate actual/);
});
test('zero spare weight returns no result for tight strict threshold',()=>{
 const r=optimizeArmor([{slot:'head',name:'Only',weight:1,score:5,poise:3}],
  {...limits,maxLoad:100,reservedWeight:70,targetTier:'medium'});
 assert.equal(r.top.length,0);
});
test('CSV parser supports escaped commas and quotes, BOM, roundtrip',()=>{
 const rows=[{slot:'head',name:'Plate, "custom"',weight:1.234,score:4.25,poise:2}];
 const text=armorCsv(rows);
 const back=parseArmorCsv('\uFEFF'+text);
 assert.deepEqual(back,rows);
});
test('CSV and limits reject bad data and excessive options',()=>{
 assert.throws(()=>parseArmorCsv('slot,name,weight,score,poise\nhead,Nope,1,2'),/columns/);
 assert.throws(()=>parseArmorCsv('wrong,name,weight,score,poise\nhead,Nope,1,2,3'),/header/);
 assert.throws(()=>optimizeArmor(ARMOR_FICTIONAL_EXAMPLE,{...limits,maxLoad:-1}),/Maximum/);
 assert.throws(()=>optimizeArmor(ARMOR_FICTIONAL_EXAMPLE,{...limits,poiseWeight:100}),/Poise/);
 assert.throws(()=>validateArmorItems([{slot:'head',name:'x',weight:1,score:1,poise:0},
  {slot:'head',name:'X',weight:1,score:1,poise:0}]),/Duplicate/);
 assert.throws(()=>validateArmorItems(Array.from({length:13},(_,i)=>({slot:'head',name:'item'+i,weight:1,score:1,poise:1}))),/Maximum 12/);
});
test('fictional starter inventory can be optimized quickly and yields valid top combinations',()=>{
 const result=optimizeArmor(ARMOR_FICTIONAL_EXAMPLE,{maxLoad:75,reservedWeight:18,targetTier:'medium',minPoise:0,poiseWeight:0.3});
 assert.ok(result.valid>0);
 assert.ok(result.top.length<=5);
 for(const item of result.top)assert.ok(item.totalWeight<75*.7);
});
