/**
 * Build Planner -> local Smithing Stone basket.
 *
 * Links carry only up to 8 unique source weapon IDs, NEVER user-supplied
 * weapon names, upgrade tracks, reinforcement levels or game-client claims.
 */
const fail=msg=>{throw new RangeError(msg);};
const acceptableId=id=>typeof id==='string'&&/^[a-z0-9-]{1,80}$/.test(id);
export function validateBuildSmithingIds(ids){
 if(!Array.isArray(ids)||ids.length<1||ids.length>8||
  !ids.every(acceptableId)||new Set(ids).size!==ids.length)
  fail('Choose 1 to 8 distinct weapon references for smithing planning.');
 return [...ids];
}
export function parseBuildSmithingIds(search){
 if(typeof search!=='string'||search.length>850)
  fail('Invalid or oversized smithing shortlist URL.');
 const query=new URLSearchParams(search),raw=query.get('weapons');
 if(raw===null)return [];
 if(query.getAll('weapons').length!==1||raw.length>650||raw.length===0)
  fail('Invalid repeated or empty smithing shortlist.');
 return validateBuildSmithingIds(raw.split(','));
}
export function makeBuildSmithingUrl(ids,buildPageUrl){
 const safe=validateBuildSmithingIds(ids);
 if(typeof buildPageUrl!=='string'||buildPageUrl.length>2048)
  fail('Invalid Build Planner page URL.');
 const base=new URL(buildPageUrl);
 if(!['https:','http:'].includes(base.protocol)||
  !/\/build-planner\/(?:index\.html)?$/.test(base.pathname))
  fail('Expected an existing Build Planner URL.');
 const target=new URL('../weapon-upgrade-calculator/',base);
 target.searchParams.set('weapons',safe.join(','));
 return target.pathname+target.search;
}
export function resolveBuildSmithingWeapons(ids,weapons){
 const safe=validateBuildSmithingIds(ids);
 if(!Array.isArray(weapons))fail('Weapon reference catalog is unavailable.');
 const map=new Map(weapons.map(w=>[w.id,w]));
 return safe.map(id=>{
  const weapon=map.get(id);
  if(!weapon||typeof weapon.name!=='string'||!weapon.name.trim())
   fail('A linked weapon is not found in the current source catalog.');
  // Only explicitly sourced published Somber tables permit a non-certified
  // recommendation. Everything else must await a player's track selection.
  const ref=weapon.upgradeReference;
  const suggestedSomber=ref?.path==='somber'&&
   ref?.status==='community-published-base-attack'&&
   ref.sourceUrl===weapon.checkedWith&&
   typeof weapon.checkedWith==='string'&&weapon.checkedWith.startsWith('https://');
  return {id,name:weapon.name,expansion:weapon.expansion??'Base game',
   track:'',suggestedTrack:suggestedSomber?'somber':null,
   from:'',to:'',
   trackHint:suggestedSomber?'Unverified community Somber reference; confirm in game.':
    'Unknown track. Choose Regular or Somber from your game menu.'};
 });
}
