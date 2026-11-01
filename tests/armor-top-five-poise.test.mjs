import test from 'node:test';
import assert from 'node:assert/strict';
import {optimizePinnedArmorPoiseTopFive} from '../public/src/armor-top-five-poise.mjs';
const slots=['Head','Chest','Arms','Legs'];
const rows=slots.flatMap((slot,j)=>[
 {id:slot+'-A',name:slot+' A',slot,weight:1+j/10,poise:5+j},
 {id:slot+'-B',name:slot+' B',slot,weight:2+j/10,poise:9+j}
]);
const opts={maxEquipLoad:50,reservedWeight:0,tier:'medium',minPoise:0};
test('exact top five Poise DP equals brute-force all possible complete 4-slot sets',()=>{
 const all=[];
 for(const head of [null,...rows.filter(x=>x.slot==='Head')])
 for(const chest of [null,...rows.filter(x=>x.slot==='Chest')])
 for(const arms of [null,...rows.filter(x=>x.slot==='Arms')])
 for(const legs of [null,...rows.filter(x=>x.slot==='Legs')]){
  const parts=[head,chest,arms,legs],weight=parts.reduce((s,x)=>s+(x?.weight||0),0);
  if(weight>=35)continue;
  const poise=parts.reduce((s,x)=>s+(x?.poise||0),0);
  const key=parts.map(x=>x?.id??'').join('|');
  all.push({weight:Math.round(weight*1000)/1000,poise,key});
 }
 all.sort((a,b)=>b.poise-a.poise||a.weight-b.weight||
  (a.key<b.key?-1:a.key>b.key?1:0));
 const got=optimizePinnedArmorPoiseTopFive(rows,opts);
 assert.equal(got.status,'exact-local-top-five-poise');
 assert.equal(got.ranked.length,5);
 assert.deepEqual(got.ranked.map(x=>({weight:x.weight,poise:x.poise,
  key:x.combination.map(x=>x.id??'').join('|')})),all.slice(0,5));
});
test('exact ranking preserves slot locks/empties and source exclusions',()=>{
 const got=optimizePinnedArmorPoiseTopFive(rows,{
  ...opts,lockedIds:{Head:'Head-B'},disabledSlots:['Legs'],
  excludedIds:['Chest-B']
 });
 assert.ok(got.ranked.length>0);
 for(const row of got.ranked){
  assert.equal(row.combination[0].id,'Head-B');
  assert.equal(row.combination[3].id,null);
  assert.notEqual(row.combination[1].id,'Chest-B');
 }
});
test('strict tiny-cap/source-invalid fails closed',()=>{
 assert.throws(()=>optimizePinnedArmorPoiseTopFive(rows,{...opts,maxTransitions:5}),/budget/);
 const no=optimizePinnedArmorPoiseTopFive(rows,{...opts,reservedWeight:100});
 assert.equal(no.status,'no-solution');
});
