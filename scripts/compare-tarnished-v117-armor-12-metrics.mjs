#!/usr/bin/env node
/** Compare two independent real-site readings of the 12 visible base
 * Wretch armor output fields. Do not convert a character output into a
 * universal per-piece property unless baseline subtraction is proven.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {loadPinnedArmorSource} from '../public/src/armor-source-optin.mjs';
const shard=Number(process.env.TARNISHED_ARMOR_SHARD);
const read=path=>readFile(resolve(path),'utf8').then(JSON.parse);
const [first,second,source]=await Promise.all([
 read('.audit/armor-metrics-first.json'),
 read('.audit/tarnished-armor-12-metrics-shard-'+shard+'.json'),
 loadPinnedArmorSource(fetch)
]);
if(first.shard!==shard||second.shard!==shard||first.slot!==second.slot||
 first.source!=='Tarnished.dev public Build Calculator v1.17'||
 first.source!==second.source||first.rows.length!==second.rows.length)
 throw Error('Two identical versioned site-shard outputs are required');
const metrics=['physical','strike','slash','pierce','magic','fire','lightning','holy',
 'immunity','robustness','focus','vitality'];
const byId=new Map(source.armors.map(x=>[x.id,x]));
let verified=0,unobserved=0,fieldCount=0,effectModifying=0;
const rows=[];
for(let i=0;i<first.rows.length;i++){
 const a=first.rows[i],b=second.rows[i],local=byId.get(a.id);
 if(!local||a.id!==b.id||a.slot!==b.slot||a.name!==b.name||
  local.slot!==a.slot||local.name!==a.name)throw Error('Inconsistent source item identity');
 const siteItem=a.valid===true&&b.valid===true&&
  a.weight===b.weight&&a.poise===b.poise;
 const stableFinal=siteItem&&JSON.stringify(a.baselineFinalStats)===JSON.stringify(a.equippedFinalStats)&&
  JSON.stringify(b.baselineFinalStats)===JSON.stringify(b.equippedFinalStats);
 const output={};
 if(siteItem){
  verified++;
  if(!stableFinal)effectModifying++;
  for(const key of metrics){
   const av=a.liveMetrics?.[key],bv=b.liveMetrics?.[key],
     ai=a.baselineMetrics?.[key],bi=b.baselineMetrics?.[key];
   const observed=Number.isFinite(av)&&Number.isFinite(ai)&&
    av===bv&&ai===bi;
   if(observed){fieldCount++;output[key]={baseline:ai,siteOutput:av};}
  }
 }else unobserved++;
 const record={id:a.id,name:a.name,slot:a.slot,selectedTwice:siteItem,
  exactFinalCharacterStatsUnchanged:!!stableFinal,observed:output};
 rows.push(record);
 console.log('[ARMOR 12-METRIC VERIFIED ROW] '+JSON.stringify(record));
}
const summary={shard,slot:first.slot,attempted:rows.length,
 realSiteItemsObservedTwice:verified,unobserved,
 publicDisplayFieldsObservedTwice:fieldCount,
 expectedMaxFields:verified*metrics.length,
 derivedArmorEffectsMustBeIsolated:effectModifying,
 warning:'These are real rendered character output fields for the exact unbuffed Wretch, not an unlimited per-piece game-stat license or formula.'};
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/tarnished-armor-12-metrics-verified-'+shard+'.json'),
 JSON.stringify({summary,rows},null,2)+'\n');
console.log('[ARMOR 12-METRIC VERIFIED SUMMARY] '+JSON.stringify(summary));
if(rows.length===0||verified===0)throw Error('No real site armor output accepted');
