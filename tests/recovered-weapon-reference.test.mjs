import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
import {validateRecoveredSourceReferences} from '../public/src/recovered-weapon-reference.mjs';
const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const original=validateCommunityCatalog(JSON.parse(read('data/community-weapon-catalog.json')));
const ledger=JSON.parse(read('data/v117-recovered-72-reference.json'));
test('72 recovered items have separately attributed +0 attack, weight and critical, without game certification',()=>{
 const s=validateRecoveredSourceReferences(ledger,original);
 assert.equal(s.total,72);assert.equal(s.attackReferences,72);assert.equal(s.weightReferences,72);
 assert.equal(s.criticalReferences,72);assert.equal(s.scalingReferences,72);
 assert.equal(s.sourceConflicts,2);assert.equal(s.currentGameVerified,0);assert.equal(s.readyForExactAr,0);
 assert.ok(ledger.records.every(x=>x.reference.sourceUrl.startsWith('https://eldenring.wiki.gg/wiki/')));
 assert.equal(ledger.records.filter(x=>x.reference.fieldLocator==="wiki-weapon-class-plus-zero-table").length,69);
 assert.equal(ledger.records.filter(x=>x.reference.fieldLocator==="wiki-individual-weapon-plus-zero-table").length,3);
});
test('Buckler source +0 attack, Visage requirements remain genuinely disputed',()=>{
 const b=ledger.records.find(x=>x.name==='Buckler'),v=ledger.records.find(x=>x.name==='Visage Shield');
 assert.equal(b.reference.attackAtPlusZero[0],60);assert.equal(b.additionalAttackSource.attackAtPlusZero[0],68);
 assert.equal(b.sourceStatus,'SOURCE_CONFLICT');assert.equal(v.requirementsPinned117[0],44);
 assert.equal(v.requirementsFromReference[0],24);assert.equal(v.additionalRequirementSource.requirements[0],44);
 assert.equal(v.sourceStatus,'SOURCE_CONFLICT');
 assert.equal(original.weapons.find(x=>x.id===b.id).attack,null);
 assert.equal(original.weapons.find(x=>x.id===v.id).weight,null);
});
test('impossible source approvals, changed numbers and missing item references fail closed',()=>{
 for(const update of [
  x=>{x.gameClientVerified=true},x=>{x.records[0].gameClientVerified=true},
  x=>{x.records[0].reference.attackAtPlusZero=null},
  x=>{x.records[0].reference.sourceUrl='http://attacker.example/'},
  x=>{x.records.splice(0,1)},
  x=>{x.records.find(v=>v.name==='Visage Shield').disputedFields=[]},
  x=>{x.records.find(v=>v.name==='Buckler').disputedFields=[]}
 ]){
  const item=structuredClone(ledger);update(item);
  assert.throws(()=>validateRecoveredSourceReferences(item,original),RangeError);
 }
});
test('review UI is non-indexable, escapes source values and has no writeback/upload',()=>{
 const html=read('weapon-source-review/index.html'),app=read('src/recovered-weapon-reference-app.mjs');
 assert.match(html,/noindex,nofollow/);
 assert.match(html,/72 Recovered Weapon Source References/);
 assert.ok(app.includes('textContent'));
 assert.ok(!app.includes('innerHTML'));
 assert.ok(!app.includes('POST'));assert.ok(!app.includes('localStorage'));
 assert.ok(app.includes('validateRecoveredSourceReferences'));
});
