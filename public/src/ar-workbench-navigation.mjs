/**
 * Query-only handoff between the static community weapon catalog and the
 * opt-in, research-only regulation data workbench.
 * Never stores character stats, source JSON or calculated AR in localStorage.
 */
const fail=m=>{throw new RangeError(m);};
const validStats=values=>Array.isArray(values)&&values.length===5&&values.every(x=>Number.isInteger(x)&&x>=1&&x<=99);
function name(value){
 if(typeof value!=='string'||!value.trim()||value.length>100)fail('Invalid weapon handoff name.');
 return value.trim();
}
export function makeArWorkbenchUrl(weaponName,stats=null,upgrade=null){
 const q=new URLSearchParams();
 q.set('weapon',name(weaponName));
 if(stats!==null){
  if(!validStats(stats))fail('Character stats must contain exactly 5 values from 1 to 99.');
  q.set('player',stats.join(','));
 }
 if(upgrade!==null){
  if(!Number.isInteger(upgrade)||upgrade<0||upgrade>25)fail('Invalid requested upgrade level.');
  q.set('upgrade',String(upgrade));
 }
 return '../weapon-data-workbench/?'+q;
}
export function parseArWorkbenchHandoff(search){
 const params=new URLSearchParams(search);
 const raw=params.get('weapon');
 const weapon=raw&&raw.length<=100&&raw.trim()?raw.trim():'';
 const player=params.get('player');
 const stats=player&&/^(?:[1-9]|[1-9][0-9])(?:,(?:[1-9]|[1-9][0-9])){4}$/.test(player)?
  player.split(',').map(Number):null;
 const requested=params.get('upgrade');
 const upgrade=requested!==null&&/^(?:[0-9]|1[0-9]|2[0-5])$/.test(requested)?Number(requested):null;
 return {weapon,stats,upgrade};
}

/** Simple v1.17 AR page uses the same strict name/stat/upgrade handoff.
 * Does not transfer source JSON or claim game-client certification. */
export function makeQuickArCalculatorUrl(weaponName,stats=null,upgrade=null){
 return makeArWorkbenchUrl(weaponName,stats,upgrade)
  .replace('../weapon-data-workbench/?','../weapon-ar-calculator/?');
}
