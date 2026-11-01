#!/usr/bin/env node
/**
 * Final cross-module field-level v1.17 reference acceptance: source-based
 * neutral damage and five-attribute requirements + DIRECT browser weight.
 * No third-party source numeric rows, weapons or art redistributed.
 * This is NOT active game 1.17.3 certification and not a license audit.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {downloadV117Source,V117_UPSTREAM_COMMIT} from '../public/src/upstream-regulation-v117.mjs';
import {buildV117CatalogOverlay} from '../public/src/v117-catalog-overlay.mjs';
import {buildV117ComparatorCatalog} from '../public/src/v117-comparator-catalog.mjs';
import {TARNISHED_V117_ALL_DIRECT_WEIGHT_EVIDENCE,getTarnishedV117DirectWeight} from '../public/src/tarnished-v117-public-weights.mjs';
const data=path=>readFile(resolve(path),'utf8').then(JSON.parse);
const [catalog,provenance,download]=await Promise.all([
 data('public/data/community-weapon-catalog.json'),
 data('scripts/tarnished-v117-final-req-provenance-487-summary.json'),
 downloadV117Source(fetch)
]);
const source=JSON.parse(download.text);
const overlay=buildV117CatalogOverlay(catalog,source);
const effective=buildV117ComparatorCatalog(catalog,overlay);
const unobservedNames=new Set(provenance.unobserved.map(x=>x.name));
const names=new Set(),weights=new Set();
const counts={
 catalogCount:catalog.weapons.length,uniqueCatalogNames:0,
 independentlyObservedWeightCount:TARNISHED_V117_ALL_DIRECT_WEIGHT_EVIDENCE.length,
 zeroWeightCount:0,negativeWeightCount:0,sourceNeutralAttackCount:0,
 pinnedMinimumRequirementsCount:0,publicTwiceReadMinimumRequirementsCount:0,
 pinnedOnlyMinimumRequirementsCount:0,missingWeightCount:0,missingSourceCount:0,
 mismatchInComparatorAttackFields:0,mismatchInComparatorMinimumRequirements:0,
 unverifiedSourceVersion:0,missingPublicWeightEvidence:0,missingCanonicalItems:0,
 communityWeightDifferences:0
};
const exceptions=[];
const exactArray=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((n,i)=>n===b[i]);
for(const [i,w] of catalog.weapons.entries()){
 if(names.has(w.name))throw Error('Duplicate canonical name '+i);
 names.add(w.name);
 const effectiveRow=effective.catalog.weapons[i];
 const pinned=overlay.rows.get(w.id);
 const weight=getTarnishedV117DirectWeight(w.name);
 if(!effectiveRow||effectiveRow.id!==w.id)counts.missingCanonicalItems++;
 if(!weight){counts.missingWeightCount++;continue;}
 if(weights.has(weight.weaponName)||weight.weaponName!==w.name||
  weight.comparatorVersion!=='1.17'||!weight.observedTwice||
  !weight.verifiedSingleItem||!Number.isFinite(weight.weight)){
  counts.missingPublicWeightEvidence++;continue;
 }
 weights.add(w.name);
 if(weight.weight<0)counts.negativeWeightCount++;
 if(weight.weight===0)counts.zeroWeightCount++;
 if(w.weight!==null&&w.weight!==weight.weight)counts.communityWeightDifferences++;
 if(pinned?.status!=='pinned-v117-neutral-reference'){
  counts.missingSourceCount++;continue;
 }
 if(pinned.sourceGameVersion!=='1.17')counts.unverifiedSourceVersion++;
 if(!Array.isArray(pinned.attack)||pinned.attack.length!==5||
  pinned.attack.every(x=>x===0)||pinned.attack.some(x=>!Number.isInteger(x)||x<0))
  throw Error('Malformed v1.17 source neutral +0 attack at canonical row '+i);
 counts.sourceNeutralAttackCount++;
 if(!Array.isArray(pinned.requirements)||pinned.requirements.length!==5||
  pinned.requirements.some(x=>!Number.isInteger(x)||x<0||x>99))
  throw Error('Malformed v1.17 source minimum requirements at canonical row '+i);
 counts.pinnedMinimumRequirementsCount++;
 if(unobservedNames.has(w.name)){
  counts.pinnedOnlyMinimumRequirementsCount++;
  const recorded=provenance.unobserved.find(x=>x.name===w.name);
  if(!exactArray(recorded.pinnedRequirements,pinned.requirements))
   throw Error('Pinned-only source requirement mismatch '+i);
 }else counts.publicTwiceReadMinimumRequirementsCount++;
 if(!exactArray(effectiveRow.attack,pinned.attack))
  counts.mismatchInComparatorAttackFields++;
 if(!exactArray(effectiveRow.requirements,pinned.requirements))
  counts.mismatchInComparatorMinimumRequirements++;
}
counts.uniqueCatalogNames=names.size;
const ready=counts.catalogCount===487&&counts.uniqueCatalogNames===487&&
 counts.independentlyObservedWeightCount===487&&weights.size===487&&
 counts.zeroWeightCount===5&&counts.negativeWeightCount===0&&
 counts.sourceNeutralAttackCount===487&&counts.pinnedMinimumRequirementsCount===487&&
 counts.publicTwiceReadMinimumRequirementsCount===460&&
 counts.pinnedOnlyMinimumRequirementsCount===27&&
 !counts.missingWeightCount&&!counts.missingSourceCount&&!counts.unverifiedSourceVersion&&
 !counts.missingPublicWeightEvidence&&!counts.missingCanonicalItems&&
 !counts.mismatchInComparatorAttackFields&&!counts.mismatchInComparatorMinimumRequirements&&
 provenance.summary.directPinnedConflicts===0&&
 provenance.summary.allPinnedValid===487;
const report={schemaVersion:1,reference:'Tarnished.dev PUBLIC v1.17 comparator and distinct pinned public v1.17 source',
 sourceCommit:V117_UPSTREAM_COMMIT,counts,sourceSummary:overlay.summary,
 readiness:{v117NeutralWeaponReferenceComplete:ready,
  currentGameClientVerified:false,thirdPartyDataRightsVerified:false,
  v117AllArAffinitiesUpgradeVerified:false,
  manualDamageVerifiedAgainstPublicSite:false,
  armorAndSpellEffectsVerifiedAgainstPublicSite:false,
  seoIndexReleaseAuthorized:false},
 knownExceptions:{directReqNotDisplayed:27,
  historicalFrenziedFlameSealSourceConflict:1,
  icerindHatchetPublicArOnePointMismatch:1},
 caveat:'All 487 neutral +0 attack and minimum Req tuples are pinned-source records, not direct website component attack measurements; 487 weights are direct twice-observed, and 460 Req are direct twice-observed. Never upgrade evidence tier based on this join.'};
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/v117-composite-487-weapon-acceptance.json'),JSON.stringify(report,null,2)+'\n');
console.log('[V117 COMPOSITE WEAPON ACCEPTANCE] '+JSON.stringify({ready,...counts}));
if(!ready)throw Error('487-weapon composite v1.17 reference evidence gate failed');
