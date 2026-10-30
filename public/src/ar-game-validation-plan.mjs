import {calculateAr,validateArProfile,POWER_STATS} from './weapon-ar.mjs';
import {makeUnreviewedArObservation} from './ar-observation.mjs';
import {validateLocalScreenshotFingerprint} from './ar-screenshot-fingerprint.mjs';

const fail=message=>{throw new RangeError(message);};
const validStats=stats=>stats&&typeof stats==='object'&&!Array.isArray(stats)&&
 POWER_STATS.every(s=>Number.isInteger(stats[s])&&stats[s]>=1&&stats[s]<=99);
const short=v=>typeof v==='string'&&v.trim().length>0&&v.length<=160;

/**
 * A reproducible *manual* equipment-menu test plan from a single user-loaded
 * research profile. "Candidate" means mathematical source projection only,
 * never observation or game-client certification. Nothing is bundled/uploaded.
 */
export function createLocalArValidationPlan(profile,stats,{
 maxCases=24,scopeFlags=[]
}={}){
 const p=validateArProfile(profile);
 if(!validStats(stats))fail('Five combat stats from 1 to 99 are required.');
 if(!Number.isInteger(maxCases)||maxCases<6||maxCases>30)
  fail('Test plan size must be between 6 and 30.');
 if(!Array.isArray(scopeFlags)||scopeFlags.length>16||
  !scopeFlags.every(f=>typeof f==='string'&&f.length<=100))
  fail('Invalid special-mechanic scope flags.');
 const affinities=Object.keys(p.affinities);
 if(affinities.length!==1)fail('Select exactly one source weapon variant.');
 const affinity=affinities[0],levels=p.affinities[affinity].upgrades.map(u=>u.level).sort((a,b)=>a-b);
 const maxLevel=levels[levels.length-1];
 const midLevel=levels[Math.floor((levels.length-1)/2)];
 const rows=[],seen=new Set();
 const add=(tag,upgrade,combat,twoHanded)=>{
  if(rows.length>=maxCases||!validStats(combat))return;
  const key=upgrade+'|'+twoHanded+'|'+POWER_STATS.map(s=>combat[s]).join(',');
  if(seen.has(key))return;
  const r=calculateAr(p,combat,{affinity,upgrade,twoHanded});
  seen.add(key);
  rows.push({
   caseId:'AR-'+String(rows.length+1).padStart(2,'0'),
   scenario:tag,weaponName:p.label,upgrade,twoHanded,stats:{...combat},
   candidateTotal:r.total,floorTotal:r.floorTotal,
   floorComponents:r.floorComponents,roundingDifference:r.roundingDifference,
   effectiveStrength:r.effectiveStats.str,
   missingRequirements:r.missingRequirements,
   requirementPenaltyApplied:r.perElement.some(x=>x.penaltyApplied===true),
   observedTotal:null,evidenceReference:null,
   reviewStatus:'UNREVIEWED',gameClientVerified:false
  });
 };
 // Compare low/mid/high source upgrade rows under the user's actual stats.
 for(const [label,level] of [['maximum',maxLevel],['minimum',levels[0]],['middle',midLevel]])
  for(const grip of [false,true])add('baseline-'+label,level,stats,grip);
 // Isolate exact game-menu requirement boundaries with other stats satisfied.
 const met=Object.fromEntries(POWER_STATS.map(s=>[s,Math.max(stats[s],p.requirements[s],1)]));
 for(const stat of POWER_STATS){
  const threshold=p.requirements[stat];
  if(threshold<=1)continue;
  const before={...met,[stat]:threshold-1},after={...met,[stat]:threshold};
  add('requirement-'+stat+'-below',maxLevel,before,false);
  add('requirement-'+stat+'-met',maxLevel,after,false);
  if(stat==='str'&&(p.gripMode??'standard')==='standard'){
   const edge=Math.max(1,Math.ceil(threshold/1.5));
   add('twohand-strength-threshold-below',maxLevel,{...met,str:Math.max(1,edge-1)},true);
   add('twohand-strength-threshold-met',maxLevel,{...met,str:edge},true);
  }
 }
 // Probe 99 caps and integer flooring at source-defined final reinforcement.
 for(const stat of POWER_STATS)
  add('attribute-'+stat+'-99',maxLevel,{...met,[stat]:99},stat==='str');
 const roundingRisks=rows.filter(x=>x.roundingDifference!==0).length;
 return {
  schemaVersion:1,recordType:'unreviewed-game-menu-AR-test-plan',
  weaponName:p.label,sourceVersion:p.provenance.gameVersion??null,
  sourceProvenanceStatus:p.provenance.status,
  sourceUpgradeMax:maxLevel,sourceLevels:levels,
  baselineStats:{...stats},scopeFlags:[...scopeFlags],
  cases:rows,totalCases:rows.length,roundingRiskCases:roundingRisks,
  synthetic:p.provenance.status==='synthetic-test',
  reviewStatus:'UNREVIEWED',gameClientVerified:false,publicationApproved:false,
  limitations:[
   'Source-derived candidate totals are not current-game golden values.',
   'Use screenshots from actual game equipment menus with exact same character, grip, level and weapon affinity.',
   'Skill damage, spell boosts, status buildup, ammunition and enemy defenses are outside the nominal AR model.',
   'The code cannot inspect screenshots or verify game App/Regulation version or game-derived-data rights.'
  ]
 };
}

/**
 * Export actual user-transcribed results ONLY where a complete AR + local
 * evidence reference was supplied. All drafts remain UNREVIEWED regardless
 * of numeric matches, including for special or dual-wielded armaments.
 */
export function makeUnreviewedArObservationBatch(plan,{
 observations=[],gameAppVersion,regulationVersion,platform,observedAt
}={}){
 if(!plan||typeof plan!=='object'||plan.schemaVersion!==1||
  plan.recordType!=='unreviewed-game-menu-AR-test-plan'||
  plan.reviewStatus!=='UNREVIEWED'||plan.gameClientVerified!==false||
  plan.publicationApproved!==false||plan.synthetic!==false||
  !short(plan.sourceVersion)||!Array.isArray(plan.cases)||plan.cases.length<1||
  plan.cases.length>30||!Number.isInteger(plan.totalCases)||
  plan.totalCases!==plan.cases.length)
  fail('Expected a non-synthetic, UNREVIEWED research test plan.');
 if(!Array.isArray(observations)||observations.length<1||
  observations.length>plan.cases.length)
  fail('Enter at least one actual observed total with evidence reference.');
 const byId=new Map();
 for(const testCase of plan.cases){
  if(!short(testCase.caseId)||byId.has(testCase.caseId)||
   !short(testCase.weaponName)||!validStats(testCase.stats)||
   !Number.isInteger(testCase.upgrade)||testCase.upgrade<0||testCase.upgrade>25||
   typeof testCase.twoHanded!=='boolean'||
   !Number.isInteger(testCase.candidateTotal)||testCase.candidateTotal<0||
   testCase.candidateTotal>20000)
   fail('Invalid or duplicate test case.');
  byId.set(testCase.caseId,testCase);
 }
 const used=new Set(),drafts=[];
 for(const item of observations){
  if(!item||typeof item!=='object'||Array.isArray(item)||
   !short(item.caseId)||!byId.has(item.caseId)||used.has(item.caseId))
   fail('Unknown or duplicate submitted test case.');
  used.add(item.caseId);
  const testCase=byId.get(item.caseId);
  const observation=makeUnreviewedArObservation({
    weaponName:testCase.weaponName,sourceVersion:plan.sourceVersion,
    gameAppVersion,regulationVersion,platform,observedAt,
    evidenceReference:item.evidenceReference,
    stats:testCase.stats,upgrade:testCase.upgrade,twoHanded:testCase.twoHanded,
    observedTotal:item.observedTotal,candidateTotal:testCase.candidateTotal
   });
  if(item.screenshotFingerprint!==undefined&&item.screenshotFingerprint!==null){
   const fingerprint=validateLocalScreenshotFingerprint(item.screenshotFingerprint);
   if(fingerprint.filename!==observation.sourceEvidence.reference)
    fail('Screenshot filename must match its evidence reference for '+item.caseId+'.');
   observation.sourceEvidence.screenshotFingerprint=fingerprint;
  }
  drafts.push({caseId:item.caseId,scenario:testCase.scenario,observation});
 }
 return {
  schemaVersion:1,recordType:'unreviewed-game-menu-AR-observation-batch',
  weaponName:plan.weaponName,sourceVersion:plan.sourceVersion,
  scopeFlags:[...(plan.scopeFlags??[])],
  plannedCases:plan.cases.length,submittedCases:drafts.length,
  numericalMatches:drafts.filter(x=>x.observation.candidateCalculation.numericMatch).length,
  fingerprintedCases:drafts.filter(x=>x.observation.sourceEvidence.screenshotFingerprint).length,
  reviewStatus:'UNREVIEWED',gameClientVerified:false,publicationApproved:false,
  screenshotReviewedCount:0,observations:drafts,
  limitations:[
   'Numerical matches are not independent game-client validation.',
   'Screenshot bytes were not uploaded, stored in JSON or inspected. An optional SHA-256 is a file-identity fingerprint, not authenticity proof.',
   'The values originate from manual transcription and remain pending independent review.'
  ]
 };
}
