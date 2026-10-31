import test from 'node:test';
import assert from 'node:assert/strict';
import {COMPACT_SYNTHETIC_REGULATION} from '../public/data/ar-compact-synthetic.mjs';
import {rankLocalWeaponVariants,rankingToCsv,RANKING_MAX_VARIANTS} from '../public/src/ar-cross-weapon-ranking.mjs';
import {describeLocalWeapon} from '../public/src/ar-workbench-core.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';

const stats={str:40,dex:20,int:10,fai:10,arc:10};
const opts={term:'Fictional',stats,regularUpgrade:0,somberUpgrade:0,
 twoHanded:false,gameVersion:'FICTIONAL',sourceReference:'Independent invented fixture'};
test('ranks several different source weapon families by ACTUAL shared AR engine, not +0 damage sums',()=>{
 const r=rankLocalWeaponVariants(COMPACT_SYNTHETIC_REGULATION,opts);
 assert.equal(r.status,'complete-query');
 assert.equal(r.totalMatches,4);assert.equal(r.rankedCount,4);
 assert.equal(r.excludedCount,0);
 assert.deepEqual(r.rows.map(x=>x.total),[...r.rows.map(x=>x.total)].sort((a,b)=>b-a));
 const bronze=r.rows.find(x=>x.name.startsWith('Fictional Bronze'));
 const profile=describeLocalWeapon(COMPACT_SYNTHETIC_REGULATION,bronze.name,'FICTIONAL',
  'Independent invented fixture').profile;
 assert.equal(bronze.total,calculateAr(profile,stats,{upgrade:0,twoHanded:false}).total);
 assert.equal(bronze.total,136);
 assert.equal(bronze.components.physical,136);
 assert.equal(r.rows.find(x=>x.name.startsWith('Fictional Magic')).requirementsMet,false);
 assert.deepEqual(r.rows.find(x=>x.name.startsWith('Fictional Magic')).missingRequirements,['int']);
});
test('one vs two hands and +0/+1 source reinforcement recalculate, never interpolate missing upgrades',()=>{
 const baseline=rankLocalWeaponVariants(COMPACT_SYNTHETIC_REGULATION,opts);
 const two=rankLocalWeaponVariants(COMPACT_SYNTHETIC_REGULATION,{...opts,twoHanded:true});
 const one=baseline.rows.find(x=>x.name.startsWith('Fictional Bronze'));
 const grip=two.rows.find(x=>x.name===one.name);
 assert.equal(one.total,136);assert.equal(grip.total,152);
 const increased=rankLocalWeaponVariants(COMPACT_SYNTHETIC_REGULATION,{...opts,regularUpgrade:1});
 assert.ok(increased.rows.find(x=>x.name===one.name).total>one.total);
 const unavailable=rankLocalWeaponVariants(COMPACT_SYNTHETIC_REGULATION,{...opts,regularUpgrade:25});
 assert.equal(unavailable.rankedCount,0);
 assert.equal(unavailable.excludedCount,4);
 assert.ok(unavailable.excludedExamples.every(x=>x.reason.includes('Upgrade +25')));
});
test('legal source-defined affinities only and no fake Standard variant for synthetic rows',()=>{
 const source=structuredClone(COMPACT_SYNTHETIC_REGULATION);
 source.weapons[0].affinityId=0;source.weapons[1].affinityId=1;
 source.weapons[2].affinityId= -1;source.weapons[3].affinityId=8;
 const heavy=rankLocalWeaponVariants(source,{...opts,affinityId:1});
 assert.deepEqual(heavy.rows.map(x=>x.affinityId),[1]);
 assert.equal(heavy.rankedCount,1);
 const none=rankLocalWeaponVariants(source,{...opts,affinityId:12});
 assert.equal(none.totalMatches,0);
 assert.equal(none.rankedCount,0);
});
test('oversized queries refuse to publish a fake globally ranked subset',()=>{
 const source=structuredClone(COMPACT_SYNTHETIC_REGULATION);
 const original=source.weapons[0];
 for(let i=0;i<RANKING_MAX_VARIANTS;i++)
  source.weapons.push({...original,name:'Fictional Other '+i,weaponName:'Invented Other '+i});
 const result=rankLocalWeaponVariants(source,opts);
 assert.equal(result.status,'too-broad');
 assert.ok(result.totalMatches>RANKING_MAX_VARIANTS);
 assert.deepEqual(result.rows,[]);
 assert.match(result.message,/No partial top-AR ranking/);
});
test('all five character stats, separate regular/somber ranges and query bounds fail closed',()=>{
 for(const bad of [
  {term:'A'},{term:'x'.repeat(101)},{stats:{...stats,str:100}},
  {stats:{...stats,arc:0}},{affinityId:99},{affinityId:'Heavy'},
  {regularUpgrade:26},{regularUpgrade:-1},{somberUpgrade:11},
  {twoHanded:'true'}
 ])assert.throws(()=>rankLocalWeaponVariants(COMPACT_SYNTHETIC_REGULATION,{...opts,...bad}),RangeError);
});
test('CSV rows are exact displayed ranking order, UTF-8 BOM, sourced, and formula-injection safe',()=>{
 const r=rankLocalWeaponVariants(COMPACT_SYNTHETIC_REGULATION,opts);
 const csv=rankingToCsv(r,{sourceLabel:'FICTIONAL FIXTURE / NOT GAME'});
 assert.equal(csv.charCodeAt(0),0xfeff);
 assert.ok(csv.includes('"Nominal total AR"'));
 assert.ok(csv.includes('"FICTIONAL FIXTURE / NOT GAME"'));
 assert.equal(csv.split('\r\n').length,r.rows.length+2);
 const malicious={...r,rows:[{...r.rows[0],name:'=HYPERLINK("evil")',family:'@SUM(1,1)'}]};
 const guarded=rankingToCsv(malicious,{sourceLabel:'-Risky CSV label'});
 assert.ok(guarded.includes('"\'=HYPERLINK(""evil"")"'));
 assert.ok(guarded.includes('"\'@SUM(1,1)"'));
 assert.ok(guarded.includes('"\'-Risky CSV label"'));
 assert.throws(()=>rankingToCsv({status:'too-broad',rows:[]}),RangeError);
});

test('realistic Somber +0..10 and regular +0..25 never mix reinforcement paths',()=>{
 const source=structuredClone(COMPACT_SYNTHETIC_REGULATION);
 const regular=source.weapons[0];
 const somber={...regular,name:'Fictional Somber Sword — QA ONLY',
  weaponName:'Invented Somber Sword',affinityId:-1,reinforceTypeId:99};
 source.weapons.push(somber);
 const original=source.reinforceTypes[1][0];
 source.reinforceTypes[99]=Array.from({length:11},(_,i)=>({
  attack:{0:1+i*0.08},attributeScaling:original.attributeScaling
 }));
 const r=rankLocalWeaponVariants(source,{...opts,regularUpgrade:25,somberUpgrade:10});
 assert.equal(r.totalMatches,5);
 assert.equal(r.rankedCount,1);
 assert.equal(r.rows[0].reinforcement,'somber');
 assert.equal(r.rows[0].upgrade,10);
 assert.equal(r.rows[0].affinityId,-1);
 assert.equal(r.excludedCount,4);
 const early=rankLocalWeaponVariants(source,{...opts,regularUpgrade:0,somberUpgrade:0});
 assert.equal(early.rankedCount,5);
 assert.equal(early.rows.find(w=>w.name===somber.name).upgrade,0);
});
test('all result rows explicitly carry source gap and cannot invent real in-game certification',()=>{
 const r=rankLocalWeaponVariants(COMPACT_SYNTHETIC_REGULATION,opts);
 assert.equal(r.status,'complete-query');
 assert.match(r.note,/not game-client certified/i);
 assert.ok(r.rows.every(row=>Number.isInteger(row.total)&&
  row.total===Object.values(row.components).reduce((a,b)=>a+b,0)));
 assert.ok(r.rows.every(row=>row.reinforcement==='regular'||row.reinforcement==='somber'));
});

test('exact comma-separated names rank different families together and reject missing or duplicate names',()=>{
 const r=rankLocalWeaponVariants(COMPACT_SYNTHETIC_REGULATION,{
  ...opts,term:'Invented Bronze Sword, Invented Knives'
 });
 assert.equal(r.status,'complete-query');
 assert.equal(r.queryMode,'exact-name-list');
 assert.equal(r.rankedCount,2);
 assert.deepEqual(new Set(r.rows.map(x=>x.family)),
  new Set(['Invented Bronze Sword','Invented Knives']));
 const exactVariants=rankLocalWeaponVariants(COMPACT_SYNTHETIC_REGULATION,{
  ...opts,term:'Fictional Bronze Sword — QA ONLY, Fictional Magic Sword — QA ONLY'
 });
 assert.equal(exactVariants.rankedCount,2);
 assert.throws(()=>rankLocalWeaponVariants(COMPACT_SYNTHETIC_REGULATION,{
  ...opts,term:'Invented Bronze Sword, Not A Source Family'
 }),/No exact source weapon\/family/);
 assert.throws(()=>rankLocalWeaponVariants(COMPACT_SYNTHETIC_REGULATION,{
  ...opts,term:'Invented Bronze Sword, invented bronze sword'
 }),/unique exact weapon names/);
});
