import {cp,mkdir,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {injectToolNavigation} from './navigation.mjs';
import {getCatalogCoverage,injectCatalogCoverageIntoHomepage} from './home-catalog-coverage.mjs';
const root=process.cwd(),dist=path.join(root,'dist'),source=path.join(root,'public');
const url=(process.env.SITE_URL||'').trim().replace(/\/$/,'');
// Research deployment is noindex by default even when SITE_URL is configured.
// Do not enable indexing without a deliberate, separately reviewed release.
const indexApproved=process.env.RELEASE_INDEX_APPROVED==='1';
if(url&&!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(url))throw Error('SITE_URL must be an HTTPS origin, e.g. https://example.com');
await rm(dist,{force:true,recursive:true});await cp(source,dist,{recursive:true});
const catalog=JSON.parse(await readFile(path.join(source,'data/community-weapon-catalog.json'),'utf8'));
const coverage=getCatalogCoverage(catalog);
const homeFile=path.join(dist,'index.html');
await writeFile(homeFile,injectCatalogCoverageIntoHomepage(await readFile(homeFile,'utf8'),coverage),'utf8');
async function pages(dir){const arr=[];for(const entry of await readdir(dir,{withFileTypes:true})){const child=path.join(dir,entry.name);if(entry.isDirectory())arr.push(...await pages(child));else if(entry.name==='index.html')arr.push(child)}return arr}
let indexed=[];
for(const file of await pages(dist)){
 let html=await readFile(file,'utf8');const uri=path.relative(dist,path.dirname(file)).split(path.sep).filter(Boolean).join('/');const pathname=uri?`/${uri}/`:'/';
 const intentionallyNoindex=uri==='weapon-ar-lab'||uri==='weapon-ar-validation'||uri==='weapon-data-workbench'||uri==='weapon-database'||uri==='validation-status'||uri==='respec-planner'||uri==='weapon-requirements'||uri==='armor-optimizer'||uri==='weapon-upgrade-calculator';
 const meta=intentionallyNoindex?'':(url&&indexApproved?`<link rel="canonical" href="${url+pathname}">`:'<meta name="robots" content="noindex,follow">');
 html=html.replace('</head>',`${meta}</head>`);
 // Never index the developer-only synthetic AR fixture or verification test status.
 if(url&&indexApproved&&!intentionallyNoindex)indexed.push(pathname);
 html=injectToolNavigation(html,uri);
 await writeFile(file,html,'utf8');
}
// Crawlers must be able to read noindex; robots.txt must not hide it.
let robots=url&&indexApproved?`User-agent: *\nAllow: /\nSitemap: ${url}/sitemap.xml\n`:'User-agent: *\nAllow: /\n';
await writeFile(path.join(dist,'robots.txt'),robots);
if(url&&indexApproved){const body=indexed.sort().map(p=>`  <url><loc>${url+p}</loc></url>`).join('\n');await writeFile(path.join(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`)}
// This static JSON is emitted by the same build as the pages being published.
// GitHub and Cloudflare provide separate SHA vars; never invent a revision
// when neither is available. No environment secrets or client data are emitted.
const shaCandidate=process.env.CF_PAGES_COMMIT_SHA||process.env.GITHUB_SHA||'';
const revision=/^[a-f0-9]{40}$/i.test(shaCandidate)?shaCandidate.toLowerCase():null;
const branchCandidate=process.env.CF_PAGES_BRANCH||process.env.GITHUB_REF_NAME||'';
const branch=branchCandidate.length>0&&branchCandidate.length<=100&&
 [...branchCandidate].every(c=>'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-/'.includes(c))?
 branchCandidate:null;
const buildInfo={
 schemaVersion:1,product:'Elden Ring Build Lab',generatedAt:new Date().toISOString(),
 revision,revisionSource:revision?
  (process.env.CF_PAGES_COMMIT_SHA?'CF_PAGES_COMMIT_SHA':'GITHUB_SHA'):'unavailable',
 branch,researchNoindex:!indexApproved,catalog:coverage
};
await writeFile(path.join(dist,'deployment-info.json'),JSON.stringify(buildInfo,null,2)+'\n','utf8');
if(!indexApproved||!url)console.warn('[SEO GATE] Research build: all pages remain noindex; robots allows crawlers to see noindex; sitemap.xml is withheld. RELEASE_INDEX_APPROVED=1 requires independent manual approval of all release gates.');
console.log(`Built ${indexed.length} indexable pages; ${indexApproved&&url?url:'RESEARCH MODE / noindex'}. Output: dist/`);