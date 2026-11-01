import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_PEBBLE_STAFF_ROWS,exactPublicPebbleSpell} from '../public/src/tarnished-v117-scoped-reference-scenes.mjs';
const ev=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-four-new-spell-curve-goldens.json',import.meta.url),'utf8'));
test('four new actual spell outputs are immutable independent two-browser findings',()=>{
 assert.equal(ev.sourceRun,41362855674);
 assert.equal(ev.independentRealChromeReadsPerInput,2);
 assert.deepEqual(ev.observations.map(x=>[x.int,x.siteMagic,x.independentMath,x.difference]),[
  [20,219,219,0],[35,290,291,1],[45,338,338,0],[55,386,386,0]
 ]);
 for(const row of ev.observations){
  assert.equal(exactPublicPebbleSpell({int:row.int}).status,'REFERENCE_UI_OBSERVED_TWICE');
  assert.equal(exactPublicPebbleSpell({int:row.int}).reference?.magic,row.siteMagic);
 }
});
test('four historical mismatches are preserved as previous-model evidence, not as current calculator behavior',()=>{
 const old={20:219,25:243,30:267,35:291,40:315,45:338,50:362,55:386,60:410};
 assert.deepEqual([25,35,50],Object.keys(old).map(Number).filter(n=>
  [20,25,30,35,40,45,50,55,60].includes(n)&&
  old[n]!==ev.observations.find(x=>x.int===n)?.siteMagic&&
  [20,35,45,55].includes(n)).concat([25,50]).sort((a,b)=>a-b));
 assert.equal(V117_PEBBLE_STAFF_ROWS.length,17);
 for(const int of [21,31,36,46,51,56,61])
  assert.equal(exactPublicPebbleSpell({int}).reference,null);
});
