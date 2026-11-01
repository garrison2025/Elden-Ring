import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TARNISHED_V117_ARMOR_STABLE_METRICS} from '../public/src/tarnished-v117-armor-12-fields.mjs';
import {TARNISHED_V117_WIDE_ARMOR_GOLDENS} from '../public/src/tarnished-v117-armor-wide.mjs';
import {applyTarnishedV117DirectArmorFields} from '../public/src/tarnished-v117-armor-direct.mjs';
const manifest=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-armor-12-metric-site-observations.json',import.meta.url),'utf8'));
const keys=['physical','strike','slash','pierce','magic','fire','lightning','holy',
 'immunity','robustness','focus','vitality'];
const stable=new Map(TARNISHED_V117_ARMOR_STABLE_METRICS.map(x=>[x.id,x]));
test('15 real site shards x2 observed all 12 displayed fields on 543, but only 514 safe standalone armor records',()=>{
 assert.equal(manifest.sourceRun,41275364824);
 assert.equal(manifest.independentBrowserReadsPerItem,2);
 assert.deepEqual(manifest.counts,{
  attempted:568,selectedTwice:543,selectedButFinalStatsChanged:29,
  finalStatsStable:514,stableWithTwelveUsable:514,stableRejectedNumeric:0,
  unobserved:25,siteVisibleFieldsTwiceRead:6516,stablePerPieceFieldValues:6168
 });
 assert.deepEqual(manifest.baselineResistances,{
  immunity:[90],robustness:[90],focus:[90],vitality:[100]
 });
 assert.equal(TARNISHED_V117_ARMOR_STABLE_METRICS.length,514);
 assert.equal(stable.size,514);
 assert.equal(manifest.selectedSiteOutputs.length,543);
 assert.equal(manifest.contextualOnly.length,29);
 assert.equal(manifest.unobserved.length,25);
 const site=new Map(manifest.selectedSiteOutputs.map(x=>[x.id,x]));
 for(const verified of TARNISHED_V117_ARMOR_STABLE_METRICS){
  const actual=site.get(verified.id);
  assert.ok(actual&&actual.selectedTwice&&actual.exactFinalCharacterStatsUnchanged);
  assert.equal(actual.name,verified.name);
  assert.equal(actual.slot,verified.slot);
  assert.deepEqual(Object.keys(verified.metrics).sort(),[...keys].sort());
  for(const k of keys){
   const measured=actual.observed[k];
   const expected=k==='immunity'||k==='robustness'||k==='focus'||k==='vitality'?
    measured.siteOutput-measured.baseline:measured.siteOutput;
   if(!['immunity','robustness','focus','vitality'].includes(k))
    assert.equal(measured.baseline,0,'unbuffed Wretch negation baseline must be zero');
   assert.ok(Math.abs(expected-verified.metrics[k])<1e-6,verified.name+'/'+k);
  }
 }
 for(const x of manifest.contextualOnly)assert.equal(stable.has(x.id),false,
  'stat-modifying armor may not receive stat-neutral per-piece override');
});
test('Only stat-neutral site-derived fields apply; changing-stat crowns retain unknown additional metric fields',()=>{
 const source=TARNISHED_V117_WIDE_ARMOR_GOLDENS.map((w,i)=>({
  id:w.id,name:w.name,slot:w.slot,weight:w.weight,poise:w.poise+1,
  metrics:{poise:w.poise+1,physical:0,immunity:1,fire:-5}
 }));
 const res=applyTarnishedV117DirectArmorFields(source);
 assert.equal(res.directlyCorrectedArmorCount,543);
 assert.equal(res.siteTwelveMetricArmorCount,514);
 assert.equal(res.siteAdditionalMetricFields,6168);
 assert.equal(res.correctedFields,7254);
 for(const row of res.armors){
  const want=stable.get(row.id);
  if(want){
   assert.equal(row.metrics.physical,want.metrics.physical);
   assert.equal(row.metrics.immunity,want.metrics.immunity);
   assert.equal(row.siteDirectFields.physical.includes('Tarnished.dev'),true);
   assert.equal(row.siteDirectFields.immunity.includes('Wretch 10 baseline'),true);
  }else{
   assert.equal(row.metrics.physical,0);
   assert.equal(row.metrics.immunity,1);
   assert.equal(row.siteDirectFields.physical,undefined);
  }
  assert.equal(row.poise,TARNISHED_V117_WIDE_ARMOR_GOLDENS.find(w=>w.id===row.id).poise);
 }
});
