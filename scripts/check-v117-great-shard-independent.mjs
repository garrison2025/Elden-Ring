#!/usr/bin/env node
/* Actual double-browser reference rows vs separately sourced spell AtkParam
 * coefficient and downloadable pinned catalyst source. No per-INT adjustments. */
import {readFileSync} from 'node:fs';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';
import {calculatePinnedV117SimpleSorceryMagic} from '../public/src/v117-spell-scaling-engine.mjs';
const ref=JSON.parse(readFileSync(new URL('./v117-great-shard-double-browser-evidence.json',import.meta.url),'utf8'));
if(ref.sourceRun!==41371710168||ref.independentBrowserPasses!==2||
 ref.spell!=='Great Glintstone Shard'||ref.coefficient.magic!==211||ref.rows.length!==3)
 throw Error('Expected authentic different-spell evidence');
const root=JSON.parse((await downloadV117Source(fetch)).text);
const rows=[];
for(const x of ref.rows){
 if(x.sitePass1!==x.sitePass2)throw Error('Independent browser reads disagree at INT '+x.int);
 const computed=calculatePinnedV117SimpleSorceryMagic(root,{
  spell:ref.spell,intelligence:x.int,reinforcement:25,
  staff:"Astrologer's Staff",strength:10,defense:0,negation:0
 });
 const row={int:x.int,first:x.sitePass1,second:x.sitePass2,
  independentlyComputed:computed.damage,coefficient:computed.spellBaseMagic,
  observedReference:computed.referenceCompared?.publicSiteMagic??null,
  status:computed.status};
 rows.push(row);
 if(computed.damage!==x.sitePass1||computed.spellBaseMagic!==211||
  computed.status!=='INDEPENDENT_MODEL_MATCHES_TARNISHED_V117_SCENE')
  throw Error('Fresh Great Glintstone Shard formula mismatch '+JSON.stringify(row));
}
const holdout=calculatePinnedV117SimpleSorceryMagic(root,{
 spell:ref.spell,intelligence:51,reinforcement:25,
 staff:"Astrologer's Staff",strength:10,defense:0,negation:0
});
if(holdout.referenceCompared!==null||holdout.status!=='INDEPENDENT_SOURCE_MODEL_UNVERIFIED_AT_SITE')
 throw Error('Unobserved Great Shard INT51 cannot receive a source-site parity label');
console.log('[NEW REAL DIFFERENT SPELL MATCH 3/3]',JSON.stringify(rows));
