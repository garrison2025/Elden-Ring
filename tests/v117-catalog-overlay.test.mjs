import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildV117CatalogOverlay} from '../public/src/v117-catalog-overlay.mjs';
const catalog=()=>({weapons:[
 {id:'a',name:'Albinauric Shield',attack:null,weight:null,requirements:[11,0,0,0,0],
  flags:['source-v117-neutral-requirements-only']},
 {id:'b',name:'Fire Knight’s Shortsword',attack:[75,0,32,0,0],weight:2,
  requirements:[12,12,0,0,0],flags:['v117-community-attack-conflict']},
 {id:'c',name:'Unlisted Thing',attack:null,weight:null,requirements:null,flags:[]}
]});
const source=()=>({weapons:[
 {name:'Albinauric Shield',weaponName:'Albinauric Shield',affinityId:-1,
  reinforceTypeId:1,attack:[[0,78]],requirements:{str:11}},
 {name:"Fire Knight's Shortsword",weaponName:"Fire Knight's Shortsword",
  affinityId:0,reinforceTypeId:2,attack:[[0,75],[2,22]],requirements:{str:12,dex:15}},
 {name:"Flame Art Fire Knight's Shortsword",weaponName:"Fire Knight's Shortsword",
  affinityId:7,reinforceTypeId:3,attack:[[0,85],[2,60]],requirements:{str:12,dex:15}}
],reinforceTypes:{1:[{attack:{0:1}}],2:[{attack:{0:1,2:1}}],
 3:[{attack:{0:1,2:1}}]}});
test('72-type records receive an independent versioned +0 source view, not invented canonical data/weight',()=>{
 const c=catalog(),before=structuredClone(c),r=buildV117CatalogOverlay(c,source());
 assert.equal(r.summary.sourceMapped,2);
 assert.equal(r.summary.sourceOnlyMapped,1);
 assert.equal(r.summary.flaggedDisputesMapped,1);
 assert.equal(r.summary.neutralAttackDifferences,1);
 assert.equal(r.summary.neutralRequirementDifferences,1);
 assert.equal(r.summary.anyNumericalDifferences,1);
 assert.equal(r.summary.unflaggedNumericalDifferences,0);
 assert.equal(r.summary.missing,1);
 const a=r.rows.get('a');
 assert.deepEqual(a.attack,[78,0,0,0,0]);
 assert.deepEqual(a.requirements,[11,0,0,0,0]);
 assert.equal(a.referenceWeight,null);
 assert.equal(a.communityWeight,null);
 assert.equal(a.sourceOnly,true);
 assert.equal(a.status,'pinned-v117-neutral-reference');
 assert.deepEqual(c,before,'Published community source must not be mutated');
});
test('conflicting requirement/attack are visible; neutral +0 ignores infused siblings',()=>{
 const r=buildV117CatalogOverlay(catalog(),source());
 const b=r.rows.get('b');
 assert.deepEqual(b.attack,[75,0,22,0,0]);
 assert.deepEqual(b.requirements,[12,15,0,0,0]);
 assert.equal(b.attackDiff,true);
 assert.equal(b.requirementDiff,true);
 assert.equal(b.flaggedSourceDispute,true);
 assert.deepEqual(b.communityAttack,[75,0,32,0,0]);
});
test('ambiguity, missing +0 multiplier, invalid requirements and missing names fail closed',()=>{
 const c=catalog(),s=source();
 s.weapons.push({...s.weapons[0],name:'Second neutral',affinityId:0});
 assert.equal(buildV117CatalogOverlay(c,s).rows.get('a').status,'ambiguous-source');
 s.weapons.pop();
 delete s.reinforceTypes['2'][0].attack[2];
 assert.equal(buildV117CatalogOverlay(c,s).rows.get('b').status,'incomplete-source');
 s.reinforceTypes['2'][0].attack[2]=1;
 s.weapons[1].requirements.dex=1000;
 assert.equal(buildV117CatalogOverlay(c,s).rows.get('b').status,'incomplete-source');
 assert.equal(buildV117CatalogOverlay(c,s).rows.get('c').status,'no-source');
});
test('strict inputs reject malformed catalog or missing source reinforcement tables',()=>{
 assert.throws(()=>buildV117CatalogOverlay(null,source()),RangeError);
 assert.throws(()=>buildV117CatalogOverlay(catalog(),{}),RangeError);
 assert.throws(()=>buildV117CatalogOverlay(catalog(),{weapons:[],reinforceTypes:{}}),RangeError);
});
test('page only requests 3296 source variants after explicit user click, never promotes weight or overwrites canonical source',()=>{
 const html=readFileSync(new URL('../public/weapon-database/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/src/weapon-catalog-app.mjs',import.meta.url),'utf8');
 for(const id of ['catalog-v117-load','catalog-v117-panel','catalog-v117-filter','catalog-v117-attack',
  'catalog-v117-requirements','catalog-v117-differences','catalog-v117-status'])
  assert.match(html,new RegExp('id="'+id+'"'),id);
 assert.match(app,/\$\('catalog-v117-load'\)\.addEventListener\('click',async/);
 assert.match(app,/downloadV117Source\(fetch\)/);
 assert.match(app,/v117Overlay=overlay/);
 assert.match(app,/renderV117SourceFacts/);
 assert.match(app,/searchCatalog\(filteredWeapons/);
 assert.match(app,/sourceFilter==='attack-difference'/);
 assert.match(app,/sourceFilter==='requirement-difference'/);
 assert.match(app,/sourceFilter==='any-difference'/);
 assert.match(app,/catalog-v117-filter'\)\.disabled=false/);
 assert.match(html,/establish weapon weight/);
});
