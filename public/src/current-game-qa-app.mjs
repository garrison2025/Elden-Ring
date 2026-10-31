import {fingerprintLocalScreenshot} from './ar-screenshot-fingerprint.mjs';
import {validateCommunityCatalog} from './community-weapons.mjs';
import {validateRecoveredSourceReferences} from './recovered-weapon-reference.mjs';
import {makeCurrentGameQAQueue,makeCurrentGameQADraft,bundleCurrentGameQADrafts} from './current-game-qa.mjs';

const byId=s=>document.getElementById('qa-'+s);
const el=(name,value)=>{const node=document.createElement(name);if(value!==undefined)node.textContent=String(value);return node;};
const drafts=new Map();
let queue=null,active=null,working=false;
function notify(message){byId('feedback').textContent=message;}
function resetConditions(){for(const k of ['zero','default','detail'])byId(k).checked=false;}
function selectCase(){
 if(!queue)return;
 active=queue.cases.find(x=>x.id===byId('case').value)??null;
 if(!active)return;
 const source=byId('sources');
 source.replaceChildren();
 const title=el('p',active.weaponName+' · '+active.fieldLabel+
   ' · Source A: '+active.sourceA.values.map(x=>x===null?'NOT REPORTED':x).join(', ')+
   ' / Source B: '+active.sourceB.values.map(x=>x===null?'NOT REPORTED':x).join(', '));
 source.append(title);
 for(const ref of [active.sourceA,active.sourceB]){
  const anchor=el('a',ref.label);anchor.href=ref.url;anchor.rel='noopener noreferrer';
  anchor.target='_blank';source.append(anchor,el('span','  '));
 }
 if(active.thirdPublishedUrl){
  const third=el('a','Third published reference');third.href=active.thirdPublishedUrl;
  third.rel='noopener noreferrer';third.target='_blank';source.append(third);
 }
 const values=byId('values');values.replaceChildren();
 for(const labelName of active.componentLabels){
  const field=el('label');field.className='field';
  field.append(el('span',labelName+' (read from actual game, not prefilled)'));
  const input=el('input');input.dataset.qaValue='1';input.autocomplete='off';
  if(active.fieldType==='scaling'){
   input.type='text';input.placeholder='- or S/A/B/C/D/E';input.maxLength=1;
  }else{
   input.type='number';input.min='0';input.step=active.fieldType==='weight'?'0.1':'1';
   input.max=active.fieldType==='weight'?'100':active.fieldType==='requirements'?'99':'5000';
   input.placeholder='Type observed value; enter 0 explicitly if shown';
  }
  field.append(input);values.append(field);
 }
 byId('weapon').value='';resetConditions();
 notify('Record an UNREVIEWED observation only if you have real game-menu screenshots. Nothing is uploaded or autosaved.');
}
function renderProgress(){
 const wrap=byId('progress');wrap.replaceChildren();
 const state=bundleCurrentGameQADrafts(queue,[...drafts.values()]);
 for(const x of state.entries){
  const tr=el('tr'),heading=el('th',x.weaponName+' · '+x.fieldLabel);heading.scope='row';
  tr.append(heading,el('td',x.observation?'Player-transcribed, UNREVIEWED ('+x.observation.publishedNumericComparison+')':'Awaiting original game screenshot'));
  wrap.append(tr);
 }
 byId('total').textContent=state.observedCount+'/20 locally recorded, 0 independently reviewed, 0 game-client verified.';
}
byId('case').addEventListener('change',selectCase);
byId('add').addEventListener('click',async()=>{
 if(!queue||!active||working)return;working=true;byId('add').disabled=true;
 try{
  const title=byId('title').files?.[0],detail=byId('weapon').files?.[0];
  if(!title||!detail)throw RangeError('Two actual screenshots are required.');
  const [titleScreenshot,weaponScreenshot]=await Promise.all([
   fingerprintLocalScreenshot(title),fingerprintLocalScreenshot(detail)
  ]);
  const values=[...byId('values').querySelectorAll('input[data-qa-value]')].map(x=>x.value);
  const draft=makeCurrentGameQADraft(queue,{
   caseId:active.id,observed:values,appVersion:byId('app').value,
   regulationVersion:byId('regulation').value,platform:byId('platform').value,
   observedAt:byId('date').value,checkedPlusZero:byId('zero').checked,
   checkedDefaultAffinity:byId('default').checked,checkedWeaponDetails:byId('detail').checked,
   titleScreenshot,weaponScreenshot
  });
  drafts.set(active.id,draft);renderProgress();
  notify('Saved only a temporary UNREVIEWED player transcription and two file hashes. No image reviewed, no game certification.');
  byId('weapon').value='';resetConditions();
 }catch(error){notify('Nothing recorded: '+error.message);}
 finally{working=false;byId('add').disabled=!queue;}
});
byId('export').addEventListener('click',()=>{
 if(!queue){notify('No source cases loaded.');return;}
 try{
  const bundle=bundleCurrentGameQADrafts(queue,[...drafts.values()]);
  const blob=new Blob([JSON.stringify(bundle,null,2)+'\n'],{type:'application/json'});
  const uri=URL.createObjectURL(blob),anchor=el('a');anchor.href=uri;
  anchor.download='elden-ring-20-field-UNREVIEWED-capture.json';
  document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(uri),1000);
  notify('Downloaded UNREVIEWED local transcription, filenames and SHA-256 only. Keep originals privately for independent review.');
 }catch(error){notify('Export blocked: '+error.message);}
});
byId('clear').addEventListener('click',()=>{
 if(working)return;
 drafts.clear();
 for(const k of ['title','weapon','app','regulation','date'])byId(k).value='';
 byId('platform').value='';
 if(queue){selectCase();renderProgress();}
 notify('Session drafts, image inputs and selected files cleared. No persistent browser storage was used.');
});
Promise.all([
 fetch('../data/community-weapon-catalog.json').then(r=>{if(!r.ok)throw Error('Catalog HTTP '+r.status);return r.json();}),
 fetch('../data/v117-recovered-72-reference.json').then(r=>{if(!r.ok)throw Error('72 evidence HTTP '+r.status);return r.json();}),
 fetch('../data/weapon-conflict-evidence.json').then(r=>{if(!r.ok)throw Error('Legacy 7 evidence HTTP '+r.status);return r.json();})
]).then(([raw,recovered,original])=>{
 validateCommunityCatalog(raw);validateRecoveredSourceReferences(recovered,raw);
 queue=makeCurrentGameQAQueue(raw,recovered,original);
 byId('case').replaceChildren();
 const ordered=[...queue.cases].sort((a,b)=>a.weaponName.localeCompare(b.weaponName)||a.fieldLabel.localeCompare(b.fieldLabel));
 for(const item of ordered){
  const option=el('option',item.weaponName+' — '+item.fieldLabel);option.value=item.id;
  byId('case').append(option);
 }
 byId('case').disabled=false;byId('add').disabled=false;byId('export').disabled=false;
 selectCase();renderProgress();
}).catch(error=>{
 notify('Source validation failed; all capture controls remain disabled: '+error.message);
});
