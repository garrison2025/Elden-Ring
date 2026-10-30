import test from 'node:test';
import assert from 'node:assert/strict';
import {
 CURRENT_REFERENCE_SAMPLES,CURRENT_REFERENCE_VERSION,CURRENT_REFERENCE_BUILD,
 CURRENT_REFERENCE_URL,auditCurrentReferenceAr
} from '../public/src/current-reference-ar.mjs';
const source=()=>({
 weapons:[{name:'Invented AR Test',affinityId:0,weaponType:3,paired:false,
  attack:[[0,100]],attributeScaling:[['str',0.8],['dex',0.2]],
  requirements:{str:40,dex:20},attackElementCorrectId:5,reinforceTypeId:2,calcCorrectGraphIds:{0:1}}],
 calcCorrectGraphs:{1:[{maxVal:0,maxGrowVal:0,adjPt:1},{maxVal:148,maxGrowVal:1.48,adjPt:1}]},
 attackElementCorrects:{5:{0:{str:true,dex:true}}},
 reinforceTypes:{2:Array.from({length:11},()=>({
  attack:{0:1},attributeScaling:{str:1,dex:1,int:1,fai:1,arc:1}
 }))}
});
const fixture=()=>({id:'build-25827938-01',name:'Invented AR Test',expectedTotal:136,requirements:[40,20,0,0,0]});
test('all 14 2026 independent-publication benchmark observations include names, source and explicit requirements',()=>{
 assert.equal(CURRENT_REFERENCE_SAMPLES.length,14);
 assert.equal(new Set(CURRENT_REFERENCE_SAMPLES.map(x=>x.name)).size,14);
 assert.ok(CURRENT_REFERENCE_SAMPLES.some(x=>x.name==="Rellana's Twin Blades"&&x.expectedTotal===700));
 assert.ok(CURRENT_REFERENCE_SAMPLES.some(x=>x.name==="Rabbath's Cannon"));
 assert.equal(CURRENT_REFERENCE_VERSION,'1.17.3');
 assert.equal(CURRENT_REFERENCE_BUILD,'25827938');
 assert.match(CURRENT_REFERENCE_URL,/almanauts\.com\/eldenring\/weapons/);
 for(const sample of CURRENT_REFERENCE_SAMPLES){
  assert.ok(Number.isInteger(sample.expectedTotal)&&sample.expectedTotal>0);
  assert.equal(sample.requirements.length,5);
  assert.ok(sample.requirements.every(n=>Number.isInteger(n)&&n>=0&&n<=99));
 }
});
test('independent current-version benchmark uses full source pipeline and refuses to claim game-client certification',()=>{
 const result=auditCurrentReferenceAr(source(),{samples:[fixture()],
  sourceVersion:'1.17',sourceReference:'invented synthetic only'});
 assert.equal(result.compared,1);
 assert.equal(result.matched,1);
 assert.equal(result.failed,0);
 assert.equal(result.allMatched,true);
 assert.equal(result.parameterVersionExactMatch,false);
 assert.equal(result.gameClientVerified,false);
 assert.equal(result.releaseGatePassed,false);
 assert.equal(result.currentGameScreenshotCount,0);
 assert.equal(result.sourceDataExported,false);
 assert.ok(!JSON.stringify(result).includes('Invented AR Test'));
});
test('unmatched source record, requirements drift and wrong attack power fail closed',()=>{
 const src=source(),base=fixture();
 assert.deepEqual(auditCurrentReferenceAr(src,{samples:[{...base,name:'Untracked'}]}).failures,
  [{id:base.id,reason:'not-in-pinned-source'}]);
 assert.deepEqual(auditCurrentReferenceAr(src,{samples:[{...base,requirements:[39,20,0,0,0]}]}).failures,
  [{id:base.id,reason:'published-requirements-differ'}]);
 assert.deepEqual(auditCurrentReferenceAr(src,{samples:[{...base,expectedTotal:135}]}).failures,
  [{id:base.id,reason:'published-total-ar-differs'}]);
});
test('duplicate sample IDs and malformed evidence fail before publication',()=>{
 const f=fixture();
 assert.throws(()=>auditCurrentReferenceAr(source(),{samples:[f,f]}),/duplicate/);
 assert.throws(()=>auditCurrentReferenceAr(source(),{samples:[{...f,expectedTotal:NaN}]}),/Invalid/);
 assert.throws(()=>auditCurrentReferenceAr(source(),{samples:[{...f,requirements:[40,20,0,0,100]}]}),/Invalid/);
 assert.throws(()=>auditCurrentReferenceAr(source(),{samples:[]}),/Invalid/);
 assert.throws(()=>auditCurrentReferenceAr(null,{samples:[f]}),/Invalid/);
});
test('ambiguous neutral-source rows and incomplete reinforcement are counted as failures',()=>{
 const src=source(),f=fixture();
 src.weapons.push({...src.weapons[0],affinityId:-1});
 const a=auditCurrentReferenceAr(src,{samples:[f]});
 assert.equal(a.compared,0);assert.deepEqual(a.failures,
  [{id:f.id,reason:'ambiguous-neutral-affinity'}]);
 const invalid=source();invalid.reinforceTypes[2]=[{attack:{0:1},attributeScaling:{
  str:1,dex:1,int:1,fai:1,arc:1}}];
 const b=auditCurrentReferenceAr(invalid,{samples:[f]});
 assert.equal(b.failed,1);
 assert.equal(b.allMatched,false);
 assert.equal(b.gameClientVerified,false);
});
