import {ARMOR_FICTIONAL_EXAMPLE} from '../data/armor-example.mjs';
import {parseArmorCsv,armorCsv,optimizeArmor} from './armor-optimizer.mjs';
const $=id=>document.getElementById(id);
const key=['maxLoad','reservedWeight','targetTier','minPoise','poiseWeight'];
let currentItems=structuredClone(ARMOR_FICTIONAL_EXAMPLE);
const status=(message,error=false)=>{$('armor-feedback').textContent=message;$('armor-feedback').className=error?'feedback bad':'feedback';};
function download(text,name,type){
 const url=URL.createObjectURL(new Blob([text],{type}));
 const link=document.createElement('a');link.href=url;link.download=name;
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function render(){
 $('armor-results').replaceChildren();$('armor-summary').textContent='—';
 $('armor-details').textContent='—';$('armor-equip-link').hidden=true;
 try{
   currentItems=parseArmorCsv($('armor-csv').value);
   const constraints={
     maxLoad:$('maxLoad').value,reservedWeight:$('reservedWeight').value,
     targetTier:$('targetTier').value,minPoise:$('minPoise').value,
     poiseWeight:$('poiseWeight').value
   };
   const result=optimizeArmor(currentItems,constraints);
   $('armor-details').textContent=result.evaluated.toLocaleString()+' combinations checked · '+
     result.valid.toLocaleString()+' under chosen limits';
   if(!result.top.length){$('armor-summary').textContent='No feasible combination';status('Reduce your poise requirement, change the target load tier, or adjust equipment limits.',true);return;}
   const winner=result.top[0];
   $('armor-summary').textContent=winner.objective.toFixed(2)+' custom points';
   const tbody=$('armor-results');
   for(const [index,combo] of result.top.entries()){
     const tr=document.createElement('tr');
     const choices=combo.items.filter(i=>!i.empty).map(i=>i.name).join(' · ')||'No armor';
     for(const value of [index+1,choices,combo.totalWeight.toFixed(3),
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
$('restore-armor').addEventListener('click',()=>{
 currentItems=structuredClone(ARMOR_FICTIONAL_EXAMPLE);
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
