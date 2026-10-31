import {validateCommunityCatalog} from './community-weapons.mjs';
import {validateRecoveredSourceReferences} from './recovered-weapon-reference.mjs';
const byId=id=>document.getElementById(id);
const make=(tag,value)=>{const x=document.createElement(tag);if(value!==undefined)x.textContent=String(value);return x;};
const status=byId('ref72-status'),tbody=byId('ref72-rows'),search=byId('ref72-search');
let records=[];
function render(){
 const term=search.value.trim().toLocaleLowerCase();
 const filtered=records.filter(x=>!term||(x.name+' '+x.category).toLocaleLowerCase().includes(term));
 const frag=document.createDocumentFragment();
 for(const w of filtered){
  const tr=make('tr');
  const name=make('th',w.name);name.scope='row';tr.append(name);
  tr.append(make('td',w.category),make('td',w.reference.weight),
   make('td',w.reference.attackAtPlusZero.join(' / ')),make('td',w.reference.critical),
   make('td',w.reference.scalingAtPlusZero.join(' / ')));
  const td=make('td'),link=make('a','Source +0');link.href=w.reference.sourceUrl;
  link.rel='noopener noreferrer';link.target='_blank';td.append(link);
  if(w.disputedFields.length){
   const warning=make('div','SOURCE CONFLICT: '+w.disputedFields.join(' + '));warning.className='note';td.append(warning);
  }else td.append(make('div','Reference only — not game verified'));
  tr.append(td);frag.append(tr);
 }
 tbody.replaceChildren(frag);
}
Promise.all([
 fetch('../data/v117-recovered-72-reference.json').then(r=>{if(!r.ok)throw Error('Source evidence HTTP '+r.status);return r.json();}),
 fetch('../data/community-weapon-catalog.json').then(r=>{if(!r.ok)throw Error('Catalog HTTP '+r.status);return r.json();})
]).then(([ledger,catalog])=>{
 validateCommunityCatalog(catalog);
 const counts=validateRecoveredSourceReferences(ledger,catalog);
 records=ledger.records;
 status.textContent=counts.total+'/72 source candidates; '+counts.attackReferences+' +0 attacks, '+counts.weightReferences+
  ' weights, '+counts.criticalReferences+' criticals; '+counts.unknownScalingGrades+' unknown individual scaling grades; '+
  counts.sourceConflicts+' unresolved source-conflict weapons; 0 in-game verified.';
 render();search.disabled=false;
}).catch(error=>{status.textContent='SOURCE REFERENCE AUDIT BLOCKED: '+error.message;status.className='feedback bad';});
search.disabled=true;search.addEventListener('input',render);
