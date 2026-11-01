#!/usr/bin/env node
/** Numeric stability audit, READ-ONLY: 39,552 independently sourced v1.17
 * AR cases + 8 two-pass direct Icerind UI samples. Never apply an epsilon.
 */
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';
import {calculateRawV117Reference} from '../public/src/regulation-parity.mjs';

const cases={
 low:{str:9,dex:9,int:9,fai:9,arc:9},
 mid:{str:40,dex:40,int:40,fai:40,arc:40},
 high:{str:55,dex:45,int:35,fai:35,arc:30},
 str:{str:99,dex:10,int:10,fai:10,arc:10},
 dex:{str:10,dex:99,int:10,fai:10,arc:10},
 int:{str:10,dex:10,int:99,fai:10,arc:10},
 fai:{str:10,dex:10,int:10,fai:99,arc:10},
 arc:{str:10,dex:10,int:10,fai:10,arc:99},
 all:{str:99,dex:99,int:99,fai:99,arc:99}
};
const scenarios=max=>[
 [cases.low,0,false],[cases.low,0,true],[cases.high,max,false],
 [cases.high,max,true],[cases.mid,Math.floor(max/2),false],
 [cases.mid,Math.floor(max/2),true],[cases.str,max,true],
 [cases.dex,max,false],[cases.int,max,false],[cases.fai,max,false],
 [cases.arc,max,false],[cases.all,max,true]
];
const ui=JSON.parse(await readFile(new URL('./tarnished-v117-icerind-eight-case-comparison.json',import.meta.url),'utf8'));
if(ui.caseCount!==8||ui.matched!==7||ui.mismatched!==1||
 ui.rows.find(x=>x.id==='baseline-60-60')?.rawPhysical!==183.99999999999997)
 throw Error('Current Icerind UI fixture changed: rerun public browser first');
const source=JSON.parse((await downloadV117Source(fetch)).text);
if(source.weapons.length!==3296)throw Error('Wrong source variant count');
const almostInteger=x=>Number.isFinite(x)&&x>0&&
 Math.floor(x)!==Math.ceil(x)&&Math.ceil(x)-x<=Math.abs(x)*Number.EPSILON*2;
const normalize=x=>almostInteger(x)?Math.ceil(x):Math.floor(x);
let variants=0,sourceCases=0,baselineMismatch=0,alternativeMismatch=0,
 nearIntegerCount=0,alternativeDifferent=0,firstNearCategories={};
let firstIcerind=null;
for(const item of source.weapons){
 const profile=convertCompactRegulation({...source,weapons:[item]},{
  weaponName:item.name,gameVersion:'1.17',
  sourceReference:'Independent public parameter data, not website/game golden'
 });
 variants++;
 const max=profile.affinities['SOURCE AFFINITY'].upgrades.at(-1).level;
 for(const [stats,upgrade,twoHanded] of scenarios(max)){
  const local=calculateAr(profile,stats,{upgrade,twoHanded,affinity:'SOURCE AFFINITY'});
  const raw=calculateRawV117Reference(source,item,stats,{upgrade,twoHanded});
  sourceCases++;
  if(local.total!==raw.total)baselineMismatch++;
  const rawSum=local.perElement.reduce((t,x)=>t+x.raw,0);
  const rounded=normalize(rawSum);
  if(almostInteger(rawSum)){
   nearIntegerCount++;
   const difference=Math.ceil(rawSum)-rawSum;
   const key=difference===0?'zero':'nonzero-close';
   firstNearCategories[key]=(firstNearCategories[key]||0)+1;
  }
  if(rounded!==local.total)alternativeDifferent++;
  if(rounded!==raw.total)alternativeMismatch++;
 }
 if(item.weaponName==='Icerind Hatchet'&&item.affinityId===-1){
  const stats={str:60,dex:60,int:30,fai:30,arc:30};
  const local=calculateAr(profile,stats,{affinity:'SOURCE AFFINITY',upgrade:0,twoHanded:false});
  const raw=calculateRawV117Reference(source,item,stats,{upgrade:0,twoHanded:false});
  firstIcerind={localTotal:local.total,sourceTotal:raw.total,
   publicSiteTotal:184,rawLocal:local.perElement.map(x=>x.raw),
   rawSource:raw.parts.map(x=>x.raw),
   experimentalNearIntegerFloor:normalize(local.perElement.reduce((s,x)=>s+x.raw,0))};
 }
}
const report={schemaVersion:1,scope:'Numerical rounding hypotheses only; NO production math changed',sourceVersion:'1.17',
 totalVariants:variants,sourceCases,baselineSourceMismatch:baselineMismatch,
 nearIntegerRawSums:nearIntegerCount,nearIntegerCategories:firstNearCategories,
 experimentalCeilNearIntegerCases:alternativeDifferent,
 experimentalSourceMathMismatches:alternativeMismatch,
 target:firstIcerind,
 explanation:'Numerically close-to-integer correction is exploratory. Any departure from the exact raw-source implementation is a regression and must not be silently promoted to gameplay or competitor parity.',
 siteObservedCases:8,siteBaselineMatches:7,siteBaselineMismatches:1};
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/v117-icerind-global-rounding-risk.json'),JSON.stringify(report,null,2)+'\n');
console.log('[V117 ROUNDING GLOBAL] '+JSON.stringify(report));
if(variants!==3296||sourceCases!==39552||baselineMismatch!==0)throw Error('Baseline independent source parity no longer intact');
if(!firstIcerind||firstIcerind.localTotal!==183||firstIcerind.publicSiteTotal!==184||
 firstIcerind.experimentalNearIntegerFloor!==184)throw Error('Icerind precision fixture no longer reproduced');
