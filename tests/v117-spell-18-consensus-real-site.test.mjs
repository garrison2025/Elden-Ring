import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_PEBBLE_STAFF_ROWS,exactPublicPebbleSpell} from '../public/src/tarnished-v117-scoped-reference-scenes.mjs';
const read=p=>JSON.parse(readFileSync(new URL('../scripts/'+p,import.meta.url),'utf8'));
const source=read('tarnished-v117-spell-18-consensus-goldens.json');
const sweep=read('tarnished-v117-spell-17-double-observed-goldens.json');
const earlier=read('tarnished-v117-four-new-spell-curve-goldens.json');
test('18 real Tarnished sorcery outputs preserve two separate evidence sets and their three overlapping exact inputs',()=>{
 assert.equal(source.twoIndependentBrowsersPerSource,true);
 assert.deepEqual(source.sourceRuns,[41362826940,41362855674]);
 assert.equal(sweep.rows.length,17);
 assert.equal(earlier.observations.length,4);
 assert.equal(source.rows.length,18);
 assert.equal(source.overlappingInputsAgree,3);
 assert.deepEqual(source.rows.map(x=>[x.int,x.siteMagic]),
  [...V117_PEBBLE_STAFF_ROWS].map(x=>[x.int,x.magic]));
 for(const r of source.rows){
  assert.equal(r.independentReads,2);
  assert.equal(exactPublicPebbleSpell({int:r.int}).reference?.magic,r.siteMagic);
 }
});
test('14/18 independent mathematical matches and exactly four disclosed off-by-one mismatches',()=>{
 assert.equal(source.summary.independentExact,14);
 assert.deepEqual(source.summary.onePointDisagreements,[
  {int:25,site:242,model:243},
  {int:35,site:290,model:291},
  {int:50,site:363,model:362},
  {int:98,site:499,model:500}
 ]);
 for(const int of [10,19,21,26,31,36,51,56,61,81,96,97])
  assert.equal(exactPublicPebbleSpell({int}).status,'NOT_OBSERVED');
});
test('all 18 observed reference inputs and corrected independent stage-accurate formula are disclosed',()=>{
 const html=readFileSync(new URL('../public/spell-calculator/index.html',import.meta.url),'utf8');
 assert.match(html,/Compare 18 exact sorcery scenarios/);
 assert.match(html,/independent algorithm below matches all 18/i);
 assert.match(html,/no per-INT patches/i);
 assert.match(html,/noindex,follow/);
});
