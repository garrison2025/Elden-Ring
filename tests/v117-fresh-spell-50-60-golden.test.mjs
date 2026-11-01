import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_PEBBLE_STAFF_ROWS,exactPublicPebbleSpell} from '../public/src/tarnished-v117-scoped-reference-scenes.mjs';
const evidence=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-pebble-int-50-60-fresh-browser-goldens.json',import.meta.url),'utf8'));
test('INT50/INT60 public v1.17 site values are both independently observed twice and frozen',()=>{
 assert.equal(evidence.realBrowserRun,41361280757);
 assert.deepEqual(evidence.cases.map(x=>[x.int,x.magic,x.independentSourceModel,x.delta]),[
  [50,363,362,-1],[60,410,410,0]
 ]);
 for(const row of evidence.cases){
  assert.equal(exactPublicPebbleSpell({int:row.int}).reference.magic,row.magic);
  assert.deepEqual(exactPublicPebbleSpell({int:row.int+1}).reference,null);
 }
});
test('18 actual spell reference rows include both prior INT50/60 source observations',()=>{
 assert.equal(V117_PEBBLE_STAFF_ROWS.length,18);
 assert.equal(V117_PEBBLE_STAFF_ROWS.find(x=>x.int===50).magic,363);
 assert.equal(V117_PEBBLE_STAFF_ROWS.find(x=>x.int===60).magic,410);
 assert.equal(evidence.cases[0].status,'SOURCE_MODEL_ONE_POINT_MISMATCH');
 assert.equal(evidence.cases[1].status,'INDEPENDENT_SOURCE_MODEL_MATCH');
});
