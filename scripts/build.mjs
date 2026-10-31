import {cp,mkdir,rm,readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {injectToolNavigation} from './navigation.mjs';
import {getCatalogCoverage,injectCatalogCoverageIntoHomepage} from './home-catalog-coverage.mjs';
import {getCatalogEvidence,injectCatalogEvidence} from './catalog-evidence.mjs';
import {validateConflictEvidence,injectConflictDossier} from './weapon-conflict-dossier.mjs';
const root=process.cwd(),dist=path.join(root,'dist'),source=path.join(root,'public');
// First-wave SEO release is reviewed route by route. Never toggle global indexing.
// Local builds, CI and every Cloudflare preview remain noindex by default.
// Cloudflare injects CF_PAGES and CF_PAGES_BRANCH automatically on its builds.
const PRODUCTION_ORIGIN='https://elden-ring-5i9.pages.dev';
const RELEASE_INDEX_ROUTES=Object.freeze([
 '', 'class-optimizer', 'level-rune-calculator', 'equip-load-calculator'
]);
const productionDeployment=process.env.CF_PAGES==='1'&&process.env.CF_PAGES_BRANCH==='main';
const indexApproved=process.env.RELEASE_INDEX_APPROVED==='1';
const url=(productionDeployment?PRODUCTION_ORIGIN:(process.env.SITE_URL||'')).trim().replace(/\/$/,'');
const releaseEnabled=!!url&&(productionDeployment||indexApproved);
if(url&&!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(url))throw Error('SITE_URL must be an HTTPS origin, e.g. https://example.com');
await rm(dist,{force:true,recursive:true});await cp(source,dist,{recursive:true});
const catalog=JSON.parse(await readFile(path.join(source,'data/community-weapon-catalog.json'),'utf8'));
const coverage=getCatalogCoverage(catalog);
const evidence=getCatalogEvidence(catalog);
const ledger=JSON.parse(await readFile(path.join(source,'data/weapon-conflict-evidence.json'),'utf8'));
const conflictEvidence=validateConflictEvidence(catalog,ledger);
// The status page and JSON evidence are generated from the *same* validated
// bundled catalog as the homepage. Never maintain these numbers by hand.
await writeFile(path.join(dist,'catalog-evidence.json'),
 JSON.stringify(evidence,null,2)+'\n','utf8');
const validationPage=path.join(dist,'validation-status','index.html');
await writeFile(validationPage,
 injectConflictDossier(injectCatalogEvidence(await readFile(validationPage,'utf8'),evidence),conflictEvidence),'utf8');
const homeFile=path.join(dist,'index.html');
await writeFile(homeFile,injectCatalogCoverageIntoHomepage(await readFile(homeFile,'utf8'),coverage),'utf8');
async function pages(dir){const arr=[];for(const entry of await readdir(dir,{withFileTypes:true})){const child=path.join(dir,entry.name);if(entry.isDirectory())arr.push(...await pages(child));else if(entry.name==='index.html')arr.push(child)}return arr}
// These are *intentionally withheld* even if a manually approved site-wide
// release later enables indexing for the public calculators.
const permanentlyWithheld=Object.freeze([
 'weapon-ar-lab','weapon-ar-validation','weapon-data-workbench','weapon-ar-calculator',
 'weapon-database','weapon-source-review','game-evidence-queue','validation-status','respec-planner',
 'weapon-requirements','armor-optimizer','weapon-upgrade-calculator'
]);
const strictResearch=Object.freeze([
 'weapon-ar-lab','weapon-ar-validation','weapon-data-workbench','weapon-ar-calculator','weapon-source-review','game-evidence-queue','validation-status'
]);
const htmlPages=await pages(dist);
const discoveredRoutes=new Set(htmlPages.map(file=>path.relative(dist,path.dirname(file)).split(path.sep).filter(Boolean).join('/')));
if(releaseEnabled){
 for(const slug of RELEASE_INDEX_ROUTES)
  if(!discoveredRoutes.has(slug)||permanentlyWithheld.includes(slug))
   throw Error('Approved SEO route is missing or withheld: '+(slug||'/'));
}
let indexed=[];
for(const file of htmlPages){
 let html=await readFile(file,'utf8');const uri=path.relative(dist,path.dirname(file)).split(path.sep).filter(Boolean).join('/');const pathname=uri?`/${uri}/`:'/';
 const intentionallyNoindex=permanentlyWithheld.includes(uri);
 const indexable=releaseEnabled&&RELEASE_INDEX_ROUTES.includes(uri)&&!intentionallyNoindex;
 const directives=intentionallyNoindex&&strictResearch.includes(uri)?
  'noindex,nofollow':indexable?'index,follow':'noindex,follow';
 // The build output, not an optional handwritten page tag, owns the SEO gate.
 // Remove any stale duplicate robots/canonical tags in HEAD before injecting
 // exactly one authoritative set. No research URL enters an approved sitemap.
 const end=html.indexOf('</head>');
 if(end<0)throw Error('Missing HTML head end tag: '+pathname);
 const before=html.slice(0,end)
  .replace(/<meta\s+name=["']robots["']\s+content=["'][^"']*["']\s*\/?>/gi,'')
  .replace(/<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/gi,'');
 const meta=`<meta name="robots" content="${directives}">`+
  (indexable?`<link rel="canonical" href="${url+pathname}">`:'');
 html=before+meta+html.slice(end);
 if(indexable)indexed.push(pathname);
 html=injectToolNavigation(html,uri);
 await writeFile(file,html,'utf8');
}
// Crawlers must be able to read noindex; robots.txt must not hide it.
let robots=releaseEnabled?`User-agent: *\nAllow: /\nSitemap: ${url}/sitemap.xml\n`:'User-agent: *\nAllow: /\n';
await writeFile(path.join(dist,'robots.txt'),robots);
// Cloudflare Pages also uses an HTTP X-Robots-Tag response header. This is
// defense in depth, NOT a replacement for the per-page HTML robots meta.
// Research previews block every route. Approved sites block permanently
// withheld research/limited-data routes independently of author HTML.
const headers=releaseEnabled?
 [...discoveredRoutes].filter(uri=>uri&&!RELEASE_INDEX_ROUTES.includes(uri))
  .sort().map(uri=>`/${uri}/*\n  X-Robots-Tag: noindex\n`).join('\n'):
 '/*\n  X-Robots-Tag: noindex\n';
await writeFile(path.join(dist,'_headers'),headers,'utf8');
if(releaseEnabled){const body=indexed.sort().map(p=>`  <url><loc>${url+p}</loc></url>`).join('\n');await writeFile(path.join(dist,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`)}
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
 branch,researchNoindex:!releaseEnabled,indexedRoutes:indexed.slice().sort(),
 releaseMode:productionDeployment?'cloudflare-main-first-wave':
  releaseEnabled?'explicit-review-fixture':'research-noindex',catalog:coverage
};
await writeFile(path.join(dist,'deployment-info.json'),JSON.stringify(buildInfo,null,2)+'\n','utf8');
if(!releaseEnabled)console.warn('[SEO GATE] Research/preview build: every page stays noindex; no sitemap. Only Cloudflare main can auto-open the reviewed route allowlist.');
console.log(`Built ${indexed.length} indexable pages; ${releaseEnabled?url:'RESEARCH MODE / noindex'}. Output: dist/`);