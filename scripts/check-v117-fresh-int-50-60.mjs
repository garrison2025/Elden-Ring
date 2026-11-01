#!/usr/bin/env node
/** Compare NEW same-input INT50/60 real Tarnished UI in two independent
 * Chrome sessions each against an independently run pinned catalyst graph.
 * Exact source vs model; never rewrite a golden just to pass.
 */
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {calculatePinnedV117PebbleMagic} from '../public/src/v117-spell-scaling-engine.mjs';
const source=JSON.parse((await downloadV117Source(fetch)).text);
const frozen=JSON.parse(await readFile(new URL('./tarnished-v117-pebble-int-50-60-fresh-browser-goldens.json',import.meta.url),'utf8'));
let failed=false;
const output=[];
for(const [caseId,intelligence] of [[3,50],[4,60]]){
 const reads=[];
 for(let pass=1;pass<=2;pass++){
  const file=resolve('.audit/tarnished-residual-damage-spell-'+caseId+'-pass-'+pass+'.json');
  const data=JSON.parse(await readFile(file,'utf8'));
  const spell=data.pages.find(p=>p.name==='spell');
  if(!spell?.actualRow?.found||spell.actualRow.catalyst!=="Astrologer's Staff"||
   spell.actualRow.spell!=='Glintstone Pebble'||spell.identity?.stats?.int!=intelligence||
   spell.version!=='Elden Ring Version: v1.17')throw Error('Invalid real input/output evidence '+caseId+'/'+pass);
  reads.push(spell.actualRow.magic);
 }
 const independent=calculatePinnedV117PebbleMagic(source,{intelligence});
 const repeated=reads[0]===reads[1];
 const matched=repeated&&reads[0]===independent.damage;
 const line={intelligence,sourceReads:reads,independentDamage:independent.damage,
  independentRaw:independent.sourceMathDamage,repeated,matched,modelStatus:independent.status};
 output.push(line);
 if(!matched)failed=true;
}
console.log('[EXTENDED SAME-INPUT LIVE SPELL COMPARE] '+JSON.stringify(output));
if(failed)throw Error('New real-site source or model results changed: manual mismatch review required.');
if(output.some(x=>!x.matched)){
 console.log('[SPELL PARITY NOT COMPLETE] A genuine one-point real-site mismatch remains. This audit only confirms that it is not hidden; do NOT mark generic scaling fully matched.');
}
