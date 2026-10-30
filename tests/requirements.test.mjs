import test from 'node:test';
import assert from 'node:assert/strict';
import {compareWeaponRequirements,minStrengthToTwoHand,effectiveTwoHandStrength} from '../public/src/requirements.mjs';
const stats=[16,10,10,10,10],weapon=[24,0,0,0,0];
test('publisher example: 16 STR meets 24 STR requirement standard two handed',()=>{
 const a=compareWeaponRequirements(stats,weapon);
 assert.equal(a.oneHanded.canWield,false);
 assert.equal(a.oneHanded.missing[0],8);
 assert.equal(a.twoHanded.canWield,true);
 assert.equal(a.twoHanded.effectiveStrength,24);
 assert.equal(a.twoHanded.neededRaw[0],16);
});
test('only STR benefits: unmet Dexterity stays unmet when two-handed',()=>{
 const a=compareWeaponRequirements(stats,[24,14,0,0,0]);
 assert.equal(a.twoHanded.canWield,false);
 assert.equal(a.twoHanded.missing[1],4);
 assert.equal(a.twoHanded.totalMissing,4);
 assert.equal(a.oneHanded.totalMissing,12);
});
test('special grip exception has no 1.5x STR bonus',()=>{
 const a=compareWeaponRequirements(stats,weapon,{applyTwoHandBonus:false});
 assert.equal(a.twoHanded.effectiveStrength,16);
 assert.equal(a.twoHanded.missing[0],8);
});
test('minimum STR calculation handles odd requirements exactly',()=>{
 assert.equal(minStrengthToTwoHand(0),0);
 assert.equal(minStrengthToTwoHand(24),16);
 assert.equal(minStrengthToTwoHand(25),17);
 assert.equal(minStrengthToTwoHand(99),66);
 assert.equal(effectiveTwoHandStrength(17),25);
 assert.equal(effectiveTwoHandStrength(99),148);
});
test('attribute cap, zero requirements and valid inputs',()=>{
 const a=compareWeaponRequirements([99,99,99,99,99],[0,0,0,0,0]);
 assert.equal(a.oneHanded.totalMissing,0);
 assert.equal(a.twoHanded.canWield,true);
 assert.equal(a.oneHanded.rows.length,5);
});
test('bad or missing manual data is rejected rather than implicitly converted to zero',()=>{
 assert.throws(()=>compareWeaponRequirements(['',10,10,10,10],weapon),/Strength/);
 assert.throws(()=>compareWeaponRequirements(stats,[100,0,0,0,0]),/Strength/);
 assert.throws(()=>compareWeaponRequirements([16,10,10],weapon),/five/);
 assert.throws(()=>compareWeaponRequirements(stats,weapon,{applyTwoHandBonus:'yes'}),/option/);
 assert.throws(()=>minStrengthToTwoHand(100),/requirement/);
});
