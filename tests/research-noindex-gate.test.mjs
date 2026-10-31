import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('research site requires explicit indexing approval and has noindex-readable robots',async()=>{
 const build=await read('scripts/build.mjs');
 assert.match(build,/RELEASE_INDEX_APPROVED==='1'/);
 assert.match(build,/const indexable=/);
 assert.match(build,/permanentlyWithheld\.includes\(uri\)/);
 assert.match(build,/noindex,follow/);
 assert.match(build,/User-agent: \*/);
 assert.match(build,/Allow: \//);
 assert.match(build,/if\(releaseEnabled\)/);
 assert.match(build,/CF_PAGES_BRANCH==='main'/);
 assert.match(build,/RELEASE_INDEX_ROUTES/);
 const page=await read('public/weapon-data-workbench/index.html');
 assert.match(page,/noindex,nofollow/);
});
test('catalog level change refreshes the actual AR handoff link',async()=>{
 const app=await read('public/src/weapon-catalog-app.mjs');
 assert.match(app,/catalog-upgrade-level'\)\.addEventListener\('change',renderDetails\)/);
 assert.match(app,/makeQuickArCalculatorUrl\(chosen.name,arStats,/);
});
test('game client observation UI is offline and blocks demo evidence masquerading as real',async()=>{
 const html=await read('public/weapon-data-workbench/index.html');
 const app=await read('public/src/ar-workbench-app.mjs');
 for(const field of ['arw-observation-app','arw-observation-reg','arw-observation-platform',
  'arw-observation-date','arw-observation-grip','arw-observed-total',
  'arw-observation-reference','arw-observation-export'])assert.ok(html.includes(field));
 assert.match(app,/makeUnreviewedArObservation/);
 assert.match(app,/synthetic:syntheticMode/);
 assert.match(app,/candidateCalculation\.differenceCandidateMinusObserved/);
});

test('actual build with SITE_URL still emits noindex and never produces an index sitemap',async()=>{
 const {mkdtemp,mkdir,cp,rm,readFile,access}=await import('node:fs/promises');
 const {tmpdir}=await import('node:os');
 const {join}=await import('node:path');
 const {spawnSync}=await import('node:child_process');
 const temp=await mkdtemp(join(tmpdir(),'elden-research-build-'));
 try{
  await cp(new URL('../public/',import.meta.url),join(temp,'public'),{recursive:true});
  await cp(new URL('../scripts/',import.meta.url),join(temp,'scripts'),{recursive:true});
  const run=spawnSync(process.execPath,['scripts/build.mjs'],{
   cwd:temp,encoding:'utf8',
   env:{...process.env,SITE_URL:'https://research.example.org',RELEASE_INDEX_APPROVED:''}
  });
  assert.equal(run.status,0,run.stdout+'\n'+run.stderr);
  const home=await readFile(join(temp,'dist/index.html'),'utf8');
  const tool=await readFile(join(temp,'dist/weapon-data-workbench/index.html'),'utf8');
  const robots=await readFile(join(temp,'dist/robots.txt'),'utf8');
  assert.match(home,/<meta name="robots" content="noindex,follow">/);
  assert.match(tool,/<meta name="robots" content="noindex,nofollow">/);
  assert.match(robots,/Allow: \/\n/);
  assert.doesNotMatch(robots,/Sitemap:/);
  await assert.rejects(access(join(temp,'dist/sitemap.xml')));
 }finally{await rm(temp,{recursive:true,force:true});}
});
