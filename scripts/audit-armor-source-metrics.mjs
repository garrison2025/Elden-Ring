#!/usr/bin/env node
/**
 * Opt-in CI integration: pinned, read-only public armor source.
 * Outputs aggregated field coverage + calculated objective totals only;
 * never commits or re-distributes armor images/descriptions/JSON.
 * This is NOT a Tarnished.dev same-input output audit; armor data is
 * from a separate community source and may contain rounded values.
 */
import {loadPinnedArmorSource,ARMOR_METRICS} from '../public/src/armor-source-optin.mjs';
import {optimizePinnedArmorMetric} from '../public/src/armor-source-metric-optimizer.mjs';
const source=await loadPinnedArmorSource(fetch);
if(source.count!==568)throw Error('Pinned armor roster changed.');
const summary={sourceCount:source.count,objectives:{},versionedTarnishedUiObservations:0,
 sourceNumericParityClaim:false,clientVerificationRequired:false};
for(const [metric,meta] of Object.entries(ARMOR_METRICS)){
 const known=source.armors.filter(item=>item.metrics[metric]!==null).length;
 if(known<500)throw Error(metric+' has insufficient source coverage: '+known);
 const started=Date.now();
 const result=optimizePinnedArmorMetric(source.armors,{
  metric,maxEquipLoad:75,reservedWeight:18,tier:'medium',minPoise:0
 });
 if(result.status!=='optimized-source-reference'||
  !Number.isFinite(result.metricValue)||result.metricValue<=0||
  result.combination.length!==4||!(result.totalWeight<75*.7))
  throw Error('Real source optimization failed for '+metric);
 const withPoise=optimizePinnedArmorMetric(source.armors,{
  metric,maxEquipLoad:75,reservedWeight:18,tier:'medium',minPoise:51
 });
 if(withPoise.status!=='optimized-source-reference'||withPoise.poise<51||
  !Number.isFinite(withPoise.metricValue)||withPoise.metricValue<=0||
  withPoise.combination.length!==4||!(withPoise.totalWeight<75*.7))
  throw Error('Pinned-source exact joint optimization failed for '+metric);
 if(withPoise.metricValue>result.metricValue+1e-5)
  throw Error('Adding a Poise minimum cannot improve the unconstrained optimum: '+metric);
 summary.objectives[metric]={knownSourceValues:known,
  missingSourceValues:source.count-known,
  optimizedScore:result.metricValue,units:result.metricUnit,
  rollTier:result.rollTier,elapsedMs:Date.now()-started,
  atLeast51PoiseScore:withPoise.metricValue,
  verifiedMinimumPoise:withPoise.poise,
  constrainedAlgorithm:withPoise.algorithm??'native-poise-exact-dp'};
}
console.log(JSON.stringify(summary,null,2));
