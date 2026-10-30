import test from 'node:test';
import assert from 'node:assert/strict';
import {COMPACT_SYNTHETIC_REGULATION} from '../public/data/ar-compact-synthetic.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';
import {createLocalArValidationPlan,makeUnreviewedArObservationBatch} from '../public/src/ar-game-validation-plan.mjs';

const make=(name='Fictional Heavy Sword — QA ONLY')=>
 convertCompactRegulation(COMPACT_SYNTHETIC_REGULATION,{
  weaponName:name,gameVersion:'FICTIONAL-TEST-SNAPSHOT',
  sourceReference:'handmade sample; no real-world game data'});
const stats={str:20,dex:20,int:10,fai:10,arc:10};
const plan=()=>createLocalArValidationPlan(make(),stats,{
 scopeFlags:['somber-weapon-skill-damage-not-modeled']});

test('manual plan includes source-driven levels, grips, threshold cases and 99 extreme',()=>{
 const p=plan();
 assert.equal(p.reviewStatus,'UNREVIEWED');
 assert.equal(p.gameClientVerified,false);
 assert.equal(p.publicationApproved,false);
 assert.equal(p.sourceVersion,'FICTIONAL-TEST-SNAPSHOT');
 assert.ok(p.cases.some(x=>x.scenario==='baseline-maximum'&&!x.twoHanded));
 assert.ok(p.cases.some(x=>x.scenario==='baseline-minimum'&&x.twoHanded));
 assert.ok(p.cases.some(x=>x.scenario==='requirement-str-below'));
 assert.ok(p.cases.some(x=>x.scenario==='requirement-str-met'));
 assert.ok(p.cases.some(x=>x.scenario==='twohand-strength-threshold-met'));
 assert.ok(p.cases.some(x=>x.scenario==='attribute-str-99'));
 assert.equal(p.totalCases,p.cases.length);
 assert.equal(new Set(p.cases.map(x=>x.caseId)).size,p.cases.length);
 assert.equal(new Set(p.cases.map(x=>JSON.stringify([x.upgrade,x.twoHanded,x.stats]))).size,p.cases.length);
 assert.deepEqual(p.scopeFlags,['somber-weapon-skill-damage-not-modeled']);
 assert.ok(p.cases.every(x=>x.observedTotal===null&&x.evidenceReference===null));
});
test('every planned case is an independent exact source arithmetic evaluation',()=>{
 const profile=make();
 const p=createLocalArValidationPlan(profile,stats,{maxCases:24});
 for(const item of p.cases){
  const original=calculateAr(profile,item.stats,{
   upgrade:item.upgrade,twoHanded:item.twoHanded});
  assert.equal(item.candidateTotal,original.total);
  assert.equal(item.floorComponents,original.floorComponents);
  assert.equal(item.floorTotal,original.floorTotal);
  assert.equal(item.effectiveStrength,original.effectiveStats.str);
  assert.deepEqual(item.missingRequirements,original.missingRequirements);
  assert.equal(item.reviewStatus,'UNREVIEWED');
  assert.equal(item.gameClientVerified,false);
 }
});
test('paired weapon has no invented 1.5 STR and +0 / +1 steps only',()=>{
 const p=createLocalArValidationPlan(make('Fictional Paired Knives — QA ONLY'),
  {str:40,dex:20,int:10,fai:10,arc:10});
 assert.deepEqual(p.sourceLevels,[0,1]);
 assert.ok(p.cases.filter(x=>x.twoHanded).every(x=>x.effectiveStrength===x.stats.str));
 assert.ok(!p.cases.some(x=>x.scenario.startsWith('twohand-strength-threshold')));
});
test('planner rejects invalid stats, multiple affinity profiles and fabricated steps',()=>{
 assert.throws(()=>createLocalArValidationPlan(make(),{...stats,str:0}),/Five combat/);
 assert.throws(()=>createLocalArValidationPlan(make(),stats,{maxCases:31}),/between 6 and 30/);
 assert.throws(()=>createLocalArValidationPlan(make(),stats,{scopeFlags:['x'.repeat(101)]}),/scope flags/);
 const p=make();p.affinities['OTHER']=p.affinities['SOURCE AFFINITY'];
 assert.throws(()=>createLocalArValidationPlan(p,stats),/exactly one/);
});
test('one or several actual user-entered values produce unreviewed batch, never screenshot certification',()=>{
 const p=plan();
 const first=p.cases[0],second=p.cases[1];
 const output=makeUnreviewedArObservationBatch(p,{
  observations:[
   {caseId:first.caseId,observedTotal:first.candidateTotal,evidenceReference:'game-menu-01.png'},
   {caseId:second.caseId,observedTotal:second.candidateTotal+1,evidenceReference:'game-menu-02.png'}
  ],
  gameAppVersion:'1.17.2',regulationVersion:'1.17.3',
  platform:'PC',observedAt:'2026-10-31'
 });
 assert.equal(output.submittedCases,2);
 assert.equal(output.numericalMatches,1);
 assert.equal(output.gameClientVerified,false);
 assert.equal(output.publicationApproved,false);
 assert.equal(output.screenshotReviewedCount,0);
 assert.equal(output.observations[0].observation.gameClientVerified,false);
 assert.equal(output.observations[0].observation.reviewStatus,'UNREVIEWED');
 assert.equal(output.observations[0].observation.sourceEvidence.screenshotReviewed,false);
 assert.equal(output.observations[1].observation.candidateCalculation.differenceCandidateMinusObserved,-1);
 assert.equal(output.observations[0].observation.exactInputs.upgrade,first.upgrade);
 assert.deepEqual(output.observations[0].observation.exactInputs.stats,first.stats);
});
test('submission forbids fake demo, missing screenshot reference, duplicate case and invalid total',()=>{
 const p=plan(),first=p.cases[0];
 const info={gameAppVersion:'1.17.2',regulationVersion:'1.17.3',
  platform:'PC',observedAt:'2026-10-31'};
 const item={caseId:first.caseId,observedTotal:first.candidateTotal,
  evidenceReference:'local-menu-01.png'};
 const submit=(observations,other=p)=>makeUnreviewedArObservationBatch(other,{
  ...info,observations});
 assert.throws(()=>submit([]),/at least one/);
 assert.throws(()=>submit([item,item]),/duplicate/);
 assert.throws(()=>submit([{...item,evidenceReference:''}]),/evidence reference/i);
 assert.throws(()=>submit([{...item,observedTotal:NaN}]),/whole number/);
 assert.throws(()=>submit([{...item,caseId:'AR-404'}]),/Unknown/);
 assert.throws(()=>submit([item],{...p,synthetic:true}),/non-synthetic/);
 assert.throws(()=>submit([item],{...p,gameClientVerified:true}),/non-synthetic/);
 const fakeProfile=make();fakeProfile.provenance.status='synthetic-test';
 const fiction=createLocalArValidationPlan(fakeProfile,stats);
 assert.equal(fiction.synthetic,true);
 assert.throws(()=>submit([item],fiction),/non-synthetic/);
});
