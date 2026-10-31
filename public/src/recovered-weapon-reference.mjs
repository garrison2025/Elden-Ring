const fail=m=>{throw new RangeError(m)};
const normalizedName=s=>String(s).replace(/[\u2018\u2019]/g,"'").trim();
const equal=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i]);
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
    requirementConflictCount!==ledger.requirementConflictCount)
  fail('Cross-source completion or conflict audit totals drifted.');
 return {total:72,attackReferences:attackCount,weightReferences:weightCount,
  criticalReferences:criticalCount,scalingReferences:scalingCount,unknownScalingGrades:unknownGrades,
  crosscheckedReferences:72,sourceConflicts:conflictIds.length,conflictIds,conflicts,
  attackConflicts:attackConflictCount,scalingConflicts:scalingConflictCount,
  requirementConflicts:requirementConflictCount,currentGameVerified:0,readyForExactAr:0};
}
