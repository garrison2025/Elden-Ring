import {loadPinnedArmorSource} from './armor-source-optin.mjs';
const $=id=>document.getElementById(id);
const status=(message,error=false)=>{
 $('armor-full-status').textContent=message;
 $('armor-full-status').dataset.state=error?'error':'ready';
};
let armors=null,worker=null,revision=0;
try{worker=new Worker(new URL('./armor-full-source-worker.mjs',import.meta.url),{type:'module'});}
catch(error){status('Browser cannot start local optimization Worker: '+error.message,true);
 $('armor-full-load').disabled=true;}
const invalidate=()=>{
 revision++;
 $('armor-full-results').hidden=true;
 $('armor-full-rows').replaceChildren();
 if(armors)status('Constraints changed; run source optimizer again.');
};
const parseExclude=()=>{
 const names=$('armor-full-exclude').value.split(',').map(x=>x.trim()).filter(Boolean);
 if(names.length>50||new Set(names.map(x=>x.toLowerCase())).size!==names.length)
  throw new RangeError('Enter at most 50 different exact armor names, separated by commas.');
 const excluded=[];
 for(const name of names){
  const matches=armors.filter(x=>x.name.toLowerCase()===name.toLowerCase());
  if(matches.length!==1)throw new RangeError(
   'Missing or ambiguous community armor name: '+name+'. Use a unique exact item name.');
  excluded.push(matches[0].id);
 }
 return excluded;
};
$('armor-full-load').addEventListener('click',async()=>{
 if(!worker)return;
 const button=$('armor-full-load');button.disabled=true;
 status('Downloading the pinned public armor JSON on your explicit request…');
 try{
  const source=await loadPinnedArmorSource(fetch);
  armors=source.armors;
  const missing=armors.filter(x=>x.poise===null).length;
  status('Pinned '+source.count+' armor names/weights loaded. '+
   missing+' items lack valid source Poise and will be excluded from this objective. '+
   'Values and item availability are not current-game certified.');
  $('armor-full-run').disabled=false;button.hidden=true;
 }catch(error){button.disabled=false;status('Source unavailable: '+error.message+'. Manual optimizer remains usable.',true);}
});
$('armor-full-run').addEventListener('click',()=>{
 if(!armors||!worker)return;
 invalidate();
 try{
  const value=$('minPoise').value.trim();
  if(!/^(?:0|[1-9]\d{0,2})$/.test(value))throw new RangeError('Enter a whole minimum Poise 0–500.');
  const options={
   maxEquipLoad:$('maxLoad').value,
   reservedWeight:$('reservedWeight').value,
   tier:$('targetTier').value,
   minPoise:Number(value),
   metric:$('armor-full-metric').value,
   excludedIds:parseExclude()
  };
  const requestId=++revision;
  $('armor-full-run').disabled=true;
  status('Searching all legal armor combinations in a browser Worker…');
  worker.postMessage({op:'optimize',requestId,armors,options});
 }catch(error){status('Cannot start source optimizer: '+error.message,true);}
});
worker?.addEventListener('message',event=>{
 const m=event.data||{};if(m.requestId!==revision)return;
 $('armor-full-run').disabled=false;
 if(m.op==='error'){status('Exact source optimization blocked: '+m.message,true);return;}
 if(m.op!=='result')return;
 const r=m.result;
 $('armor-full-rows').replaceChildren();
 $('armor-full-results').hidden=false;
 if(r.status==='no-solution'){
  $('armor-full-heading').textContent='No feasible armor combination from reported source data';
  $('armor-full-details').textContent=r.reason+' '+
   r.missingPoiseExcluded+' items excluded for absent Poise; '+
   r.explicitExcluded+' excluded by name.';
  status('No source-supported combination met the selected constraints. No result was invented.',true);
  return;
 }
 $('armor-full-heading').textContent='Best '+r.metricLabel+': '+
  r.metricValue+(r.metricUnit==='%'?'%':' points');
 $('armor-full-details').textContent=
  'Armor weight '+r.armorWeight.toFixed(3)+' + reserved gear = '+
  r.totalWeight.toFixed(3)+' / max '+r.maxEquipLoad.toFixed(3)+
  '; roll tier '+r.rollTier+'. '+r.missingMetricExcluded+
  ' records excluded due to unavailable '+r.metricLabel+'; '+r.explicitExcluded+
  ' explicitly excluded. '+(r.metricUnit==='%'?'Rounded per-piece source negation is combined multiplicatively; ':'')+
  'Exact optimum within the supplied values, not a numerically verified Tarnished.dev v1.17 browser result.';
 for(const piece of r.combination){
  const row=document.createElement('tr');
  for(const value of [piece.slot,piece.name,String(piece.weight),
   piece.poise===null?'Unknown':String(piece.poise),
   String(piece.metricValue)+(r.metricUnit==='%'?'%':'')]){
   const td=document.createElement('td');td.textContent=value;row.append(td);
  }
  $('armor-full-rows').append(row);
 }
 status('Source metric '+r.metricLabel+' optimization completed in Worker. '+
  r.stages.map(x=>x.slot+': '+x.stateCount+' states').join(' · ')+
  '. Reported Poise is community data, not v1.17.3 game-proven.');
});
for(const id of ['maxLoad','reservedWeight','targetTier','minPoise','armor-full-exclude','armor-full-metric']){
 $(id).addEventListener(['targetTier','armor-full-metric'].includes(id)?'change':'input',invalidate);
}
