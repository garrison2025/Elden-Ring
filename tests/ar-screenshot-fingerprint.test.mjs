import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {fingerprintLocalScreenshot,compareLocalScreenshotToFingerprint,
 validateLocalScreenshotFingerprint,SCREENSHOT_MAX_BYTES}
 from '../public/src/ar-screenshot-fingerprint.mjs';
import {COMPACT_SYNTHETIC_REGULATION} from '../public/data/ar-compact-synthetic.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {createLocalArValidationPlan,makeUnreviewedArObservationBatch}
 from '../public/src/ar-game-validation-plan.mjs';
import {recheckUnreviewedArBatch} from '../public/src/ar-observation-batch-recheck.mjs';

const opts={subtle:webcrypto.subtle};
const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,1,2,3,4,5,6,7]);
const jpeg=Uint8Array.from([255,216,255,224,0,4,0,0,255,217,0,1]);
const webp=Uint8Array.from([82,73,70,70,16,0,0,0,87,69,66,80,86,80,56,32]);
const file=(bytes,name,type)=>({name,size:bytes.length,type,
 arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)});
const finger=async (bytes=png,name='menu.png',type='image/png')=>
 fingerprintLocalScreenshot(file(bytes,name,type),opts);

test('local SHA-256 records bytes only and never marks evidence verified',async()=>{
 const f=await finger();
 assert.equal(f.algorithm,'SHA-256');
 assert.match(f.sha256,/^[0-9a-f]{64}$/);
 assert.equal(f.byteLength,png.length);
 assert.equal(f.mediaType,'image/png');
 assert.equal(f.filename,'menu.png');
 assert.equal(f.screenshotReviewed,false);
 assert.equal(f.gameClientVerified,false);
 assert.deepEqual(validateLocalScreenshotFingerprint(f),f);
 const match=await compareLocalScreenshotToFingerprint(file(png,'renamed.png','image/png'),f,opts);
 assert.equal(match.status,'bytes-match');
 assert.equal(match.screenshotReviewed,false);
 assert.equal(match.gameClientVerified,false);
 const alt=Uint8Array.from([...png]);alt[15]^=1;
 const mismatch=await compareLocalScreenshotToFingerprint(file(alt,'menu.png','image/png'),f,opts);
 assert.equal(mismatch.status,'bytes-mismatch');
});
test('JPEG and WebP signatures are accepted, mismatched extensions and file headers rejected',async()=>{
 assert.equal((await finger(jpeg,'menu.jpeg','image/jpeg')).mediaType,'image/jpeg');
 assert.equal((await finger(webp,'screen.webp','image/webp')).mediaType,'image/webp');
 await assert.rejects(finger(png,'notpng.jpeg','image/jpeg'),/do not agree/);
 await assert.rejects(finger(png,'path.exe','image/png'),/must have/);
 await assert.rejects(finger(png,'menu.png','image/jpeg'),/do not agree/);
 await assert.rejects(finger(Uint8Array.from({length:40},()=>1),'junk.png','image/png'),/recognized/);
 await assert.rejects(fingerprintLocalScreenshot(file(png,'../../bad.png','image/png'),opts),/Choose a PNG/);
 await assert.rejects(fingerprintLocalScreenshot(file(png,'good.png','image/png'),
  {subtle:null}),/unavailable/);
});
test('fingerprint metadata is strict about flags, size and algorithm',async()=>{
 const f=await finger();
 for(const edited of [
  {...f,sha256:'bad'}, {...f,algorithm:'MD5'},
  {...f,byteLength:SCREENSHOT_MAX_BYTES+1},
  {...f,mediaType:'image/svg+xml'},
  {...f,screenshotReviewed:true},{...f,gameClientVerified:true}
 ])assert.throws(()=>validateLocalScreenshotFingerprint(edited),RangeError);
});
test('optional screenshot SHA-256 joins legacy UNREVIEWED batch without image bytes',async()=>{
 const profile=convertCompactRegulation(COMPACT_SYNTHETIC_REGULATION,{
  weaponName:'Fictional Bronze Sword — QA ONLY',gameVersion:'TEST',
  sourceReference:'synthetic parameters for tests'});
 const plan=createLocalArValidationPlan(profile,{str:40,dex:20,int:10,fai:10,arc:10});
 // Synthetic fixture is deliberately exported as a research-only test profile;
 // for the regression we use a separately marked manual-unverified plan.
 const draftPlan={...plan,synthetic:false};
 const c=plan.cases[0],fp=await finger();
 const input={caseId:c.caseId,observedTotal:c.candidateTotal,
  evidenceReference:fp.filename,screenshotFingerprint:fp};
 const options={gameAppVersion:'1.17.2',regulationVersion:'1.17.3',
  platform:'PC',observedAt:'2026-10-31'};
 const batch=makeUnreviewedArObservationBatch(draftPlan,{
  ...options,observations:[input]});
 assert.equal(batch.fingerprintedCases,1);
 assert.deepEqual(batch.observations[0].observation.sourceEvidence.screenshotFingerprint,fp);
 assert.equal(batch.screenshotReviewedCount,0);
 assert.equal(batch.gameClientVerified,false);
 assert.equal(JSON.stringify(batch).includes('data:image'),false);
 const legacy=makeUnreviewedArObservationBatch(draftPlan,{
  ...options,observations:[{caseId:c.caseId,observedTotal:c.candidateTotal,
   evidenceReference:'menu.png'}]});
 assert.equal(legacy.fingerprintedCases,0);
 assert.equal(legacy.observations[0].observation.sourceEvidence.screenshotFingerprint,undefined);
 assert.throws(()=>makeUnreviewedArObservationBatch(draftPlan,{
  ...options,observations:[{...input,evidenceReference:'another.png'}]}),/must match/);
});

test('batch recheck validates fingerprint shape, keeps legacy entries and refuses malformed metadata',async()=>{
 const profile=convertCompactRegulation(COMPACT_SYNTHETIC_REGULATION,{
  weaponName:'Fictional Bronze Sword — QA ONLY',gameVersion:'TEST',
  sourceReference:'invented fixture'});
 const plan={...createLocalArValidationPlan(profile,{str:40,dex:20,int:10,fai:10,arc:10}),
  synthetic:false};
 const c=plan.cases[0],fp=await finger();
 const options={gameAppVersion:'1.17.2',regulationVersion:'1.17.3',
  platform:'PC',observedAt:'2026-10-31'};
 const make=(include)=>makeUnreviewedArObservationBatch(plan,{
  ...options,observations:[{caseId:c.caseId,observedTotal:c.candidateTotal,
   evidenceReference:fp.filename,...(include?{screenshotFingerprint:fp}:{})}]
 });
 const check=batch=>recheckUnreviewedArBatch(COMPACT_SYNTHETIC_REGULATION,{
  batch,gameVersion:'TEST',sourceReference:'invented fixture'});
 const fresh=check(make(true));
 assert.equal(fresh.storedFingerprintCount,1);
 assert.equal(fresh.rows[0].screenshotFingerprintRecorded,true);
 assert.equal(fresh.rows[0].status,'candidate-reproduced-unreviewed');
 assert.equal(fresh.reviewedScreenshotCount,0);
 const legacy=check(make(false));
 assert.equal(legacy.storedFingerprintCount,0);
 assert.equal(legacy.rows[0].status,'candidate-reproduced-unreviewed');
 const modified=structuredClone(make(true));
 modified.observations[0].observation.sourceEvidence.screenshotFingerprint.sha256='invalid';
 const rejected=check(modified);
 assert.equal(rejected.statusCounts['recheck-rejected'],1);
 assert.equal(rejected.storedFingerprintCount,0);
 assert.equal(rejected.gameClientVerified,false);
});
