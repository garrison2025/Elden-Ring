#!/usr/bin/env node
/** Exactly 18 unparseable legacy armor source fields; independent secondary
 * readings are RESEARCH ONLY and not injected into the game calculator.
 * Do not treat different rounding/patch methodology as equivalent.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {ARMOR_SOURCE_URL,ARMOR_SNAPSHOT_SHA,inspectArmorSource,ARMOR_METRICS} from '../public/src/armor-source-optin.mjs';
const entries=[
 {name:'Blue Cloth Vest',metric:'poise',siteName:'Blue Cloth Vest',siteValue:16},
 {name:'Fur Raiment',metric:'physical',siteName:'Fur Raiment',siteValue:6.1},
 {name:'Gelmir Knight Armor',metric:'magic',siteName:'Gelmir Knight Armor',siteValue:10.9},
 {name:'Champion Gauntlets',metric:'strike',siteName:'Champion Bracers',siteValue:2.1},
 {name:'Godrick Knight Gauntlets',metric:'strike',siteName:'Godrick Knight Gauntlets',siteValue:2.9},
 {name:'Godskin Noble Bracelets',metric:'strike',siteName:'Godskin Noble Bracelets',siteValue:2.1},
 {name:'Haligtree Gauntlets',metric:'strike',siteName:'Haligtree Gauntlets',siteValue:2.9},
 {name:'Nox Monk Bracelets',metric:'strike',siteName:'Nox Bracelets',siteValue:2.3},
 {name:'Sorcerer Manchettes',metric:'poise',siteName:'Sorcerer Manchettes',siteValue:1},
 {name:'Sorcerer Manchettes',metric:'vitality',siteName:'Sorcerer Manchettes',siteValue:20},
 {name:'Vulgar Militia Gauntlets',metric:'strike',siteName:'Vulgar Militia Gauntlets',siteValue:2.1},
 {name:'Ash-of-war Scarab',metric:'vitality',siteName:'Ash-of-War Scarab',siteValue:26},
 {name:'Bloodhound Knight Helm',metric:'strike',siteName:'Bloodhound Knight Helm',siteValue:4},
 {name:'Blackflame Monk Greave',metric:'fire',siteName:'Blackflame Monk Greaves',siteValue:7.4},
 {name:'Godskin Noble Trousers',metric:'fire',siteName:'Godskin Noble Trousers',siteValue:6.5},
 {name:'Nox Monk Greaves',metric:'fire',siteName:'Nox Greaves',siteValue:6.8},
 {name:'Sorcerer Leggings',metric:'poise',siteName:'Sorcerer Leggings',siteValue:3},
 {name:'Sorcerer Leggings',metric:'vitality',siteName:'Sorcerer Leggings',siteValue:37}
].map(x=>Object.freeze({...x,secondaryUrl:'https://tarnished.app/armour/'+
 x.siteName.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}));
const namespaced=new Set(entries.map(x=>x.name+'|'+x.metric));
if(entries.length!==18||namespaced.size!==18)throw Error('Expected exactly 18 unique malformed source field targets');
const res=await fetch(ARMOR_SOURCE_URL,{headers:{accept:'application/json'},redirect:'error'});
if(!res.ok)throw Error('Pinned source HTTP '+res.status);
const raw=await res.text();
if(raw.length>1500000)throw Error('Pinned source too large');
const source=JSON.parse(raw);
const parsed=inspectArmorSource(raw);
let pending=[];
const rows=[];
for(const e of entries){
 const hits=parsed.armors.filter(x=>x.name===e.name);
 if(hits.length!==1)throw Error('Unknown or ambiguous legacy source item '+e.name);
 if(hits[0].metrics[e.metric]!==null)
  throw Error('The legacy source has a valid value now; this exception is stale '+e.name+' / '+e.metric);
 const original=source.filter(x=>x.name===e.name);
 if(original.length!==1)throw Error('Pinned raw source name ambiguous');
 if(!Number.isFinite(e.siteValue)||e.siteValue<0||e.siteValue>800)
  throw Error('Bad independent observed reference amount');
 rows.push({...e,evidenceTier:'SECONDARY_REFERENCE_ONLY_NOT_PUBLICATION_APPROVED',
  pinnedOriginalParse:null,independentSourceLabel:'tarnished.app public armor page, patch/date not proven current 1.17.3',
  directGameClientObserved:false,canAutofillPrimaryCalculator:false});
}
const out={schemaVersion:1,originalPinnedCommit:ARMOR_SNAPSHOT_SHA,
 pinnedArmorRecordCount:parsed.count,legacyUnknownCellsBefore:18,
 secondaryResearchReadings:entries.length,secondaryNumericRows:rows.length,
 acceptedIntoOriginalSource:0,acceptedCurrentGameClient:0,
 acceptedForAutomaticGameplayPublishing:0,entries:rows,
 warning:'Secondary public-site readings are distinct version/rounding references, NOT proof of identical primary source values or of game-client truth. The legacy source must keep 18 invalid/unknown cells. This file is an audit queue, not a value override.'};
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/armor-18-secondary-triage.json'),JSON.stringify(out,null,2)+'\n');
console.log('[ARMOR 18 SECONDARY TRIAGE] '+JSON.stringify({legacyUnknown:out.legacyUnknownCellsBefore,
  altReadings:out.secondaryResearchReadings,accepted:out.acceptedForAutomaticGameplayPublishing,
  items:[...new Set(rows.map(x=>x.name))]}));
