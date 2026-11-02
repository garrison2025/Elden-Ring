import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyBuildLoadout} from '../public/src/build-loadout.mjs';
import {previewSelectedRunePhysickArithmetic} from '../public/src/v117-rune-physick-selected-combo.mjs';
import {readFileSync} from 'node:fs';
function selected(){const x=emptyBuildLoadout();x.greatRune="Godrick's Great Rune";x.crystalTears[0]='Intelligence-knot Crystal Tear';return x;}
test('independent selected-only arithmetic matches the exact real Wretch10 eight-attribute public result',()=>{
 const x=previewSelectedRunePhysickArithmetic(Array(8).fill(10),selected());
 assert.equal(x.status,'EXACT_SELECTED_SCENE_MATH_SITE_MATCH');
 assert.deepEqual(x.final,[15,15,15,15,15,25,15,15]);
});
test('new changed-base preview computes a REAL arithmetic result, but never grants source-site parity',()=>{
 const x=previewSelectedRunePhysickArithmetic([20,20,20,20,20,40,20,20],selected(),{origin:'Astrologer'});
 assert.equal(x.status,'SELECTED_ATTRIBUTE_ARITHMETIC_ONLY');
 assert.deepEqual(x.final,[25,25,25,25,25,55,25,25]);
 assert.equal(x.actualReference,null);
 assert.match(x.warning,/No same-input full-Build comparison/);
});
test('active effects, stat overflow, other equipment and unmeasured tear must fail closed',()=>{
 const base=Array(8).fill(10),state=selected();
 assert.equal(previewSelectedRunePhysickArithmetic(base,state,{activatedRune:true}).status,'ACTIVE_EFFECT_UNVERIFIED');
 assert.equal(previewSelectedRunePhysickArithmetic(base,state,{activatedPhysick:true}).status,'ACTIVE_EFFECT_UNVERIFIED');
 assert.equal(previewSelectedRunePhysickArithmetic([95,10,10,10,10,95,10,10],state).status,'STAT_CAP_RULE_UNVERIFIED');
 state.armorSlots[0].name='Different equipment';
 assert.equal(previewSelectedRunePhysickArithmetic(base,state).status,'ADDITIONAL_EQUIPMENT_UNMODELED');
 state.armorSlots[0].name='';
 state.crystalTears[0]='Unmeasured';
 assert.equal(previewSelectedRunePhysickArithmetic(base,state).status,'UNKNOWN_RUNE_PHYSICK_EFFECT');
});
test('Build UI exposes independently calculated but expressly unverified other-base contexts',()=>{
 const app=readFileSync(new URL('../public/src/build-loadout-app.mjs',import.meta.url),'utf8');
 assert.match(app,/previewSelectedRunePhysickArithmetic\(topStats\(\),evaluated\.state/);
 assert.match(app,/id:'build-rune-physick-arithmetic-preview'/);
});
