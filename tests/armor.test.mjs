import test from 'node:test';
import assert from 'node:assert/strict';
import {optimizeArmor,parseArmorCsv,armorCsv,validateArmorItems,armorItemKey} from '../public/src/armor-optimizer.mjs';
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

test('exclude individual items by slot, never same-named items in another slot; undo and empty search',()=>{
 const items=[
  {slot:'head',name:'Shared',weight:1,score:5,poise:4},
  {slot:'chest',name:'Shared',weight:1,score:7,poise:5},
  {slot:'hands',name:'Unique',weight:1,score:2,poise:2}
 ];
 const head=armorItemKey(items[0]),chest=armorItemKey(items[1]);
 assert.notEqual(head,chest);
 assert.equal(head,armorItemKey({...items[0],name:'SHARED'}));
 let result=optimizeArmor(items,{...limits,minPoise:5},new Set([head]));
 assert.equal(result.excludedCount,1);
 assert.equal(result.evaluated,1*2*2*1);
 assert.equal(result.top[0].items[0].empty,true);
 assert.equal(result.top[0].items[1].name,'Shared');
 result=optimizeArmor(items,{...limits,minPoise:5},[head,chest]);
 assert.equal(result.top.length,0,'excluding both poise sources removes feasible solutions');
 assert.equal(result.valid,0);
 assert.equal(result.excludedCount,2);
 result=optimizeArmor(items,{...limits,minPoise:5},[]);
 assert.equal(result.top[0].items[0].name,'Shared','undo restores original top result');
 assert.throws(()=>optimizeArmor(items,limits,[42]),/Exclusions/);
});

test('excluded pieces are never returned, and tied candidates retain deterministic ordering',()=>{
 const items=[
  {slot:'head',name:'A',weight:2,score:2,poise:1},
  {slot:'head',name:'B',weight:2,score:2,poise:1},
  {slot:'chest',name:'C',weight:1,score:1,poise:1},
  {slot:'hands',name:'D',weight:1,score:1,poise:1},
  {slot:'legs',name:'E',weight:1,score:1,poise:1}
 ];
 const first=optimizeArmor(items,limits);
 assert.equal(first.top[0].items[0].name,'A');
 const key=armorItemKey(items[0]);
 const after=optimizeArmor(items,limits,[key]);
 assert.equal(after.top[0].items[0].name,'B');
 assert.ok(after.top.every(combo=>combo.items.every(item=>item.empty||armorItemKey(item)!==key)));
 assert.equal(after.valid,first.valid-(2*2*2));
});

test('full exact search agrees with independently enumerated brute force on 50 deterministic cases',()=>{
 let seed=0x5a17;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const slots=['head','chest','hands','legs'];
 for(let trial=0;trial<50;trial++){
  const items=[];
  for(const slot of slots){
   const count=1+Math.floor(rnd()*3);
   for(let i=0;i<count;i++)items.push({
    slot,name:slot+'-'+i,weight:Math.floor(rnd()*16),score:Math.floor(rnd()*12),
    poise:Math.floor(rnd()*16)
   });
  }
  const selectedExclusions=new Set(items.filter(()=>rnd()<0.28).map(armorItemKey));
  const cfg={maxLoad:25+Math.floor(rnd()*80),reservedWeight:Math.floor(rnd()*12),
   targetTier:['light','medium','heavy'][Math.floor(rnd()*3)],
   minPoise:Math.floor(rnd()*25),poiseWeight:[0,0.25,1][Math.floor(rnd()*3)]};
  const out=optimizeArmor(items,cfg,selectedExclusions);
  const groups=slots.map(slot=>[null,...items.filter(item=>
   item.slot===slot&&!selectedExclusions.has(armorItemKey(item)))]);
  const independent=[];
  let expectedCount=0,expectedValid=0;
  const pct={light:0.3,medium:0.7,heavy:1}[cfg.targetTier];
  for(const h of groups[0])for(const c of groups[1])
   for(const a of groups[2])for(const l of groups[3]){
    expectedCount++;
    const choice=[h,c,a,l];
    const poise=choice.reduce((s,x)=>s+(x?.poise??0),0);
    const total=cfg.reservedWeight+choice.reduce((s,x)=>s+(x?.weight??0),0);
    if(poise<cfg.minPoise||total>=pct*cfg.maxLoad)continue;
    expectedValid++;
    const score=choice.reduce((s,x)=>s+(x?.score??0),0);
    independent.push({choice,poise,score,total,
     objective:Math.round((score+poise*cfg.poiseWeight)*10000)/10000});
   }
  independent.sort((a,b)=>b.objective-a.objective||a.total-b.total||
    b.poise-a.poise||
    a.choice.map(x=>x?.name??'No armor').join('|').localeCompare(
     b.choice.map(x=>x?.name??'No armor').join('|')));
  const identity=choice=>choice.map(x=>x?.name??'No armor');
  assert.equal(out.evaluated,expectedCount,'enumeration count case '+trial);
  assert.equal(out.valid,expectedValid,'feasible count case '+trial);
  assert.deepEqual(out.top.map(x=>identity(x.items.filter(Boolean))),
   independent.slice(0,5).map(x=>identity(x.choice)),
   'top five exact combinations case '+trial);
 }
});
