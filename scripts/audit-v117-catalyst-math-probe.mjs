#!/usr/bin/env node
/** Read pinned v1.17 source, report ONLY the selected catalyst mathematical schema.
 * Never publish or commit the full upstream JSON.
 */
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
const raw=JSON.parse((await downloadV117Source(fetch)).text);
const candidates=raw.weapons.filter(x=>x.name.includes("Astrologer's Staff"));
const arr=candidates.map(w=>({
 name:w.name,attack:w.attack,attributeScaling:w.attributeScaling,
 correction:w.calcCorrectGraphIds,reinforceTypeId:w.reinforceTypeId,
 attackElementCorrectId:w.attackElementCorrectId,
 requirements:w.requirements,weaponType:w.weaponType,
 propertyKeys:Object.keys(w),
 correctionGraphStages:Object.fromEntries(Object.entries(w.calcCorrectGraphIds||{}).map(([k,v])=>[k,raw.calcCorrectGraphs[v]])),
 attackElementCorrect:raw.attackElementCorrects[w.attackElementCorrectId],
 reinforcement25:raw.reinforceTypes[w.reinforceTypeId]?.[25]
}));
console.log('[CATALYST PINNED V117 SCHEMA] '+JSON.stringify(arr));
if(candidates.length!==1)throw Error('Expected exactly one Astrologers Staff source entry');
