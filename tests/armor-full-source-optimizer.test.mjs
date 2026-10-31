import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {optimizePinnedArmorPoise} from '../public/src/armor-full-source-optimizer.mjs';
const slots=['Head','Chest','Arms','Legs'];
const sample=()=>slots.flatMap((slot,i)=>
 Array.from({length:4},(_,j)=>({
  id:slot+'-'+j,name:'INVENTED '+slot+' '+j,slot,
  weight:Number(((i+j+1)*0.8).toFixed(1)),
  poise:i*3+j*2+1
 })));
function brute(rows,{maxEquipLoad,reservedWeight=0,tier='medium',minPoise=0,excludedIds=[]}){
 const factor=tier==='light'?.3:tier==='medium'?.7:1;
 const groups=slots.map(slot=>[null,...rows.filter(x=>x.slot===slot&&!excludedIds.includes(x.id)&&x.poise!==null)]);
 let best=null;
 for(const h of groups[0])for(const c of groups[1])for(const a of groups[2])for(const l of groups[3]){
  const selected=[h,c,a,l],weight=selected.reduce((s,x)=>s+(x?.weight??0),0),
    poise=selected.reduce((s,x)=>s+(x?.poise??0),0);
  if((weight+reservedWeight)>=maxEquipLoad*factor||poise<minPoise)continue;
  if(!best||poise>best.poise||poise===best.poise&&weight<best.weight)
   best={poise,weight};
 }
 return best;
}
test('exact DP agrees with brute force on 20 deterministic threshold/poise objectives',()=>{
 const rows=sample();
 for(let i=0;i<20;i++){
  const opts={
   maxEquipLoad:10+(i%7)*2,
   reservedWeight:(i%4)*0.5,
   tier:i%3===0?'light':i%3===1?'medium':'heavy',
   minPoise:(i*3)%30,
   excludedIds:i%5===0?['Head-1','Chest-2']:[]
  };
  const expected=brute(rows,opts);
  const actual=optimizePinnedArmorPoise(rows,opts);
  if(!expected){assert.equal(actual.status,'no-solution');continue;}
  assert.equal(actual.status,'optimized-source-reference');
  assert.equal(actual.poise,expected.poise);
  assert.ok(Math.abs(actual.armorWeight-expected.weight)<1e-6);
  assert.equal(actual.combination.length,4);
  assert.match(actual.caveat,/NOT patch-certified/);
 }
});
test('exact 70 percent threshold is strict; source unknown Poise never defaults to zero',()=>{
 const rows=[{id:'h',name:'Helm',slot:'Head',weight:7,poise:50},
  {id:'c',name:'Chest',slot:'Chest',weight:1,poise:null}];
 const result=optimizePinnedArmorPoise(rows,{maxEquipLoad:10,tier:'medium'});
 assert.equal(result.poise,0);
 assert.equal(result.missingPoiseExcluded,1);
 assert.ok(result.combination.every(x=>x.name==='Empty slot'));
 const upgraded=optimizePinnedArmorPoise(rows,{maxEquipLoad:10.1,tier:'medium'});
 assert.equal(upgraded.poise,50);
 assert.equal(upgraded.combination[0].name,'Helm');
});
test('reserve load and explicit item exclusions are independently honored',()=>{
 const rows=sample(),all=optimizePinnedArmorPoise(rows,{maxEquipLoad:30,poise:0});
 assert.equal(all.status,'optimized-source-reference');
 const none=optimizePinnedArmorPoise(rows,{maxEquipLoad:30,reservedWeight:22,tier:'medium'});
 assert.equal(none.status,'no-solution');
 const noHead=optimizePinnedArmorPoise(rows,{maxEquipLoad:30,
  excludedIds:['Head-0','Head-1','Head-2','Head-3']});
 assert.equal(noHead.combination[0].id,null);
 assert.equal(noHead.explicitExcluded,4);
});
test('malformed input, out-of-range weight/Poise, duplicate ID and unsupported tier fail closed',()=>{
 const rows=sample();
 for(const bad of [
  {tier:'overloaded'},{maxEquipLoad:''},{maxEquipLoad:0},
  {reservedWeight:'Infinity'},{minPoise:501},{minPoise:-1},
  {excludedIds:['x'.repeat(81)]}
 ])assert.throws(()=>optimizePinnedArmorPoise(rows,{maxEquipLoad:50,...bad}),RangeError);
 assert.throws(()=>optimizePinnedArmorPoise([...rows,rows[0]],{maxEquipLoad:50}),/duplicate/);
 assert.throws(()=>optimizePinnedArmorPoise([...rows,{id:'q',name:'Fake',slot:'Head',weight:-1,poise:1}],{maxEquipLoad:50}),RangeError);
});
test('Armor Optimizer offers opt-in public source with an actual Web Worker, not an automatic download',()=>{
 const html=readFileSync(new URL('../public/armor-optimizer/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/src/armor-full-source-app.mjs',import.meta.url),'utf8');
 const worker=readFileSync(new URL('../public/src/armor-full-source-worker.mjs',import.meta.url),'utf8');
 for(const id of ['armor-full-load','armor-full-run','armor-full-panel','armor-full-status','armor-full-rows'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(app,/loadPinnedArmorSource\(fetch\)/);
 assert.match(app,/new Worker\(/);
 assert.match(worker,/optimizePinnedArmorMetric/);
 assert.match(html,/id="armor-full-metric"/);
 assert.match(html,/not yet an independently observed Tarnished.dev v1.17 numeric result/);
});
