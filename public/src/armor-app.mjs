import {ARMOR_FICTIONAL_EXAMPLE} from '../data/armor-example.mjs';
import {parseArmorCsv,armorCsv,optimizeArmor,armorItemKey} from './armor-optimizer.mjs';
const $=id=>document.getElementById(id);
const key=['maxLoad','reservedWeight','targetTier','minPoise','poiseWeight'];
let currentItems=structuredClone(ARMOR_FICTIONAL_EXAMPLE);
const excluded=new Set(); // Session-only, never silently added to exported CSV.
const status=(message,error=false)=>{$('armor-feedback').textContent=message;$('armor-feedback').className=error?'feedback bad':'feedback';};
function download(text,name,type){
 const url=URL.createObjectURL(new Blob([text],{type}));
 const link=document.createElement('a');link.href=url;link.download=name;
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function renderExclusions(){
 const known=new Map(currentItems.map(item=>[armorItemKey(item),item]));
 for(const key of excluded)if(!known.has(key))excluded.delete(key);
 const list=$('armor-excluded-list');
 list.replaceChildren();
 $('armor-excluded-count').textContent=String(excluded.size);
 $('armor-clear-exclusions').hidden=excluded.size===0;
 for(const item of currentItems.filter(item=>excluded.has(armorItemKey(item)))){
   const li=document.createElement('li');
   const span=document.createElement('span');
   span.textContent=item.name+' ('+item.slot+')';
   const undo=document.createElement('button');
   undo.type='button';undo.className='armor-undo-piece';
   undo.textContent='Undo';
   undo.setAttribute('aria-label','Include '+item.name+' in '+item.slot+' again');
   undo.addEventListener('click',()=>{excluded.delete(armorItemKey(item));render();});
   li.append(span,undo);list.append(li);
 }
}
function render(){
 $('armor-results').replaceChildren();$('armor-summary').textContent='—';
 $('armor-details').textContent='—';$('armor-equip-link').hidden=true;
 try{
   currentItems=parseArmorCsv($('armor-csv').value);
   renderExclusions();
   const constraints={
     maxLoad:$('maxLoad').value,reservedWeight:$('reservedWeight').value,
     targetTier:$('targetTier').value,minPoise:$('minPoise').value,
     poiseWeight:$('poiseWeight').value
   };
   const result=optimizeArmor(currentItems,constraints,excluded);
   $('armor-details').textContent=result.evaluated.toLocaleString()+' combinations checked · '+
     result.valid.toLocaleString()+' under chosen limits · '+
     result.excludedCount+' excluded items';
   if(!result.top.length){$('armor-summary').textContent='No feasible combination';status('Reduce your poise requirement, change the target load tier, or adjust equipment limits.',true);return;}
   const winner=result.top[0];
   $('armor-summary').textContent=winner.objective.toFixed(2)+' custom points';
   const tbody=$('armor-results');
   for(const [index,combo] of result.top.entries()){
     const tr=document.createElement('tr');
     const rank=document.createElement('td');rank.textContent=String(index+1);tr.append(rank);
     const choices=document.createElement('td');
     const selected=combo.items.filter(item=>!item.empty);
     if(!selected.length)choices.textContent='No armor';
     for(const item of selected){
       const line=document.createElement('div');line.className='armor-result-piece';
       const name=document.createElement('span');name.textContent=item.name+' ('+item.slot+')';
       const button=document.createElement('button');
       button.type='button';button.className='armor-exclude-piece';
       button.textContent='Exclude';
       button.setAttribute('aria-label','Exclude '+item.name+' from '+item.slot+' and recalculate');
       button.addEventListener('click',()=>{excluded.add(armorItemKey(item));render();});
       line.append(name,button);choices.append(line);
     }
     tr.append(choices);
     for(const value of [combo.totalWeight.toFixed(3),
       combo.poise,combo.score.toFixed(2),combo.objective.toFixed(2)]){
       const td=document.createElement('td');td.textContent=String(value);tr.append(td);
     }
     tbody.append(tr);
   }
   const link=$('armor-equip-link');const url=new URL('../equip-load-calculator/',location.href);
   url.searchParams.set('weight',String(winner.totalWeight));
   url.searchParams.set('max',String(result.constraints.maxLoad));
   link.href=url;link.hidden=false;
   status('Exact search complete for your manually entered options. Protection score is USER-DEFINED, not actual damage negation.');
 }catch(e){status(e.message,true);}
}
$('optimize-armor').addEventListener('click',render);
$('armor-clear-exclusions').addEventListener('click',()=>{excluded.clear();render();});
$('restore-armor').addEventListener('click',()=>{
 currentItems=structuredClone(ARMOR_FICTIONAL_EXAMPLE);
 excluded.clear();
 $('armor-csv').value=armorCsv(currentItems);render();
});
$('export-armor').addEventListener('click',()=>{
 try{download(armorCsv(parseArmorCsv($('armor-csv').value)),'armor-options.csv','text/csv;charset=utf-8');status('CSV downloaded locally.');}
 catch(e){status(e.message,true);}
});
$('armor-file').addEventListener('change',async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{if(file.size>14000)throw Error('File must be 14 KB or less.');
  const data=await file.text();const list=parseArmorCsv(data);
  $('armor-csv').value=armorCsv(list);render();
 }catch(err){status(err.message,true)}finally{e.target.value=''}
});
for(const id of key)$(id).addEventListener('change',render);
$('armor-csv').value=armorCsv(currentItems);
render();
