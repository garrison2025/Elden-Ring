#!/usr/bin/env node
/** Pinned public game-parameter source vs actual twice-observed Tarnished.dev v1.17 outputs.
 * ALL 17 rows must match the same stage-accurate arithmetic. No per-INT constants.
 */
import {readFile} from 'node:fs/promises';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {calculatePinnedV117PebbleMagic} from '../public/src/v117-spell-scaling-engine.mjs';
const root=JSON.parse((await downloadV117Source(fetch)).text);
const golden=JSON.parse(await readFile(new URL('./tarnished-v117-spell-17-double-observed-goldens.json',import.meta.url),'utf8'));
if(golden.reference!=='Tarnished.dev public v1.17'||golden.independent_reads_per_profile!==2||
 golden.rows.length!==17)throw Error('Invalid actual-site spell evidence');
const results=golden.rows.map(row=>{
 const math=calculatePinnedV117PebbleMagic(root,{intelligence:row.int});
 return {intelligence:row.int,realSite:row.realTarnished,independentDamage:math.damage,
  scalingTruncated:math.catalystScalingTruncated,status:math.status,
  matched:math.damage===row.realTarnished&&!math.appliedExactSiteBoundary};
});
console.log('[UNIFIED ACTUAL-SITE 17x SPELL MATH]',JSON.stringify(results));
if(results.some(x=>!x.matched||x.status!=='INDEPENDENT_MODEL_MATCHES_TARNISHED_V117_SCENE'))
 throw Error('The independent spell formula must match all 17 actual Tarnished v1.17 outputs WITHOUT case overrides');
const holdout=calculatePinnedV117PebbleMagic(root,{intelligence:51});
if(holdout.status!=='INDEPENDENT_SOURCE_MODEL_UNVERIFIED_AT_SITE')
 throw Error('Unobserved INT51 must not claim real-site certification');
