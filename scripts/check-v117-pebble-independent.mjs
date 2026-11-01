#!/usr/bin/env node
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {calculatePinnedV117PebbleMagic} from '../public/src/v117-spell-scaling-engine.mjs';
const root=JSON.parse((await downloadV117Source(fetch)).text);
const out=[];
for(const intelligence of [25,30,40,50]){
 const row=calculatePinnedV117PebbleMagic(root,{intelligence});
 out.push({intelligence,model:row.damage,rawModel:row.sourceMathDamage,status:row.status,
  scaling:row.catalystScalar,reference:row.referenceCompared});
}
console.log('[LIVE-INDEPENDENT-SPELL-CHECK] '+JSON.stringify(out));
if(out.slice(0,3).some(x=>!x.reference?.exactMatch))
 throw Error('Independent Spell +25 model does not reproduce actual Tarnished v1.17 three reference scenes');
if(out[3].status!=='INDEPENDENT_SOURCE_MODEL_UNVERIFIED_AT_SITE')
 throw Error('Unobserved INT50 cannot be claimed site-verified');
