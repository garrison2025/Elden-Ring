#!/usr/bin/env node
/** Single, OFFLINE four-engine acceptance gate.
 * This verifies that finite direct-source evidence, local executable math,
 * and release status agree. It CANNOT turn local test success into complete
 * Tarnished.dev parity or original game-client proof.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {exactPublicPebbleSpell} from '../public/src/tarnished-v117-scoped-reference-scenes.mjs';
import {calculateManualMoveSequence} from '../public/src/damage-moveset-sequence.mjs';
import {V117_GREAT_SHARD_DIRECT} from '../public/src/v117-spell-scaling-engine.mjs';
import {emptyBuildLoadout} from '../public/src/build-loadout.mjs';
import {exactV117RunePhysickSelectedAttributes} from '../public/src/v117-rune-physick-selected-combo.mjs';
const load=(path)=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const m=load('../public/v117-verification-closure.json');
const final=m.finalFourEngineDecision;
assert.equal(m.schemaVersion,2,'A final four-engine disposition must be present');
assert.equal(final.acceptedModules,0,'No whole engine can be labelled fully parity-accepted');
assert.equal(final.limitedScopeModules,4);
assert.equal(final.wholeGameParityCertified,false);
assert.equal(final.currentGameProof.approvedGameClientGoldens,0);
assert.equal(m.notComparableWithoutMoreImplementation.length,4);
assert.deepEqual(Object.keys(final.modules).sort(),['armor','build','damage','spell']);
for(const [key,x] of Object.entries(final.modules)){
 assert.match(x.overall,/NOT_CERTIFIED|NOT_PARITY_CERTIFIED|PARITY_NOT_CERTIFIED/,
  key+': current full feature parity is NOT independently certified');
 assert.ok(x.accepted.length>=2,key+': concrete accepted scope required');
 assert.ok(x.notAccepted.length>=2,key+': unsupported behavior must be listed');
 assert.ok(x.blockers.length>=2,key+': missing source prerequisites must be explicit');
 assert.ok(x.evidence.length>=2,key+': reference/source and local tests required');
 assert.ok(!/^FULL_|^CERTIFIED_ALL|^UNRESTRICTED/.test(x.release),
  key+': unsupported module cannot be promoted by the report');
}
assert.equal(final.unobservableData.weaponRequirements.unobservable,27);
assert.equal(final.unobservableData.legacyArmor.unobservable,19);
assert.equal(final.unobservableData.nonzeroDefenseSpell.status,'NO_COMPARATOR_INPUT');
assert.equal(final.unobservableData.buildRunePhysickActivation.status,'OFF_CHECKBOX_IN_REAL_UI');
assert.deepEqual(final.modules.spell.exactByStaffAndUpgrade.map(x=>x.scenes),[18,4,2]);
const original=load('./tarnished-v117-spell-18-consensus-goldens.json').rows;
const academy25=load('./tarnished-v117-academy-staff-goldens.json').rows;
const academy20=load('./v117-academy-plus20-double-browser-evidence.json').rows;
assert.deepEqual([original.length,academy25.length,academy20.length],[18,4,2]);
const cases=[
 ...original.map(v=>({staff:"Astrologer's Staff",level:25,int:v.int,magic:v.siteMagic})),
 ...academy25.map(v=>({staff:'Academy Glintstone Staff',level:25,int:v.int,magic:v.magic})),
 ...academy20.map(v=>({staff:'Academy Glintstone Staff',level:20,int:v.int,magic:v.observedMagic}))
];
const keys=new Set();
for(const x of cases){
 const key=x.staff+':'+x.level+':'+x.int;
 assert.ok(!keys.has(key),'Duplicate supposed independent source scene: '+key);
 keys.add(key);
 const actual=exactPublicPebbleSpell({catalyst:x.staff,smithing:x.level,int:x.int});
 assert.equal(actual.status,'REFERENCE_UI_OBSERVED_TWICE',key);
 assert.equal(actual.reference.magic,x.magic,key);
}
const second=load('./v117-great-shard-double-browser-evidence.json');
assert.equal(second.independentBrowserPasses,2);
assert.equal(second.sourceRun,41371710168);
assert.equal(final.modules.spell.actualSpellKindsCovered,2);
for(const row of second.rows){
 assert.equal(row.sitePass1,row.sitePass2,'Different sorcery two browser reads differ');
 assert.equal(V117_GREAT_SHARD_DIRECT.find(x=>x.int===row.int)?.magic,row.sitePass1);
 const key='Great Glintstone Shard:Astrologer25:'+row.int;
 assert.ok(!keys.has(key));keys.add(key);
}
assert.equal(keys.size,final.modules.spell.exactTotal);
for(const no of [
 {catalyst:'Academy Glintstone Staff',smithing:20,int:50},
 {catalyst:'Academy Glintstone Staff',smithing:20,int:40,enemyDefense:1},
 {catalyst:'Academy Glintstone Staff',smithing:25,int:40,effects:true},
 {catalyst:"Astrologer's Staff",smithing:25,int:40,enemyNegation:10}
])assert.equal(exactPublicPebbleSpell(no).reference,null,'Unobserved spell conditions must not masquerade as source-verified');
const rune=load('./tarnished-v117-rune-physick-selected-combo-golden.json');
assert.equal(rune.independentBrowserReads,2);
assert.equal(rune.runeActivationCheckbox,false);
assert.equal(rune.physickActivationCheckbox,false);
assert.deepEqual(rune.observed,[15,15,15,15,15,25,15,15]);
const loadout=emptyBuildLoadout();loadout.greatRune="Godrick's Great Rune";loadout.crystalTears[0]='Intelligence-knot Crystal Tear';
const observed=exactV117RunePhysickSelectedAttributes(Array(8).fill(10),loadout);
assert.equal(observed.status,'EXACT_SAME_INPUT_SELECTED_ONLY_SITE_MATCH');
assert.deepEqual(observed.final,rune.observed);
loadout.crystalTears[1]='Unmeasured tear';
assert.equal(exactV117RunePhysickSelectedAttributes(Array(8).fill(10),loadout).status,'NOT_OBSERVED');
const enemy=Object.fromEntries(['physical','strike','slash','pierce','magic','fire','lightning','holy']
 .map(v=>[v,{defense:0,negation:0}]));
const damage=calculateManualMoveSequence({
 attack:{physical:200,magic:0,fire:0,lightning:0,holy:0},
 enemy,moves:[{label:'Manual per-hit test ONLY',frames:45,hits:2,hitMotionValues:[50,150]}]
});
assert.deepEqual(damage.perMove[0].hitDamages,[90,270]);
assert.equal(damage.damagePerSecond,480);
assert.ok(final.modules.damage.notAccepted.some(x=>/Tarnished.dev.*DPS/.test(x)));
assert.match(final.modules.armor.overall,/REFERENCE_TOP5_PARITY_NOT_CERTIFIED/);
assert.ok(final.modules.armor.notAccepted.some(x=>/ranking|Top-five|top-five|top-five|tie-breaking/i.test(x)));
const html=readFileSync(new URL('../public/validation-status/index.html',import.meta.url),'utf8');
assert.match(html,/id="four-engine-final-disposition"/);
assert.match(html,/four-engine[^"]*NOT[^<]*CERTIFIED|full-engine parity[^<]*not certified/i);
assert.match(html,/v117-verification-closure\.json/);
console.log('[FOUR ENGINES: ONE-SHOT FINITE ACCEPTANCE PASSED]',JSON.stringify({
 fullEngineParityAccepted:0,limitedScopeEngines:4,spellDirectInputMatches:keys.size,
 armor:'local exact optimization; source rank not certified',
 damage:'manual model; real named enemy DPS not certified',
 spell:'two spell kinds; 27 narrow double-browser reference scenes; five independently sourced simple coefficients',
 build:'only selected rune/tear scene and limited talisman cases; activation not certified',
 realGameClientGoldens:0,repeatAudit:'CLOSED_UNTIL_NEW_INDEPENDENT_EVIDENCE'
}));
