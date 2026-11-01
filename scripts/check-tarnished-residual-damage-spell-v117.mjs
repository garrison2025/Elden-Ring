#!/usr/bin/env node
/** Exactly repeated observable public result rows, never numeric parity by assertion alone. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const goldens=JSON.parse(await readFile(new URL('./tarnished-v117-residual-3x2-observed-goldens.json',import.meta.url),'utf8'));
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
   inputs:p.scenario,version:p.version,
   selected:p.identity?.selectedTokens?.map(v=>v.selected),
   stats:p.identity?.stats,selectedAllVisible:p.identity?.displayed,
   visibleNumericalRow:p.actualRow?.found===true?p.actualRow:null
  });
  const x=exact(a),y=exact(b),match=JSON.stringify(x)===JSON.stringify(y);
  const genuine=!!x.selectedAllVisible&&!!y.selectedAllVisible&&
   !!x.visibleNumericalRow&&!!y.visibleNumericalRow&&
   x.visibleNumericalRow.matchCount===1&&y.visibleNumericalRow.matchCount===1;
  const expected=module==='damage'?goldens.damage[index]:goldens.spell[index];
  const fields=module==='damage'?
   {physicalAr:expected.physical,totalAr:expected.ar,poise:expected.poise,
    dpsSingle:expected.dpsSingle,dpsPaired:expected.dpsPaired}:
   {magic:expected.magic,bullets:expected.bullets,fp:expected.fp};
  const exactNumerics=genuine&&Object.entries(fields).every(([k,v])=>
   x.visibleNumericalRow[k]===v&&y.visibleNumericalRow[k]===v);
  const status=genuine&&match&&exactNumerics?'REPEATED_SOURCE_OBSERVATION':'UNVERIFIED_SOURCE_READ';
  if(status!=='REPEATED_SOURCE_OBSERVATION')
   result.errors.push('Unrepeated, mismatched or missing results '+index+'-'+module);
  result.profiles.push({index,module,status,inputs:x.inputs,version:x.version,
   selected:x.selected,stats:x.stats,referenceRow:x.visibleNumericalRow,
   sourceTimes:2,localSameInputNumericParity:'NOT_ESTABLISHED_BY_THIS_READ'});
 }
}

const buildReads=[];
for(let pass=1;pass<=2;pass++){
 try{buildReads.push(JSON.parse(await readFile(resolve('.audit/tarnished-residual-build-weapon-ar-pass-'+pass+'.json'),'utf8')))}
 catch(error){result.errors.push('Missing direct Build Planner AR Chrome pass '+pass+': '+error.message)}
}
if(buildReads.length===2){
 result.crossPageAr=[];
 const observed=[];
 for(let index=0;index<3;index++){
  const source=buildReads.map(x=>x.rows.find(row=>row.id===
   ['uchigatana-15-20','uchigatana-20-20','uchigatana-15-25'][index]));
  if(source.some(x=>!x?.verifiedInputs||!Number.isInteger(x.publicAr))||
     source[0].publicAr!==source[1].publicAr)
   result.errors.push('Independent Build AR reads do not match/activate for '+index);
  const damage=result.profiles.find(x=>x.index===index&&x.module==='damage');
  const siteDamageAr=damage?.referenceRow?.totalAr;
  if(!Number.isInteger(siteDamageAr)||siteDamageAr!==damage.referenceRow.physicalAr){
   result.errors.push('Actual rendered Damage numeric row missing or inconsistent '+index);
   continue;
  }
  const siteBuildAr=source[0]?.publicAr;
  const status=siteDamageAr===siteBuildAr?'CROSS_PAGE_MATCH':'REFERENCE_CROSS_PAGE_MISMATCH';
  observed.push({index,inputs:damage.inputs,siteDamageAr,siteBuildAr,delta:siteDamageAr-siteBuildAr,status,
   independentPassesPerPage:2});
 }
 result.crossPageAr=observed;
 if(observed.length!==3)result.errors.push('Missing a complete 3-row cross-page AR comparison');
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
 '## Same-input Tarnished.dev Build Planner versus Tarnished.dev Damage Calculator',
 '| STR / DEX | Build Planner AR | Damage Calculator AR | Result |',
 '|---|---:|---:|---|',
 ...(result.crossPageAr||[]).map(p=>'| '+p.inputs.strength+' / '+p.inputs.dexterity+' | '+p.siteBuildAr+' | '+p.siteDamageAr+' | '+p.status+' |'),
 '',
 '**These are two calculators on the SAME reference site.** A mismatch is a recorded reference-internal disagreement, not a local engine mismatch or a passing cross-page parity result.',
 '',
 'Problems: '+(result.errors.length?result.errors.join('; '):'none detected in independent source reads'),
 '',
 'To certify a numeric value, an independent local algorithm with identical effective inputs, not these frozen source outputs alone, must match.',
 'Evidence: GitHub Actions raw `.audit/tarnished-residual-damage-spell-*-pass-*.json` artifacts.'
].join('\n');
await writeFile(resolve('.audit/residual-damage-spell-source-comparison.md'),summary+'\n');
console.log(summary);
if(result.errors.length)process.exitCode=1;
