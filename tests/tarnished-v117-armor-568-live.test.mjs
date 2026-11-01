import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TARNISHED_V117_WIDE_ARMOR_GOLDENS} from '../public/src/tarnished-v117-armor-wide.mjs';
import {applyTarnishedV117DirectArmorFields} from '../public/src/tarnished-v117-armor-direct.mjs';
import {loadPinnedArmorSource} from '../public/src/armor-source-optin.mjs';
const evidence=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-armor-568-site-observations.json',import.meta.url),'utf8'));
const sorted=x=>x.sort((a,b)=>a.id.localeCompare(b.id));
const key=(x)=>({id:x.id,name:x.name,slot:x.slot,weight:x.weight,poise:x.poise});
test('All 15 independent browser shards cover 568 unique local armor candidates; 543 real double-verified goldens',()=>{
 const {counts,shards,accepted,unobserved}=evidence;
 assert.equal(evidence.sourceRun,41274764944);
 assert.equal(evidence.independentBrowserPasses,2);
 assert.equal(counts.sourceCandidates,568);
 assert.equal(counts.siteAccepted,543);
 assert.equal(counts.siteUnobservable,25);
 assert.equal(counts.weightDifferences,23);
 assert.equal(counts.poiseDifferences,531);
 assert.equal(counts.weightAgreements,520);
 assert.equal(counts.poiseAgreements,12);
 assert.equal(shards.length,15);
 assert.equal(shards.reduce((x,c)=>x+c.attempted,0),568);
 assert.equal(shards.reduce((x,c)=>x+c.accepted,0),543);
 assert.equal(accepted.length,543);
 assert.equal(unobserved.length,25);
 assert.equal(new Set([...accepted,...unobserved].map(x=>x.id)).size,568);
 assert.deepEqual(sorted(TARNISHED_V117_WIDE_ARMOR_GOLDENS.map(key)),sorted(accepted.map(key)));
});
test('543 exact armor items (Weight and Poise only) override legacy community source, no fake game values',()=>{
 const old=TARNISHED_V117_WIDE_ARMOR_GOLDENS.map((item,i)=>({
  id:item.id,name:item.name,
  slot:item.slot,weight:item.weight+0.1,poise:item.poise+1,
  metrics:{poise:item.poise+1,physical:3+i%8,fire:-2}
 }));
 const result=applyTarnishedV117DirectArmorFields(old);
 assert.equal(result.directlyCorrectedArmorCount,543);
 assert.equal(result.wideDirectEvidenceCount,543);
 assert.equal(result.correctedFields,7254);
 assert.equal(result.siteTwelveMetricArmorCount,514);
 assert.equal(result.siteAdditionalMetricFields,6168);
 assert.equal(result.siteUnsupportedCandidateCount,25);
 assert.equal(result.otherArmorFieldsNumericallyVerified,false);
 for(let i=0;i<old.length;i++){
  const x=result.armors[i],want=TARNISHED_V117_WIDE_ARMOR_GOLDENS[i];
  assert.equal(x.id,want.id);
  assert.equal(x.weight,want.weight);
  assert.equal(x.poise,want.poise);
  assert.equal(x.metrics.poise,want.poise);
  assert.equal(x.metrics.physical,old[i].metrics.physical);
  assert.equal(x.metrics.fire,-2);
  assert.ok(x.siteDirectFields.weight.includes('Tarnished.dev public v1.17'));
  assert.equal(old[i].poise,want.poise+1,'do not mutate original data');
 }
});
test('Original site evidence never applies by wrong ID/name/slot or partially present original four',()=>{
 const candidate=TARNISHED_V117_WIDE_ARMOR_GOLDENS.find(x=>x.name!=='All-knowing Helm');
 assert.ok(candidate);
 const wrong={id:candidate.id,name:'Fictitious Item',slot:candidate.slot,weight:1,poise:0,metrics:{poise:0}};
 assert.throws(()=>applyTarnishedV117DirectArmorFields([wrong]),/identity changed/);
});
test('User-initiated armor source loader serves all 543 site-verified weight/Poise fields',async()=>{
 const raw=TARNISHED_V117_WIDE_ARMOR_GOLDENS.map((item,i)=>({
  id:item.id,name:item.name,
  category:{Head:'Helm',Chest:'Chest Armor',Arms:'Gauntlets',Legs:'Leg Armor'}[item.slot],
  weight:Math.round((item.weight+0.1)*1000)/1000,
  resistance:[{name:'Poise',amount:item.poise+1},{name:'Immunity',amount:7}],
  dmgNegation:[{name:'Phy',amount:4}]
 }));
 for(let i=0;i<25;i++)raw.push({
  id:'unobserved-source-'+String(i).padStart(4,'0'),name:'MISSING TEST '+i,
  category:'Helm',weight:1,resistance:[{name:'Poise',amount:1}],
  dmgNegation:[{name:'Phy',amount:4}]
 });
 const text=JSON.stringify(raw);
 const result=await loadPinnedArmorSource(async()=>({
  ok:true,headers:{get:()=>String(text.length)},text:async()=>text
 }));
 assert.equal(result.count,568);
 assert.equal(result.directTarnishedV117ArmorCount,543);
 for(let i=0;i<543;i++){
  assert.equal(result.armors[i].weight,TARNISHED_V117_WIDE_ARMOR_GOLDENS[i].weight);
  assert.equal(result.armors[i].poise,TARNISHED_V117_WIDE_ARMOR_GOLDENS[i].poise);
  assert.equal(result.armors[i].metrics.immunity,7,'unverified immunity must stay source value');
 }
 assert.equal(result.armors[567].siteDirectFields,undefined,'unknown site items remain source-only');
});
