import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_DISPUTED_UI_CANDIDATES as cases} from '../scripts/tarnished-v117-disputed-candidates.mjs';
import {compareDisputeRounds} from '../scripts/verify-tarnished-dispute-repeats.mjs';
import {makeTarnishedSameInputUrl,TARNISHED_V117_AFFINITIES} from '../public/src/tarnished-same-input.mjs';
const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
test('18 targeted disputed and source-missing exact public competitor inputs are valid and present locally',()=>{
 assert.equal(cases.length,18);
 assert.equal(new Set(cases.map(c=>c.id)).size,18);
 const names=new Set(catalog.weapons.map(w=>w.name));
 for(const c of cases){
  assert.ok(names.has(c.weaponName),c.weaponName);
  assert.equal(Object.hasOwn(c,'observedAr'),false);
  assert.equal(Object.hasOwn(c,'expectedTotal'),false);
  const affinityId=c.affinity==='None'?-1:TARNISHED_V117_AFFINITIES.indexOf(c.affinity);
  const u=makeTarnishedSameInputUrl({weaponName:c.weaponName,affinityId,upgrade:c.upgrade,
    stats:{str:c.str,dex:c.dex,int:c.int,fai:c.fai,arc:c.arc},
    twoHanded:c.twoHanded,reinforcement:c.somber?'somber':'smithing'});
  assert.ok(u.startsWith('https://www.tarnished.dev/build-planner?'),c.id);
 }
 assert.ok(cases.filter(c=>c.id.startsWith('missing-')).length>=4);
 assert.ok(cases.filter(c=>c.id.startsWith('conflict-')).length>=10);
});
test('repeat audit approves only two exact same-input comparator/source matches',()=>{
 const fake=c=>({id:c.id,weapon:c.weaponName,status:'matched-unpromoted',observed:142,calculated:142,delta:0});
 const a={results:cases.map(fake)};
 const good=compareDisputeRounds(a,a);
 assert.equal(good.counts.twiceMatched,18);
 assert.equal(good.countedAsNewApproved,0,'raw browser runs are not automatically authoritative fixtures');
 const changed={results:a.results.map((x,i)=>i===0?{...x,observed:143}:x)};
 assert.equal(compareDisputeRounds(a,changed).counts.inconsistent,1);
 const bad={results:a.results.map((x,i)=>i===1?{...x,status:'numeric-mismatch',delta:1}:x)};
 assert.equal(compareDisputeRounds(a,bad).counts.mismatched,1);
 const missing={results:a.results.slice(1)};
 assert.throws(()=>compareDisputeRounds(a,missing),RangeError);
});
