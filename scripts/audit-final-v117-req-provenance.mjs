#!/usr/bin/env node
/**
 * Final version-scoped, field-level minimum-requirement provenance audit.
 * NEVER treat a pinned community/regulation value as an observed public UI Req.
 * Site doubles are separate, immutable evidence and MUST agree with pinned source.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {downloadV117Source,V117_UPSTREAM_COMMIT,V117_SOURCE_PAGE} from '../public/src/upstream-regulation-v117.mjs';
import {buildV117CatalogOverlay} from '../public/src/v117-catalog-overlay.mjs';
import {CLASSES} from '../public/src/core.mjs';
const read=async path=>JSON.parse(await readFile(resolve(path),'utf8'));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const paths=[
 'scripts/tarnished-v117-direct-requirements-actual10.json',
 'scripts/tarnished-v117-direct-req-recovery-22.json',
 'scripts/tarnished-v117-direct-req-high-gap-recovery-47.json',
 'scripts/tarnished-v117-direct-req-origin-recovery-36.json',
 'scripts/tarnished-v117-steel-torch-origin-req.json',
 'scripts/tarnished-v117-great-epee-direct-req.json',
 'public/data/community-weapon-catalog.json'
];
const [base,ar22,high47,origin36,steel,great,catalog]=await Promise.all(paths.map(read));
const direct=new Map();
const add=(name,req,meta)=>{
 if(direct.has(name))throw Error('Overlapping purported site Req for '+name);
 if(!Array.isArray(req)||req.length!==5||req.some(x=>!Number.isInteger(x)||x<0||x>99))
  throw Error('Malformed direct Req '+name);
 direct.set(name,{requirements:req,...meta});
};
for(const row of base.rows)if(row.status==='DIRECT_SITE_REQ_VERIFIED'&&row.independentlyObservedTwice===true)
 add(row.name,row.observedRequirements,{tier:'PUBLIC_SITE_TWICE',from:'base357'});
for(const [name,batch] of [['ar22',ar22],['high47',high47],['origin36',origin36]]){
 for(const row of batch.rows)if(row.status==='DIRECT_SITE_REQ_VERIFIED'&&row.observedTwice===true)
  add(row.name,row.requirements,{tier:'PUBLIC_SITE_TWICE',from:name});
}
if(!steel.item.verifiedInputAndReqTwice||steel.independentChromiumReads!==2||
 !great.independentBrowserPasses||great.independentBrowserPasses!==2)
 throw Error('Required two direct site visits missing in Steel or Great Epee');
add(steel.item.name,steel.item.siteRequirements,{tier:'PUBLIC_SITE_TWICE',from:'steel-torch'});
add(great.weapon.name,great.weapon.requirements,{tier:'PUBLIC_SITE_TWICE',from:'great-epee'});
if(catalog.weapons.length!==487||direct.size!==460)throw Error('Expected exactly 460 distinct directly observed of 487');
const {text,summary:sourceSummary}=await downloadV117Source(fetch);
const source=JSON.parse(text);
const overlay=buildV117CatalogOverlay(catalog,source);
const classes=CLASSES.filter(x=>!x.dlc);
const records=catalog.weapons.map(w=>{
 const pinned=overlay.rows.get(w.id);
 const site=direct.get(w.name);
 const pinnedValid=pinned?.status==='pinned-v117-neutral-reference'&&
  Array.isArray(pinned.requirements)&&pinned.requirements.length===5;
 const isMatch=site&&pinnedValid?equal(site.requirements,pinned.requirements):null;
 const canClassExpose=classes.some(c=>w.requirements.some((req,i)=>req>c.stats[i+3]));
 const status=site?
  pinnedValid?(isMatch?'DIRECT_SITE_AND_PINNED_AGREE':'DIRECT_SITE_PINNED_CONFLICT'):'DIRECT_SITE_SOURCE_MISSING':
  pinnedValid?'PINNED_ONLY_NOT_SITE_OBSERVED':'NO_DIRECT_SITE_OR_PINNED';
 return {name:w.name,canonicalId:w.id,status,siteRequirements:site?.requirements??null,
  directEvidence:site?.from??null,pinnedRequirements:pinnedValid?pinned.requirements:null,
  communityRequirements:w.requirements,pinnedCommunityEqual:pinnedValid?equal(w.requirements,pinned.requirements):null,
  canOriginalClassMakeRequirementVisible:canClassExpose};
});
const counts={
 total:records.length,direct:direct.size,nonDirect:records.filter(x=>!x.siteRequirements).length,
 directPinnedMatches:records.filter(x=>x.status==='DIRECT_SITE_AND_PINNED_AGREE').length,
 directPinnedConflicts:records.filter(x=>x.status==='DIRECT_SITE_PINNED_CONFLICT').length,
 directPinnedMissing:records.filter(x=>x.status==='DIRECT_SITE_SOURCE_MISSING').length,
 pinnedOnly:records.filter(x=>x.status==='PINNED_ONLY_NOT_SITE_OBSERVED').length,
 neitherDirectNorPinned:records.filter(x=>x.status==='NO_DIRECT_SITE_OR_PINNED').length,
 allPinnedValid:records.filter(x=>x.pinnedRequirements!==null).length,
 nonDirectPinnedCommunityDisputes:records.filter(x=>!x.siteRequirements&&x.pinnedCommunityEqual===false).length,
 nonDirectClassCouldTrigger:records.filter(x=>!x.siteRequirements&&x.canOriginalClassMakeRequirementVisible).length
};
const result={schemaVersion:1,source:'Explicit pinned public v1.17 regulation snapshot, independent of Tarnished.dev real UI',
 sourcePage:V117_SOURCE_PAGE,sourceCommit:V117_UPSTREAM_COMMIT,sourceInspection:sourceSummary,
 comparatorScope:'v1.17 historical comparison; NOT live game 1.17.2/Regulation 1.17.3 gameplay certified',
 caveat:'Pinned-only numerical requirements are SOURCE CHECKED and MUST NEVER be labeled DIRECT_SITE verified',
 overlaySummary:overlay.summary,counts,
 remaining:records.filter(x=>!x.siteRequirements),rows:records};
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/v117-final-requirement-evidence.json'),JSON.stringify(result,null,2)+'\n');
console.log('[FINAL REQ SOURCE SUMMARY] '+JSON.stringify(counts));
console.log('[FINAL REQ SOURCE OVERLAY] '+JSON.stringify(overlay.summary));
for(const row of result.remaining)console.log('[FINAL REQ NOT DIRECT] '+JSON.stringify(row));
if(counts.direct!==460||counts.nonDirect!==27||counts.directPinnedConflicts!==0||
 counts.directPinnedMissing!==0)throw Error('Hard requirement provenance gate failed');
if(counts.allPinnedValid!==487)
 console.warn('[FINAL REQ SOURCE INCOMPLETE] Only '+counts.allPinnedValid+'/487 records have unambiguous pinned reference; cannot assert 487/487');
