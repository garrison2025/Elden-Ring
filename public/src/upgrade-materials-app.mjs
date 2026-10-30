import {materialCatalog,planUpgradeMaterials,materialsCsv} from './upgrade-materials.mjs';
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
rebuildFields();
