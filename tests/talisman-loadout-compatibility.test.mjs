import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyBuildLoadout,evaluateBuildLoadout} from '../public/src/build-loadout.mjs';
import {reviewTalismanLoadoutCompatibility as review} from '../public/src/talisman-loadout-compatibility.mjs';
import {observedV117TalismanPair} from '../public/src/v117-selected-pair-preview.mjs';
import {previewV117ExactTalismanCombination} from '../public/src/v117-multi-talisman-reference.mjs';
import {readFileSync} from 'node:fs';

const equip=(...names)=>{
 const state=emptyBuildLoadout();
 names.forEach((n,i)=>{state.talismans[i]=n;});
 state.maxEquipLoad='100';
 return state;
};
const evaluate=(...names)=>evaluateBuildLoadout(equip(...names),{weapons:[]});
const base=Array(8).fill(10);

test('a same-name talisman in two slots cannot claim an equipped total or roll tier',()=>{
 const x=evaluate('Silver Scarab','Silver Scarab');
 assert.equal(x.compatibility.status,'UNWEARABLE');
 assert.deepEqual(x.compatibility.conflicts.map(c=>c.type),['duplicate-item']);
 assert.equal(x.compatibility.conflicts[0].evidence,'independent-documentation-only');
 assert.equal(x.exactTotal,null);
 assert.equal(x.tier,null);
 assert.ok(x.knownWeight>0); // A raw arithmetic sum is NOT a wearable load.
 assert.match(x.warnings.join(' '),/NOT an actual equipped weight/);
});

test('Radagon variants are blocked in both orders, without lying about reverse-order live proof',()=>{
 for(const names of [
  ["Radagon's Scarseal","Radagon's Soreseal"],
  ["Radagon's Soreseal","Radagon's Scarseal"]
 ]){
  const x=evaluate(...names);
  assert.equal(x.compatibility.status,'UNWEARABLE');
  assert.equal(x.exactTotal,null);
  assert.equal(x.tier,null);
  const c=x.compatibility.conflicts[0];
  assert.equal(c.evidence,'direct-site-one-order-plus-independent-documentation');
  assert.match(c.note,/Reverse order/);
 }
 const directlyMeasured=equip("Radagon's Scarseal","Radagon's Soreseal");
 assert.equal(previewV117ExactTalismanCombination(base,directlyMeasured).status,'source-exclusivity-observed');
 const reverse=equip("Radagon's Soreseal","Radagon's Scarseal");
 assert.equal(previewV117ExactTalismanCombination(base,reverse).status,'combination-not-directly-verified');
});

test('Marika variant restriction is secondary documentation, not claimed as a live two-pass site result',()=>{
 for(const names of [
  ["Marika's Scarseal","Marika's Soreseal"],
  ["Marika's Soreseal","Marika's Scarseal"]
 ]){
  const x=evaluate(...names);
  assert.equal(x.compatibility.status,'UNWEARABLE');
  assert.equal(x.exactTotal,null);
  assert.equal(x.compatibility.conflicts[0].evidence,'independent-documentation-only');
  assert.equal(previewV117ExactTalismanCombination(base,equip(...names)).status,'combination-not-directly-verified');
 }
});

test('mixed conflict with third talisman cannot be masked by valid individual weights',()=>{
 const x=evaluate("Radagon's Soreseal","Marika's Scarseal","Marika's Soreseal");
 assert.equal(x.compatibility.conflicts.length,1);
 assert.equal(x.compatibility.conflicts[0].family,'Marika seal variants');
 assert.equal(x.exactTotal,null);
 assert.equal(x.tier,null);
});

test('known good mixed pairs preserve source exact numbers and ordinary equip-weight calculation',()=>{
 const valid=equip("Radagon's Scarseal","Marika's Scarseal");
 const a=evaluateBuildLoadout(valid,{weapons:[]});
 assert.equal(a.compatibility.status,'NO_DOCUMENTED_CONFLICT');
 assert.equal(a.exactTotal,1.6);
 assert.equal(a.tier.tier,'Light');
 assert.equal(observedV117TalismanPair(base,valid).record.metrics.physical,-21);
 const b=equip("Radagon's Soreseal","Marika's Soreseal");
 assert.equal(evaluateBuildLoadout(b,{weapons:[]}).exactTotal,1.6);
 assert.equal(previewV117ExactTalismanCombination(base,b).observation.negation.physical,-32.25);
});

test('unknown distinct items do not invent conflicts and still prevent unverified weight totals',()=>{
 const x=evaluate('Unknown talisman A','Unknown talisman B');
 assert.equal(x.compatibility.status,'NO_DOCUMENTED_CONFLICT');
 assert.equal(x.compatibility.conflicts.length,0);
 assert.equal(x.exactTotal,null);
 assert.equal(x.unknowns.length,2);
 assert.match(x.compatibility.note,/does NOT certify/);
});

test('compatibility API rejects malformed inputs rather than producing an empty safe verdict',()=>{
 assert.throws(()=>review([]),TypeError);
 assert.throws(()=>review(['A','B','C',null]),TypeError);
 assert.throws(()=>review('Radagon'),TypeError);
});

test('Build page explicitly shows blocked loadouts and unmatched multi-effect evidence limits',()=>{
 const js=readFileSync(new URL('../public/src/build-loadout-app.mjs',import.meta.url),'utf8');
 for(const s of [
  'Unwearable talisman selection',
  'Raw source-weight sum (NOT an equipped load)',
  'Talisman compatibility blocks this build',
  'Combined talisman effects not source-verified for these inputs'
 ])assert.ok(js.includes(s),s);
});
