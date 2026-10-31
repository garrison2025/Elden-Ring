import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
import {validateRecoveredSourceReferences} from '../public/src/recovered-weapon-reference.mjs';
const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const original=validateCommunityCatalog(JSON.parse(read('data/community-weapon-catalog.json')));
const ledger=JSON.parse(read('data/v117-recovered-72-reference.json'));
test('all 72 recovered weapons have cited wiki +0 and distinct 72 individually checked secondary pages, never game certified',()=>{
 const s=validateRecoveredSourceReferences(ledger,original);
 assert.equal(s.total,72);assert.equal(s.attackReferences,72);assert.equal(s.weightReferences,72);
 assert.equal(s.criticalReferences,72);assert.equal(s.scalingReferences,72);
 assert.equal(s.crosscheckedReferences,72);assert.equal(s.sourceConflicts,8);
 assert.equal(s.attackConflicts,5);assert.equal(s.scalingConflicts,3);assert.equal(s.requirementConflicts,1);
 assert.equal(s.unknownScalingGrades,126);
 assert.equal(s.currentGameVerified,0);assert.equal(s.readyForExactAr,0);
 assert.equal(ledger.records.filter(x=>x.reference.fieldLocator==="wiki-weapon-class-plus-zero-table").length,69);
 assert.equal(ledger.records.filter(x=>x.reference.fieldLocator==="wiki-individual-weapon-plus-zero-table").length,2);
 assert.equal(ledger.records.filter(x=>x.reference.fieldLocator==="wiki-individual-weapon-infobox-plus-zero").length,1);
 assert.equal(new Set(ledger.records.map(x=>x.crosscheck.sourceUrl)).size,72);
 assert.ok(ledger.records.every(x=>x.crosscheck.gameClientVerified===false&&x.gameClientVerified===false));
 assert.ok(ledger.records.every(x=>original.weapons.find(w=>w.id===x.id).attack===null));
 assert.ok(ledger.records.every(x=>original.weapons.find(w=>w.id===x.id).weight===null));
});
test('seven source-audit groups plus Visage remain unresolved and no numbers are silently selected',()=>{
 const list=validateRecoveredSourceReferences(ledger,original).conflicts;
 assert.deepEqual(list.map(x=>x.name).sort(),[
  'Buckler',"Carian Knight's Shield",'Dragonclaw Shield','Erdtree Greatshield',
  'Fingerprint Stone Shield','Golden Greatshield','Inseparable Sword','Visage Shield'
 ].sort());
 const b=ledger.records.find(x=>x.name==='Buckler'),v=ledger.records.find(x=>x.name==='Visage Shield');
 assert.equal(b.reference.attackAtPlusZero[0],60);assert.equal(b.crosscheck.attackAtPlusZero[0],68);
 assert.deepEqual(b.disputedFields,['attackAtPlusZero','scalingAtPlusZero']);
 assert.equal(v.requirementsPinned117[0],44);assert.equal(v.requirementsFromReference[0],24);
 assert.equal(v.crosscheck.weight,24);assert.deepEqual(v.disputedFields,['requirements']);
 const carian=ledger.records.find(x=>x.name==="Carian Knight's Shield");
 assert.equal(carian.reference.attackAtPlusZero[1],63);assert.equal(carian.crosscheck.attackAtPlusZero[1],40);
});
test('one formerly unknown Perfumer STR grade has exact secondary citation and Gravel Stone Seal is labelled as infobox not imaginary table',()=>{
 const p=ledger.records.find(x=>x.name==="Perfumer's Shield"),g=ledger.records.find(x=>x.name==='Gravel Stone Seal');
 assert.equal(p.reference.scalingAtPlusZero[0],'E');
 assert.equal(p.provisionalScalingGradeCitations[0].sourceUrl,p.crosscheck.sourceUrl);
 assert.equal(p.gameClientVerified,false);
 assert.equal(g.reference.fieldLocator,'wiki-individual-weapon-infobox-plus-zero');
 assert.equal(g.perWeaponNumericCorroboration.attackAtPlusZero[0],25);
 assert.equal(g.perWeaponNumericCorroboration.gameClientVerified,false);
});
test('tampered metadata, fake gameplay approvals, conflict suppression and missing sources always fail closed',()=>{
 for(const update of [
  x=>{x.gameClientVerified=true},x=>{x.records[0].gameClientVerified=true},
  x=>{x.records[0].reference.attackAtPlusZero=null},
  x=>{x.records[0].reference.sourceUrl='https://example.com/'},
  x=>{x.records.splice(0,1)},
  x=>{x.records[0].crosscheck.gameClientVerified=true},
  x=>{x.records[0].crosscheck.scalingGradesAsReported=[1,2,3,4,5]},
  x=>{x.records.find(v=>v.name==='Buckler').disputedFields=[]},
  x=>{x.records.find(v=>v.name==='Carian Knight\'s Shield').crosscheck.attackAtPlusZero[1]=63},
  x=>{x.records.find(v=>v.name==='Visage Shield').disputedFields=[]},
  x=>{x.unknownScalingGradeCount=0}
 ]){
  const item=structuredClone(ledger);update(item);
  assert.throws(()=>validateRecoveredSourceReferences(item,original),RangeError);
 }
});
test('review UI renders explicit second-source evidence and preserves zero certification',()=>{
 const html=read('weapon-source-review/index.html'),app=read('src/recovered-weapon-reference-app.mjs');
 assert.match(html,/noindex,nofollow/);assert.match(html,/72 Recovered Weapon Source References/);
 assert.ok(html.includes('Independent published reference'));
 assert.ok(app.includes('crosscheck.scalingGradesAsReported'));
 assert.ok(app.includes('textContent'));assert.ok(!app.includes('innerHTML'));
 assert.ok(!app.includes('POST'));assert.ok(!app.includes('localStorage'));
 assert.ok(app.includes('validateRecoveredSourceReferences'));
});
