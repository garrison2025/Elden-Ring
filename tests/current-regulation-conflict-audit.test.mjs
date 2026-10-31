import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditCurrentRegulationConflicts} from '../public/src/current-regulation-conflict-audit.mjs';
const read=x=>JSON.parse(readFileSync(new URL('../public/data/'+x,import.meta.url),'utf8'));
const catalog=read('community-weapon-catalog.json');
const ledger=read('weapon-conflict-evidence.json');
const meta={gameAppVersion:'1.17.2',regulationVersion:'1.17.3',
 sourceDescription:'Synthetic fixture; not a real game data export',
 sourceFileSha256:'a'.repeat(64)};
const base=()=>{
 const names=new Map(catalog.weapons.map(w=>[w.id,w.name]));
 return {
  weapons:ledger.cases.map(row=>({
   name:names.get(row.id),affinityId:0,reinforceTypeId:5,
   attack:row.field==='baseAttack'?
    row.pinned.map((n,i)=>[i,n]).filter(x=>x[1]>0):[[0,10]],
   requirements:row.field==='requirements'?Object.fromEntries(
    ['str','dex','int','fai','arc'].map((k,i)=>[k,row.pinned[i]])):{str:10}
  })),
  reinforceTypes:{5:[{attack:{0:1,1:1,2:1,3:1,4:1}}]}
 };
};
test('pure local audit compares exact 7 original conflicts with synthetic source data, no verified claims',()=>{
 const out=auditCurrentRegulationConflicts(catalog,ledger,base(),meta);
 assert.equal(out.results.length,7);
 assert.equal(out.counts.compared,7);
 assert.equal(out.counts.pinnedMatches,7);
 assert.equal(out.counts.communityMatches,0);
 assert.equal(out.counts.neitherMatches,0);
 assert.equal(out.sourceVersionAuthenticated,false);
 assert.equal(out.gameClientVerified,false);
 assert.equal(out.reviewerApproved,false);
 assert.equal(out.screenshotGoldensAdded,0);
 assert.equal(out.declaredTargetMatches,true);
 assert.equal(out.sourceFileSha256,'a'.repeat(64));
 assert.deepEqual(out.results.find(x=>x.id==='sote-reference-032').sourceValues,[75,0,22,0,0]);
 assert.deepEqual(out.results.find(x=>x.id==='sote-reference-051').sourceValues,[8,8,13,20,0]);
 assert.ok(out.results.every(x=>x.note.includes('NOT independently authenticated')));
 assert.equal(catalog.weapons.find(w=>w.name==='Madding Hand').requirements[3],13,
  'Local comparator must not overwrite original community data');
});
test('compares five +0 components after the source-specific reinforcement factor, not raw attack or AR',()=>{
 const root=base(),axe=root.weapons.find(w=>w.name==='Smithscript Axe');
 axe.attack=[[0,100]];
 axe.reinforceTypeId=6;
 const alt=structuredClone(root);
 alt.reinforceTypes['6']=[{attack:{0:1.31,1:1,2:1,3:1,4:1}}];
 const out=auditCurrentRegulationConflicts(catalog,ledger,alt,meta);
 assert.deepEqual(out.results.find(x=>x.name==='Smithscript Axe').sourceValues,[131,0,0,0,0]);
 assert.equal(out.counts.pinnedMatches,7);
 const missing=structuredClone(alt);delete missing.reinforceTypes['6'][0].attack['0'];
 const bad=auditCurrentRegulationConflicts(catalog,ledger,missing,meta);
 assert.equal(bad.results.find(x=>x.name==='Smithscript Axe').sourceStatus,'invalid');
 assert.equal(bad.counts.pinnedMatches,6);
});
test('neutral affinity is mandatory; duplicate, missing, invalid source rows never silently select one',()=>{
 const data=base();
 const missing=structuredClone(data);
 missing.weapons=missing.weapons.filter(w=>w.name!=='Smithscript Dagger');
 const res=auditCurrentRegulationConflicts(catalog,ledger,missing,meta);
 assert.equal(res.counts.unmatched,1);
 const extra=structuredClone(data);
 const hand=extra.weapons.find(w=>w.name==='Madding Hand');
 extra.weapons.push({...hand,affinityId:-1});
 assert.equal(auditCurrentRegulationConflicts(catalog,ledger,extra,meta)
  .results.find(x=>x.name==='Madding Hand').sourceStatus,'ambiguous');
 const malformed=structuredClone(data);
 malformed.weapons.find(w=>w.name==='Queelign\'s Greatsword').attack=[[0,122],[0,90]];
 assert.equal(auditCurrentRegulationConflicts(catalog,ledger,malformed,meta)
  .results.find(x=>x.name==="Queelign's Greatsword").sourceStatus,'invalid');
 const notNeutral=structuredClone(data);
 notNeutral.weapons.find(w=>w.name==='Smithscript Axe').affinityId=2;
 assert.equal(auditCurrentRegulationConflicts(catalog,ledger,notNeutral,meta)
  .results.find(x=>x.name==='Smithscript Axe').sourceStatus,'unmatched');
});
test('declared game version alone never authenticates a source or approves client screenshots',()=>{
 const result=auditCurrentRegulationConflicts(catalog,ledger,base(),{
  ...meta,regulationVersion:'1.16.1'});
 assert.equal(result.declaredTargetMatches,false);
 assert.equal(result.counts.pinnedMatches,7);
 assert.equal(result.sourceVersionAuthenticated,false);
 assert.equal(result.gameClientVerified,false);
});
test('invalid compact files and incorrect seven-case ledger are rejected before publishing a comparison',()=>{
 for(const bad of [null,{}, {weapons:[],reinforceTypes:{}},
  {weapons:[{}],reinforceTypes:null}]){
  assert.throws(()=>auditCurrentRegulationConflicts(catalog,ledger,bad,meta),RangeError);
 }
 assert.throws(()=>auditCurrentRegulationConflicts(catalog,ledger,base(),
  {...meta,sourceFileSha256:'123'}),RangeError);
 const changed=structuredClone(ledger);changed.cases[0].id='fabricated';
 assert.throws(()=>auditCurrentRegulationConflicts(catalog,changed,base(),meta),RangeError);
});
test('built UI advertises this as local JSON and does not claim imported file authenticity',()=>{
 const page=readFileSync(new URL('../public/validation-status/index.html',import.meta.url),'utf8');
 for(const s of ['id="reg-seven-audit"','id="reg-seven-file"','id="reg-seven-download"',
  'id="reg-seven-table"','src="../src/current-regulation-conflict-audit-app.mjs"',
  '1.17 → 1.17.1','1.17.1 → 1.17.3']){
  assert.ok(page.includes(s),s);
 }
 assert.ok(page.includes('not authenticated'));
 const worker=readFileSync(new URL('../public/src/current-regulation-conflict-audit-worker.mjs',import.meta.url),'utf8');
 assert.ok(worker.includes('auditCurrentRegulationConflicts'));
 assert.ok(!worker.includes('fetch('),'Source JSON stays local; worker never downloads anything');
});
