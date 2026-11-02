#!/usr/bin/env node
/** Strict twice-read actual public v1.17 spell-curve comparisons. Numerical
 * differences are a report, not a falsely green claim of full parity.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {calculatePinnedV117PebbleMagic} from '../public/src/v117-spell-scaling-engine.mjs';
const files=await Promise.all([1,2].map(i=>readFile(resolve('.audit/tarnished-spell-v117-int-curve-pass-'+i+'.json'),'utf8').then(JSON.parse)));
if(files.some((x,i)=>x.pass!==i+1||x.source!=='Tarnished.dev public v1.17'||x.rows.length!==17))
 throw Error('Missing independent real Tarnished.dev source curve pass');
const root=JSON.parse((await downloadV117Source(fetch)).text);
const records=[];
for(let i=0;i<files[0].rows.length;i++){
 const a=files[0].rows[i],b=files[1].rows[i];
 if(a.intelligence!==b.intelligence||a.magic!==b.magic||
  a.version!=='Elden Ring Version: v1.17'||b.version!=='Elden Ring Version: v1.17'||
  !Number.isInteger(a.magic)||a.rowCount!==1||b.rowCount!==1||
  a.stats.int!==String(a.intelligence)||b.stats.int!==String(b.intelligence))
  throw Error('Real browser passes disagree on effective inputs or numbers '+JSON.stringify({a,b}));
 const model=calculatePinnedV117PebbleMagic(root,{intelligence:a.intelligence});
 const difference=model.damage===null?null:model.sourceMathDamage-a.magic;
 records.push({int:a.intelligence,realTarnished:a.magic,modelWithoutCalibration:model.sourceMathDamage,
  independentModelOutput:model.damage,delta:difference,
  status:model.damage===null?'INSUFFICIENT_REQUIREMENTS':
   difference===0?'INDEPENDENT_NUMERICAL_MATCH':'NUMERICAL_MISMATCH',
  boundaryApplied:model.appliedExactSiteBoundary});
}
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/spell-curve-17-two-pass-comparison.json'),JSON.stringify(records,null,2)+'\n');
console.log('[TWICE-READ V117 SPELL CURVE NUMERICAL COMPARISON]',JSON.stringify(records));
console.log('[CURVE PARITY COUNTS]',JSON.stringify(records.reduce((a,x)=>({...a,[x.status]:(a[x.status]||0)+1}),{})));
if(records.length!==17)throw Error('Missing sweep rows');
