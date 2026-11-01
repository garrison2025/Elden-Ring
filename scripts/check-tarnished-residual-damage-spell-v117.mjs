#!/usr/bin/env node
/** Exactly repeated observable public result rows, never numeric parity by assertion alone. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const result={source:'Tarnished.dev public v1.17',profiles:[],errors:[]};
for(let index=0;index<3;index++){
 const reads=[];
 for(let pass=1;pass<=2;pass++){
  try{reads.push(JSON.parse(await readFile(resolve('.audit/tarnished-residual-damage-spell-'+index+'-pass-'+pass+'.json'),'utf8')))}
  catch(error){result.errors.push('Could not read real Chromium evidence '+index+'-'+pass+': '+error.message)}
 }
 if(reads.length!==2)continue;
 for(const module of ['damage','spell']){
  const a=reads[0].pages.find(p=>p.name===module);
  const b=reads[1].pages.find(p=>p.name===module);
  if(!a||!b){result.errors.push('Missing page '+index+'-'+module);continue;}
  const exact=p=>({
   inputs:p.scenario,version:p.version,selected:p.identity?.selectedTokens?.map(v=>v.selected),
   stats:p.identity?.stats,selectedAllVisible:p.identity?.displayed,
   resultVisible:module==='spell'?
     /Astrologer's Staff\s+Glintstone Pebble\s+1\s+0\s+\d+/.test(p.revealed?.textTail||''):
     (p.openTablePointer?.found===true&&p.openTablePointer?.hit?.trim()==='Show Table'),
   resultText:(p.revealed?.textTail||'').replace(/\s+/g,' ').trim()
  });
  const x=exact(a),y=exact(b),match=JSON.stringify(x)===JSON.stringify(y);
  const genuine=!!x.selectedAllVisible&&!!y.selectedAllVisible&&
   x.resultVisible&&y.resultVisible&&x.resultText.length>50&&y.resultText.length>50;
  const status=genuine&&match?'REPEATED_SOURCE_OBSERVATION':'UNVERIFIED_SOURCE_READ';
  if(status!=='REPEATED_SOURCE_OBSERVATION')
   result.errors.push('Unrepeated, mismatched or missing results '+index+'-'+module);
  result.profiles.push({index,module,status,inputs:x.inputs,version:x.version,
   selected:x.selected,stats:x.stats,referenceText:x.resultText,
   sourceTimes:2,localSameInputNumericParity:'NOT_ESTABLISHED_BY_THIS_READ'});
 }
}
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/residual-damage-spell-source-comparison.json'),JSON.stringify(result,null,2)+'\n');
const summary=[
 '# Damage / Spell reference-only fresh Chromium audit',
 '',
 'This is **not** a local damage/spell engine parity claim. All numbers below are raw Tarnished.dev public UI outputs, and only when 2 independent reads match.',
 '',
 '| Module | Profile | Real site read | Independent runs | Local calculation status |',
 '|---|---|---|---|---|',
 ...result.profiles.map(p=>'| '+p.module+' | '+p.index+' | '+p.status+' | '+p.sourceTimes+' | NOT YET SITE-PARITY CERTIFIED |'),
 '',
 'Problems: '+(result.errors.length?result.errors.join('; '):'none detected in reference read'),
 '',
 'To certify a numeric value, an independent local algorithm with identical effective inputs, not these frozen source outputs alone, must match.',
 'Evidence: GitHub Actions raw `.audit/tarnished-residual-damage-spell-*-pass-*.json` artifacts.'
].join('\n');
await writeFile(resolve('.audit/residual-damage-spell-source-comparison.md'),summary+'\n');
console.log(summary);
if(result.errors.length)process.exitCode=1;
