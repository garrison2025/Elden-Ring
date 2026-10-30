import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile,stat} from 'node:fs/promises';
import {join,resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../public');
const paths=['','build-planner','class-optimizer','level-rune-calculator','equip-load-calculator','respec-planner','weapon-ar-lab','weapon-ar-validation','validation-status','about','privacy'];
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
