import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defenseMultiplier,calculateManualDamage,DAMAGE_TYPES,ENEMY_TYPES}
 from '../public/src/damage-reference-model.mjs';
const enemy=(defense=100,negation=0)=>Object.fromEntries(
 ENEMY_TYPES.map(type=>[type,{defense,negation}]));
const attack=(physical=500,magic=0)=>({physical,magic,fire:0,lightning:0,holy:0});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,'Expected '+b+', got '+a);
test('published defense curve is near-continuous at 0.125, 1, 2.5, 8 ratio breakpoints',()=>{
 near(defenseMultiplier(12.5,100),.1);
 near(defenseMultiplier(100,100),.4);
 near(defenseMultiplier(250,100),.7);
 near(defenseMultiplier(800,100),.9);
 for(const a of [12.5,100,250,800]){
  assert.ok(Math.abs(defenseMultiplier(a-1e-6,100)-
   defenseMultiplier(a+1e-6,100))<1.1e-5,
   'Published rounded 2.552 coefficient is near-, not mathematically perfectly, continuous at '+a);
 }
 near(defenseMultiplier(1,0),.9);
 near(defenseMultiplier(0,0),0);
 near(defenseMultiplier(100,10000),.1);
});
test('per-element enemy defense first, negation second; one physical 500 example',()=>{
 const e=enemy(100,0);e.physical.negation=20;
 const r=calculateManualDamage({attack:attack(),enemy:e});
 const f=.9-(8-5)**2/151.25;
 near(r.damagePerHit,Math.round(500*f*.8*1e6)/1e6);
 near(r.estimatedDps,r.damagePerHit);
 assert.equal(r.perType.length,5);
 assert.equal(r.perType[0].enemyDefense,100);
 assert.equal(r.perType[0].enemyNegation,20);
 assert.equal(r.status,'community-formula-estimate');
});
test('split 250 physical +250 magic loses more to independent defenses than pure 500 AR',()=>{
 const e=enemy();
 const pure=calculateManualDamage({attack:attack(500,0),enemy:e});
 const split=calculateManualDamage({attack:attack(250,250),enemy:e});
 assert.ok(pure.damagePerHit>split.damagePerHit);
 near(split.damagePerHit,350);
});
test('attack motion value, optional buff, physical hit type and user-entered attack rate are applied',()=>{
 const e=enemy(100,0);
 e.physical.defense=10000;
 e.strike.defense=0;e.strike.negation=-25;
 const r=calculateManualDamage({attack:attack(100,0),
  enemy:e,physicalType:'strike',motionValue:120,
  damageMultiplier:1.5,attacksPerSecond:2});
 near(r.damagePerHit,202.5); // 180 attack * .9 defense * 1.25 vulnerability
 near(r.estimatedDps,405);
 assert.equal(r.perType[0].defenseType,'strike');
 assert.equal(r.beforeDefense,180);
 const low=calculateManualDamage({attack:attack(100,0),enemy:e,
  physicalType:'physical',motionValue:120,damageMultiplier:1.5});
 near(low.damagePerHit,18); // ratio below 0.125, 10% defense multiplier
});
test('zero attack never generates damage, 100% negation blocks modeled hit, -100% doubles output',()=>{
 const z=calculateManualDamage({attack:attack(0,0),enemy:enemy()});
 assert.equal(z.damagePerHit,0);assert.equal(z.estimatedDps,0);
 const blocked=enemy(0,0);blocked.physical.negation=100;
 assert.equal(calculateManualDamage({attack:attack(500,0),enemy:blocked}).damagePerHit,0);
 blocked.physical.negation=-100;
 assert.equal(calculateManualDamage({attack:attack(500,0),enemy:blocked}).damagePerHit,900);
});
test('malformed, missing, injected, out-of-range and non-finite scenarios fail closed',()=>{
 for(const data of [
  {attack:{...attack(),physical:'NaN'},enemy:enemy()},
  {attack:attack(),enemy:enemy(),motionValue:501},
  {attack:attack(),enemy:enemy(),damageMultiplier:-1},
  {attack:attack(),enemy:enemy(),physicalType:'other'},
  {attack:attack(),enemy:enemy(),attacksPerSecond:0},
  {attack:attack(),enemy:enemy(),attacksPerSecond:21},
  {attack:attack(),enemy:enemy(),motionValue:'1e4'},
  {attack:attack(),enemy:{...enemy(),physical:null}},
  {attack:attack(),enemy:{...enemy(),fire:{defense:100,negation:101}}},
  {attack:attack(),enemy:{...enemy(),holy:{defense:100.1234,negation:0}}}
 ])assert.throws(()=>calculateManualDamage(data),RangeError);
 assert.throws(()=>defenseMultiplier('Infinity',100),RangeError);
});
test('new page uses eight enemy defense inputs and five AR inputs, noindex and source limitations',()=>{
 const html=readFileSync(new URL('../public/damage-calculator/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/src/damage-reference-app.mjs',import.meta.url),'utf8');
 const ar=readFileSync(new URL('../public/src/weapon-ar-calculator-app.mjs',import.meta.url),'utf8');
 const arHtml=readFileSync(new URL('../public/weapon-ar-calculator/index.html',import.meta.url),'utf8');
 assert.match(html,/name="robots" content="noindex,follow"/);
 for(const id of ['damage-attack-fields','damage-enemy-fields','damage-total',
  'damage-dps','damage-calculate','damage-copy'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/work in progress/);
 assert.match(app,/ENEMY_TYPES/);
 assert.match(app,/DAMAGE_TYPES/);
 assert.match(app,/calculateManualDamage/);
 assert.match(arHtml,/id="qar-damage-link"/);
 assert.match(ar,/sourceKind==='pinned'/);
 assert.match(ar,/dest\.searchParams\.set\(part.element/);
 assert.match(ar,/damageLink\.hidden=false/);
});
