#!/usr/bin/env node
/** Read two independent public v1.17 browser passes THEN calculate independently.
 * Never count an unactivated case as passed; mismatches preserved not excused.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {getBroadArShard} from './tarnished-v117-broad-ar-30-candidates.mjs';
import {TARNISHED_V117_AFFINITIES} from '../public/src/tarnished-same-input.mjs';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';
const shard=Number(process.env.TARNISHED_BROAD_AR_SHARD);
const candidates=getBroadArShard(shard);
const read=path=>readFile(resolve(path),'utf8').then(JSON.parse);
const [first,second]=await Promise.all([
 read('.audit/broad-ar-first.json'),read('.audit/v117-broad-ar-site-'+shard+'.json')]);
if(first.source!=='Tarnished.dev public v1.17 rendered UI'||second.source!==first.source||
 first.shard!==shard||second.shard!==shard||first.rows?.length!==6||second.rows?.length!==6)
 throw Error('Two independent real public site reads required');
const source=JSON.parse((await downloadV117Source(fetch)).text);
const rows=[];
for(let i=0;i<6;i++){
 const c=candidates[i],a=first.rows[i],b=second.rows[i];
 const identical=a.id===b.id&&a.id===c.id&&a.verifiedInputs===true&&b.verifiedInputs===true&&
  JSON.stringify(a.request)===JSON.stringify(c)&&JSON.stringify(b.request)===JSON.stringify(c)&&
  a.publicAr===b.publicAr&&Number.isInteger(a.publicAr)&&a.version===b.version&&
  a.version==='Elden Ring Version: v1.17';
 const result={id:c.id,weapon:c.weaponName,affinity:c.affinity,upgrade:c.upgrade,
  reinforcement:c.somber?'somber':'regular',twoHanded:c.twoHanded,
  stats:{str:c.str,dex:c.dex,int:c.int,fai:c.fai,arc:c.arc},
  observedTwice:identical,siteAr:identical?a.publicAr:null,sourceAr:null,
  delta:null,status:'SITE_NOT_DOUBLE_VERIFIED'};
 if(identical){
  const aid=c.affinity==='None'?-1:TARNISHED_V117_AFFINITIES.indexOf(c.affinity);
  const variants=source.weapons.filter(w=>(w.weaponName??w.name)===c.weaponName&&w.affinityId===aid);
  if(variants.length!==1){result.status='SOURCE_VARIANT_NOT_UNAMBIGUOUS';}
  else{
   try{
    const profile=convertCompactRegulation(source,{weaponName:variants[0].name,
     gameVersion:'1.17',sourceReference:'Pinned versioned public parameter source'});
    const calc=calculateAr(profile,result.stats,{affinity:'SOURCE AFFINITY',
     upgrade:c.upgrade,twoHanded:c.twoHanded});
    result.sourceAr=calc.total;result.delta=calc.total-a.publicAr;
    result.status=result.delta===0?'DIRECT_SITE_AND_SOURCE_AR_MATCH':'DIRECT_SITE_AND_SOURCE_AR_MISMATCH';
    if(result.delta!==0)result.rawComponents=calc.perElement.map(x=>({type:x.element,raw:x.raw}));
   }catch(e){result.status='SOURCE_CALCULATION_ERROR';result.reason=String(e.message).slice(0,190);}
  }
 }
 rows.push(result);
 console.log('[BROAD AR COMPARE ROW] '+JSON.stringify(result));
}
const counts={shard,total:rows.length,doubleObserved:rows.filter(x=>x.observedTwice).length,
 matches:rows.filter(x=>x.status==='DIRECT_SITE_AND_SOURCE_AR_MATCH').length,
 mismatches:rows.filter(x=>x.status==='DIRECT_SITE_AND_SOURCE_AR_MISMATCH').length,
 unresolved:rows.filter(x=>!['DIRECT_SITE_AND_SOURCE_AR_MATCH','DIRECT_SITE_AND_SOURCE_AR_MISMATCH'].includes(x.status)).length};
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/v117-broad-ar-comparison-'+shard+'.json'),
 JSON.stringify({schemaVersion:1,counts,rows,notGameClient:true},null,2)+'\n');
console.log('[BROAD AR COMPARISON] '+JSON.stringify(counts));
if(counts.total!==6||counts.unresolved>0||counts.mismatches>0)
 throw Error('Strict broad-affinity UI AR acceptance failed; see individual rows; do not claim pass');
