import {recheckUnreviewedArDraft} from './ar-observation-recheck.mjs';
import {validateLocalScreenshotFingerprint} from './ar-screenshot-fingerprint.mjs';

const fail=msg=>{throw new RangeError(msg);};
/**
 * Offline arithmetic *recheck* of locally exported UNREVIEWED batches.
 * Missing screenshot inspection and version evidence remain explicit.
 * Individual broken observations are reported, not silently dropped.
 */
export function recheckUnreviewedArBatch(root,{
 gameVersion,sourceReference,batch,synthetic=false
}={}){
 if(synthetic)fail('Fictional demo source cannot recheck game-client evidence.');
 if(!batch||typeof batch!=='object'||Array.isArray(batch)||
  batch.schemaVersion!==1||
  batch.recordType!=='unreviewed-game-menu-AR-observation-batch'||
  batch.reviewStatus!=='UNREVIEWED'||batch.gameClientVerified!==false||
  batch.publicationApproved!==false||batch.screenshotReviewedCount!==0||
  !Array.isArray(batch.observations)||!batch.observations.length||
  batch.observations.length>30||batch.submittedCases!==batch.observations.length||
  !Number.isInteger(batch.plannedCases)||batch.plannedCases<batch.submittedCases||
  batch.plannedCases>30||
  typeof batch.weaponName!=='string'||!batch.weaponName.trim()||
  typeof batch.sourceVersion!=='string'||!batch.sourceVersion.trim()||
  !Number.isInteger(batch.numericalMatches)||batch.numericalMatches<0||
  !Number.isInteger(batch.fingerprintedCases)||batch.fingerprintedCases<0||
  batch.numericalMatches>batch.submittedCases||
  batch.fingerprintedCases>batch.submittedCases)
  fail('Expected one unmodified UNREVIEWED observation batch with up to 30 cases.');
 // Summary counts are not evidence. Reject them if they disagree with the
 // individual rows instead of displaying a forged number of numeric matches.
 const declaredMatches=batch.observations.filter(item=>
  item?.observation?.candidateCalculation?.numericMatch===true).length;
 const declaredFingerprints=batch.observations.filter(item=>
  item?.observation?.sourceEvidence?.screenshotFingerprint!=null).length;
 if(batch.numericalMatches!==declaredMatches||
    batch.fingerprintedCases!==declaredFingerprints)
  fail('Batch summary counts disagree with the submitted observations.');
 const used=new Set(),references=new Set(),hashes=new Set(),rows=[];
 for(const item of batch.observations){
  if(!item||typeof item!=='object'||Array.isArray(item)||
   typeof item.caseId!=='string'||!/^AR-[0-9]{2}$/.test(item.caseId)||
   used.has(item.caseId))
   fail('Duplicate or malformed batch case id.');
  used.add(item.caseId);
  try{
   if(item.observation?.exactInputs?.weaponName!==batch.weaponName||
      item.observation?.candidateCalculation?.parameterSourceVersion!==batch.sourceVersion)
    fail('Observation weapon identity or parameter source version differs from batch metadata.');
   const ref=item.observation?.sourceEvidence?.reference;
   if(typeof ref!=='string'||!ref.trim())
    fail('Observation evidence reference is missing.');
   const refKey=ref.trim().toLocaleLowerCase('en-US');
   if(references.has(refKey))
    fail('Duplicate evidence reference across AR test cases.');
   const fp=item.observation?.sourceEvidence?.screenshotFingerprint;
   let hasFingerprint=false,hashKey=null;
   if(fp!==undefined&&fp!==null){
    const valid=validateLocalScreenshotFingerprint(fp);
    if(valid.filename!==item.observation?.sourceEvidence?.reference)
     fail('Screenshot fingerprint filename must match observation evidence reference.');
    if(hashes.has(valid.sha256))
     fail('Duplicate screenshot bytes claimed for distinct AR test cases.');
    hashKey=valid.sha256;hasFingerprint=true;
   }
   const result=recheckUnreviewedArDraft(root,{
    gameVersion,sourceReference,draft:item.observation,synthetic});
   references.add(refKey);
   if(hashKey)hashes.add(hashKey);
   rows.push({caseId:item.caseId,status:result.status,
    differenceFreshMinusStored:result.differenceFreshMinusStored??null,
    differenceFreshMinusGame:result.differenceFreshMinusGame??null,
    storedFieldsConsistent:result.storedFieldsConsistent,
    screenshotFingerprintRecorded:hasFingerprint,gameClientVerified:false});
  }catch(error){
   rows.push({caseId:item.caseId,status:'recheck-rejected',
    differenceFreshMinusStored:null,differenceFreshMinusGame:null,
    storedFieldsConsistent:false,screenshotFingerprintRecorded:false,gameClientVerified:false,
    reason:String(error?.message??error).slice(0,220)});
  }
 }
 const counts={};
 for(const entry of rows)counts[entry.status]=(counts[entry.status]??0)+1;
 return {schemaVersion:1,recordType:'unreviewed-ar-batch-recheck-report',
  reviewStatus:'UNREVIEWED',gameClientVerified:false,
  screenshotInspected:false,sourceVersionProven:false,
  reviewedScreenshotCount:0,storedFingerprintCount:rows.filter(x=>x.screenshotFingerprintRecorded).length,
  submittedCases:rows.length,statusCounts:counts,rows,
  note:'Candidate arithmetic and optional hash metadata were checked against the currently loaded source. No screenshot bytes were read by this worker, and no game client, screenshot authenticity, Regulation version, rights or actual damage were independently validated.'};
}
