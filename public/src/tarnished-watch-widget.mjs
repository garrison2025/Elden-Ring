// Externally observed notes are NEVER our product release notes.
// This reads a same-origin metadata JSON maintained by a bounded GitHub bot.
const status = document.getElementById('external-watch-status');
const list = document.getElementById('external-watch-list');
const source = document.getElementById('external-watch-source');
const note = document.getElementById('external-watch-disclaimer');
async function showWatch(){
  try{
    const response = await fetch('../data/tarnished-dev-watch.json',{cache:'no-store'});
    if(!response.ok)throw new Error('External watch feed unavailable');
    const data = await response.json();
    if(data.schema!==1||data.source!=='https://www.tarnished.dev/'||
       data.sourceKind!=='external-competitor-not-our-release'||
       data.ourFeaturesUpdated!==false||data.gameDataCertified!==false||
       !/^v[0-9]+(?:\.[0-9]+){1,3}$/.test(data.referenceVersion)||
       !Array.isArray(data.recentUpdates))throw new Error('Invalid external watch data');
    status.textContent='Tarnished.dev public reference: '+data.referenceVersion+
      ' · '+(data.reviewStatus==='baseline-no-new-delta'?'Baseline recorded':'Change detected; independent review pending');
    source.href=data.source;
    list.replaceChildren();
    for(const entry of data.recentUpdates.slice(0,3)){
      if(typeof entry.date!=='string'||typeof entry.excerpt!=='string')continue;
      const li=document.createElement('li');
      const time=document.createElement('time');time.textContent=entry.date;time.dateTime=entry.date;
      const detail=document.createElement('span');detail.textContent=entry.excerpt.slice(0,110);
      li.append(time,detail);list.append(li);
    }
    note.textContent='External update notices only. Not imported game data, not our shipped features, and not Regulation 1.17.3 game-client certification.';
  }catch(error){
    status.textContent='External reference monitoring data is temporarily unavailable.';
    note.textContent='Our verified Build Lab release history above is unaffected.';
  }
}
showWatch();
