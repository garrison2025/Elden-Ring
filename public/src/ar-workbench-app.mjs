import {POWER_STATS} from './weapon-ar.mjs';
const get=id=>document.getElementById(id);
const feedback=(s,bad=false)=>{
 get('arw-feedback').textContent=s;
 get('arw-feedback').className=bad?'feedback bad':'feedback';
};
const clear=()=>{
 get('arw-onehand').textContent='—';get('arw-twohand').textContent='—';
 get('arw-delta').textContent='—';get('arw-effective').textContent='—';
 get('arw-components').replaceChildren();get('arw-comparison').hidden=true;
 get('arw-rounding-summary').textContent='—';
};
const make=(tag,value)=>{const e=document.createElement(tag);e.textContent=String(value);return e;};
const labels={str:'Strength',dex:'Dexterity',int:'Intelligence',fai:'Faith',arc:'Arcane'};
for(const stat of POWER_STATS){
 const label=make('label',labels[stat]);label.className='stat-field';
 const input=make('input','');input.type='number';input.min='1';input.max='99';input.step='1';
 input.inputMode='numeric';input.dataset.arwStat=stat;
 input.value=stat==='str'?'40':stat==='dex'?'20':'10';
 label.append(input);get('arw-stats').append(label);
}
let worker;
try{worker=new Worker(new URL('./ar-workbench-worker.mjs',import.meta.url),{type:'module'});}
catch(e){feedback('Your browser does not support the local research worker: '+e.message,true);}
let fileLoaded=false,selected=false,upgrades=[],syntheticMode=false;
let selectedB=false,bUpgrades=[],comparisonRevision=0,gripRevision=0;
const clearPair=()=>{
 comparisonRevision++;
 get('arw-compare-results').hidden=true;
 get('arw-pair-rows').replaceChildren();
 get('arw-pair-rounding-summary').textContent='—';
 for(const key of ['arw-pair-a','arw-pair-b','arw-pair-delta'])get(key).textContent='—';
};
const readStats=()=>{
 const stats={};
 for(const el of get('arw-stats').querySelectorAll('input[data-arw-stat]')){
  if(!/^(?:[1-9]|[1-9][0-9])$/.test(el.value.trim()))
   throw new RangeError('All attributes must be whole numbers from 1 to 99.');
  stats[el.dataset.arwStat]=Number(el.value);
 }
 return stats;
};
const send=(message)=>{if(!worker)throw new Error('Browser worker unavailable.');worker.postMessage(message);};
const setOptions=(records)=>{
 const select=get('arw-select');select.replaceChildren();
 for(const name of records){const option=new Option(name,name);select.add(option);}
 select.disabled=records.length===0;
 const second=get('arw-compare-select');second.replaceChildren();
 for(const name of records)second.add(new Option(name,name));
 second.disabled=records.length===0;
 if(records.length>1)second.selectedIndex=1;
 selected=false;selectedB=false;bUpgrades=[];
 gripRevision++;clear();clearPair();get('arw-upgrade').replaceChildren();get('arw-compare-upgrade').replaceChildren();
 if(!records.length)get('arw-results-count').textContent='No matching weapon names.';
};
function selectCurrent(){
 if(!fileLoaded||get('arw-select').disabled||!get('arw-select').value)return;
 selected=false;gripRevision++;clear();clearPair();
 send({op:'select',name:get('arw-select').value});
}
function selectSecond(){
 const second=get('arw-compare-select');
 selectedB=false;bUpgrades=[];clearPair();get('arw-compare-upgrade').replaceChildren();
 if(!fileLoaded||second.disabled||!second.value)return;
 send({op:'selectB',name:second.value});
}
function requestCalculation(){
 gripRevision++;
 if(!selected)return;
 try{
  const stats=readStats(),upgrade=Number(get('arw-upgrade').value);
  if(!upgrades.includes(upgrade))throw new RangeError('Selected upgrade level has no source data.');
  send({op:'compare',requestId:gripRevision,stats,upgrade});
 }catch(e){clear();feedback(e.message,true);}
}
function requestComparison(){
 clearPair();
 if(!selected||!selectedB)return;
 try{
  const stats=readStats();
  const leftUpgrade=Number(get('arw-upgrade').value);
  const rightUpgrade=Number(get('arw-compare-upgrade').value);
  if(!upgrades.includes(leftUpgrade)||!bUpgrades.includes(rightUpgrade))
   throw new RangeError('Choose supplied reinforcement levels for both weapons.');
  send({op:'compare-weapons',requestId:comparisonRevision,stats,leftUpgrade,rightUpgrade,
   twoHanded:get('arw-compare-grip').value==='two'});
 }catch(e){get('arw-pair-feedback').textContent=e.message;}
}
if(worker)worker.onmessage=({data:m})=>{
 if(m.op==='error'){
  if(m.phase==='compare-weapons'||m.phase==='selectB'){
   if(m.phase==='selectB')selectedB=false;
   clearPair();get('arw-pair-feedback').textContent=m.message;return;
  }
  if(m.phase==='load'){fileLoaded=false;get('arw-select').replaceChildren();get('arw-select').disabled=true;get('arw-file-status').textContent='No file loaded';}
  if(m.phase==='select')selected=false;
  gripRevision++;clear();clearPair();feedback(m.message,true);return;
 }
 if(m.op==='cleared'){
  fileLoaded=false;selected=false;selectedB=false;upgrades=[];bUpgrades=[];syntheticMode=false;
  gripRevision++;clearPair();get('arw-compare-select').replaceChildren();
  get('arw-compare-upgrade').replaceChildren();
  get('arw-file-status').textContent='No file loaded';
  get('arw-select').replaceChildren();get('arw-select').disabled=true;get('arw-search').value='';
  get('arw-upgrade').replaceChildren();get('arw-description').textContent='—';
  get('arw-results-count').textContent='—';clear();feedback('Local file cleared from worker memory.');return;
 }
 if(m.op==='loaded'){
  fileLoaded=true;syntheticMode=Boolean(m.synthetic);
  get('arw-file-status').textContent=m.count.toLocaleString('en-US')+
    (syntheticMode?' FICTIONAL demo entries (not game weapons).':' locally imported weapon names in memory.');
  get('arw-search').value='';get('arw-results-count').textContent=m.preview.matches+' results; only first '+m.preview.names.length+' shown.';
  setOptions(m.preview.names);
  feedback(syntheticMode?'FICTIONAL DEMO: all computed AR values are invented.':'Loaded local JSON. Nothing was uploaded.');
  if(m.preview.names.length){selectCurrent();selectSecond();}
  return;
 }
 if(m.op==='search-results'){
  get('arw-results-count').textContent=m.result.matches+' matching names; first '+m.result.names.length+' shown.';
  setOptions(m.result.names);if(m.result.names.length){selectCurrent();selectSecond();}return;
 }
 if(m.op==='selected'){
  selected=true;upgrades=m.description.upgradeLevels;
  get('arw-description').textContent=m.description.name+' · '+m.description.gripMode+
   ' grip · '+m.description.damageTypes.join(' + ')+' damage types · '+m.description.provenance.gameVersion;
  const u=get('arw-upgrade');u.replaceChildren();
  for(const n of upgrades)u.add(new Option('+'+n,String(n)));
  requestCalculation();requestComparison();return;
 }
 if(m.op==='selectedB'){
  selectedB=true;bUpgrades=m.description.upgradeLevels;
  const select=get('arw-compare-upgrade');select.replaceChildren();
  for(const n of bUpgrades)select.add(new Option('+'+n,String(n)));
  get('arw-pair-feedback').textContent='Weapon B: '+m.description.name;
  requestComparison();return;
 }
 if(m.op==='compared-weapons'){
  if(m.requestId!==comparisonRevision)return;
  const {left,right,delta,components}=m.result;
  get('arw-pair-a').textContent=String(left.total);
  get('arw-pair-b').textContent=String(right.total);
  get('arw-pair-delta').textContent=(delta>=0?'+':'')+delta;
  const tbody=get('arw-pair-rows');tbody.replaceChildren();
  for(const component of components){
   const row=make('tr','');
   for(const value of [component.type,component.left,component.right,
     (component.delta>=0?'+':'')+component.delta])row.append(make('td',value));
   tbody.append(row);
  }
  get('arw-compare-results').hidden=false;
  get('arw-pair-rounding-summary').textContent=
   'Rounding variants (sum of component floors / floor raw sum): A '+left.floorComponents+
   ' / '+left.floorTotal+', B '+right.floorComponents+' / '+right.floorTotal+
   '. Active rule: '+left.calculationRules.rounding+'.';
  get('arw-pair-feedback').textContent=syntheticMode?
   'FICTIONAL TEST — both weapon AR values are invented.':
   'UNVERIFIED nominal AR. A higher total does not establish higher real damage.';
  return;
 }
 if(m.op==='compared'){
  if(m.requestId!==gripRevision)return;
  const {oneHand,twoHand,difference}=m.result;
  get('arw-onehand').textContent=oneHand.total;
  get('arw-twohand').textContent=twoHand.total;
  get('arw-delta').textContent=(difference>=0?'+':'')+difference;
  get('arw-effective').textContent=oneHand.effectiveStats.str+' / '+twoHand.effectiveStats.str;
  const tbody=get('arw-components');tbody.replaceChildren();
  for(const before of oneHand.perElement){
   const after=twoHand.perElement.find(x=>x.element===before.element);
   const row=make('tr','');
   for(const value of [before.element,before.displayed,after?.displayed??0]){
    row.append(make('td',value));
   }
   tbody.append(row);
  }
  get('arw-comparison').hidden=false;
  get('arw-rounding-summary').textContent=
    'Rounding variants (sum of floored components / floor total raw AR): 1H '+
    oneHand.floorComponents+' / '+oneHand.floorTotal+', 2H '+
    twoHand.floorComponents+' / '+twoHand.floorTotal+
    '. Applied: '+oneHand.calculationRules.rounding+'; requirement rule: '+
    oneHand.calculationRules.requirements+'.';
  feedback(syntheticMode?'FICTIONAL DEMO ONLY — values are invented, NOT Elden Ring AR.':
 'Calculated with your imported parameters. Results remain UNVERIFIED game AR.');
 }
};
get('arw-load').addEventListener('click',async()=>{
 const file=get('arw-file').files?.[0];
 if(!file){feedback('Choose a .json file first.',true);return;}
 if(!file.name.toLowerCase().endsWith('.json')||file.size>16_000_000){
  feedback('Only a local .json file smaller than 16 MB is supported. No .js execution.',true);return;
 }
 const version=get('arw-version').value.trim(),reference=get('arw-source').value.trim();
 if(!version||version.length>60||!reference||reference.length>300){
  feedback('Enter an explicit game version and data provenance before loading.',true);return;
 }
 gripRevision++;clear();clearPair();selected=false;selectedB=false;fileLoaded=false;
 get('arw-file-status').textContent='Reading local file…';
 try{
  send({op:'clear'});send({op:'load',text:await file.text(),version,reference});
  feedback('Parsing and checking names in a dedicated browser worker…');
 }catch(e){feedback(e.message,true);}
});
get('arw-clear').addEventListener('click',()=>{get('arw-file').value='';send({op:'clear'});});
get('arw-demo').addEventListener('click',()=>{get('arw-file').value='';send({op:'demo'});});
get('arw-search').addEventListener('input',()=>{if(fileLoaded)send({op:'search',term:get('arw-search').value});});
get('arw-select').addEventListener('change',selectCurrent);
get('arw-compare-select').addEventListener('change',selectSecond);
get('arw-upgrade').addEventListener('change',()=>{clear();requestCalculation();requestComparison();});
get('arw-compare-upgrade').addEventListener('change',requestComparison);
get('arw-compare-grip').addEventListener('change',requestComparison);
get('arw-compare-run').addEventListener('click',requestComparison);
get('arw-stats').addEventListener('input',()=>{clear();requestCalculation();requestComparison();});
get('arw-compare').addEventListener('click',requestCalculation);
feedback('Choose a local compact regulation JSON file. No game data is bundled.');
