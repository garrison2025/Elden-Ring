import test from 'node:test';
import assert from 'node:assert/strict';
import {COMPACT_SYNTHETIC_REGULATION} from '../public/data/ar-compact-synthetic.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';
import {calculateSourceUpgradeProgression} from '../public/src/ar-upgrade-progression.mjs';
import {makeUnreviewedArObservation} from '../public/src/ar-observation.mjs';
import {recheckUnreviewedArDraft} from '../public/src/ar-observation-recheck.mjs';

const clone=x=>structuredClone(x);
const stats={str:40,dex:20,int:10,fai:10,arc:10};
const name='Fictional Bronze Sword — QA ONLY';
const convert=root=>convertCompactRegulation(root,{weaponName:name,gameVersion:'TEST-SOURCE',
 sourceReference:'invented fixture'});
const upgrades=(root,n)=>{
 root.reinforceTypes[1]=Array.from({length:n},(_,i)=>({
  attack:{0:1+i/50,1:1+i/50},attributeScaling:{str:1+i/100,dex:1.0,int:1,fai:1,arc:1}
 }));
 return root;
};
test('somber-style 11-step curve is exact +0..+10 and uses both grip calculations',()=>{
 const root=upgrades(clone(COMPACT_SYNTHETIC_REGULATION),11);
 const profile=convert(root);
 const curve=calculateSourceUpgradeProgression(profile,stats);
 assert.equal(curve.reinforcementSystem,'11-step-source-table');
 assert.equal(curve.rows.length,11);assert.equal(curve.highestLevel,10);
 assert.deepEqual(curve.rows.map(x=>x.level),Array.from({length:11},(_,i)=>i));
 assert.equal(curve.rows[10].oneHand,
  calculateAr(profile,stats,{upgrade:10,twoHanded:false}).total);
 assert.equal(curve.rows[10].twoHand,
  calculateAr(profile,stats,{upgrade:10,twoHanded:true}).total);
 assert.equal(curve.rows[10].effectiveStrength.two,60);
 assert.equal(curve.gameClientVerified,false);
 assert.match(curve.note,/skill scaling/);
});
test('26-step curves remain +0..+25; missing source steps are explicitly unavailable',()=>{
 const root=upgrades(clone(COMPACT_SYNTHETIC_REGULATION),26);
 let profile=convert(root);
 let curve=calculateSourceUpgradeProgression(profile,stats);
 assert.equal(curve.reinforcementSystem,'26-step-source-table');
 assert.equal(curve.rows.length,26);
 assert.equal(curve.rows[25].oneHand,
  calculateAr(profile,stats,{upgrade:25,twoHanded:false}).total);
 profile=clone(profile);profile.affinities['SOURCE AFFINITY'].upgrades.splice(12,1);
 curve=calculateSourceUpgradeProgression(profile,stats);
 assert.equal(curve.reinforcementSystem,'partial-or-other-source-table');
 assert.equal(curve.rows[12].status,'upgrade-unavailable');
 assert.equal(curve.rows[12].oneHand,null);
 assert.equal(curve.rows[12].twoHand,null);
 assert.equal(curve.rows.length,26);
});
test('paired grip does not invent strength bonus; split magical damage remains distinct',()=>{
 const root=clone(COMPACT_SYNTHETIC_REGULATION);
 const profile=convertCompactRegulation(root,{weaponName:'Fictional Paired Knives — QA ONLY',
  gameVersion:'TEST-SOURCE',sourceReference:'invented'});
 const curve=calculateSourceUpgradeProgression(profile,stats);
 assert.equal(curve.gripMode,'paired');
 assert.equal(curve.rows[0].oneHand,curve.rows[0].twoHand);
 assert.equal(curve.rows[0].effectiveStrength.two,40);
 const magic=convertCompactRegulation(root,{weaponName:'Fictional Magic Sword — QA ONLY',
  gameVersion:'TEST-SOURCE',sourceReference:'invented'});
 const out=calculateSourceUpgradeProgression(magic,{...stats,int:35});
 assert.ok(out.rows[0].oneComponents.magic>0);
 assert.ok(out.rows[0].oneComponents.physical>0);
 assert.throws(()=>calculateSourceUpgradeProgression(magic,{...stats,str:100}),RangeError);
});
const observation=()=>{
 const root=clone(COMPACT_SYNTHETIC_REGULATION),profile=convert(root);
 const candidate=calculateAr(profile,stats,{upgrade:1,twoHanded:true}).total;
 return {root,candidate,draft:makeUnreviewedArObservation({
  weaponName:name,sourceVersion:'TEST-SOURCE',gameAppVersion:'1.17.2',
  regulationVersion:'1.17.3',platform:'PC',observedAt:'2026-10-31',
  evidenceReference:'local-menu-01.png',stats,upgrade:1,twoHanded:true,
  observedTotal:candidate,candidateTotal:candidate
 })};
};
test('independent observation draft can be re-evaluated locally but never verified',()=>{
 const {root,candidate,draft}=observation();
 const out=recheckUnreviewedArDraft(root,{gameVersion:'TEST-SOURCE',
  sourceReference:'invented source',draft});
 assert.equal(out.status,'candidate-reproduced-unreviewed');
 assert.equal(out.recomputedCandidateTotal,candidate);
 assert.equal(out.differenceFreshMinusGame,0);
 assert.equal(out.gameClientVerified,false);
 assert.equal(out.screenshotInspected,false);
 assert.equal(out.reviewStatus,'UNREVIEWED');
});
test('recheck detects calculation drift, inconsistent draft and version mismatch',()=>{
 const {root,draft}=observation();
 let altered=clone(draft);
 altered.candidateCalculation.totalAr+=2;
 let out=recheckUnreviewedArDraft(root,{gameVersion:'TEST-SOURCE',
  sourceReference:'test',draft:altered});
 assert.equal(out.status,'draft-fields-inconsistent');
 assert.equal(out.differenceFreshMinusStored,-2);
 altered=clone(draft);altered.candidateCalculation.totalAr+=2;
 altered.candidateCalculation.numericMatch=false;
 altered.candidateCalculation.differenceCandidateMinusObserved=2;
 out=recheckUnreviewedArDraft(root,{gameVersion:'TEST-SOURCE',
  sourceReference:'test',draft:altered});
 assert.equal(out.status,'candidate-calculation-drift');
 out=recheckUnreviewedArDraft(root,{gameVersion:'OTHER-SOURCE',
  sourceReference:'test',draft});
 assert.equal(out.status,'source-version-mismatch');
 assert.equal(out.gameClientVerified,false);
 assert.equal(out.recomputedCandidateTotal,undefined);
});
test('recheck rejects invented and falsely verified drafts, mismatched name and corrupt inputs',()=>{
 const {root,draft}=observation();
 for(const fields of [
  {reviewStatus:'REVIEWED'}, {gameClientVerified:true}, {publicationApproved:true},
  {sourceEvidence:{...draft.sourceEvidence,screenshotReviewed:true}},
  {exactInputs:{...draft.exactInputs,stats:{...stats,str:101}}},
 ]){
  assert.throws(()=>recheckUnreviewedArDraft(root,{gameVersion:'TEST-SOURCE',
   sourceReference:'test',draft:{...draft,...fields}}),RangeError);
 }
 assert.throws(()=>recheckUnreviewedArDraft(root,{gameVersion:'TEST-SOURCE',
  sourceReference:'test',draft,synthetic:true}),/Fictional demo/);
 const mismatched=clone(draft);mismatched.exactInputs.weaponName='Not in source';
 assert.throws(()=>recheckUnreviewedArDraft(root,{gameVersion:'TEST-SOURCE',
  sourceReference:'test',draft:mismatched}),/matches: 0/);
});
