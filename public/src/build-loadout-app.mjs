import {
 LOADOUT_WEAPON_SLOTS,LOADOUT_ARMOR_SLOTS,emptyBuildLoadout,
 validateBuildLoadout,evaluateBuildLoadout,encodeBuildLoadout,decodeBuildLoadout
} from './build-loadout.mjs';
import {validateCommunityCatalog} from './community-weapons.mjs';
const byId=id=>document.getElementById(id);
const status=(message,error=false)=>{
 const el=byId('build-loadout-status');el.textContent=message;el.dataset.state=error?'error':'ready';
};
const make=(tag,props={},parent)=>{
 const el=document.createElement(tag);
 for(const [k,v] of Object.entries(props)){
  if(k==='text')el.textContent=v;
  else if(k==='className')el.className=v;
  else if(k==='value')el.value=v;
  else el.setAttribute(k,v);
 }
 if(parent)parent.append(el);
 return el;
};
const field=(parent,label,type='text',attrs={})=>{
 const holder=make('label',{className:'field'},parent);
 make('span',{text:label},holder);
 return make('input',{type,maxlength:'100',...attrs},holder);
};
const state=()=>({
 schemaVersion:1,
 weaponSlots:weaponEntries.map(r=>({id:r.select.value,manualWeight:r.weight.value.trim()})),
 armorSlots:armorEntries.map(r=>({name:r.name.value,weight:r.weight.value.trim()})),
 talismans:talismanEntries.map(x=>x.value),
 spells:spellEntries.map(x=>x.value),
 crystalTears:tearEntries.map(x=>x.value),
 greatRune:byId('build-loadout-rune').value,
 maxEquipLoad:byId('build-loadout-maximum').value.trim()
});
let catalog=null,weaponEntries=[],armorEntries=[],talismanEntries=[],spellEntries=[],tearEntries=[];
let active=false,latestResult=null;
const savedKey='buildlab:equipment-loadout:v1';
const topStats=()=>{
 const values=[...document.querySelectorAll('#stat-grid [data-stat]')].map(x=>Number(x.value));
 if(values.length!==8||values.some(x=>!Number.isInteger(x)||x<1||x>99))
  throw new RangeError('Correct all eight Build attributes before linking a weapon.');
 return values;
};
const contentOpts=()=>({
 allowSote:byId('build-sote')?.checked===true,
 allowTarnishedPack:byId('build-tarnished-pack')?.checked===true
});
function render(){
 if(!active||!catalog)return;
 const result=byId('build-loadout-results');result.replaceChildren();
 latestResult=null;
 try{
  const evaluated=evaluateBuildLoadout(state(),catalog,contentOpts());
  latestResult=evaluated;
  const heading=make('h3',{text:evaluated.exactTotal===null?
   'Partial loadout — exact equip load withheld':
   'Equipped weight: '+evaluated.exactTotal.toFixed(3)},result);
  heading.dataset.quality=evaluated.exactTotal===null?'partial':'local';
  make('p',{text:'Known weight subtotal: '+evaluated.knownWeight.toFixed(3)+
   '. '+evaluated.items.length+' occupied weight-bearing slots; '+
   evaluated.unknowns.length+' item weights unknown or disputed.'},result);
  if(evaluated.tier){
   make('p',{text:'Roll tier: '+evaluated.tier.tier+' ('+
    evaluated.tier.percent.toFixed(2)+'% of user-entered maximum). '+
    'This is a load calculation only, not a claim about real source item values.'},result);
  }else if(evaluated.exactTotal===null){
   make('p',{text:'Roll tier UNSUPPORTED until every occupied weapon and armor slot has a non-disputed weight.'},result);
  }else make('p',{text:'Enter your actual maximum equip load to calculate a tier.'},result);
  if(evaluated.unknowns.length){
   const ul=make('ul',{},result);
   for(const u of evaluated.unknowns.slice(0,10))
    make('li',{text:u.slot+': '+u.name+' — '+u.reason},ul);
  }
  if(evaluated.items.length){
   const table=make('table',{className:'loadout-equipment-table'},result);
   const header=make('tr',{},make('thead',{},table));
   for(const key of ['Slot','Item','Weight','Value provenance'])make('th',{text:key,scope:'col'},header);
   const tb=make('tbody',{},table);
   for(const item of evaluated.items){
    const tr=make('tr',{},tb);
    for(const v of [item.slot,item.name,item.weight===null?'UNKNOWN':String(item.weight),item.provenance])
     make('td',{text:v},tr);
   }
  }
  const opts=contentOpts();
  const selected=state().weaponSlots.filter(x=>x.id);
  if(selected.length){
   const box=make('div',{className:'build-loadout-ar-links'},result);
   make('p',{text:'Selected weapons: open optional v1.17 reference AR using current Build stats (separate source opt-in required).'},box);
   try{
    const stats=topStats().slice(3);
    for(const slot of selected){
     const weapon=catalog.weapons.find(w=>w.id===slot.id);
     if(!weapon||weapon.expansion==='Shadow of the Erdtree'&&!opts.allowSote||
      weapon.expansion==='Tarnished Pack'&&!opts.allowTarnishedPack)continue;
     const u=new URL('../weapon-ar-calculator/',location.href);
     u.searchParams.set('weapon',weapon.name);
     u.searchParams.set('player',stats.join(','));
     const link=make('a',{href:u.toString(),className:'btn alt',text:'AR: '+weapon.name},box);
     link.referrerPolicy='no-referrer';
    }
   }catch{
    make('p',{text:'Correct your eight Build attributes before creating AR links.'},box);
   }
  }
  make('p',{text:evaluated.warnings.join(' ')},result);
  status('Loadout evaluated locally. '+(evaluated.unknowns.length?
   'Unknown weights remain excluded from exact totals.':'All occupied equipment slots have explicit or source-reported weights.'));
 }catch(error){
  status('Loadout blocked: '+error.message,true);
  make('p',{text:'No equipped-weight result was published. '+error.message},result);
 }
}
function fill(stateInput){
 const v=validateBuildLoadout(stateInput);
 for(let i=0;i<6;i++){
  const id=v.weaponSlots[i].id;
  if(id&&!catalog.weapons.some(w=>w.id===id))
   throw new RangeError('Imported weapon ID is not in the current catalog: '+id);
 }
 weaponEntries.forEach((r,i)=>{r.select.value=v.weaponSlots[i].id;r.weight.value=v.weaponSlots[i].manualWeight;});
 armorEntries.forEach((r,i)=>{r.name.value=v.armorSlots[i].name;r.weight.value=v.armorSlots[i].weight;});
 talismanEntries.forEach((x,i)=>{x.value=v.talismans[i];});
 spellEntries.forEach((x,i)=>{x.value=v.spells[i];});
 tearEntries.forEach((x,i)=>{x.value=v.crystalTears[i];});
 byId('build-loadout-rune').value=v.greatRune;
 byId('build-loadout-maximum').value=v.maxEquipLoad;
 render();
}
function createInputs(){
 const weapons=byId('build-loadout-weapons'),armor=byId('build-loadout-armor');
 const sorted=[...catalog.weapons].sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
 for(const slot of LOADOUT_WEAPON_SLOTS){
  const box=make('div',{className:'build-loadout-item'},weapons);
  const label=make('label',{className:'field'},box);
  make('span',{text:slot},label);
  const select=make('select',{},label);
  make('option',{value:'',text:'— Empty slot —'},select);
  for(const w of sorted){
   const label=w.name+(w.expansion?' · '+w.expansion:'')+
    (w.weight===null?' · weight UNKNOWN':'');
   make('option',{value:w.id,text:label},select);
  }
  const w=field(box,'Optional in-game weight override','number',{
   placeholder:'Only if source weight is unknown/disputed',
   min:'0',max:'999',step:'0.001',inputmode:'decimal'
  });
  weaponEntries.push({select,weight:w});
 }
 for(const slot of LOADOUT_ARMOR_SLOTS){
  const box=make('div',{className:'build-loadout-item'},armor);
  const name=field(box,slot+' armor name', 'text',{placeholder:'Enter equipped item name'});
  const weight=field(box,'In-game item weight','number',{
   placeholder:'Unknown until provided',min:'0',max:'999',step:'0.001',inputmode:'decimal'
  });
  armorEntries.push({name,weight});
 }
 const talismans=byId('build-loadout-talismans');
 for(let i=0;i<4;i++)talismanEntries.push(field(talismans,'Talisman '+(i+1),'text',{
  placeholder:'Name only; effects not calculated'
 }));
 const effects=byId('build-loadout-activations');
 for(let i=0;i<2;i++)tearEntries.push(field(effects,'Crystal Tear '+(i+1),'text',{
  placeholder:'Name only'
 }));
 const rune=field(effects,'Equipped Great Rune','text',{
  id:'build-loadout-rune',placeholder:'Name only; not applied to stats'
 });
 const spells=byId('build-loadout-spells');
 for(let i=0;i<10;i++)spellEntries.push(field(spells,'Spell '+(i+1),'text',{
  placeholder:'Name only; no spell scaling assumed'
 }));
 const container=byId('build-loadout-container');
 container.addEventListener('input',render);
 container.addEventListener('change',render);
 byId('build-sote')?.addEventListener('change',render);
 byId('build-tarnished-pack')?.addEventListener('change',render);
 byId('stat-grid')?.addEventListener('input',render);
 void rune;
}
const activate=async()=>{
 if(active)return;
 byId('build-loadout-start').disabled=true;
 status('Reading bundled weapon names and source-reported weights…');
 try{
  const response=await fetch('../data/community-weapon-catalog.json',{cache:'default'});
  if(!response.ok)throw Error('HTTP '+response.status);
  catalog=validateCommunityCatalog(await response.json());
  createInputs();active=true;
  byId('build-loadout-container').hidden=false;
  byId('build-loadout-start').hidden=true;
  const query=new URLSearchParams(location.search).get('loadout');
  if(query){try{fill(decodeBuildLoadout(query));}
   catch(e){fill(emptyBuildLoadout());status('Shared equipment not restored: '+e.message,true);}}
  else fill(emptyBuildLoadout());
 }catch(error){byId('build-loadout-start').disabled=false;status('Cannot load equipment: '+error.message,true);}
};
byId('build-loadout-start').addEventListener('click',activate);
byId('build-loadout-calculate').addEventListener('click',render);
byId('build-loadout-clear').addEventListener('click',()=>{if(active)fill(emptyBuildLoadout());});
byId('build-loadout-save').addEventListener('click',()=>{
 try{if(!active)throw Error('Open the equipment planner first.');
  const normalized=encodeBuildLoadout(state());
  localStorage.setItem(savedKey,normalized);status('Equipment saved in this browser only.');
 }catch(e){status('Cannot save equipment: '+e.message,true);}
});
byId('build-loadout-restore').addEventListener('click',()=>{
 try{if(!active)throw Error('Open the equipment planner first.');
  const raw=localStorage.getItem(savedKey);
  if(!raw)throw Error('No locally saved equipment yet.');
  fill(decodeBuildLoadout(raw));status('Locally saved equipment restored.');
 }catch(e){status('Cannot restore equipment: '+e.message,true);}
});
byId('build-loadout-export').addEventListener('click',()=>{
 try{
  if(!active)throw Error('Open the equipment planner first.');
  const data=encodeBuildLoadout(state());
  const url=URL.createObjectURL(new Blob([data+'\n'],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='elden-ring-build-equipment.json';
  document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
  status('JSON exported. This file contains selected names, IDs and weights; no external game parameter file is included.');
 }catch(e){status('Cannot export equipment: '+e.message,true);}
});
byId('build-loadout-import').addEventListener('change',async()=>{
 const file=byId('build-loadout-import').files?.[0];
 if(!file)return;
 try{
  if(!active)throw Error('Open the equipment planner first.');
  if(file.size>20000)throw Error('Maximum equipment JSON file size is 20 KB.');
  fill(decodeBuildLoadout(await file.text()));status('Local equipment JSON imported.');
 }catch(e){status('Cannot import equipment: '+e.message,true);}
});
byId('build-loadout-share').addEventListener('click',async()=>{
 try{
  if(!active)throw Error('Open the equipment planner first.');
  const u=new URL(location.pathname,location.origin);
  u.searchParams.set('origin',byId('origin').value);
  const stats=topStats();
  u.searchParams.set('stats',stats.join(','));
  if(byId('build-tarnished-pack').checked)u.searchParams.set('tarnished','1');
  if(byId('build-sote').checked)u.searchParams.set('sote','1');
  u.searchParams.set('loadout',encodeBuildLoadout(state()));
  if(u.toString().length>8000)throw Error('Link too long; export JSON instead.');
  try{await navigator.clipboard.writeText(u.toString());
   status('Build and equipment URL copied. It includes selected stats and names; opening the link may expose them to the hosting provider.');}
  catch{status('Clipboard unavailable. Use exported JSON instead.',true);}
 }catch(e){status('Cannot create combined URL: '+e.message,true);}
});
if(new URLSearchParams(location.search).has('loadout'))activate();
