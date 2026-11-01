/** Deterministic, exhaustive nonduplicative work queue for remaining direct
 * Tarnished.dev public v1.17 weight checks. This file contains NO competitor
 * output numbers; they must be read by real Chromium twice in each shard.
 * Current coverage is exactly 107/487 unique source item names.
 */
import {readFileSync} from 'node:fs';
import {TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE} from '../public/src/tarnished-v117-public-weights.mjs';
const raw=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
// Freeze the pre-run 107 proven names, so adding new evidence never changes
// the historical exhaustive 380-name test fixture or reruns an altered sample.
const historicalRunIds=new Set([41257042883,41257934288,41259504988,41260697800]);
const known=new Set(TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE
 .filter(x=>historicalRunIds.has(x.evidenceRun)).map(x=>x.weaponName));
const remaining=raw.weapons.filter(x=>!known.has(x.name));
if(raw.weapons.length!==487||known.size!==107||remaining.length!==380||
  new Set(remaining.map(x=>x.name)).size!==380)
 throw new RangeError('Source changed: rebuild shards, never silently skip or duplicate unverified weapons.');
export const V117_WEIGHT_REMAINING380_COUNT=remaining.length;
export const V117_WEIGHT_REMAINING380=Object.freeze(remaining.map((x,i)=>Object.freeze({
 id:'parallel-'+String(i+1).padStart(3,'0'),
 name:x.name,category:x.category,
 hand:/Shield$/.test(x.name)?'lh1':'rh1',
 affinities:Object.freeze(['Standard','None']),
 catalyst:['Glintstone Staff','Sacred Seal'].includes(x.category),
 // Source category only determines which existing website activation is read.
 // No actual source weight is provided by these candidates.
})));
export function getRemainingWeightShard(index,totalShards=12){
 if(!Number.isInteger(index)||index<0||index>=totalShards||
 !Number.isInteger(totalShards)||totalShards!==12)
 throw new RangeError('Valid shard index 0..11 of exactly 12 required');
 const start=Math.floor(index*V117_WEIGHT_REMAINING380.length/totalShards);
 const end=Math.floor((index+1)*V117_WEIGHT_REMAINING380.length/totalShards);
 return Object.freeze(V117_WEIGHT_REMAINING380.slice(start,end));
}
