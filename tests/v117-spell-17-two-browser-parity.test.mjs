import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_PEBBLE_STAFF_ROWS,exactPublicPebbleSpell}
 from '../public/src/tarnished-v117-scoped-reference-scenes.mjs';
const evidence=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-spell-17-double-observed-goldens.json',import.meta.url),'utf8'));
test('all 17 twice-observed real v1.17 spell rows are exact and reachable without interpolation',()=>{
 assert.equal(evidence.real_browser_run,41362826940);
 assert.equal(evidence.independent_reads_per_profile,2);
 assert.equal(evidence.rows.length,17);
 assert.deepEqual([...V117_PEBBLE_STAFF_ROWS].filter(x=>x.int!==20).map(x=>[x.int,x.magic]),
  [...evidence.rows].sort((a,b)=>a.int-b.int).map(x=>[x.int,x.realTarnished]));
 for(const row of evidence.rows){
  const reference=exactPublicPebbleSpell({int:row.int});
  assert.equal(reference.status,'REFERENCE_UI_OBSERVED_TWICE');
  assert.equal(reference.reference.magic,row.realTarnished);
 }
 for(const int of [16,19,21,26,31,36,51,56,61,81,96,97]){
  assert.equal(exactPublicPebbleSpell({int}).status,'NOT_OBSERVED');
 }
});
test('historic old-model 13-of-17 mismatch record remains unchanged as pre-fix evidence',()=>{
 const bad=evidence.rows.filter(x=>x.delta!==0).sort((a,b)=>a.int-b.int);
 assert.deepEqual(bad.map(x=>[x.int,x.realTarnished,x.modelWithoutCalibration,x.delta]),[
  [25,242,243,1],[35,290,291,1],[50,363,362,-1],[98,499,500,1]
 ]);
 assert.equal(evidence.rows.filter(x=>x.delta===0).length,13);
 assert.equal(evidence.rows.filter(x=>x.boundaryApplied).length,1);
 assert.equal(evidence.rows.find(x=>x.boundaryApplied).int,25);
});
test('independent spell calculator remains noindex and presents corrected source-backed rounding',()=>{
 const html=readFileSync(new URL('../public/spell-calculator/index.html',import.meta.url),'utf8');
 assert.match(html,/noindex,follow/);
 assert.match(html,/18 exact sorcery scenarios/);
 assert.match(html,/integer-truncated catalyst scaling value and final rounding/);
 assert.match(html,/with no per-INT patches/);
});
