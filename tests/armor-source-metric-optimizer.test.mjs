import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARMOR_METRICS,inspectArmorSource} from '../public/src/armor-source-optin.mjs';
import {optimizePinnedArmorMetric} from '../public/src/armor-source-metric-optimizer.mjs';

const slots=['Head','Chest','Arms','Legs'];
const keys=Object.keys(ARMOR_METRICS);
const sample=()=>slots.flatMap((slot,i)=>Array.from({length:3},(_,j)=>{
 const metrics=Object.fromEntries(keys.map((k,m)=>[
  k,k==='poise'?i*3+j*4+1:
   ARMOR_METRICS[k].kind==='negation'?((i*9+j*7+m)%21):
    (i*3+j*7+m)%35
 ]));
 return {id:slot+'-'+j,slot,name:'FICTIONAL '+slot+' '+j,
  weight:Math.round((0.7+i*0.3+j*0.5)*1000)/1000,
  poise:metrics.poise,metrics};
}));
function brute(rows,metric,{maxEquipLoad,reservedWeight=0,tier='medium',excludedIds=[]}){
 const factor=tier==='light'?.3:tier==='medium'?.7:1;
 const groups=slots.map(slot=>[null,...rows.filter(r=>r.slot===slot&&
  !excludedIds.includes(r.id)&&r.metrics?.[metric]!=null)]);
 let best=null;
 for(const a of groups[0])for(const b of groups[1])
  for(const c of groups[2])for(const d of groups[3]){
   const parts=[a,b,c,d],weight=parts.reduce((v,x)=>v+(x?.weight??0),0);
   if(weight+reservedWeight>=maxEquipLoad*factor-1e-9)continue;
   const kind=ARMOR_METRICS[metric].kind;
   const value=kind==='negation'?
    100*(1-parts.reduce((prod,x)=>prod*(1-(x?.metrics[metric]??0)/100),1)):
    parts.reduce((sum,x)=>sum+(x?.metrics[metric]??0),0);
   if(!best||value>best.value+1e-8||
    Math.abs(value-best.value)<=1e-8&&weight<best.weight)
    best={value,weight};
  }
 return best;
}

test('13 distinct real armor combat objectives are defined, no cosmetic placeholder target',()=>{
 assert.equal(keys.length,13);
 assert.equal(keys.filter(k=>ARMOR_METRICS[k].kind==='negation').length,8);
 assert.equal(keys.filter(k=>ARMOR_METRICS[k].kind==='resistance').length,5);
});
test('exact 4-slot weight DP matches brute-force objective across every armor metric and roll tier',()=>{
 const rows=sample();
 for(const metric of keys){
  for(let i=0;i<6;i++){
   const options={metric,maxEquipLoad:9+i,
    reservedWeight:i%2?1:0,tier:['light','medium','heavy'][i%3],
    excludedIds:i%2?['Head-1']:[]};
   const truth=brute(rows,metric,options);
   const actual=optimizePinnedArmorMetric(rows,options);
   if(!truth){assert.equal(actual.status,'no-solution');continue;}
   assert.equal(actual.status,'optimized-source-reference');
   assert.ok(Math.abs(actual.metricValue-truth.value)<2e-6,
    metric+' expected '+truth.value+' got '+actual.metricValue);
   assert.ok(Math.abs(actual.armorWeight-truth.weight)<1e-6,
    metric+' weight must meet brute-force optimum');
   assert.equal(actual.combination.length,4);
  }
 }
});
test('damage negation combines multiplicatively (20% and 30% -> 44%), never sums to 50%',()=>{
 const rows=[
  {id:'head',name:'HEAD',slot:'Head',weight:1,poise:2,
   metrics:{physical:20}},
  {id:'chest',name:'CHEST',slot:'Chest',weight:1,poise:3,
   metrics:{physical:30}}
 ];
 const found=optimizePinnedArmorMetric(rows,{
  metric:'physical',maxEquipLoad:10,tier:'medium'});
 assert.equal(found.metricValue,44);
 assert.equal(found.poise,5);
 assert.equal(found.metricUnit,'%');
 assert.equal(found.sourceFieldAggregation,'multiplicative source-percentages');
});
test('missing objectives, partial Poise and strict weight boundaries never become invented zero',()=>{
 const rows=[
  {id:'a',name:'A',slot:'Head',weight:6.999,poise:null,
   metrics:{magic:25}},
  {id:'b',name:'B',slot:'Arms',weight:1,poise:8,
   metrics:{magic:null}},
  {id:'c',name:'C',slot:'Chest',weight:7,poise:7,
   metrics:{magic:99}}
 ];
 const r=optimizePinnedArmorMetric(rows,{metric:'magic',maxEquipLoad:10,tier:'medium'});
 assert.equal(r.metricValue,25);
 assert.equal(r.poise,null);
 assert.equal(r.missingMetricExcluded,1);
 assert.equal(r.combination[0].id,'a');
 const r2=optimizePinnedArmorMetric(rows,{metric:'magic',maxEquipLoad:10.01,tier:'medium'});
 assert.equal(r2.metricValue,99);
 assert.equal(r2.combination[1].id,'c');
});
test('source-specific minimum-Poise and unknown metrics do not pretend to solve unsupported joint constraints',()=>{
 const rows=sample();
 assert.throws(()=>optimizePinnedArmorMetric(rows,{
  metric:'magic',maxEquipLoad:80,minPoise:30
 }),/multi-constraint exact optimization is not implemented/);
 const r=optimizePinnedArmorMetric(rows,{
  metric:'poise',maxEquipLoad:80,minPoise:20
 });
 assert.equal(r.status,'optimized-source-reference');
 assert.ok(r.poise>=20);
 assert.equal(r.metricValue,r.poise);
});
test('invalid source rows and goals are rejected rather than incorrectly reusing unversioned values',()=>{
 const rows=sample();
 for(const options of [{metric:'invented'},{metric:'magic',maxEquipLoad:''},
  {metric:'fire',minPoise:-1},{metric:'holy',tier:'overloaded'},
  {metric:'magic',excludedIds:['x'.repeat(90)]}]){
  assert.throws(()=>optimizePinnedArmorMetric(rows,{
   maxEquipLoad:30,...options
  }),RangeError);
 }
 assert.throws(()=>optimizePinnedArmorMetric([...rows,rows[0]],{
  metric:'magic',maxEquipLoad:30
 }),/duplicate/);
});
test('pinned parser maps real upstream field spellings and fails closed on unknown metrics',()=>{
 const sampleItem=i=>({
  id:'fictional-'+String(i).padStart(8,'0')+'-qa',
  name:'FICTIONAL ARMOR '+i,category:['Helm','Chest Armor','Gauntlets','Leg Armor'][i%4],
  weight:2,dmgNegation:[
   {name:'Phy',amount:15},{name:'Strike',amount:12},{name:'Slash',amount:14},
   {name:'Pierce',amount:13},{name:'Magic',amount:9},{name:'Fire',amount:8},
   {name:'Ligt',amount:6},{name:'Holy',amount:7}
  ],resistance:[
   {name:'Poise',amount:11},{name:'Immunity',amount:22},
   {name:'Robustness',amount:23},{name:'Focus',amount:21},{name:'Vitality',amount:20}
  ],description:'Do not include this description',image:'https://unused.invalid/photo.png'
 });
 const raw=Array.from({length:568},(_,i)=>sampleItem(i));
 raw[1].dmgNegation[6].name='Light';// observed upstream alternate spelling
 raw[2].dmgNegation[0].name='Broken';
 raw[3].resistance[0].name='Pose';
 const result=inspectArmorSource(JSON.stringify(raw));
 assert.equal(result.count,568);
 const [a,b,c,d]=result.armors;
 assert.equal(a.metrics.physical,15);
 assert.equal(a.metrics.lightning,6);
 assert.equal(b.metrics.lightning,6);
 assert.equal(c.metrics.physical,null);
 assert.equal(d.metrics.poise,null);
 assert.equal(d.poise,null);
 assert.equal(a.metrics.robustness,23);
 assert.ok(!Object.hasOwn(a,'image'));
 assert.ok(!Object.hasOwn(a,'description'));
});
test('browser Worker and UI wire all thirteen metrics without autonomous external download',()=>{
 const app=readFileSync(new URL('../public/src/armor-full-source-app.mjs',import.meta.url),'utf8');
 const worker=readFileSync(new URL('../public/src/armor-full-source-worker.mjs',import.meta.url),'utf8');
 const page=readFileSync(new URL('../public/armor-optimizer/index.html',import.meta.url),'utf8');
 assert.match(worker,/optimizePinnedArmorMetric\(msg.armors,msg.options\)/);
 assert.match(app,/metric:\$\('armor-full-metric'\)\.value/);
 for(const id of keys)assert.match(page,new RegExp('<option value="'+id+'">'));
 assert.match(app,/loadPinnedArmorSource\(fetch\)/);
 assert.match(page,/multiplied|multiplicatively/);
});
