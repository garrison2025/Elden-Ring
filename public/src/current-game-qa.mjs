import {validateLocalScreenshotFingerprint} from './ar-screenshot-fingerprint.mjs';
import {sameJsonStructure} from './json-structure-equal.mjs';

const fail=m=>{throw new RangeError(m)};
const labels=Object.freeze({
 attack:['Physical','Magic','Fire','Lightning','Holy'],
 requirements:['STR','DEX','INT','FAI','ARC']
});
const names=Object.freeze({attack:'Attack +0',requirements:'Requirements',weight:'Equipment weight',scaling:'Initial scaling'});
const attrs=Object.freeze(['STR','DEX','INT','FAI','ARC']);
const equal=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i]);
const comp=(a,b)=>a!==null&&b!==null&&a===b;
const originalSize=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.length>=1&&a.length<=5;
const numericSource=v=>v===null||typeof v==='number'&&Number.isFinite(v)&&v>=0||typeof v==='string'&&/^(?:-|S|A|B|C|D|E)$/.test(v);
const fmt=v=>v===null?'NOT REPORTED':String(v);
const expectedGame={app:'1.17.2',regulation:'1.17.3'};
function createItem(row){
 if(!row||typeof row.id!=='string'||typeof row.weaponId!=='string'||typeof row.weaponName!=='string'||
  !['attack','requirements','weight','scaling'].includes(row.fieldType)||
  !originalSize(row.sourceA?.values,row.sourceB?.values)||
  !row.sourceA.values.every(numericSource)||!row.sourceB.values.every(numericSource)||
  !row.componentLabels?.length||row.componentLabels.length!==row.sourceA.values.length||
  !row.sourceA.url?.startsWith('https://')||!row.sourceB.url?.startsWith('https://')||
  row.sourceA.values.every((x,i)=>x===row.sourceB.values[i]))
  fail('Invalid disputed field evidence case.');
 return row;
}
/** No candidate is treated as a current game reading, even if 2+ pages agree. */
export function makeCurrentGameQAQueue(catalog,recovered,oldLedger){
 if(!Array.isArray(catalog?.weapons)||recovered?.total!==72||!Array.isArray(recovered.records)||
   oldLedger?.schemaVersion!==1||oldLedger.cases?.length!==7||
   oldLedger.requiredGameVersion?.app!==expectedGame.app||
   oldLedger.requiredGameVersion?.regulation!==expectedGame.regulation)
  fail('Missing original 7 + recovered 72 evidence or target App/Regulation versions.');
 const catalogMap=new Map(catalog.weapons.map(w=>[w.id,w]));
 const result=[];
 const add=r=>{
  if(!catalogMap.has(r.weaponId)||catalogMap.get(r.weaponId).name!==r.weaponName)
   fail('Disputed weapon no longer in canonical catalog.');
  if(!r.fieldType||result.some(x=>x.id===r.id))fail('Duplicate/invalid QA case.');
  result.push(createItem(r));
 };
 for(const old of oldLedger.cases){
  const fieldType=old.field==='baseAttack'?'attack':'requirements';
  const id='legacy-'+old.id;
  add({id,weaponId:old.id,weaponName:catalogMap.get(old.id)?.name,fieldType,
   componentLabels:[...(fieldType==='attack'?labels.attack:labels.requirements)],
   fieldLabel:names[fieldType],sourceA:{label:'Community published',url:old.wiki,values:old.community},
   sourceB:{label:'Pinned Regulation 1.17 derived',url:oldLedger.pinnedSourceUrl,values:old.pinned},
   thirdPublishedUrl:old.thirdPartyBasePlusZero?.sourceUrl??old.currentPatchCorroboration?.sourceUrl??null,
   sourceStatus:'SOURCE_CONFLICT_UNREVIEWED',gameClientVerified:false});
 }
 const stone=catalogMap.get('sote-reference-059'),ritual=catalogMap.get('tarnished-pack-117-05');
 if(!stone||!ritual)fail('Missing two published source dispute weapons.');
 add({id:'stone-attack',weaponId:stone.id,weaponName:stone.name,fieldType:'attack',
  componentLabels:[...labels.attack],fieldLabel:names.attack,
  sourceA:{label:'Published upgrade table +0',url:stone.checkedWith,values:[...stone.sourceAttackDisagreement.chosenAttack]},
  sourceB:{label:'Published headline, not game screen',url:stone.checkedWith,values:[119,0,0,0,0]},
  thirdPublishedUrl:'https://kamigame.jp/eldenring/page/324734066194679699.html',
  sourceStatus:'SOURCE_CONFLICT_UNREVIEWED',gameClientVerified:false});
 add({id:'stone-weight',weaponId:stone.id,weaponName:stone.name,fieldType:'weight',
  componentLabels:['Weight'],fieldLabel:names.weight,
  sourceA:{label:'Eldenpedia published',url:stone.sourceWeightDisagreement.firstSourceUrl,values:[3.5]},
  sourceB:{label:'Kamigame published',url:stone.sourceWeightDisagreement.secondSourceUrl,values:[5]},
  thirdPublishedUrl:stone.sourceWeightDisagreement.additionalSourceUrl,
  sourceStatus:'SOURCE_CONFLICT_UNREVIEWED',gameClientVerified:false});
 add({id:'ritual-req',weaponId:ritual.id,weaponName:ritual.name,fieldType:'requirements',
  componentLabels:[...labels.requirements],fieldLabel:names.requirements,
  sourceA:{label:'1.17.3-labelled secondary',url:ritual.secondarySourceDisagreement.currentVersionLabelled.sourceUrl,values:[13,12,0,0,0]},
  sourceB:{label:'Published guide',url:ritual.secondarySourceDisagreement.alternatives[1].sourceUrl,values:[15,12,0,0,0]},
  thirdPublishedUrl:ritual.secondarySourceDisagreement.alternatives[0].sourceUrl,
  sourceStatus:'SOURCE_CONFLICT_UNREVIEWED',gameClientVerified:false});
 add({id:'ritual-weight',weaponId:ritual.id,weaponName:ritual.name,fieldType:'weight',
  componentLabels:['Weight'],fieldLabel:names.weight,
  sourceA:{label:'1.17.3-labelled secondary',url:ritual.secondarySourceDisagreement.currentVersionLabelled.sourceUrl,values:[10]},
  sourceB:{label:'Published ESO-UI',url:ritual.secondarySourceDisagreement.alternatives[0].sourceUrl,values:[9]},
  thirdPublishedUrl:ritual.secondarySourceDisagreement.alternatives[1].sourceUrl,
  sourceStatus:'SOURCE_CONFLICT_UNREVIEWED',gameClientVerified:false});
 for(const w of recovered.records.filter(w=>w.disputedFields.length)){
  if(!catalogMap.has(w.id)||catalogMap.get(w.id).name!==w.name)fail('Recovered source row ID drift.');
  const ts=w.thirdSource?.sourceUrl??null;
  for(const field of w.disputedFields){
   if(field==='requirements'){
    for(let i=0;i<5;i++)if(w.requirementsFromReference[i]!==null&&
       w.requirementsFromReference[i]!==w.requirementsPinned117[i]){
      add({id:'recovered-'+w.id+'-req-'+i,weaponId:w.id,weaponName:w.name,fieldType:'requirements',
       componentLabels:[attrs[i]],fieldLabel:'Requirement '+attrs[i],
       sourceA:{label:'Eldenpedia comparison',url:w.reference.sourceUrl,values:[w.requirementsFromReference[i]]},
       sourceB:{label:'Pinned Regulation 1.17',url:catalogMap.get(w.id).sourceUrl,values:[w.requirementsPinned117[i]]},
       thirdPublishedUrl:ts,sourceStatus:'SOURCE_CONFLICT_UNREVIEWED',gameClientVerified:false});
    }
   }else if(field==='attackAtPlusZero'){
    for(let i=0;i<5;i++){
     const old=w.reference.attackAtPlusZero[i],now=w.crosscheck.attackAtPlusZero[i];
     if(Math.abs(old-now)<=1.01)continue;
     // An omitted attack type in a third-party display is NOT an observed 0.
     const absent=now===0&&old>0;
     add({id:'recovered-'+w.id+'-attack-'+i,weaponId:w.id,weaponName:w.name,fieldType:'attack',
      componentLabels:[labels.attack[i]],fieldLabel:'Attack +0 '+labels.attack[i],
      sourceA:{label:'Eldenpedia +0',url:w.reference.sourceUrl,values:[old]},
      sourceB:{label:absent?'Tarnished.app omitted this attack type':'Tarnished.app Base',url:w.crosscheck.sourceUrl,values:[absent?null:now]},
      thirdPublishedUrl:ts,sourceStatus:'SOURCE_CONFLICT_UNREVIEWED',gameClientVerified:false});
    }
   }else if(field==='scalingAtPlusZero'){
    for(let i=0;i<5;i++){
     const old=w.reference.scalingAtPlusZero[i],now=w.crosscheck.scalingGradesAsReported[i];
     if(now===null||old==='?'||old===now)continue;
     add({id:'recovered-'+w.id+'-scaling-'+i,weaponId:w.id,weaponName:w.name,fieldType:'scaling',
      componentLabels:[attrs[i]],fieldLabel:'Initial scaling '+attrs[i],
      sourceA:{label:'Eldenpedia initial grade',url:w.reference.sourceUrl,values:[old]},
      sourceB:{label:'Tarnished.app initial grade',url:w.crosscheck.sourceUrl,values:[now]},
      thirdPublishedUrl:ts,sourceStatus:'SOURCE_CONFLICT_UNREVIEWED',gameClientVerified:false});
    }
   }else fail('Unknown recovered source conflict field.');
  }
 }
 if(result.length!==20||new Set(result.map(x=>x.id)).size!==20||
   new Set(result.map(x=>x.weaponId)).size!==17)
  fail('Expected exactly 20 disputed fields across 17 original weapon identities.');
 return {
  schemaVersion:1,recordType:'current-game-field-qa-queue-unreviewed',
  expectedGame:{...expectedGame},
  expectedFields:20,weaponGroups:17,
  cases:result,observations:0,independentlyReviewedScreenshots:0,
  gameClientVerified:false,publicationApproved:false,
  note:'No screenshots have been inspected; these cases are source disputes, not certified game readings.'
 };
}
const safeString=(x,label,len=80)=>{
 if(typeof x!=='string'||!x.trim()||x.length>len||/[\u0000-\u001f\u007f]/.test(x))
  fail('Invalid '+label);
 return x.trim();
};
function observedValues(raw,item){
 if(!Array.isArray(raw)||raw.length!==item.componentLabels.length)
  fail('All on-screen components must be recorded, including explicit zero values.');
 return raw.map(value=>{
  const s=typeof value==='number'?String(value):value;
  if(typeof s!=='string')fail('Observed value must not be blank.');
  if(item.fieldType==='scaling'){
   if(!/^(?:-|S|A|B|C|D|E)$/.test(s))fail('Enter exact on-screen scaling grade.');
   return s;
  }
  if(item.fieldType==='weight'){
   if(!/^(?:0|[1-9]\d{0,2})(?:\.\d)?$/.test(s)||Number(s)>100)
    fail('Weight must be an explicit number 0–100 with at most one decimal.');
   return Number(s);
  }
  if(!/^(?:0|[1-9]\d{0,3})$/.test(s)||Number(s)>(item.fieldType==='requirements'?99:5000))
   fail('Requirements and attack components must be explicit whole numbers.');
  return Number(s);
 });
}
const validDate=s=>{
 if(typeof s!=='string'||!/^20\d\d-\d\d-\d\d$/.test(s))fail('Invalid observation date.');
 const t=new Date(s+'T00:00:00Z');
 if(!Number.isFinite(t.getTime())||t.toISOString().slice(0,10)!==s)fail('Invalid calendar date.');
 return s;
};
export function makeCurrentGameQADraft(queue,{
 caseId,observed,appVersion,regulationVersion,platform,observedAt,
 checkedPlusZero,checkedDefaultAffinity,checkedWeaponDetails,titleScreenshot,weaponScreenshot
}={}){
 if(queue?.schemaVersion!==1||queue.expectedFields!==20)fail('Invalid QA source queue.');
 const item=queue.cases.find(x=>x.id===caseId);
 if(!item)fail('Unknown disputed field case.');
 const values=observedValues(observed,item),app=safeString(appVersion,'App Version',40),
  reg=safeString(regulationVersion,'Regulation Version',40),
  gamePlatform=safeString(platform,'platform',70);
 const date=validDate(observedAt);
 if(checkedPlusZero!==true||checkedDefaultAffinity!==true||checkedWeaponDetails!==true)
  fail('Confirm +0, default affinity and actual weapon-detail panel.');
 const title=validateLocalScreenshotFingerprint(titleScreenshot);
 const detail=validateLocalScreenshotFingerprint(weaponScreenshot);
 if(title.sha256===detail.sha256&&title.byteLength===detail.byteLength)
  fail('Title screen and item-detail screenshot cannot be the same file.');
 const versionMatch=app===queue.expectedGame.app&&reg===queue.expectedGame.regulation;
 const matchingA=versionMatch&&values.every((v,i)=>comp(v,item.sourceA.values[i]));
 const matchingB=versionMatch&&values.every((v,i)=>comp(v,item.sourceB.values[i]));
 const comparison=versionMatch?(matchingA?'matches-published-source-a':matchingB?
  'matches-published-source-b':'matches-neither-published-source'):
  'not-compared-game-version-mismatch';
 return {
  schemaVersion:1,recordType:'UNREVIEWED-PLAYER-TRANSCRIPTION',
  caseId:item.id,weaponId:item.weaponId,weaponName:item.weaponName,
  fieldType:item.fieldType,componentLabels:[...item.componentLabels],observedComponents:values,
  appVersion:app,regulationVersion:reg,targetGame:{...queue.expectedGame},
  gameVersionMatchesTarget:versionMatch,platform:gamePlatform,observedAt:date,
  conditions:{reinforcement:0,affinity:'default/uninfused',weaponDetailPanel:true,userAttested:true},
  publishedSources:{sourceA:item.sourceA,sourceB:item.sourceB,thirdPublishedUrl:item.thirdPublishedUrl},
  publishedNumericComparison:comparison,
  screenshots:{titleScreen:title,weaponDetail:detail},
  reviewStatus:'UNREVIEWED',screenshotReviewed:false,gameClientVerified:false,
  publicationApproved:false,independentlyReviewedScreenshotCount:0,
  note:'SHA-256 fingerprints and player transcription have NOT been inspected or authenticated as genuine original-game client screenshots.'
 };
}
export function bundleCurrentGameQADrafts(queue,drafts=[]){
 if(queue?.schemaVersion!==1||queue.expectedFields!==20||
   !Array.isArray(drafts)||drafts.length>20)fail('Invalid queue or draft count.');
 const out={schemaVersion:1,recordType:'UNREVIEWED-GAME-QA-BUNDLE',
  expectedGame:{...queue.expectedGame},expectedFields:20,weaponGroups:17,
  observedCount:0,independentlyReviewedScreenshotCount:0,gameClientVerified:false,
  publicationApproved:false,reviewStatus:'UNREVIEWED',
  entries:queue.cases.map(c=>({caseId:c.id,weaponName:c.weaponName,fieldLabel:c.fieldLabel,observation:null}))};
 const seen=new Set();
 for(const draft of drafts){
  const item=queue.cases.find(x=>x.id===draft?.caseId);
  if(!item||seen.has(draft.caseId)||draft.recordType!=='UNREVIEWED-PLAYER-TRANSCRIPTION'||
    draft.reviewStatus!=='UNREVIEWED'||draft.gameClientVerified!==false||
    draft.publicationApproved!==false||draft.screenshotReviewed!==false||
    draft.independentlyReviewedScreenshotCount!==0)
   fail('Duplicate, stale, or falsely certified draft.');
  const recon=makeCurrentGameQADraft(queue,{
   caseId:draft.caseId,observed:draft.observedComponents,appVersion:draft.appVersion,
   regulationVersion:draft.regulationVersion,platform:draft.platform,observedAt:draft.observedAt,
   checkedPlusZero:draft.conditions?.reinforcement===0&&draft.conditions?.userAttested===true,
   checkedDefaultAffinity:draft.conditions?.affinity==='default/uninfused',
   checkedWeaponDetails:draft.conditions?.weaponDetailPanel===true,
   titleScreenshot:draft.screenshots?.titleScreen,weaponScreenshot:draft.screenshots?.weaponDetail
  });
  if(!sameJsonStructure(recon,draft))fail('Player draft data was modified after validation.');
  out.entries.find(x=>x.caseId===draft.caseId).observation=recon;
  seen.add(draft.caseId);
 }
 out.observedCount=seen.size;
 return out;
}
