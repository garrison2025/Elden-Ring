import {validateCommunityCatalog} from './community-weapons.mjs';
import {
 parseConflictCaptureBundle,reviewImportSummary,recheckConflictOriginalImages,
 CONFLICT_BUNDLE_MAX_BYTES
} from './conflict-evidence-import.mjs';

const el=id=>document.getElementById('conflict-recheck-'+id);
const status=message=>{el('feedback').textContent=message;};
let ledger=null,catalog=null,imported=null,busy=false;
const cleanFiles=()=>{
 for(const id of ['title-file','weapon-file'])el(id).value='';
 el('hash-result').textContent=
  'Select both original image files to test whether their bytes match the imported record.';
};
const resetImported=()=>{
 imported=null;
 el('results').hidden=true;
 el('case').replaceChildren();el('case').disabled=true;
 el('hashes').disabled=true;
 el('summary').textContent='—';
 cleanFiles();
};
const chooseCase=()=>{
 cleanFiles();
 el('hashes').disabled=!imported||
  !imported.entries.some(entry=>entry.id===el('case').value&&entry.observation);
};
el('case').addEventListener('change',chooseCase);
for(const id of ['title-file','weapon-file'])el(id).addEventListener('change',()=>{
 el('hash-result').textContent='Image files selected; recheck their hashes before interpreting any result.';
});
el('clear').addEventListener('click',()=>{
 if(busy){status('A local file is being checked. Complete that check first.');return;}
 resetImported();
 el('json').value='';
 status('Imported JSON and original image selections cleared from this browser session. No server copy was made.');
});
el('import').addEventListener('click',async()=>{
 if(busy)return;
 busy=true;el('import').disabled=true;
 try{
  if(!ledger||!catalog)throw new RangeError('Local source data has not loaded.');
  const file=el('json').files?.[0];
  if(!file||file.size<2||file.size>CONFLICT_BUNDLE_MAX_BYTES)
   throw new RangeError('Select a seven-case JSON export of at most 110 KB.');
  if(!/\.json$/i.test(file.name)||file.name.length>180)
   throw new RangeError('Choose an exported .json file.');
  const raw=await file.text();
  const checked=parseConflictCaptureBundle(ledger,catalog,raw);
  const summary=reviewImportSummary(checked);
  // Atomic replacement: current selected imported session stays intact if
  // the new JSON is malformed or source fields have drifted.
  imported=checked;
  const select=el('case');select.replaceChildren();
  for(const entry of checked.entries){
   if(!entry.observation)continue;
   const option=document.createElement('option');
   option.value=entry.id;option.textContent=entry.weaponName+' · UNREVIEWED';
   select.append(option);
  }
  select.disabled=summary.observations===0;
  el('results').hidden=false;
  el('summary').textContent=
   summary.observations+' unreviewed player transcription(s) · '+
   summary.pending+' still pending · '+summary.mismatchedVersion+
   ' version mismatch(es) · '+summary.sourceCommunity+
   ' matches community source · '+summary.sourcePinned+
   ' matches pinned v1.17 · '+summary.sourceNeither+
   ' matches neither. 0 screenshots independently reviewed.';
  chooseCase();
  status('Seven-case JSON structure and source readings revalidated locally. '+
   'Imported evidence remains UNREVIEWED; selecting the original images is a separate byte-identity check.');
 }catch(error){
  status('Import rejected; previous imported session preserved: '+error.message);
 }finally{
  busy=false;el('import').disabled=!(ledger&&catalog);
 }
});
el('hashes').addEventListener('click',async()=>{
 if(busy)return;
 busy=true;el('hashes').disabled=true;
 try{
  if(!imported)throw new RangeError('Import a valid local evidence checklist first.');
  const titleFile=el('title-file').files?.[0];
  const weaponFile=el('weapon-file').files?.[0];
  const result=await recheckConflictOriginalImages(
   imported,el('case').value,titleFile,weaponFile
  );
  el('hash-result').textContent=result.weaponName+
   ' · title screenshot: '+result.titleScreen.status+
   ' · weapon screenshot: '+result.weaponDetails.status+
   '. Both original files '+(result.bothBytesMatch?'match imported bytes.':'DO NOT both match imported bytes.')+
   ' UNREVIEWED: byte identity does not prove the images show the claimed game or version.';
 }catch(error){
  el('hash-result').textContent='File identity check failed: '+error.message+
   '. No gameplay verification has been granted.';
 }finally{
  busy=false;el('hashes').disabled=!imported||el('case').disabled;
 }
});
Promise.all([
 fetch('../data/weapon-conflict-evidence.json',{cache:'default'}).then(async r=>{
  if(!r.ok)throw new Error('Conflict source HTTP '+r.status);
  return r.json();
 }),
 fetch('../data/community-weapon-catalog.json',{cache:'default'}).then(async r=>{
  if(!r.ok)throw new Error('Catalog HTTP '+r.status);
  return validateCommunityCatalog(await r.json());
 })
]).then(([source,validated])=>{
 ledger=source;catalog=validated;el('import').disabled=false;
 status('Ready. Select a previously exported UNREVIEWED JSON checklist; no file uploads.');
}).catch(error=>{
 status('Source data could not load. Import disabled: '+error.message);
});
