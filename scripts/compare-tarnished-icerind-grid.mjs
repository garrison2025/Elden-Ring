#!/usr/bin/env node
/** Strictly compare TWO real public UI reads; preserve all numeric mismatches. */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';
const read=path=>readFile(resolve(path),'utf8').then(JSON.parse);
const [first,second]=await Promise.all([read('.audit/first.json'),read('.audit/icerind-v117-direct-ui.json')]);
if(first.source!==second.source||!Array.isArray(first.rows)||!Array.isArray(second.rows)||
 first.rows.length!==8||second.rows.length!==8)throw Error('Two complete public UI observations required');
const {text}=await downloadV117Source(fetch);
const source=JSON.parse(text);
const variant=source.weapons.filter(w=>(w.weaponName??w.name)==='Icerind Hatchet'&&w.affinityId===-1);
if(variant.length!==1)throw Error('Unambiguous pinned v1.17 Icerind source variant required');
const profile=convertCompactRegulation(source,{weaponName:variant[0].name,gameVersion:'1.17',
 sourceReference:'Pinned public v1.17 parameter snapshot; separate from live UI'});
const results=[];
for(let i=0;i<8;i++){
 const a=first.rows[i],b=second.rows[i];
 if(a.id!==b.id||JSON.stringify(a.stats)!==JSON.stringify(b.stats)||
  a.verifiedInputs!==true||b.verifiedInputs!==true||
  a.version!==b.version||a.version!=='Elden Ring Version: v1.17'||
  a.observedAr!==b.observedAr||!Number.isInteger(a.observedAr))
  throw Error('Independent public v1.17 site reads diverged at '+(a?.id??i));
 const [str,dex,int,fai,arc]=a.stats;
 const calc=calculateAr(profile,{str,dex,int,fai,arc},
  {affinity:'SOURCE AFFINITY',upgrade:0,twoHanded:false});
 const diff=calc.total-a.observedAr;
 results.push({id:a.id,stats:a.stats,publicAr:a.observedAr,localAr:calc.total,
  delta:diff,floorTotal:calc.floorTotal,floorComponents:calc.floorComponents,
  perElement:calc.perElement.map(x=>({element:x.element,raw:x.raw,displayed:x.displayed})),
  status:diff===0?'DIRECT_UI_AND_LOCAL_MATCH':'DIRECT_UI_AND_LOCAL_MISMATCH'});
}
const summary={total:results.length,siteReadTwice:8,
 matched:results.filter(x=>x.delta===0).length,mismatched:results.filter(x=>x.delta!==0).length,
 benchmark:'Tarnished.dev public v1.17 visible UI, 8 exact +0 one-hand no-buff Icerind inputs',
 note:'No code or rounding behavior is silently changed; direct UI discrepancies recorded independently.'};
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/icerind-v117-math-grid.json'),JSON.stringify({summary,results},null,2)+'\n');
console.log('[ICERIND GRID SUMMARY] '+JSON.stringify(summary));
for(const row of results)console.log('[ICERIND GRID ROW] '+JSON.stringify(row));
