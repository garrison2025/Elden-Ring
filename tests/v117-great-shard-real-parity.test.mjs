import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_SIMPLE_SORCERIES,V117_GREAT_SHARD_DIRECT,calculatePinnedV117SimpleSorceryMagic}
 from '../public/src/v117-spell-scaling-engine.mjs';
const source=JSON.parse(readFileSync(new URL('../scripts/v117-great-shard-double-browser-evidence.json',import.meta.url),'utf8'));
test('distinct spell (not Pebble): real v1.17 Great Shard reference was read TWICE for three independent INT inputs',()=>{
 assert.equal(source.independentBrowserPasses,2);
 assert.equal(source.sourceRun,41371710168);
 assert.deepEqual(source.rows.map(x=>[x.int,x.sitePass1,x.sitePass2]),[[40,437,437],[60,570,570],[80,646,646]]);
 assert.deepEqual(V117_GREAT_SHARD_DIRECT.map(x=>[x.int,x.magic]),[[40,437],[60,570],[80,646]]);
});
test('separately sourced single-hit coefficients and FP/INT requirements are exact and case-distinct',()=>{
 assert.deepEqual(Object.keys(V117_SIMPLE_SORCERIES).sort(),[
  'Comet','Glintstone Arc','Glintstone Pebble','Great Glintstone Shard','Swift Glintstone Shard'].sort());
 assert.deepEqual(Object.entries(V117_SIMPLE_SORCERIES).map(([n,x])=>[n,x.magic,x.fp,x.intRequirement]),[
  ['Glintstone Pebble',152,7,10],['Great Glintstone Shard',211,12,16],
  ['Swift Glintstone Shard',114,5,12],['Glintstone Arc',148,9,13],['Comet',292,24,52]
 ]);
});
test('sorcery calculator and browser expose spell choice and isolate true multi-spell source certification',()=>{
 const model=readFileSync(new URL('../public/src/v117-spell-scaling-engine.mjs',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/src/spell-reference-app.mjs',import.meta.url),'utf8');
 const html=readFileSync(new URL('../public/spell-calculator/index.html',import.meta.url),'utf8');
 assert.match(model,/spellParam\.magic\/100/);
 assert.match(model,/spellParam\.intRequirement/);
 assert.match(ui,/spell:\$\('spell-math-spell'\)\.value/);
 assert.match(html,/id="spell-math-spell"/);
 const sourceEmpty={weapons:[],reinforceTypes:{},calcCorrectGraphs:{},attackElementCorrects:{}};
 const insufficient=calculatePinnedV117SimpleSorceryMagic(sourceEmpty,{spell:'Comet',intelligence:40});
 assert.equal(insufficient.status,'UNSUPPORTED_SPELL_REQUIREMENTS');
 assert.equal(insufficient.damage,null);
 assert.throws(()=>calculatePinnedV117SimpleSorceryMagic(sourceEmpty,{spell:'Imaginary Spell',intelligence:40}),/not a supported/);
});
