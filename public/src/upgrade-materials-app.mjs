import {materialCatalog,planUpgradeMaterials,materialsCsv} from './upgrade-materials.mjs';
import {parseCatalogSmithingHandoff} from './upgrade-catalog-handoff.mjs';
import {planWeaponUpgradeBasket,weaponUpgradeBasketCsv} from './upgrade-multi-weapon.mjs';
import {parseBuildSmithingIds,resolveBuildSmithingWeapons} from './build-smithing-handoff.mjs';
import {validateCommunityCatalog} from './community-weapons.mjs';
const el=id=>document.getElementById(id);
const store={regular:{},somber:{}};
let latest=null;
const feedback=(text,bad=false)=>{el('upgrade-feedback').textContent=text;el('upgrade-feedback').className=bad?'feedback bad':'feedback';};
const escapeText=x=>String(x);
function make(tag,content){const n=document.createElement(tag);if(content!==undefined)n.textContent=String(content);return n;}
function rebuildFields(){
 const track=el('upgrade-track').value,max=track==='regular'?25:10;
 const from=el('upgrade-from'),to=el('upgrade-to');
 from.max=String(max);to.max=String(max);
 if(Number(from.value)>max)from.value='0';
 if(Number(to.value)>max||Number(to.value)===0)to.value=String(max);
 const table=el('inventory-input');table.replaceChildren();
 for(const row of materialCatalog(track)){
  const label=make('label');label.className='inventory-field';
  const title=make('span',row.label),input=make('input');
  input.type='number';input.min='0';input.max='999999';input.step='1';input.inputMode='numeric';
  input.value=String(store[track][row.key]??0);input.dataset.key=row.key;
  input.setAttribute('aria-label','Owned '+row.label);
  label.append(title,input);table.append(label);
 }
 calculate();
}
function readOwned(){
 const track=el('upgrade-track').value,values={};
 for(const input of el('inventory-input').querySelectorAll('input[data-key]')){
  const raw=input.value.trim();
  if(!/^(0|[1-9][0-9]{0,5})$/.test(raw))throw Error('Owned material counts must be non-negative whole numbers.');
  values[input.dataset.key]=Number(raw);
 }
 store[track]=values;return values;
}
function calculate(){
 latest=null;el('material-rows').replaceChildren();el('upgrade-steps').replaceChildren();
 for(const id of ['upgrade-total','upgrade-missing','upgrade-count'])el(id).textContent='—';
 el('export-list').disabled=true;
 try{
  const track=el('upgrade-track').value,result=planUpgradeMaterials(track,
   el('upgrade-from').value,el('upgrade-to').value,readOwned());
  latest=result;
  el('upgrade-total').textContent=result.totalStones.toLocaleString('en-US');
  el('upgrade-missing').textContent=result.totalMissing.toLocaleString('en-US');
  el('upgrade-count').textContent=String(result.totalSteps);
  for(const row of result.materials){
   const tr=make('tr');
   for(const v of [row.label,row.required,row.owned,row.missing]){
    const td=make('td',v);if(v===row.missing&&row.missing>0&&typeof v==='number')td.classList.add('need-more');
    tr.append(td);
   }
   el('material-rows').append(tr);
  }
  if(!result.materials.length){
   const tr=make('tr'),td=make('td','Already at the target level: no materials required.');
   td.colSpan=4;tr.append(td);el('material-rows').append(tr);
  }
  for(const step of result.steps){
   const li=make('li','+'+step.from+' → +'+step.to+' · '+step.amount+' × '+step.label);
   el('upgrade-steps').append(li);
  }
  el('export-list').disabled=false;
  feedback('All quantities calculated locally. Owned stones are optional; no inventory is uploaded.');
 }catch(e){feedback(e.message,true);}
}
el('upgrade-track').addEventListener('change',rebuildFields);
for(const key of ['upgrade-from','upgrade-to'])el(key).addEventListener('input',calculate);
el('inventory-input').addEventListener('input',calculate);
el('reset-owned').addEventListener('click',()=>{
 const track=el('upgrade-track').value;store[track]={};rebuildFields();
});
el('export-list').addEventListener('click',()=>{
 if(!latest)return;
 const text=materialsCsv(latest);
 const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));
 const a=make('a');a.href=url;a.download='elden-ring-upgrade-materials.csv';
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2500);
});
const handoff=parseCatalogSmithingHandoff(location.search);
if(handoff.weaponId){
 el('upgrade-weapon-context').hidden=false;
 el('upgrade-weapon-name').textContent=handoff.weaponName;
 el('upgrade-weapon-back').href='../weapon-database/?weapon='+encodeURIComponent(handoff.weaponId);
 if(handoff.suggestedTrack==='somber'){
  el('upgrade-track').value='somber';
  el('upgrade-weapon-hint').textContent=
   'Somber (+10) is a COMMUNITY-LINK suggestion only, NOT game-verified. Check the smithing menu. Current level remains +0 for manual entry.';
 }else{
  el('upgrade-weapon-hint').textContent=
   'Weapon upgrade track is UNKNOWN in the source catalog. Choose Regular (+25) or Somber (+10) from the game menu. Current level remains +0 for manual entry.';
 }
}
rebuildFields();


/** Multi-weapon planning is opt-in and independent of the single-weapon input. */
let latestBasket=null,addedWeaponCount=0;
const multiRows=el('multi-weapon-rows');
const multiFeedback=(message,bad=false)=>{
 el('multi-upgrade-feedback').textContent=message;
 el('multi-upgrade-feedback').className=bad?'note feedback bad':'note';
};
const multiLimits=track=>track==='somber'?10:25;
const cell=child=>{const td=make('td');td.append(child);return td;};
const input=(type,aria,value)=>{
 const node=make('input');node.type=type;node.setAttribute('aria-label',aria);
 node.value=String(value);return node;
};
const multiInventory=el('multi-owned-inputs');
for(const track of ['regular','somber'])for(const material of materialCatalog(track)){
 const label=make('label');label.className='inventory-field';
 const amount=input('number','Shared owned '+material.label,0);
 amount.min='0';amount.max='999999';amount.step='1';
 amount.inputMode='numeric';amount.dataset.multiOwned=material.key;
 label.append(make('span',material.label),amount);multiInventory.append(label);
}
function readMultiInventory(){
 const amounts={};
 for(const field of multiInventory.querySelectorAll('input[data-multi-owned]')){
  const v=field.value.trim();
  if(!/^(?:0|[1-9][0-9]{0,5})$/.test(v))
   throw new RangeError('Shared owned stones must be whole numbers from 0 to 999999.');
  amounts[field.dataset.multiOwned]=Number(v);
 }
 return amounts;
}
function makeMultiRow({name,track,from,to}){
 const index=++addedWeaponCount,tr=make('tr');
 tr.dataset.multiRow=String(index);
 const weapon=input('text','Weapon '+index+' label',name);
 weapon.maxLength=120;weapon.dataset.multiField='name';
 const kind=make('select');
 kind.dataset.multiField='track';kind.setAttribute('aria-label','Weapon '+index+' smithing track');
 if(track===''){
  const unknown=make('option','Choose track — required');
  unknown.value='';kind.append(unknown);
 }
 for(const [value,label] of [['regular','Regular +25'],['somber','Somber +10']]){
  const option=make('option',label);option.value=value;kind.append(option);
 }
 kind.value=track;
 const start=input('number','Weapon '+index+' current reinforcement level',from);
 const target=input('number','Weapon '+index+' target reinforcement level',to);
 for(const [field,label] of [[start,'from'],[target,'to']]){
  field.min='0';field.max=String(multiLimits(track));field.step='1';
  field.inputMode='numeric';field.dataset.multiField=label;
 }
 const remove=make('button','Remove');remove.type='button';remove.className='btn alt';
 remove.setAttribute('aria-label','Remove weapon '+index+' from shared upgrade list');
 remove.addEventListener('click',()=>{tr.remove();calculateMulti();});
 kind.addEventListener('change',()=>{
  start.max=String(multiLimits(kind.value));target.max=start.max;
  calculateMulti();
 });
 for(const node of [weapon,kind,start,target,remove])tr.append(cell(node));
 return tr;
}
function addMultiPlan(weapon){
 if(multiRows.children.length>=8){
  multiFeedback('A maximum of eight weapon plans can be combined.',true);
  return;
 }
 multiRows.append(makeMultiRow(weapon));
 calculateMulti();
}
function readMultiRows(){
 return [...multiRows.querySelectorAll('tr[data-multi-row]')].map(row=>{
  const getField=name=>row.querySelector('[data-multi-field="'+name+'"]');
  return {name:getField('name').value,track:getField('track').value,
   from:getField('from').value,to:getField('to').value};
 });
}
function calculateMulti(){
 latestBasket=null;el('multi-upgrade-results').hidden=true;
 el('multi-export').disabled=true;
 if(!multiRows.children.length){
  multiFeedback('Add your current single-weapon plan or a manually specified weapon.');
  return;
 }
 try{
  const result=planWeaponUpgradeBasket(readMultiRows(),readMultiInventory());
  latestBasket=result;
  el('multi-count').textContent=String(result.weaponCount);
  el('multi-total').textContent=result.totalStones.toLocaleString('en-US');
  el('multi-missing').textContent=result.totalMissing.toLocaleString('en-US');
  el('multi-upgrade-summary').textContent=
   result.regularStones+' regular stones + '+result.somberStones+
   ' Somber stones · '+result.totalSteps+' separate reinforcement steps.'+
   ' Shared inventory subtracted once; no weapon-specific rune costs included.';
  const tbody=el('multi-material-rows');tbody.replaceChildren();
  for(const material of result.materials){
   const tr=make('tr');
   for(const value of [material.track,material.label,material.required,
    material.owned,material.missing,material.leftover]){
    tr.append(cell(make('span',value)));
   }
   tbody.append(tr);
  }
  if(!result.materials.length){
   const tr=make('tr'),td=make('td','No new materials needed.');
   td.colSpan=6;tr.append(td);tbody.append(tr);
  }
  el('multi-upgrade-results').hidden=false;
  el('multi-export').disabled=false;
  multiFeedback('Combined '+result.weaponCount+
   ' player-specified weapon plan(s). Verify each track and current level in-game.');
 }catch(error){
  multiFeedback('Check the multi-weapon inputs: '+error.message,true);
 }
}
el('multi-add-current').addEventListener('click',()=>{
 const name=handoff.weaponName||'Weapon '+(addedWeaponCount+1);
 addMultiPlan({name,track:el('upgrade-track').value,
  from:el('upgrade-from').value,to:el('upgrade-to').value});
});
el('multi-add-blank').addEventListener('click',()=>addMultiPlan({
 name:'Weapon '+(addedWeaponCount+1),track:'regular',from:0,to:25
}));
el('multi-clear').addEventListener('click',()=>{
 multiRows.replaceChildren();calculateMulti();
});
el('multi-reset-owned').addEventListener('click',()=>{
 for(const n of multiInventory.querySelectorAll('input[data-multi-owned]'))n.value='0';
 calculateMulti();
});
multiRows.addEventListener('input',calculateMulti);
multiInventory.addEventListener('input',calculateMulti);
el('multi-export').addEventListener('click',()=>{
 if(!latestBasket)return;
 const csv=weaponUpgradeBasketCsv(latestBasket);
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
 const a=make('a');a.href=url;a.download='elden-ring-multi-weapon-smithing-list.csv';
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2500);
});

/**
 * Optional linked build shortlist: only bounded IDs travel in URL.
 * Re-resolve display names against our local validated reference dataset.
 * Explicit player selection of each track AND both upgrade levels required.
 */
try{
 const linkedIds=parseBuildSmithingIds(location.search);
 if(linkedIds.length){
  multiFeedback('Loading linked Build Planner weapon references locally…');
  fetch('../data/community-weapon-catalog.json',{cache:'default'}).then(async response=>{
   if(!response.ok)throw new Error('Local weapon catalog HTTP '+response.status);
   const local=validateCommunityCatalog(await response.json());
   const found=resolveBuildSmithingWeapons(linkedIds,local.weapons);
   if(multiRows.children.length)
    throw new RangeError('The multi-weapon list was edited before import; no rows were replaced.');
   for(const entry of found){
    const row=makeMultiRow(entry);
    const track=row.querySelector('[data-multi-field="track"]');
    track.title=entry.trackHint;
    const hint=make('small',entry.suggestedTrack==='somber'?
     'Community Somber hint only — confirm in game': 'Track unknown — choose from game menu');
    hint.className='multi-weapon-hint';
    row.children[0].append(hint);
    multiRows.append(row);
   }
   calculateMulti();
   multiFeedback('Imported '+found.length+
    ' source-matched catalog identities from Build Planner. Smithing track and actual current/target +levels are intentionally BLANK and MUST be entered manually.'+
    (found.some(x=>x.suggestedTrack==='somber')?
     ' Some linked weapons display an unverified community Somber hint, not game certification.':''));
  }).catch(error=>{
   multiFeedback('Unable to import Build shortlist: '+error.message+
    ' No unsupported weapon information was inserted.',true);
  });
 }
}catch(error){
 multiFeedback('Invalid Build Planner shortlist link: '+error.message,true);
}
