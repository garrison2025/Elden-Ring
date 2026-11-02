import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {emptyBuildLoadout} from '../public/src/build-loadout.mjs';
import {exactV117RunePhysickSelectedAttributes,V117_RUNE_PHYSICK_SELECTED_SCENE} from '../public/src/v117-rune-physick-selected-combo.mjs';
const source=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-rune-physick-selected-combo-golden.json',import.meta.url),'utf8'));
const baseline=Array(8).fill(10);
const selected=()=>{const x=emptyBuildLoadout();x.greatRune="Godrick's Great Rune";x.crystalTears[0]='Intelligence-knot Crystal Tear';return x;};
test('two independent real browser observations agree with separated item delta arithmetic for one selected Wretch scene',()=>{
 assert.equal(source.independentBrowserReads,2);
 assert.equal(source.run,41368151680);
 assert.deepEqual(source.observed,[15,15,15,15,15,25,15,15]);
 assert.deepEqual(source.independentIsolatedDeltaSum,[5,5,5,5,5,15,5,5]);
 assert.equal(source.runeActivationCheckbox,false);
 assert.equal(source.physickActivationCheckbox,false);
 const actual=exactV117RunePhysickSelectedAttributes(baseline,selected());
 assert.equal(actual.status,'EXACT_SAME_INPUT_SELECTED_ONLY_SITE_MATCH');
 assert.deepEqual(actual.final,source.observed);
 assert.equal(actual.reference.sourceRun,source.run);
 assert.deepEqual(actual.reference.activationControls,{rune:false,physick:false});
});
test('other classes, base stats, equipment, talismans and additional tears are NOT certified',()=>{
 assert.equal(exactV117RunePhysickSelectedAttributes(baseline,selected(),{origin:'Astrologer'}).status,'NOT_OBSERVED');
 assert.equal(exactV117RunePhysickSelectedAttributes([11,...Array(7).fill(10)],selected()).status,'NOT_OBSERVED');
 const cases=[x=>{x.talismans[0]='Starscourge Heirloom'},x=>{x.weaponSlots[0].id='test'},
  x=>{x.armorSlots[0].name='Test Helm'},x=>{x.spells[0]='Glintstone Pebble'},
  x=>{x.crystalTears[1]='Other Tear'},x=>{x.greatRune='Other Great Rune'}];
 for(const edit of cases){
  const x=selected();edit(x);
  assert.equal(exactV117RunePhysickSelectedAttributes(baseline,x).status,'NOT_OBSERVED');
 }
 assert.throws(()=>exactV117RunePhysickSelectedAttributes(Array(8).fill(100),selected()),/1–99/);
});
test('Build UI explicitly shows this reference selection only, not real activation',()=>{
 const ui=readFileSync(new URL('../public/src/build-loadout-app.mjs',import.meta.url),'utf8');
 assert.match(ui,/build-v117-rune-physick-selected-combo/);
 assert.match(ui,/runeTear.warning/);
 assert.match(V117_RUNE_PHYSICK_SELECTED_SCENE.scope,/NOT actual in-game activation/);
});