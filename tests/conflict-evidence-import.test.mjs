import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto,createHash} from 'node:crypto';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
import {
 makeConflictCaptureDraft,bundleConflictCaptureDrafts
} from '../public/src/conflict-game-capture.mjs';
import {
 parseConflictCaptureBundle,reviewImportSummary,recheckConflictOriginalImages,
 CONFLICT_BUNDLE_MAX_BYTES
} from '../public/src/conflict-evidence-import.mjs';

const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const ledger=JSON.parse(read('data/weapon-conflict-evidence.json'));
const catalog=validateCommunityCatalog(JSON.parse(read('data/community-weapon-catalog.json')));
const png=tag=>new Uint8Array([137,80,78,71,13,10,26,10,
 ...Array.from({length:30},(_,i)=>tag+i)]);
const screenshot=(bytes,name)=>({
 name,size:bytes.length,type:'image/png',
 arrayBuffer:async()=>bytes.slice().buffer
});
const sig=(bytes,name)=>({
 algorithm:'SHA-256',sha256:createHash('sha256').update(bytes).digest('hex'),
 byteLength:bytes.length,mediaType:'image/png',filename:name,
 screenshotReviewed:false,gameClientVerified:false
});
const title=screenshot(png(1),'game-title.png'),weapon=screenshot(png(2),'weapon-detail.png');
const madding=()=>makeConflictCaptureDraft(ledger,catalog,{
 caseId:'sote-reference-051',
 observed:[8,8,13,13,0],
 appVersion:'1.17.2',regulationVersion:'1.17.3',
 platform:'PC / Windows',observedAt:'2026-10-31',
 checkedPlusZero:true,checkedDefaultAffinity:true,checkedWeaponDetails:true,
 titleScreenshot:sig(png(1),title.name),
 weaponScreenshot:sig(png(2),weapon.name)
});
const exported=()=>bundleConflictCaptureDrafts(ledger,catalog,[madding()]);
const importText=data=>parseConflictCaptureBundle(ledger,catalog,JSON.stringify(data,null,2)+'\n');

test('real exporter round-trip is bounded, source revalidated and stays UNREVIEWED',()=>{
 const original=exported(),reopened=importText(original);
 assert.equal(JSON.stringify(reopened),JSON.stringify(original));
 const summary=reviewImportSummary(reopened);
 assert.equal(summary.observations,1);
 assert.equal(summary.pending,6);
 assert.equal(summary.mismatchedVersion,0);
 assert.equal(summary.sourceCommunity,1);
 assert.equal(summary.sourcePinned,0);
 assert.equal(summary.sourceNeither,0);
 assert.equal(summary.reviewStatus,'UNREVIEWED');
 assert.equal(summary.gameClientVerified,false);
 assert.equal(reopened.independentlyReviewedScreenshotCount,0);
 assert.equal(importText(bundleConflictCaptureDrafts(ledger,catalog,[])).capturedCount,0);
});
test('import rejects altered source facts, forged approvals, corrupt envelope and tampered derived fields',()=>{
 const mutate=fn=>{
  const data=structuredClone(exported());fn(data);
  return JSON.stringify(data);
 };
 const invalid=[
  '','{','[]','{}',' '.repeat(CONFLICT_BUNDLE_MAX_BYTES+1),
  mutate(x=>{x.schemaVersion=2;}),
  mutate(x=>{x.capturedCount=7;}),
  mutate(x=>{x.reviewStatus='APPROVED';}),
  mutate(x=>{x.gameClientVerified=true;}),
  mutate(x=>{x.independentlyReviewedScreenshotCount=1;}),
  mutate(x=>{x.publicationApproved=true;}),
  mutate(x=>{x.entries.pop();}),
  mutate(x=>{x.entries[0].taskStatus='VERIFIED';}),
  mutate(x=>{x.entries[0].community=[9,9,9,9,9];}),
  mutate(x=>{const row=x.entries.find(v=>v.observation);row.observation.numericComparison='matches-neither-source';}),
  mutate(x=>{const row=x.entries.find(v=>v.observation);row.observation.reviewStatus='APPROVED';}),
  mutate(x=>{const row=x.entries.find(v=>v.observation);row.observation.observedComponents[3]=20;}),
  mutate(x=>{const row=x.entries.find(v=>v.observation);row.observation.conditions.userAttested=false;}),
  mutate(x=>{const row=x.entries.find(v=>v.observation);row.observation.localScreenshots.weaponDetails.sha256='wrong';})
 ];
 for(const text of invalid)
  assert.throws(()=>parseConflictCaptureBundle(ledger,catalog,text),RangeError,
   'Invalid JSON accepted: '+text.slice(0,80));
});
test('source drift prevents reimport without silently rewriting snapshot',()=>{
 const modified=structuredClone(catalog);
 modified.weapons.find(w=>w.id==='sote-reference-051').requirements[3]=20;
 assert.throws(()=>parseConflictCaptureBundle(ledger,modified,
  JSON.stringify(exported())),RangeError);
});
test('actual original image bytes match SHA256 for BOTH files, with no game approval',async()=>{
 const bundle=importText(exported());
 const result=await recheckConflictOriginalImages(bundle,'sote-reference-051',
  title,weapon,{subtle:webcrypto.subtle});
 assert.equal(result.titleScreen.status,'bytes-match');
 assert.equal(result.weaponDetails.status,'bytes-match');
 assert.equal(result.bothBytesMatch,true);
 assert.equal(result.reviewStatus,'UNREVIEWED');
 assert.equal(result.screenshotReviewed,false);
 assert.equal(result.gameClientVerified,false);
 assert.equal(result.publicationApproved,false);
 assert.match(result.note,/does NOT inspect screenshot pixels/);
});
test('one modified original screenshot produces explicit mismatch, not a cert',async()=>{
 const bundle=importText(exported());
 const altered=screenshot(png(12),'weapon-detail.png');
 const check=await recheckConflictOriginalImages(bundle,'sote-reference-051',
  title,altered,{subtle:webcrypto.subtle});
 assert.equal(check.titleScreen.status,'bytes-match');
 assert.equal(check.weaponDetails.status,'bytes-mismatch');
 assert.equal(check.bothBytesMatch,false);
 assert.equal(check.gameClientVerified,false);
});
test('pending records and missing files cannot be rechecked as game evidence',async()=>{
 const bundle=importText(exported());
 await assert.rejects(()=>recheckConflictOriginalImages(
  bundle,'sote-reference-032',title,weapon,{subtle:webcrypto.subtle}),RangeError);
 await assert.rejects(()=>recheckConflictOriginalImages(
  bundle,'sote-reference-051',null,weapon,{subtle:webcrypto.subtle}),RangeError);
 await assert.rejects(()=>recheckConflictOriginalImages(
  bundle,'bogus',title,weapon,{subtle:webcrypto.subtle}),RangeError);
});
test('accuracy UI has explicit, user-action-only file import and original image comparison',()=>{
 const html=read('validation-status/index.html');
 const app=read('src/conflict-evidence-import-app.mjs');
 const css=read('assets/style.css');
 for(const id of ['conflict-evidence-recheck','conflict-recheck-json',
  'conflict-recheck-import','conflict-recheck-clear','conflict-recheck-results',
  'conflict-recheck-case','conflict-recheck-title-file',
  'conflict-recheck-weapon-file','conflict-recheck-hashes',
  'conflict-recheck-hash-result','conflict-recheck-feedback',
  'conflict-recheck-summary']){
  assert.equal(html.split('id="'+id+'"').length-1,1,id);
 }
 assert.ok(html.includes('src="../src/conflict-evidence-import-app.mjs"'));
 assert.ok(app.includes('parseConflictCaptureBundle(ledger,catalog,raw)'));
 assert.ok(app.includes('recheckConflictOriginalImages('));
 assert.ok(app.includes('file.text()'));
 assert.ok(app.includes("el('import').addEventListener('click'"));
 assert.ok(app.includes("el('hashes').addEventListener('click'"));
 assert.ok(!app.includes('localStorage'));
 assert.ok(!app.includes('XMLHttpRequest'));
 assert.ok(css.includes('#conflict-evidence-recheck'));
});
