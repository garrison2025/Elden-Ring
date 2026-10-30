import {STATS,CLASSES,classForName,validateStats,buildLevel,optimizeClasses,runeCostForLevel,runeRange,targetFromRunes,loadTier,commas,farmingRunsNeeded,parseSharedStats} from './core.mjs';
import {validateCommunityCatalog} from './community-weapons.mjs';
import {parseBuildWeaponId,parseContentFlag,buildWeaponOptions,inspectBuildWeapon} from './build-weapon-reference.mjs';
const $=s=>document.querySelector(s);const page=document.body.dataset.page;const fmt=commas;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const status=(text,bad=false)=>{const el=$('#feedback');if(el){el.textContent=text;el.className=bad?'feedback bad':'feedback';}};
function number(id){const s=$(id).value.trim();if(s==='')throw Error('Please fill out every number field.');const v=Number(s);if(!Number.isFinite(v))throw Error('Enter valid numbers.');return v}
function optionalNonNegative(id){const value=$(id).value.trim();if(value==='')return null;const n=Number(value);if(!Number.isSafeInteger(n)||n<0)throw new RangeError('Optional rune values must be non-negative whole numbers.');return n}
function clearValues(ids){for(const id of ids){const e=$(id);if(e)e.textContent='—'}}
function initRune(){
  const params=new URLSearchParams(location.search);const fromParam=params.get('from'),toParam=params.get('to');
  if(fromParam!==null&&/^\d{1,3}$/.test(fromParam))$('#from').value=fromParam;
  if(toParam!==null&&/^\d{1,3}$/.test(toParam))$('#to').value=toParam;
  function update(){try{
    const from=number('#from'),to=number('#to'),budget=optionalNonNegative('#budget'),perRun=optionalNonNegative('#runes-per-run');
    const spent=runeRange(from,to);
    $('#rune-total').textContent=fmt(spent);
    $('#next-cost').textContent=from===713?'MAX':fmt(runeCostForLevel(from));
    $('#rune-formula').textContent=`From Lv ${from} to Lv ${to} · ${to-from} level-ups`;
    if(budget===null){clearValues(['#reachable','#leftover']);}
    else{const result=targetFromRunes(from,budget);$('#reachable').textContent=result.level;$('#leftover').textContent=fmt(result.remaining)}
    if(perRun===null){$('#farm-runs').textContent='—'}
    else{$('#farm-runs').textContent=fmt(farmingRunsNeeded(from,to,budget??0,perRun));}
    status('Updated locally. Rune budget and farming yield are optional.');
  }catch(e){clearValues(['#rune-total','#next-cost','#reachable','#leftover','#farm-runs','#rune-formula']);status(e.message,true)}}
  ['#from','#to','#budget','#runes-per-run'].forEach(s=>$(s).addEventListener('input',update));update();
}
function classOptions(select,includeExtra=false){select.innerHTML=CLASSES.filter(c=>includeExtra||!c.dlc).map(c=>`<option value="${esc(c.name)}">${esc(c.name)}${c.dlc?' · extra content':''}</option>`).join('')}
function statInputs(root,values){root.innerHTML=STATS.map((name,i)=>`<label class="stat-field"><span>${name}</span><input data-stat="${i}" inputmode="numeric" type="number" min="1" max="99" step="1" value="${values[i]}"><small>${['VIG','MND','END','STR','DEX','INT','FAI','ARC'][i]}</small></label>`).join('')}
function values(root){return [...root.querySelectorAll('[data-stat]')].map(x=>x.value)}
function queryURL(relative,params){const u=new URL(relative,location.href);for(const [key,value] of Object.entries(params))u.searchParams.set(key,String(value));return u.toString()}
function initBuild(){
  const sel=$('#origin'),grid=$('#stat-grid'),extra=$('#build-tarnished-pack'),sote=$('#build-sote');
  const search=$('#build-weapon-search'),weaponSelect=$('#build-weapon'),weaponSummary=$('#build-weapon-summary');
  const weaponDetails=$('#build-weapon-detail-link');
  let current=classForName('Samurai'),selectedWeaponId=null,weaponCatalog=null,weaponLoadError=null;
  const query=new URLSearchParams(location.search);
  let sharedProblem=null;
  try{extra.checked=parseContentFlag(query.get('tarnished'));sote.checked=parseContentFlag(query.get('sote'));}
  catch(e){extra.checked=false;sote.checked=false;sharedProblem='Invalid extra-content settings were ignored.';}
  classOptions(sel,extra.checked);sel.value=current.name;statInputs(grid,current.stats);
  const read=()=>validateStats(values(grid),current);
  function refreshWeaponChoices(){
    if(!weaponCatalog)return;
    const matches=buildWeaponOptions(weaponCatalog.weapons,search.value,selectedWeaponId,35,sote.checked);
    weaponSelect.replaceChildren();
    const none=document.createElement('option');none.value='';none.textContent='No weapon selected';weaponSelect.append(none);
    for(const w of matches.options){
      const opt=document.createElement('option');opt.value=w.id;
      opt.textContent=w.name+' · '+w.category+(w.expansion==='Shadow of the Erdtree'?' · SOTE':'');
      weaponSelect.append(opt);
    }
    weaponSelect.value=selectedWeaponId||'';
    if(weaponSelect.selectedIndex<0)weaponSelect.value='';
    const count=document.createElement('span');
    count.className='sr-only';count.textContent=matches.matching+' search matches.';
    if(matches.matching===0&&!selectedWeaponId)weaponSummary.textContent='No matches for this search. Try another name.';
  }
  function renderWeapon(stats){
    weaponDetails.hidden=true;
    if(weaponLoadError){weaponSummary.textContent='Weapon references unavailable: '+weaponLoadError;return;}
    if(!weaponCatalog){weaponSummary.textContent='Loading local weapon references…';return;}
    if(!selectedWeaponId){
      if(!search.value.trim())weaponSummary.textContent='No weapon selected. Search the catalogue to add one.';
      return;
    }
    try{
      const model=inspectBuildWeapon(weaponCatalog.weapons,selectedWeaponId,stats,{allowSote:sote.checked});
      const one=model.oneHanded===null?'requirements unknown':model.oneHanded?'one-hand requirements met':'one-hand requirements NOT met';
      const two=model.twoHanded===null?'two-hand requirements unknown':model.twoHanded?'two-hand requirements met':'two-hand requirements NOT met';
      weaponSummary.textContent=model.name+' · '+model.category+' · '+one+' · '+two+' · weapon weight '+
        (model.weight===null?'unknown':model.weight)+' (NOT total load). '+model.note;
      weaponDetails.href=queryURL('../weapon-database/',{weapon:selectedWeaponId,stats:stats.join(',')});
      weaponDetails.hidden=false;
    }catch(e){weaponSummary.textContent='Weapon reference unavailable: '+e.message;}
  }
  function render(){try{
    const v=read(),level=buildLevel(current,v);
    $('#build-level').textContent=level;$('#spent-points').textContent=level-current.level;
    $('#build-runecost').textContent=fmt(runeRange(current.level,level));
    $('#build-summary').textContent=current.name+' · Lv '+level+' · '+v.join(' / ');
    $('#class-compare-link').href=queryURL('../class-optimizer/',{stats:v.join(',')});
    $('#rune-plan-link').href=queryURL('../level-rune-calculator/',{from:current.level,to:level});
    $('#respec-link').href=queryURL('../respec-planner/',{origin:current.name,stats:v.join(',')});
    $('#weapon-req-link').href=queryURL('../weapon-requirements/',{stats:v.join(',')});
    $('#weapon-catalog-link').href=queryURL('../weapon-database/',{
      origin:current.name,stats:v.join(','),
      ...(extra.checked?{tarnished:'1'}:{}),...(sote.checked?{sote:'1'}:{}),
      ...(selectedWeaponId?{weapon:selectedWeaponId}:{})
    });
    for(const id of ['#class-compare-link','#rune-plan-link','#respec-link','#weapon-req-link','#weapon-catalog-link'])$(id).hidden=false;
    renderWeapon(v);
    status(sharedProblem||'Plan valid. Attribute level is calculated locally; selected weapons are community references only.');
  }catch(e){
    clearValues(['#build-level','#spent-points','#build-runecost','#build-summary']);
    for(const id of ['#class-compare-link','#rune-plan-link','#respec-link','#weapon-req-link','#weapon-catalog-link'])$(id).hidden=true;
    weaponDetails.hidden=true;weaponSummary.textContent='Correct the eight character attributes before checking weapon requirements.';
    status(e.message,true);
  }}
  sel.addEventListener('change',()=>{current=classForName(sel.value);statInputs(grid,current.stats);render()});
  extra.addEventListener('change',()=>{
    if(!extra.checked&&current.dlc){current=classForName('Samurai');statInputs(grid,current.stats);}
    classOptions(sel,extra.checked);sel.value=current.name;render();
  });
  sote.addEventListener('change',()=>{
    if(!sote.checked&&selectedWeaponId&&weaponCatalog?.weapons.find(w=>w.id===selectedWeaponId)?.expansion==='Shadow of the Erdtree'){
      requestedWeapon=selectedWeaponId;selectedWeaponId=null;
    }
    if(sote.checked&&requestedWeapon&&weaponCatalog){
      try{inspectBuildWeapon(weaponCatalog.weapons,requestedWeapon,read(),{allowSote:true});
        selectedWeaponId=requestedWeapon;requestedWeapon=null;sharedProblem=null;}
      catch(e){sharedProblem='Cannot restore weapon: '+e.message;requestedWeapon=null;}
    }
    refreshWeaponChoices();render();
  });
  grid.addEventListener('input',render);
  $('#reset-build').addEventListener('click',()=>{statInputs(grid,current.stats);render()});
  search.addEventListener('input',()=>{refreshWeaponChoices();render()});
  weaponSelect.addEventListener('change',()=>{selectedWeaponId=weaponSelect.value||null;render()});
  const savedKey='buildlab:local-build:v1';
  $('#save-build').addEventListener('click',()=>{try{
    const stats=read();
    if(selectedWeaponId){if(!weaponCatalog)throw Error('Wait for weapon references to load.');
      inspectBuildWeapon(weaponCatalog.weapons,selectedWeaponId,stats,{allowSote:sote.checked});}
    localStorage.setItem(savedKey,JSON.stringify({version:2,origin:current.name,stats,weaponId:selectedWeaponId,
      ownsTarnishedPack:extra.checked,ownsSote:sote.checked}));
    status('Build saved locally with the selected weapon and content options.');
  }catch(e){status('Unable to save locally: '+e.message,true)}});
  $('#load-build').addEventListener('click',()=>{try{
    const saved=localStorage.getItem(savedKey);if(!saved){status('No saved build on this browser.');return;}
    const parsed=JSON.parse(saved);
    if(!parsed||(parsed.version!==1&&parsed.version!==2))throw Error('Saved build has an unsupported format.');
    const cls=CLASSES.find(c=>c.name===parsed.origin);if(!cls)throw Error('Saved build origin is unavailable.');
    const old=parsed.version===1;
    if(old&&cls.dlc)throw Error('This older save uses a Tarnished Pack origin. Recreate it with the extra-content setting.');
    const nextExtra=old?false:parsed.ownsTarnishedPack===true;
    const nextSote=old?false:parsed.ownsSote===true;
    if(cls.dlc&&!nextExtra)throw Error('Saved origin requires Tarnished Pack access.');
    const stats=validateStats(parsed.stats,cls);
    const nextWeapon=old?null:parseBuildWeaponId(parsed.weaponId);
    if(nextWeapon){
      if(!weaponCatalog)throw Error('Wait for the weapon catalog to load before restoring weapon selections.');
      inspectBuildWeapon(weaponCatalog.weapons,nextWeapon,stats,{allowSote:nextSote});
    }
    extra.checked=nextExtra;sote.checked=nextSote;current=cls;selectedWeaponId=nextWeapon;
    classOptions(sel,extra.checked);sel.value=cls.name;statInputs(grid,stats);
    search.value='';refreshWeaponChoices();render();
    status(old?'Legacy build stats restored. Extra-content flags and weapons were not stored in v1.':'Saved build and reference selection restored.');
  }catch(e){status('Unable to load saved build: '+e.message,true)}});
  $('#delete-build').addEventListener('click',()=>{try{
    localStorage.removeItem(savedKey);status('Saved build deleted from this browser.');
  }catch(e){status('Unable to clear local storage: '+e.message,true)}});
  $('#share-build').addEventListener('click',async()=>{try{
    const v=read();
    if(selectedWeaponId){if(!weaponCatalog)throw Error('Wait for weapon data to load.');
      inspectBuildWeapon(weaponCatalog.weapons,selectedWeaponId,v,{allowSote:sote.checked});}
    const u=queryURL(location.pathname,{origin:current.name,stats:v.join(','),
      ...(extra.checked?{tarnished:'1'}:{}),...(sote.checked?{sote:'1'}:{}),
      ...(selectedWeaponId?{weapon:selectedWeaponId}:{})});
    try{await navigator.clipboard.writeText(u);status('Build and optional weapon reference link copied.');}
    catch{history.replaceState({},'',u);status('Build link placed in the address bar; copy it to share.');}
  }catch(e){status(e.message,true)}});
  const cls=CLASSES.find(c=>c.name===query.get('origin')),shared=parseSharedStats(query.get('stats'));
  if(cls&&shared){
    if(cls.dlc&&!extra.checked)sharedProblem='Shared origin needs Tarnished Pack. Enable the separate origin option to use it.';
    else try{validateStats(shared,cls);current=cls;classOptions(sel,extra.checked);sel.value=cls.name;statInputs(grid,shared);}
    catch{sharedProblem='Invalid shared build; starting class defaults restored.';}
  }
  let requestedWeapon=null;
  try{requestedWeapon=parseBuildWeaponId(query.get('weapon'));}
  catch{sharedProblem='Invalid shared weapon ID ignored.';}
  render();
  fetch('../data/community-weapon-catalog.json',{cache:'default'}).then(async response=>{
    if(!response.ok)throw Error('HTTP '+response.status);
    const catalog=validateCommunityCatalog(await response.json());
    weaponCatalog=catalog;search.disabled=false;weaponSelect.disabled=false;
    if(requestedWeapon!==null){
      try{inspectBuildWeapon(catalog.weapons,requestedWeapon,read(),{allowSote:sote.checked});
        selectedWeaponId=requestedWeapon;requestedWeapon=null;}
      catch(e){
        if(e.message.startsWith('Enable Shadow of the Erdtree'))sharedProblem=
          'This shared weapon requires Shadow of the Erdtree. Enable the weapon reference option to select it.';
        else{sharedProblem='Shared weapon not available: '+e.message;requestedWeapon=null;}
      }
    }
    refreshWeaponChoices();render();
  }).catch(e=>{weaponLoadError=e.message;search.disabled=true;weaponSelect.disabled=true;render();});
}
function initClass(){
  const grid=$('#target-grid');const params=new URLSearchParams(location.search);const shared=parseSharedStats(params.get('stats'));
  statInputs(grid,shared||[40,20,25,30,30,10,10,10]);const toggle=$('#include-dlc');
  const render=()=>{try{
    const rankings=optimizeClasses(values(grid).map(Number),toggle.checked);
    $('#class-results').innerHTML=rankings.map((o,i)=>`<tr><td>${i+1}</td><td><strong>${esc(o.className)}</strong> ${o.dlc?'<span class="tag">Extra</span>':''}</td><td>${o.level}</td><td>${o.level===rankings[0].level?'Best fit':`+${o.level-rankings[0].level}`}</td></tr>`).join('');
    $('#best-class').textContent=`${rankings[0].className} · Lv ${rankings[0].level}`;
    $('#edit-build-link').href=queryURL('../build-planner/',{origin:rankings[0].className,stats:rankings[0].stats.map((v,i)=>Math.max(v,Number(values(grid)[i]))).join(',')});$('#edit-build-link').hidden=false;
    status('Class efficiency only—not a recommendation for starting gear or combat style.');
  }catch(e){clearValues(['#best-class']);$('#class-results').innerHTML='';$('#edit-build-link').hidden=true;status(e.message,true)}};
  grid.addEventListener('input',render);toggle.addEventListener('change',render);render();
}
function initEquip(){
 const q=new URLSearchParams(location.search);
 const safe=value=>typeof value==='string'&&/^(?:0|[1-9][0-9]{0,3})(?:\.[0-9]{1,3})?$/.test(value);
 if(safe(q.get('weight')))$('#gear-weight').value=q.get('weight');
 if(safe(q.get('max'))&&Number(q.get('max'))>0)$('#max-load').value=q.get('max');
 const update=()=>{try{
 const w=number('#gear-weight'),max=number('#max-load'),d=loadTier(w,max);
 $('#load-percent').textContent=d.percent.toFixed(1)+'%';$('#load-tier').textContent=d.tier;
 $('#medium-limit').textContent=d.mediumBelow.toFixed(2);$('#light-limit').textContent=d.lightBelow.toFixed(2);
 $('#load-bar').style.width=Math.min(100,d.percent)+'%';$('#load-bar').dataset.tier=d.tier.toLowerCase();
 const guidance=d.tier==='Light'?`Light roll active. You can add up to (but not including) ${(d.lightBelow-w).toFixed(2)} more weight before medium load.`:
 d.tier==='Medium'?`Medium roll active. To reach light load, reduce equipment weight below ${d.lightBelow.toFixed(2)}.`:
 d.tier==='Heavy'?`Heavy roll active. Reduce weight below ${d.mediumBelow.toFixed(2)} to return to medium load.`:
 `Overloaded. Reduce weight below ${d.heavyBelow.toFixed(2)} to be able to roll, or below ${d.mediumBelow.toFixed(2)} for medium load.`;
 $('#load-guidance').textContent=guidance;
 status('Uses your displayed in-game maximum load; no inferred equipment data.');
 }catch(e){clearValues(['#load-percent','#load-tier','#medium-limit','#light-limit','#load-guidance']);$('#load-bar').style.width='0';status(e.message,true)}};['#gear-weight','#max-load'].forEach(id=>$(id).addEventListener('input',update));update()}

if(page==='rune')initRune();else if(page==='build')initBuild();else if(page==='class')initClass();else if(page==='equip')initEquip();
