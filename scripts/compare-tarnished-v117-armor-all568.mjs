#!/usr/bin/env node
/** Accept only exact equal results from TWO fresh real browser processes.
 * Disagreeing legacy source values are discoveries, NOT site test failures.
 * No third-party value can substitute for a missing site observation.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {loadPinnedArmorSource} from '../public/src/armor-source-optin.mjs';
const shard=Number(process.env.TARNISHED_ARMOR_SHARD);
if(!Number.isInteger(shard)||shard<0||shard>14)throw Error('15 shards required');
const read=path=>readFile(resolve(path),'utf8').then(JSON.parse);
const [first,second,legacy]=await Promise.all([
 read('.audit/armor-first.json'),
 read('.audit/tarnished-armor-shard-'+shard+'.json'),
 loadPinnedArmorSource(fetch)
]);
if(first.source!=='Tarnished.dev public Build Calculator v1.17'||
 first.source!==second.source||first.shard!==shard||second.shard!==shard||
 first.slot!==second.slot||first.attempted!==second.attempted||
 first.rows.length!==second.rows.length||legacy.armors.length!==568)
 throw Error('Independent identical-source two-pass armor samples required');
const byId=new Map(legacy.armors.map(x=>[x.id,x]));
const rows=[];
for(let i=0;i<first.rows.length;i++){
 const a=first.rows[i],b=second.rows[i],local=byId.get(a.id);
 if(!local||a.id!==b.id||a.slot!==b.slot||a.name!==b.name||
   local.slot!==a.slot||local.name!==a.name)
  throw Error('Source row identity shuffled at shard '+shard+' #'+i);
 const both=a.valid===true&&b.valid===true&&
   a.weight===b.weight&&a.poise===b.poise&&
   Number.isFinite(a.weight)&&a.weight>=0&&
   Number.isInteger(a.poise)&&a.poise>=0;
 const row={id:a.id,name:a.name,slot:a.slot,
  valid:both,siteWeight:both?a.weight:null,sitePoise:both?a.poise:null,
  localWeight:local.weight,localPoise:local.poise,
  weightMatch:both?a.weight===local.weight:null,
  poiseMatch:both?a.poise===local.poise:null,
  firstReason:a.valid?null:a.reason,
  secondReason:b.valid?null:b.reason};
 rows.push(row);
}
const accepted=rows.filter(x=>x.valid).length;
const summary={shard,slot:first.slot,attempted:rows.length,
 accepted,unobserved:rows.length-accepted,
 weightMismatches:rows.filter(x=>x.valid&&!x.weightMatch).length,
 poiseMismatches:rows.filter(x=>x.valid&&!x.poiseMatch).length,
 siteTwiceObserved:true,
 scope:'Public site v1.17 isolated single-piece weight and Poise, no buffs',
 notVerifiedFields:'All other armor defense, resistances, special effects and optimizer decisions'};
const report={schemaVersion:1,summary,rows};
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/tarnished-armor-verified-shard-'+shard+'.json'),JSON.stringify(report,null,2)+'\n');
console.log('[TARNISHED ARMOR VERIFIED SHARD] '+JSON.stringify(report));
if(rows.length===0||accepted===0)throw Error('No accepted live-site armor goldens');
