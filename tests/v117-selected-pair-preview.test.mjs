import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyBuildLoadout} from '../public/src/build-loadout.mjs';
import {observedV117TalismanPair as resolve} from '../public/src/v117-selected-pair-preview.mjs';
import {V117_SELECTED_TALISMAN_PAIR_DIRECT as PAIRS} from '../public/src/v117-selected-talisman-pair-direct.mjs';
const base=Array(8).fill(10);
const input=(names)=>{const state=emptyBuildLoadout();state.talismans.splice(0,names.length,...names);return state;};
test('all four two-talisman results are numerical DIRECT v1.17 site rows, double-read with matched identity',()=>{
 assert.equal(PAIRS.length,4);
 for(const x of PAIRS){
  const output=resolve(base,input(x.combo));
  assert.equal(output.status,'direct-site-same-input-selected-pair');
  assert.deepEqual(output.record.combo,x.combo);
  assert.deepEqual(output.record.stats,x.stats);
  assert.ok(x.weight>0&&x.maxEquipLoad>=48.2);
  assert.equal(Object.keys(x.metrics).length,12);
  assert.equal(x.sourceJobs.length,2);
  assert.notEqual(x.sourceJobs[0],x.sourceJobs[1]);
 }
});
test('two separate Radagon+Marika -10% penalty seals yield directly observed -21% not naive -20%',()=>{
 const x=resolve(base,input(["Radagon's Scarseal","Marika's Scarseal"]));
 assert.equal(x.status,'direct-site-same-input-selected-pair');
 for(const k of ['physical','strike','slash','pierce','magic','fire','lightning','holy'])
  assert.equal(x.record.metrics[k],-21);
 assert.deepEqual(x.record.stats,Array(8).fill(13));
 assert.equal(x.record.weight,1.6);
});
test('confirmed two different load boosters 61.9 max; HP dual medallion 465 not naïvely combined',()=>{
 const a=resolve(base,input(["Great-Jar's Arsenal","Erdtree's Favor +2"])).record;
 assert.equal(a.maxEquipLoad,61.9);assert.equal(a.weight,3);
 assert.equal(a.vitals.HP,430);assert.equal(a.vitals.Stamina,105);
 const b=resolve(base,input(["Crimson Amber Medallion +2","Erdtree's Favor +2"])).record;
 assert.equal(b.vitals.HP,465);assert.equal(b.weight,1.8);assert.equal(b.maxEquipLoad,52);
});
test('other origin, changed Vigor, other gear and unobserved orders NEVER get exact site parity badge',()=>{
 const s=input(["Radagon's Scarseal","Marika's Scarseal"]);
 assert.equal(resolve(base,s,{origin:'Samurai'}).record,null);
 assert.equal(resolve([11,...base.slice(1)],s).record,null);
 s.greatRune="Godrick's Great Rune";
 assert.equal(resolve(base,s).status,'matching-names-unverified-context');
 const reversed=input(["Marika's Scarseal","Radagon's Scarseal"]);
 assert.equal(resolve(base,reversed).status,'no-direct-matching-talisman-pair');
 const unrelated=input(['Starscourge Heirloom','Silver Scarab']);
 assert.equal(resolve(base,unrelated).record,null);
 assert.throws(()=>resolve(Array(8).fill(100),unrelated),RangeError);
});
