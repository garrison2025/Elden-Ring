/** Public v1.17 actual Wretch-10 single-talisman numeric UI observations.
 * 14 selectable real items x2 independent Chrome jobs each, matched exactly.
 * ONLY observed selected-item context, NOT game-client or stacking formula.
 * Source: https://github.com/garrison2025/Elden-Ring/actions/runs/41290446627
 */
import {V117_TALISMAN_PART_A} from './v117-talisman-isolated-part-a.mjs';
import {V117_TALISMAN_PART_B} from './v117-talisman-isolated-part-b.mjs';
export const V117_TALISMAN_SINGLE_SELECTION=Object.freeze(Object.fromEntries(
 [...V117_TALISMAN_PART_A,...V117_TALISMAN_PART_B].map(item=>[
 item.name,Object.freeze({
  ...item,delta:Object.freeze(item.delta),
  vitals:Object.freeze(item.vitals),
  defensiveFields:Object.freeze(item.defensiveFields),
  sourceJobs:Object.freeze(item.sourceJobs)
 })
])));
if(Object.keys(V117_TALISMAN_SINGLE_SELECTION).length!==14)
 throw Error('v1.17 talisman proof count corrupted.');
