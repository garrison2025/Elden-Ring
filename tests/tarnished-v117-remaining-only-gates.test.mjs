import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {siteVerifiedArmorSubset} from '../public/src/tarnished-armor-eligibility.mjs';
import {TARNISHED_V117_WIDE_ARMOR_GOLDENS} from '../public/src/tarnished-v117-armor-wide.mjs';
import {TARNISHED_V117_ARMOR_RECOVERED} from '../public/src/tarnished-v117-armor-recovered.mjs';
import {TARNISHED_V117_ARMOR_STABLE_METRICS} from '../public/src/tarnished-v117-armor-12-fields.mjs';
import {applyTarnishedV117DirectArmorFields} from '../public/src/tarnished-v117-armor-direct.mjs';
const load=x=>JSON.parse(readFileSync(new URL(x,import.meta.url),'utf8'));
const last=load('../scripts/tarnished-v117-final-remaining-only-manifest.json');
const wide=load('../scripts/tarnished-v117-armor-568-site-observations.json');
const aliases=load('../scripts/tarnished-v117-armor-alias-recovery-10-summary.json');
test('all 19 unresolved source items are counted ONCE, with two duplicates and 17 unavailable exact names',()=>{
 assert.equal(last.reusedFrozenEvidenceOnly,true);
 assert.equal(last.originalArmorRecords,568);
 assert.equal(last.remainingUnapproved,19);
 assert.equal(last.existingSiteWeightPoiseApproved,549);
 assert.equal(last.existingSiteTwelveMetricsApproved,514);
 assert.deepEqual(last.categories,{
  NOT_SELECTABLE_BRAVE_LEGACY:6,DUPLICATE_OR_WRONG_SLOT:2,
  NOT_SELECTABLE_OTHER_LEGACY:5,NOT_SELECTABLE_RAGGED_LEGACY:6
 });
 assert.equal(last.remaining.length,19);
 assert.equal(new Set(last.remaining.map(x=>x.id)).size,19);
 const originalNotObserved=new Set(wide.unobserved.map(x=>x.id));
 const recovered=new Set(aliases.recovered.map(x=>x.id));
 for(const item of last.remaining){
  assert.equal(originalNotObserved.has(item.id),true);
  assert.equal(recovered.has(item.id),false);
  assert.equal(item.approvedWeightPoise,null);
 }
 assert.equal(last.remaining.filter(x=>x.category==='DUPLICATE_OR_WRONG_SLOT').length,2);
 assert.equal(last.separateOpenModules.filter(x=>x.kind==='FUNCTIONAL_PARITY').length,3);
});
test('default armor optimizer includes only site-proven fields, no source-only or attribute-changing defense',()=>{
 const source=[
 ...TARNISHED_V117_WIDE_ARMOR_GOLDENS.map(x=>({
  id:x.id,name:x.name,slot:x.slot,weight:x.weight,
  poise:x.poise,metrics:{poise:x.poise,physical:1,immunity:2}
 })),
 ...TARNISHED_V117_ARMOR_RECOVERED.map(x=>({
  id:x.id,name:x.sourceName,slot:x.sourceSlot,weight:x.weight,
  poise:x.poise,metrics:{poise:x.poise,physical:1,immunity:2}
 })),
 ...last.remaining.map(x=>({
  id:x.id,name:x.name,slot:x.slot,weight:1,
  poise:1,metrics:{poise:1,physical:1,immunity:2}
 }))
 ];
 assert.equal(source.length,568);
 const correct=applyTarnishedV117DirectArmorFields(source).armors;
 assert.equal(siteVerifiedArmorSubset(correct,'poise').accepted.length,549);
 assert.equal(siteVerifiedArmorSubset(correct,'physical').accepted.length,514);
 assert.equal(siteVerifiedArmorSubset(correct,'immunity').accepted.length,514);
 assert.equal(siteVerifiedArmorSubset(correct,'holy').accepted.length,514);
 assert.equal(siteVerifiedArmorSubset(correct,'physical').excluded.length,54);
 for(const x of siteVerifiedArmorSubset(correct,'physical').accepted){
  assert.ok(x.siteDirectFields.physical&&x.siteDirectFields.weight);
 }
 const html=readFileSync(new URL('../public/armor-optimizer/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/src/armor-full-source-app.mjs',import.meta.url),'utf8');
 assert.match(html,/id="armor-full-site-only" checked/);
 assert.match(app,/siteVerifiedArmorSubset\(armors,options.metric\)/);
 assert.match(app,/armors:candidateRows/);
});
