#!/usr/bin/env node
/** Two independent public Build v1.17 browser reads; no inferred cross-category
 * bonuses can be called observed unless both active inputs and final fields agree.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const reads=await Promise.all([1,2].map(pass=>readFile(resolve('.audit/v117-build-effect-rune-physick-pass-'+pass+'.json'),'utf8').then(JSON.parse)));
const expectedStats=[15,15,15,15,15,25,15,15],expectedDelta=[5,5,5,5,5,15,5,5];
for(const [i,read] of reads.entries()){
 if(read.site!=='Tarnished.dev public v1.17'||read.kind!=='rune-physick'||
  !read.valid||!read.actualSelectionOnly||
  !read.selection?.rune?.ok||!read.selection?.physick?.ok||
  read.runeActivated!==false||read.physickActivated!==false||
  read.baseline.some(x=>String(x)!=='10')||
  read.after.map(Number).some((n,j)=>n!==expectedStats[j])||
  read.change.some((n,j)=>n!==expectedDelta[j])||
  read.weight!==0||read.poise!==0)
  throw Error('Real same-input active combo not observed for pass '+(i+1)+': '+JSON.stringify(read).slice(0,1800));
}
if(JSON.stringify(reads[0].after)!==JSON.stringify(reads[1].after)||
 JSON.stringify(reads[0].change)!==JSON.stringify(reads[1].change))
 throw Error('Independent browser outputs disagree');
const proof={site:'Tarnished.dev public v1.17',workflowScope:'Wretch 10 original, no gear, Godricks Great Rune + Intelligence-knot Crystal Tear selected; BOTH activation checkboxes were visibly OFF',passes:2,sourceOutput:expectedStats,independentlyComposedDelta:expectedDelta,
 status:'TWO_BROWSER_SELECTED_ONLY_CROSS_CATEGORY_ATTRIBUTES_MATCH',
 scopeWarning:'Selected-item output with both checkbox controls OFF is not a certified active effect, game-client Rune Arc/Physick mechanic or proof of arbitrary Build stacks.'};
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/v117-rune-physick-combined-parity.json'),JSON.stringify(proof,null,2)+'\n');
console.log('[ACTUAL TWO-BROWSER RUNE PHYSICK COMBINATION]',JSON.stringify(proof));
