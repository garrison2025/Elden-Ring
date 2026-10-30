import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const entry=resolve(repo,'scripts/import-regulation.mjs');
const makeFixture=()=>({
 weapons:[{name:'Invented Only Blade',weaponType:13,paired:false,
  attack:[[0,100]],attributeScaling:[['str',0.8]],requirements:{str:10},
  attackElementCorrectId:1,reinforceTypeId:1,calcCorrectGraphIds:{0:1}}],
 calcCorrectGraphs:{1:[{maxVal:0,maxGrowVal:0,adjPt:1},{maxVal:148,maxGrowVal:1.48,adjPt:1}]},
 attackElementCorrects:{1:{0:{str:true}}},
 reinforceTypes:{1:[{attack:{0:1},attributeScaling:{str:1,dex:1,int:1,fai:1,arc:1}}]}
});
const exec=(...args)=>spawnSync(process.execPath,[entry,...args],{cwd:repo,encoding:'utf8'});
test('real CLI reads local synthetic JSON, lists exact names and writes traceable unverified profile',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'buildlab-regulation-'));
 try{
  const infile=join(dir,'input.json'),out=join(dir,'candidate.json');
  await writeFile(infile,JSON.stringify(makeFixture()));
  const listing=exec('--input',infile,'--list');
  assert.equal(listing.status,0,listing.stderr);
  assert.match(listing.stdout,/Invented Only Blade/);
  assert.match(listing.stdout,/SHA256/);
  const result=exec('--input',infile,'--weapon','Invented Only Blade',
   '--version','synthetic-1.17','--source','independently authored fictional test data','--out',out);
  assert.equal(result.status,0,result.stderr);
  const profile=JSON.parse(await readFile(out,'utf8'));
  assert.equal(profile.provenance.status,'manual-unverified');
  assert.equal(profile.provenance.gameVersion,'synthetic-1.17');
  assert.match(profile.provenance.sourceSha256,/^[a-f0-9]{64}$/);
  assert.equal(profile.label,'Invented Only Blade');
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('local converter refuses JavaScript files and missing candidate weapon',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'buildlab-regulation-'));
 try{
  const js=join(dir,'dangerous.js'),json=join(dir,'source.json');
  await writeFile(js,'console.log("never execute this")');
  await writeFile(json,JSON.stringify(makeFixture()));
  const unsafe=exec('--input',js,'--list');
  assert.equal(unsafe.status,2);assert.match(unsafe.stderr,/Only .json/);
  const missing=exec('--input',json,'--weapon','Absent','--version','v1','--source','test','--out',join(dir,'unused.json'));
  assert.equal(missing.status,2);assert.match(missing.stderr,/matches: 0/);
 }finally{await rm(dir,{recursive:true,force:true})}
});
