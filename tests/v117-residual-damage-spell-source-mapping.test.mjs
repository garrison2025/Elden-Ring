import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const gold=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-residual-3x2-observed-goldens.json',import.meta.url),'utf8'));

test('three actual site profiles retain the correct caseId mapping across independent Build and Damage reads',()=>{
 assert.equal(gold.reference,'Tarnished.dev public v1.17');
 assert.equal(gold.twoIndependentChromeReadsPerScene,true);
 assert.deepEqual(gold.damage.map(x=>[x.str,x.dex,x.ar,x.buildPlannerAr,x.dpsSingle,x.dpsPaired]),[
  [15,20,376,376,464,547],
  [20,20,388,388,483,570],
  [15,25,392,392,489,577]
 ]);
 assert.ok(gold.damage.every(x=>x.referenceSameSiteArDisagreement===false));
});

test('three actual staff plus spell readings are source observations, not a falsely certified local spell formula',()=>{
 assert.deepEqual(gold.spell.map(x=>[x.int,x.magic,x.fp,x.bullets]),[
  [25,242,7,1],[30,267,7,1],[40,315,7,1]
 ]);
 assert.match(gold.note,/not yet locally calculated/i);
 assert.match(gold.note,/no invented formula/i);
});
