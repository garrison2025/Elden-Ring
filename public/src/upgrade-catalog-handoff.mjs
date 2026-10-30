/**
 * Weapon catalog -> optional smithing-material planner handoff.
 * Never derives the upgrade track from a weapon class or name. Only an
 * explicitly sourced community upgrade table may offer a Somber suggestion.
 * Reference +level is NEVER a player's current equipped upgrade level.
 */
const fail=message=>{throw new RangeError(message);};
const idOk=value=>typeof value==='string'&&/^[a-z0-9-]{1,80}$/.test(value);
const nameOk=value=>typeof value==='string'&&value.trim().length>0&&
 value.length<=120&&!/[\u0000-\u001f\u007f]/.test(value);

export function makeCatalogSmithingHandoff(weapon,currentUrl){
 if(!weapon||!idOk(weapon.id)||!nameOk(weapon.name))fail('Invalid source weapon reference.');
 if(typeof currentUrl!=='string'||currentUrl.length>2048)fail('Invalid catalog page URL.');
 const origin=new URL(currentUrl);
 if(!['https:','http:'].includes(origin.protocol)||
  !/\/weapon-database\/(?:index\.html)?$/.test(origin.pathname))
  fail('Expected weapon catalog page URL.');
 const target=new URL('../weapon-upgrade-calculator/',origin);
 target.searchParams.set('weapon',weapon.id);
 target.searchParams.set('name',weapon.name);
 // Only six currently sourced DLC Somber records carry explicit tables.
 // Never infer a regular +25 or Somber +10 track from category/unique name.
 if(weapon.upgradeReference?.path==='somber'&&
  weapon.upgradeReference?.status==='community-published-base-attack'&&
  weapon.upgradeReference?.sourceUrl===weapon.checkedWith&&
  typeof weapon.checkedWith==='string'&&weapon.checkedWith.startsWith('https://')){
  target.searchParams.set('track','somber');
 }
 return target.pathname+target.search;
}

export function parseCatalogSmithingHandoff(search){
 if(typeof search!=='string'||search.length>800)
  return {weaponId:null,weaponName:null,suggestedTrack:null,reason:'invalid-handoff'};
 const p=new URLSearchParams(search);
 const id=p.get('weapon'),name=p.get('name');
 if(!idOk(id)||!nameOk(name))
  return {weaponId:null,weaponName:null,suggestedTrack:null,reason:'invalid-or-missing-weapon'};
 const requested=p.get('track');
 return {weaponId:id,weaponName:name.trim(),
  suggestedTrack:requested==='somber'?'somber':null,
  reason:requested==='somber'?
   'Unverified, user-editable track hint from a community reference URL. Confirm actual equipment smithing track in-game.':
   'No sufficiently specific upgrade track was supplied. Player must choose regular or somber.'};
}
