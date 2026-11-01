#!/usr/bin/env node
/** Verify three real site AR values using our own pinned v1.17 AR engine.
 * Do not infer either DPS or Glintstone Pebble scaling from reference rows.
 */
import {readFileSync} from 'node:fs';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';
const evidence=JSON.parse(readFileSync(new URL('./tarnished-v117-residual-3x2-observed-goldens.json',import.meta.url),'utf8'));
const archive=JSON.parse((await downloadV117Source(fetch)).text);
const candidates=archive.weapons.filter(x=>x.name==='Uchigatana'&&x.affinityId===0);
if(candidates.length!==1)throw Error('Uchigatana Standard source must resolve uniquely');
const profile=convertCompactRegulation(archive,{weaponName:'Uchigatana',gameVersion:'1.17',
 sourceReference:'Pinned v1.17 source mathematical parameter computation'});
const outcomes=evidence.damage.map(row=>{
 const actual=calculateAr(profile,{str:row.str,dex:row.dex,int:10,fai:10,arc:10},
  {affinity:'SOURCE AFFINITY',upgrade:25,twoHanded:false});
 return {stats:{str:row.str,dex:row.dex},siteAR:row.ar,localAR:actual.total,
  exactMatch:actual.total===row.ar,dpsReferenceOnly:[row.dpsSingle,row.dpsPaired]};
});
console.log('[THREE ACTUAL SITE AR COMPARISONS]',JSON.stringify(outcomes));
if(!outcomes.every(x=>x.exactMatch))throw Error('One or more REAL-site +25 AR profiles differs from local AR math');
