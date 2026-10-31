import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
import {validateRecoveredSourceReferences} from '../public/src/recovered-weapon-reference.mjs';
import {buildRecoveredWeaponPreview} from '../public/src/recovered-weapon-preview.mjs';
const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const catalog=validateCommunityCatalog(JSON.parse(read('data/community-weapon-catalog.json')));
const ledger=JSON.parse(read('data/v117-recovered-72-reference.json'));
validateRecoveredSourceReferences(ledger,catalog);
const originalMap=new Map(catalog.weapons.map(w=>[w.id,w]));
test('72 preview-only published source records can be read without altering canonical calculator catalog',()=>{
 let count=0,unknown=0,disputes=0;
 for(const item of ledger.records){
  const orig=originalMap.get(item.id),before=structuredClone(orig);
  const preview=buildRecoveredWeaponPreview(orig,item);
  assert.ok(preview);assert.equal(preview.sourceOnly,true);
  assert.equal(preview.gameClientVerified,false);assert.equal(preview.readyForExactAR,false);
  assert.equal(preview.attack.length,5);assert.equal(preview.scaling.length,5);
  assert.equal(preview.requirements.length,5);
  assert.equal(preview.weight,item.reference.weight);
  assert.equal(preview.critical,item.reference.critical);
  assert.deepEqual(orig,before);
  assert.equal(orig.attack,null);assert.equal(orig.weight,null);
  assert.equal(orig.scaling,null);assert.equal(orig.critical,null);
  count++;unknown+=preview.unknownScalingCells;
  if(preview.sourceConflicts.length)disputes++;
 }
 assert.equal(count,72);assert.equal(unknown,15);assert.equal(disputes,8);
 assert.equal(ledger.records.reduce((n,w)=>n+(w.explicitInitialScalingSource?.originallyUnreportedGradeCells||0),0),111);
});
test('published source omission is not synthesized as numeric zero or a verified absent scaling',()=>{
 const w=ledger.records.find(x=>x.name==='Dragonclaw Shield');
 const p=buildRecoveredWeaponPreview(originalMap.get(w.id),w);
 assert.equal(p.attack[3].primary,76);
 assert.equal(p.attack[3].secondary,null);
 assert.equal(p.attack[3].evidence,'SECONDARY_NOT_LISTED');
 const alb=ledger.records.find(x=>x.name==='Albinauric Shield');
 const a=buildRecoveredWeaponPreview(originalMap.get(alb.id),alb);
 assert.equal(a.scaling[1].primary,null);
 assert.equal(a.scaling[1].secondary,null);
 assert.equal(a.scaling[1].evidence,'EXPLICIT_THIRD_SOURCE');
 assert.equal(a.scaling[1].explicitThird,'-');
 const s=ledger.records.find(x=>x.name==='Spiralhorn Shield');
 const sp=buildRecoveredWeaponPreview(originalMap.get(s.id),s);
 assert.equal(sp.scaling[2].evidence,'UNREPORTED');
});
test('conflicting published grade, attack and requirement displayed separately with third-source link',()=>{
 const buck=ledger.records.find(x=>x.name==='Buckler');
 const p=buildRecoveredWeaponPreview(originalMap.get(buck.id),buck);
 assert.equal(p.attack[0].evidence,'SOURCE_CONFLICT');
 assert.deepEqual([p.attack[0].primary,p.attack[0].secondary],[60,68]);
 assert.equal(p.scaling[1].evidence,'SOURCE_CONFLICT');
 assert.deepEqual([p.scaling[1].primary,p.scaling[1].secondary],['-','D']);
 assert.ok(p.sourceCUrl.startsWith('https://wiki.eso-ui.com/'));
 const visage=ledger.records.find(x=>x.name==='Visage Shield');
 const v=buildRecoveredWeaponPreview(originalMap.get(visage.id),visage);
 assert.equal(v.requirements[0].evidence,'SOURCE_CONFLICT');
 assert.deepEqual([v.requirements[0].primary,v.requirements[0].secondary],[44,24]);
});
test('unmatched or purportedly verified source cannot contaminate catalog UI',()=>{
 const w=ledger.records[0],orig=originalMap.get(w.id);
 for(const modify of [
  x=>{x.gameClientVerified=true},
  x=>{x.crosscheck.gameClientVerified=true},
  x=>{x.reference.publicationApproved=true},
  x=>{x.name='Different armament'}
 ]){
  const bad=structuredClone(w);modify(bad);
  assert.throws(()=>buildRecoveredWeaponPreview(orig,bad),RangeError);
 }
 assert.equal(buildRecoveredWeaponPreview(catalog.weapons.find(x=>x.name==='Uchigatana'),ledger.records[0]),null);
});
test('main weapon database now uses validated, preview-only field evidence; no source data becomes exact AR input',()=>{
 const source=read('src/weapon-catalog-app.mjs'),page=read('weapon-database/index.html');
 assert.ok(source.includes('validateRecoveredSourceReferences('));
 assert.ok(source.includes('buildRecoveredWeaponPreview('));
 assert.ok(source.includes('catalog-source-preview'));
 assert.ok(source.includes('referenceOnlyMap'));
 assert.ok(source.includes('sourceAUrl'));
 assert.ok(page.includes('id="catalog-source-preview"'));
 assert.ok(page.includes('id="catalog-source-attack"'));
 assert.ok(page.includes('id="catalog-source-scaling"'));
 assert.ok(page.includes('id="catalog-source-requirements"'));
 assert.ok(page.includes('not used by weight, damage, AR or sort'));
 assert.ok(source.includes('chosen.weight===null'));
});


test('game screenshot QA link only appears for dispute cases and uses exact valid weapon deep links',()=>{
 const app=read('src/weapon-catalog-app.mjs'),qa=read('src/current-game-qa-app.mjs');
 assert.ok(app.includes("record.sourceConflicts.length===0"));
 assert.ok(app.includes("url.searchParams.set('weapon',chosen.id)"));
 assert.ok(qa.includes("new URLSearchParams(location.search).get('weapon')"));
 assert.ok(qa.includes("queue.cases.find(x=>x.weaponId===requested)"));
});
