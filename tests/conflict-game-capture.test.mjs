import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
import {fingerprintLocalScreenshot} from '../public/src/ar-screenshot-fingerprint.mjs';
import {
 CONFLICT_FIELDS,getCaptureCase,makeConflictCaptureDraft,
 makeConflictCaptureChecklist,bundleConflictCaptureDrafts
} from '../public/src/conflict-game-capture.mjs';

const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const catalog=validateCommunityCatalog(JSON.parse(read('data/community-weapon-catalog.json')));
const ledger=JSON.parse(read('data/weapon-conflict-evidence.json'));
const mark=(filename,tag)=>({
 algorithm:'SHA-256',sha256:tag.repeat(64),byteLength:30,
 mediaType:'image/png',filename,
 screenshotReviewed:false,gameClientVerified:false
});
const screenshotA=mark('actual-version-screen.png','a');
const screenshotB=mark('actual-weapon-screen.png','b');
const opts=(caseId,observed,change={})=>({
 caseId,observed,appVersion:'1.17.2',regulationVersion:'1.17.3',
 platform:'PC / Windows',observedAt:'2026-10-31',
 checkedPlusZero:true,checkedDefaultAffinity:true,checkedWeaponDetails:true,
 titleScreenshot:screenshotA,weaponScreenshot:screenshotB,...change
});
const madding='sote-reference-051',shortsword='sote-reference-032';

test('exact seven flagged source IDs available but none is pre-marked as observed',()=>{
 const list=makeConflictCaptureChecklist(ledger,catalog);
 assert.equal(list.entries.length,7);
 assert.equal(list.capturedCount,0);
 assert.equal(list.independentlyReviewedScreenshotCount,0);
 assert.equal(list.reviewStatus,'UNREVIEWED');
 assert.equal(list.gameClientVerified,false);
 assert.ok(list.entries.every(c=>c.observation===null&&
  c.taskStatus==='PENDING_REAL_GAME_EVIDENCE'));
 assert.deepEqual(getCaptureCase(ledger,catalog,madding).componentLabels,
  [...CONFLICT_FIELDS.requirements]);
 assert.equal(getCaptureCase(ledger,catalog,madding).weaponName,'Madding Hand');
});
test('a matching game transcription is a SOURCE match, never real-game verified',()=>{
 const record=makeConflictCaptureDraft(ledger,catalog,
  opts(madding,[8,8,13,13,0]));
 assert.equal(record.numericComparison,'matches-community-source');
 assert.equal(record.gameVersionMatchesTarget,true);
 assert.equal(record.reviewStatus,'UNREVIEWED');
 assert.equal(record.gameClientVerified,false);
 assert.equal(record.screenshotReviewed,false);
 assert.equal(record.publicationApproved,false);
 assert.equal(record.independentlyReviewedScreenshotCount,0);
 assert.deepEqual(record.observedComponents,[8,8,13,13,0]);
 assert.deepEqual(record.publishedSources.pinnedV117,[8,8,13,20,0]);
 assert.deepEqual(record.localScreenshots.titleScreen,screenshotA);
 assert.ok(!JSON.stringify(record).includes('data:image/'));
 const other=makeConflictCaptureDraft(ledger,catalog,opts(madding,[8,8,13,20,0]));
 assert.equal(other.numericComparison,'matches-pinned-v117-source');
 const neither=makeConflictCaptureDraft(ledger,catalog,opts(madding,[8,8,13,17,0]));
 assert.equal(neither.numericComparison,'matches-neither-source');
});
test('wrong installed regulation is explicitly NOT compared as current version',()=>{
 const out=makeConflictCaptureDraft(ledger,catalog,opts(shortsword,[75,0,32,0,0],
  {appVersion:'1.17.2',regulationVersion:'1.17.2'}));
 assert.equal(out.gameVersionMatchesTarget,false);
 assert.equal(out.numericComparison,'not-compared-version-mismatch');
 assert.equal(out.reviewStatus,'UNREVIEWED');
});
test('empty, implicit zero, malformed versions and attestation fail before recording',()=>{
 const wrong=[
  opts(madding,[8,8,13,'',0]),
  opts(madding,[8,8,13,null,0]),
  opts(madding,[8,8,13,'1e2',0]),
  opts(madding,[8,8,13,'001',0]),
  opts(madding,[8,8,13,-1,0]),
  opts(madding,[8,8,13,100,0]),
  opts(madding,[8,8,13,13]),
  opts(madding,[8,8,13,13,0],{checkedPlusZero:false}),
  opts(madding,[8,8,13,13,0],{checkedDefaultAffinity:false}),
  opts(madding,[8,8,13,13,0],{checkedWeaponDetails:false}),
  opts(madding,[8,8,13,13,0],{platform:''}),
  opts(madding,[8,8,13,13,0],{observedAt:'2026-02-30'}),
  opts(madding,[8,8,13,13,0],{appVersion:'\n1.17.2'}),
  opts(madding,[8,8,13,13,0],{weaponScreenshot:screenshotA}),
  opts(madding,[8,8,13,13,0],{titleScreenshot:null}),
  opts('unknown',[8,8,13,13,0])
 ];
 for(const input of wrong)
  assert.throws(()=>makeConflictCaptureDraft(ledger,catalog,input),RangeError);
});
test('source mismatch, obsolete flag and invented approval are rejected',()=>{
 const edited=structuredClone(catalog);
 edited.weapons.find(w=>w.id===madding).requirements[3]=20;
 assert.throws(()=>getCaptureCase(ledger,edited,madding),RangeError);
 const noFlag=structuredClone(catalog);
 noFlag.weapons.find(w=>w.id===madding).flags=
  noFlag.weapons.find(w=>w.id===madding).flags.filter(x=>x!=='v117-community-requirement-conflict');
 assert.throws(()=>getCaptureCase(ledger,noFlag,madding),RangeError);
 const promoted=structuredClone(ledger);
 promoted.cases.find(x=>x.id===madding).gameClientVerified=true;
 assert.throws(()=>getCaptureCase(promoted,catalog,madding),RangeError);
});
test('seven-case export contains only authentic supplied drafts and non-certified pending entries',()=>{
 const a=makeConflictCaptureDraft(ledger,catalog,opts(madding,[8,8,13,13,0]));
 const b=makeConflictCaptureDraft(ledger,catalog,opts(shortsword,[75,0,22,0,0]));
 const pack=bundleConflictCaptureDrafts(ledger,catalog,[a,b]);
 assert.equal(pack.entries.length,7);
 assert.equal(pack.capturedCount,2);
 assert.equal(pack.independentlyReviewedScreenshotCount,0);
 assert.equal(pack.publicationApproved,false);
 assert.equal(pack.entries.find(x=>x.id===madding).taskStatus,'UNREVIEWED_PLAYER_TRANSCRIPTION');
 assert.equal(pack.entries.find(x=>x.id===madding).observation.numericComparison,
  'matches-community-source');
 assert.equal(pack.entries.filter(x=>x.observation===null).length,5);
 assert.equal(JSON.stringify(pack).includes('imageData'),false);
 for(const modified of [
  d=>{d.numericComparison='matches-pinned-v117-source';},
  d=>{d.reviewStatus='APPROVED';},
  d=>{d.gameClientVerified=true;},
  d=>{d.localScreenshots.titleScreen.sha256='c'.repeat(64);},
  d=>{d.conditions.userAttested=false;},
  d=>{d.publishedSources.community=[1,2,3,4,5];},
  d=>{d.observedComponents[3]=17;}
 ]){
  const copy=structuredClone(a);modified(copy);
  assert.throws(()=>bundleConflictCaptureDrafts(ledger,catalog,[copy]),RangeError);
 }
 assert.throws(()=>bundleConflictCaptureDrafts(ledger,catalog,[a,a]),RangeError);
});
test('actual local File SHA256 uses signature and retains only metadata',async()=>{
 const bytes=new Uint8Array([137,80,78,71,13,10,26,10,
  0,0,0,13,73,72,68,82,1,2,3,4,5,6,7,8]);
 const mock={name:'screenshot.png',size:bytes.length,type:'image/png',
  arrayBuffer:async()=>bytes.buffer};
 const r=await fingerprintLocalScreenshot(mock,{subtle:webcrypto.subtle});
 assert.equal(r.sha256,createHash('sha256').update(bytes).digest('hex'));
 assert.equal(r.byteLength,bytes.length);
 assert.equal(r.screenshotReviewed,false);
 assert.equal(r.gameClientVerified,false);
 assert.equal(JSON.stringify(r).includes('137,80,78'),false);
});
test('existing accuracy page has accessible opt-in-only capture controls',()=>{
 const page=read('validation-status/index.html');
 const app=read('src/conflict-game-capture-app.mjs');
 for(const id of ['conflict-capture','conflict-capture-title','conflict-capture-case',
  'conflict-capture-values','conflict-capture-app','conflict-capture-regulation',
  'conflict-capture-platform','conflict-capture-date',
  'conflict-capture-title-image','conflict-capture-weapon-image',
  'conflict-capture-plus-zero','conflict-capture-default',
  'conflict-capture-details','conflict-capture-add','conflict-capture-export',
  'conflict-capture-clear','conflict-capture-feedback','conflict-capture-progress']){
  assert.equal(page.split('id="'+id+'"').length-1,1,'Missing/duplicate '+id);
 }
 assert.ok(page.includes('src="../src/conflict-game-capture-app.mjs"'));
 assert.ok(page.includes('No data is automatically saved or uploaded'));
 assert.ok(page.includes('never means independent gameplay verification'));
 assert.ok(app.includes('fingerprintLocalScreenshot(titleFile)'));
 assert.ok(app.includes('fingerprintLocalScreenshot(weaponFile)'));
 assert.ok(app.includes("link.download='elden-ring-seven-conflicts-UNREVIEWED.json'"));
 assert.equal(app.includes('localStorage.'),false);
 assert.equal(app.includes('fetch(')&&app.includes('POST'),false);
});
