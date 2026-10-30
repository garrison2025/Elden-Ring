import {validateArProfile,calculateAr,POWER_STATS} from './weapon-ar.mjs';
import {AR_SYNTHETIC_FIXTURE} from '../data/ar-synthetic-fixture.mjs';
const $=s=>document.querySelector(s);
let profile=structuredClone(AR_SYNTHETIC_FIXTURE);
const fmt=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:3});
const labels={str:'Strength',dex:'Dexterity',int:'Intelligence',fai:'Faith',arc:'Arcane'};
const show=(msg,bad=false)=>{const el=$('#ar-feedback');el.textContent=msg;el.className=bad?'feedback bad':'feedback'};
const statInputs=$('#ar-stats');
for(const s of POWER_STATS){
 const label=document.createElement('label');label.className='stat-field';
 const t=document.createElement('span');t.textContent=labels[s];
 const inp=document.createElement('input');inp.type='number';inp.min='1';inp.max='99';inp.step='1';inp.value=s==='str'?'40':s==='dex'?'20':'10';inp.dataset.arStat=s;inp.setAttribute('inputmode','numeric');
 const small=document.createElement('small');small.textContent=s.toUpperCase();
 label.append(t,inp,small);statInputs.append(label);
}
function options(){
 const sel=$('#ar-affinity');sel.replaceChildren();
 for(const name of Object.keys(profile.affinities)){const opt=new Option(name,name);sel.add(opt)}
 const levels=profile.affinities[sel.value]?.upgrades??[];
 const lv=$('#ar-upgrade');lv.replaceChildren();for(const u of levels)lv.add(new Option('+'+u.level,String(u.level)));
}
function replaceProfile(input){
 profile=validateArProfile(input);options();$('#profile-label').textContent=profile.label;
 $('#profile-note').textContent=profile.provenance.note;
 $('#ar-provenance').textContent=profile.provenance.status==='synthetic-test'?'SYNTHETIC DATA — NOT GAME AR':'MANUAL INPUT — UNVERIFIED';
 $('#ar-editor').value=JSON.stringify(profile,null,2);
 render();
}
function render(){
 try{
  const stats=Object.fromEntries([...document.querySelectorAll('[data-ar-stat]')].map(el=>[el.dataset.arStat,Number(el.value)]));
  const out=calculateAr(profile,stats,{affinity:$('#ar-affinity').value,upgrade:Number($('#ar-upgrade').value),twoHanded:$('#ar-twohand').checked});
  $('#ar-total').textContent=fmt(out.total);
  $('#ar-strength').textContent=out.effectiveStats.str+' effective STR';
  $('#ar-missing').textContent=out.missingRequirements.length?'Missing: '+out.missingRequirements.map(x=>x.toUpperCase()).join(', '):'Requirements met';
  const tbody=$('#ar-breakdown');tbody.replaceChildren();
  for(const item of out.perElement){
   const tr=document.createElement('tr');
   for(const value of [item.element.charAt(0).toUpperCase()+item.element.slice(1),fmt(item.base),fmt(item.scaling),fmt(item.displayed)]){
     const td=document.createElement('td');td.textContent=value;tr.append(td);
   }
   tbody.append(tr);
  }
  show('Local formula execution succeeded. These are NOT verified in-game weapon values.');
 }catch(err){$('#ar-total').textContent='—';$('#ar-breakdown').replaceChildren();show(err.message,true)}
}
function applyEditor(){
 try{const raw=$('#ar-editor').value;if(raw.length>950000)throw new Error('JSON too large for the preview.');replaceProfile(JSON.parse(raw));show('JSON schema accepted. Game-data accuracy and permission remain UNVERIFIED.');}
 catch(e){show(`Import not applied: ${e.message}`,true)}
}
$('#ar-apply').addEventListener('click',applyEditor);
$('#ar-reset').addEventListener('click',()=>{replaceProfile(structuredClone(AR_SYNTHETIC_FIXTURE));show('Restored the fictional regression-test parameters.');});
$('#ar-affinity').addEventListener('change',()=>{const lv=$('#ar-upgrade');lv.replaceChildren();for(const u of profile.affinities[$('#ar-affinity').value].upgrades)lv.add(new Option('+'+u.level,String(u.level)));render()});
$('#ar-upgrade').addEventListener('change',render);
$('#ar-twohand').addEventListener('change',render);
statInputs.addEventListener('input',render);
$('#ar-file').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 if(file.size>950000){show('Please choose a JSON file below 950 KB.',true);return}
 try{$('#ar-editor').value=await file.text();applyEditor()}catch(err){show(err.message,true)}finally{e.target.value=''}
});
replaceProfile(profile);
