import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile,stat} from 'node:fs/promises';
import {join,resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../public');
const paths=['','build-planner','class-optimizer','level-rune-calculator','equip-load-calculator','respec-planner','weapon-requirements','armor-optimizer','weapon-upgrade-calculator','weapon-ar-lab','weapon-ar-validation','weapon-data-workbench','weapon-database','validation-status','about','privacy'];
for (const slug of paths){
  test(`static page ${slug||'/'} has usable metadata and local assets`,async()=>{
    const p=join(root,slug,'index.html'),html=await readFile(p,'utf8');
    assert.match(html,/<html lang="en">/);
    assert.match(html,/<title>[^<]+<\/title>/);
    assert.match(html,/<meta name="description" content="[^"]+"/);
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
    for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
      const ref=match[1];if(ref.startsWith('#')||/^(https?:|mailto:|data:|javascript:)/.test(ref))continue;
      const path=ref.split(/[?#]/)[0];if(!path)continue;
      const local=resolve(dirname(p),decodeURI(path));
      assert.ok(local.startsWith(root+'/')||local===root,`path escapes site: ${ref}`);
      const file=(await stat(local)).isDirectory()?join(local,'index.html'):local;
      assert.ok((await stat(file)).isFile(),`missing local file ${ref}`);
    }
  });
}
test('research-only AR cannot be indexed',async()=>{
 const p=await readFile(join(root,'weapon-ar-lab/index.html'),'utf8');
 assert.match(p,/noindex/);assert.match(p,/SYNTHETIC DATA/);
});

test('cross-tool links and optional budgets have wired inputs and outputs',async()=>{
 const read=async p=>readFile(join(root,p,'index.html'),'utf8');
 const build=await read('build-planner');
 const rune=await read('level-rune-calculator');
 const origin=await read('class-optimizer');
 const equip=await read('equip-load-calculator');
 for(const id of ['class-compare-link','rune-plan-link'])assert.ok(build.includes(`id="${id}"`));
 for(const id of ['farm-runs','runes-per-run'])assert.ok(rune.includes(`id="${id}"`));
 assert.ok(origin.includes('id="edit-build-link"'));
 assert.ok(equip.includes('id="load-guidance"'));
 const app=await readFile(join(root,'src/app.mjs'),'utf8');
 assert.match(app,/farmingRunsNeeded\(/);
 assert.match(app,/parseSharedStats\(/);
 assert.match(app,/function clearValues\(/);
});

test('respec stays out of early SEO and passes build handoff',async()=>{
 const respec=await readFile(join(root,'respec-planner/index.html'),'utf8');
 const js=await readFile(join(root,'src/respec-app.mjs'),'utf8');
 const build=await readFile(join(root,'build-planner/index.html'),'utf8');
 const home=await readFile(join(root,'index.html'),'utf8');
 const script=await readFile(resolve(root,'../scripts/build.mjs'),'utf8');
 for(const item of ['origin','before-grid','after-grid','respec-state','respec-build-link','feedback'])
   assert.match(respec,new RegExp('id="'+item+'"'));
 assert.match(js,/compareRespec/);
 assert.match(build,/id="respec-link"/);
 assert.match(home,/href="respec-planner\/"/);
 assert.match(script,/uri==='respec-planner'/);
});
test('build-local save is explicitly user initiated and has erase control',async()=>{
 const build=await readFile(join(root,'build-planner/index.html'),'utf8');
 const app=await readFile(join(root,'src/app.mjs'),'utf8');
 for(const id of ['save-build','load-build','delete-build'])assert.match(build,new RegExp('id="'+id+'"'));
 assert.match(app,/localStorage\.removeItem\(savedKey\)/);
 assert.match(app,/localStorage\.setItem\(savedKey/);
});

test('AR evidence comparison remains noindex with offline data inputs',async()=>{
 const p=await readFile(join(root,'weapon-ar-validation/index.html'),'utf8');
 const build=await readFile(resolve(root,'../scripts/build.mjs'),'utf8');
 assert.match(p,/<meta name="robots" content="noindex,nofollow">/);
 for(const id of ['verification-profile','verification-cases','run-verification','download-report','download-csv'])
   assert.ok(p.includes('id="'+id+'"'));
 assert.match(build,/uri==='weapon-ar-validation'/);
 const s=await readFile(join(root,'src/ar-validation-app.mjs'),'utf8');
 assert.match(s,/compareArObservations/);
 assert.match(s,/URL\.createObjectURL/);
});

test('manual weapon requirement planner is reachable but initially noindex',async()=>{
 const page=await readFile(join(root,'weapon-requirements/index.html'),'utf8');
 const script=await readFile(join(root,'src/requirements-app.mjs'),'utf8');
 const home=await readFile(join(root,'index.html'),'utf8');
 const build=await readFile(join(root,'build-planner/index.html'),'utf8');
 const siteBuild=await readFile(resolve(root,'../scripts/build.mjs'),'utf8');
 assert.match(page,/noindex,follow/);
 for(const id of ['requirement-player','requirement-weapon','two-hand-eligible','requirements-rows','copy-requirements','restore-example'])
  assert.ok(page.includes('id="'+id+'"'));
 assert.match(script,/compareWeaponRequirements/);
 assert.match(home,/href="weapon-requirements\/"/);
 assert.match(build,/id="weapon-req-link"/);
 assert.match(siteBuild,/uri==='weapon-requirements'/);
});

test('armor optimizer has dedicated manual input page and noindex gate',async()=>{
 const html=await readFile(join(root,'armor-optimizer/index.html'),'utf8');
 const site=await readFile(resolve(root,'../scripts/build.mjs'),'utf8');
 const app=await readFile(join(root,'src/armor-app.mjs'),'utf8');
 assert.match(html,/noindex,follow/);
 for(const id of ['armor-csv','armor-file','optimize-armor','armor-results','armor-equip-link'])
   assert.ok(html.includes('id="'+id+'"'));
 assert.match(site,/uri==='armor-optimizer'/);
 assert.match(app,/optimizeArmor/);
 assert.match((await readFile(join(root,'index.html'),'utf8')),/href="armor-optimizer\/"/);
 assert.match((await readFile(join(root,'equip-load-calculator/index.html'),'utf8')),/href="\.\.\/armor-optimizer\/"/);
});

test('weapon material planner has input controls, local engine and dedicated noindex',async()=>{
 const html=await readFile(join(root,'weapon-upgrade-calculator/index.html'),'utf8');
 const js=await readFile(join(root,'src/upgrade-materials-app.mjs'),'utf8');
 const build=await readFile(resolve(root,'../scripts/build.mjs'),'utf8');
 for(const id of ['upgrade-track','upgrade-from','upgrade-to','inventory-input','material-rows','upgrade-steps','export-list'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/noindex,follow/);
 assert.match(build,/uri==='weapon-upgrade-calculator'/);
 assert.match(js,/planUpgradeMaterials/);
 assert.match((await readFile(join(root,'index.html'),'utf8')),/href="weapon-upgrade-calculator\/"/);
});

test('pinned community v1.17 source is explicitly opt-in and AR remains noindex',async()=>{
 const html=await readFile(join(root,'weapon-data-workbench/index.html'),'utf8');
 const app=await readFile(join(root,'src/ar-workbench-app.mjs'),'utf8');
 const source=await readFile(join(root,'src/upstream-regulation-v117.mjs'),'utf8');
 const catalog=await readFile(join(root,'weapon-database/index.html'),'utf8');
 const catalogApp=await readFile(join(root,'src/weapon-catalog-app.mjs'),'utf8');
 assert.match(html,/id="arw-load-upstream"/);
 assert.match(html,/noindex,nofollow/);
 assert.match(html,/COPYING/);
 assert.match(app,/downloadV117Source\(fetch/);
 assert.match(app,/cancelPinnedLoad/);
 assert.match(app,/if\(initialWeaponQuery&&!syntheticMode\)/);
 assert.match(catalog,/id="catalog-ar-source-link"/);
 assert.match(catalogApp,/encodeURIComponent\(chosen.name\)/);
 assert.match(source,/JSON\.parse\(text\)/);
 assert.doesNotMatch(source,/eval\(|new Function\(/);
 assert.doesNotMatch(app,/eval\(|new Function\(/);
});
test('local AR workbench is noindexed, worker-based and reachable only as research',async()=>{
 const page=await readFile(join(root,'weapon-data-workbench/index.html'),'utf8');
 const app=await readFile(join(root,'src/ar-workbench-app.mjs'),'utf8');
 const worker=await readFile(join(root,'src/ar-workbench-worker.mjs'),'utf8');
 const build=await readFile(resolve(root,'../scripts/build.mjs'),'utf8');
 assert.match(page,/noindex,nofollow/);
 for(const id of ['arw-file','arw-source','arw-search','arw-select','arw-upgrade','arw-comparison','arw-components'])
  assert.ok(page.includes('id="'+id+'"'));
 assert.match(app,/new Worker/);
 assert.match(worker,/JSON\.parse/);
 assert.doesNotMatch(worker,/fetch\(/);
 assert.match(build,/uri==='weapon-data-workbench'/);
 assert.match((await readFile(join(root,'weapon-ar-lab/index.html'),'utf8')),/weapon-data-workbench/);
});

test('two-weapon AR workbench exposes paired selectors with stale-result revision gates',async()=>{
 const html=await readFile(join(root,'weapon-data-workbench/index.html'),'utf8');
 const app=await readFile(join(root,'src/ar-workbench-app.mjs'),'utf8');
 const worker=await readFile(join(root,'src/ar-workbench-worker.mjs'),'utf8');
 for(const id of ['arw-compare-select','arw-compare-upgrade','arw-compare-grip','arw-compare-run','arw-compare-results','arw-pair-rows'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(app,/m\.requestId!==comparisonRevision/);
 assert.match(app,/m\.requestId!==gripRevision/);
 assert.match(worker,/case 'compare-weapons'/);
 assert.match(html,/Higher total AR is not necessarily higher damage/);
});

test('source math audit has worker integration, export and noindex gate',async()=>{
 const html=await readFile(join(root,'weapon-data-workbench/index.html'),'utf8');
 const app=await readFile(join(root,'src/ar-workbench-app.mjs'),'utf8');
 const worker=await readFile(join(root,'src/ar-workbench-worker.mjs'),'utf8');
 for(const id of ['arw-parity-run','arw-parity-download','arw-parity-results','arw-parity-total',
  'arw-parity-converted','arw-parity-cases','arw-parity-mismatches','arw-parity-unsupported',
  'arw-parity-reasons'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/noindex,nofollow/);
 assert.match(app,/send\(\{op:'math-audit'\}\)/);
 assert.match(app,/math-audit-progress/);
 assert.match(app,/math-audit-complete/);
 assert.match(worker,/case 'math-audit'/);
 assert.match(worker,/auditRawMathParity/);
});
test('AR workbench includes local whole-dataset audit and anonymous report export',async()=>{
 const html=await readFile(join(root,'weapon-data-workbench/index.html'),'utf8');
 const app=await readFile(join(root,'src/ar-workbench-app.mjs'),'utf8');
 const worker=await readFile(join(root,'src/ar-workbench-worker.mjs'),'utf8');
 for(const id of ['arw-audit-run','arw-audit-download','arw-audit-results','arw-audit-reasons',
  'arw-audit-feedback','arw-audit-review','arw-audit-limited','arw-audit-scope-reasons'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.match(worker,/case 'audit'/);
 assert.match(worker,/audit-progress/);
 assert.match(app,/scopeReview/);
 assert.match(app,/arw-audit-download/);
 assert.match(html,/Not a publication pass/);
});

test('real community weapon database ships a sourced, partly complete dataset but never AR certification',async()=>{
 const html=await readFile(join(root,'weapon-database/index.html'),'utf8');
 const app=await readFile(join(root,'src/weapon-catalog-app.mjs'),'utf8');
 const build=await readFile(resolve(root,'../scripts/build.mjs'),'utf8');
 assert.match(html,/noindex,follow/);
 for(const id of ['catalog-search','catalog-category','catalog-list','catalog-details','catalog-required','catalog-requirements-link'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.match(html,/not verified for Regulation 1.17.3/i);
 assert.match(html,/community dataset/);
 assert.match(app,/community-weapon-catalog\.json/);
 assert.match(build,/uri==='weapon-database'/);
 assert.match((await readFile(join(root,'index.html'),'utf8')),/href="weapon-database\/"/);
});

test('character build seamlessly passes five combat stats to real community weapon database',async()=>{
 const html=await readFile(join(root,'build-planner/index.html'),'utf8');
 const app=await readFile(join(root,'src/app.mjs'),'utf8');
 const catalog=await readFile(join(root,'src/weapon-catalog-app.mjs'),'utf8');
 assert.match(html,/id="weapon-catalog-link"/);
 assert.match(app,/weapon-catalog-link/);
 assert.match(app,/queryURL\('\.\.\/weapon-database\/',\{/);
 assert.match(app,/origin:current\.name,stats:v\.join\(','\)/);
 assert.match(app,/weapon:selectedWeaponId/);
 assert.match(catalog,/params\.get\('stats'\)/);
 assert.match(catalog,/slice\(3\)/);
});

test('real weapon database exposes combinable character-wield, damage-type and weight filters',async()=>{
 const html=await readFile(join(root,'weapon-database/index.html'),'utf8');
 const app=await readFile(join(root,'src/weapon-catalog-app.mjs'),'utf8');
 for(const id of ['catalog-wield','catalog-damage-filter','catalog-max-weight','catalog-stats'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(app,/searchCatalog\(catalog\.weapons/);
 assert.match(app,/readStats\(\)/);
 assert.match(html,/not a guarantee for paired\/special/);
});
