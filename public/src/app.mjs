import {STATS,CLASSES,classForName,validateStats,buildLevel,optimizeClasses,runeCostForLevel,runeRange,targetFromRunes,loadTier,commas,farmingRunsNeeded,parseSharedStats} from './core.mjs';
import {validateCommunityCatalog} from './community-weapons.mjs';
import {parseBuildWeaponId,parseContentFlag,buildWeaponOptions,inspectBuildWeapon} from './build-weapon-reference.mjs';
import {makeBuildSmithingUrl} from './build-smithing-handoff.mjs';
import {makeBuildToReferenceArUrl} from './build-to-reference-ar.mjs';
import {makeEquipCandidatesUrl} from './equipment-loadout.mjs';
import {planShortlistWielding} from './build-shortlist-feasibility.mjs';
import {compareBuildSnapshots,normalizeBuildComparisonSnapshot} from './build-compare.mjs';
import {makeBuildAbShareUrl,validateSharedBuildAb} from './build-compare-share.mjs';
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
  const weaponDetails=$('#build-weapon-detail-link'),weaponAr=$('#build-weapon-ar-link');
  let current=classForName('Samurai'),selectedWeaponId=null,weaponCatalog=null,weaponLoadError=null;
  let smithingIds=[];
  let pinnedBuild=null;
  const query=new URLSearchParams(location.search);
  let sharedProblem=null;
  try{extra.checked=parseContentFlag(query.get('tarnished'));sote.checked=parseContentFlag(query.get('sote'));}
  catch(e){extra.checked=false;sote.checked=false;sharedProblem='Invalid extra-content settings were ignored.';}
  classOptions(sel,extra.checked);sel.value=current.name;statInputs(grid,current.stats);
  const read=()=>validateStats(values(grid),current);
  const shortlistList=$('#build-smithing-list');
  function renderSmithingShortlist(message=''){
    const canAdd=Boolean(weaponCatalog&&selectedWeaponId&&
      !smithingIds.includes(selectedWeaponId)&&smithingIds.length<8);
    $('#build-smithing-add').disabled=!canAdd;
    $('#build-smithing-clear').disabled=smithingIds.length===0;
    shortlistList.replaceChildren();
    for(const id of smithingIds){
      const weapon=weaponCatalog?.weapons.find(w=>w.id===id);
      if(!weapon)continue;
      const li=document.createElement('li'),name=document.createElement('span');
      name.textContent=weapon.name+' · '+weapon.category+
        (weapon.expansion==='Shadow of the Erdtree'?' · SOTE':'');
      const remove=document.createElement('button');
      remove.type='button';remove.className='btn alt';
      remove.textContent='Remove';
      remove.setAttribute('aria-label','Remove '+weapon.name+' from smithing shortlist');
      remove.addEventListener('click',()=>{
        smithingIds=smithingIds.filter(value=>value!==id);
        renderSmithingShortlist();
      });
      li.append(name,remove);shortlistList.append(li);
    }
    const link=$('#build-smithing-open');
    const equipLink=$('#build-equipment-open');
    link.hidden=smithingIds.length===0;
    equipLink.hidden=smithingIds.length===0;
    if(smithingIds.length){
      link.href=makeBuildSmithingUrl(smithingIds,location.href);
      equipLink.href=makeEquipCandidatesUrl(smithingIds,location.href);
    }
    $('#build-smithing-feedback').textContent=message||
      (smithingIds.length?smithingIds.length+' of 8 weapons selected. Confirm every smithing track and +level after opening the planner.':
        'No weapons added. Choose a weapon above, then add it.');
    renderWieldPlan();
  }
  const wieldPlan=()=>planShortlistWielding(smithingIds,weaponCatalog?.weapons,read(),current,{
    allowSote:sote.checked
  });
  function renderWieldPlan(){
    const root=$('#build-wield-plan'),rows=$('#build-wield-rows');
    root.hidden=smithingIds.length===0;rows.replaceChildren();
    const oneButton=$('#build-wield-apply-one'),twoButton=$('#build-wield-apply-two');
    oneButton.disabled=true;twoButton.disabled=true;
    if(!smithingIds.length)return;
    try{
      const plan=wieldPlan();
      const status=grip=>{
        if(grip===null)return 'Unknown or DISPUTED requirements';
        if(grip.canWield)return 'Meets requirements';
        return '+'+grip.totalMissing+' points · '+
          grip.missing.map(x=>x.stat+' +'+x.points).join(', ');
      };
      for(const item of plan.rows){
        const row=document.createElement('tr');
        const heading=document.createElement('th');heading.scope='row';
        heading.textContent=item.name+' · '+item.category+
          (item.requirementsDisputed?' · SOURCE CONFLICT':'');
        row.append(heading);
        for(const value of [
          status(item.oneHand),
          status(item.twoHand)+(item.requirementsKnown&&!item.standardTwoHandBonus?
            ' (no 2H STR bonus assumed)':''),
          item.weight===null?'Unknown':String(item.weight)
        ]){
          const cell=document.createElement('td');cell.textContent=value;row.append(cell);
        }
        rows.append(row);
      }
      const summary=target=>{
        const upgrades=target.shortfalls.map(x=>x.stat+' +'+x.points).join(', ');
        return target.additionalLevels+' added level(s) · '+
          fmt(target.additionalRunes)+' incremental runes · '+
          (upgrades||'Already meets the known requirements.');
      };
      $('#build-wield-one-summary').textContent=summary(plan.oneHand);
      $('#build-wield-two-summary').textContent=summary(plan.twoHand);
      oneButton.disabled=!plan.allSafeToApply;
      twoButton.disabled=!plan.allSafeToApply;
      $('#build-wield-note').textContent=plan.allSafeToApply?
        'All '+plan.weaponCount+' candidates have documented, non-conflicting requirement values. '+
        'The stat targets are cumulative requirements for individually wielding each candidate, NOT simultaneous equipment load.':
        'Some weapon requirements are missing or source-disputed. Showing supported details, but automatic stat targets are disabled to avoid false precision.';
    }catch(error){
      $('#build-wield-one-summary').textContent='Unavailable';
      $('#build-wield-two-summary').textContent='Unavailable';
      $('#build-wield-note').textContent='Correct the current Build or shortlist: '+error.message;
    }
  }
  function applyWieldStats(grip){
    try{
      const plan=wieldPlan();
      if(!plan.allSafeToApply)throw new RangeError('Unknown or disputed requirements prevent automatic stat allocation.');
      const target=plan[grip];
      for(const [index,field] of [...grid.querySelectorAll('[data-stat]')].entries())
        field.value=String(target.targetStats[index]);
      render();
      $('#build-wield-note').textContent='Applied the minimum known '+(grip==='oneHand'?'one-hand':'eligible two-hand')+
        ' attributes for separately wielding all shortlisted candidates. Confirm every weapon in game.';
    }catch(error){$('#build-wield-note').textContent='Could not apply stat target: '+error.message;}
  }
  $('#build-wield-apply-one').addEventListener('click',()=>applyWieldStats('oneHand'));
  $('#build-wield-apply-two').addEventListener('click',()=>applyWieldStats('twoHand'));
  $('#build-smithing-add').addEventListener('click',()=>{
    if(!weaponCatalog||!selectedWeaponId)return;
    if(smithingIds.includes(selectedWeaponId)||smithingIds.length>=8)return;
    try{
      inspectBuildWeapon(weaponCatalog.weapons,selectedWeaponId,read(),{allowSote:sote.checked});
      smithingIds=[...smithingIds,selectedWeaponId];
      renderSmithingShortlist();
    }catch(error){renderSmithingShortlist('Cannot add weapon: '+error.message);}
  });
  $('#build-smithing-clear').addEventListener('click',()=>{
    smithingIds=[];renderSmithingShortlist();
  });
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
    weaponDetails.hidden=true;weaponAr.hidden=true;
    if(weaponLoadError){weaponSummary.textContent='Weapon references unavailable: '+weaponLoadError;return;}
    if(!weaponCatalog){weaponSummary.textContent='Loading local weapon references…';return;}
    if(!selectedWeaponId){
      if(requestedWeapon)weaponSummary.textContent=
        'A linked Shadow of the Erdtree weapon is waiting. Tick the SOTE reference checkbox to activate it.';
      else if(!search.value.trim())weaponSummary.textContent='No weapon selected. Search the catalogue to add one.';
      return;
    }
    try{
      const model=inspectBuildWeapon(weaponCatalog.weapons,selectedWeaponId,stats,{allowSote:sote.checked});
      const one=model.requirementsDisputed?'one-hand requirements DISPUTED':
        model.oneHanded===null?'requirements unknown':
        model.oneHanded?'one-hand requirements met':'one-hand requirements NOT met';
      const two=model.requirementsDisputed?'two-hand requirements DISPUTED':
        model.twoHanded===null?'two-hand requirements unknown':
        model.twoHanded?'two-hand requirements met':'two-hand requirements NOT met';
      weaponSummary.textContent=model.name+' · '+model.category+' · '+one+' · '+two+' · weapon weight '+
        (model.weight===null?'unknown':model.weight)+' (NOT total load). '+model.note;
      weaponDetails.href=queryURL('../weapon-database/',{weapon:selectedWeaponId,stats:stats.join(',')});
      weaponDetails.hidden=false;
      try{
       weaponAr.href=makeBuildToReferenceArUrl(model,stats);
       weaponAr.hidden=false;
      }catch{
       // Keep a working requirement preview even if this name cannot safely
       // round-trip into the independent v1.17 source search.
       weaponAr.hidden=true;
      }
    }catch(e){weaponSummary.textContent='Weapon reference unavailable: '+e.message;}
  }
  const getComparisonSnapshot=stats=>normalizeBuildComparisonSnapshot({
    origin:current.name,stats,weaponId:selectedWeaponId,
    ownsTarnishedPack:extra.checked,ownsSote:sote.checked
  });
  function renderBuildComparison(stats){
    const visible=$('#build-ab-results'),clear=$('#build-ab-clear');
    clear.disabled=pinnedBuild===null;
    $('#build-ab-share').disabled=true;
    $('#build-ab-share-field').hidden=true;
    $('#build-ab-share-url').value='';
    if(!pinnedBuild){
      visible.hidden=true;
      $('#build-ab-status').textContent='Pin a Build as A to compare it against future edits.';
      return;
    }
    try{
      const model=compareBuildSnapshots(pinnedBuild,getComparisonSnapshot(stats),{
        weapons:weaponCatalog?.weapons??null
      });
      visible.hidden=false;
      $('#build-ab-share').disabled=false;
      const showSigned=n=>(n>0?'+':'')+fmt(n);
      const weaponDescription=entry=>{
        if(!entry)return 'No weapon selected.';
        const one=entry.requirementsDisputed?'source requirements DISPUTED':
          entry.oneHanded===null?'requirements unavailable':
          entry.oneHanded?'1H requirements met':
          '1H '+entry.missingOneHanded+' attribute point(s) short';
        return entry.name+' · '+one+' · single-weapon weight '+
          (entry.weight===null?'unknown':entry.weight)+
          ' · source: '+entry.sourceTier+
          (entry.attackDisputed?' · +0 attack DISPUTED':'')+' · not AR';
      };
      const summarize=entry=>
       'Level '+entry.level+' · '+fmt(entry.levelUpPoints)+' points above origin · '+
       fmt(entry.runeBudget)+' runes from own starting class';
      $('#build-ab-origin-a').textContent=model.baseline.origin;
      $('#build-ab-origin-b').textContent=model.current.origin;
      $('#build-ab-summary-a').textContent=summarize(model.baseline);
      $('#build-ab-summary-b').textContent=summarize(model.current);
      $('#build-ab-weapon-a').textContent='A: '+weaponDescription(model.baseline.weapon);
      $('#build-ab-weapon-b').textContent='B: '+weaponDescription(model.current.weapon);
      const rows=$('#build-ab-rows');rows.replaceChildren();
      const entries=[
        {label:'Character level',baseline:model.baseline.level,current:model.current.level,delta:model.levelDelta},
        {label:'Points above starting class',baseline:model.baseline.levelUpPoints,
          current:model.current.levelUpPoints,delta:model.allocatedDelta},
        {label:'Rune cost from own origin',baseline:model.baseline.runeBudget,
          current:model.current.runeBudget,delta:model.runeBudgetDelta},
        ...model.statRows
      ];
      for(const entry of entries){
        const row=document.createElement('tr');
        const th=document.createElement('th');th.scope='row';th.textContent=entry.label;
        row.append(th);
        for(const value of [fmt(entry.baseline),fmt(entry.current),showSigned(entry.delta)]){
          const td=document.createElement('td');td.textContent=value;row.append(td);
        }
        if(entry.delta!==0)row.classList.add('build-ab-changed');
        rows.append(row);
      }
      $('#build-ab-status').textContent=model.changedStats+' of 8 attributes differ. '+
       (model.sameOrigin?'Same starting class.':'Different starting classes: rune budgets are calculated separately.')+
       ' A is temporary and remains pinned until you replace or clear it.';
    }catch(error){
      visible.hidden=true;
      $('#build-ab-status').textContent='Comparison unavailable: '+error.message;
    }
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
    renderSmithingShortlist();
    renderBuildComparison(v);
    status(sharedProblem||'Plan valid. Attribute level is calculated locally; selected weapons are community references only.');
  }catch(e){
    clearValues(['#build-level','#spent-points','#build-runecost','#build-summary']);
    for(const id of ['#class-compare-link','#rune-plan-link','#respec-link','#weapon-req-link','#weapon-catalog-link'])$(id).hidden=true;
    weaponDetails.hidden=true;weaponAr.hidden=true;weaponSummary.textContent='Correct the eight character attributes before checking weapon requirements.';
    renderSmithingShortlist();
    if(pinnedBuild){
      $('#build-ab-results').hidden=true;
      $('#build-ab-status').textContent='Correct the current Build inputs to compare with pinned A: '+e.message;
    }
    status(e.message,true);
  }}
  $('#build-ab-pin').addEventListener('click',()=>{
    try{
      const next=getComparisonSnapshot(read());
      if(next.weaponId!==null){
        if(!weaponCatalog)throw new RangeError('Wait for the weapon reference catalog to load.');
        inspectBuildWeapon(weaponCatalog.weapons,next.weaponId,next.stats,{
          allowSote:next.ownsSote
        });
      }
      pinnedBuild=next;
      render();
      $('#build-ab-status').textContent='Build A pinned. Edit class, attributes or weapon above to compare B. '+
       'The baseline is temporary, not shared or saved.';
    }catch(error){
      $('#build-ab-status').textContent='Cannot pin Build A: '+error.message;
    }
  });
  $('#build-ab-clear').addEventListener('click',()=>{
    pinnedBuild=null;renderBuildComparison(null);
  });
  $('#build-ab-share').addEventListener('click',async()=>{
    try{
      if(!pinnedBuild)throw new RangeError('Pin Build A before sharing a comparison.');
      const currentB=getComparisonSnapshot(read());
      // Require both optional source weapons to exist in our actual local catalog.
      compareBuildSnapshots(pinnedBuild,currentB,{weapons:weaponCatalog?.weapons??null});
      const url=makeBuildAbShareUrl(pinnedBuild,currentB,location.href);
      const input=$('#build-ab-share-url');
      input.value=url;
      $('#build-ab-share-field').hidden=false;
      try{
        if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url);
        $('#build-ab-status').textContent='Two-Build comparison link copied. Both states will be revalidated when opened.';
      }catch{
        input.focus();input.select();
        $('#build-ab-status').textContent='Clipboard unavailable. Copy the selected two-Build URL manually.';
      }
    }catch(error){
      $('#build-ab-share-field').hidden=true;
      $('#build-ab-status').textContent='Cannot share comparison: '+error.message;
    }
  });
  sel.addEventListener('change',()=>{current=classForName(sel.value);statInputs(grid,current.stats);render()});
  extra.addEventListener('change',()=>{
    if(!extra.checked&&current.dlc){current=classForName('Samurai');statInputs(grid,current.stats);}
    classOptions(sel,extra.checked);sel.value=current.name;render();
  });
  sote.addEventListener('change',()=>{
    if(!sote.checked&&weaponCatalog){
      smithingIds=smithingIds.filter(id=>weaponCatalog.weapons.find(w=>w.id===id)?.expansion!=='Shadow of the Erdtree');
      renderSmithingShortlist('Shadow of the Erdtree weapon shortlist entries removed because DLC references are disabled.');
    }
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
  weaponSelect.addEventListener('change',()=>{selectedWeaponId=weaponSelect.value||null;requestedWeapon=null;sharedProblem=null;render()});
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
    if(!nextSote&&weaponCatalog)smithingIds=smithingIds.filter(id=>
      weaponCatalog.weapons.find(w=>w.id===id)?.expansion!=='Shadow of the Erdtree');
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
    if(query.has('compare')){
      try{
        const sharedAb=validateSharedBuildAb(location.search,catalog.weapons);
        if(sharedAb){
          const B=sharedAb.current;
          const nextClass=CLASSES.find(c=>c.name===B.origin);
          extra.checked=B.ownsTarnishedPack;sote.checked=B.ownsSote;
          current=nextClass;selectedWeaponId=B.weaponId;requestedWeapon=null;
          classOptions(sel,extra.checked);sel.value=current.name;
          statInputs(grid,B.stats);search.value='';
          pinnedBuild=sharedAb.baseline;sharedProblem=null;
        }
      }catch(error){
        pinnedBuild=null;
        sharedProblem='Invalid two-Build comparison link: '+error.message+
          '. No A/B comparison was loaded.';
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
 const update=()=>{
  // A blank, not-yet-entered value is UNKNOWN, not the 0 of an empty loadout.
  if($('#gear-weight').value.trim()===''||$('#max-load').value.trim()===''){
   clearValues(['#load-percent','#load-tier','#medium-limit','#light-limit','#load-guidance']);
   $('#load-bar').style.width='0';
   status('Enter your current equipped weight and maximum load from the game to calculate.');
   return;
  }
  try{
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
