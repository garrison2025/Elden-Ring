import {validateCommunityCatalog} from './community-weapons.mjs';
import {fingerprintLocalScreenshot} from './ar-screenshot-fingerprint.mjs';
import {
 getCaptureCase,makeConflictCaptureDraft,makeConflictCaptureChecklist,
 bundleConflictCaptureDrafts
} from './conflict-game-capture.mjs';

const el=id=>document.getElementById('conflict-capture-'+id);
const create=(tag,text)=>{
 const node=document.createElement(tag);
 if(text!==undefined)node.textContent=text;
 return node;
};
let ledger=null,catalog=null,activeCase=null,collecting=false;
const drafts=new Map();
const note=message=>{el('feedback').textContent=message;};
const resetChecks=()=>{
 for(const id of ['plus-zero','default','details'])el(id).checked=false;
};
function renderSelectedCase(){
 if(!ledger||!catalog)return;
 const select=el('case');
 try{
  activeCase=getCaptureCase(ledger,catalog,select.value);
  const summary=el('source');
  const labels=activeCase.componentLabels.map((label,i)=>label+': '+
   activeCase.community[i]+' (community) / '+activeCase.pinned[i]+' (pinned 1.17)');
  summary.textContent=activeCase.weaponName+' · '+(
   activeCase.field==='requirements'?'Five attribute requirements':'Five +0 weapon base-attack components')+
   '. Source comparison: '+labels.join('; ')+
   '. No observed values are prefilled and no source is treated as confirmed game truth.';
  const root=el('values');root.replaceChildren();
  for(let i=0;i<5;i++){
   const label=create('label');label.className='field';
   const name=create('span',activeCase.componentLabels[i]+' (observed in game)');
   const input=create('input');
   input.type='number';input.min='0';input.max=activeCase.field==='requirements'?'99':'5000';
   input.step='1';input.inputMode='numeric';
   input.dataset.component=String(i);
   input.placeholder='Enter actual value, 0 if zero';
   input.autocomplete='off';
   label.append(name,input);root.append(label);
  }
  el('weapon-image').value='';
  resetChecks();
  note('Select genuine screenshots and type all five in-game values to record an UNREVIEWED draft. The title-screen screenshot may be reused for the same session.');
 }catch(error){
  activeCase=null;note('Unable to select case: '+error.message);
 }
}
function renderProgress(){
 if(!ledger||!catalog)return;
 const root=el('progress');root.replaceChildren();
 const records=bundleConflictCaptureDrafts(ledger,catalog,[...drafts.values()]);
 for(const item of records.entries){
  const tr=create('tr'),name=create('th',item.weaponName);
  name.scope='row';
  const status=create('td');
  const draft=drafts.get(item.id);
  status.textContent=draft?
   'Player transcription recorded · '+draft.numericComparison+
   ' · UNREVIEWED · game version '+draft.gameAppVersion+' / '+draft.regulationVersion:
   'Pending real game evidence · no observed numbers';
  tr.append(name,status);root.append(tr);
 }
 el('count').textContent=drafts.size+' / 7 player observation(s) captured; '+
  '0 independently reviewed screenshots; 0 certified game-client goldens.';
}
const available=()=>Boolean(ledger&&catalog);
function ready(){
 const select=el('case');
 const ordered=[...ledger.cases].sort((a,b)=>a.priority-b.priority||
  a.id.localeCompare(b.id));
 select.replaceChildren();
 for(const row of ordered){
  const info=getCaptureCase(ledger,catalog,row.id);
  const opt=create('option',info.weaponName+
   (info.field==='requirements'?' · attribute requirements':' · +0 base attack'));
  opt.value=row.id;select.append(opt);
 }
 select.disabled=false;el('add').disabled=false;el('export').disabled=false;
 renderSelectedCase();renderProgress();
}
el('case').addEventListener('change',renderSelectedCase);
el('add').addEventListener('click',async()=>{
 if(collecting)return;
 collecting=true;el('add').disabled=true;el('case').disabled=true;
 try{
  if(!available()||!activeCase)throw new RangeError('Source data has not loaded.');
  const selected=activeCase;
  const observed=[...el('values').querySelectorAll('input[data-component]')]
   .map(node=>node.value);
  const version=el('app').value,regulation=el('regulation').value;
  const platform=el('platform').value,date=el('date').value;
  const titleFile=el('title-image').files?.[0];
  const weaponFile=el('weapon-image').files?.[0];
  if(!titleFile||!weaponFile)
   throw new RangeError('Select both an actual version/title screenshot and a weapon-details screenshot.');
  const [titleScreenshot,weaponScreenshot]=await Promise.all([
   fingerprintLocalScreenshot(titleFile),
   fingerprintLocalScreenshot(weaponFile)
  ]);
  const draft=makeConflictCaptureDraft(ledger,catalog,{
   caseId:selected.id,observed,appVersion:version,
   regulationVersion:regulation,platform,observedAt:date,
   checkedPlusZero:el('plus-zero').checked,
   checkedDefaultAffinity:el('default').checked,
   checkedWeaponDetails:el('details').checked,
   titleScreenshot,weaponScreenshot
  });
  drafts.set(selected.id,draft);
  renderProgress();
  note('Recorded '+draft.weaponName+' as UNREVIEWED. Comparison: '+
   draft.numericComparison+'. This is player-transcribed, fingerprint-only evidence—NOT verified gameplay. '+
   'Download JSON and keep the original screenshots; independent review is still required.');
  resetChecks();
  el('weapon-image').value='';
 }catch(error){
  note('Observation was not recorded: '+error.message+
   '. Existing session records were preserved.');
 }finally{
  collecting=false;el('add').disabled=!available();el('case').disabled=!available();
 }
});
el('clear').addEventListener('click',()=>{
 if(collecting){note('Finish the current file fingerprint first.');return;}
 drafts.clear();
 // Privacy: clear both local File input references and every typed value too.
 for(const id of ['title-image','weapon-image','app','regulation','date'])
  el(id).value='';
 el('platform').value='';
 if(ledger&&catalog){renderSelectedCase();renderProgress();}
 note('Temporary session observations, selected screenshot files and typed version/session details cleared. No browser storage or server copies were created.');
});
el('export').addEventListener('click',()=>{
 try{
  if(!available())throw new RangeError('Source data has not loaded.');
  const bundle=bundleConflictCaptureDrafts(ledger,catalog,[...drafts.values()]);
  const body=JSON.stringify(bundle,null,2)+'\n';
  const file=new Blob([body],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(file);
  const link=create('a');
  link.href=url;link.download='elden-ring-seven-conflicts-UNREVIEWED.json';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  note('Downloaded an UNREVIEWED '+drafts.size+'/7 observation collection. '+
   'It contains filenames and hashes but no screenshot image bytes, and is NOT an approval.');
 }catch(error){note('Unable to export checklist: '+error.message);}
});
Promise.all([
 fetch('../data/weapon-conflict-evidence.json',{cache:'default'}).then(async r=>{
  if(!r.ok)throw new Error('Seven-case evidence HTTP '+r.status);
  return r.json();
 }),
 fetch('../data/community-weapon-catalog.json',{cache:'default'}).then(async r=>{
  if(!r.ok)throw new Error('Source weapon catalog HTTP '+r.status);
  return validateCommunityCatalog(await r.json());
 })
]).then(([rawLedger,validatedCatalog])=>{
 ledger=rawLedger;catalog=validatedCatalog;
 makeConflictCaptureChecklist(ledger,catalog);
 ready();
}).catch(error=>{
 note('Source data unavailable; observation form disabled: '+error.message+
  '. No user data or files were uploaded.');
});
