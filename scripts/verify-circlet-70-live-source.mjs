#!/usr/bin/env node
/** Regression of the REAL pinned source plus the new twice-read single DLC item.
 * Explicit opt-in external JSON download on CI only, never paid API.
 */
import assert from 'node:assert/strict';
import {loadPinnedArmorSource} from '../public/src/armor-source-optin.mjs';
import {siteVerifiedArmorSubset} from '../public/src/tarnished-armor-eligibility.mjs';
import {optimizePinnedArmorMetric} from '../public/src/armor-source-metric-optimizer.mjs';
const src=await loadPinnedArmorSource(fetch);
const eligible=siteVerifiedArmorSubset(src.armors,'poise');
const opts={metric:'poise',maxEquipLoad:48.176,reservedWeight:0,tier:'medium',minPoise:0};
const result=optimizePinnedArmorMetric(eligible.accepted,opts);
const combo=result.combination?.map(x=>({name:x.name,weight:x.weight,poise:x.poise}))||[];
console.log('[REAL SOURCE + VERIFIED DLC OPTIMUM] '+JSON.stringify({
 pinnedCount:src.count,additionalVerifiedDlc:src.additionalVerifiedDlcArmorCount,
 totalCandidates:src.armors.length,accepted:eligible.accepted.length,
 metricValue:result.metricValue,armorWeight:result.armorWeight,combo
}));
assert.equal(src.count,568);
assert.equal(src.armors.length,569);
assert.equal(eligible.accepted.length,550);
assert.ok(result.metricValue>=70,'Must find actual >=70 Poise, not fake UI label');
assert.ok(result.armorWeight<48.176*0.7,'Normal roll constraint must hold');
