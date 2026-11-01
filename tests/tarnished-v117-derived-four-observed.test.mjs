import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const x=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-derived-four-observed.json',import.meta.url),'utf8'));
test('four genuine Wretch Build Stats reference snapshots remain precise unbuffed goldens',()=>{
 assert.equal(x.siteRun,41281523364);
 assert.equal(x.observedCases.length,4);
 const c=x.observedCases.map(y=>y.fields);
 assert.deepEqual(c.map(v=>v['HP']),['1,450','1,450','1,450','1,450']);
 assert.deepEqual(c.map(v=>v['FP']),['78','173','173','173']);
 assert.deepEqual(c.map(v=>v['Stamina']),['96','96','121','121']);
 assert.deepEqual(c.map(v=>v['Discovery']),['110','110','110','140']);
 assert.deepEqual(c.map(v=>v['Physical Defense']),['87','95','101','124']);
 assert.deepEqual(c.map(v=>v['Holy Defense']),['103','111','117','173']);
 for(const d of c)assert.equal(d['Physical Dmg Negation'],'0.000');
});
