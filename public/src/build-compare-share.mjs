import {CLASSES,parseSharedStats} from './core.mjs';
import {parseBuildWeaponId,parseContentFlag} from './build-weapon-reference.mjs';
import {normalizeBuildComparisonSnapshot,compareBuildSnapshots} from './build-compare.mjs';

/**
 * Compact, schema-versioned A/B sharing. B keeps the existing Build URL
 * convention. A uses one bounded encoded 'compare' value. No inventory,
 * weapon AR, extra build state, user account or client storage is shared.
 */
const fail=message=>{throw new RangeError(message);};
const clean=s=>typeof s==='string'&&s.length<=2048;
const originIndex=name=>CLASSES.findIndex(c=>c.name===name);
export function makeBuildAbShareUrl(baseline,current,currentPageUrl){
 const A=normalizeBuildComparisonSnapshot(baseline);
 const B=normalizeBuildComparisonSnapshot(current);
 if(!clean(currentPageUrl))fail('Expected the current Build Planner URL.');
 const url=new URL(currentPageUrl);
 if(!['http:','https:'].includes(url.protocol)||
  !/\/build-planner\/(?:index\.html)?$/.test(url.pathname))
  fail('Comparison links must originate from the Build Planner.');
 // Do not retain unknown query params, fragment or stale build state.
 if(url.pathname.endsWith('/index.html'))url.pathname=url.pathname.slice(0,-10);
 url.search='';url.hash='';
 const origin=originIndex(A.origin);
 if(origin<0)fail('Unknown baseline starting class.');
 const a=['v1',String(origin),...A.stats.map(String),
  A.weaponId??'-',(A.ownsTarnishedPack?'1':'0')+(A.ownsSote?'1':'0')].join('.');
 url.searchParams.set('origin',B.origin);
 url.searchParams.set('stats',B.stats.join(','));
 if(B.weaponId)url.searchParams.set('weapon',B.weaponId);
 if(B.ownsTarnishedPack)url.searchParams.set('tarnished','1');
 if(B.ownsSote)url.searchParams.set('sote','1');
 url.searchParams.set('compare',a);
 if(url.toString().length>2048)fail('Combined Build URL is too long.');
 return url.toString();
}
export function parseSharedBuildAb(search){
 if(typeof search!=='string'||search.length>1400)
  fail('Invalid or oversized comparison link.');
 const p=new URLSearchParams(search);
 if(!p.has('compare'))return null; // Existing one-Build URLs unchanged.
 for(const key of ['compare','origin','stats','weapon','tarnished','sote']){
  if(p.getAll(key).length>1)fail('Duplicate comparison URL field: '+key);
 }
 const chunks=p.get('compare').split('.');
 if(chunks.length!==12||chunks[0]!=='v1'||!/^(?:0|[1-9][0-9]?)$/.test(chunks[1]))
  fail('Unsupported or malformed A/B link version.');
 const index=Number(chunks[1]),cls=CLASSES[index];
 if(!cls||chunks.slice(2,10).some(v=>!/^(?:[1-9]|[1-9][0-9])$/.test(v)))
  fail('Invalid baseline attributes or class.');
 const weapon=chunks[10]==='-'?null:parseBuildWeaponId(chunks[10]);
 if(!/^[01]{2}$/.test(chunks[11]))fail('Invalid baseline content flags.');
 const A=normalizeBuildComparisonSnapshot({
  origin:cls.name,stats:chunks.slice(2,10).map(Number),weaponId:weapon,
  ownsTarnishedPack:chunks[11][0]==='1',ownsSote:chunks[11][1]==='1'
 });
 const bcls=CLASSES.find(c=>c.name===p.get('origin'));
 const bstats=parseSharedStats(p.get('stats'));
 if(!bcls||!bstats)fail('Comparison link must include a valid Build B.');
 const B=normalizeBuildComparisonSnapshot({
  origin:bcls.name,stats:bstats,weaponId:parseBuildWeaponId(p.get('weapon')),
  ownsTarnishedPack:parseContentFlag(p.get('tarnished')),
  ownsSote:parseContentFlag(p.get('sote'))
 });
 return {baseline:A,current:B};
}
/** Always resolve both optional weapon IDs against the CURRENT local catalog. */
export function validateSharedBuildAb(search,weapons){
 const shared=parseSharedBuildAb(search);
 if(shared===null)return null;
 if(!Array.isArray(weapons))fail('Local weapon catalog unavailable.');
 compareBuildSnapshots(shared.baseline,shared.current,{weapons});
 return shared;
}
