import {validateCommunityCatalog} from './community-weapons.mjs';
import {
 LOADOUT_WEAPON_SLOTS,LOADOUT_MANUAL_SLOTS,
 planEquipmentLoadout,parseEquipCandidates
} from './equipment-loadout.mjs';

const byId=id=>document.getElementById(id);
const make=(tag,text)=>{
 const el=document.createElement(tag);
 if(text!==undefined)el.textContent=String(text);
 return el;
};
const weaponFields=new Map(),manualFields=new Map();
const picksRoot=byId('equipment-weapon-fields');
const manualRoot=byId('equipment-manual-fields');
const confirmed=byId('equipment-confirm');
const maximum=byId('equipment-maximum');
const feedback=byId('equipment-feedback');
let catalog=null,candidates=[];
let catalogError=null,candidateError=null;

function changed(){
 confirmed.checked=false;
 render();
}
function addOption(parent,value,label){
 const option=make('option',label);option.value=value;parent.append(option);
}
function buildWeaponField(slot){
 const label=make('label');label.className='field';
 const title=make('span',slot.label),select=make('select');
 select.setAttribute('aria-label','Equipped '+slot.label);
 select.disabled=true;
 addOption(select,'','Empty — nothing equipped');
 label.append(title,select);picksRoot.append(label);
 select.addEventListener('change',changed);
 weaponFields.set(slot.id,select);
}
function buildManualField(slot){
 const wrapper=make('div');wrapper.className='equipment-manual-row';
 const label=make('label');label.className='field';
 label.append(make('span',slot.label));
 const kind=make('select');
 kind.setAttribute('aria-label',slot.label+' equipped status');
 addOption(kind,'empty','Empty — not equipped');
 addOption(kind,'equipped','Equipped — enter weight');
 label.append(kind);
 const weightLabel=make('label');weightLabel.className='field';
 weightLabel.append(make('span',slot.label+' weight'));
 const weight=make('input');
 weight.type='number';weight.min='0';weight.max='200';weight.step='0.001';
 weight.inputMode='decimal';weight.placeholder='From your game';
 weight.setAttribute('aria-label',slot.label+' in-game weight');
 weight.disabled=true;
 weightLabel.append(weight);
 kind.addEventListener('change',()=>{
  weight.disabled=kind.value!=='equipped';
  if(weight.disabled)weight.value='';
  changed();
 });
 weight.addEventListener('input',changed);
 wrapper.append(label,weightLabel);manualRoot.append(wrapper);
 manualFields.set(slot.id,{kind,weight});
}
for(const slot of LOADOUT_WEAPON_SLOTS)buildWeaponField(slot);
for(const slot of LOADOUT_MANUAL_SLOTS)buildManualField(slot);

function read(){
 return {
  weaponSlots:Object.fromEntries([...weaponFields].map(([id,select])=>[id,select.value])),
  manualSlots:Object.fromEntries([...manualFields].map(([id,refs])=>[
   id,{mode:refs.kind.value,weight:refs.weight.value}
  ])),
  maxLoad:maximum.value.trim(),
  confirmed:confirmed.checked
 };
}
function render(){
 for(const id of ['equipment-subtotal','equipment-total',
  'equipment-tier','equipment-percent'])byId(id).textContent='—';
 byId('equipment-unknown').textContent='';
 byId('equipment-thresholds').textContent='Roll boundaries: <30% light, 30–<70% medium, 70–<100% heavy, 100%+ overloaded.';
 if(!catalog){
  feedback.textContent=catalogError||'Loading the local community weapon catalog…';
  return;
 }
 try{
  const result=planEquipmentLoadout(read(),catalog.weapons);
  byId('equipment-subtotal').textContent=result.knownSubtotal.toFixed(3);
  if(result.complete){
   byId('equipment-total').textContent=result.knownSubtotal.toFixed(3);
   byId('equipment-tier').textContent=result.load.tier;
   byId('equipment-percent').textContent=result.load.percent.toFixed(2)+'%';
   byId('equipment-thresholds').textContent=
    'Light below '+result.load.lightBelow.toFixed(3)+
    ' · medium below '+result.load.mediumBelow.toFixed(3)+
    ' · heavy below '+result.load.heavyBelow.toFixed(3)+
    ' (all limits are strict; equality moves to the heavier tier).';
  }
  feedback.textContent=result.caution;
  if(result.unknown.length)byId('equipment-unknown').textContent=
   'Missing verified weight: '+result.unknown.join(' · ')+
   '. Selected items with missing weight are never treated as zero.';
  else byId('equipment-unknown').textContent=
   result.selectedCount+' explicitly equipped slot(s). Known weapons: '+
   result.knownWeaponWeight.toFixed(3)+
   '; manually entered armor/talismans: '+result.knownManualWeight.toFixed(3)+
   '. Candidate weapons are never auto-equipped.';
 }catch(error){
  feedback.textContent='Check your equipment values: '+error.message;
  byId('equipment-unknown').textContent='No final roll tier is available until the input is corrected.';
 }
}
maximum.addEventListener('input',changed);
confirmed.addEventListener('change',render);
byId('equipment-clear').addEventListener('click',()=>{
 for(const select of weaponFields.values())select.value='';
 for(const refs of manualFields.values()){
  refs.kind.value='empty';refs.weight.value='';refs.weight.disabled=true;
 }
 maximum.value='';confirmed.checked=false;render();
});
function populate(){
 const sorted=[...catalog.weapons].sort((a,b)=>
  a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
 const lookup=new Map(sorted.map(w=>[w.id,w]));
 const recommended=candidates.map(id=>lookup.get(id));
 if(recommended.some(w=>!w)){
  candidateError='The linked Build shortlist contains unknown catalog IDs. No weapons were equipped.';
  recommended.length=0;
  candidates=[];
 }
 for(const select of weaponFields.values()){
  select.replaceChildren();
  addOption(select,'','Empty — nothing equipped');
  if(recommended.length){
   const suggested=make('optgroup');suggested.label='Build Planner candidates (NOT equipped)';
   for(const item of recommended)addOption(suggested,item.id,item.name+
    (item.weight===null?' · weight unknown':' · '+item.weight+' weight'));
   select.append(suggested);
  }
  const all=make('optgroup');all.label='All community weapon references';
  for(const item of sorted){
   if(candidates.includes(item.id))continue;
   addOption(all,item.id,item.name+
    (item.weight===null?' · weight unknown':' · '+item.weight+' weight')+
    (item.expansion==='Shadow of the Erdtree'?' · DLC':''));
  }
  select.append(all);select.value='';select.disabled=false;
 }
 byId('equipment-candidates-note').textContent=candidateError||
  (recommended.length?
   recommended.length+' Build Planner weapon candidates are shown first in each dropdown. '+
    'Choose your actual equipped slots yourself; none has been pre-equipped.':
   'Choose only weapons that are actually equipped. Build Planner candidates are not your loadout.');
 render();
}
try{candidates=parseEquipCandidates(location.search);}
catch(error){candidateError='Invalid Build candidate link: '+error.message+
 '. Choose equipment from the source catalog manually.';}
fetch('../data/community-weapon-catalog.json',{cache:'default'}).then(async response=>{
 if(!response.ok)throw new Error('Local weapon catalog HTTP '+response.status);
 catalog=validateCommunityCatalog(await response.json());
 populate();
}).catch(error=>{
 catalogError='Local weapon weights cannot load: '+error.message+
  '. No weight result is computed from unsupported data.';
 render();
});
render();
