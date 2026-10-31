import test from 'node:test';
import assert from 'node:assert/strict';
import {COMPACT_SYNTHETIC_REGULATION} from '../public/data/ar-compact-synthetic.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {createLocalArValidationPlan,makeUnreviewedArObservationBatch}
 from '../public/src/ar-game-validation-plan.mjs';
import {recheckUnreviewedArBatch} from '../public/src/ar-observation-batch-recheck.mjs';
import {recheckUnreviewedArDraft} from '../public/src/ar-observation-recheck.mjs';

const root=COMPACT_SYNTHETIC_REGULATION;
const version='FICTIONAL-RESEARCH-ONLY';
const weaponName='Fictional Bronze Sword — QA ONLY';
const stats={str:40,dex:20,int:10,fai:10,arc:10};
const plan=()=>createLocalArValidationPlan(convertCompactRegulation(root,{
 weaponName,gameVersion:version,sourceReference:'independently invented synthetic test values'
}),stats);
const options={gameAppVersion:'1.17.2',regulationVersion:'1.17.3',
 platform:'PC',observedAt:'2026-10-31'};
const fp=(name,hash)=>({algorithm:'SHA-256',sha256:hash.repeat(64),
 byteLength:128,mediaType:'image/png',filename:name,
 screenshotReviewed:false,gameClientVerified:false});
const make=(observations,p=plan())=>makeUnreviewedArObservationBatch(p,{
 ...options,observations
});
const draftRows=()=>{const p=plan();return [
 {caseId:p.cases[0].caseId,observedTotal:p.cases[0].candidateTotal,
  evidenceReference:'menu-one.png',screenshotFingerprint:fp('menu-one.png','a')},
 {caseId:p.cases[1].caseId,observedTotal:p.cases[1].candidateTotal+1,
  evidenceReference:'menu-two.png',screenshotFingerprint:fp('menu-two.png','b')}
];};
const recheck=batch=>recheckUnreviewedArBatch(root,{
 gameVersion:version,sourceReference:'fictional local source',batch
});

test('export keeps independent evidence records and a real zero-reviewed gate',()=>{
 const batch=make(draftRows());
 assert.equal(batch.submittedCases,2);
 assert.equal(batch.numericalMatches,1);
 assert.equal(batch.fingerprintedCases,2);
 assert.equal(batch.screenshotReviewedCount,0);
 assert.equal(batch.gameClientVerified,false);
 assert.equal(batch.publicationApproved,false);
 const report=recheck(batch);
 assert.equal(report.statusCounts['candidate-reproduced-unreviewed'],2);
 assert.equal(report.storedFingerprintCount,2);
 assert.equal(report.reviewedScreenshotCount,0);
 assert.equal(report.gameClientVerified,false);
});

test('distinct AR scenarios cannot reuse the same reference or identical screenshot hash',()=>{
 const rows=draftRows();
 assert.throws(()=>make([{...rows[0]},{
  ...rows[1],evidenceReference:'MENU-ONE.PNG',
  screenshotFingerprint:fp('MENU-ONE.PNG','b')
 }]),/distinct evidence reference/);
 assert.throws(()=>make([{...rows[0]},{
  ...rows[1],screenshotFingerprint:fp('menu-two.png','a')
 }]),/One screenshot cannot support multiple/);
 assert.equal(make(rows).fingerprintedCases,2);
});

test('plan cannot be relabelled as a genuine evidence plan without matching provenance and untouched cases',()=>{
 const p=plan(),rows=[draftRows()[0]];
 for(const change of [
  {sourceProvenanceStatus:'synthetic-test'},
  {sourceLevels:[]},
  {weaponName:'Another Weapon'}
 ])assert.throws(()=>make(rows,{...p,...change}),/non-synthetic|Invalid or duplicate test case/);
 for(const mutation of [
  c=>{c.gameClientVerified=true;},
  c=>{c.reviewStatus='REVIEWED';},
  c=>{c.observedTotal=999;},
  c=>{c.evidenceReference='injected.png';},
  c=>{c.upgrade=25;}
 ]){
  const tampered=structuredClone(p);mutation(tampered.cases[0]);
  assert.throws(()=>make(rows,tampered),/Invalid or duplicate test case/);
 }
});

test('batch recheck detects forged summary counters rather than displaying fake matches',()=>{
 const normal=make(draftRows());
 for(const patch of [
  {numericalMatches:2}, {fingerprintedCases:0}, {plannedCases:1},
  {sourceVersion:''},{weaponName:''}
 ])assert.throws(()=>recheck({...normal,...patch}),RangeError);
});

test('batch recheck isolates cross-weapon and cross-source contamination per case',()=>{
 const normal=make(draftRows());
 const changes=[
  x=>{x.exactInputs.weaponName='Not matching batch';},
  x=>{x.candidateCalculation.parameterSourceVersion='another-source';},
 ];
 for(const mutate of changes){
  const changed=structuredClone(normal);
  mutate(changed.observations[0].observation);
  const report=recheck(changed);
  assert.equal(report.statusCounts['recheck-rejected'],1);
  assert.equal(report.statusCounts['candidate-reproduced-unreviewed'],1);
  assert.equal(report.storedFingerprintCount,1);
  assert.equal(report.reviewedScreenshotCount,0);
 }
});

test('rechecking a tampered batch does not accept repeated screenshot identity',()=>{
 const batch=make(draftRows());
 const repeated=structuredClone(batch);
 repeated.observations[1].observation.sourceEvidence.screenshotFingerprint.sha256=
  repeated.observations[0].observation.sourceEvidence.screenshotFingerprint.sha256;
 const result=recheck(repeated);
 assert.equal(result.statusCounts['recheck-rejected'],1);
 assert.match(result.rows[1].reason,/Duplicate screenshot bytes/);
 assert.equal(result.storedFingerprintCount,1);
 const duplicateReference=structuredClone(batch);
 duplicateReference.observations[1].observation.sourceEvidence.reference='menu-one.png';
 duplicateReference.observations[1].observation.sourceEvidence.screenshotFingerprint.filename='menu-one.png';
 const report=recheck(duplicateReference);
 assert.equal(report.statusCounts['recheck-rejected'],1);
 assert.match(report.rows[1].reason,/Duplicate evidence reference/);
});

test('single-draft recheck applies the same fingerprint metadata and filename gate',()=>{
 const batch=make(draftRows()),draft=batch.observations[0].observation;
 const check=d=>recheckUnreviewedArDraft(root,{
  gameVersion:version,sourceReference:'synthetic test',draft:d});
 assert.equal(check(draft).status,'candidate-reproduced-unreviewed');
 const badHash=structuredClone(draft);
 badHash.sourceEvidence.screenshotFingerprint.sha256='not-a-hash';
 assert.throws(()=>check(badHash),/Invalid local screenshot fingerprint/);
 const mismatch=structuredClone(draft);
 mismatch.sourceEvidence.screenshotFingerprint.filename='unrelated.png';
 assert.throws(()=>check(mismatch),/filename must match/);
});
