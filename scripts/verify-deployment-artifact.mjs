/**
 * CI/Cloudflare release artifact audit (static only, no game-client or browser
 * assertion). Run AFTER npm run build so dist/ is the deployment candidate.
 */
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {getCatalogCoverage,catalogCoverageCopy} from './home-catalog-coverage.mjs';
const read=async f=>readFile(path.join(process.cwd(),'dist',f),'utf8');
const assert=(pass,label)=>{if(!pass)throw Error('[DEPLOYMENT ARTIFACT] '+label);};
const main=async()=>{
 const [home,build,smithing,infoText,catalogText]=await Promise.all([
  read('index.html'),read('build-planner/index.html'),
  read('weapon-upgrade-calculator/index.html'),read('deployment-info.json'),
  read('data/community-weapon-catalog.json')
 ]);
 const source=getCatalogCoverage(JSON.parse(catalogText));
 const deployment=JSON.parse(infoText);
 assert(deployment.schemaVersion===1,'Unexpected build manifest schema');
 assert(deployment.product==='Elden Ring Build Lab','Unexpected product ID');
 assert(deployment.catalog?.weapons===source.weapons&&
  deployment.catalog?.dlc===source.dlc&&
  deployment.catalog?.dlcBaseFacts===source.dlcBaseFacts,
  'Deployment manifest differs from bundled weapon JSON');
 assert(home.includes('<p data-home-weapon-coverage>'+catalogCoverageCopy(source)+'</p>'),
  'Homepage does not match bundled weapon JSON');
 assert(!home.includes('364 real weapon references')&&
  !home.includes('57 DLC requirements-only'),'Stale homepage counts shipped');
 assert(build.includes('id="build-smithing-shortlist-panel"')&&
  build.includes('id="build-smithing-add"'),
  'Build Planner shortlist not in deployed HTML');
 assert(smithing.includes('id="multi-weapon-rows"')&&
  smithing.includes('id="multi-owned-inputs"'),
  'Shared Smithing Stone basket not in deployed HTML');
 for(const sourceFile of ['src/app.mjs','src/build-smithing-handoff.mjs',
   'src/upgrade-materials-app.mjs','src/upgrade-multi-weapon.mjs'])
  assert((await stat(path.join(process.cwd(),'dist',sourceFile))).size>300,
   'Missing application source in deployed artifact: '+sourceFile);
 const sha=process.env.CF_PAGES_COMMIT_SHA||process.env.GITHUB_SHA||'';
 const expectedRevision=/^[a-f0-9]{40}$/i.test(sha)?sha.toLowerCase():null;
 assert(deployment.revision===expectedRevision,
  'Revision does not match build environment commit SHA');
 assert(deployment.revisionSource===(expectedRevision?
  process.env.CF_PAGES_COMMIT_SHA?'CF_PAGES_COMMIT_SHA':'GITHUB_SHA':'unavailable'),
  'Incorrect revision source');
 assert(Number.isFinite(Date.parse(deployment.generatedAt)),
  'Invalid build timestamp');
 const research=process.env.RELEASE_INDEX_APPROVED!=='1';
 assert(deployment.researchNoindex===research,
  'Build manifest index setting does not match build gate');
 if(research){
  for(const [label,html] of [['home',home],['build planner',build],['smithing planner',smithing]])
   assert(html.includes('<meta name="robots" content="noindex,follow">'),
    'Research noindex missing from '+label);
  const {access}=await import('node:fs/promises');
  try{await access(path.join(process.cwd(),'dist','sitemap.xml'));
   throw Error('[DEPLOYMENT ARTIFACT] Research sitemap unexpectedly published');
  }catch(err){if(err.code!=='ENOENT')throw err;}
 }
 console.log('[DEPLOYMENT ARTIFACT] PASS: catalog copy, source coverage, deployed features, revision provenance, and SEO gate');
};
await main();
