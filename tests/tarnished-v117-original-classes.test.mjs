import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLASSES,buildLevel} from '../public/src/core.mjs';
const evidence=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-original-10-classes-direct.json',import.meta.url),'utf8'));
test('all ten non-DLC starting class base levels and eight attributes are twice-observed in public v1.17',()=>{
 const orig=CLASSES.filter(c=>!c.dlc);
 assert.equal(orig.length,10);
 assert.equal(evidence.sourceRun,41270504560);
 assert.equal(evidence.originalStartingClassCount,10);
 assert.equal(evidence.passed,10);
 assert.equal(evidence.failed,0);
 assert.equal(evidence.classes.length,10);
 assert.equal(new Set(evidence.classes.map(x=>x.name)).size,10);
 const byName=new Map(evidence.classes.map(x=>[x.name,x]));
 for(const c of orig){
  const x=byName.get(c.name);
  assert.ok(x,c.name);
  assert.equal(x.independentPasses,2);
  assert.deepEqual(x.attributes,c.stats,c.name);
  assert.equal(x.level,c.level,c.name);
  assert.equal(buildLevel(c,x.attributes),x.level);
  assert.ok(evidence.sourceJobs.includes(x.sourceJob));
 }
 assert.ok(!evidence.classes.some(x=>['Idus Knight','Heavy Knight'].includes(x.name)),
  'DLC classes must not be falsely included in public 1.17 verified sample');
});
