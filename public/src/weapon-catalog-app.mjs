import {validateCommunityCatalog,catalogCategories,searchCatalog,weaponRequirementComparison,
 baseDamageParts,cautionForWeapon,ATTRIBUTE_LABELS,requirementsUrl} from './community-weapons.mjs';
const $=id=>document.getElementById(id);
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);return n;};
const params=new URLSearchParams(location.search);
const cleanStats=value=>{
 if(!value||!/^([0-9]{1,2},){4}[0-9]{1,2}$/.test(value))return null;
 const a=value.split(',').map(Number);return a.every(n=>n>=1&&n<=99)?a:null;
};
const buildStats=cleanStats(params.get('player'))||(
 (()=>{const nums=params.get('stats')?.split(',').map(Number);return nums?.length===8?
 cleanStats(nums.slice(3).join(',')):null})())||[16,14,10,10,10];
for(let i=0;i<5;i++){
 const label=el('label',ATTRIBUTE_LABELS[i]);label.className='stat-field';
 const input=el('input');input.type='number';input.min='1';input.max='99';input.step='1';
 input.inputMode='numeric';input.value=String(buildStats[i]);input.dataset.stat=String(i);
 label.append(input);$('catalog-stats').append(label);
}
let catalog=null,chosen=null,offset=0;
const readStats=()=>{
 const fields=[...$('catalog-stats').querySelectorAll('input[data-stat]')];
 const numbers=fields.map(x=>Number(x.value));
 if(numbers.some((n,i)=>!Number.isInteger(n)||n<1||n>99||fields[i].value.trim()===''))
  throw new RangeError('Character attributes must be whole numbers from 1 to 99.');
 return numbers;
};
const status=(s,error=false)=>{
 $('catalog-status').textContent=s;
 $('catalog-status').className=error?'feedback bad':'feedback';
};
function renderDetails(){
 const box=$('catalog-details');
 if(!chosen){box.hidden=true;return;}
 box.hidden=false;
 $('catalog-title').textContent=chosen.name;
 $('catalog-class').textContent=chosen.category+' · Base (+0) · Community source, patch unknown';
 $('catalog-weight').textContent=String(chosen.weight);
 $('catalog-critical').textContent=chosen.critical===0?'Not confirmed':String(chosen.critical);
 const damage=$('catalog-damage');damage.replaceChildren();
 for(const part of baseDamageParts(chosen)){
  const row=el('div');row.className='catalog-value';
  row.append(el('span',part.name),el('strong',part.amount));damage.append(row);
 }
 const required=$('catalog-required');required.replaceChildren();
 for(let i=0;i<5;i++){
  const row=el('div');row.className='catalog-value';
  row.append(el('span',ATTRIBUTE_LABELS[i]),el('strong',chosen.requirements[i]));
  required.append(row);
 }
 const scaling=$('catalog-scaling');scaling.replaceChildren();
 for(let i=0;i<5;i++){
  const row=el('div');row.className='catalog-value';
  row.append(el('span',ATTRIBUTE_LABELS[i]),el('strong',chosen.scaling[i]));scaling.append(row);
 }
 const concerns=$('catalog-warnings');concerns.replaceChildren();
 for(const warning of cautionForWeapon(chosen))concerns.append(el('p',warning));
 $('catalog-verified').replaceChildren();
 if(chosen.checkedWith){
  const a=el('a','View independent numeric cross-check ↗');
  a.href=chosen.checkedWith;a.target='_blank';a.rel='noopener noreferrer';
  $('catalog-verified').append(a);
 }
 try{
  const stats=readStats();
  const result=weaponRequirementComparison(chosen,stats);
  $('catalog-one').textContent=result.oneHanded.canWield?'Requirements met':
    result.oneHanded.totalMissing+' attribute point(s) short';
  $('catalog-two').textContent=result.twoHanded.canWield?
   (result.applyTwoHandBonus?'Requirements met (standard 2H assumed)':'Requirements met (no 2H STR bonus)'):
   result.twoHanded.totalMissing+' point(s) short'+(result.applyTwoHandBonus?' (standard 2H assumed)':' (no 2H STR bonus)');
  $('catalog-two').title=result.applyTwoHandBonus?
   'Standard 1.5× STR assumption only; check paired and special grip rules in-game.':
   'No normal two-hand Strength increase assumed for this category.';
  const link=$('catalog-requirements-link');
  link.href=requirementsUrl(chosen,stats);
  link.hidden=false;
 }catch(e){
  $('catalog-one').textContent='Invalid character attributes';
  $('catalog-two').textContent='—';
  $('catalog-requirements-link').hidden=true;
 }
}
function showList(reset=false,keepSelected=false){
 if(!catalog)return;
 if(reset)offset=0;
 const term=$('catalog-search').value;
 const category=$('catalog-category').value;
 const sort=$('catalog-sort').value;
 const wield=$('catalog-wield').value;
 const damage=$('catalog-damage-filter').value;
 const rawWeight=$('catalog-max-weight').value.trim();
 let maxWeight=null;
 if(rawWeight!==''){
  maxWeight=Number(rawWeight);
  if(!Number.isFinite(maxWeight)||maxWeight<0||maxWeight>200){
   $('catalog-results').textContent='Enter a weight limit from 0 to 200.';
   $('catalog-more').hidden=true;
   if(reset){$('catalog-list').replaceChildren();chosen=null;renderDetails();}
   return;
  }
 }
 let data;
 try{
  data=searchCatalog(catalog.weapons,{
   term,category,sort,limit:40,offset,wield,damage,maxWeight,
   stats:wield==='any'?null:readStats()
  });
 }catch(error){
  $('catalog-results').textContent='Correct your character attributes: '+error.message;
  $('catalog-more').hidden=true;
  if(reset){$('catalog-list').replaceChildren();chosen=null;renderDetails();}
  return;
 }
 const list=$('catalog-list');
 if(reset){
  list.replaceChildren();
  if(!keepSelected)chosen=null;
 }
 if(!chosen&&data.results.length)chosen=data.results[0];
 const fragment=document.createDocumentFragment();
 for(const w of data.results){
  const btn=el('button');btn.type='button';btn.className='catalog-row';
  btn.setAttribute('aria-label','View '+w.name+' weapon details');
  if(w.id===chosen?.id)btn.classList.add('selected');
  const title=el('span',w.name);title.className='catalog-row-title';
  const detail=el('span',w.category+' · Wt '+w.weight+' · +0 community base stats');
  detail.className='catalog-row-desc';
  const tag=el('span',w.flags?.length?'Check data':'View details');
  tag.className='catalog-row-tag';
  btn.append(title,detail,tag);
  btn.addEventListener('click',()=>{
   chosen=w;
   for(const prev of list.querySelectorAll('.catalog-row.selected'))
    prev.classList.remove('selected');
   btn.classList.add('selected');renderDetails();
  });
  fragment.append(btn);
 }
 list.append(fragment);
 offset+=data.results.length;
 $('catalog-results').textContent=data.total+' matching entries · '+offset+' shown';
 $('catalog-more').hidden=offset>=data.total;
 renderDetails();
}
$('catalog-search').addEventListener('input',()=>showList(true));
$('catalog-category').addEventListener('change',()=>showList(true));
$('catalog-sort').addEventListener('change',()=>showList(true));
$('catalog-wield').addEventListener('change',()=>showList(true));
$('catalog-damage-filter').addEventListener('change',()=>showList(true));
$('catalog-max-weight').addEventListener('input',()=>showList(true));
$('catalog-more').addEventListener('click',()=>showList(false));
$('catalog-stats').addEventListener('input',()=>{
 renderDetails();
 if($('catalog-wield').value!=='any')showList(true);
});
try{
 const response=await fetch('../data/community-weapon-catalog.json',{cache:'default'});
 if(!response.ok)throw new Error('The local weapon catalog is unavailable ('+response.status+').');
 catalog=validateCommunityCatalog(await response.json());
 $('catalog-count').textContent=String(catalog.weapons.length);
 for(const category of catalogCategories(catalog.weapons)){
  const opt=el('option',category);opt.value=category;$('catalog-category').append(opt);
 }
 const preferred=params.get('weapon');
 if(preferred){chosen=catalog.weapons.find(w=>w.id===preferred)||null;}
 showList(true,Boolean(chosen));
 if(chosen)renderDetails();
 status('Loaded '+catalog.weapons.length+' community weapon entries from this site. Data remains patch-unverified; base stats are NOT calculated AR.');
}catch(e){
 status('Could not load weapon records: '+e.message,true);
 $('catalog-results').textContent='No data loaded';
}
