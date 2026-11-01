import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_WRETCH_DEFENSE_ONE_AXIS as d,V117_WRETCH_DEFENSE_FIELD_NAMES as fields,
 V117_WRETCH_STAT_NAMES as axes,V117_WRETCH_NO_GEAR_BASELINE as base} from '../public/src/v117-wretch-defense-one-axis-direct.mjs';
const golden=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-derived-four-observed.json',import.meta.url),'utf8'));
test('8×90 actual naked Wretch profiles, each ten integers; immutable identical baseline',()=>{
 assert.equal(axes.length,8);assert.equal(fields.length,10);
 assert.deepEqual(base,[75,91,78,71,91,90,90,90,100,110]);
 for(const a of axes){
  assert.equal(d[a].length,90);assert.deepEqual(d[a][0],base);
  assert.ok(Object.isFrozen(d[a]));
  for(const row of d[a])assert.ok(Object.isFrozen(row)&&row.length===10&&row.every(Number.isInteger));
 }
});
test('direct Vigor40 reference field comparison is exact, all ten cells',()=>{
 assert.deepEqual(d.vigor[30],fields.map(n=>Number(golden.observedCases[0].fields[n].replaceAll(',',''))));
});
test('Arcane40 yields directly observed Discovery140, unrelated axes stay 110',()=>{
 assert.equal(d.arcane[30][9],140);
 for(const a of axes.filter(x=>x!=='arcane'))assert.equal(d[a][30][9],110);
});
