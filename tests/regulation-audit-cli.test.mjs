import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
const script=resolve('scripts/audit-regulation.mjs');
const run=(...args)=>spawnSync(process.execPath,[script,...args],{encoding:'utf8',cwd:process.cwd()});
const fixture=()=>({
 weapons:[{name:'Invented Example Alpha',attack:[[0,100]],attributeScaling:[['str',0.8]],requirements:{str:10},
  reinforceTypeId:1,attackElementCorrectId:1,calcCorrectGraphIds:{0:1}}],
 reinforceTypes:{1:[{attack:{0:1},attributeScaling:{str:1,dex:1,int:1,fai:1,arc:1}}]},
 attackElementCorrects:{1:{0:{str:true}}},
 calcCorrectGraphs:{1:[{maxVal:0,maxGrowVal:0,adjPt:1},{maxVal:148,maxGrowVal:1.48,adjPt:1}]}
});
test('CLI generates anonymous audit with SHA256 from a local synthetic file',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'buildlab-audit-'));
 try{
  const input=join(dir,'fixture.json'),output=join(dir,'report.json');
  await writeFile(input,JSON.stringify(fixture()));
  const r=run('--input',input,'--version','synthetic-v1','--source','fictional QA only','--out',output);
  assert.equal(r.status,0,r.stderr);
  const report=JSON.parse(await readFile(output,'utf8'));
  assert.equal(report.totals.convertible,1);
  assert.equal(report.publishable,false);
  assert.match(report.sourceSha256,/^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(report).includes('Invented Example Alpha'));
  const invalid=fixture();invalid.weapons[0].reinforceTypeId=333;
  await writeFile(input,JSON.stringify(invalid));
  const failing=run('--input',input,'--version','synthetic-v1','--source','fictional QA only');
  assert.equal(failing.status,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('CLI rejects executable JS input and incomplete flags',()=>{
 const bad=run('--input','example.js','--version','x','--source','test');
 assert.equal(bad.status,2);
 assert.match(bad.stderr,/JSON/);
 assert.equal(run('--version','v1').status,2);
});
