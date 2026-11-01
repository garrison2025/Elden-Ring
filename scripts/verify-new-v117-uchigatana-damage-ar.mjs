#!/usr/bin/env node
/** Narrow new-site golden: one newly observed Uchigatana +25 AR sample.
 * Does NOT claim the reference DPS motion/timing semantics or spell scaling.
 */
import {readFileSync} from 'node:fs';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';
const d=JSON.parse(readFileSync(new URL('./tarnished-v117-damage-spell-new-live-goldens.json',import.meta.url),'utf8'));
const a=d.damage;
const s=await downloadV117Source(fetch);
const source=JSON.parse(s.text);
const matches=source.weapons.filter(x=>x.name==='Uchigatana'&&x.affinityId===0);
if(matches.length!==1)throw Error('Must resolve exact pinned Standard Uchigatana once, found '+matches.length);
const profile=convertCompactRegulation(source,{
 weaponName:matches[0].name,gameVersion:'1.17',
 sourceReference:'Pinned v1.17 public source for independent same-input AR computation'
});
const result=calculateAr(profile,{
 str:a.baseStats.str,dex:a.baseStats.dex,int:a.baseStats.int,
 fai:a.baseStats.fai,arc:a.baseStats.arc
},{affinity:'SOURCE AFFINITY',upgrade:a.upgrade,twoHanded:false});
const comparison={site:'Tarnished.dev v1.17',weapon:'Uchigatana Standard +25',
 stats:{str:15,dex:20,int:10,fai:10,arc:10},
 siteAR:a.observed.ar,sourceAR:result.total,delta:result.total-a.observed.ar,
 passed:result.total===a.observed.ar};
console.log('[NEW DAMAGE SAME-INPUT AR]',JSON.stringify(comparison));
if(!comparison.passed)throw Error('AR is NOT equal; never hide a failed direct reference comparison');
