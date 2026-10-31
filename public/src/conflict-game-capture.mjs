import {validateLocalScreenshotFingerprint} from './ar-screenshot-fingerprint.mjs';
import {sameJsonStructure} from './json-structure-equal.mjs';

/**
 * Manual, browser-only capture of exact +0 weapon facts for seven unresolved
 * community-vs-pinned-v1.17 disputes. This does NOT verify that screenshots
 * depict real gameplay, matching game versions, or lawful data provenance.
 */
const fail=message=>{throw new RangeError(message);};
const attackFlag='v117-community-attack-conflict';
const reqFlag='v117-community-requirement-conflict';
export const CONFLICT_FIELDS=Object.freeze({
 baseAttack:['Physical','Magic','Fire','Lightning','Holy'],
 requirements:['STR','DEX','INT','FAI','ARC']
});
const safeField=(s,label,min=1,max=90)=>{
 if(typeof s!=='string'||s.trim().length<min||s.trim().length>max||
  /[\u0000-\u001f\u007f]/.test(s))
  fail(label+' must be a nonempty plain-text field.');
 return s.trim();
};
const validDate=str=>{
 if(typeof str!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(str))
  fail('Enter a valid observation date (YYYY-MM-DD).');
 const parsed=new Date(str+'T00:00:00Z');
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==str)
  fail('Invalid observation date.');
 return str;
};
export function getCaptureCase(ledger,catalog,id){
 if(ledger?.schemaVersion!==1||!Array.isArray(ledger.cases)||
  !Array.isArray(catalog?.weapons)||typeof id!=='string')
  fail('Invalid local source evidence or weapon catalog.');
 const match=ledger.cases.filter(c=>c?.id===id);
 const weapon=catalog.weapons.filter(w=>w?.id===id);
 if(match.length!==1||weapon.length!==1)
  fail('The selected source conflict was not uniquely found.');
 const row=match[0],w=weapon[0];
 if(!CONFLICT_FIELDS[row.field]||!['baseAttack','requirements'].includes(row.field)||
  !Array.isArray(row.community)||row.community.length!==5||
  !Array.isArray(row.pinned)||row.pinned.length!==5||
  !row.community.every((v,i)=>Number.isInteger(v)&&v>=0&&
   v===(row.field==='baseAttack'?w.attack?.[i]:w.requirements?.[i]))||
  !row.pinned.every(v=>Number.isInteger(v)&&v>=0)||
  row.community.every((v,i)=>v===row.pinned[i])||
  !(w.flags??[]).includes(row.field==='baseAttack'?attackFlag:reqFlag)||
  row.gameClientVerified!==false||row.reviewStatus!=='UNREVIEWED')
  fail('The selected conflict is stale or falsely certified.');
 return {
  id,weaponName:w.name,field:row.field,
  componentLabels:[...CONFLICT_FIELDS[row.field]],
  community:[...row.community],pinned:[...row.pinned]
 };
}
function parseObserved(observed,field){
 if(!Array.isArray(observed)||observed.length!==5)
  fail('Enter all five on-screen components, including explicit zero values.');
 const cap=field==='requirements'?99:5000;
 return observed.map((value,i)=>{
  const input=typeof value==='number'?String(value):value;
  if(typeof input!=='string'||! /^(?:0|[1-9][0-9]{0,3})$/.test(input)||
   Number(input)>cap)
   fail('Observed '+CONFLICT_FIELDS[field][i]+' must be a whole number 0–'+cap+
    '; blank is not zero.');
  return Number(input);
 });
}
/**
 * Numeric agreement is deliberately classified as a SOURCE match only.
 * Even with matching screenshot hashes, client evidence is UNREVIEWED.
 */
export function makeConflictCaptureDraft(ledger,catalog,{
 caseId,observed,appVersion,regulationVersion,platform,observedAt,
 checkedPlusZero,checkedDefaultAffinity,checkedWeaponDetails,
 titleScreenshot,weaponScreenshot
}={}){
 const weapon=getCaptureCase(ledger,catalog,caseId);
 const values=parseObserved(observed,weapon.field);
 const app=safeField(appVersion,'Game App version',1,40);
 const regulation=safeField(regulationVersion,'Game Regulation version',1,40);
 const target=ledger.requiredGameVersion;
 if(typeof target?.app!=='string'||typeof target.regulation!=='string')
  fail('Unknown target game version in local source evidence.');
 const gamePlatform=safeField(platform,'Game platform',2,60);
 const when=validDate(observedAt);
 if(checkedPlusZero!==true||checkedDefaultAffinity!==true||
  checkedWeaponDetails!==true)
  fail('Explicitly confirm +0, default weapon state and the WEAPON information panel.');
 const title=validateLocalScreenshotFingerprint(titleScreenshot);
 const equipment=validateLocalScreenshotFingerprint(weaponScreenshot);
 if(title.sha256===equipment.sha256&&title.byteLength===equipment.byteLength)
  fail('Title-screen and weapon-detail proof must be two different files.');
 const gameVersionMatchesTarget=app===target.app&&regulation===target.regulation;
 const eq=a=>a.every((n,i)=>n===values[i]);
 const numericMatch=gameVersionMatchesTarget?
  eq(weapon.community)?'matches-community-source':
  eq(weapon.pinned)?'matches-pinned-v117-source':'matches-neither-source':
  'not-compared-version-mismatch';
 return {
  schemaVersion:1,recordType:'unreviewed-weapon-conflict-menu-transcription',
  caseId:weapon.id,weaponName:weapon.weaponName,field:weapon.field,
  componentLabels:weapon.componentLabels,
  gameAppVersion:app,regulationVersion:regulation,
  targetAppVersion:target.app,targetRegulationVersion:target.regulation,
  gameVersionMatchesTarget,
  platform:gamePlatform,observedAt:when,
  conditions:{reinforcementLevel:0,affinity:'default/uninfused',
   weaponDetailsScreen:true,userAttested:true},
  observedComponents:values,
  publishedSources:{community:weapon.community,pinnedV117:weapon.pinned},
  numericComparison:numericMatch,
  localScreenshots:{titleScreen:title,weaponDetails:equipment},
  reviewStatus:'UNREVIEWED',screenshotReviewed:false,
  gameClientVerified:false,publicationApproved:false,
  independentlyReviewedScreenshotCount:0,
  limitations:[
   'Both screenshots have only been SHA-256 fingerprinted in the local browser, not inspected or uploaded.',
   'User transcription and claimed game version/conditions have not been authenticated.',
   'A numerical agreement with a published source is not current-game verification or publication approval.',
   'This observes raw +0 weapon details or requirements, not character AR or enemy damage.'
  ]
 };
}
export function makeConflictCaptureChecklist(ledger,catalog){
 if(ledger?.schemaVersion!==1||!Array.isArray(ledger.cases)||
  !Array.isArray(catalog?.weapons))fail('Missing local seven-case source ledger.');
 const entries=ledger.cases.map(c=>getCaptureCase(ledger,catalog,c.id));
 if(entries.length!==7||new Set(entries.map(x=>x.id)).size!==7)
  fail('Expected exactly seven distinct unresolved source conflicts.');
 return {
  schemaVersion:1,recordType:'unreviewed-seven-weapon-conflict-collection',
  expectedAppVersion:ledger.requiredGameVersion.app,
  expectedRegulationVersion:ledger.requiredGameVersion.regulation,
  entries:entries.map(item=>({
   ...item,observation:null,taskStatus:'PENDING_REAL_GAME_EVIDENCE'
  })),
  capturedCount:0,independentlyReviewedScreenshotCount:0,
  reviewStatus:'UNREVIEWED',gameClientVerified:false,publicationApproved:false,
  note:'All seven entries await manually captured game screenshots; no current-game readings are synthesized.'
 };
}
export function bundleConflictCaptureDrafts(ledger,catalog,provided=[]){
 const checklist=makeConflictCaptureChecklist(ledger,catalog);
 if(!Array.isArray(provided)||provided.length>7)
  fail('Expected at most seven local observation drafts.');
 const seen=new Set();
 for(const draft of provided){
  if(!draft||typeof draft!=='object'||seen.has(draft.caseId)||
   draft.recordType!=='unreviewed-weapon-conflict-menu-transcription'||
   draft.reviewStatus!=='UNREVIEWED'||draft.gameClientVerified!==false||
   draft.publicationApproved!==false||draft.screenshotReviewed!==false||
   draft.independentlyReviewedScreenshotCount!==0)
   fail('Duplicate or falsely approved local observation.');
  const entry=checklist.entries.find(item=>item.id===draft.caseId);
  if(!entry)fail('Observation ID is not in the seven-case checklist.');
  if(!Array.isArray(draft.observedComponents)||draft.observedComponents.length!==5||
   !draft.observedComponents.every(x=>Number.isInteger(x)&&x>=0)||
   draft.weaponName!==entry.weaponName||draft.field!==entry.field)
   fail('Corrupt or stale observation.');
  // Normalize from the full evidence again, rather than blindly trust caller
  // supplied derived source matches or version/condition claims.
  const validated=makeConflictCaptureDraft(ledger,catalog,{
   caseId:draft.caseId,observed:draft.observedComponents,
   appVersion:draft.gameAppVersion,regulationVersion:draft.regulationVersion,
   platform:draft.platform,observedAt:draft.observedAt,
   checkedPlusZero:draft.conditions?.reinforcementLevel===0&&draft.conditions?.userAttested===true,
   checkedDefaultAffinity:draft.conditions?.affinity==='default/uninfused',
   checkedWeaponDetails:draft.conditions?.weaponDetailsScreen===true,
   titleScreenshot:draft.localScreenshots?.titleScreen,
   weaponScreenshot:draft.localScreenshots?.weaponDetails
  });
  if(!sameJsonStructure(validated,draft))
   fail('Draft derived readings or status have been tampered with.');
  entry.observation=validated;entry.taskStatus='UNREVIEWED_PLAYER_TRANSCRIPTION';
  seen.add(draft.caseId);
 }
 checklist.capturedCount=seen.size;
 return checklist;
}
