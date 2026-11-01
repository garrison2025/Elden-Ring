#!/usr/bin/env node
/** Exact same-input DOUBLE READ, then compare values actually used by site.
 * No independent community source is used as an alternative numeric golden.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {TARNISHED_V117_ARMOR_FOUR} from '../public/src/tarnished-v117-armor-direct.mjs';
import {loadPinnedArmorSource} from '../public/src/armor-source-optin.mjs';
const raw=path=>readFile(resolve(path),'utf8').then(JSON.parse);
const [first,second,source]=await Promise.all([
 raw('.audit/armor-first.json'),raw('.audit/tarnished-armor-four-piece-site.json'),
 loadPinnedArmorSource(fetch)
]);
if(first.site!==second.site||first.site!=='Tarnished.dev real public v1.17 build-planner'||
 first.rows?.length!==4||second.rows?.length!==4||TARNISHED_V117_ARMOR_FOUR.length!==4)
 throw Error('Exactly two independent actual public site armor runs needed');
const code=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
const cases=[];
for(let i=0;i<4;i++){
 const a=first.rows[i],b=second.rows[i],e=TARNISHED_V117_ARMOR_FOUR[i];
 const valid=a.valid===true&&b.valid===true&&
  code(a.name)===code(e.name)&&code(b.name)===code(e.name)&&
  code(a.selection?.label)===code(e.name)&&code(b.selection?.label)===code(e.name)&&
  a.slot===b.slot&&a.display?.load===b.display?.load&&
  a.display?.poise===b.display?.poise&&
  a.version==='Elden Ring Version: v1.17'&&b.version===a.version&&
  a.baseline?.load===0&&b.baseline?.load===0&&
  a.baseline?.poise===0&&b.baseline?.poise===0&&
  a.baseline?.maxLoad===48.2&&b.baseline?.maxLoad===48.2&&
  a.display?.load===e.weight&&a.display?.poise===e.poise;
 const matching=source.armors.filter(x=>code(x.name)===code(e.name)&&x.slot===e.slot);
 const local=matching.length===1?matching[0]:null;
 const consistent=valid&&local?.weight===e.weight&&
  local.poise===e.poise&&local.metrics.poise===e.poise&&
  local.siteDirectFields?.weight.includes('Tarnished.dev')&&
  local.siteDirectFields?.poise.includes('Tarnished.dev');
 const row={name:e.name,slot:e.slot,siteTwoIndependentReads:valid,
  siteWeight:valid?a.display.load:null,sitePoise:valid?a.display.poise:null,
  localWeight:local?.weight??null,localPoise:local?.poise??null,
  status:consistent?'DIRECT_SITE_AND_LOCAL_ARMOR_MATCH':'UNVERIFIED_OR_MISMATCH'};
 cases.push(row);console.log('[TARNISHED ARMOR MATCH] '+JSON.stringify(row));
}
const summary={total:4,matches:cases.filter(x=>x.status==='DIRECT_SITE_AND_LOCAL_ARMOR_MATCH').length,
 mismatches:cases.filter(x=>x.status!=='DIRECT_SITE_AND_LOCAL_ARMOR_MATCH').length,
 independentBrowserPasses:2,fields:'Weight and Poise only, not negation/resistance or effects',
 site:'Tarnished.dev v1.17 real Build Calculator, Wretch 10/10/10/10/10, no buffs'};
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/tarnished-four-armor-site-parity.json'),
 JSON.stringify({summary,cases},null,2)+'\n');
console.log('[TARNISHED ARMOR PARITY] '+JSON.stringify(summary));
if(summary.matches!==4)throw Error('One or more actual armor weight/poise fields not matched by local site');
