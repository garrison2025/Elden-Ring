import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_PEBBLE_ACADEMY_STAFF_ROWS,exactPublicPebbleSpell} from '../public/src/tarnished-v117-scoped-reference-scenes.mjs';

const data=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-academy-staff-goldens.json',import.meta.url),'utf8'));
test('Academy +25 second catalyst 4 real same-input two-browser scenes are frozen',()=>{
 assert.equal(data.site,'Tarnished.dev public v1.17');
 assert.equal(data.sourceWorkflowRun,41367503995);
 assert.equal(data.independentBrowserPasses,2);
 assert.deepEqual(data.rows.map(x=>[x.int,x.magic,x.modelMagic]),[
  [40,319,319],[50,368,368],[60,416,416],[80,472,472]
 ]);
 assert.deepEqual(V117_PEBBLE_ACADEMY_STAFF_ROWS.map(x=>[x.int,x.magic]),
  data.rows.map(x=>[x.int,x.magic]));
 for(const {int,magic} of data.rows)
  assert.equal(exactPublicPebbleSpell({int,catalyst:'Academy Glintstone Staff'}).reference?.magic,magic);
});
test('no other staff/scenes silently receive the second catalyst parity status',()=>{
 for(const int of [1,20,25,30,35,39,41,45,50.5,70,81,99])
  assert.equal(exactPublicPebbleSpell({int,catalyst:'Academy Glintstone Staff'}).status,'NOT_OBSERVED');
 for(const opt of [{smithing:24},{otherStats:[11,10,10,10,10,10,10]},{enemyNegation:1},
  {enemyDefense:1},{effects:true},{catalyst:"Lusat's Glintstone Staff"}])
  assert.equal(exactPublicPebbleSpell({int:40,catalyst:'Academy Glintstone Staff',...opt}).status,'NOT_OBSERVED');
 assert.equal(exactPublicPebbleSpell({int:40,catalyst:"Astrologer's Staff"}).reference?.magic,315);
});
test('second verified staff is selectable and the independent model knows the 4 source rows',()=>{
 const app=readFileSync(new URL('../public/src/spell-reference-app.mjs',import.meta.url),'utf8');
 const engine=readFileSync(new URL('../public/src/v117-spell-scaling-engine.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/spell-calculator/index.html',import.meta.url),'utf8');
 assert.match(html,/id="spell-reference-staff"/);
 assert.match(html,/Academy Glintstone Staff/);
 assert.match(app,/populatePresets/);
 assert.match(app,/catalyst:referenceStaff\(\)/);
 assert.match(engine,/V117_PEBBLE_ACADEMY_STAFF_ROWS/);
});
