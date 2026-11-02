import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_PEBBLE_STAFF_ROWS} from '../public/src/tarnished-v117-scoped-reference-scenes.mjs';
import {TARNISHED_V117_WIDE_ARMOR_GOLDENS} from '../public/src/tarnished-v117-armor-wide.mjs';
import {TARNISHED_V117_ARMOR_RECOVERED} from '../public/src/tarnished-v117-armor-recovered.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const c=read('../public/v117-verification-closure.json');
const armor=read('../scripts/tarnished-v117-final-remaining-only-manifest.json');
const spell=read('../scripts/tarnished-v117-spell-18-consensus-goldens.json');

test('audit closure keeps original 487 weapons and 568 armor rows mathematically reconciled',()=>{
 assert.equal(c.baseData.weaponWeight.total,487);
 assert.equal(c.baseData.weaponWeight.siteVerified,487);
 assert.equal(c.baseData.weaponMinimumRequirement.siteVerified+c.baseData.weaponMinimumRequirement.unobservable,487);
 assert.equal(c.baseData.legacyArmorWeightPoise.siteVerified+c.baseData.legacyArmorWeightPoise.unobservable,568);
 assert.equal(armor.remaining.length,19);
 assert.equal(armor.existingSiteWeightPoiseApproved,549);
 assert.equal(armor.remainingUnapproved,19);
 assert.equal(TARNISHED_V117_WIDE_ARMOR_GOLDENS.length+TARNISHED_V117_ARMOR_RECOVERED.length,549);
 assert.equal(c.baseData.armorNeutralTwelveFields.legacyApproved+c.baseData.armorNeutralTwelveFields.extraDlcApproved,515);
});

test('18 real double-browser spell rows remain distinct and correspond to the closure',()=>{
 assert.equal(c.baseData.exactGlintstonePebbleStaffScenes.observed,18);
 assert.equal(c.baseData.exactGlintstonePebbleStaffScenes.independentCalculatedMatches,18);
 assert.deepEqual(c.baseData.exactGlintstonePebbleStaffScenes.observedInt,V117_PEBBLE_STAFF_ROWS.map(x=>x.int));
 assert.equal(new Set(V117_PEBBLE_STAFF_ROWS.map(x=>x.int)).size,18);
 assert.ok(spell);
});

test('full unsupported features never get inadvertently called fully verified',()=>{
 assert.equal(c.notComparableWithoutMoreImplementation.length,4);
 for(const m of c.notComparableWithoutMoreImplementation){
  assert.notEqual(m.status,'CLOSED_VERIFIED',m.module);
  assert.ok(m.blocker.trim().length>=40,'Each unsupported feature needs a concrete written blocker');
 }
 assert.match(c.stopRule,/Do not rerun completed/);
 const html=readFileSync(new URL('../public/validation-status/index.html',import.meta.url),'utf8');
 assert.match(html,/current-v117-verification-closure/);
 assert.match(html,/v117-verification-closure\.json/);
 assert.match(html,/NOT CERTIFIED/);
});
