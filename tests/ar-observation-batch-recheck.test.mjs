import test from 'node:test';
import assert from 'node:assert/strict';
import {COMPACT_SYNTHETIC_REGULATION} from '../public/data/ar-compact-synthetic.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {createLocalArValidationPlan,makeUnreviewedArObservationBatch} from '../public/src/ar-game-validation-plan.mjs';
import {recheckUnreviewedArBatch} from '../public/src/ar-observation-batch-recheck.mjs';

const name='Fictional Heavy Sword — QA ONLY';
const version='FICTIONAL-V1';
const root=COMPACT_SYNTHETIC_REGULATION;
const sample=()=>{
 const profile=convertCompactRegulation(root,{weaponName:name,
  gameVersion:version,sourceReference:'invented local fixture'});
 const plan=createLocalArValidationPlan(profile,
  {str:40,dex:20,int:10,fai:10,arc:10});
 const cases=plan.cases.slice(0,2);
 const batch=makeUnreviewedArObservationBatch(plan,{
  observations:[
   {caseId:cases[0].caseId,observedTotal:cases[0].candidateTotal,
    evidenceReference:'local-001.png'},
   {caseId:cases[1].caseId,observedTotal:cases[1].candidateTotal+2,
    evidenceReference:'local-002.png'}
  ],gameAppVersion:'1.17.2',regulationVersion:'1.17.3',
  platform:'PC',observedAt:'2026-10-31'
 });
 return batch;
};
const recheck=batch=>recheckUnreviewedArBatch(root,{
 gameVersion:version,sourceReference:'invented local fixture',batch});
test('batch rechecks candidate arithmetic but preserves zero screenshot verification',()=>{
 const out=recheck(sample());
 assert.equal(out.recordType,'unreviewed-ar-batch-recheck-report');
 assert.equal(out.submittedCases,2);
 assert.equal(out.statusCounts['candidate-reproduced-unreviewed'],2);
 assert.equal(out.rows[0].differenceFreshMinusGame,0);
 assert.equal(out.rows[1].differenceFreshMinusGame,-2);
 assert.equal(out.reviewStatus,'UNREVIEWED');
 assert.equal(out.gameClientVerified,false);
 assert.equal(out.screenshotInspected,false);
 assert.equal(out.reviewedScreenshotCount,0);
});
test('batch flags version changes without recalculating against a different dataset',()=>{
 const batch=sample();
 const out=recheckUnreviewedArBatch(root,{gameVersion:'OTHER-V1',
  sourceReference:'fictional',batch});
 assert.equal(out.statusCounts['source-version-mismatch'],2);
 assert.equal(out.rows[0].differenceFreshMinusGame,null);
 assert.equal(out.gameClientVerified,false);
});
test('batch surfaces tampered per-case drafts rather than dropping them',()=>{
 const batch=structuredClone(sample());
 batch.observations[0].observation.reviewStatus='REVIEWED';
 const out=recheck(batch);
 assert.equal(out.statusCounts['recheck-rejected'],1);
 assert.equal(out.statusCounts['candidate-reproduced-unreviewed'],1);
 assert.match(out.rows[0].reason,/UNREVIEWED/);
 assert.equal(out.gameClientVerified,false);
});
test('reject unsafe batch-level certification and duplicate case IDs',()=>{
 const batch=sample();
 for(const change of [{gameClientVerified:true},{publicationApproved:true},
  {reviewStatus:'REVIEWED'},{screenshotReviewedCount:1},
  {submittedCases:3}]){
  assert.throws(()=>recheck({...batch,...change}),RangeError);
 }
 const duplicate=structuredClone(batch);
 duplicate.observations[1].caseId=duplicate.observations[0].caseId;
 assert.throws(()=>recheck(duplicate),/Duplicate/);
 assert.throws(()=>recheckUnreviewedArBatch(root,{
  gameVersion:version,sourceReference:'invented',batch,synthetic:true}),/Fictional/);
});
