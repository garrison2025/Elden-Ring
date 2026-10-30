import {STATS,CLASSES,validateStats,compareRespec,parseSharedStats} from './core.mjs';
const $=selector=>document.querySelector(selector);
const origin=$('#origin'),before=$('#before-grid'),after=$('#after-grid');
const statAbbr=['VIG','MND','END','STR','DEX','INT','FAI','ARC'];
origin.innerHTML=CLASSES.map(c=>`<option value="${c.name}">${c.name}${c.dlc?' · extra content':''}</option>`).join('');
origin.value='Samurai';
let selected=CLASSES.find(c=>c.name==='Samurai');
const display=(element,stats)=>{element.innerHTML=STATS.map((stat,i)=>`<label class="stat-field"><span>${stat}</span><input type="number" min="1" max="99" step="1" inputmode="numeric" data-stat="${i}" value="${stats[i]}"><small>${statAbbr[i]}</small></label>`).join('')};
const read=element=>[...element.querySelectorAll('[data-stat]')].map(input=>input.value);
const set=id=>$(id);
const info=(message,error=false)=>{set('#feedback').textContent=message;set('#feedback').className=error?'feedback bad':'feedback'};
const clear=()=>{for(const id of ['current-level','proposed-level','remaining-points','respec-state'])set('#'+id).textContent='—';set('#respec-deltas').replaceChildren();set('#respec-build-link').hidden=true};
const query=(base,params)=>{const url=new URL(base,location.href);for(const [key,value] of Object.entries(params))url.searchParams.set(key,String(value));return url.toString()};
display(before,selected.stats);display(after,selected.stats);
function render(){
 try{
   const a=validateStats(read(before),selected),b=validateStats(read(after),selected);
   const result=compareRespec(selected,a,b);
   set('#current-level').textContent=result.currentLevel;
   set('#proposed-level').textContent=result.plannedLevel;
   set('#remaining-points').textContent=result.remainingPoints===0?'0':result.remainingPoints>0?`+${result.remainingPoints} unspent`:`${Math.abs(result.remainingPoints)} over`;
   const state=set('#respec-state');
   state.className='respec-state'+(result.valid?'':result.withinBudget?' unused':' over');
   state.textContent=result.valid?'Complete: same level and exact point budget':result.withinBudget?`Incomplete: allocate ${result.remainingPoints} remaining points`:`Over budget: remove ${Math.abs(result.remainingPoints)} attribute points`;
   set('#respec-deltas').innerHTML=STATS.map((stat,i)=>{
     const d=result.changes[i];
     return `<tr><td>${stat}</td><td>${a[i]}</td><td>${b[i]}</td><td class="${d>0?'up':d<0?'down':''}">${d>0?'+':''}${d}</td></tr>`;
   }).join('');
   const go=set('#respec-build-link');
   if(result.valid){go.href=query('../build-planner/',{origin:selected.name,stats:b.join(',')});go.hidden=false}
   else go.hidden=true;
   info('Your comparison runs locally. Respec does not change class or character level.');
 }catch(e){clear();info(e.message,true)}
}
origin.addEventListener('change',()=>{selected=CLASSES.find(c=>c.name===origin.value)||CLASSES[0];display(before,selected.stats);display(after,selected.stats);render()});
before.addEventListener('input',render);after.addEventListener('input',render);
set('#copy-current').addEventListener('click',()=>{display(after,read(before));render()});
set('#reset-current').addEventListener('click',()=>{display(before,selected.stats);render()});
set('#reset-proposed').addEventListener('click',()=>{display(after,selected.stats);render()});
set('#share-respec').addEventListener('click',async()=>{
 try{
   const a=validateStats(read(before),selected),b=validateStats(read(after),selected);
   const url=query(location.pathname,{origin:selected.name,stats:a.join(','),planned:b.join(',')});
   try{await navigator.clipboard.writeText(url);info('Comparison URL copied. It includes only the selected class and stat values.')}
   catch{history.replaceState({},'',url);info('Comparison URL placed in address bar. Copy it to share.')}
 }catch(e){info(e.message,true)}
});
const params=new URLSearchParams(location.search),sharedClass=CLASSES.find(c=>c.name===params.get('origin'));
if(sharedClass){
 const a=parseSharedStats(params.get('stats')),b=parseSharedStats(params.get('planned'));
 if(a){try{validateStats(a,sharedClass);selected=sharedClass;origin.value=selected.name;display(before,a);
    if(b){validateStats(b,selected);display(after,b)}else display(after,a)
 }catch{info('Invalid shared stats were ignored.',true)}}
}
render();
