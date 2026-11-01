#!/usr/bin/env node
/** Source-only audit of optional public spells, talismans and enemy rosters.
 * No game-derived raw JSON or art copied, no runtime API or licensing claims.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {ARMOR_SNAPSHOT_SHA} from '../public/src/armor-source-optin.mjs';
const expected={sorceries:71,incantations:98,talismans:87,bosses:106,creatures:115};
const categories=Object.keys(expected);
const fail=s=>{throw new RangeError(s);};
const summary={schemaVersion:1,evidenceTier:'PINNED_COMMUNITY_SOURCE_ONLY',
 sourceRepo:'deliton/eldenring-api',sourceCommit:ARMOR_SNAPSHOT_SHA,
 checkedAt:new Date().toISOString(),counts:{},fields:{},risks:{},
 gameClientVerified:false,version1_17_3Verified:false,dataRedistributionApproved:false,
 licensedImageReuseApproved:false,independentSpellDamageGOLDENs:0,
 independentEnemyDefenseGOLDENs:0};
for(const category of categories){
 const url='https://raw.githubusercontent.com/deliton/eldenring-api/'+
  ARMOR_SNAPSHOT_SHA+'/api/public/data/'+category+'.json';
 const res=await fetch(url,{headers:{'accept':'application/json'}});
 if(!res.ok)fail('Pinned '+category+' source unavailable HTTP '+res.status);
 const size=Number(res.headers.get('content-length')||0);
 if(size>3_000_000)fail('Unexpected oversized '+category+' source');
 const text=await res.text();if(text.length>3_000_000)fail('Oversized source');
 let rows;
 try{rows=JSON.parse(text)}catch{fail('Malformed strict source JSON '+category)}
 if(!Array.isArray(rows)||rows.length!==expected[category])fail('Unexpected source count '+category);
 const ids=new Set();let names=0,duplicateNames=0;
 const seenNames=new Set();
 const fieldKeys=new Set();
 for(const [i,x] of rows.entries()){
  if(!x||typeof x!=='object'||Array.isArray(x)||typeof x.id!=='string'||
   !x.id||ids.has(x.id))fail('Invalid/duplicate '+category+' ID '+i);
  ids.add(x.id);
  if(typeof x.name==='string'&&x.name.trim()){
   names++;
   const key=x.name.trim().toLowerCase();
   if(seenNames.has(key))duplicateNames++;else seenNames.add(key);
  }
  for(const k of Object.keys(x))fieldKeys.add(k);
 }
 const numericField=key=>rows.filter(x=>Number.isFinite(x[key])).length;
 const textField=key=>rows.filter(x=>typeof x[key]==='string'&&x[key].trim().length>0).length;
 const arrayField=key=>rows.filter(x=>Array.isArray(x[key])).length;
 summary.counts[category]={records:rows.length,uniqueIds:ids.size,nonblankNames:names,duplicateNames};
 if(category==='sorceries'||category==='incantations'){
  summary.fields[category]={
   spellCostNumeric:numericField('cost'),
   memorySlotsNumeric:numericField('slots'),
   attributeRequirementArrays:arrayField('requires'),
   descriptionText:textField('description'),
   effectDescriptionText:textField('effects'),
   numericDamageMultiplier:numericField('damageMultiplier'),
   numericSpellScaling:numericField('spellScaling'),
   numericStatusBuildup:numericField('statusBuildup'),
   damageTypeField:textField('damageType'),
   total:rows.length
  };
 }else if(category==='talismans'){
  summary.fields[category]={textualEffect:textField('effect'),
   structuredNumericEffect:numericField('effectValue'),
   structuredStackingRule:textField('stackingRule'),total:rows.length};
 }else if(category==='bosses'){
  summary.fields[category]={healthPointsAsText:textField('healthPoints'),
   numericDefense:numericField('defense'),numericDamageNegation:numericField('damageNegation'),
   numericElementalDefense:numericField('elementalDefense'),total:rows.length};
 }else summary.fields[category]={
  numericDefense:numericField('defense'),numericHealth:numericField('healthPoints'),total:rows.length};
}
const c=summary.counts;
const totals={sourceSpells:c.sorceries.records+c.incantations.records,
 talismans:c.talismans.records,bosses:c.bosses.records,creatures:c.creatures.records};
summary.totals=totals;
summary.conclusion='Actual pinned source rosters inspected. Spell costs/slots/requirements are not spell damage; textual talisman effects are not numerical stacking rules; boss health text is not defense/negation parameters. No source-only roster is promoted to current-game verified.';
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/pinned-spell-talisman-enemy-source.json'),JSON.stringify(summary,null,2)+'\n');
console.log('[SPELL TALISMAN ENEMY SOURCE] '+JSON.stringify(summary));
if(totals.sourceSpells!==169||totals.talismans!==87||totals.bosses!==106||totals.creatures!==115)
 fail('Pinned source roster completeness failed');
if(summary.fields.sorceries.numericSpellScaling!==0||
 summary.fields.incantations.numericSpellScaling!==0||
 summary.fields.talismans.structuredNumericEffect!==0||
 summary.fields.bosses.numericDefense!==0)
 fail('Source schema changed — inspect before interpreting data');
