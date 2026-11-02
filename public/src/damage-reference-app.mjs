import {calculateManualMoveSequence} from './damage-moveset-sequence.mjs';
import {exactPublicUchigatanaDamage} from './tarnished-v117-scoped-reference-scenes.mjs';
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

const selectedV117=()=>{
 const values=$('damage-v117-scene').value.split(',').map(Number);
 const x=exactPublicUchigatanaDamage({str:values[0],dex:values[1]});
 const note=$('damage-v117-evidence-status');
 if(!x.reference){
  for(const id of ['damage-v117-ar','damage-v117-single','damage-v117-paired'])$(id).textContent='—';
  note.textContent='Reference result not independently observed for this exact input.';
  note.dataset.state='error';
  return;
 }
 $('damage-v117-ar').textContent=String(x.reference.ar);
 $('damage-v117-single').textContent=String(x.reference.dpsSingle);
 $('damage-v117-paired').textContent=String(x.reference.dpsPaired);
 note.dataset.state='ready';
 note.textContent=x.status+' · exact site source: '+x.source+'. '+x.caveat;
};
$('damage-v117-scene').addEventListener('change',selectedV117);
selectedV117();

const frames=$('damage-frame-entries');
let moveSerial=0;
const invalidateFrames=()=>{
 for(const id of ['damage-frame-total','damage-frame-dps','damage-frame-count'])
  $(id).textContent='—';
 $('damage-frame-status').textContent='Frame inputs changed. Recalculate with actual move values.';
 $('damage-frame-status').dataset.state='unverified';
};
const addFrame=()=>{
 if(frames.children.length>=8)return;
 const group=make('div',frames);group.className='panel damage-frame-row';
 const n=++moveSerial;
 const fields=[
  {name:'label',label:'Move label',type:'text',value:'Move '+n},
  {name:'mv',label:'Motion value %',type:'number',value:'100',min:'0',max:'500',step:'0.001'},
  {name:'hitMvs',label:'Optional per-hit motion values (%) — comma-separated; overrides uniform MV',type:'text',value:''},
  {name:'hits',label:'Hit count',type:'number',value:'1',min:'1',max:'100',step:'1'},
  {name:'frames',label:'Animation + recovery frames (required)',type:'number',value:'',min:'1',max:'10000',step:'1'}
 ];
 for(const meta of fields){
  const label=make('label',group);label.className='field';label.textContent=meta.label;
  const input=make('input',label);
  Object.assign(input,{type:meta.type,value:meta.value});
  input.dataset.frameField=meta.name;
  for(const prop of ['min','max','step'])if(meta[prop]!==undefined)input[prop]=meta[prop];
  if(meta.name==='frames')input.placeholder='Enter measured frames (no default)';
 }
 const remove=make('button',group);
 remove.type='button';remove.className='btn alt';remove.textContent='Remove move '+n;
 remove.addEventListener('click',()=>{group.remove();invalidateFrames();$('damage-frame-add').disabled=false;});
 $('damage-frame-add').disabled=frames.children.length>=8;
 invalidateFrames();
};
$('damage-frame-add').addEventListener('click',addFrame);
frames.addEventListener('input',invalidateFrames);
for(const parent of [attackRow,tbody])parent.addEventListener('input',invalidateFrames);
for(const id of ['damage-physical-type','damage-buff','damage-frame-fps']){
 $(id).addEventListener('input',invalidateFrames);
 $(id).addEventListener('change',invalidateFrames);
}
$('damage-frame-calculate').addEventListener('click',()=>{
 try{
  const input=config();
  const moves=[...frames.children].map(e=>{
   const v=key=>e.querySelector('[data-frame-field="'+key+'"]').value;
   const hitsRaw=v('hits').trim(),framesRaw=v('frames').trim();
   const perHitRaw=v('hitMvs').trim(),uniformRaw=v('mv').trim();
   if(!hitsRaw||!framesRaw||(!perHitRaw&&!uniformRaw))
    throw Error('Enter hit count, measured frames, and motion values for each move.');
   const entry={label:v('label'),hits:Number(hitsRaw),frames:Number(framesRaw)};
   if(perHitRaw){
    const tokens=perHitRaw.split(',').map(s=>s.trim());
    if(tokens.some(s=>!s||!/^\\d+(?:\\.\\d+)?$/.test(s)))
     throw Error('Per-hit motion values must be comma-separated nonnegative numbers.');
    entry.hitMotionValues=tokens.map(Number);
   }else entry.motionValue=Number(uniformRaw);
   return entry;
  });
  // A blank frame is INVALID, not Number('') -> zero as an accidental value.
  if([...frames.querySelectorAll('[data-frame-field="frames"]')].some(e=>!e.value.trim()))
   throw Error('Enter a real animation/recovery frame count for every move; zero/blank timing is unsupported.');
  const calculated=calculateManualMoveSequence({
   attack:input.attack,enemy:input.enemy,physicalType:input.physicalType,
   damageMultiplier:Number(input.damageMultiplier),
   framesPerSecond:Number($('damage-frame-fps').value),moves
  });
  $('damage-frame-total').textContent=fmt(calculated.damagePerSequence);
  $('damage-frame-dps').textContent=fmt(calculated.damagePerSecond);
  $('damage-frame-count').textContent=String(calculated.totalFrames);
  $('damage-frame-status').textContent=calculated.status+
   ' · '+calculated.perMove.map(x=>x.label+' '+fmt(x.sequenceDamage)).join('; ')+
   '. '+calculated.caveat;
  $('damage-frame-status').dataset.state='ready';
 }catch(error){
  for(const id of ['damage-frame-total','damage-frame-dps','damage-frame-count'])
   $(id).textContent='—';
  $('damage-frame-status').textContent='Calculation rejected: '+String(error.message).slice(0,250);
  $('damage-frame-status').dataset.state='error';
 }
});
addFrame();
