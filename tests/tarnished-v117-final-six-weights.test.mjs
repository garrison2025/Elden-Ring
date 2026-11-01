import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE as historical,
 TARNISHED_V117_FINAL_SIX_WEIGHT_EVIDENCE as finalSix,
 TARNISHED_V117_ALL_DIRECT_WEIGHT_EVIDENCE as all,
 getTarnishedV117DirectWeight as get
} from '../public/src/tarnished-v117-public-weights.mjs';
const report=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-final-six-weights.json',import.meta.url),'utf8'));
const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));

test('487 unique public v1.17 weapon weights now have double-read evidence, incl 5 true zeros',()=>{
 assert.equal(historical.length,481,'keep original shard frozen for its source checks');
 assert.equal(finalSix.length,6);
 assert.equal(report.totalPreviouslyVerified,481);
 assert.equal(report.newVerified,6);
 assert.equal(report.totalVerified,487);
 assert.equal(report.emptyLoad,0);
 assert.equal(report.longswordPositiveControl,3.5);
 assert.equal(report.sourceRun,41269590190);
 assert.equal(all.length,487);
 assert.equal(new Set(all.map(x=>x.weaponName)).size,487);
 const names=new Set(catalog.weapons.map(x=>x.name));
 assert.equal(names.size,487);
 for(const w of all){
  assert.ok(names.has(w.weaponName),w.weaponName);
  assert.ok(Number.isFinite(w.weight)&&w.weight>=0,w.weaponName);
  assert.equal(w.observedTwice,true);
  assert.equal(w.comparatorVersion,'1.17');
  assert.deepEqual(get(w.weaponName),w);
 }
 for(const row of report.items){
  const w=get(row.name);
  assert.ok(w,row.name);
  assert.equal(w.weight,row.weight);
  assert.equal(row.independentVerifiedPasses,2);
  assert.equal(w.evidenceRun,41269590190);
 }
 assert.equal(finalSix.filter(x=>x.weight===0).length,5);
 assert.equal(get('Great Épée').weight,6.5);
});
