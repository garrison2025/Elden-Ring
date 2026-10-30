import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const run=(...args)=>spawnSync(process.execPath,['scripts/verify-ar.mjs',...args],{cwd:root,encoding:'utf8'});
test('synthetic reference CLI exits successfully with explicit noncertification',()=>{
 const r=run('--example');
 assert.equal(r.status,0,r.stderr);
 assert.match(r.stdout,/SYNTHETIC REGRESSION ONLY/);
 assert.match(r.stdout,/Exact matches: 3/);
 assert.match(r.stdout,/RESEARCH ONLY/);
});
test('CLI returns usage error on malformed parameters',()=>{
 const r=run('--profile','missing.json');
 assert.equal(r.status,2);
 assert.match(r.stderr,/Invalid arguments/);
});
