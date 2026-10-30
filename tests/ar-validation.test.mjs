import test from 'node:test';
import assert from 'node:assert/strict';
import {AR_SYNTHETIC_FIXTURE as source} from '../public/data/ar-synthetic-fixture.mjs';
import {AR_SYNTHETIC_OBSERVATIONS as inputs} from '../public/data/ar-observation-example.mjs';
import {validateObservationSet,compareArObservations,arReportCsv} from '../public/src/ar-validation.mjs';
const clone=x=>structuredClone(x);
test('synthetic AR example is explicitly tagged as fictional and matches 3 regression cases',()=>{
 const r=compareArObservations(source,inputs);
 assert.deepEqual(r.summary,{total:3,matches:3,mismatches:0,errors:0});
 assert.match(r.assessment,/RESEARCH ONLY/);
 assert.ok(r.items.every(x=>x.reviewStatus.startsWith('UNREVIEWED')));
});
test('incorrect observation is reported as mismatch not silently accepted',()=>{
 const data=clone(inputs);data.cases[0].observedTotal=140;
 const r=compareArObservations(source,data);
 assert.equal(r.summary.mismatches,1);assert.equal(r.items[0].delta,-4);
});
test('missing reinforcement yields error and never interpolation',()=>{
 const data=clone(inputs);data.cases[0].upgrade=2;
 const r=compareArObservations(source,data);
 assert.equal(r.summary.errors,1);assert.match(r.items[0].error,/no supplied data/);
});
test('observed element mismatch fails even if total is equal',()=>{
 const data=clone(inputs);data.cases[0].observedElements.physical=999;
 const r=compareArObservations(source,data);
 assert.equal(r.summary.mismatches,1);assert.equal(r.items[0].elementMismatches.length,1);
});
test('version mismatch blocks results',()=>{
 const p=clone(source);p.provenance.gameVersion='test build v1';
 const r=compareArObservations(p,inputs);
 assert.equal(r.summary.errors,3);assert.ok(r.versionMismatch);
});
test('rejects duplicate IDs, invalid stats, unsupported provenance, wrong profile name and oversize data',()=>{
 const x=clone(inputs);x.cases.push(clone(x.cases[0]));assert.throws(()=>validateObservationSet(x),/Duplicate/);
 const y=clone(inputs);y.cases[0].stats.str=100;assert.throws(()=>validateObservationSet(y),/99/);
 const z=clone(inputs);z.cases[0].evidence.kind='game-verified';assert.throws(()=>validateObservationSet(z),/evidence.kind/);
 const wrong=clone(inputs);wrong.profileLabel='wrong';assert.throws(()=>compareArObservations(source,wrong),/match/);
 const large=clone(inputs);large.cases=Array.from({length:101},(_,i)=>({...clone(inputs.cases[0]),id:'case-'+i}));assert.throws(()=>validateObservationSet(large),/100/);
});
test('CSV exports escaped values without losing identifiers',()=>{
 const r=compareArObservations(source,inputs);const csv=arReportCsv(r);
 assert.ok(csv.includes('test-one-hand-plus0'));
 assert.ok(csv.includes('evidenceKind'));
 assert.equal(csv.trim().split('\r\n').length,4);
});
