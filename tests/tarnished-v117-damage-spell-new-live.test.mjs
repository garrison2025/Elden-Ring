import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const site=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-damage-spell-new-live-goldens.json',import.meta.url),'utf8'));
test('actual v1.17 Damage benchmark is an exact selected+25 katana and explicit stats, not inferred DPS formula',()=>{
 assert.equal(site.damage.weapon,'Uchigatana');
 assert.equal(site.damage.affinity,'Standard');
 assert.equal(site.damage.upgrade,25);
 assert.deepEqual([site.damage.baseStats.str,site.damage.baseStats.dex],[15,20]);
 assert.deepEqual([site.damage.observed.ar,site.damage.observed.dpsSingle,site.damage.observed.dpsPaired],[376,464,547]);
 assert.ok(site.damage.evidenceLevel.includes('NOT')===false);
});
test('actual v1.17 Spell benchmark has zero-enemy-defense spell and selected staff, not a generic scaling equation',()=>{
 assert.equal(site.spell.catalyst,"Astrologer's Staff");
 assert.equal(site.spell.spell,'Glintstone Pebble');
 assert.equal(site.spell.baseStats.int,25);
 assert.deepEqual([site.spell.observed.magic,site.spell.observed.bullets,site.spell.observed.fpCost],[242,1,7]);
 assert.equal(site.spell.enemyDefense,0);
 assert.equal(site.spell.enemyNegation,0);
});
