#!/usr/bin/env node
/** Independently compare public v1.17 +20 Academy staff source output.
 * Reference DOES NOT accept nonzero target-defense inputs. No calibration.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {calculatePinnedV117PebbleMagic} from '../public/src/v117-spell-scaling-engine.mjs';
const sourceReads=await Promise.all([1,2].map(pass=>
 readFile(resolve('.audit/tarnished-spell-v117-academy-plus20-pass-'+pass+'.json'),'utf8').then(JSON.parse)));
const expected=[40,60];
for(let pass=0;pass<2;pass++){
 const batch=sourceReads[pass];
 if(batch.pass!==pass+1||batch.source!=='Tarnished.dev public v1.17'||
  batch.rows?.length!==expected.length||!batch.scenario.includes('Academy Glintstone Staff +20')||
  !batch.targetLimitation?.statedZeroTarget||batch.targetLimitation.hasEnemyDefenseInput)
  throw Error('Missing actual v1.17 source-side +20, zero-target only evidence');
}
const data=JSON.parse((await downloadV117Source(fetch)).text),rows=[];
for(let i=0;i<expected.length;i++){
 const a=sourceReads[0].rows[i],b=sourceReads[1].rows[i],int=expected[i];
 for(const read of [a,b]){
  if(read.intelligence!==int||read.rowCount!==1||
   !Number.isInteger(read.magic)||read.version!=='Elden Ring Version: v1.17'||
   read.stats.int!==String(int)||
   (read.stats.finalInt!==null&&read.stats.finalInt!==undefined&&read.stats.finalInt!==String(int))||
   read.stats.smithing!=='20'||
   !read.selectedTokens.includes('Academy Glintstone Staff')||
   !read.selectedTokens.includes('Glintstone Pebble'))
   throw Error('Source UI effective inputs not identical at INT '+int);
 }
 if(a.magic!==b.magic)throw Error('Two browsers disagree on actual magic '+int);
 const computed=calculatePinnedV117PebbleMagic(data,{
  staff:'Academy Glintstone Staff',intelligence:int,reinforcement:20,
  strength:10,defense:0,negation:0
 });
 const delta=computed.damage-a.magic;
 rows.push({int,actualSiteMagic:a.magic,independentSourceMathMagic:computed.damage,delta,
  status:delta===0?'EXACT_SCENE_MATCH':'UNRESOLVED_SCENE_MISMATCH'});
}
const output={site:'Tarnished.dev v1.17',
 scope:'Wretch, Academy Glintstone Staff +20, Glintstone Pebble, INT40/60, all other base stats 10, no effects, zero target defense/negation',
 comparatorTargetStatus:'NO_NONZERO_ENEMY_DEFENSE_CONTROL_IN_REFERENCE_UI',
 independentBrowserReads:2,rows,allExact:rows.every(x=>x.delta===0),
 caveat:'Exact +20 results do not verify nonzero enemy defense, other spells, seals, arbitrary buffs or in-game damage.'};
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/v117-academy-plus20-comparison.json'),JSON.stringify(output,null,2)+'\n');
console.log('[NEW +20 TWO-BROWSER SOURCE NUMERIC COMPARISON]',JSON.stringify(output));
