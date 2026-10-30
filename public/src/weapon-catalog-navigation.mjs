/**
 * Stable, same-page, numeric-only direct links for selected community weapon
 * references. These URLs do not assert source accuracy or game AR.
 */
export function makeWeaponCatalogShareUrl(weaponId,stats,currentPageUrl){
 if(typeof weaponId!=='string'||!/^[a-z0-9-]{1,80}$/.test(weaponId))
  throw new RangeError('Invalid weapon reference ID.');
 if(typeof currentPageUrl!=='string'||currentPageUrl.length>2048)
  throw new RangeError('Expected the current catalog URL.');
 const url=new URL(currentPageUrl);
 if(!['https:','http:'].includes(url.protocol)||
    !url.pathname.endsWith('/weapon-database/'))
  throw new RangeError('Not a weapon catalog page URL.');
 url.search='';url.hash='';
 url.searchParams.set('weapon',weaponId);
 if(stats!==null&&stats!==undefined){
  if(!Array.isArray(stats)||stats.length!==5||
   !stats.every(x=>Number.isInteger(x)&&x>=1&&x<=99))
   throw new RangeError('Shareable attributes must be five integers from 1 to 99.');
  url.searchParams.set('player',stats.join(','));
 }
 return url.toString();
}
