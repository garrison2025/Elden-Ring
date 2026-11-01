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
test('all 9 exact reference scenes have 6 independent formula agreements and 3 unresolved math discrepancies',()=>{
 assert.deepEqual(V117_PEBBLE_STAFF_ROWS.filter(x=>x.int<=60).map(x=>[x.int,x.magic]),[
  [20,219],[25,242],[30,267],[35,290],[40,315],
  [45,338],[50,363],[55,386],[60,410]
 ]);
 const independent={20:219,25:243,30:267,35:291,40:315,45:338,50:362,55:386,60:410};
 const originalNine=V117_PEBBLE_STAFF_ROWS.filter(x=>x.int<=60);
 const diff=originalNine.filter(x=>independent[x.int]!==x.magic).map(x=>x.int);
 assert.deepEqual(diff,[25,35,50]);
 assert.equal(originalNine.length-diff.length,6);
 for(const int of [21,31,36,46,51,56,61])
  assert.equal(exactPublicPebbleSpell({int}).reference,null,'No fabricated reference value for unobserved INT '+int);
});
