const fail=m=>{throw new RangeError(m)};
const normalizedName=s=>String(s).replace(/[\u2018\u2019]/g,"'").trim();
const equal=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i]);
const expectedFexUrl=name=>'https://eldenring.wiki.fextralife.com/'+name.replace(/ /g,'+');
const expectedNameUrl=name=>'https://tarnished.app/weapons/'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const impactName=['Physical','Magic','Fire','Lightning','Holy'];
export function validateRecoveredSourceReferences(ledger,catalog){
 if(ledger?.schemaVersion!==1||ledger.total!==72||!Array.isArray(ledger.records)||ledger.records.length!==72||
   ledger.gameClientVerified!==false||ledger.publicationApproved!==false||
   ledger.independentlyReviewedGameClientScreenshots!==0||!Array.isArray(catalog?.weapons))
  fail('Recovered source evidence must have 72 unverified records.');
 const sourceRows=catalog.weapons.filter(w=>w.flags?.includes('source-v117-neutral-requirements-only'));
 if(sourceRows.length!==72)fail('Original source-only roster has changed.');
 const originals=new Map(sourceRows.map(w=>[w.id,w]));
 const seen=new Set(),conflictIds=[];
 let attackCount=0,weightCount=0,criticalCount=0,scalingCount=0,unknownGrades=0;
 let attackConflictCount=0,scalingConflictCount=0,requirementConflictCount=0;
 let explicitRows=0,explicitCells=0;
 const allowedCategories=new Set(['Small Shield','Medium Shield','Greatshield','Sacred Seal','Curved Sword','Greatsword']);
 const conflicts=[];
 for(const record of ledger.records){
  const original=originals.get(record.id),e=record.reference,other=record.crosscheck;
  if(!original||seen.has(record.id)||normalizedName(record.name)!==normalizedName(original.name)||
    record.category!==original.category||!allowedCategories.has(record.category)||
    !equal(record.requirementsPinned117,original.requirements)||
    original.weight!==null||original.attack!==null||original.critical!==null||original.scaling!==null)
    fail('Source-only record identity or safe catalog boundaries changed.');
  if(!e||!Array.isArray(e.attackAtPlusZero)||e.attackAtPlusZero.length!==5||
    e.attackAtPlusZero.some(n=>!Number.isInteger(n)||n<0||n>5000)||
    !e.attackAtPlusZero.some(n=>n>0)||
    !Number.isFinite(e.weight)||e.weight<=0||e.weight>100||
    !Number.isInteger(e.critical)||e.critical<0||e.critical>300||
    !Array.isArray(e.scalingAtPlusZero)||e.scalingAtPlusZero.length!==5||
    e.scalingAtPlusZero.some(g=>typeof g!=='string'||! /^(?:S|A|B|C|D|E|-|\?)$/.test(g))||
    !/^https:\/\/eldenring\.wiki\.gg\/wiki\/[a-zA-Z0-9_%'.-]+$/.test(e.sourceUrl)||
    e.gameClientVerified!==false||e.publicationApproved!==false||
    record.gameClientVerified!==false||record.publicationApproved!==false||record.reviewStatus!=='UNREVIEWED')
    fail('Bad source values or false game certification.');
  if(!other||other.sourceUrl!==expectedNameUrl(record.name)||
    other.sourceName!=='tarnished.app (not tarnished.dev)'||
    other.sourceGameVersion!=='not stated on this weapon page'||
    !Array.isArray(other.attackAtPlusZero)||other.attackAtPlusZero.length!==5||
    other.attackAtPlusZero.some(v=>!Number.isFinite(v)||v<0||v>5000)||
    !other.attackAtPlusZero.some(v=>v>0)||
    !Number.isFinite(other.weight)||Math.abs(other.weight-e.weight)>0.09||
    !Array.isArray(other.scalingGradesAsReported)||other.scalingGradesAsReported.length!==5||
    other.scalingGradesAsReported.some(g=>g!==null&&!/^[SABCDE]$/.test(g))||
    other.omittedScalingNotProvenAbsent!==true||
    other.gameClientVerified!==false||other.publicationApproved!==false)
    fail('Second-source base/weight/scaling provenance invalid.');
  if(!Array.isArray(record.requirementsFromReference)||record.requirementsFromReference.length!==5||
    record.requirementsFromReference.some(v=>v!==null&&(!Number.isInteger(v)||v<0||v>99))||
    !Array.isArray(record.disputedFields))
    fail('Source requirements missing or malformed.');
  const pendingCount=e.scalingAtPlusZero.filter(x=>x==='?').length;
  const namedGradeSource=record.explicitInitialScalingSource;
  if(namedGradeSource){
   if(pendingCount===0||namedGradeSource.sourceName!=='Fextralife Elden Ring Wiki (unversioned public upgrade table)'||
     namedGradeSource.sourceUrl!==expectedFexUrl(record.name)||
     namedGradeSource.standardRowLabel!=='Standard'||
     namedGradeSource.reinforcement!==0||namedGradeSource.affinity!=='default'||
     namedGradeSource.sourceGameVersion!=='not authenticated against App 1.17.2 / Regulation 1.17.3'||
     !Array.isArray(namedGradeSource.gradesAtPlusZero)||namedGradeSource.gradesAtPlusZero.length!==5||
     namedGradeSource.gradesAtPlusZero.some(g=>! /^[SABCDE-]$/.test(g))||
     namedGradeSource.gradesAtPlusZero.some((g,i)=>e.scalingAtPlusZero[i]!=='?'&&e.scalingAtPlusZero[i]!==g)||
     namedGradeSource.originallyUnreportedGradeCells!==pendingCount||
     namedGradeSource.attackPhysicalCorroboration!==e.attackAtPlusZero[0]||
     namedGradeSource.gameClientVerified!==false||namedGradeSource.publicationApproved!==false||
     namedGradeSource.independentlyReviewedScreenshot!==false)
     fail('Explicit +0 Standard grades require exact named source and cannot imply game verification.');
   explicitRows++;explicitCells+=pendingCount;
  }else if(pendingCount&&!new Set([
   'Marred Leather Shield','Marred Wooden Shield','Shield of the Guilty','Spiralhorn Shield'
  ]).has(record.name))fail('Expected explicit missing-grade source has been omitted.');
  const reqDiff=record.requirementsFromReference.some((v,i)=>v!==null&&v!==original.requirements[i]);
  const atkDiff=e.attackAtPlusZero.some((v,i)=>Math.abs(v-other.attackAtPlusZero[i])>1.01);
  const gradeDiff=e.scalingAtPlusZero.some((v,i)=>other.scalingGradesAsReported[i]!==null&&
    v!=='?'&&v!==other.scalingGradesAsReported[i]);
  const expectedDisagreements=[...(reqDiff?['requirements']:[]),...(atkDiff?['attackAtPlusZero']:[]),
    ...(gradeDiff?['scalingAtPlusZero']:[])];
  if(!equal(record.disputedFields,expectedDisagreements)||
    !equal(other.fieldDisagreements,expectedDisagreements.filter(x=>x!=='requirements'))||
    record.sourceStatus!==(expectedDisagreements.length?'SOURCE_CONFLICT':'SOURCE_REFERENCE_ONLY'))
    fail('Disputed published fields must never be silently reconciled.');
  if(expectedDisagreements.length){
   const third=record.thirdSource;
   const expectedCount=record.name==='Buckler'?2:1;
   if(!third||third.sourceName!=='ESO-UI named page'||
     !third.sourceUrl.startsWith('https://wiki.eso-ui.com/index.php/Elden_Ring%3A')||
     third.sourceVersion!=='not authenticated against App 1.17.2 / Regulation 1.17.3'||
     third.sourceLineageIndependenceEstablished!==false||
     third.gameClientVerified!==false||third.publicationApproved!==false||
     !Array.isArray(third.checks)||third.checks.length!==expectedCount||
     third.checks.some(c=>!expectedDisagreements.includes(c.field)||c.gameClientVerified!==false||
       !Number.isInteger(c.componentIndex)||c.componentIndex<0||c.componentIndex>=5||
       !['tarnished-app','eldenpedia','pinned-v117'].includes(c.agreesWith)))
     fail('Every disputed field must have exact third-source evidence, not asserted client proof.');
   const thirdExpected={
    'Buckler':[['attackAtPlusZero',0,68,'tarnished-app'],['scalingAtPlusZero',1,'D','tarnished-app']],
    "Carian Knight's Shield":[['attackAtPlusZero',1,40,'tarnished-app']],
    'Dragonclaw Shield':[['attackAtPlusZero',3,76,'eldenpedia']],
    'Fingerprint Stone Shield':[['attackAtPlusZero',0,139,'tarnished-app']],
    'Golden Greatshield':[['attackAtPlusZero',0,113,'tarnished-app']],
    'Erdtree Greatshield':[['scalingAtPlusZero',0,'D','tarnished-app']],
    'Inseparable Sword':[['scalingAtPlusZero',3,'C','eldenpedia']],
    'Visage Shield':[['requirements',0,44,'pinned-v117']]
   };
   const want=thirdExpected[record.name];
   if(!want||want.length!==third.checks.length||
     third.checks.some((c,i)=>c.field!==want[i][0]||c.componentIndex!==want[i][1]||
       c.value!==want[i][2]||c.agreesWith!==want[i][3]))
     fail('Third-party field-level corroboration differs from recorded named page.');
   if(record.name==='Erdtree Greatshield'&&(
     third.patchWeightCaveat?.esoWeight!==13.5||
     third.patchWeightCaveat?.post117ReferenceWeight!==11.5))
     fail('Erdtree third source weight is stale against 1.17; version caveat cannot be removed.');
  }else if(record.thirdSource!==undefined)
   fail('Non-disputed records must not be promoted by unrelated third-source evidence.');
  if(record.name==='Buckler'&&(!equal(record.additionalAttackSource?.attackAtPlusZero,[68,0,0,0,0])||
      !equal(e.attackAtPlusZero,[60,0,0,0,0])||
      !record.disputedFields.includes('scalingAtPlusZero')))
    fail('Buckler attack and scaling source disagreement lost.');
  if(record.name==='Visage Shield'&&(original.requirements[0]!==44||
     record.requirementsFromReference[0]!==24||
     record.additionalRequirementSource?.requirements?.[0]!==44))
    fail('Visage requirement discrepancy lost.');
  if(record.name==="Perfumer's Shield"&&(
    e.scalingAtPlusZero[0]!=='E'||other.scalingGradesAsReported[0]!=='E'||
    record.provisionalScalingGradeCitations?.[0]?.gameClientVerified!==false||
    record.provisionalScalingGradeCitations?.[0]?.sourceUrl!==other.sourceUrl))
    fail('Perfumer published STR E backfill lost its source.');
  if(record.name==='Gravel Stone Seal'&&(
    e.fieldLocator!=='wiki-individual-weapon-infobox-plus-zero'||
    record.perWeaponNumericCorroboration?.sourceUrl!=='https://wiki.eso-ui.com/index.php/Elden_Ring%3AGravel_Stone_Seal'||
    !equal(record.perWeaponNumericCorroboration.attackAtPlusZero,e.attackAtPlusZero)||
    record.perWeaponNumericCorroboration.gameClientVerified!==false))
    fail('Gravel Stone Seal original numeric infobox provenance lost.');
  seen.add(record.id);attackCount++;weightCount++;criticalCount++;scalingCount++;
  unknownGrades+=e.scalingAtPlusZero.filter(g=>g==='?').length;
  if(atkDiff)attackConflictCount++;
  if(gradeDiff)scalingConflictCount++;
  if(reqDiff)requirementConflictCount++;
  if(expectedDisagreements.length){
   conflictIds.push(record.id);
   conflicts.push({id:record.id,name:record.name,fields:expectedDisagreements,
    attackDiffs:impactName.filter((_,i)=>Math.abs(e.attackAtPlusZero[i]-other.attackAtPlusZero[i])>1.01)});
  }
 }
 if(seen.size!==72||attackCount!==ledger.communityFieldCoverage?.attack||
    weightCount!==ledger.communityFieldCoverage?.weight||
    criticalCount!==ledger.communityFieldCoverage?.critical||
    scalingCount!==ledger.communityFieldCoverage?.scalingRecords||
    ledger.crosscheckCoverageCount!==72||unknownGrades!==ledger.unknownScalingGradeCount||
    conflictIds.length!==ledger.sourceConflictItems||
    attackConflictCount!==ledger.attackConflictCount||
    scalingConflictCount!==ledger.scalingConflictCount||
    requirementConflictCount!==ledger.requirementConflictCount||
    ledger.thirdSourceCorroborationGroups!==8||ledger.thirdSourceCorroboratedDisputedFields!==9||
    explicitRows!==29||explicitCells!==111||
    ledger.explicitInitialScalingThirdSourceCount!==29||
    ledger.explicitInitialScalingAdditionalCells!==111||
    ledger.remainingUnreportedScalingGradeCount!==unknownGrades-explicitCells)
  fail('Cross-source completion or conflict audit totals drifted.');
 return {total:72,attackReferences:attackCount,weightReferences:weightCount,
  criticalReferences:criticalCount,scalingReferences:scalingCount,unknownScalingGrades:unknownGrades,
  crosscheckedReferences:72,sourceConflicts:conflictIds.length,conflictIds,conflicts,
  attackConflicts:attackConflictCount,scalingConflicts:scalingConflictCount,
  requirementConflicts:requirementConflictCount,thirdSourceGroups:8,thirdSourceFields:9,
  explicitDefaultScalingSourceRows:explicitRows,newlySourcedScalingCells:explicitCells,
  remainingUnreportedScalingCells:unknownGrades-explicitCells,
  currentGameVerified:0,readyForExactAr:0};
}
