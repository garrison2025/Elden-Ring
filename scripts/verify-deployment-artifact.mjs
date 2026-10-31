/**
 * CI/Cloudflare release artifact audit (static only, no game-client or browser
 * assertion). Run AFTER npm run build so dist/ is the deployment candidate.
 */
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {getCatalogCoverage,catalogCoverageCopy} from './home-catalog-coverage.mjs';
import {getCatalogEvidence,catalogEvidenceRow,catalogEvidencePanel} from './catalog-evidence.mjs';
import {validateConflictEvidence,conflictDossierHtml} from './weapon-conflict-dossier.mjs';
const read=async f=>readFile(path.join(process.cwd(),'dist',f),'utf8');
const assert=(pass,label)=>{if(!pass)throw Error('[DEPLOYMENT ARTIFACT] '+label);};
const main=async()=>{
 const [home,build,smithing,equipment,verification,evidenceText,ledgerText,infoText,catalogText]=await Promise.all([
  read('index.html'),read('build-planner/index.html'),
  read('weapon-upgrade-calculator/index.html'),read('equip-load-calculator/index.html'),
  read('validation-status/index.html'),read('catalog-evidence.json'),
  read('data/weapon-conflict-evidence.json'),read('deployment-info.json'),
  read('data/community-weapon-catalog.json')
 ]);
 const source=getCatalogCoverage(JSON.parse(catalogText));
 const deployment=JSON.parse(infoText);
 const expectedEvidence=getCatalogEvidence(JSON.parse(catalogText));
 const conflictEvidence=validateConflictEvidence(JSON.parse(catalogText),JSON.parse(ledgerText));
 assert(verification.includes(conflictDossierHtml(conflictEvidence))&&
  !verification.includes('data-source-conflict-placeholder')&&
  conflictEvidence.entries.length===expectedEvidence.counts.recordsWithSourceConflicts,
  'Audited seven-source discrepancy dossier not present or mismatched');
 assert(conflictEvidence.entries.every(e=>e.reviewStatus==='UNREVIEWED'&&
  e.gameClientVerified===false),
  'Unverified conflicting references must not claim gameplay certification');
 const actualEvidence=JSON.parse(evidenceText);
 assert(JSON.stringify(actualEvidence)===JSON.stringify(expectedEvidence),
  'Public evidence JSON does not match exact bundled weapon source');
 assert(verification.includes('id="conflict-capture"')&&
  verification.includes('id="conflict-capture-values"')&&
  verification.includes('id="conflict-capture-title-image"')&&
  verification.includes('id="conflict-capture-weapon-image"')&&
  verification.includes('src="../src/conflict-game-capture-app.mjs"')&&
  verification.includes('id="conflict-evidence-recheck"')&&
  verification.includes('id="conflict-recheck-json"')&&
  verification.includes('id="conflict-recheck-hashes"')&&
  verification.includes('src="../src/conflict-evidence-import-app.mjs"')&&
  verification.includes('id="reg-seven-audit"')&&
  verification.includes('id="reg-seven-file"')&&
  verification.includes('id="reg-seven-table"')&&
  verification.includes('src="../src/current-regulation-conflict-audit-app.mjs"'),
  'Seven-case local screenshot capture and original-image recheck forms missing in research accuracy page');
  assert(verification.includes(catalogEvidenceRow(expectedEvidence))&&
  verification.includes(catalogEvidencePanel(expectedEvidence)),
  'Visible accuracy page missing source-derived counts or unresolved conflict rows');
 assert(!verification.includes('Community weapon catalog (364, partial)')&&
  !verification.includes('57 DLC names/categories/requirements'),
  'Stale, hand-maintained historical catalog counts in deployed validation page');
 assert(verification.includes('<meta name="robots" content="noindex,nofollow">'),
  'Research/accuracy status page must remain noindex');
 assert(deployment.schemaVersion===1,'Unexpected build manifest schema');
 assert(deployment.product==='Elden Ring Build Lab','Unexpected product ID');
 assert(deployment.catalog?.weapons===source.weapons&&
  deployment.catalog?.dlc===source.dlc&&
  deployment.catalog?.dlcBaseFacts===source.dlcBaseFacts&&
  deployment.catalog?.tarnishedPack===source.tarnishedPack&&
  deployment.catalog?.tarnishedPackBaseFacts===source.tarnishedPackBaseFacts&&
  deployment.catalog?.tarnishedPackSecondaryConflicts===source.tarnishedPackSecondaryConflicts,
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
 assert(build.includes('id="build-equipment-open"'),
  'Build candidate-to-equipment handoff missing from Build Planner');
 assert(equipment.includes('id="equipment-weapon-fields"')&&
  equipment.includes('id="equipment-manual-fields"')&&
  equipment.includes('id="equipment-confirm"')&&
  equipment.includes('src="../src/equipment-loadout-app.mjs"')&&
  equipment.includes('id="equipment-save"')&&
  equipment.includes('id="equipment-restore"')&&
  equipment.includes('id="equipment-ab-results"'),
  'Equipped loadout save/restore and A/B compare controls missing in deployed HTML');
 for(const sourceFile of ['src/app.mjs','src/build-smithing-handoff.mjs',
   'src/upgrade-materials-app.mjs','src/upgrade-multi-weapon.mjs',
   'src/equipment-loadout.mjs','src/equipment-loadout-app.mjs',
   'src/equipment-save-compare.mjs',
   'src/conflict-game-capture.mjs','src/conflict-game-capture-app.mjs',
   'src/conflict-evidence-import.mjs','src/conflict-evidence-import-app.mjs',
   'src/ar-screenshot-fingerprint.mjs',
   'src/current-regulation-conflict-audit.mjs',
   'src/current-regulation-conflict-audit-worker.mjs',
   'src/current-regulation-conflict-audit-app.mjs'])
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
 const prod=process.env.CF_PAGES==='1'&&process.env.CF_PAGES_BRANCH==='main';
 const manuallyApproved=process.env.RELEASE_INDEX_APPROVED==='1'&&
  typeof process.env.SITE_URL==='string'&&process.env.SITE_URL.trim().length>0;
 const research=!(prod||manuallyApproved);
 assert(deployment.researchNoindex===research,
  'Build manifest index setting does not match build gate');
 const approvedPaths=['/','/class-optimizer/','/equip-load-calculator/','/level-rune-calculator/'];
 assert(JSON.stringify(deployment.indexedRoutes)===(research?'[]':JSON.stringify(approvedPaths)),
  'Unexpected indexed routes: only four first-wave pages are approved');
 assert(deployment.releaseMode===(prod?'cloudflare-main-first-wave':
  research?'research-noindex':'explicit-review-fixture'),'Build release mode is not grounded');
 const headers=await read('_headers');
 const seoWithheld=[
  'weapon-ar-lab','weapon-ar-validation','weapon-data-workbench','weapon-ar-calculator',
  'weapon-database','validation-status','respec-planner',
  'weapon-requirements','armor-optimizer','weapon-upgrade-calculator'
 ];
 for(const slug of seoWithheld){
  const html=await read(slug+'/index.html');
  assert(/<meta name="robots" content="noindex,(?:follow|nofollow)">/.test(html),
   'Research or limited-accuracy page can be crawled/indexed: '+slug);
  assert(!html.includes('<link rel="canonical"'),
   'Research or limited-accuracy page has an index canonical: '+slug);
  if(!research)
   assert(headers.includes('/'+slug+'/*\n  X-Robots-Tag: noindex'),
    'Approved deployment missing HTTP noindex header for '+slug);
 }
 if(!research){
  const indexable=['index.html','class-optimizer/index.html',
   'level-rune-calculator/index.html','equip-load-calculator/index.html'];
  const sitemap=await read('sitemap.xml');
  const domain=prod?'https://elden-ring-5i9.pages.dev':process.env.SITE_URL.trim().replace(/\\/$/,'');
  const published=[...sitemap.matchAll(/<loc>([^<]+)<\\/loc>/g)].map(m=>m[1]).sort();
  assert(JSON.stringify(published)===JSON.stringify(approvedPaths.map(p=>domain+p).sort()),
   'Sitemap must contain exactly the approved first-wave routes');
  for(const p of indexable){
   const html=await read(p);
   assert(html.includes('<meta name="robots" content="index,follow">'),
    'Missing index meta on approved page '+p);
  }
  for(const slug of ['about','build-planner','privacy','updates']){
   const html=await read(slug+'/index.html');
   assert(html.includes('<meta name="robots" content="noindex,follow">')&&
    !html.includes('<link rel="canonical"'),
    'Unapproved content accidentally indexable: '+slug);
   assert(headers.includes('/'+slug+'/*\\n  X-Robots-Tag: noindex'),
    'Missing header defense on unapproved content '+slug);
  }
 }
 if(research){
  assert(headers==='/*\n  X-Robots-Tag: noindex\n',
   'Research deployment must set Cloudflare noindex headers for all paths');
  for(const [label,html] of [['home',home],['build planner',build],['smithing planner',smithing],
   ['equipment loadout',equipment]])
   assert(html.includes('<meta name="robots" content="noindex,follow">'),
    'Research noindex missing from '+label);
  const {access}=await import('node:fs/promises');
  try{await access(path.join(process.cwd(),'dist','sitemap.xml'));
   throw Error('[DEPLOYMENT ARTIFACT] Research sitemap unexpectedly published');
  }catch(err){if(err.code!=='ENOENT')throw err;}
 }
 console.log('[DEPLOYMENT ARTIFACT] PASS: catalog copy, source-derived evidence, unresolved conflicts, deployed features, revision provenance, and SEO gate');
};
await main();
