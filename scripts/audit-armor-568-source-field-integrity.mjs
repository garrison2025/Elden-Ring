#!/usr/bin/env node
/** Audit 568 public community armor SOURCE records for 13 numeric fields.
 * Does NOT claim current-game version, direct Tarnished.dev parity or rights.
 * Never saves third-party raw name/stat records.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {loadPinnedArmorSource,ARMOR_METRICS,ARMOR_SNAPSHOT_SHA} from '../public/src/armor-source-optin.mjs';
const source=await loadPinnedArmorSource(fetch);
const armors=source.armors,ids=new Set(),names=new Set();
const slotCounts={Head:0,Chest:0,Arms:0,Legs:0};
const metrics={};
for(const key of Object.keys(ARMOR_METRICS))metrics[key]={sourceKnown:0,missing:0,invalid:0};
let validWeights=0,zeroWeights=0,unknownPoise=0,ambiguousSlotNames=0;
const indexed=new Map();
for(const [i,armor] of armors.entries()){
 if(ids.has(armor.id))throw Error('Duplicate armor ID at row '+i);
 ids.add(armor.id);
 if(!(armor.slot in slotCounts))throw Error('Missing recognized armor slot');
 slotCounts[armor.slot]++;
 if(!Number.isFinite(armor.weight)||armor.weight<0)throw Error('Missing source weight '+i);
 validWeights++;if(armor.weight===0)zeroWeights++;
 if(armor.poise===null)unknownPoise++;
 const pair=armor.slot+'|'+armor.name.toLowerCase();
 indexed.set(pair,(indexed.get(pair)||0)+1);
 for(const [metric,stat] of Object.entries(metrics)){
  const val=armor.metrics[metric];
  if(val===null){stat.missing++;continue;}
  if(!Number.isFinite(val)||val<0||ARMOR_METRICS[metric].kind==='resistance'&&!Number.isInteger(val)){
   stat.invalid++;continue;
  }
  stat.sourceKnown++;
 }
}
ambiguousSlotNames=[...indexed.values()].filter(x=>x>1).length;
const totalMetricCells=armors.length*Object.keys(metrics).length;
const knownCells=Object.values(metrics).reduce((n,m)=>n+m.sourceKnown,0);
const unknownCells=totalMetricCells-knownCells;
const report={schemaVersion:1,sourceEvidence:'Pinned third-party community armor source, not current 1.17.3 game client',
 sourceCommit:ARMOR_SNAPSHOT_SHA,sourceUrlAvailableViaSourceModule:true,
 totalRows:armors.length,slots:slotCounts,distinctIds:ids.size,
 weights:{known:validWeights,zero:zeroWeights},
 poiseKnown:armors.length-unknownPoise,
 metricCells:{total:totalMetricCells,sourceKnown:knownCells,sourceUnknown:unknownCells},
 metricCoverage:metrics,
 sameSlotDuplicateDisplayNames:ambiguousSlotNames,
 independentTarnishedV117PerPieceMeasurements:0,
 independentCurrentGameClientMeasurements:0,
 sourceLegalRedistributionClearance:false,
 gate:'SOURCE_INTEGRITY_ONLY',
 conclusion:'Pinned roster and the 13 sourced numeric field coverages measured. Not game-verified, current-patch-certified or licensed for redistribution.'};
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/armor-568-source-field-integrity.json'),JSON.stringify(report,null,2)+'\n');
console.log('[ARMOR 568 SOURCE COVERAGE] '+JSON.stringify(report));
if(report.totalRows!==568||report.distinctIds!==568||knownCells<6500||validWeights!==568||
 Object.values(metrics).some(x=>x.invalid!==0))
 throw Error('Pinned armor source integrity/field coverage gate failed');
