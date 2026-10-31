import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getCatalogCoverage,catalogCoverageCopy,injectCatalogCoverageIntoHomepage}
 from '../scripts/home-catalog-coverage.mjs';

const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const catalog=JSON.parse(read('public/data/community-weapon-catalog.json'));
const home=read('public/index.html');
test('homepage weapon count and DLC source coverage derive from canonical catalog',()=>{
 const coverage=getCatalogCoverage(catalog);
 assert.equal(coverage.weapons,catalog.weapons.length);
 assert.equal(coverage.dlc,catalog.weapons.filter(w=>w.expansion==='Shadow of the Erdtree').length);
 assert.equal(coverage.tarnishedPack,8);
 assert.equal(coverage.tarnishedPackBaseFacts,7);
 assert.equal(coverage.tarnishedPackSecondaryConflicts,1);
 assert.equal(coverage.dlcBaseFacts,catalog.weapons.filter(w=>w.expansion==='Shadow of the Erdtree'&&w.dataCoverage==='base-reference').length);
 const text=catalogCoverageCopy(coverage);
 assert.equal(text.includes('player Attack Ratings'),true);
 assert.equal(text.includes('current-patch game accuracy remain unverified'),true);
 const compiled=injectCatalogCoverageIntoHomepage(home,coverage);
 assert.equal(compiled.includes('<p data-home-weapon-coverage>'+text+'</p>'),true);
 assert.equal(compiled.includes('364 real weapon references'),false);
 assert.equal(compiled.includes('57 DLC requirements-only'),false);
});
test('homepage summaries update if new source records are added, not frozen in HTML',()=>{
 const sample={
  meta:{count:2,dlcCatalogCount:1,dlcBaseFactCount:1,baseCommunityCount:1,tarnishedPackCount:0,tarnishedPackBaseFactCount:0,tarnishedPackSecondarySourceConflictCount:0},
  weapons:[{name:'fictional base weapon'},{
   name:'fictional DLC weapon',expansion:'Shadow of the Erdtree',dataCoverage:'base-reference'}]
 };
 const rendered=injectCatalogCoverageIntoHomepage(home,getCatalogCoverage(sample));
 assert.equal(rendered.includes('Search 2 community-reported'),true);
 assert.equal(rendered.includes('including 1 Shadow of the Erdtree'),true);
 assert.equal(rendered.includes('(1 with sourced +0'),true);
});
test('mismatched source metadata fails closed and never generates misleading totals',()=>{
 const changed=structuredClone(catalog);
 changed.meta.count+=1;
 assert.throws(()=>getCatalogCoverage(changed),/out of sync/);
 const missing=structuredClone(catalog);
 missing.meta.dlcBaseFactCount+=1;
 assert.throws(()=>getCatalogCoverage(missing),/out of sync/);
 assert.throws(()=>getCatalogCoverage({meta:{count:0},weapons:[]}),/Missing/);
 assert.throws(()=>catalogCoverageCopy({weapons:1,dlc:2,dlcBaseFacts:1}),/Invalid/);
});
test('build injector requires exactly one unambiguous marked homepage paragraph',()=>{
 const coverage=getCatalogCoverage(catalog);
 assert.throws(()=>injectCatalogCoverageIntoHomepage('<html></html>',coverage),/exactly one/);
 assert.throws(()=>injectCatalogCoverageIntoHomepage(home+home,coverage),/exactly one/);
});
