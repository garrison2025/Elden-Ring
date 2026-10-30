import {compareWeaponRequirements,REQUIREMENT_LABELS} from './requirements.mjs';
import {parseSharedStats} from './core.mjs';
const $=selector=>document.querySelector(selector);
const keys=['str','dex','int','fai','arc'];
const player=$('#requirement-player'),weapon=$('#requirement-weapon');
const status=(text,error=false)=>{const el=$('#feedback');el.textContent=text;el.className=error?'feedback bad':'feedback';};
function fields(root,initial,prefix){
 root.replaceChildren();
 for(const [index,label] of REQUIREMENT_LABELS.entries()){
   const node=document.createElement('label');node.className='stat-field';
   const name=document.createElement('span');name.textContent=label;
   const control=document.createElement('input');control.type='number';control.min=prefix==='Player'?'1':'0';
   control.max='99';control.step='1';control.value=String(initial[index]);control.inputMode='numeric';
   control.setAttribute('aria-label',prefix+' '+label);control.dataset.index=index;
   const short=document.createElement('small');short.textContent=keys[index].toUpperCase();
   node.append(name,control,short);root.append(node);
 }
}
const read=root=>Array.from(root.querySelectorAll('input')).map(input=>input.value);
function formatState(target,item){
 $(target).textContent=item.canWield?'Requirements met':item.totalMissing+' stat point'+(item.totalMissing===1?'':'s')+' short';
}
function showRows(output){
 const tbody=$('#requirements-rows');tbody.replaceChildren();
 for(let i=0;i<5;i++){
   const tr=document.createElement('tr');
   const row=output.oneHanded.rows[i],two=output.twoHanded.rows[i];
   for(const value of [row.label,row.current,row.required,
     row.missing?'+'+row.missing:'OK',two.missing?'+'+two.missing:'OK']){
       const td=document.createElement('td');td.textContent=String(value);tr.append(td);
     }
   tbody.append(tr);
 }
}
function update(){
 try{
   const output=compareWeaponRequirements(read(player),read(weapon),
     {applyTwoHandBonus:$('#two-hand-eligible').checked});
   formatState('#one-hand-status',output.oneHanded);
   formatState('#two-hand-status',output.twoHanded);
   $('#effective-str').textContent=String(output.twoHanded.effectiveStrength);
   $('#two-hand-str-min').textContent=String(output.twoHanded.rows[0].minimumRaw);
   $('#two-hand-rule').textContent=output.applyTwoHandBonus?
     'Standard grip: floor(1.5 × Strength). Only STR receives this bonus.':
     'Exception mode: no two-hand STR bonus (for paired/special wielding).';
   const url=new URL(location.href);url.search='';
   url.searchParams.set('player',output.stats.join(','));
   url.searchParams.set('req',output.requirements.join(','));
   url.searchParams.set('bonus',output.applyTwoHandBonus?'1':'0');
   $('#copy-requirements').dataset.url=url.toString();
   showRows(output);
   status('Calculated locally from requirements you entered. No weapon database or server requests.');
 }catch(error){
   for(const id of ['one-hand-status','two-hand-status','effective-str','two-hand-str-min'])$(id).textContent='—';
   $('#requirements-rows').replaceChildren();$('#copy-requirements').dataset.url='';
   status(error.message,true);
 }
}
const parseFive=(value,min)=>{
 if(typeof value!=='string'||value.length>24)return null;
 const parts=value.split(',');
 if(parts.length!==5||parts.some(part=>!/^(0|[1-9][0-9]?)$/.test(part)))return null;
 const out=parts.map(Number);
 return out.every(n=>n>=min&&n<=99)?out:null;
};
const params=new URLSearchParams(location.search);
const shared=parseSharedStats(params.get('stats'));
const defaultPlayer=shared?[shared[3],shared[4],shared[5],shared[6],shared[7]]:parseFive(params.get('player'),1)||[16,10,10,10,10];
const defaultRequirements=parseFive(params.get('req'),0)||[24,0,0,0,0];
fields(player,defaultPlayer,'Player');fields(weapon,defaultRequirements,'Requirement');
if(params.get('bonus')==='0')$('#two-hand-eligible').checked=false;
player.addEventListener('input',update);weapon.addEventListener('input',update);
$('#two-hand-eligible').addEventListener('change',update);
$('#copy-requirements').addEventListener('click',async()=>{
 const url=$('#copy-requirements').dataset.url;
 if(!url){status('Correct the values before sharing.',true);return;}
 try{await navigator.clipboard.writeText(url);status('Requirements link copied. It contains only numerical stats.');}
 catch{history.replaceState({},'',url);status('Link placed in the address bar. Copy it to share.');}
});
$('#restore-example').addEventListener('click',()=>{
 fields(player,[16,10,10,10,10],'Player');fields(weapon,[24,0,0,0,0],'Requirement');
 $('#two-hand-eligible').checked=true;update();
});
update();
