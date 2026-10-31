import {bundleConflictCaptureDrafts} from './conflict-game-capture.mjs';
import {compareLocalScreenshotToFingerprint} from './ar-screenshot-fingerprint.mjs';
import {sameJsonStructure} from './json-structure-equal.mjs';

const fail=m=>{throw new RangeError(m);};
export const CONFLICT_BUNDLE_MAX_BYTES=110_000;

/**
 * Read a previously exported seven-entry bundle, re-derive every observation
 * from the CURRENT pinned community catalog and source ledger, and refuse
 * any changed status, source values, version or inconsistent outer envelope.
 * This checks *structure*, never authenticity of game screenshots.
 */
export function parseConflictCaptureBundle(ledger,catalog,raw){
 if(typeof raw!=='string'||raw.length<2||raw.length>CONFLICT_BUNDLE_MAX_BYTES)
  fail('Collection JSON is missing or exceeds 110 KB.');
 let bundle;
 try{bundle=JSON.parse(raw);}catch{fail('Collection JSON cannot be parsed.');}
 if(!bundle||typeof bundle!=='object'||Array.isArray(bundle)||
  bundle.recordType!=='unreviewed-seven-weapon-conflict-collection'||
  bundle.schemaVersion!==1||
  !Array.isArray(bundle.entries)||bundle.entries.length!==7)
  fail('Invalid seven-weapon evidence collection format.');
 const supplied=bundle.entries.filter(x=>x?.observation!==null)
  .map(x=>x?.observation);
 const canonical=bundleConflictCaptureDrafts(ledger,catalog,supplied);
 // Verifies full outer envelope as well as every re-derived inner observation.
 // Different JSON serializers may reorder object keys. That is harmless.
 // However every key and value, including review flags, must remain exact.
 if(!sameJsonStructure(bundle,canonical))
  fail('Saved evidence fields do not match the current source or UNREVIEWED schema.');
 return canonical;
}
export function reviewImportSummary(bundle){
 if(bundle?.recordType!=='unreviewed-seven-weapon-conflict-collection'||
  !Array.isArray(bundle.entries)||bundle.entries.length!==7||
  bundle.gameClientVerified!==false||
  bundle.independentlyReviewedScreenshotCount!==0)
  fail('Only an unreviewed seven-weapon checklist can be examined.');
 return {
  observations:bundle.capturedCount,
  pending:7-bundle.capturedCount,
  mismatchedVersion:bundle.entries.filter(x=>x.observation&&
   !x.observation.gameVersionMatchesTarget).length,
  sourceCommunity:bundle.entries.filter(x=>x.observation?.numericComparison===
   'matches-community-source').length,
  sourcePinned:bundle.entries.filter(x=>x.observation?.numericComparison===
   'matches-pinned-v117-source').length,
  sourceNeither:bundle.entries.filter(x=>x.observation?.numericComparison===
   'matches-neither-source').length,
  reviewStatus:'UNREVIEWED',gameClientVerified:false,
  note:'Only JSON structure and numeric source comparison were checked; original screenshot bytes and screenshot content have NOT been validated.'
 };
}
/** Re-select two original local image files; a hash match is byte identity only. */
export async function recheckConflictOriginalImages(bundle,caseId,titleFile,weaponFile,options={}){
 if(bundle?.recordType!=='unreviewed-seven-weapon-conflict-collection'||
  !Array.isArray(bundle.entries)||bundle.entries.length!==7)
  fail('Import a validated seven-weapon collection first.');
 const matching=bundle.entries.filter(x=>x?.id===caseId);
 if(matching.length!==1||matching[0].observation===null)
  fail('Choose a collected weapon observation, not a pending case.');
 if(!titleFile||!weaponFile)
  fail('Select both locally retained original screenshots.');
 const evidence=matching[0].observation;
 if(evidence.reviewStatus!=='UNREVIEWED'||evidence.gameClientVerified!==false||
  evidence.screenshotReviewed!==false)
  fail('Evidence cannot be auto-approved.');
 const [title,weapon]=await Promise.all([
  compareLocalScreenshotToFingerprint(titleFile,
   evidence.localScreenshots.titleScreen,options),
  compareLocalScreenshotToFingerprint(weaponFile,
   evidence.localScreenshots.weaponDetails,options)
 ]);
 return {
  caseId,weaponName:matching[0].weaponName,
  titleScreen:title,weaponDetails:weapon,
  bothBytesMatch:title.status==='bytes-match'&&weapon.status==='bytes-match',
  reviewStatus:'UNREVIEWED',screenshotReviewed:false,gameClientVerified:false,
  publicationApproved:false,
  note:'SHA-256 proves only whether each selected file has the same bytes as the imported fingerprint. It does NOT inspect screenshot pixels, verify the title/version, establish game authenticity or authorize publication.'
 };
}
