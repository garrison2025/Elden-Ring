#!/usr/bin/env node
/** Site-observed minimum stat requirements vs TWO separate local sources.
 * Only 357 public v1.17 Req: text records were independently read twice.
 * A missing Req is NOT a direct website-verified input.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildV117CatalogOverlay} from '../public/src/v117-catalog-overlay.mjs';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
const equal=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i]);
export function auditDirectRequirements(fixture,catalog,source){
 if(!Array.isArray(fixture?.rows)||fixture.rows.length!==487||
 !Array.isArray(catalog?.weapons)||catalog.weapons.length!==487)
 throw new RangeError('Require full catalog plus 487 original browser observations');
 for(const row of fixture.rows)if(row.observedRequirements!==null&&
  (row.status!=='DIRECT_SITE_REQ_VERIFIED'||row.independentlyObservedTwice!==true||
   !Array.isArray(row.observedRequirements)||row.observedRequirements.length!==5||
   row.observedRequirements.some(n=>!Number.isInteger(n)||n<0||n>99)))
  throw new RangeError('Malformed or non-repeatable public minimum requirement observation');
 const overlay=buildV117CatalogOverlay(catalog,source);
 const map=new Map(catalog.weapons.map(x=>[x.name,x]));
 const ids=new Set(),rows=[];
 for(const x of fixture.rows){
  if(ids.has(x.id))throw new RangeError('Duplicate browser case identifier');
  ids.add(x.id);
  const item=map.get(x.name);
  if(!item)throw new RangeError('Browser observation does not map to catalog');
  const c=overlay.rows.get(item.id);
  const v=x.observedRequirements;
  if(v!==null){
   if(x.status!=='DIRECT_SITE_REQ_VERIFIED'||x.independentlyObservedTwice!==true||
    !Array.isArray(v)||v.length!==5||v.some(n=>!Number.isInteger(n)||n<0||n>99))
    throw new RangeError('Cannot accept non-repeatable or malformed public Req field');
  }
  const pinned=c?.status==='pinned-v117-neutral-reference'?c.requirements:null;
  rows.push({id:x.id,name:x.name,siteName:x.siteName,siteRequirements:v,
   communityRequirements:item.requirements??null,pinnedRequirements:pinned,
   siteObservedTwice:v!==null,sourceRun:x.sourceRun,
   communityMismatch:v!==null&&Array.isArray(item.requirements)?!equal(v,item.requirements):null,
   pinnedMismatch:v!==null&&pinned!==null?!equal(v,pinned):null,
   status:v===null?'NOT_OBSERVED':pinned===null?'PINNED_NOT_AVAILABLE':
    equal(v,pinned)?'DIRECT_SITE_PINNED_MATCH':'DIRECT_SITE_PINNED_MISMATCH'});
 }
 const summary={total:rows.length,siteObserved:rows.filter(x=>x.siteObservedTwice).length,
  siteNotObserved:rows.filter(x=>!x.siteObservedTwice).length,
  pinnedMatches:rows.filter(x=>x.status==='DIRECT_SITE_PINNED_MATCH').length,
  pinnedMismatches:rows.filter(x=>x.status==='DIRECT_SITE_PINNED_MISMATCH').length,
  pinnedUnavailable:rows.filter(x=>x.status==='PINNED_NOT_AVAILABLE').length,
  communityMismatches:rows.filter(x=>x.communityMismatch===true).length};
 return {reference:'Real Tarnished.dev public v1.17 Req:/STR-DEX-INT-FAI-ARC, two separate browser reads at actual Wretch stats=10',
  sourceRun:41263897966,summary,rows,
  caveat:'Site only displays Req when a class stat misses a requirement. 130 hidden/nonselected remain NOT_OBSERVED; source-only pinned field is not a browser golden.'};
}
async function run(){
 const [fixture,catalog,download]=await Promise.all([
  readFile(resolve('scripts/tarnished-v117-direct-requirements-actual10.json'),'utf8').then(JSON.parse),
  readFile(resolve('public/data/community-weapon-catalog.json'),'utf8').then(JSON.parse),
  downloadV117Source(fetch)]);
 const result=auditDirectRequirements(fixture,catalog,JSON.parse(download.text));
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-direct-req-compare.json'),JSON.stringify(result,null,2)+'\n');
 console.log('[V117 DIRECT MIN REQUIREMENTS] '+JSON.stringify(result.summary));
 for(const r of result.rows){
  if(r.status==='DIRECT_SITE_PINNED_MISMATCH')
   console.log('[V117 SITE PINNED REQUIREMENT MISMATCH] '+JSON.stringify(r));
  else if(r.communityMismatch===true)
   console.log('[V117 DIRECT COMMUNITY REQ DIFFERENCE] '+JSON.stringify(r));
 }
 if(result.summary.pinnedMismatches!==0||result.summary.pinnedUnavailable!==0)
  throw Error('Public v1.17 requirements disagree with pinned source');
 if(result.summary.siteObserved!==357||result.summary.siteNotObserved!==130)
  throw Error('Direct source observation coverage changed; do not silently approve more records');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await run();
