const fail=m=>{throw new RangeError(m)};
const normalizedName=s=>String(s).replace(/[\u2018\u2019]/g,"'").trim();
export function validateRecoveredSourceReferences(ledger,catalog){
 if(ledger?.schemaVersion!==1||ledger.total!==72||!Array.isArray(ledger.records)||ledger.records.length!==72||
    ledger.gameClientVerified!==false||ledger.publicationApproved!==false||
    ledger.independentlyReviewedGameClientScreenshots!==0||!Array.isArray(catalog?.weapons))
  fail('Recovered source evidence must have 72 unverified records.');
 const sourceRows=catalog.weapons.filter(w=>w.flags?.includes('source-v117-neutral-requirements-only'));
 if(sourceRows.length!==72)fail('Original source-only roster has changed.');
 const byId=new Map(sourceRows.map(w=>[w.id,w]));
 const seen=new Set(),problemIds=[];
 let complete=0,attacks=0,weights=0,critical=0,grades=0,unknownGrades=0;
 const allowedCategories=new Set(['Small Shield','Medium Shield','Greatshield','Sacred Seal','Curved Sword','Greatsword']);
 for(const record of ledger.records){
  const source=byId.get(record.id),e=record.reference;
  if(!source||seen.has(record.id)||normalizedName(source.name)!==normalizedName(record.name)||
    source.category!==record.category||!allowedCategories.has(record.category)||
    record.requirementsPinned117?.join(',')!==source.requirements.join(',')||
    source.weight!==null||source.attack!==null||source.critical!==null||source.scaling!==null)
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
     record.gameClientVerified!==false||record.publicationApproved!==false||
     record.reviewStatus!=='UNREVIEWED')
    fail('Bad unverified numeric source fields or false certification.');
  if(!Array.isArray(record.sourceRequirements)||record.sourceRequirements.length!==5){
   // Kept separately as requirementsFromReference in the ledger to prevent accidental canonical update.
  }
  if(!Array.isArray(record.requirementsFromReference)||record.requirementsFromReference.length!==5||
     record.requirementsFromReference.some(v=>v!==null&&(!Number.isInteger(v)||v<0||v>99))||
     !Array.isArray(record.disputedFields)||
     record.disputedFields.some(f=>!['requirements','attackAtPlusZero'].includes(f)))
    fail('Missing per-field requirements or dispute list.');
  const reqDispute=record.requirementsFromReference.some((v,i)=>v!==null&&v!==source.requirements[i]);
  if(reqDispute!==record.disputedFields.includes('requirements')||
     (record.name==='Buckler')!==record.disputedFields.includes('attackAtPlusZero')||
     record.sourceStatus!==(record.disputedFields.length?'SOURCE_CONFLICT':'SOURCE_REFERENCE_ONLY'))
    fail('Source conflicts must not be hidden or certified.');
  if(record.name==='Buckler'&&(record.additionalAttackSource?.attackAtPlusZero?.join(',')!=='68,0,0,0,0'||
     e.attackAtPlusZero.join(',')!=='60,0,0,0,0'))fail('Buckler source disagreement lost.');
  if(record.name==='Visage Shield'&&(source.requirements[0]!==44||
     record.requirementsFromReference[0]!==24||
     record.additionalRequirementSource?.requirements?.[0]!==44))fail('Visage source discrepancy lost.');
  seen.add(record.id);complete++;
  attacks+=Number(e.attackAtPlusZero.length===5);weights+=Number(Number.isFinite(e.weight));
  critical+=Number(Number.isInteger(e.critical));
  grades+=Number(e.scalingAtPlusZero.length===5);
  unknownGrades+=e.scalingAtPlusZero.filter(g=>g==="?").length;
  if(record.disputedFields.length)problemIds.push(record.id);
 }
 if(complete!==72||unknownGrades!==ledger.unknownScalingGradeCount||
    problemIds.length!==ledger.sourceConflictItems||
    ledger.communityFieldCoverage?.attack!==attacks||
    ledger.communityFieldCoverage?.weight!==weights||
    ledger.communityFieldCoverage?.critical!==critical||
    ledger.communityFieldCoverage?.scalingRecords!==grades)
  fail('Source reference coverage tally failed.');
 return {total:complete,attackReferences:attacks,weightReferences:weights,criticalReferences:critical,
  scalingReferences:grades,unknownScalingGrades:unknownGrades,
  sourceConflicts:problemIds.length,conflictIds:problemIds,
  currentGameVerified:0,readyForExactAr:0};
}
