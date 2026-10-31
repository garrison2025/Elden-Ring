import {POWER_STATS} from './weapon-ar.mjs';
import {parseArWorkbenchHandoff} from './ar-workbench-navigation.mjs';
import {downloadV117Source,V117_PROVENANCE,V117_SOURCE_PAGE} from './upstream-regulation-v117.mjs';

const $=id=>document.getElementById(id);
const handoff=parseArWorkbenchHandoff(location.search);
const params=new URLSearchParams(location.search);
const sourceButton=$('qar-load-source');
const controls=['qar-search','qar-weapon','qar-affinity','qar-upgrade','qar-twohand',
 'qar-str','qar-dex','qar-int','qar-fai','qar-arc','qar-calculate','qar-share'];
const fields=Object.fromEntries(POWER_STATS.map(s=>[s,$('qar-'+s)]));
const sourceStatus=(message,state='ready')=>{
 $('qar-source-status').textContent=message;
 $('qar-source-status').dataset.state=state;
};
const feedback=(message,state='ready')=>{
 $('qar-feedback').textContent=message;
 $('qar-feedback').dataset.state=state;
};
const setText=(id,value)=>{$(id).textContent=String(value);};
let worker=null,sourceKind='',dataLoaded=false,selectedDescription=null,selectedVariant='';
let searchRevision=0,familyRevision=0,selectRevision=0,compareRevision=0;
let searchPreference='',userExplicitSelection=false;
let controller=null,downloadRevision=0;
const request=message=>{
 if(!worker)throw new Error('A browser Worker is required to calculate locally.');
 worker.postMessage(message);
};
const disableInputs=disabled=>{
 for(const id of controls)$(id).disabled=disabled;
};
const resetResult=()=>{
 compareRevision++;
 setText('qar-total','—');
 setText('qar-onehand','—');
 setText('qar-twohand-total','—');
 setText('qar-result-name',selectedVariant||'Select an armament');
 $('qar-damage').replaceChildren();
 const p=document.createElement('p');
 p.textContent='Choose a weapon, source-supported upgrade and attributes to calculate.';
 $('qar-damage').append(p);
 setText('qar-caveat','No calculated result yet. Reference numbers are not game-client certified.');
};
const clearSelection=()=>{
 selectedVariant='';selectedDescription=null;selectRevision++;familyRevision++;
 $('qar-affinity').replaceChildren();$('qar-affinity').disabled=true;
 $('qar-upgrade').replaceChildren();$('qar-upgrade').disabled=true;
 $('qar-calculate').disabled=true;$('qar-share').disabled=true;
 setText('qar-requirements','Choose a weapon to see minimum requirements.');
 resetResult();
};
const safeStats=()=>{
 const value={};
 for(const s of POWER_STATS){
  const n=fields[s].value.trim();
  if(!/^(?:[1-9]|[1-9][0-9])$/.test(n))
   throw new RangeError(s.toUpperCase()+' must be an integer from 1 to 99.');
  value[s]=Number(n);
 }
 return value;
};
const fillSelect=(select,names)=>{
 select.replaceChildren();
 for(const name of names)select.add(new Option(name,name));
 select.disabled=names.length===0;
};
const setStats=values=>{
 for(let i=0;i<POWER_STATS.length;i++)fields[POWER_STATS[i]].value=String(values[i]);
};
if(handoff.stats)setStats(handoff.stats);
$('qar-twohand').checked=params.get('grip')==='2h';
setText('qar-grip-label',$('qar-twohand').checked?'Two-handed':'One-handed');
disableInputs(true);
sourceButton.disabled=false;
$('qar-demo').disabled=false;
$('qar-load-file').disabled=false;
$('qar-file').disabled=false;

try{
 worker=new Worker(new URL('./ar-workbench-worker.mjs',import.meta.url),{type:'module'});
}catch(error){sourceStatus('This browser cannot start the local calculator: '+error.message,'error');sourceButton.disabled=true;}

const querySearch=term=>{
 if(!dataLoaded)return;
 searchRevision++;clearSelection();
 $('qar-weapon').replaceChildren();$('qar-weapon').disabled=true;
 request({op:'search',term,requestId:searchRevision});
};
const chooseFamily=name=>{
 if(!dataLoaded||!name)return;
 clearSelection();
 familyRevision++;
 request({op:'family',name,requestId:familyRevision});
};
const chooseVariant=name=>{
 if(!dataLoaded||!name)return;
 selectedVariant=name;selectedDescription=null;selectRevision++;
 $('qar-upgrade').replaceChildren();$('qar-upgrade').disabled=true;
 $('qar-calculate').disabled=true;$('qar-share').disabled=true;
 resetResult();
 request({op:'select',name,requestId:selectRevision});
};
const renderCompare=result=>{
 const twoHanded=$('qar-twohand').checked;
 const chosen=twoHanded?result.twoHand:result.oneHand;
 if(!chosen||!Number.isInteger(chosen.total))throw new RangeError('Source did not produce an integer AR.');
 setText('qar-total',chosen.total.toLocaleString('en-US'));
 setText('qar-onehand',result.oneHand.total.toLocaleString('en-US'));
 setText('qar-twohand-total',result.twoHand.total.toLocaleString('en-US'));
 setText('qar-grip-label',twoHanded?'Two-handed':'One-handed');
 setText('qar-result-name',selectedVariant+' · +'+$('qar-upgrade').value);
 const damage=$('qar-damage');damage.replaceChildren();
 const elements=chosen.perElement||[];
 for(const part of elements){
  if(!Number.isFinite(part.displayed)||part.displayed<=0)continue;
  const line=document.createElement('div'),name=document.createElement('span');
  const value=document.createElement('strong');
  line.className='qar-damage-row';
  name.textContent=part.element.charAt(0).toUpperCase()+part.element.slice(1);
  value.textContent=String(part.displayed);
  line.append(name,value);damage.append(line);
 }
 if(!damage.childElementCount){
  const p=document.createElement('p');p.textContent='No positive damage components in source.';damage.append(p);
 }
 const unmet=chosen.missingRequirements||[];
 const caveats=[];
 if(sourceKind==='demo')caveats.push('FICTIONAL DEMONSTRATION — invented numbers, not Elden Ring weapon AR.');
 else if(sourceKind==='local')caveats.push('Imported local parameters — source and version are not verified.');
 else caveats.push('Pinned community v1.17 reference, not independently game-certified Regulation 1.17.3 AR.');
 if(unmet.length)caveats.push('Minimum attributes not met: '+unmet.join(', ')+'.');
 if(selectedDescription?.scopeFlags?.length)
  caveats.push('Unmodeled mechanics: '+selectedDescription.scopeFlags.join(', ')+'.');
 caveats.push('Nominal AR excludes enemy defenses, buffs, status buildup and motion values.');
 setText('qar-caveat',caveats.join(' '));
 feedback((sourceKind==='demo'?'Fictional example calculated. ':'Reference calculation complete. ')+
  'One-hand '+result.oneHand.total+' · two-hand '+result.twoHand.total+
  (unmet.length?' · unmet requirements: '+unmet.join(', '):''));
};
const calculate=()=>{
 if(!dataLoaded||!selectedDescription)return;
 try{
  const stats=safeStats();
  const upgrade=Number($('qar-upgrade').value);
  if(!selectedDescription.upgradeLevels.includes(upgrade))
   throw new RangeError('This weapon does not supply the chosen upgrade level.');
  compareRevision++;
  feedback('Calculating in this browser…','loading');
  request({op:'compare',requestId:compareRevision,stats,upgrade});
 }catch(error){resetResult();feedback(String(error.message),'error');}
};
worker?.addEventListener('message',event=>{
 const m=event.data||{};
 if(m.op==='error'){
  if(m.phase==='load'||m.phase==='demo'){
   dataLoaded=false;
   $('qar-workspace').hidden=true;
   sourceButton.disabled=false;$('qar-demo').disabled=false;$('qar-load-file').disabled=false;
   sourceStatus(m.message,'error');
   return;
  }
  if(['select','compare','family','search'].includes(m.phase))
   feedback('Could not compute with these source parameters: '+m.message,'error');
  resetResult();return;
 }
 if(m.op==='cleared'){
  dataLoaded=false;selectedVariant='';selectedDescription=null;sourceKind='';
  $('qar-workspace').hidden=true;
  sourceStatus('Cleared. Select a source to begin again.');
  return;
 }
 if(m.op==='loaded'){
  dataLoaded=true;
  sourceButton.disabled=false;$('qar-demo').disabled=false;$('qar-load-file').disabled=false;
  $('qar-workspace').hidden=false;
  $('qar-search').disabled=false;
  for(const s of POWER_STATS)fields[s].disabled=false;
  $('qar-twohand').disabled=false;
  sourceStatus((sourceKind==='demo'?'FICTIONAL DEMO — NOT GAME DATA. ':sourceKind==='pinned'?'Pinned public v1.17 data ready. ':'Local JSON ready (unverified). ')+
   m.count.toLocaleString('en-US')+' exact source weapon/affinity entries are available.');
  let chosen=handoff.weapon||'Uchigatana';
  if(sourceKind==='demo'&&!handoff.weapon)chosen='Fictional';
  if(sourceKind==='local'&&!handoff.weapon)chosen='';
  $('qar-search').value=chosen;
  searchPreference=handoff.weapon||'';
  querySearch(chosen);
  return;
 }
 if(m.op==='search-results'){
  if(m.requestId!==searchRevision)return;
  fillSelect($('qar-weapon'),m.result.names);
  setText('qar-matches',m.result.matches+' matches; first '+m.result.names.length+' shown. Search by weapon to narrow the list.');
  if(m.result.names.length){
   const preferred=m.result.names.includes(searchPreference)?searchPreference:
    m.result.names.includes($('qar-search').value)?$('qar-search').value:m.result.names[0];
   $('qar-weapon').value=preferred;
   chooseFamily(preferred);
  }else{
   feedback('No exact weapon variants match this search. Try another weapon name.','error');
  }
  return;
 }
 if(m.op==='family-results'){
  if(m.requestId!==familyRevision)return;
  if(!m.result.found){feedback('No exact source weapon family matched this selection.','error');return;}
  fillSelect($('qar-affinity'),m.result.names);
  const chosen=m.result.names.includes(searchPreference)?searchPreference:
   m.result.names.includes($('qar-weapon').value)?$('qar-weapon').value:
   m.result.defaultName;
  $('qar-affinity').value=chosen;
  chooseVariant(chosen);
  return;
 }
 if(m.op==='selected'){
  if(m.requestId!==selectRevision)return;
  selectedDescription=m.description;
  const levels=m.description.upgradeLevels||[];
  fillSelect($('qar-upgrade'),levels.map(String));
  const preference=handoff.upgrade;
  if(!userExplicitSelection&&preference!==null&&levels.includes(preference))
   $('qar-upgrade').value=String(preference);
  else if(levels.includes(0))$('qar-upgrade').value='0';
  setText('qar-requirements',
   'Minimum requirements: '+POWER_STATS.map(s=>s.toUpperCase()+' '+m.description.requirements[s]).join(' · ')+
   ' · source-supported reinforcement +0 to +'+Math.max(...levels)+
   (m.description.scopeFlags.length?' · '+m.description.scopeFlags.join(', '):''));
  $('qar-calculate').disabled=false;$('qar-share').disabled=false;
  calculate();
  return;
 }
 if(m.op==='compared'){
  if(m.requestId!==compareRevision)return;
  try{renderCompare(m.result);}catch(error){feedback(error.message,'error');resetResult();}
 }
});
sourceButton.addEventListener('click',async()=>{
 if(!worker)return;
 const revision=++downloadRevision;
 controller?.abort();controller=new AbortController();
 sourceKind='pinned';dataLoaded=false;clearSelection();
 $('qar-workspace').hidden=true;
 sourceButton.disabled=true;
 sourceStatus('Downloading and verifying the pinned public v1.17 JSON in this browser…','loading');
 try{
  const {text,summary}=await downloadV117Source(fetch,{signal:controller.signal});
  if(revision!==downloadRevision)return;
  sourceStatus('Checked '+summary.entries+' source records; preparing local calculator…','loading');
  request({op:'load',text,version:'1.17',reference:V117_PROVENANCE});
 }catch(error){
  if(revision!==downloadRevision)return;
  sourceButton.disabled=false;
  sourceStatus('Unable to load the public source: '+error.message+'. Use a local JSON file as fallback.','error');
 }
});
$('qar-load-file').addEventListener('click',async()=>{
 const file=$('qar-file').files?.[0];
 if(!file){sourceStatus('Select a .json file before importing.','error');return;}
 if(file.size>16_000_000){sourceStatus('The local JSON exceeds the 16 MB limit.','error');return;}
 downloadRevision++;controller?.abort();
 sourceKind='local';dataLoaded=false;clearSelection();$('qar-workspace').hidden=true;
 sourceStatus('Reading local JSON into the browser worker…','loading');
 try{request({op:'load',text:await file.text(),version:'local-unverified',
  reference:'User-provided local JSON; rights and game accuracy not validated'});}
 catch(error){sourceStatus(error.message,'error');}
});
$('qar-demo').addEventListener('click',()=>{
 downloadRevision++;controller?.abort();
 sourceKind='demo';dataLoaded=false;clearSelection();$('qar-workspace').hidden=true;
 sourceStatus('Starting fictional demonstration…','loading');
 request({op:'demo'});
});
$('qar-search').addEventListener('input',()=>{
 searchPreference='';userExplicitSelection=true;
 querySearch($('qar-search').value.trim());
});
$('qar-weapon').addEventListener('change',()=>{
 searchPreference='';userExplicitSelection=true;chooseFamily($('qar-weapon').value);
});
$('qar-affinity').addEventListener('change',()=>{
 searchPreference='';userExplicitSelection=true;chooseVariant($('qar-affinity').value);
});
$('qar-upgrade').addEventListener('change',()=>{userExplicitSelection=true;calculate();});
$('qar-twohand').addEventListener('change',()=>{setText('qar-grip-label',$('qar-twohand').checked?'Two-handed':'One-handed');calculate();});
for(const s of POWER_STATS)fields[s].addEventListener('change',calculate);
$('qar-calculate').addEventListener('click',calculate);
$('qar-share').addEventListener('click',async()=>{
 if(!selectedDescription)return;
 try{
  const stats=safeStats();
  const query=new URLSearchParams();
  query.set('weapon',selectedVariant);
  query.set('player',POWER_STATS.map(s=>stats[s]).join(','));
  query.set('upgrade',$('qar-upgrade').value);
  query.set('grip',$('qar-twohand').checked?'2h':'1h');
  const url=location.origin+location.pathname+'?'+query;
  await navigator.clipboard.writeText(url);
  feedback('Build link copied. Opening the link still requires loading the source in the recipient browser.');
 }catch(error){feedback('Could not copy the URL: '+error.message,'error');}
});
window.addEventListener('beforeunload',()=>controller?.abort(),{once:true});
