import {DAMAGE_TYPES,ENEMY_TYPES,calculateManualDamage} from './damage-reference-model.mjs';
const $=id=>document.getElementById(id);
const labels={physical:'Physical',strike:'Strike',slash:'Slash',pierce:'Thrust',magic:'Magic',fire:'Fire',lightning:'Lightning',holy:'Holy'};
const fmt=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:3});
const feedback=(s,error=false)=>{const el=$('damage-feedback');el.textContent=s;el.dataset.state=error?'error':'ready'};
const make=(tag,parent)=>{const el=document.createElement(tag);parent.append(el);return el};
const numeric=(parent,id,value,min,max,step='0.001')=>{
 const inp=make('input',parent);
 Object.assign(inp,{id,type:'number',value:String(value),min:String(min),max:String(max),step});
 inp.inputMode='decimal';
 return inp;
};
const attackRow=$('damage-attack-fields');
for(const key of DAMAGE_TYPES){
 const label=make('label',attackRow);label.className='field';label.textContent=labels[key]+' AR';
 numeric(label,'damage-attack-'+key,key==='physical'?500:0,0,10000);
}
const tbody=$('damage-enemy-fields');
for(const key of ENEMY_TYPES){
 const tr=make('tr',tbody);
 make('th',tr).textContent=labels[key];
 const d=make('td',tr),n=make('td',tr);
 numeric(d,'damage-def-'+key,100,0,100000);
 numeric(n,'damage-neg-'+key,0,-100,100);
}
const config=()=>({
 attack:Object.fromEntries(DAMAGE_TYPES.map(key=>[key,$('damage-attack-'+key).value])),
 physicalType:$('damage-physical-type').value,
 enemy:Object.fromEntries(ENEMY_TYPES.map(key=>[key,{
  defense:$('damage-def-'+key).value,negation:$('damage-neg-'+key).value
 }])),
 motionValue:$('damage-mv').value,
 damageMultiplier:$('damage-buff').value,
 attacksPerSecond:$('damage-aps').value
});
function render(){
 $('damage-results').replaceChildren();
 try{
  const r=calculateManualDamage(config());
  $('damage-total').textContent=fmt(r.damagePerHit);
  $('damage-dps').textContent=fmt(r.estimatedDps);
  $('damage-before').textContent=fmt(r.beforeDefense);
  for(const part of r.perType){
   if(!part.attackRating)continue;
   const tr=make('tr',$('damage-results'));
   for(const txt of [labels[part.type]+(part.type==='physical'?' ('+labels[part.defenseType]+')':''),
    fmt(part.afterDefense),fmt(part.afterNegation)])
    make('td',tr).textContent=txt;
  }
  $('damage-caveat').textContent='Per-type defense is resolved before enemy negation. '+
   'Estimated DPS uses only your entered hit rate; it does not infer real animations or status buildup.';
  feedback('Calculated locally using manually entered or URL-supplied values. '+r.caveat);
 }catch(error){
  $('damage-total').textContent='—';$('damage-dps').textContent='—';$('damage-before').textContent='—';
  $('damage-caveat').textContent='No damage estimate is published for invalid or missing values.';
  feedback(error.message,true);
 }
}
function restoreFromUrl(){
 const params=new URLSearchParams(location.search);
 if(![...params].length)return;
 if(location.search.length>1800){
  feedback('Oversized scenario URL ignored; edit values manually.',true);return;
 }
 const arValues={};
 for(const key of DAMAGE_TYPES){
  const value=params.get(key);
  if(value===null)continue;
  if(!/^(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(value)||Number(value)>10000){
   feedback('Invalid shared Attack Rating; URL values were ignored.',true);
   return;
  }
  arValues[key]=value;
 }
 const found=Object.keys(arValues).length;
 // A partial shared scenario is not the fictional demo: missing channels
 // mean zero, particularly when a magic-only weapon omitted Physical AR.
 if(found)for(const key of DAMAGE_TYPES)
  $('damage-attack-'+key).value=arValues[key]??'0';
 const type=params.get('type');
 if(['physical','strike','slash','pierce'].includes(type))
  $('damage-physical-type').value=type;
 for(const key of ENEMY_TYPES){
  const d=params.get('d_'+key),n=params.get('n_'+key);
  if(d!==null&&/^\d+(?:\.\d{1,3})?$/.test(d)&&Number(d)<=100000)
   $('damage-def-'+key).value=d;
  if(n!==null&&/^-?\d+(?:\.\d{1,3})?$/.test(n)&&
   Number(n)>=-100&&Number(n)<=100)
   $('damage-neg-'+key).value=n;
 }
 for(const [param,id,max] of [['mv','damage-mv',500],
  ['buff','damage-buff',5],['aps','damage-aps',20]]){
  const v=params.get(param);
  if(v!==null&&/^\d+(?:\.\d{1,3})?$/.test(v)&&Number(v)<=max)
   $(id).value=v;
 }
 if(found>0)
  $('damage-handoff-status').textContent=found+' Attack Rating channels supplied; '+
   (5-found)+' unspecified channels set to zero. Values are editable and a shared URL is not authenticated proof of v1.17 results.';
}
$('damage-reset-enemy').addEventListener('click',()=>{
 for(const key of ENEMY_TYPES){$('damage-def-'+key).value='100';$('damage-neg-'+key).value='0';}
 render();
});
$('damage-calculate').addEventListener('click',render);
for(const parent of [attackRow,tbody]){
 parent.addEventListener('input',render);
 parent.addEventListener('change',render);
}
for(const id of ['damage-physical-type','damage-mv','damage-buff','damage-aps']){
 $(id).addEventListener('change',render);
 $(id).addEventListener('input',render);
}
$('damage-copy').addEventListener('click',async()=>{
 try{
  calculateManualDamage(config()); // Invalid scenarios are not shared.
  const c=config(),url=new URL(location.pathname,location.origin);
  for(const key of DAMAGE_TYPES)url.searchParams.set(key,c.attack[key]);
  url.searchParams.set('type',c.physicalType);
  for(const key of ENEMY_TYPES){
   url.searchParams.set('d_'+key,c.enemy[key].defense);
   url.searchParams.set('n_'+key,c.enemy[key].negation);
  }
  url.searchParams.set('mv',c.motionValue);
  url.searchParams.set('buff',c.damageMultiplier);
  url.searchParams.set('aps',c.attacksPerSecond);
  await navigator.clipboard.writeText(url.toString());
  feedback('Scenario URL copied. It contains the chosen values in the URL query; opening the link reveals those values to the hosting provider.');
 }catch(e){feedback('Copy unavailable: '+e.message,true)}
});
restoreFromUrl();
render();
