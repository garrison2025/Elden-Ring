import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const ar=JSON.parse(read('../scripts/tarnished-v117-broad-ar-30-verified.json'));
const armor=JSON.parse(read('../scripts/armor-568-thirteen-metric-integrity-summary.json'));
const other=JSON.parse(read('../scripts/pinned-spell-talisman-enemy-source-summary.json'));
test('accuracy dashboard and README distinguish source completeness from public browser and game-client proof',()=>{
 const html=read('../public/validation-status/index.html');
 const md=read('../README.md');
 assert.equal(ar.counts.total,30);assert.equal(ar.counts.matched,30);
 assert.equal(armor.totalRows,568);
 assert.equal(armor.metricCells.sourceKnown,7325);
 assert.equal(armor.metricCells.sourceUnknown,59);
 assert.equal(other.totals.sourceSpells,169);
 assert.equal(other.totals.talismans,87);
 assert.equal(other.totals.bosses,106);
 assert.equal(other.totals.creatures,115);
 for(const snippet of ['30 / 30','7,366 / 7,384','169 / 87','106 / 115',
 '13 regular affinities','Missing game combat parameters remain UNKNOWN'])
  assert.ok(html.includes(snippet),snippet);
 assert.ok(html.includes('name="robots" content="noindex,nofollow"'));
 assert.ok(html.includes('Icerind Hatchet remains unresolved'));
 assert.match(md,/116 exact-input comparisons matched/);
 assert.match(md,/18 UNKNOWN/);
 assert.match(md,/all research and unverified combat routes remain noindexed/);
 assert.equal(other.gameClientVerified,false);
 assert.equal(armor.independentCurrentGameClientMeasurements,0);
});
