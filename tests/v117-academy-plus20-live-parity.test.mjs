import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_PEBBLE_ACADEMY_PLUS20_ROWS,exactPublicPebbleSpell}
 from '../public/src/tarnished-v117-scoped-reference-scenes.mjs';

const evidence=JSON.parse(readFileSync(new URL('../scripts/v117-academy-plus20-double-browser-evidence.json',import.meta.url),'utf8'));
test('two independent real +20 academy scenes are traceable and numerically equal',()=>{
 assert.equal(evidence.workflowRun,41369361678);
 assert.equal(evidence.independentChromiumPasses,2);
 assert.equal(evidence.allIndependentNumericalMatches,true);
 assert.deepEqual(evidence.rows.map(x=>[x.int,x.observedMagic,x.independentMagic,x.delta]),
  [[40,294,294,0],[60,379,379,0]]);
 assert.deepEqual(V117_PEBBLE_ACADEMY_PLUS20_ROWS.map(x=>[x.int,x.magic]),[[40,294],[60,379]]);
 for(const {int,observedMagic} of evidence.rows)
  assert.equal(exactPublicPebbleSpell({int,catalyst:'Academy Glintstone Staff',smithing:20}).reference?.magic,observedMagic);
});
test('reference-only +20 cannot silently certify other inputs, staffs or enemy defenses',()=>{
 for(const int of [1,20,25,35,39,41,50,59,61,80,99]){
  assert.equal(exactPublicPebbleSpell({int,catalyst:'Academy Glintstone Staff',smithing:20}).reference,null);
 }
 for(const values of [{catalyst:"Astrologer's Staff"},{smithing:19},{enemyDefense:1},
  {enemyNegation:1},{effects:true},{somber:0},{otherStats:[11,10,10,10,10,10,10]}]){
  assert.equal(exactPublicPebbleSpell({int:40,catalyst:'Academy Glintstone Staff',smithing:20,...values}).reference,null);
 }
 assert.equal(exactPublicPebbleSpell({int:40,catalyst:'Academy Glintstone Staff',smithing:25}).reference?.magic,319);
 assert.equal(exactPublicPebbleSpell({int:40,catalyst:"Astrologer's Staff",smithing:25}).reference?.magic,315);
 assert.equal(evidence.referenceEnemyDefenseControl,false);
});
test('site reference UI and independent engine select correct upgrade without making target parity claims',()=>{
 const app=readFileSync(new URL('../public/src/spell-reference-app.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/spell-calculator/index.html',import.meta.url),'utf8');
 const model=readFileSync(new URL('../public/src/v117-spell-scaling-engine.mjs',import.meta.url),'utf8');
 assert.match(html,/id="spell-reference-upgrade"/);
 assert.match(html,/assumes zero enemy defenses and resistances/);
 assert.match(app,/referenceUpgrade\(\)/);
 assert.match(app,/configureUpgrade/);
 assert.match(model,/V117_PEBBLE_ACADEMY_PLUS20_ROWS/);
});