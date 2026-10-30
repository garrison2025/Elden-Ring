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
  batch.observations.length>30||batch.submittedCases!==batch.observations.length)
  fail('Expected one unmodified UNREVIEWED observation batch with up to 30 cases.');
 const used=new Set(),rows=[];
 for(const item of batch.observations){
  if(!item||typeof item!=='object'||Array.isArray(item)||
   typeof item.caseId!=='string'||!/^AR-[0-9]{2}$/.test(item.caseId)||
   used.has(item.caseId))
   fail('Duplicate or malformed batch case id.');
  used.add(item.caseId);
  try{
   const fp=item.observation?.sourceEvidence?.screenshotFingerprint;
   let hasFingerprint=false;
   if(fp!==undefined&&fp!==null){
    const valid=validateLocalScreenshotFingerprint(fp);
    if(valid.filename!==item.observation?.sourceEvidence?.reference)
     fail('Screenshot fingerprint filename must match observation evidence reference.');
    hasFingerprint=true;
   }
   const result=recheckUnreviewedArDraft(root,{
    gameVersion,sourceReference,draft:item.observation,synthetic});
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
