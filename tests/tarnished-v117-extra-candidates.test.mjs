import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_ADDITIONAL_UI_CANDIDATES as c} from '../scripts/tarnished-v117-extra-candidates.mjs';
import {TARNISHED_REFERENCE_AR_CASES as approved} from '../public/src/tarnished-reference-benchmark.mjs';

const allowed=new Set(['None','Standard','Heavy','Keen','Quality','Fire','Flame Art',
 'Lightning','Sacred','Magic','Cold','Poison','Blood','Occult']);
const key=x=>JSON.stringify([x.weaponName,x.affinity,x.upgrade,
 x.str,x.dex,x.int,x.fai,x.arc,x.twoHanded,x.somber]);
const oldKey=x=>JSON.stringify([x.weaponName,x.affinity,x.upgrade,
 x.playerStats.str,x.playerStats.dex,x.playerStats.int,x.playerStats.fai,
 x.playerStats.arc,x.twoHanded,x.affinity==='None']);

test('35 new external comparator probes plus 15 existing cases form 50 UNIQUE exact-input combinations',()=>{
 assert.equal(approved.length,15);
 assert.equal(c.length,35);
 assert.equal(new Set(c.map(x=>x.id)).size,c.length);
 assert.equal(new Set(c.map(key)).size,c.length);
 assert.ok(c.every(x=>!approved.some(y=>oldKey(y)===key(x))));
 const all=new Set([...approved.map(x=>x.id),...c.map(x=>x.id)]);
 assert.equal(all.size,50);
 for(const x of c){
  assert.ok(x.id&&x.id.length<=120);
  assert.ok(typeof x.weaponName==='string'&&x.weaponName.length<=120);
  assert.ok(allowed.has(x.affinity),x.id);
  for(const k of ['str','dex','int','fai','arc'])
   assert.ok(Number.isInteger(x[k])&&x[k]>=1&&x[k]<=99,x.id+':'+k);
  assert.ok(Number.isInteger(x.upgrade)&&x.upgrade>=0&&
   x.upgrade<=(x.somber?10:25),x.id+':upgrade');
  assert.equal(typeof x.twoHanded,'boolean');
  assert.equal(typeof x.somber,'boolean');
  if(x.somber)assert.equal(x.affinity,'None','Unique Somber uses source None affinity');
 }
});

test('the new probes span previously missing elemental/status and Somber reinforcement coverage',()=>{
 const upgrades=new Set(c.filter(x=>!x.somber).map(x=>x.upgrade));
 assert.ok(upgrades.has(0)&&upgrades.has(12)&&upgrades.has(15)&&upgrades.has(20)&&upgrades.has(25));
 assert.deepEqual([...new Set(c.filter(x=>x.somber).map(x=>x.upgrade))].sort((a,b)=>a-b),[0,5,10]);
 for(const affinity of ['Fire','Flame Art','Lightning','Sacred','Magic','Cold','Poison','Blood','Occult']){
  assert.ok(c.some(x=>x.affinity===affinity),'Missing affinity '+affinity);
 }
 assert.ok(c.some(x=>x.weaponName==='Milady'),'Missing DLC family');
 assert.ok(c.some(x=>x.weaponName==="Fire Knight's Greatsword"),'Missing DLC source weapon');
 assert.ok(c.filter(x=>x.somber).length>=5,'Needs multiple unique reinforcement families');
 assert.ok(c.some(x=>x.twoHanded),'Two-handed calculator branch must be observed');
 assert.ok(new Set(c.map(x=>x.weaponName)).size>=12,'Need varied weapon families');
});

test('candidate probe code distinguishes raw observations from approved numeric benchmarks',()=>{
 const probe=readFileSync(new URL('../scripts/probe-tarnished-ui.mjs',import.meta.url),'utf8');
 const benchmark=readFileSync(new URL('../public/src/tarnished-reference-benchmark.mjs',import.meta.url),'utf8');
 assert.match(probe,/additional-unpromoted-candidate/);
 assert.match(probe,/newInputVerified/);
 assert.match(probe,/String\(c\.somber\?c\.upgrade:0\)/);
 assert.match(probe,/zero new benchmark passes auto-approved/);
 assert.ok(!benchmark.includes('V117_ADDITIONAL_UI_CANDIDATES'),
  'New candidate inputs MUST NOT increase benchmark count without independently observed numeric evidence.');
 assert.equal(approved.length,15,'New observations need explicit numeric review and repeat before promoted');
});
