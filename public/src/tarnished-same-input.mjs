/**
 * User-initiated same-input comparison against Tarnished.dev's public v1.17
 * Build Calculator. Links pass only explicit input controls; there is no
 * scraping, proxy, embedded third-party code, auto-load, or claim that the
 * external result has been independently observed.
 */
export const TARNISHED_V117_AFFINITIES=Object.freeze([
 'Standard','Heavy','Keen','Quality','Fire','Flame Art','Lightning',
 'Sacred','Magic','Cold','Poison','Blood','Occult'
]);
const invalid=message=>{throw new RangeError(message);};
const validStats=stats=>stats&&typeof stats==='object'&&!Array.isArray(stats)&&
 ['str','dex','int','fai','arc'].every(key=>Number.isInteger(stats[key])&&stats[key]>=1&&stats[key]<=99);
export function makeTarnishedSameInputUrl({
 weaponName,affinityId,upgrade,stats,twoHanded=false,reinforcement='smithing'
}={}){
 if(typeof weaponName!=='string'||!weaponName.trim()||weaponName.length>120||
    /[\r\n]/.test(weaponName))invalid('An exact source weapon family is required.');
 const affinity=affinityId===-1?'None':TARNISHED_V117_AFFINITIES[affinityId];
 if(!affinity)invalid('This source affinity has no confirmed Tarnished.dev URL mapping.');
 if(!validStats(stats))invalid('All five attributes must be integers from 1 to 99.');
 if(typeof twoHanded!=='boolean')invalid('Grip must be one- or two-handed.');
 if(!['somber','smithing'].includes(reinforcement))invalid('Invalid reinforcement kind.');
 const max=reinforcement==='somber'?10:25;
 if(!Number.isInteger(upgrade)||upgrade<0||upgrade>max)
  invalid('Upgrade level is outside the chosen reinforcement series.');
 const query=new URLSearchParams();
 for(const key of ['str','dex','int','fai','arc'])query.set(key,String(stats[key]));
 query.set('rh1',weaponName.trim());
 query.set('aRh1',affinity);
 query.set('smith',String(reinforcement==='smithing'?upgrade:0));
 query.set('somber',String(reinforcement==='somber'?upgrade:0));
 query.set('twoHanded',String(twoHanded));
 return 'https://www.tarnished.dev/build-planner?'+query.toString();
}
/** Compare a number entered by the user after viewing the external site.
 * Never treat this input as independently authenticated benchmark evidence.
 */
export function compareUserEnteredReferenceAr(localTotal,rawReferenceTotal){
 if(!Number.isInteger(localTotal)||localTotal<0||localTotal>20000)
  invalid('Calculate a valid local AR first.');
 if(typeof rawReferenceTotal!=='string'||!/^\d{1,5}$/.test(rawReferenceTotal.trim()))
  invalid('Enter the integer AR displayed on Tarnished.dev.');
 const externalTotal=Number(rawReferenceTotal.trim());
 if(externalTotal>20000)invalid('Reference AR exceeds the supported comparison range.');
 return {localTotal,externalTotal,difference:localTotal-externalTotal,
  matched:localTotal===externalTotal,authenticated:false,benchmarkCertified:false};
}
