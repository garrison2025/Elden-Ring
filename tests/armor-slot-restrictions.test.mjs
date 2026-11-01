import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARMOR_METRICS} from '../public/src/armor-source-optin.mjs';
import {optimizePinnedArmorMetric} from '../public/src/armor-source-metric-optimizer.mjs';
const slots=['Head','Chest','Arms','Legs'];
const keys=Object.keys(ARMOR_METRICS);
const rows=slots.flatMap((slot,i)=>Array.from({length:3},(_,j)=>{
 const poise=4+i*3+j*4;
 const metrics=Object.fromEntries(keys.map((key,k)=>[
  key,key==='poise'?poise:ARMOR_METRICS[key].kind==='negation'?
   (i*4+j*9+k)%32:(i*5+j*6+k)%28
 ]));
 return {id:slot+'-'+j,name:slot+' test '+j,slot,weight:1+i*.2+j*.6,poise,metrics};
}));
function brute(metric,{maxEquipLoad,tier='medium',reservedWeight=0,minPoise=0,
 lockedIds={},disabledSlots=[],excludedIds=[]}){
 const factor=tier==='light'?.3:tier==='medium'?.7:1;
 const groups=slots.map(slot=>disabledSlots.includes(slot)?[null]:
  Object.hasOwn(lockedIds,slot)?rows.filter(x=>x.id===lockedIds[slot]):
  [null,...rows.filter(x=>x.slot===slot&&!excludedIds.includes(x.id))]);
 let best=null;
 for(const head of groups[0])for(const chest of groups[1])
  for(const arms of groups[2])for(const legs of groups[3]){
   const selected=[head,chest,arms,legs];
   const weight=selected.reduce((s,x)=>s+(x?.weight??0),0);
   const poise=selected.reduce((s,x)=>s+(x?.poise??0),0);
   if(weight+reservedWeight>=maxEquipLoad*factor-1e-9||poise<minPoise)continue;
   const value=ARMOR_METRICS[metric].kind==='negation'?
    100*(1-selected.reduce((p,x)=>p*(1-(x?.metrics[metric]??0)/100),1)):
    selected.reduce((s,x)=>s+(x?.metrics[metric]??0),0);
   if(!best||value>best.value+1e-8||
    Math.abs(value-best.value)<1e-8&&weight<best.weight)
    best={value,weight,selected};
  }
 return best;
}
test('locked and empty slots keep exact global optimum across 13 metrics and Poise requirements',()=>{
 const plans=[
  {maxEquipLoad:19,tier:'medium',lockedIds:{Head:'Head-0'},disabledSlots:['Arms'],minPoise:0},
  {maxEquipLoad:30,tier:'medium',lockedIds:{Chest:'Chest-1',Legs:'Legs-2'},minPoise:25},
  {maxEquipLoad:25,tier:'light',disabledSlots:['Head','Chest'],minPoise:5},
  {maxEquipLoad:12,tier:'heavy',reservedWeight:3,lockedIds:{Arms:'Arms-1'},minPoise:0}
 ];
 for(const metric of keys)for(const options of plans){
  const expected=brute(metric,options);
  const actual=optimizePinnedArmorMetric(rows,{metric,...options});
  if(!expected){assert.equal(actual.status,'no-solution');continue;}
  assert.equal(actual.status,'optimized-source-reference',metric);
  assert.ok(Math.abs(actual.metricValue-expected.value)<2e-6,metric);
  assert.ok(Math.abs(actual.armorWeight-expected.weight)<1e-6,metric);
  for(const slot of slots){
   const index=slots.indexOf(slot);
   if(options.disabledSlots?.includes(slot))assert.equal(actual.combination[index].id,null);
   if(options.lockedIds?.[slot])assert.equal(actual.combination[index].id,options.lockedIds[slot]);
  }
 }
});
test('locks cannot be silently emptied, mismatched, excluded or supplied without verified fields',()=>{
 const options={metric:'physical',maxEquipLoad:30};
 for(const changes of [
  {lockedIds:{Head:'absent'}},
  {lockedIds:{Chest:'Head-0'}},
  {lockedIds:{Head:'Head-0'},excludedIds:['Head-0']},
  {lockedIds:{Head:'Head-0'},disabledSlots:['Head']},
  {disabledSlots:['Arms','Arms']},
  {disabledSlots:['Finger']},
  {lockedIds:{Finger:'Head-0'}}
 ])assert.throws(()=>optimizePinnedArmorMetric(rows,{...options,...changes}),RangeError);
 const omitted=rows.filter(x=>x.id!=='Head-0');
 assert.throws(()=>optimizePinnedArmorMetric(omitted,{
  ...options,lockedIds:{Head:'Head-0'}
 }),/Locked Head/);
 const noMetric=rows.map(x=>x.id==='Head-0'?
  {...x,metrics:{...x.metrics,physical:null}}:x);
 assert.throws(()=>optimizePinnedArmorMetric(noMetric,{
  ...options,lockedIds:{Head:'Head-0'}
 }),/lacks the selected objective/);
 assert.throws(()=>optimizePinnedArmorMetric(noMetric,{
  metric:'poise',maxEquipLoad:30,lockedIds:{Head:'Head-0'},excludedIds:['Head-0']
 }),RangeError);
});
test('a locked piece heavier than strict roll threshold produces no solution, not an illegal replacement',()=>{
 const result=optimizePinnedArmorMetric(rows,{metric:'fire',
  maxEquipLoad:3,tier:'light',lockedIds:{Chest:'Chest-2'}});
 assert.equal(result.status,'no-solution');
 assert.equal(result.combination,null);
});
test('browser exposes per-slot locks, mandatory empty slots, and passes the restrictions to Worker',()=>{
 const app=readFileSync(new URL('../public/src/armor-full-source-app.mjs',import.meta.url),'utf8');
 const page=readFileSync(new URL('../public/armor-optimizer/index.html',import.meta.url),'utf8');
 for(const slot of slots)assert.match(page,new RegExp('id="armor-full-slot-'+slot.toLowerCase()+'"'));
 assert.match(app,/\.\.\.slotRestrictions\(\)/);
 assert.match(app,/select\.disabled=false/);
 assert.match(page,/13-metric weighted mode/i);
 assert.match(page,/per-metric minima\/maxima/i);
});
