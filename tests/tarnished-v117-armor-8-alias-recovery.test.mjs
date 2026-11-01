import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TARNISHED_V117_ARMOR_RECOVERED} from '../public/src/tarnished-v117-armor-recovered.mjs';
import {applyTarnishedV117DirectArmorFields} from '../public/src/tarnished-v117-armor-direct.mjs';
const doc=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-armor-alias-recovery-10-summary.json',import.meta.url),'utf8'));
test('exact site selected 8/10 old source names twice; only six are distinct recoverable armors',()=>{
 assert.equal(doc.sourceRun,41276086880);
 assert.equal(doc.independentBrowserPassesPerCandidate,2);
 assert.equal(doc.recoveredUniqueSourceItems,6);
 assert.equal(doc.verifiedDistinctSourceItems,549);
 assert.equal(doc.stillNotConfirmedSourceItems,19);
 assert.equal(doc.duplicateLegacyRows.length,2);
 assert.equal(doc.siteNotSelectable.length,2);
 assert.deepEqual(TARNISHED_V117_ARMOR_RECOVERED,doc.recovered);
 assert.equal(new Set(TARNISHED_V117_ARMOR_RECOVERED.map(x=>x.id)).size,6);
 assert.equal(doc.duplicateLegacyRows.some(x=>x.sourceName==='Redmane Knight Helm'&&
  x.sourceSlot==='Arms'&&x.siteSlot==='Head'),true);
 assert.equal(doc.duplicateLegacyRows.some(x=>x.sourceName==='Champion Gauntlets'),true);
});
test('recover six double-observed direct site armor aliases and avoid shadow/duplicate source rows',()=>{
 const rows=TARNISHED_V117_ARMOR_RECOVERED.map((item,i)=>({
  id:item.id,name:item.sourceName,slot:item.sourceSlot,
  weight:1,poise:0,metrics:{poise:0,physical:4+i,immunity:25}
 }));
 const result=applyTarnishedV117DirectArmorFields(rows);
 assert.equal(result.recoveredDistinctArmorCount,6);
 assert.equal(result.directlyCorrectedArmorCount,6);
 assert.equal(result.correctedFields,12);
 assert.equal(result.siteUnsupportedCandidateCount,19);
 assert.equal(result.siteTwelveMetricArmorCount,0);
 for(let i=0;i<rows.length;i++){
  const r=result.armors[i],ref=TARNISHED_V117_ARMOR_RECOVERED[i];
  assert.equal(r.name,ref.siteName);
  assert.equal(r.slot,ref.siteSlot);
  assert.equal(r.weight,ref.weight);
  assert.equal(r.poise,ref.poise);
  assert.equal(r.metrics.poise,ref.poise);
  assert.equal(r.metrics.physical,rows[i].metrics.physical);
  assert.equal(r.metrics.immunity,25);
  assert.ok(r.siteDirectFields.weight.includes('Tarnished.dev'));
  assert.equal(r.siteDirectFields.physical,undefined);
 }
 assert.throws(()=>applyTarnishedV117DirectArmorFields([{...rows[0],name:'Wrong armor'}]),
  /alias identity differs/);
});
