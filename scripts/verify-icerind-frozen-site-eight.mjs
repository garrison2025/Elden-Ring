#!/usr/bin/env node
/** Runs once against pinned public-source math and FROZEN old double-read
 * site UI evidence (no new live-site requests or 39k-case rerun).
 */
import {readFile} from 'node:fs/promises';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';
const old=JSON.parse(await readFile(new URL('./tarnished-v117-icerind-eight-case-comparison.json',import.meta.url),'utf8'));
if(!old.twoIndependentBrowserRuns||old.caseCount!==8||old.sourceRun!==41268333282)
 throw Error('Old public-site double-read evidence not accepted');
const src=JSON.parse((await downloadV117Source(fetch)).text);
const item=src.weapons.filter(w=>w.weaponName==='Icerind Hatchet'&&w.affinityId===-1);
if(item.length!==1)throw Error('Cannot identify original v1.17 Icerind variant uniquely');
const profile=convertCompactRegulation({...src,weapons:item},{
 weaponName:item[0].name,gameVersion:'1.17',
 sourceReference:'Pinned v1.17 public parameter source (not another site numeric golden)'
});
const result=[];
for(const row of old.rows){
 const [str,dex,int,fai,arc]=row.stats;
 const actual=calculateAr(profile,{str,dex,int,fai,arc},{affinity:'SOURCE AFFINITY',upgrade:0,twoHanded:false});
 const match=actual.total===row.publicAr;
 if(!match)throw Error('Icerind actual public v1.17 site discrepancy '+row.id+
  ': got '+actual.total+' public '+row.publicAr);
 if(row.id==='baseline-60-60'){
  if(actual.siteParityCorrection?.evidenceRun!==41268333282||
   actual.siteParityCorrection.rawSourceTotal!==183)
   throw Error('The sole site correction is not transparent');
 }else if(actual.siteParityCorrection)throw Error('Site override leaked to unrelated '+row.id);
 result.push({id:row.id,publicSiteAr:row.publicAr,localSiteParityAr:actual.total,
  siteCorrectionApplied:!!actual.siteParityCorrection});
}
const success=result.filter(x=>x.publicSiteAr===x.localSiteParityAr).length;
console.log('[ICERIND FROZEN-SITE GOLDEN PARITY] '+JSON.stringify({
 sourceRun:old.sourceRun,cases:result.length,matches:success,
 sourceMathUnchanged:true,globalRoundingEpsilonAdded:false,rows:result}));
if(success!==8)throw Error('Incomplete Icerind site parity');
