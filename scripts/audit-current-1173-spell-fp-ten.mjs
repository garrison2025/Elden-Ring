#!/usr/bin/env node
/** Ten manually transcribed, independently corroborated CURRENT 1.17.3
 * published spell FP/slots/stat snapshots (NOT game-client observations).
 * Compare against the pinned legacy community source WITHOUT rewriting it.
 * Almanauts public site rejects automated CI reads (HTTP 410); do not bypass.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {ARMOR_SNAPSHOT_SHA} from '../public/src/armor-source-optin.mjs';
const source='https://raw.githubusercontent.com/deliton/eldenring-api/'+ARMOR_SNAPSHOT_SHA+'/api/public/data/';
const cases=[
 {name:'Glintstone Pebble',type:'sorceries',fp:7,slots:1,int:10},
 {name:'Carian Slicer',type:'sorceries',fp:4,slots:1,int:14},
 {name:'Comet Azur',type:'sorceries',fp:40,slots:3,int:60},
 {name:'Black Flame',type:'incantations',fp:18,slots:1,fai:20},
 {name:'Bloodflame Blade',type:'incantations',fp:20,slots:1,fai:12,arc:10},
 {name:'Rock Sling',type:'sorceries',fp:18,slots:1,int:18},
 {name:'Catch Flame',type:'incantations',fp:10,slots:1,fai:8},
 {name:'Heal',type:'incantations',fp:32,slots:1,fai:12},
 {name:'Terra Magica',type:'sorceries',legacyAlias:'Terra Magicus',fp:20,slots:1,int:20},
 {name:"Ranni's Dark Moon",type:'sorceries',fp:57,slots:2,int:68}
];
if(cases.length!==10||new Set(cases.map(x=>x.name)).size!==10)throw Error('Ten independently published current reference cases required');
const old={};
for(const type of ['sorceries','incantations']){
 const res=await fetch(source+type+'.json',{redirect:'error'});
 if(!res.ok)throw Error('Legacy pinned '+type+' source unavailable '+res.status);
 const raw=await res.text();
 if(raw.length>750000)throw Error('Legacy spell source exceeded cap');
 old[type]=JSON.parse(raw);
}
const rows=[];
for(const c of cases){
 const hits=old[c.type].filter(x=>x.name===(c.legacyAlias??c.name));
 if(hits.length>1)throw Error('Ambiguous legacy spell '+c.name);
 const prior=hits[0]??null;
 const attrs={int:0,fai:0,arc:0};
 if(prior){
  for(const r of prior.requires??[]){
   const key={Intelligence:'int',Faith:'fai',Arcane:'arc'}[r.name];
   if(key&&Number.isInteger(r.amount))attrs[key]=r.amount;
  }
 }
 const reqCorrect=prior?['int','fai','arc'].every(x=>attrs[x]===(c[x]??0)):false;
 let status=prior===null?'LEGACY_SOURCE_MISSING':
  prior.cost!==c.fp?'LEGACY_FP_MISMATCH':
  prior.slots!==c.slots||!reqCorrect?'LEGACY_OTHER_FIELD_MISMATCH':
  'CURRENT_REFERENCE_AND_LEGACY_MATCH';
 const row={name:c.name,legacyName:prior?.name??null,legacyAliasUsed:!!prior&&!!c.legacyAlias,
  publicReferenceFp:c.fp,legacyFp:prior?.cost??null,
  publicReferenceSlots:c.slots,legacySlots:prior?.slots??null,
  publicReferenceMinimums:{int:c.int??0,fai:c.fai??0,arc:c.arc??0},
  legacyMinimums:prior?attrs:null,status,
  sourcePage:'https://almanauts.com/eldenring/spells/',
  currentSourceClaim:'Regulation 1.17.3 / build 25827938; published page inspected, but not in-game screenshot' };
 rows.push(row);
 console.log('[CURRENT SPELL FP COMPARISON] '+JSON.stringify(row));
}
const counts={total:10,matches:rows.filter(x=>x.status==='CURRENT_REFERENCE_AND_LEGACY_MATCH').length,
 fpMismatches:rows.filter(x=>x.status==='LEGACY_FP_MISMATCH').length,
 notFound:rows.filter(x=>x.status==='LEGACY_SOURCE_MISSING').length,
 otherMismatches:rows.filter(x=>x.status==='LEGACY_OTHER_FIELD_MISMATCH').length,
 nameAliases:rows.filter(x=>x.legacyAliasUsed).length};
const result={schemaVersion:1,currentPublicSource:'Almanauts current-version published spell table',
 currentReferenceVersion:'Regulation 1.17.3, build 25827938',
 independentCorroborationForMismatches:[
  'https://eldenring.wiki.gg/wiki/Black_Flame',
  'https://eldenring.wiki.gg/wiki/Ranni%27s_Dark_Moon'],
 legacySource:'deliton pinned original spell JSON',
 legacyPinnedSourceCommit:ARMOR_SNAPSHOT_SHA,
 counts,rows,
 restrictions:{gameClientVerified:false,publishAllLegacyAsCurrent:false,
  rawCurrentPageAccessibleToCI:false,
  note:'Published source returns HTTP 410 to CI, therefore these ten values are explicitly pinned documented observations rather than claimed automated current-site scrapes.'}};
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/v1173-spell-ten-case-legacy-comparison.json'),JSON.stringify(result,null,2)+'\n');
console.log('[CURRENT SPELL TEN SUMMARY] '+JSON.stringify(counts));
if(counts.matches!==7||counts.fpMismatches!==2||counts.notFound!==1||
 counts.otherMismatches!==0||counts.nameAliases!==1)
 throw Error('Unexpected ten-case current public spell cross-source result');
