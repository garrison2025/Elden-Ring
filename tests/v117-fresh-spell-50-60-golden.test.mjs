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
test('all five real-reference spell outputs are distinct from independence claims',()=>{
 assert.deepEqual(V117_PEBBLE_STAFF_ROWS.filter(x=>[25,30,40,50,60].includes(x.int)).map(x=>[x.int,x.magic]),[
  [25,242],[30,267],[40,315],[50,363],[60,410]
 ]);
 assert.equal(evidence.cases[0].status,'SOURCE_MODEL_ONE_POINT_MISMATCH');
 assert.equal(evidence.cases[1].status,'INDEPENDENT_SOURCE_MODEL_MATCH');
});
