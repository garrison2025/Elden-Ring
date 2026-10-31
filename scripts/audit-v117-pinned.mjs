#!/usr/bin/env node
/**
 * Intentionally opt-in executable for an anonymized arithmetic source audit.
 * Fetches a pinned public JSON file from GitHub; never imports/evals that file.
 * Source file and weapon-specific calculated AR are never written to disk.
 */
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {compareDlcWithV117} from '../public/src/v117-catalog-crosscheck.mjs';
import {auditSourceFamilyCoverage} from '../public/src/regulation-catalog-family-audit.mjs';
import {dirname,resolve} from 'node:path';
import {downloadV117Source,V117_UPSTREAM_COMMIT} from '../public/src/upstream-regulation-v117.mjs';
import {auditRawMathParity} from '../public/src/regulation-parity.mjs';
import {auditHistoricalPlayerAr} from '../public/src/external-ar-evidence.mjs';
import {auditCurrentReferenceAr,CURRENT_REFERENCE_URL} from '../public/src/current-reference-ar.mjs';

const output=resolve(process.cwd(),'.audit/v117-math-audit.json');
async function main(){
 if(process.argv.length!==2)throw Error('This audit accepts no arbitrary URL or executable file arguments.');
 const start=Date.now();
 const {text,summary}=await downloadV117Source(fetch);
 // The file is strict JSON despite having a .js filename.
 const params=JSON.parse(text);
 const community=JSON.parse(await readFile(resolve(process.cwd(),'public/data/community-weapon-catalog.json'),'utf8'));
 const coverage=auditSourceFamilyCoverage(community,params);
 const coverageSummary={
  catalogRows:coverage.catalogRows,matchedRows:coverage.matchedRows,
  missingRows:coverage.missingRows,missingIndices:coverage.missingIndices,
  uniqueSourceFamilies:coverage.uniqueSourceFamilies,gameVerified:false,
  sourceParametersExported:false
 };
 await mkdir(dirname(output),{recursive:true});
 await writeFile(resolve(process.cwd(),'.audit/v117-catalog-family-coverage.json'),
  JSON.stringify(coverageSummary,null,2)+'\n','utf8');
 console.log('[CATALOG SOURCE FAMILIES] matched='+coverage.matchedRows+
  ' of '+coverage.catalogRows+', unmatched='+coverage.missingRows);
 if(!coverage.allMatched){console.error('[CATALOG SOURCE FAMILIES] Broken catalog handoff: exact source family missing.');
  process.exitCode=1;
 }
 // Reverse roster diagnostic: the old one-way 416/416 check cannot prove completeness.
 // Print only names and brief row markers in job logs to classify unused/ammo.
 const normal=s=>String(s??'').trim().replace(/[\\u2018\\u2019]/g,"'").toLowerCase();
 const present=new Set(community.weapons.map(w=>normal(w.name)));
 const bySource=new Map();
 for(const item of params.weapons){
  const name=item.weaponName||item.name;
  const key=normal(name);
  if(!key||present.has(key))continue;
  const row=bySource.get(key)||{name,variants:0,neutral:0,keys:Object.keys(item).slice(0,18),example:null};
  row.variants++;
  if(item.affinityId===0||item.affinityId===-1){
   row.neutral++;if(!row.example)row.example={
    affinityId:item.affinityId,weaponType:item.weaponType,requirements:item.requirements,weaponCategory:item.weaponCategory,
    type:item.type,category:item.category,weaponId:item.weaponId,itemId:item.itemId
   };
  }
  bySource.set(key,row);
 }
 console.log('[REVERSE ROSTER] source-only family names='+bySource.size+' vs original catalog '+present.size);
 for(const w of [...bySource.values()].sort((a,b)=>a.name.localeCompare(b.name)))
  console.log('[REVERSE ROW] '+JSON.stringify(w));
 const cross=compareDlcWithV117(community,params);
 const tagged=community.weapons.filter(w=>w.expansion==='Shadow of the Erdtree').filter(w=>
  w.flags?.includes('v117-community-attack-conflict')||w.flags?.includes('v117-community-requirement-conflict'));
 const expected=new Map(tagged.map(w=>[w.name,{
  attack:w.flags.includes('v117-community-attack-conflict'),
  req:w.flags.includes('v117-community-requirement-conflict')
 }]));
 const disputedStone=community.weapons.find(w=>w.id==='sote-reference-059');
 const acknowledgesStone=Boolean(disputedStone?.flags?.includes('stone-sheathed-attack-source-conflict')&&
   disputedStone?.sourceAttackDisagreement?.chosenAttack?.join(',')==='89,0,0,0,0'&&
   disputedStone?.sourceAttackDisagreement?.conflict?.physical===119&&
   disputedStone?.sourceAttackDisagreement?.clientRegulationVerified===false);
 const unreviewed=cross.differences.filter(x=>{
  // The Stone-Sheathed source disagreement is documented separately from
  // the original 7 older v1.17 source conflicts; never auto-approve 89.
  if(x.name==='Stone-Sheathed Sword'&&x.attackConflict&&!x.requirementConflict&&
     acknowledgesStone)return false;
  return !expected.has(x.name)||
   expected.get(x.name).attack!==x.attackConflict||expected.get(x.name).req!==x.requirementConflict;
 });
 const obsolete=tagged.filter(w=>!cross.differences.some(x=>x.name===w.name));
 const crossReport={
  schemaVersion:1,auditType:'INDEPENDENT COMMUNITY +0 vs PINNED 1.17 SOURCE',
  rowsCompared:cross.compared,unmatchedCount:cross.unmatched.length,
  ambiguousCount:cross.ambiguous.length,
  attackConflicts:cross.attackConflicts,requirementConflicts:cross.requirementConflicts,
  allConflictsAcknowledged:unreviewed.length===0&&obsolete.length===0,
  unreviewedCount:unreviewed.length,obsoleteFlagCount:obsolete.length,
  separatelyDisputedStoneSheathedAttackAcknowledged:acknowledgesStone,
  stoneSheathedSourceGameVerified:false,
  sourceNameOrParameterRowsExported:false,gameVerified:false
 };
 await mkdir(dirname(output),{recursive:true});
 await writeFile(resolve(process.cwd(),'.audit/v117-catalog-source-review.json'),
  JSON.stringify(crossReport,null,2)+'\n','utf8');
 console.log('[SOURCE CROSS-CHECK] compared='+crossReport.rowsCompared+
  ' +0-attack-conflicts='+crossReport.attackConflicts+
  ' requirement-conflicts='+crossReport.requirementConflicts+
  ' unreviewed='+crossReport.unreviewedCount+
  ' stale-flags='+crossReport.obsoleteFlagCount);
 const historical=auditHistoricalPlayerAr(params,{
  gameVersion:'1.17',sourceReference:'Public pinned source @ '+V117_UPSTREAM_COMMIT
 });
 const historicalSummary={
  auditType:historical.auditType,checked:historical.checked,matched:historical.matched,
  failed:historical.failed,failures:historical.failures,
  evidenceTier:historical.sourceCategory,gameClientVerified:false,
  screenshotEvidenceCount:0,releaseGatePassed:false
 };
 await writeFile(resolve(process.cwd(),'.audit/v117-historical-player-reports.json'),
  JSON.stringify(historicalSummary,null,2)+'\n','utf8');
 console.log('[EXTERNAL PLAYER AR] checked='+historical.checked+
  ' matched='+historical.matched+' failed='+historical.failed+
  ' evidence=public player posts from 2024; no 2026 in-game screenshots.');
 if(historical.failed>0){
  console.error('[EXTERNAL PLAYER AR] Reported values no longer match this source snapshot. Never auto-correct the reports.');
  process.exitCode=1;
 }
 const current=auditCurrentReferenceAr(params,{
  sourceVersion:'1.17',sourceReference:'Pinned public 1.17 community snapshot'
 });
 const currentReport={
  auditType:current.auditType,
  benchmarkRegulation:current.benchmarkRegulation,
  benchmarkGameBuild:current.benchmarkGameBuild,
  sourceUrl:CURRENT_REFERENCE_URL,
  benchmarkCount:current.benchmarkCount,
  compared:current.compared,matched:current.matched,
  failed:current.failed,failures:current.failures,
  allMatched:current.allMatched,gameClientVerified:false,
  screenshotEvidenceCount:0,releaseGatePassed:false,
  olderSourceFullPatchParityVerified:false
 };
 await writeFile(resolve(process.cwd(),'.audit/v117-vs-current-1173.json'),
  JSON.stringify(currentReport,null,2)+'\n','utf8');
 console.log('[CURRENT 1.17.3 CROSS-SOURCE] checked='+current.benchmarkCount+
  ' matched='+current.matched+' failed='+current.failed+
  ' evidence=independent game-param-derived website, NOT real-game screenshot.');
 if(!current.allMatched){
  console.error('[CURRENT 1.17.3 CROSS-SOURCE] Reference disagreement; review patch changes and calculation model.');
  process.exitCode=1;
 }
 const report=auditRawMathParity(params,{
  gameVersion:'1.17',sourceReference:'Public pinned source @ '+V117_UPSTREAM_COMMIT,
  maxRows:5000,maxExamples:25,
  onProgress:({processed,total})=>{
   if(processed%500===0||processed===total)
    console.log('[AR MATH AUDIT] Progress '+processed+'/'+total);
  }
 });
 const result={...report,
  source:{commit:V117_UPSTREAM_COMMIT,version:summary.version,
   variantCount:summary.entries,dlcVariantCount:summary.dlcRows,
   sourceDataNotBundled:true,rawParametersNotExported:true},
  durationSeconds:Math.round((Date.now()-start)/1000),
  performedOn:'public-pinned-1.17-parameter-snapshot',
  inGameCertified:false
 };
 await mkdir(dirname(output),{recursive:true});
 await writeFile(output,JSON.stringify(result,null,2)+'\n','utf8');
 console.log('[AR MATH AUDIT] variants='+result.totalRows+
  ' converted='+result.converted+' cases='+result.compared+
  ' mismatches='+result.mismatched+' unsupported='+result.unsupported);
 console.log('[AR MATH AUDIT] source=public pinned v1.17; pass='+result.parityPass+
  '; actual-game-verified=false; artifacts contain NO weapon data or AR values.');
 if(!crossReport.allConflictsAcknowledged||crossReport.unmatchedCount||crossReport.ambiguousCount){
  console.error('[SOURCE CROSS-CHECK] Unacknowledged source data drift. Never auto-patch wiki values.');
  process.exitCode=1;
 }
 if(!result.parityPass){
  console.error('[AR MATH AUDIT] FAILURE CATEGORIES '+JSON.stringify(result.errorsByReason));
  process.exitCode=1;
 }
}
main().catch(e=>{console.error('[AR MATH AUDIT] Failed: '+e.message);process.exitCode=2;});
