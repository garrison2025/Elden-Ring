#!/usr/bin/env node
/** Independent AR math audit of directly observed public v1.17 UI values.
 * This fixture was assembled ONLY from two complete input-validated Chromium
 * visits already performed for item-weight audits; never use a made-up AR.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';
import {TARNISHED_V117_AFFINITIES} from '../public/src/tarnished-same-input.mjs';
const fail=m=>{throw new RangeError(m)};
const fold=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
export function compareObservedAr(observations,source){
 if(!Array.isArray(observations?.records)||!Array.isArray(source?.weapons))
  fail('Both validated public v1.17 numeric observations and pinned source required');
 const seen=new Set(),results=[];
 for(const c of observations.records){
  if(!c||typeof c.weaponName!=='string'||typeof c.siteName!=='string'||
   !['Standard','None'].includes(c.affinity)||c.upgrade!==0||c.somber!==0||
   c.twoHanded!==false||!Number.isInteger(c.observedTotalAr)||c.observedTotalAr<0||
   c.verifiedInputsTwice!==true||![41261521809,41262468777].includes(c.sourceRun)||
   !c.playerStats||Object.values(c.playerStats).some(x=>!Number.isInteger(x)||x<1||x>99)||
   typeof c.id!=='string'||seen.has(c.id))
   fail('Unverified/duplicate public source observation cannot be audited');
  seen.add(c.id);
  const affinityId=c.affinity==='None'?-1:TARNISHED_V117_AFFINITIES.indexOf(c.affinity);
  const variants=source.weapons.filter(w=>w.affinityId===affinityId);
  let exact=variants.filter(w=>(w.weaponName??w.name)===c.siteName);
  let matchType='exact-public-name';
  if(exact.length!==1){
   exact=variants.filter(w=>fold(w.weaponName??w.name)===fold(c.siteName));
   matchType='unique-normalized-public-name';
  }
  if(exact.length!==1){
   results.push({id:c.id,weapon:c.weaponName,siteName:c.siteName,
    observed:c.observedTotalAr,status:'SOURCE_VARIANT_UNAVAILABLE',
    variants:exact.length});continue;
  }
  try{
   const profile=convertCompactRegulation(source,{
    weaponName:exact[0].name,gameVersion:'1.17',
    sourceReference:'Pinned reference source; separately compared to live v1.17 public UI'
   });
   const computedOutput=calculateAr(profile,c.playerStats,{
    affinity:'SOURCE AFFINITY',upgrade:0,twoHanded:false
   });
   const computed=computedOutput.total;
   results.push({id:c.id,weapon:c.weaponName,siteName:c.siteName,
    affinity:c.affinity,stats:c.playerStats,observed:c.observedTotalAr,
    computed,delta:computed-c.observedTotalAr,sourceRun:c.sourceRun,matchType,
    ...(computed===c.observedTotalAr?{}:{diagnostics:{perElement:computedOutput.perElement.map(e=>({element:e.element,raw:e.raw,displayed:e.displayed})),floorTotal:computedOutput.floorTotal,floorComponents:computedOutput.floorComponents,roundingDifference:computedOutput.roundingDifference}}),
    status:computed===c.observedTotalAr?'AR_MATCH':'AR_MISMATCH'});
  }catch(err){
   results.push({id:c.id,weapon:c.weaponName,siteName:c.siteName,
    status:'SOURCE_CONVERSION_UNAVAILABLE',reason:String(err?.message??err).slice(0,220)});
  }
 }
 const counts={total:results.length,
  matched:results.filter(x=>x.status==='AR_MATCH').length,
  mismatched:results.filter(x=>x.status==='AR_MISMATCH').length,
  sourceUnavailable:results.filter(x=>!['AR_MATCH','AR_MISMATCH'].includes(x.status)).length};
 return {comparator:'Tarnished.dev public v1.17, same-input +0 AR',
  sourceOfTruth:'two independent public Chromium UI reads; later independent local computation',
  counts,results,scope:'Total AR only. Not min requirements, base elemental attack components, spell or armor data.'};
}
export async function run(){
 const observations=JSON.parse(await readFile(new URL('./tarnished-v117-weight-probe-ar-observations.json',import.meta.url),'utf8'));
 const downloaded=await downloadV117Source(fetch);
 const report=compareObservedAr(observations,JSON.parse(downloaded.text));
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-v117-expanded-ar-check.json'),JSON.stringify(report,null,2)+'\n');
 console.log('[V117 EXPANDED AR] '+JSON.stringify(report.counts));
 for(const r of report.results){
  if(r.status==='AR_MISMATCH')console.log('[V117 EXPANDED AR MISMATCH] '+JSON.stringify(r));
  else if(r.status!=='AR_MATCH')console.log('[V117 EXPANDED AR SOURCE BLOCK] '+JSON.stringify(r));
 }
 if(report.counts.total!==348)throw Error('Expected 348 two-read +0 total AR observations');
 if(report.counts.matched<1)throw Error('No independent v1.17 AR comparison was possible');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await run();
