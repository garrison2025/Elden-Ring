import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARMOR_METRICS,ARMOR_SNAPSHOT_SHA} from '../public/src/armor-source-optin.mjs';
const m=JSON.parse(readFileSync(new URL('../scripts/armor-568-thirteen-metric-integrity-summary.json',import.meta.url),'utf8'));
test('pinned armor source has 568 item IDs, 13 metrics, 59 explicitly unknown numeric cells',()=>{
 assert.equal(m.sourceGitHubAction,41271717697);
 assert.equal(m.sourceCommit,ARMOR_SNAPSHOT_SHA);
 assert.equal(m.totalRows,568);assert.equal(m.distinctIds,568);
 assert.deepEqual(m.slots,{Head:167,Chest:203,Arms:94,Legs:104});
 assert.equal(m.weights.known,568);
 assert.equal(m.poiseKnown,565);
 assert.equal(m.metricCells.total,568*13);
 assert.equal(m.metricCells.sourceKnown,7325);
 assert.equal(m.metricCells.sourceUnknown,59);
 assert.equal(m.sameSlotDuplicateDisplayNames,1);
 assert.equal(Object.keys(m.metricCoverage).length,Object.keys(ARMOR_METRICS).length);
 for(const key of Object.keys(ARMOR_METRICS)){
  const stat=m.metricCoverage[key];
  assert.equal(stat.sourceKnown+stat.missing+stat.invalid,568,key);
  assert.equal(stat.invalid,0);
 }
 assert.equal(m.independentCurrentGameClientMeasurements,0);
 assert.equal(m.independentTarnishedV117PerPieceMeasurements,0);
 assert.equal(m.sourceLegalRedistributionClearance,false);
});
