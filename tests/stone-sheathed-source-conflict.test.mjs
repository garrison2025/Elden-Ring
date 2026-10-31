import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCommunityCatalog,hasDisputedAttack,hasDisputedWeight,
 baseDamageParts,reportedBaseDamageParts,publishedUpgradeParts,searchCatalog,
 cautionForWeapon} from '../public/src/community-weapons.mjs';
import {getCatalogEvidence} from '../scripts/catalog-evidence.mjs';
import {LOADOUT_WEAPON_SLOTS,LOADOUT_MANUAL_SLOTS,planEquipmentLoadout}
 from '../public/src/equipment-loadout.mjs';

const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
const stone=()=>catalog.weapons.find(w=>w.id==='sote-reference-059');

test('source-backed 89 is the explicit +0 alternative to the published 119 headline; separate 3.5 versus 5 weight conflict retained',()=>{
 assert.equal(validateCommunityCatalog(catalog),catalog);
 const w=stone();assert.ok(w);
 assert.equal(w.name,'Stone-Sheathed Sword');
 assert.equal(w.dataCoverage,'base-reference');
 assert.deepEqual(w.attack,[89,0,0,0,0]);
 assert.equal(w.critical,100);
 assert.deepEqual(w.scaling,['C','D','-','-','-']);
 assert.deepEqual(w.requirements,[16,8,0,0,0]);
 assert.equal(w.weight,3.5);
 assert.equal(w.sourceAttackDisagreement.status,'PUBLISHED_PLUS_ZERO_CONFLICT_NOT_GAME_VERIFIED');
 assert.equal(w.sourceAttackDisagreement.supports.length,3);
 assert.deepEqual(w.sourceAttackDisagreement.supports.map(x=>x.physical),[89,89,89]);
 assert.equal(w.sourceAttackDisagreement.conflict.physical,119);
 assert.equal(w.sourceAttackDisagreement.clientRegulationVerified,false);
 assert.equal(w.sourceAttackDisagreement.sourceIndependenceEstablished,false);
 assert.equal(w.sourceWeightDisagreement.retainedCommunityWeight,3.5);
 assert.equal(w.sourceWeightDisagreement.alternativeWeight,5);
 assert.equal(w.sourceWeightDisagreement.gameClientVerified,false);
 assert.equal(catalog.meta.dlcBaseFactCount,102);
 assert.equal(catalog.meta.dlcWeightOnlyCount,0);
 assert.equal(catalog.meta.stoneSheathedPlusZeroSourceConflictCount,1);
 assert.equal(catalog.meta.stoneSheathedWeightSourceConflictCount,1);
 assert.equal(getCatalogEvidence(catalog).counts.baseAttackPresent,415);
 assert.equal(getCatalogEvidence(catalog).counts.baseAttackSourceUncontested,408);
 assert.equal(getCatalogEvidence(catalog).counts.stoneSheathedSourceAttackDisputes,1);
 assert.equal(getCatalogEvidence(catalog).counts.stoneSheathedSourceWeightDisputes,1);
 assert.equal(catalog.meta.v117SourceConflictCount,7,'Seven historical regulation disputes are separate');
});

test('provisional +0 and disputed weight cannot enter damage filters, trusted upgrade or full roll-tier arithmetic',()=>{
 const w=stone();
 assert.equal(hasDisputedAttack(w),true);
 assert.equal(hasDisputedWeight(w),true);
 assert.deepEqual(reportedBaseDamageParts(w),[{name:'Physical',amount:89}]);
 assert.equal(baseDamageParts(w),null);
 assert.equal(publishedUpgradeParts(w,0),null);
 assert.equal(searchCatalog(catalog.weapons,{term:'Stone-Sheathed Sword'}).total,1);
 assert.equal(searchCatalog(catalog.weapons,{term:'Stone-Sheathed Sword',damage:'physical'}).total,0);
 assert.equal(searchCatalog(catalog.weapons,{term:'Stone-Sheathed Sword',maxWeight:4}).total,0);
 assert.equal(searchCatalog(catalog.weapons,{term:'Stone-Sheathed Sword',maxWeight:6}).total,0);
 assert.ok(cautionForWeapon(w).some(s=>s.includes('89 physical')));
 assert.ok(cautionForWeapon(w).some(s=>s.includes('3.5 conflicts')));
 const slots=Object.fromEntries(LOADOUT_WEAPON_SLOTS.map(x=>[x.id,'']));slots.rh1=w.id;
 const manual=Object.fromEntries(LOADOUT_MANUAL_SLOTS.map(x=>[x.id,{mode:'empty',weight:''}]));
 const load=planEquipmentLoadout({weaponSlots:slots,manualSlots:manual,maxLoad:'75',confirmed:true},catalog.weapons);
 assert.equal(load.complete,false);
 assert.equal(load.load,null);
 assert.equal(load.knownSubtotal,0);
 assert.ok(load.disputedWeights.some(s=>s.includes('Stone-Sheathed Sword')));
});

test('source evidence tampering and pretend game-client verification are rejected by catalog schema',()=>{
 const bad=[
  w=>{w.attack[0]=119;},
  w=>{w.attack[0]=90;},
  w=>{w.critical=110;},
  w=>{w.scaling[0]='B';},
  w=>{w.weight=5;},
  w=>{w.sourceAttackDisagreement.supports[0].physical=119;},
  w=>{w.sourceAttackDisagreement.supports[1].url='https://example.test/';},
  w=>{w.sourceAttackDisagreement.conflict.physical=89;},
  w=>{w.sourceAttackDisagreement.clientRegulationVerified=true;},
  w=>{w.sourceAttackDisagreement.sourceIndependenceEstablished=true;},
  w=>{w.sourceWeightDisagreement.alternativeWeight=3.5;},
  w=>{w.sourceWeightDisagreement.gameClientVerified=true;},
  w=>{w.flags=w.flags.filter(x=>x!=='stone-sheathed-attack-source-conflict');},
  w=>{w.flags=w.flags.filter(x=>x!=='stone-sheathed-weight-source-conflict');}
 ];
 for(const change of bad){
  const copy=structuredClone(catalog);change(copy.weapons.find(w=>w.id==='sote-reference-059'));
  assert.throws(()=>validateCommunityCatalog(copy),RangeError);
 }
 const copy=structuredClone(catalog);copy.meta.dlcBaseFactCount=101;
 assert.throws(()=>validateCommunityCatalog(copy),/metadata mismatch/);
});
