import {makeUnreviewedArObservation} from './ar-observation.mjs';
import {convertCompactRegulation} from './regulation-import.mjs';
import {calculateAr} from './weapon-ar.mjs';

const fail=msg=>{throw new RangeError(msg);};
/**
 * Offline re-evaluation of an UNREVIEWED game-menu JSON draft, using a
 * freshly supplied local source. This tests internal numeric reproducibility,
 * NEVER the screenshot, game version, independent origin or rights.
 */
export function recheckUnreviewedArDraft(root,{gameVersion,sourceReference,draft,synthetic=false}={}){
 if(synthetic)fail('Fictional demo data cannot recheck a real-game observation.');
 if(!draft||typeof draft!=='object'||Array.isArray(draft)||
    draft.schemaVersion!==1||draft.recordType!=='independent-game-menu-ar-observation-draft'||
    draft.reviewStatus!=='UNREVIEWED'||draft.gameClientVerified!==false||
    draft.publicationApproved!==false||draft.sourceEvidence?.screenshotReviewed!==false)
  fail('Only unchanged, UNREVIEWED observation drafts are supported.');
 const input=draft.exactInputs||{},candidate=draft.candidateCalculation||{};
 const normalized=makeUnreviewedArObservation({
  weaponName:input.weaponName,sourceVersion:candidate.parameterSourceVersion,
  gameAppVersion:draft.gameAppVersion,regulationVersion:draft.regulationVersion,
  platform:draft.platform,observedAt:draft.observedAt,
  evidenceReference:draft.sourceEvidence?.reference,stats:input.stats,
  upgrade:input.upgrade,twoHanded:input.twoHanded,
  observedTotal:draft.expectedOutputs?.totalAr,candidateTotal:candidate.totalAr
 });
 const storedFieldsConsistent=
  candidate.numericMatch===normalized.candidateCalculation.numericMatch&&
  candidate.differenceCandidateMinusObserved===
   normalized.candidateCalculation.differenceCandidateMinusObserved;
 if(typeof gameVersion!=='string'||!gameVersion.trim()||
    typeof sourceReference!=='string'||!sourceReference.trim())
  fail('Current source version and reference must be supplied.');
 if(gameVersion.trim()!==candidate.parameterSourceVersion)
  return {status:'source-version-mismatch',sourceVersion:gameVersion,
   draftSourceVersion:candidate.parameterSourceVersion,
   storedFieldsConsistent,gameClientVerified:false,reviewStatus:'UNREVIEWED',
   reason:'Imported parameter source version differs from the source version recorded in the draft. No recalculation was performed.'};
 const profile=convertCompactRegulation(root,{
  weaponName:input.weaponName,gameVersion,sourceReference
 });
 const fresh=calculateAr(profile,input.stats,{upgrade:input.upgrade,twoHanded:input.twoHanded});
 const drift=fresh.total-candidate.totalAr,gameGap=fresh.total-normalized.expectedOutputs.totalAr;
 return {status:!storedFieldsConsistent?'draft-fields-inconsistent':
  drift===0?'candidate-reproduced-unreviewed':'candidate-calculation-drift',
  sourceVersion:gameVersion,weaponName:input.weaponName,
  sourceUpgrade:input.upgrade,twoHanded:input.twoHanded,
  originalCandidateTotal:candidate.totalAr,recomputedCandidateTotal:fresh.total,
  gameMenuTranscription:normalized.expectedOutputs.totalAr,
  differenceFreshMinusStored:drift,differenceFreshMinusGame:gameGap,
  storedFieldsConsistent,gameClientVerified:false,reviewStatus:'UNREVIEWED',
  screenshotInspected:false,sourceVersionProven:false,
  reason:'Only arithmetic was recomputed from the currently loaded source; no actual game client or screenshot was independently checked.'};
}
