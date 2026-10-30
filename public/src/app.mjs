import {STATS,CLASSES,classForName,validateStats,buildLevel,optimizeClasses,runeCostForLevel,runeRange,targetFromRunes,loadTier,commas,farmingRunsNeeded,parseSharedStats} from './core.mjs';
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
function classOptions(select){select.innerHTML=CLASSES.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}${c.dlc?' · extra content':''}</option>`).join('')}
function statInputs(root,values){root.innerHTML=STATS.map((name,i)=>`<label class="stat-field"><span>${name}</span><input data-stat="${i}" inputmode="numeric" type="number" min="1" max="99" step="1" value="${values[i]}"><small>${['VIG','MND','END','STR','DEX','INT','FAI','ARC'][i]}</small></label>`).join('')}
function values(root){return [...root.querySelectorAll('[data-stat]')].map(x=>x.value)}
function queryURL(relative,params){const u=new URL(relative,location.href);for(const [key,value] of Object.entries(params))u.searchParams.set(key,String(value));return u.toString()}
function initBuild(){
  const sel=$('#origin');classOptions(sel);const grid=$('#stat-grid');let current=classForName('Samurai');sel.value=current.name;statInputs(grid,current.stats);
  const read=()=>validateStats(values(grid),current);
  function render(){try{
    const v=read(),level=buildLevel(current,v);
    $('#build-level').textContent=level;$('#spent-points').textContent=level-current.level;
    $('#build-runecost').textContent=fmt(runeRange(current.level,level));
    $('#build-summary').textContent=`${current.name} · Lv ${level} · ${v.join(' / ')}`;
    $('#class-compare-link').href=queryURL('../class-optimizer/',{stats:v.join(',')});
    $('#rune-plan-link').href=queryURL('../level-rune-calculator/',{from:current.level,to:level});
    $('#respec-link').href=queryURL('../respec-planner/',{origin:current.name,stats:v.join(',')});
    $('#weapon-req-link').href=queryURL('../weapon-requirements/',{stats:v.join(',')});
    $('#class-compare-link').hidden=false;$('#rune-plan-link').hidden=false;$('#respec-link').hidden=false;$('#weapon-req-link').hidden=false;
    status('Plan valid. Send this build to the class optimizer or rune planner below.');
  }catch(e){clearValues(['#build-level','#spent-points','#build-runecost','#build-summary']);$('#class-compare-link').hidden=true;$('#rune-plan-link').hidden=true;$('#respec-link').hidden=true;$('#weapon-req-link').hidden=true;status(e.message,true)}}
  sel.addEventListener('change',()=>{current=classForName(sel.value);statInputs(grid,current.stats);render()});grid.addEventListener('input',render);
  $('#reset-build').addEventListener('click',()=>{statInputs(grid,current.stats);render()});
  const savedKey='buildlab:local-build:v1';
  $('#save-build').addEventListener('click',()=>{
    try{
      const stats=read();
      localStorage.setItem(savedKey,JSON.stringify({version:1,origin:current.name,stats}));
      status('Build saved on this device only. It is never uploaded.');
    }catch(e){status('Unable to save locally: '+e.message,true)}
  });
  $('#load-build').addEventListener('click',()=>{
    try{
      const saved=localStorage.getItem(savedKey);
      if(!saved){status('No saved build on this browser.');return}
      const parsed=JSON.parse(saved);
      const origin=CLASSES.find(c=>c.name===parsed.origin);
      if(parsed.version!==1||!origin)throw Error('Saved build has an unsupported format.');
      const stats=validateStats(parsed.stats,origin);
      current=origin;sel.value=origin.name;statInputs(grid,stats);render();
      status('Saved build restored from this browser.');
    }catch(e){status('Unable to load saved build: '+e.message,true)}
  });
  $('#delete-build').addEventListener('click',()=>{
    try{localStorage.removeItem(savedKey);status('Saved build deleted from this browser.')}
    catch(e){status('Unable to clear local storage: '+e.message,true)}
  });
  $('#share-build').addEventListener('click',async()=>{try{
    const v=read(),u=queryURL(location.pathname,{origin:current.name,stats:v.join(',')});
    try{await navigator.clipboard.writeText(u);status('Share URL copied. It contains your class and eight attribute values.');}
    catch{history.replaceState({},'',u);status('Share URL placed in your address bar. Copy it to share.');}
  }catch(e){status(e.message,true)}});
  const params=new URLSearchParams(location.search),cls=CLASSES.find(c=>c.name===params.get('origin')),v=parseSharedStats(params.get('stats'));
  if(cls&&v){try{validateStats(v,cls);current=cls;sel.value=cls.name;statInputs(grid,v)}catch{status('Invalid shared build; original stats restored.',true)}}
  render();
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
