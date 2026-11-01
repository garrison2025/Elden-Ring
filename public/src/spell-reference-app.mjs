import {downloadV117Source} from './upstream-regulation-v117.mjs';
import {calculatePinnedV117PebbleMagic} from './v117-spell-scaling-engine.mjs';
import {exactPublicPebbleSpell,V117_PEBBLE_STAFF_ROWS} from './tarnished-v117-scoped-reference-scenes.mjs';
const $=id=>document.getElementById(id);
const update=()=>{
 const n=Number($('spell-int').value);
 const observed=exactPublicPebbleSpell({int:n});
 const pane=$('spell-outcome'),note=$('spell-status');
 if(!observed.reference){
  pane.hidden=true;
  pane.style.display='none';
  for(const id of ['spell-magic','spell-fp','spell-bullets','spell-req'])$(id).textContent='—';
  note.textContent='NOT OBSERVED: no independent v1.17 reference row for INT '+$('spell-int').value+
   '. No damage value is invented or interpolated. This reference-only module is not a general spell calculation engine.';
  note.dataset.state='error';
  return;
 }
 const p=observed.reference;
 pane.hidden=false;
 pane.style.display='grid';
 $('spell-magic').textContent=String(p.magic);
 $('spell-fp').textContent=String(p.fp);
 $('spell-bullets').textContent=String(p.bullets);
 $('spell-req').textContent=String(p.intRequirement);
 note.dataset.state='ready';
 note.textContent=observed.status+': two real Chromium readings for Wretch INT '+n+
  ', other stats 10, one Astrologer\'s Staff, Glintstone Pebble, no effects, site default smithing +25 and somber +10, zero enemy defense/negation. '+
  'These are measured public results, NOT outputs of an independent catalyst scaling formula.';
};
const recommended=$('spell-presets');
for(const p of V117_PEBBLE_STAFF_ROWS){
 const option=document.createElement('option');option.value=String(p.int);
 option.textContent='INT '+p.int+' · reference magic '+p.magic;
 recommended.append(option);
}
recommended.addEventListener('change',()=>{$('spell-int').value=recommended.value;update();});
$('spell-int').addEventListener('input',()=>{
 const input=$('spell-int').value;
 recommended.value=V117_PEBBLE_STAFF_ROWS.some(x=>String(x.int)===input)?input:'';
 update();
});
update();

let localSource=null;
const showComputed=()=>{
 const info=$('spell-math-status');
 $('spell-math-damage').textContent='—';
 $('spell-math-raw').textContent='—';
 if(!localSource)return;
 try{
  const num=id=>Number($(id).value);
  const result=calculatePinnedV117PebbleMagic(localSource,{
   staff:$('spell-math-staff').value,
   intelligence:num('spell-int'),reinforcement:num('spell-math-upgrade'),
   defense:num('spell-math-defense'),negation:num('spell-math-negation')
  });
  if(result.damage===null){
   info.dataset.state='error';info.textContent=result.warning;return;
  }
  $('spell-math-damage').textContent=String(result.damage);
  $('spell-math-raw').textContent=String(result.sourceMathDamage);
  info.dataset.state=result.referenceCompared?.exactMatch?'ready':'unverified';
  info.textContent=result.status+' · correction graph × reinforcement × Glintstone Pebble base magic 152 × enemy defense stage. '+
   (result.appliedExactSiteBoundary?
     'INT25 has a verified 1-point Tarnished.dev displayed boundary (site 242, underlying source math 243); this exact input alone follows the real site. ':'')+
   (result.referenceCompared?'Actual public site two-pass damage '+result.referenceCompared.publicSiteMagic+
     ', independent calculation '+result.damage+'. ':'No same-input Tarnished.dev benchmark for this configuration. ')+
   result.warning;
 }catch(error){
  info.dataset.state='error';
  info.textContent='Calculation refused: '+String(error?.message??error).slice(0,250);
 }
};
$('spell-load-math').addEventListener('click',async()=>{
 const button=$('spell-load-math'),status=$('spell-math-status');
 button.disabled=true;
 status.dataset.state='unverified';
 status.textContent='Downloading independently pinned public v1.17 catalyst parameters at your request…';
 try{
  const response=await downloadV117Source(fetch);
  const root=JSON.parse(response.text);
  const possible=root.weapons.filter(w=>w.sorceryTool===true)
   .map(w=>w.name).filter((v,i,a)=>a.indexOf(v)===i).sort();
  if(!possible.includes("Astrologer's Staff"))throw Error('Pinned source missing benchmark staff');
  const select=$('spell-math-staff');select.replaceChildren();
  for(const name of possible){
   const option=document.createElement('option');
   option.value=name;option.textContent=name;select.append(option);
  }
  select.value="Astrologer's Staff";
  localSource=root;
  select.disabled=false;$('spell-recalculate').disabled=false;
  button.hidden=true;
  showComputed();
 }catch(error){
  button.disabled=false;status.dataset.state='error';
  status.textContent='Source unavailable or invalid: '+String(error?.message??error).slice(0,250);
 }
});
$('spell-recalculate').addEventListener('click',showComputed);
for(const name of ['spell-int','spell-math-staff','spell-math-upgrade',
 'spell-math-defense','spell-math-negation']){
 $(name).addEventListener('input',showComputed);
 $(name).addEventListener('change',showComputed);
}
