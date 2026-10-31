import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildV117CatalogOverlay} from '../public/src/v117-catalog-overlay.mjs';
import {buildV117ReconciliationQueue,v117ReconciliationCsv} from '../public/src/v117-reconciliation-queue.mjs';

const catalog=()=>({weapons:[
 {id:'unknown',name:'Missing Shield',category:'shield',attack:null,weight:null,
  requirements:[11,0,0,0,0],flags:['source-v117-neutral-requirements-only']},
 {id:'dispute',name:'Difference Blade',category:'sword',attack:[75,0,50,0,0],
  weight:5,requirements:[12,12,0,0,0],flags:['v117-community-attack-conflict']},
 {id:'flag',name:'Old Conflict',category:'sword',attack:[80,0,0,0,0],
  weight:3,requirements:[10,0,0,0,0],flags:['v117-community-attack-conflict']},
 {id:'no-match',name:'Other Weapon',category:'sword',attack:null,weight:null,
  requirements:null,flags:[]}
]});
const source=()=>({weapons:[
 {weaponName:'Missing Shield',affinityId:-1,reinforceTypeId:1,attack:[[0,78]],requirements:{str:11}},
 {weaponName:'Difference Blade',affinityId:0,reinforceTypeId:1,attack:[[0,75],[2,22]],requirements:{str:12,dex:15}},
 {weaponName:'Old Conflict',affinityId:0,reinforceTypeId:1,attack:[[0,80]],requirements:{str:10}}
],reinforceTypes:{1:[{attack:{0:1,2:1}}]}});

test('source-only gaps remain separate attack and unknown-weight questions',()=>{
 const c=catalog(),snapshot=structuredClone(c);
 const rows=buildV117ReconciliationQueue(c,buildV117CatalogOverlay(c,source()));
 const cases=rows.filter(r=>r.name==='Missing Shield');
 assert.deepEqual(cases.map(r=>r.reviewField),['base_attack','weight']);
 assert.equal(cases[0].pinnedV117Value,'78 / 0 / 0 / 0 / 0');
 assert.equal(cases[0].communityValue,'UNKNOWN');
 assert.equal(cases[1].pinnedV117Value,'UNKNOWN');
 assert.ok(rows.every(r=>r.reviewStatus==='UNREVIEWED'));
 assert.deepEqual(c,snapshot);
});
test('different attack and requirements become distinct cases; flags remain open',()=>{
 const rows=buildV117ReconciliationQueue(catalog(),buildV117CatalogOverlay(catalog(),source()));
 assert.deepEqual(rows.filter(r=>r.name==='Difference Blade').map(r=>r.reviewField),
 ['base_attack','minimum_requirements']);
 assert.equal(rows.find(r=>r.name==='Old Conflict').reviewField,'legacy_source_dispute');
 assert.equal(rows.find(r=>r.name==='Other Weapon').reviewField,'source_mapping');
 assert.equal(rows.length,6);
});
test('CSV contains only user-requested audit rows, is Excel-safe and not claim game parity',()=>{
 const rows=buildV117ReconciliationQueue(catalog(),buildV117CatalogOverlay(catalog(),source()));
 const csv=v117ReconciliationCsv(rows);
 assert.match(csv,/UNREVIEWED/);
 assert.match(csv,/minimum_requirements/);
 assert.match(csv,/Pinned v1.17 snapshot has no validated weapon weight/);
 assert.match(csv,/^\uFEFF/);
 const injection=v117ReconciliationCsv([{name:' =HYPERLINK("https://evil")',
  category:'@SUM(1,2)',reviewField:'base_attack'}]);
 assert.ok(injection.includes("' =HYPERLINK")===false);
 assert.ok(injection.includes("'@SUM(1,2)"));
 assert.ok(injection.includes("' =HYPERLINK")===false);
 assert.match(injection,/\"' =HYPERLINK/);
 assert.throws(()=>v117ReconciliationCsv(null),TypeError);
 assert.throws(()=>buildV117ReconciliationQueue(catalog(),null),TypeError);
});
test('source review is user-triggered and CSV download is disabled until the source loads',()=>{
 const page=readFileSync(new URL('../public/weapon-database/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/src/weapon-catalog-app.mjs',import.meta.url),'utf8');
 assert.match(page,/id="catalog-v117-export"[^>]*disabled/);
 assert.match(app,/buildV117ReconciliationQueue\(catalog,v117Overlay\)/);
 assert.match(app,/catalog-v117-export'\)\.disabled=false/);
 assert.match(app,/v117ReconciliationCsv\(rows\)/);
 assert.match(app,/URL\.revokeObjectURL\(url\)/);
});
