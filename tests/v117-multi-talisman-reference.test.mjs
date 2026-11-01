import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyBuildLoadout,evaluateBuildLoadout} from '../public/src/build-loadout.mjs';
import {previewV117ExactTalismanCombination as view} from '../public/src/v117-multi-talisman-reference.mjs';
import {V117_EXACT_TALISMAN_COMBOS as CASES,
 V117_REFERENCE_REJECTED_TALISMAN_COMBOS as EXCLUDED} from '../public/src/v117-talisman-combos-direct.mjs';
const base=Array(8).fill(10);
const equip=names=>{const x=emptyBuildLoadout();names.forEach((n,i)=>{x.talismans[i]=n});return x};
test('five independently double-read real site combinations exactly equal same-input Wretch10 selected items and ten actual fields',()=>{
 assert.equal(CASES.length,5);
 for(const c of CASES){
  const x=view(base,equip(c.names));
  assert.equal(x.status,'direct-site-same-input-combination');
  assert.deepEqual(x.observation.names,c.names);
  assert.deepEqual(x.observation.stats,c.stats);
  assert.equal(c.sourceJobs.length,2);
  assert.notEqual(c.sourceJobs[0],c.sourceJobs[1]);
  assert.equal(c.acceptedAll,true);
  assert.equal(Object.keys(c.negation).length,8);
  assert.equal(x.observation.vitals.HP,c.vitals.HP);
  assert.equal(evaluateBuildLoadout(equip(c.names),{weapons:[]}).exactTotal,c.weight);
 }
});
test('observed overlapping two Soreseals show -32.25% displayed negation, not -30% additive',()=>{
 const c=CASES.find(x=>x.names.join('|')==="Radagon's Soreseal|Marika's Soreseal");
 assert.ok(c);
 assert.deepEqual(c.stats,Array(8).fill(15));
 for(const value of Object.values(c.negation))assert.equal(value,-32.25);
 assert.equal(c.vitals.HP,522);assert.equal(c.vitals.FP,95);
});
test('source-matched Radagon Soreseal + Erdtree Favor +2 yields exact Wretch HP/FP/stamina and capacity',()=>{
 const c=CASES.find(x=>x.names.includes("Radagon's Soreseal")&&x.names.includes("Erdtree's Favor +2"));
 assert.equal(c.vitals.HP,542);
 assert.equal(c.vitals.Stamina,115);
 assert.equal(c.maxEquipLoad,60.6);
 assert.equal(c.weight,2.3);
});
test('real public v1.17 excludes second Radagon Scarseal+Soreseal, so two-item requested weight is NOT a measured equipped load',()=>{
 assert.equal(EXCLUDED.length,1);
 const blocked=EXCLUDED[0];
 assert.deepEqual(blocked.names,["Radagon's Scarseal","Radagon's Soreseal"]);
 assert.deepEqual(blocked.actualNames,["Radagon's Scarseal"]);
 assert.equal(blocked.mutuallyExclusive,true);
 assert.equal(blocked.acceptedAll,false);
 const input=equip(blocked.names);
 assert.equal(view(base,input).status,'source-exclusivity-observed');
 const o=evaluateBuildLoadout(input,{weapons:[]});
 assert.equal(o.exactTotal,null);
 assert.ok(o.unknowns.some(x=>x.slot==='Talisman compatibility'));
 assert.match(o.warnings.join(' '),/did not retain/);
});
test('reversed ordering, mixed Wretch attributes, other equipment and different origins do not borrow source-exact combo goldens',()=>{
 const target=CASES[0].names;
 assert.equal(view(base,equip([...target].reverse())).status,'combination-not-directly-verified');
 assert.equal(view([11,...base.slice(1)],equip(target)).status,'not-site-certified-context');
 assert.equal(view(base,equip(target),{origin:'Samurai'}).status,'not-site-certified-context');
 const extra=equip(target);extra.spells[0]='Glintstone Pebble';
 assert.equal(view(base,extra).status,'not-site-certified-context');
 const other=equip(target);other.talismans[3]="Random talisman";
 assert.equal(view(base,other).status,'combination-not-directly-verified');
 assert.equal(view(base,equip([])).status,'not-multiple');
});
