#!/usr/bin/env node
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {calculatePinnedV117PebbleMagic} from '../public/src/v117-spell-scaling-engine.mjs';
const root=JSON.parse((await downloadV117Source(fetch)).text);
const out=[];
for(const intelligence of [25,30,40,50,60,51]){
 const row=calculatePinnedV117PebbleMagic(root,{intelligence});
 out.push({intelligence,model:row.damage,rawModel:row.sourceMathDamage,status:row.status,
  scaling:row.catalystScalar,reference:row.referenceCompared});
}
console.log('[LIVE-INDEPENDENT-SPELL-CHECK] '+JSON.stringify(out));
if(out.slice(0,3).some(x=>!x.reference?.exactMatch))
 throw Error('Independent Spell +25 model does not reproduce actual Tarnished v1.17 three reference scenes');
if(out[3].status!=='SOURCE_MODEL_NUMERIC_MISMATCH'||out[3].model!==362||out[3].reference?.publicSiteMagic!==363)
 throw Error('INT50 one-point numerical mismatch must remain visible until model matches real-site output');
if(out[4].status!=='INDEPENDENT_MODEL_MATCHES_TARNISHED_V117_SCENE'||out[4].model!==410)
 throw Error('Direct INT60 source magic must remain independent v1.17 match');
if(out[5].status!=='INDEPENDENT_SOURCE_MODEL_UNVERIFIED_AT_SITE')
 throw Error('Unobserved INT51 cannot be called real-site verified');
if(out[0].status!=='SITE_CALIBRATED_EXACT_REFERENCE_SCENE')
 throw Error('INT25 one-point site calibration cannot be labeled independent formula match');
