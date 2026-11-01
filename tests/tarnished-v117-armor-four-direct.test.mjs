import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TARNISHED_V117_ARMOR_FOUR,applyTarnishedV117DirectArmorFields}
 from '../public/src/tarnished-v117-armor-direct.mjs';
import {loadPinnedArmorSource} from '../public/src/armor-source-optin.mjs';
const verified=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-four-armor-public-goldens.json',import.meta.url),'utf8'));
test('four actual site armors have eight immutable site-only weight/poise goldens',()=>{
 assert.equal(TARNISHED_V117_ARMOR_FOUR.length,4);
 assert.deepEqual(TARNISHED_V117_ARMOR_FOUR,verified.rows.map(({name,slot,weight,poise})=>({name,slot,weight,poise})));
 const names=new Set(TARNISHED_V117_ARMOR_FOUR.map(x=>x.name));
 assert.equal(names.size,4);
 assert.equal(verified.sourceRun,41274222694);
});
const example=()=>TARNISHED_V117_ARMOR_FOUR.map((e,i)=>({
 id:'community-fixture-'+i,name:e.name,slot:e.slot,
 weight:e.weight+(i===1?-0.1:0),poise:e.poise-2,
 metrics:{poise:e.poise-2,physical:12+i,holy:7,fire:-5}
}));
test('Tarnished.dev only: exact field overlay fixes weight/poise, never invents 12 armor metrics',()=>{
 const rows=example(),copy=JSON.stringify(rows);
 const result=applyTarnishedV117DirectArmorFields(rows);
 assert.equal(result.directlyCorrectedArmorCount,4);
 assert.equal(result.correctedFields,8);
 assert.equal(result.otherArmorFieldsNumericallyVerified,false);
 assert.equal(JSON.stringify(rows),copy,'original pinned-source rows must not mutate');
 for(let i=0;i<4;i++){
  const actual=result.armors[i],ref=TARNISHED_V117_ARMOR_FOUR[i];
  assert.equal(actual.weight,ref.weight);
  assert.equal(actual.poise,ref.poise);
  assert.equal(actual.metrics.poise,ref.poise);
  assert.equal(actual.metrics.physical,12+i);
  assert.equal(actual.metrics.fire,-5);
  assert.match(actual.siteDirectFields.weight,/Tarnished.dev public v1.17/);
 }
});
test('source overlay fails closed on partial matching/duplicate items, never guesses missing armor',()=>{
 assert.throws(()=>applyTarnishedV117DirectArmorFields(example().slice(0,3)),/Incomplete/);
 assert.throws(()=>applyTarnishedV117DirectArmorFields([...example(),example()[0]]),/Ambiguous/);
 const unmatched=applyTarnishedV117DirectArmorFields([
  {id:'x',name:'Fictional Armor',slot:'Head',weight:2,poise:1,metrics:{poise:1}}
 ]);
 assert.equal(unmatched.directlyCorrectedArmorCount,0);
 assert.equal(unmatched.armors[0].weight,2);
});
test('actual user initiated armor source load applies site goldens to four real matching items',async()=>{
 const toOriginal=(e,i)=>({
  id:'source-fixture-item-'+String(i).padStart(5,'0'),name:e.name,
  category:{Head:'Helm',Chest:'Chest Armor',Arms:'Gauntlets',Legs:'Leg Armor'}[e.slot],
  weight:e.weight+(i===1?-0.1:0),
  resistance:[{name:'Poise',amount:e.poise-2}],
  dmgNegation:[{name:'Phy',amount:7}]
 });
 const more=Array.from({length:564},(_,i)=>({
  id:'extra-source-'+String(i).padStart(5,'0'),name:'EXTRA '+i,
  category:'Helm',weight:1,resistance:[],dmgNegation:[]
 }));
 const raw=JSON.stringify([...TARNISHED_V117_ARMOR_FOUR.map(toOriginal),...more]);
 const result=await loadPinnedArmorSource(async()=>({
  ok:true,headers:{get:()=>String(raw.length)},text:async()=>raw
 }));
 assert.equal(result.count,568);
 assert.equal(result.directTarnishedV117ArmorCount,4);
 for(const [i,e] of TARNISHED_V117_ARMOR_FOUR.entries()){
  assert.equal(result.armors[i].weight,e.weight);
  assert.equal(result.armors[i].poise,e.poise);
 }
});
