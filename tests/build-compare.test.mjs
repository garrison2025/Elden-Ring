import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLASSES,runeRange,runeCostForLevel,STATS} from '../public/src/core.mjs';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
import {normalizeBuildComparisonSnapshot,compareBuildSnapshots}
 from '../public/src/build-compare.mjs';

const catalog=validateCommunityCatalog(JSON.parse(readFileSync(
 new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8')));
const find=name=>catalog.weapons.find(w=>w.name===name);
const source=CLASSES.find(c=>c.name==='Samurai');
const state=overrides=>({
 origin:source.name,stats:[...source.stats],
 weaponId:null,ownsTarnishedPack:false,ownsSote:false,...overrides
});
test('pure A/B compares changed attribute, level, and per-origin upgrade rune budget',()=>{
 const A=state(),B=state({stats:source.stats.map((v,i)=>i===0?v+1:v)});
 const result=compareBuildSnapshots(A,B);
 assert.equal(result.sameOrigin,true);
 assert.equal(result.baseline.level,9);
 assert.equal(result.current.level,10);
 assert.equal(result.levelDelta,1);
 assert.equal(result.allocatedDelta,1);
 assert.equal(result.runeBudgetDelta,runeCostForLevel(9));
 assert.equal(result.changedStats,1);
 assert.equal(result.statRows.length,8);
 assert.equal(result.statRows[0].label,STATS[0]);
 assert.deepEqual(result.statRows[0],{label:'Vigor',baseline:12,current:13,delta:1});
 assert.equal(result.baseline.weapon,null);
 assert.match(result.note,/NOT a respec cost/);
});
test('different starting origins have independent source level and rune costs',()=>{
 const wretch=CLASSES.find(c=>c.name==='Wretch');
 const result=compareBuildSnapshots(state(),{
  origin:'Wretch',stats:[...wretch.stats],
  weaponId:null,ownsTarnishedPack:false,ownsSote:false
 });
 assert.equal(result.sameOrigin,false);
 assert.equal(result.baseline.level,source.level);
 assert.equal(result.current.level,1);
 assert.equal(result.levelDelta,1-source.level);
 assert.equal(result.current.runeBudget,0);
 assert.equal(result.baseline.runeBudget,runeRange(source.level,source.level));
 assert.equal(result.allocatedDelta,0);
});
test('comparisons use the chosen existing sourced weapon and never claim AR',()=>{
 const katana=find('Uchigatana'),great=find('Greatsword');
 const A=state({weaponId:katana.id});
 const B=state({weaponId:great.id,stats:[...source.stats]});
 const result=compareBuildSnapshots(A,B,{weapons:catalog.weapons});
 assert.equal(result.baseline.weapon.id,katana.id);
 assert.equal(result.current.weapon.id,great.id);
 assert.equal(result.sameWeapon,false);
 assert.equal(result.baseline.weapon.oneHanded,false);
 assert.equal(result.current.weapon.oneHanded,false);
 assert.equal(result.current.weapon.missingOneHanded>0,true);
 assert.equal(Object.hasOwn(result.current.weapon,'attackAtZero'),false);
 assert.equal(Object.hasOwn(result.current.weapon,'ar'),false);
 assert.match(result.note,/community references/);
});
test('extra-content starting class and SOTE weapon require explicit separate switches',()=>{
 const extra=CLASSES.find(c=>c.name==='Idus Knight');
 assert.throws(()=>normalizeBuildComparisonSnapshot({
  origin:extra.name,stats:[...extra.stats],weaponId:null,
  ownsTarnishedPack:false,ownsSote:true
 }),/requires Tarnished Pack/);
 const ok=normalizeBuildComparisonSnapshot({
  origin:extra.name,stats:[...extra.stats],weaponId:null,
  ownsTarnishedPack:true,ownsSote:false
 });
 assert.equal(ok.origin,'Idus Knight');
 const sword=find('Sword of Night');
 assert.throws(()=>compareBuildSnapshots(state({weaponId:sword.id}),state(),{
  weapons:catalog.weapons
 }),/Enable Shadow of the Erdtree/);
 const allowed=compareBuildSnapshots(state({weaponId:sword.id,ownsSote:true}),state(),{
  weapons:catalog.weapons
 });
 assert.equal(allowed.baseline.weapon.name,'Sword of Night');
 assert.equal(allowed.current.weapon,null);
});
test('invalid stats, unknown weapon and unvalidated versions reject rather than silently replace',()=>{
 const wrong=[
  state({origin:'unknown'}),
  state({stats:[1,2,3]}),
  state({stats:source.stats.map((n,i)=>i===3?n-1:n)}),
  state({stats:source.stats.map((n,i)=>i===4?'20':n)}),
  state({ownsSote:'1'}),
  state({weaponId:'../other'}),
  state({weaponId:find('Greatsword').id})
 ];
 for(const snapshot of wrong.slice(0,-1))
  assert.throws(()=>normalizeBuildComparisonSnapshot(snapshot),RangeError);
 assert.throws(()=>compareBuildSnapshots(wrong.at(-1),state()),/catalog is unavailable/);
 assert.throws(()=>compareBuildSnapshots(state({weaponId:'unknown-id'}),state(),{
  weapons:catalog.weapons
 }),/no longer exists/);
 assert.throws(()=>normalizeBuildComparisonSnapshot(null),RangeError);
});
test('A snapshot is a detached baseline unaffected by later edits',()=>{
 const current=state();
 const pinned=normalizeBuildComparisonSnapshot(current);
 current.stats[0]=99;current.ownsSote=true;
 assert.equal(pinned.stats[0],source.stats[0]);
 assert.equal(pinned.ownsSote,false);
 const comparison=compareBuildSnapshots(pinned,state());
 assert.equal(comparison.changedStats,0);
});
test('Build Planner A/B controls, renderer, noindex and non-persistence are wired',()=>{
 const html=readFileSync(new URL('../public/build-planner/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/src/app.mjs',import.meta.url),'utf8');
 const styles=readFileSync(new URL('../public/assets/style.css',import.meta.url),'utf8');
 for(const id of ['build-ab-title','build-ab-pin','build-ab-clear','build-ab-status',
  'build-ab-results','build-ab-origin-a','build-ab-origin-b','build-ab-summary-a',
  'build-ab-summary-b','build-ab-rows','build-ab-weapon-a','build-ab-weapon-b']){
  assert.equal(html.split('id="'+id+'"').length-1,1,id);
 }
 assert.ok(app.includes("compareBuildSnapshots(pinnedBuild,getComparisonSnapshot(stats),"));
 assert.ok(app.includes("$('#build-ab-pin').addEventListener('click'"));
 assert.ok(app.includes("$('#build-ab-clear').addEventListener('click'"));
 assert.ok(app.includes("let pinnedBuild=null"));
 assert.ok(app.includes("renderBuildComparison(v)"));
 assert.ok(styles.includes('.build-ab-cards{display:grid;'));
 assert.ok(html.includes('temporary baseline is not uploaded or added to share links'));
 // Build Planner is deliberately noindex in the research release build,
 // not a new unsupported standalone weapon AR page.
 assert.ok(html.includes('id="build-ab-results" hidden'));
});
