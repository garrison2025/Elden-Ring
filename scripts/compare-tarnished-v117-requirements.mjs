#!/usr/bin/env node
/** Strict numeric minimum-requirement comparator from TWO live public v1.17
 * Req: readouts. Pinned external source is checked separately, never mistaken
 * for direct site evidence; status remains NOT_OBSERVED if UI hides Req.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {getRequirementsShard,getArGapRequirementShard,getHighGapRequirementShard,getAltOriginRequirementShard,getSteelOriginRequirementShard} from './tarnished-v117-requirement-candidates.mjs';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {buildV117CatalogOverlay} from '../public/src/v117-catalog-overlay.mjs';
const index=Number(process.env.TARNISHED_REQUIREMENT_SHARD);
const mode=process.env.TARNISHED_REQUIREMENT_TARGET;
const originMode=mode==='alt-origin'||mode==='steel-origin';
const targeted=mode==='ar-gap'||mode==='high-gap'||originMode;
const wanted=mode==='ar-gap'?getArGapRequirementShard(index):mode==='high-gap'?getHighGapRequirementShard(index):originMode?getAltOriginRequirementShard(index):mode==='steel-origin'?getSteelOriginRequirementShard(index):getRequirementsShard(index);
const arraysEqual=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&
 a.length===b.length&&a.every((x,i)=>x===b[i]);
function compareRounds(first,second,catalog,source){
 if(!Array.isArray(first.cases)||!Array.isArray(second.cases)||
  first.cases.length!==wanted.length||second.cases.length!==wanted.length)
  throw Error('Two complete independently obtained site reads required');
 const a=new Map(first.cases.map(x=>[x.id,x])),b=new Map(second.cases.map(x=>[x.id,x]));
 if(a.size!==wanted.length||b.size!==wanted.length)throw Error('Duplicate source observation');
 const byName=new Map(catalog.weapons.map(x=>[x.name,x]));
 const overlay=buildV117CatalogOverlay(catalog,source);
 const rows=wanted.map(c=>{
  const x=a.get(c.id),y=b.get(c.id),local=byName.get(c.name);
  if(!x||!y||!local)throw Error('Missing weapon or case ID');
  const sourceRow=overlay.rows.get(local.id);
  const direct=x.status==='INPUT_AND_REQ_VERIFIED'&&y.status==='INPUT_AND_REQ_VERIFIED'&&
   x.verifiedInputs===true&&y.verifiedInputs===true&&
   x.version==='Elden Ring Version: v1.17'&&y.version===x.version&&
   x.name===c.name&&y.name===c.name&&x.siteName===y.siteName&&
   x.affinity===y.affinity&&arraysEqual(x.requirements,y.requirements)&&
   (mode!=='alt-origin'||(
    x.originName===c.originName&&y.originName===c.originName&&
    x.startingClass===c.originName&&y.startingClass===c.originName&&
    x.classAction?.status==='VISIBLE_ORIGIN_CLICKED'&&y.classAction?.status==='VISIBLE_ORIGIN_CLICKED'&&
    arraysEqual(x.originStats,c.originStats)&&arraysEqual(y.originStats,c.originStats)&&
    ['str','dex','int','fai','arc'].every((key,i)=>x.controls?.[key]===String(c.originStats[i+3])&&
      y.controls?.[key]===String(c.originStats[i+3]))));
  const observed=direct?x.requirements:null;
  const community=local.requirements??null;
  const pinned=sourceRow?.status==='pinned-v117-neutral-reference'?sourceRow.requirements:null;
  const status=!direct?'NOT_OBSERVED':!pinned?'SOURCE_NOT_COMPARABLE':
   arraysEqual(observed,pinned)?'SITE_PINNED_MATCH':'SITE_PINNED_MISMATCH';
  return {id:c.id,weapon:c.name,siteName:direct?x.siteName:null,affinity:direct?x.affinity:null,
   observed,community,pinned,status,inputsVerifiedTwice:direct,
   differsCommunity:direct&&Array.isArray(community)?!arraysEqual(observed,community):null,
   differsPinned:direct&&pinned?!arraysEqual(observed,pinned):null};
 });
 const counts={total:rows.length,siteObserved:rows.filter(x=>x.observed!==null).length,
  matchPinned:rows.filter(x=>x.status==='SITE_PINNED_MATCH').length,
  disagreePinned:rows.filter(x=>x.status==='SITE_PINNED_MISMATCH').length,
  notObserved:rows.filter(x=>x.status==='NOT_OBSERVED').length,
  sourceUnavailable:rows.filter(x=>x.status==='SOURCE_NOT_COMPARABLE').length,
  communityDisagreements:rows.filter(x=>x.differsCommunity===true).length};
 return {comparison:'Tarnished.dev PUBLIC v1.17 independent two-read minimum attribute requirements',
  shard:index,counts,rows,scope:'Only directly displayed Req: five-stat fields; no raw attack or inferred source approval.'};
}
async function run(){
 const [s1,s2,c,up]=await Promise.all([
  readFile(resolve('.audit/req-first.json'),'utf8').then(JSON.parse),
  readFile(resolve('.audit/tarnished-public-requirements.json'),'utf8').then(JSON.parse),
  readFile(resolve('public/data/community-weapon-catalog.json'),'utf8').then(JSON.parse),
  downloadV117Source(fetch)]);
 const out=compareRounds(s1,s2,c,JSON.parse(up.text));
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/requirements-comparison.json'),JSON.stringify(out,null,2)+'\n');
 console.log('[DIRECT V117 REQUIREMENTS] '+JSON.stringify({shard:index,...out.counts}));
 for(const x of out.rows)if(x.status!=='SITE_PINNED_MATCH'||
   x.differsCommunity===true)
  console.log('[DIRECT REQ ROW] '+JSON.stringify(x));
 if(out.counts.total!==wanted.length)throw Error('Incomplete requirements shard');
 if(targeted&&(out.counts.disagreePinned!==0||out.counts.sourceUnavailable!==0))
  throw Error('Targeted browser Req disagrees with pinned v1.17 or has missing source');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await run();
