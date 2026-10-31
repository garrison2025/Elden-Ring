import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const WITHHELD=[
 'weapon-ar-lab','weapon-ar-validation','weapon-data-workbench',
 'weapon-database','weapon-ar-calculator','validation-status','respec-planner','weapon-requirements',
 'armor-optimizer','weapon-upgrade-calculator'
];
const INDEXABLE=[
 '/','/class-optimizer/','/equip-load-calculator/','/level-rune-calculator/'
];
const PUBLIC_BUT_WITHHELD=['about','build-planner','privacy','updates'];
const strict=new Set([
 'weapon-ar-lab','weapon-ar-validation','weapon-data-workbench','weapon-ar-calculator','validation-status'
]);
const site='https://elden-test.example.org';

async function fixture(approved,cloudflareBranch=''){
 const tmp=await mkdtemp(join(tmpdir(),'elden-seo-gate-'));
 await cp(new URL('../public/',import.meta.url),join(tmp,'public'),{recursive:true});
 await cp(new URL('../scripts/',import.meta.url),join(tmp,'scripts'),{recursive:true});
 // Simulate an accidental future removal of the research-page source meta:
 // the generated output must STILL be noindex and omitted from sitemap.
 for(const slug of WITHHELD){
  const path=join(tmp,'public',slug,'index.html'),html=await readFile(path,'utf8');
  await writeFile(path,html.replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/gi,''));
 }
 const result=spawnSync(process.execPath,['scripts/build.mjs'],{
  cwd:tmp,encoding:'utf8',env:{...process.env,SITE_URL:site,
   RELEASE_INDEX_APPROVED:approved?'1':'',GITHUB_SHA:'',CF_PAGES_COMMIT_SHA:'',
   CF_PAGES:cloudflareBranch?'1':'',CF_PAGES_BRANCH:cloudflareBranch}
 });
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
 return tmp;
}

test('approved indexing exposes only reviewed public routes; research pages remain noindex',async()=>{
 const tmp=await fixture(true);
 try{
  const dist=join(tmp,'dist');
  const sitemap=await readFile(join(dist,'sitemap.xml'),'utf8');
  const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
  assert.deepEqual(urls.sort(),INDEXABLE.map(path=>site+path).sort());
  const headers=await readFile(join(dist,'_headers'),'utf8');
  for(const slug of WITHHELD){
   const html=await readFile(join(dist,slug,'index.html'),'utf8');
   const metas=[...html.matchAll(/<meta name="robots" content="([^"]+)">/g)];
   assert.equal(metas.length,1,'Exactly one robot meta '+slug);
   assert.equal(metas[0][1],strict.has(slug)?'noindex,nofollow':'noindex,follow',slug);
   assert.ok(!html.includes('<link rel="canonical"'),slug+' must have no canonical');
   assert.ok(!sitemap.includes(site+'/'+slug+'/'),slug+' must not be in sitemap');
   assert.ok(headers.includes('/'+slug+'/*\n  X-Robots-Tag: noindex'),slug+' requires header defense');
  }
  for(const slug of PUBLIC_BUT_WITHHELD){
   const html=await readFile(join(dist,slug,'index.html'),'utf8');
   assert.equal((html.match(/<meta name="robots" content="noindex,follow">/g)||[]).length,1,
    'Not all public pages are released in wave 1: '+slug);
   assert.ok(!html.includes('<link rel="canonical"'),'No accidental canonical '+slug);
   assert.ok(headers.includes('/'+slug+'/*\n  X-Robots-Tag: noindex'),'HTTP noindex '+slug);
  }
  const root=await readFile(join(dist,'index.html'),'utf8');
  const normal=await readFile(join(dist,'class-optimizer/index.html'),'utf8');
  for(const [path,html] of [['/',root],['/class-optimizer/',normal]]){
   assert.equal((html.match(/<meta name="robots" content="index,follow">/g)||[]).length,1);
   assert.ok(html.includes('<link rel="canonical" href="'+site+path+'">'));
  }
  const robots=await readFile(join(dist,'robots.txt'),'utf8');
  assert.ok(robots.includes('Sitemap: '+site+'/sitemap.xml'));
  const info=JSON.parse(await readFile(join(dist,'deployment-info.json'),'utf8'));
  assert.equal(info.researchNoindex,false);
 }finally{await rm(tmp,{recursive:true,force:true});}
});

test('default research deployment noindexes ALL routes at HTML and Cloudflare header layers',async()=>{
 const tmp=await fixture(false);
 try{
  const dist=join(tmp,'dist'),headers=await readFile(join(dist,'_headers'),'utf8');
  assert.equal(headers,'/*\n  X-Robots-Tag: noindex\n');
  for(const path of ['index.html','build-planner/index.html','weapon-ar-lab/index.html',
    'weapon-data-workbench/index.html','weapon-database/index.html']){
   const html=await readFile(join(dist,path),'utf8');
   assert.equal((html.match(/<meta name="robots" content="noindex,(?:follow|nofollow)">/g)||[]).length,1);
   assert.ok(!html.includes('<link rel="canonical"'));
  }
  const robots=await readFile(join(dist,'robots.txt'),'utf8');
  assert.ok(!robots.includes('Sitemap:'));
  const info=JSON.parse(await readFile(join(dist,'deployment-info.json'),'utf8'));
  assert.equal(info.researchNoindex,true);
 }finally{await rm(tmp,{recursive:true,force:true});}
});

test('Cloudflare production main auto-publishes exactly the four audited first-wave routes without dashboard flags',async()=>{
 const tmp=await fixture(false,'main');
 try{
  const dist=join(tmp,'dist');
  const sitemap=await readFile(join(dist,'sitemap.xml'),'utf8');
  const origin='https://elden-ring-5i9.pages.dev';
  assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]).sort(),
   INDEXABLE.map(p=>origin+p).sort());
  const info=JSON.parse(await readFile(join(dist,'deployment-info.json'),'utf8'));
  assert.equal(info.researchNoindex,false);
  assert.equal(info.releaseMode,'cloudflare-main-first-wave');
  assert.deepEqual(info.indexedRoutes,INDEXABLE.slice().sort());
  assert.ok((await readFile(join(dist,'index.html'),'utf8')).includes(
   '<link rel="canonical" href="'+origin+'/">'));
  const headers=await readFile(join(dist,'_headers'),'utf8');
  for(const slug of [...WITHHELD,...PUBLIC_BUT_WITHHELD])
   assert.ok(headers.includes('/'+slug+'/*\n  X-Robots-Tag: noindex'),
    'Noindex header for non-approved production route '+slug);
 }finally{await rm(tmp,{recursive:true,force:true});}
});
test('Cloudflare preview or unapproved CI remains wholly noindex even if SITE_URL is available',async()=>{
 const tmp=await fixture(false,'feat/seo-first-wave-production-allowlist-20261031');
 try{
  const dist=join(tmp,'dist'),html=await readFile(join(dist,'index.html'),'utf8');
  assert.match(html,/noindex,follow/);
  assert.ok(!html.includes('<link rel="canonical"'));
  assert.equal(await readFile(join(dist,'_headers'),'utf8'),
   '/*\n  X-Robots-Tag: noindex\n');
  await assert.rejects((await import('node:fs/promises')).access(join(dist,'sitemap.xml')));
  const info=JSON.parse(await readFile(join(dist,'deployment-info.json'),'utf8'));
  assert.equal(info.researchNoindex,true);
  assert.deepEqual(info.indexedRoutes,[]);
 }finally{await rm(tmp,{recursive:true,force:true});}
});
