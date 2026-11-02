#!/usr/bin/env node
/** Explore the actual public v1.17 catalyst curve at four NEW INT settings.
 * Distinguish each twice-observed public UI number from the independent
 * source-derived attack calculation; save an error matrix, not a fake PASS.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {calculatePinnedV117PebbleMagic} from '../public/src/v117-spell-scaling-engine.mjs';
const source=JSON.parse((await downloadV117Source(fetch)).text);
const data=[];
for(const [caseId,intelligence] of [[5,20],[6,35],[7,45],[8,55]]){
 const readings=[];
 for(const pass of [1,2]){
  const file=resolve('.audit/tarnished-residual-damage-spell-'+caseId+'-pass-'+pass+'.json');
  const result=JSON.parse(await readFile(file,'utf8'));
  const row=result.pages.find(x=>x.name==='spell');
  if(!row?.actualRow?.found||row.actualRow.catalyst!=="Astrologer's Staff"||
    row.actualRow.spell!=='Glintstone Pebble'||row.identity?.stats?.int!=intelligence||
    row.version!=='Elden Ring Version: v1.17')
   throw Error('The actual same-input public-site read is missing or wrong for '+caseId+' / '+pass);
  readings.push(row.actualRow.magic);
 }
 if(readings[0]!==readings[1])throw Error('Two independent browsers did not get the SAME source value at INT '+intelligence);
 const model=calculatePinnedV117PebbleMagic(source,{intelligence});
 data.push({intelligence,publicV117Magic:readings[0],sourceModel:model.damage,
  discrepancy:model.damage-readings[0],readCount:2,modelStatus:model.status});
}
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/v117-pebble-four-new-curve-observations.json'),JSON.stringify(data,null,2)+'\n');
console.log('[NEW ACTUAL SOURCE CURVE CHALLENGE] '+JSON.stringify(data));
if(data.some(x=>x.discrepancy!==0||x.modelStatus!=='INDEPENDENT_MODEL_MATCHES_TARNISHED_V117_SCENE')) throw Error('One or more actual-source-v1.17 Spell curves still mismatch the independent corrected algorithm.');
console.log('[ACCURACY] All four new real-source twice-read Spell inputs independently match with consistent truncation/rounding stages.');
