/**
 * Narrow supplemental DLC armor row, NOT part of the historical pinned 568 list.
 * Tarnished.dev PUBLIC Build Planner v1.17: two independent Chromium reads
 * 2026-11-01, GitHub Actions run 41280906636, each saw 1.0 Weight / 5 Poise
 * with Wretch 10x8 and no other equipment. The equipped final INT/FAI/ARC
 * were 11/11/11, versus a 10/10/10 baseline.
 *
 * Source proof: https://github.com/garrison2025/Elden-Ring/actions/runs/41280906636
 * This single observed row does NOT establish a redistribution license for
 * anyone else's armor catalog and does NOT validate 12 defense/resist fields.
 */
const otherKeys=['physical','strike','slash','pierce','magic','fire','lightning',
 'holy','immunity','robustness','focus','vitality'];
export const DIRECT_V117_CIRCLET_OF_LIGHT=Object.freeze({
 id:'dlc-circlet-of-light-v117-direct',
 name:'Circlet of Light',
 slot:'Head',
 weight:1,
 poise:5,
 metrics:Object.freeze(Object.fromEntries([['poise',5],
  ...otherKeys.map(key=>[key,null])])),
 siteDirectFields:Object.freeze({
  weight:'Tarnished.dev v1.17 Build Planner, two independent browser reads; run 41280906636',
  poise:'Tarnished.dev v1.17 Build Planner, two independent browser reads; run 41280906636'
 }),
 dlc:true,
 directlyObservedAttributeChanges:Object.freeze({int:1,fai:1,arc:1}),
 effectNotModeled:'Equipping changes INT, FAI, ARC by +1 each; derived spell and defense/effect stacking not modeled.'
});
