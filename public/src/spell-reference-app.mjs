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
