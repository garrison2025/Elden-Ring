import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeTarnishedSameInputUrl,compareUserEnteredReferenceAr,
 TARNISHED_V117_AFFINITIES} from '../public/src/tarnished-same-input.mjs';
import {TARNISHED_REFERENCE_AR_CASES} from '../public/src/tarnished-reference-benchmark.mjs';
const stats={str:40,dex:40,int:10,fai:10,arc:10};
test('all fifteen previously input-verified reference cases map to identical public controls',()=>{
 assert.equal(TARNISHED_REFERENCE_AR_CASES.length,50);
 for(const c of TARNISHED_REFERENCE_AR_CASES){
  const url=new URL(makeTarnishedSameInputUrl({
   weaponName:c.weaponName,affinityId:c.affinityId,upgrade:c.upgrade,
   stats:c.playerStats,twoHanded:c.twoHanded,reinforcement:'smithing'
  }));
  const source=new URL(c.sourceUrl);
  assert.equal(url.origin,'https://www.tarnished.dev');
  assert.equal(url.pathname,'/build-planner');
  for(const key of ['rh1','aRh1','str','dex','int','fai','arc','smith','somber','twoHanded'])
   assert.equal(url.searchParams.get(key),source.searchParams.get(key),
    c.id+' mismatched URL field '+key);
 }
});
test('somber reinforcement uses a separate +10 field, with unambiguous None affinity',()=>{
 const url=new URL(makeTarnishedSameInputUrl({
  weaponName:'Blasphemous Blade',affinityId:-1,upgrade:10,stats,twoHanded:true,reinforcement:'somber'
 }));
 assert.equal(url.searchParams.get('rh1'),'Blasphemous Blade');
 assert.equal(url.searchParams.get('aRh1'),'None');
 assert.equal(url.searchParams.get('somber'),'10');
 assert.equal(url.searchParams.get('smith'),'0');
 assert.equal(url.searchParams.get('twoHanded'),'true');
});
test('every defined affinity maps exactly; unknown variants and invalid data fail closed',()=>{
 assert.equal(TARNISHED_V117_AFFINITIES.length,13);
 for(let i=0;i<TARNISHED_V117_AFFINITIES.length;i++){
  const url=new URL(makeTarnishedSameInputUrl({
   weaponName:'Uchigatana',affinityId:i,upgrade:25,stats
  }));
  assert.equal(url.searchParams.get('aRh1'),TARNISHED_V117_AFFINITIES[i]);
 }
 const base={weaponName:'Uchigatana',affinityId:0,upgrade:25,stats};
 for(const bad of [
  {weaponName:' '},{weaponName:'Bad\nWeapon'},{affinityId:null},{affinityId:13},
  {affinityId:99},{upgrade:26},{upgrade:-1},{upgrade:1.2},
  {stats:{...stats,str:0}},{stats:{...stats,int:100}},
  {twoHanded:'true'},{reinforcement:'unexpected'},
  {reinforcement:'somber',upgrade:11}
 ])assert.throws(()=>makeTarnishedSameInputUrl({...base,...bad}),RangeError);
});
test('numeric compare is only user-entered, never a certified external benchmark',()=>{
 assert.deepEqual(compareUserEnteredReferenceAr(172,'172'),{
  localTotal:172,externalTotal:172,difference:0,matched:true,
  authenticated:false,benchmarkCertified:false
 });
 const mismatch=compareUserEnteredReferenceAr(172,'180');
 assert.equal(mismatch.difference,-8);
 assert.equal(mismatch.matched,false);
 for(const raw of ['','12.5','1e2','abc','-1','20001','100000','  '])
  assert.throws(()=>compareUserEnteredReferenceAr(172,raw),RangeError);
 assert.throws(()=>compareUserEnteredReferenceAr(-1,'100'),RangeError);
});
test('public UI only offers comparison after pinned local result, with no auto fetch',()=>{
 const html=readFileSync(new URL('../public/weapon-ar-calculator/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/src/weapon-ar-calculator-app.mjs',import.meta.url),'utf8');
 assert.match(html,/id="qar-reference-check"[^>]+hidden/);
 assert.match(html,/id="qar-reference-link"/);
 assert.match(html,/id="qar-reference-status"[^>]+aria-live="polite"/);
 assert.match(html,/not an independently authenticated benchmark/);
 assert.match(app,/if\(sourceKind==='pinned'\)/);
 assert.match(app,/clearReferenceComparison\(\)/);
 assert.match(app,/makeTarnishedSameInputUrl/);
 assert.match(app,/compareUserEnteredReferenceAr/);
 assert.doesNotMatch(app,/fetch\(['"]https:\/\/www\.tarnished\.dev/);
});
