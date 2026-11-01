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
import {auditTarnishedV117ReferenceAR,TARNISHED_V117_ALL_APPROVED_AR_CASES} from '../public/src/tarnished-reference-benchmark.mjs';
import {buildV117CatalogOverlay} from '../public/src/v117-catalog-overlay.mjs';
import {buildV117ComparatorCatalog} from '../public/src/v117-comparator-catalog.mjs';

const output=resolve(process.cwd(),'.audit/v117-math-audit.json');
async function main(){
 if(process.argv.length!==2)throw Error('This audit accepts no arbitrary URL or executable file arguments.');
 const start=Date.now();
 const {text,summary}=await downloadV117Source(fetch);
 // The file is strict JSON despite having a .js filename.
 const params=JSON.parse(text);
 const community=JSON.parse(await readFile(resolve(process.cwd(),'public/data/community-weapon-catalog.json'),'utf8'));
 const versionedOverlay=buildV117CatalogOverlay(community,params);
 const versioned=versionedOverlay.summary;
 // This is the user's ONLY reference-data acceptance standard. Check every
 // neutral catalog family, not one-by-one ad hoc community source decisions.
 // Only aggregate acceptance metrics are retained; no third-party raw data.
 const accepted=buildV117ComparatorCatalog(community,versionedOverlay);
 const acceptedFactsMatch=accepted.catalog.weapons.every(w=>{
  const row=versionedOverlay.rows.get(w.id);
  return row.status==='pinned-v117-neutral-reference'&&
   w.attack.every((v,i)=>v===row.attack[i])&&
   w.requirements.every((v,i)=>v===row.requirements[i]);
 });
 const acceptedReport={
  comparator:'Tarnished.dev public v1.17; fixed public v1.17 parameter snapshot',
  checkedFamilies:accepted.summary.mapped,
  neutralAttackFieldsAccepted:accepted.summary.mapped,
  minimumRequirementFieldsAccepted:accepted.summary.mapped,
  sourceOnlyAttackRecovered:accepted.summary.recoveredAttack,
  previousCommunityAttackDifferences:accepted.summary.overriddenAttack,
  previousCommunityRequirementDifferences:accepted.summary.overriddenRequirements,
  remainingUnknownWeights:accepted.summary.weightNotSupplied,
  remainingDisputedWeights:accepted.summary.weightConflictsRemain,
  allNeutralAttackAndRequirementsMatchSource:acceptedFactsMatch,
  independentPublicSiteARExamples:TARNISHED_V117_ALL_APPROVED_AR_CASES.length,
  mappingIsNotIndividualWebsiteObservation:true,
  requiresInGameValidation:false,
  liveDatasetBundled:false,
  sourceRightsReviewedSeparately:true
 };
 await mkdir(dirname(output),{recursive:true});
 await writeFile(resolve(process.cwd(),'.audit/v117-catalog-comparator-acceptance.json'),
  JSON.stringify(acceptedReport,null,2)+'\n','utf8');
 console.log('[ALL-FAMILY V1.17 ACCEPTANCE] '+JSON.stringify(acceptedReport));
 if(accepted.summary.mapped!==community.weapons.length||!acceptedFactsMatch||
  accepted.summary.recoveredAttack!==community.meta.basePinnedRequirementsOnlyCount)
  throw Error('Versioned source comparison did not cover all published neutral weapon families.');
 console.log('[CATALOG V1.17 SOURCE] neutral='+versioned.sourceMapped+'/'+versioned.total+
  ' source-only='+versioned.sourceOnlyMapped+' flagged='+versioned.flaggedDisputesMapped+
  ' attack-differences='+versioned.neutralAttackDifferences+
  ' requirement-differences='+versioned.neutralRequirementDifferences+
  ' incomplete='+versioned.incompleteSource+' ambiguous='+versioned.ambiguous+
  ' missing='+versioned.missing+' source-weight=NOT_AVAILABLE');
 await mkdir(dirname(output),{recursive:true});
 await writeFile(resolve(process.cwd(),'.audit/v117-catalog-neutral-overlay-summary.json'),
  JSON.stringify(versioned,null,2)+'\n','utf8');
 // No source dataset, attack table or third-party assets are exported.
 if(versioned.sourceMapped!==community.weapons.length||
    versioned.sourceOnlyMapped!==community.meta.basePinnedRequirementsOnlyCount||
    versioned.missing!==0||versioned.ambiguous!==0||versioned.incompleteSource!==0){
  console.error('[CATALOG V1.17 SOURCE] Existing family roster cannot all be connected to exact +0 source facts.');
  process.exitCode=1;
 }
 const coverage=auditSourceFamilyCoverage(community,params);
 const coverageSummary={
  catalogRows:coverage.catalogRows,matchedRows:coverage.matchedRows,
  missingRows:coverage.missingRows,missingIndices:coverage.missingIndices,
  uniqueSourceFamilies:coverage.uniqueSourceFamilies,gameVerified:false,
  sourceParametersExported:false,
  unlistedPlayableCount:coverage.unlistedPlayableCount,
  excludedNonEquipmentCount:coverage.excludedNonEquipmentCount,
  uniqueCatalogNames:coverage.uniqueCatalogNames,
  sourceWearableFamilies:coverage.sourceWearableFamilies,
  completeForPinnedSource:coverage.completeForPinnedSource
 };
 await mkdir(dirname(output),{recursive:true});
 await writeFile(resolve(process.cwd(),'.audit/v117-catalog-family-coverage.json'),
  JSON.stringify(coverageSummary,null,2)+'\n','utf8');
 console.log('[CATALOG SOURCE FAMILIES] matched='+coverage.matchedRows+
  ' of '+coverage.catalogRows+', unmatched='+coverage.missingRows);
 if(!coverage.allMatched){console.error('[CATALOG SOURCE FAMILIES] Broken catalog handoff: exact source family missing.');
  process.exitCode=1;
 }
 // Bi-directional pinned-source roster gate: all wearable names now present,
 // one virtual 'Unarmed' state excluded; no raw regulation rows exported.
 console.log('[REVERSE ROSTER] unique-pinned-families='+coverage.uniqueSourceFamilies+
  ' playable='+coverage.sourceWearableFamilies+' catalog-names='+coverage.uniqueCatalogNames+
  ' unlisted-playable='+coverage.unlistedPlayableCount+
  ' virtual-Unarmed-excluded='+coverage.excludedNonEquipmentCount+
  ' complete-for-pinned-1.17='+coverage.completeForPinnedSource);
 if(!coverage.completeForPinnedSource||community.meta.basePinnedRequirementsOnlyCount!==72){
  console.error('[REVERSE ROSTER] Unresolved item names or source-derived requirements.');
  process.exitCode=1;
 }
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
 if(historical.failed>0)
  console.warn('[EXTERNAL PLAYER AR] Historical player posts differ. Advisory only: user-approved Tarnished.dev v1.17 comparator is the sole numerical acceptance gate.');
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
 if(!current.allMatched)
  console.warn('[CURRENT 1.17.3 CROSS-SOURCE] Informational only: different regulation/build, NOT a v1.17 comparator blocker. Current user policy does NOT require game-client or 1.17.3 evidence.');
 // First live-site candidate: captured once, but repeated public fetches returned
 // blank weapon slots. Audit actual source computation; do not award a release
 // badge or treat a transient scraped display as a stable benchmark.
 const tarnished=auditTarnishedV117ReferenceAR(params,{cases:TARNISHED_V117_ALL_APPROVED_AR_CASES});
 const referenceSummary={
  benchmarkSource:tarnished.source,
  sourceVersion:tarnished.version,
  compared:tarnished.candidateCount,matched:tarnished.matched,
  failed:tarnished.failed,repeatableReferenceCases:tarnished.recheckedReferenceCases,
  releaseGatePassed:tarnished.referenceReleaseReady,
  gameClientVerified:false,regulation1173Certified:false,
  results:tarnished.results.map(({id,expected,actual,status,sourceRepeatable,
   missingRequirements,reason})=>({
   id,expected,actual,status,sourceRepeatable,missingRequirements,reason
  })),
  upstreamSnapshot:V117_UPSTREAM_COMMIT,
  sourceDataBundled:false
 };
 await writeFile(resolve(process.cwd(),'.audit/tarnished-v117-reference-comparison.json'),
  JSON.stringify(referenceSummary,null,2)+'\n','utf8');
 for(const item of tarnished.results){
  console.log('[TARNISHED V1.17] case='+item.id+
   ' observed-AR='+item.expected+' computed-v1.17-AR='+(item.actual??'not-available')+
   ' status='+item.status+' external-url-reconfirm='+item.sourceRepeatable);
 }
 console.log('[TARNISHED V1.17] source-observation-count='+tarnished.candidateCount+
  ' stable-reference-rechecks='+tarnished.recheckedReferenceCases+
  ' benchmark-release-ready='+tarnished.referenceReleaseReady+
  ' game-certified=false');
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
