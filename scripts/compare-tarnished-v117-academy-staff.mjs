#!/usr/bin/env node
/** Compare two independent browser observations of a NEW staff against the
 * existing pure calculation engine. A mismatch is recorded, never "fixed"
 * by copying observed values into the engine. Source-site v1.17 only.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {calculatePinnedV117PebbleMagic} from '../public/src/v117-spell-scaling-engine.mjs';
const stem='.audit/tarnished-spell-v117-academy-pass-';
const reads=await Promise.all([1,2].map(pass=>readFile(resolve(stem+pass+'.json'),'utf8').then(JSON.parse)));
const expected=[40,50,60,80];
if(reads.some((batch,i)=>batch.pass!==i+1||batch.source!=='Tarnished.dev public v1.17'||
 !Array.isArray(batch.rows)||batch.rows.length!==expected.length||
 !batch.scenario?.includes('Academy Glintstone Staff')))
 throw Error('Both independent actual-site Academy-staff evidence files are required');
const source=JSON.parse((await downloadV117Source(fetch)).text);
const records=[];
for(let i=0;i<expected.length;i++){
 const a=reads[0].rows[i],b=reads[1].rows[i],int=expected[i];
 if(a.intelligence!==int||b.intelligence!==int||a.magic!==b.magic||
  !Number.isInteger(a.magic)||a.rowCount!==1||b.rowCount!==1||
  a.version!=='Elden Ring Version: v1.17'||b.version!==a.version||
  a.stats.int!==String(int)||b.stats.int!==String(int)||
  !a.selectedTokens.includes('Academy Glintstone Staff')||
  !b.selectedTokens.includes('Academy Glintstone Staff')||
  !a.selectedTokens.includes('Glintstone Pebble')||
  !b.selectedTokens.includes('Glintstone Pebble'))
  throw Error('Different source input/output or missing exact token at INT '+int);
 const result=calculatePinnedV117PebbleMagic(source,{
  staff:'Academy Glintstone Staff',intelligence:int,reinforcement:25,
  strength:10,defense:0,negation:0
 });
 const delta=result.damage===null?null:result.damage-a.magic;
 records.push({staff:'Academy Glintstone Staff',spell:'Glintstone Pebble',int,
  actualSiteMagic:a.magic,independentModelMagic:result.damage,
  delta,status:delta===0?'MATCH':'NOT_PARITY_CERTIFIED',
  sourceStatus:result.status,publicSource:'Tarnished.dev v1.17, two separate Chromium processes'});
}
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/academy-staff-v117-independent-parity.json'),
 JSON.stringify({scenario:'Same-input Wretch, Glintstone Pebble + Academy Glintstone Staff +25, zero enemy defense/negation, no buffs',
  policy:'A mismatch remains a failure for that scene; do not invent formula corrections',
  rows:records},null,2)+'\n');
console.log('[ACADEMY STAFF TWO PASS ACTUAL SITE VS INDEPENDENT MATH]',JSON.stringify(records));
