import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
import {validateRecoveredSourceReferences} from '../public/src/recovered-weapon-reference.mjs';
import {makeCurrentGameQAQueue,makeCurrentGameQADraft,bundleCurrentGameQADrafts} from '../public/src/current-game-qa.mjs';
const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const catalog=validateCommunityCatalog(JSON.parse(read('data/community-weapon-catalog.json')));
const recovered=JSON.parse(read('data/v117-recovered-72-reference.json'));
const legacy=JSON.parse(read('data/weapon-conflict-evidence.json'));
validateRecoveredSourceReferences(recovered,catalog);
const queue=makeCurrentGameQAQueue(catalog,recovered,legacy);
const stamp=(name,hash)=>({algorithm:'SHA-256',sha256:hash.repeat(64),byteLength:30,
 mediaType:'image/png',filename:name,screenshotReviewed:false,gameClientVerified:false});
const sample=(id,observed,change={})=>({
 caseId:id,observed,appVersion:'1.17.2',regulationVersion:'1.17.3',
 platform:'PC / Windows',observedAt:'2026-10-31',checkedPlusZero:true,
 checkedDefaultAffinity:true,checkedWeaponDetails:true,
 titleScreenshot:stamp('version.png','a'),weaponScreenshot:stamp('weapon.png','b'),...change
});
test('20 exactly named original-client field checks across 17 weapon families are pending',()=>{
 assert.equal(queue.cases.length,20);
 assert.equal(queue.weaponGroups,17);
 assert.equal(queue.expectedFields,20);
 assert.equal(queue.gameClientVerified,false);
 assert.equal(queue.independentlyReviewedScreenshots,0);
 assert.equal(new Set(queue.cases.map(x=>x.id)).size,20);
 assert.equal(queue.cases.filter(x=>x.id.startsWith('legacy-')).length,7);
 assert.equal(queue.cases.filter(x=>x.id.startsWith('stone-')).length,2);
 assert.equal(queue.cases.filter(x=>x.id.startsWith('ritual-')).length,2);
 assert.equal(queue.cases.filter(x=>x.id.startsWith('recovered-')).length,9);
 assert.equal(queue.cases.find(x=>x.id.includes('v117-roster-020-attack'))?.weaponName,'Carian Knight\'s Shield');
});
test('Dragonclaw unreported secondary lightning cannot be forged as observed zero',()=>{
 const dragon=queue.cases.find(x=>x.weaponName==='Dragonclaw Shield');
 assert.equal(dragon.sourceA.values[0],76);
 assert.equal(dragon.sourceB.values[0],null);
 const zero=makeCurrentGameQADraft(queue,sample(dragon.id,['0']));
 assert.equal(zero.publishedNumericComparison,'matches-neither-published-source');
 assert.equal(zero.gameClientVerified,false);
 assert.equal(zero.publicationApproved,false);
});
test('mixed attack / scaling / requirements / weight drafts never certify original game',()=>{
 for(const [label,sampleValue] of [
  ['Buckler',['D']],['Buckler',['68']],['Stone-Sheathed Sword',['3.5']],
  ['Visage Shield',['44']],['Ritual Thrusting Shield',['9']]
 ]){
  const item=queue.cases.find(x=>x.weaponName===label&&x.sourceA.values.length===sampleValue.length&&(
   typeof sampleValue[0]==='string'&&/[A-E-]/.test(sampleValue[0])?x.fieldType==='scaling':true));
  assert.ok(item,label);
  const value=makeCurrentGameQADraft(queue,sample(item.id,sampleValue));
  assert.equal(value.reviewStatus,'UNREVIEWED');assert.equal(value.gameClientVerified,false);
  assert.equal(value.screenshotReviewed,false);assert.equal(value.publicationApproved,false);
 }
});
test('player transcription must be explicit, version-checked and separate from independent screenshot review',()=>{
 const buckler=queue.cases.find(x=>x.weaponName==='Buckler'&&x.fieldType==='attack');
 const valid=makeCurrentGameQADraft(queue,sample(buckler.id,['68']));
 assert.equal(valid.publishedNumericComparison,'matches-published-source-b');
 const wrong=makeCurrentGameQADraft(queue,sample(buckler.id,['68'],{regulationVersion:'1.17.2'}));
 assert.equal(wrong.publishedNumericComparison,'not-compared-game-version-mismatch');
 for(const args of [
  sample(buckler.id,['']),
  sample(buckler.id,['0.1']),
  sample(buckler.id,['1e2']),
  sample(buckler.id,['68'],{checkedPlusZero:false}),
  sample(buckler.id,['68'],{titleScreenshot:stamp('same.png','b')}),
  sample(buckler.id,['68'],{observedAt:'2026-02-30'})
 ]){
  assert.throws(()=>makeCurrentGameQADraft(queue,args),RangeError);
 }
 const pack=bundleCurrentGameQADrafts(queue,[valid]);
 assert.equal(pack.observedCount,1);assert.equal(pack.independentlyReviewedScreenshotCount,0);
 assert.equal(pack.gameClientVerified,false);
 for(const mutate of [
  x=>{x.reviewStatus='CERTIFIED'},x=>{x.gameClientVerified=true},
  x=>{x.observedComponents[0]=60},x=>{x.publishedSources.sourceB.values=[1]},
  x=>{x.screenshots.weaponDetail.sha256='f'.repeat(64)}
 ]){
  const tampered=structuredClone(valid);mutate(tampered);
  assert.throws(()=>bundleCurrentGameQADrafts(queue,[tampered]),RangeError);
 }
});
test('local research capture page exposes each input, no upload or external API',()=>{
 const html=read('game-evidence-queue/index.html'),app=read('src/current-game-qa-app.mjs');
 assert.match(html,/noindex,nofollow/);
 assert.ok(html.includes('20 disputed field checks'));
 assert.ok(html.includes('Zero certified game readings'));
 for(const id of ['qa-case','qa-sources','qa-values','qa-app','qa-regulation','qa-platform','qa-date',
  'qa-title','qa-weapon','qa-zero','qa-default','qa-detail','qa-add','qa-export','qa-clear',
  'qa-feedback','qa-total','qa-progress'])
  assert.equal(html.split('id="'+id+'"').length-1,1);
 assert.ok(app.includes('fingerprintLocalScreenshot'));
 assert.ok(app.includes('bundleCurrentGameQADrafts'));
 assert.ok(!app.includes('localStorage'));
 assert.ok(!app.includes('POST'));
});
