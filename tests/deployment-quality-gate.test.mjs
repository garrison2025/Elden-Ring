import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const pkg=JSON.parse(read('package.json'));

test('Cloudflare npm build is itself a fail-closed test/AR/artifact quality gate',()=>{
 assert.deepEqual(pkg.scripts.build.split(' && '),[
  'npm run test',
  'npm run verify:ar',
  'node scripts/build.mjs',
  'npm run verify:deployment'
 ]);
 assert.equal(pkg.scripts.check,'npm run build');
 assert.match(pkg.scripts.test,/^node --test tests\/\*\.test\.mjs$/);
 assert.equal(pkg.scripts['verify:ar'],'node scripts/verify-ar.mjs --example');
 assert.equal(pkg.scripts['verify:deployment'],'node scripts/verify-deployment-artifact.mjs');
 assert.doesNotMatch(pkg.scripts.build,/\|\||;|\btrue\b|--force|--no-verify/);
});

test('GitHub Actions remains an independent optional check, not a requirement for free Cloudflare quality gating',()=>{
 const gh=read('.github/workflows/verify.yml');
 const browser=read('.github/workflows/browser-smoke.yml');
 assert.match(gh,/npm run check/);
 assert.match(browser,/npm run build/);
 assert.match(browser,/node scripts\/smoke-browser\.mjs/);
 const build=read('scripts/build.mjs');
 assert.match(build,/RELEASE_INDEX_APPROVED==='1'/);
 assert.match(build,/permanentlyWithheld\.includes\(uri\)/);
 const verify=read('scripts/verify-deployment-artifact.mjs');
 assert.match(verify,/deployment-info\.json/);
 assert.match(verify,/catalog-evidence\.json/);
});

test('build pipeline does not download third-party Regulation files or enable game-AR certification',()=>{
 const chain=pkg.scripts.build;
 assert.doesNotMatch(chain,/audit:real-v117|import:regulation|RELEASE_INDEX_APPROVED=1/);
 const rawMath=read('.github/workflows/v117-ar-math-audit.yml');
 assert.match(rawMath,/npm run audit:real-v117/);
 assert.notEqual(pkg.scripts.build,rawMath,'Pinned-source external network audit is a separate optional check');
});
