import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARMOR_SNAPSHOT_SHA} from '../public/src/armor-source-optin.mjs';
const m=JSON.parse(readFileSync(new URL('../scripts/pinned-spell-talisman-enemy-source-summary.json',import.meta.url),'utf8'));
test('pinned source covers roster metadata only, never invents missing combat math',()=>{
 assert.equal(m.sourceRun,41271971311);
 assert.equal(m.sourceCommit,ARMOR_SNAPSHOT_SHA);
 assert.equal(m.totals.sourceSpells,169);
 assert.equal(m.totals.talismans,87);
 assert.equal(m.totals.bosses,106);
 assert.equal(m.totals.creatures,115);
 assert.equal(m.fields.sorceries.spellCostNumeric,71);
 assert.equal(m.fields.incantations.spellCostNumeric,98);
 assert.equal(m.fields.incantations.attributeRequirementArrays,96);
 assert.equal(m.fields.talismans.structuredNumericEffect,0);
 assert.equal(m.fields.talismans.structuredStackingRule,0);
 assert.equal(m.fields.sorceries.numericSpellScaling,0);
 assert.equal(m.fields.incantations.numericSpellScaling,0);
 assert.equal(m.fields.bosses.numericDefense,0);
 assert.equal(m.fields.creatures.numericDefense,0);
 for(const [key,row] of Object.entries(m.counts)){
  assert.equal(row.records,row.uniqueIds,key);
  assert.equal(row.records,row.nonblankNames,key);
 }
 assert.equal(m.gameClientVerified,false);
 assert.equal(m.version1_17_3Verified,false);
 assert.equal(m.dataRedistributionApproved,false);
});
