import {validateCommunityCatalog} from './community-weapons.mjs';
import {
 LOADOUT_WEAPON_SLOTS,LOADOUT_MANUAL_SLOTS,
 planEquipmentLoadout,parseEquipCandidates
} from './equipment-loadout.mjs';
import {EQUIPMENT_SAVE_KEY,serializeEquipmentSnapshot,parseEquipmentSnapshot,
 normalizeEquipmentSnapshot,compareEquipmentSnapshots} from './equipment-save-compare.mjs';

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
let pinnedEquipment=null;
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
 renderEquipmentCompare();
}
function saveFeedback(message){byId('equipment-save-feedback').textContent=message;}
function comparisonFeedback(message){byId('equipment-ab-status').textContent=message;}
function applySavedEquipment(data){
 // Validate before changing any DOM nodes: caller already parsed and checked
 // all original source IDs/slot types, so an invalid save cannot erase edits.
 for(const [id,select] of weaponFields)select.value=data.weaponSlots[id];
 for(const [id,refs] of manualFields){
  const item=data.manualSlots[id];
  refs.kind.value=item.mode;
  refs.weight.disabled=item.mode==='empty';
  refs.weight.value=item.mode==='equipped'?String(item.weight):'';
 }
 maximum.value=data.maxLoad;
 confirmed.checked=false;
 render();
}
function renderEquipmentCompare(){
 const panel=byId('equipment-ab-results'),clear=byId('equipment-ab-clear');
 clear.disabled=pinnedEquipment===null;
 if(!pinnedEquipment||!catalog){
  panel.hidden=true;
  if(!pinnedEquipment)comparisonFeedback('Pin a loadout A or restore it from a local save to begin. Pinning never changes your current editor.');
  return;
 }
 try{
  const cmp=compareEquipmentSnapshots(pinnedEquipment,read(),catalog.weapons);
  panel.hidden=false;
  const describe=result=>{
   const prefix=result.complete?'Confirmed total: ':'Known subtotal (not a confirmed total): ';
   return prefix+result.knownSubtotal.toFixed(3)+
    ' · maximum '+(result.maximum===null?'not provided':result.maximum)+
    ' · roll tier '+(result.complete?result.load.tier+
      ' ('+result.load.percent.toFixed(2)+'%)':'UNCONFIRMED / UNKNOWN')+
    (result.unknown.length?' · unknown: '+result.unknown.join('; '):'');
  };
  byId('equipment-ab-summary-a').textContent=describe(cmp.baseline);
  byId('equipment-ab-summary-b').textContent=describe(cmp.current);
  const rows=byId('equipment-ab-rows');rows.replaceChildren();
  const describeSlot=slot=>slot.label+
   (slot.label==='Empty'?'':slot.weight===null?
    ' · weight UNKNOWN':' · '+slot.weight.toFixed(3));
  for(const item of cmp.rows){
   const tr=make('tr');
   if(item.changed)tr.className='equipment-ab-changed';
   const name=make('th',item.slot);name.scope='row';
   tr.append(name,make('td',describeSlot(item.A)),make('td',describeSlot(item.B)));
   rows.append(tr);
  }
  const delta=cmp.weightDelta===null?
   'Exact total-weight difference unavailable: at least one selected item has unknown weight.':
   'Known exact gear weight difference B − A: '+
    (cmp.weightDelta>0?'+':'')+cmp.weightDelta.toFixed(3)+'.';
  const tiers=cmp.exactTiers?
   ' Confirmed roll tiers: A '+cmp.baseline.load.tier+'; B '+cmp.current.load.tier+
    '. Load percentage difference B − A: '+
    (cmp.percentDelta>0?'+':'')+cmp.percentDelta.toFixed(2)+' percentage points.':
   ' Both plans must be explicitly confirmed with complete weights and an actual in-game maximum before comparing roll tiers.';
  byId('equipment-ab-difference').textContent=cmp.changedSlots+
   ' of 14 equipped slots changed. '+delta+tiers;
  comparisonFeedback('A remains pinned while B changes. '+
   'A saved plan can be restored but requires reconfirmation against the game.');
 }catch(error){
  panel.hidden=true;
  comparisonFeedback('Comparison unavailable until the inputs are valid: '+error.message);
 }
}
byId('equipment-save').addEventListener('click',()=>{
 try{
  if(!catalog)throw new RangeError('Wait for the local weapon catalog.');
  const json=serializeEquipmentSnapshot(read(),catalog.weapons);
  localStorage.setItem(EQUIPMENT_SAVE_KEY,json);
  saveFeedback('Equipment saved on this device. Previous local save was replaced. Confirmation is deliberately NOT stored.');
 }catch(error){saveFeedback('Unable to save: '+error.message);}
});
byId('equipment-restore').addEventListener('click',()=>{
 try{
  if(!catalog)throw new RangeError('Wait for the local weapon catalog.');
  const raw=localStorage.getItem(EQUIPMENT_SAVE_KEY);
  if(raw===null){saveFeedback('No saved equipment exists on this device.');return;}
  const loaded=parseEquipmentSnapshot(raw,catalog.weapons);
  applySavedEquipment(loaded);
  saveFeedback('Saved equipment restored into current B without confirmation. Recheck the full loadout in game.');
 }catch(error){saveFeedback('Unable to restore; current equipment was kept: '+error.message);}
});
byId('equipment-delete-save').addEventListener('click',()=>{
 try{
  localStorage.removeItem(EQUIPMENT_SAVE_KEY);
  saveFeedback('Saved equipment removed from this browser. Current equipment and pinned A remain unchanged.');
 }catch(error){saveFeedback('Unable to delete local equipment: '+error.message);}
});
byId('equipment-ab-pin').addEventListener('click',()=>{
 try{
  if(!catalog)throw new RangeError('Wait for the local weapon catalog.');
  const next=normalizeEquipmentSnapshot(read(),catalog.weapons);
  pinnedEquipment=next;renderEquipmentCompare();
  comparisonFeedback('Current equipped plan pinned as A. Edit slots above to compare current B.');
 }catch(error){comparisonFeedback('Unable to pin A: '+error.message);}
});
byId('equipment-ab-from-save').addEventListener('click',()=>{
 try{
  if(!catalog)throw new RangeError('Wait for the local weapon catalog.');
  const raw=localStorage.getItem(EQUIPMENT_SAVE_KEY);
  if(raw===null){comparisonFeedback('No saved equipment exists on this device.');return;}
  const next=parseEquipmentSnapshot(raw,catalog.weapons);
  pinnedEquipment=next;renderEquipmentCompare();
  comparisonFeedback('Saved equipment loaded as pinned A, but confirmation was cleared. B was not changed.');
 }catch(error){comparisonFeedback('Unable to pin saved A: '+error.message);}
});
byId('equipment-ab-clear').addEventListener('click',()=>{
 pinnedEquipment=null;renderEquipmentCompare();
});
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
