import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 validateCommunityCatalog,baseDamageParts,reportedBaseDamageParts,
 publishedUpgradeParts,hasDisputedWeight,searchCatalog
} from '../public/src/community-weapons.mjs';
import {inspectBuildWeapon} from '../public/src/build-weapon-reference.mjs';
import {compareWeaponReferences} from '../public/src/weapon-compare-reference.mjs';
import {LOADOUT_WEAPON_SLOTS,LOADOUT_MANUAL_SLOTS,planEquipmentLoadout} from '../public/src/equipment-loadout.mjs';
import {compareEquipmentSnapshots} from '../public/src/equipment-save-compare.mjs';

const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const catalog=validateCommunityCatalog(JSON.parse(read('data/community-weapon-catalog.json')));
const find=name=>catalog.weapons.find(w=>w.name===name);
const sourceConflict='v117-community-weight-conflict';

test('existing seven disputes are NOT changed; only attribution path exposes conflicting attack figures',()=>{
 assert.equal(catalog.weapons.length,416);
 assert.equal(catalog.meta.v117SourceConflictCount,7);
 const six=catalog.weapons.filter(w=>w.flags?.includes('v117-community-attack-conflict'));
 assert.equal(six.length,6);
 for(const w of six){
  assert.equal(baseDamageParts(w),null,w.name+' must not expose computed source-disputed attack');
  assert.ok(reportedBaseDamageParts(w).length>0,w.name+' still preserves attributed source evidence');
 }
 const axe=find('Smithscript Axe');
 assert.deepEqual(reportedBaseDamageParts(axe),[{name:'Physical',amount:133}]);
 assert.equal(baseDamageParts(axe),null);
 assert.equal(baseDamageParts(find('Stone-Sheathed Sword')),null,'Source-disputed 89 must not become trusted +0');
 assert.deepEqual(reportedBaseDamageParts(find('Stone-Sheathed Sword')),[{name:'Physical',amount:89}]);
 assert.deepEqual(baseDamageParts(find('Milady')),[{name:'Physical',amount:116}]);
 assert.equal(find('Madding Hand').requirements[3],13,'unresolved requirements are not silently adjudicated');
});

test('future +0 source conflict also blocks a previously published +1..+10 reference rather than projecting it',()=>{
 const sword=find('Sword of Night');
 assert.ok(publishedUpgradeParts(sword,10)?.length>0);
 const disputed={...sword,flags:[...(sword.flags??[]),'v117-community-attack-conflict']};
 assert.equal(baseDamageParts(disputed),null);
 assert.equal(publishedUpgradeParts(disputed,0),null);
 assert.equal(publishedUpgradeParts(disputed,10),null);
 assert.deepEqual(reportedBaseDamageParts(disputed),reportedBaseDamageParts(sword));
});

test('future disputed weight cannot become a complete equipment total or roll tier, even after user checks confirmation',()=>{
 const normal=find('Uchigatana'),milady=find('Milady');
 const disputed={...milady,flags:[...(milady.flags??[]),sourceConflict]};
 const weights=[normal,disputed];
 assert.equal(hasDisputedWeight(disputed),true);
 const weaponSlots=Object.fromEntries(LOADOUT_WEAPON_SLOTS.map(s=>[s.id,'']));
 weaponSlots.rh1=disputed.id;
 const manualSlots=Object.fromEntries(LOADOUT_MANUAL_SLOTS.map(s=>[s.id,{mode:'empty',weight:''}]));
 const input={weaponSlots,manualSlots,maxLoad:'75',confirmed:true};
 const result=planEquipmentLoadout(input,weights);
 assert.equal(result.complete,false);
 assert.equal(result.load,null);
 assert.equal(result.allKnown,false);
 assert.equal(result.knownSubtotal,0);
 assert.deepEqual(result.disputedWeights,['Right hand 1 · Milady']);
 assert.match(result.caution,/SOURCE CONFLICT/);
 assert.match(result.unknown[0],/source conflict/);
 const plan=inspectBuildWeapon(weights,disputed.id,[40,20,25,20,20,20,20,20],{allowSote:true});
 assert.equal(plan.weight,null);
 assert.equal(plan.weightDisputed,true);
 assert.equal(plan.reportedWeight,milady.weight);
 assert.match(plan.note,/weight DISPUTED/);
 const baseline={...input};
 const current={...input,weaponSlots:{...weaponSlots,rh1:normal.id}};
 const comparison=compareEquipmentSnapshots(baseline,current,weights);
 assert.equal(comparison.weightDelta,null);
 assert.equal(comparison.exactTiers,false);
 assert.equal(comparison.baseline.complete,false);
 assert.equal(comparison.rows[0].A.weight,null);
 assert.equal(comparison.rows[0].A.sourceDisputed,true);
 assert.equal(comparison.current.complete,true,'unaffected equipped weight remains usable when player confirmed');
});

test('weight filters, sort, and source reference comparison refuse disputed weights',()=>{
 const normal=find('Uchigatana'),w=find('Milady');
 const disputed={...w,flags:[...(w.flags??[]),sourceConflict]};
 const candidates=[disputed,normal];
 assert.equal(searchCatalog(candidates,{term:'Milady',maxWeight:100}).total,0);
 const sorted=searchCatalog(candidates,{sort:'weight'});
 assert.equal(sorted.results.at(-1).id,disputed.id);
 const comparison=compareWeaponReferences(candidates,[disputed.id,normal.id]);
 const weight=comparison.rows.find(x=>x.label==='Weight').values;
 assert.match(weight[0],/DISPUTED \(community/);
 assert.equal(weight[1],String(normal.weight));
 assert.match(comparison.rows.find(x=>x.label==='Source dispute').values[0],/Weight unresolved/);
});

test('catalog display alone may show attributed disputed readings; calculations use gated interfaces',()=>{
 const app=read('src/weapon-catalog-app.mjs');
 assert.match(app,/reportedBaseDamageParts\(chosen\)/);
 assert.match(app,/hasDisputedWeight\(chosen\)/);
 assert.match(app,/SOURCE CONFLICT or missing reference/);
 const equipment=read('src/equipment-loadout-app.mjs');
 assert.match(equipment,/sourceDisputed\?'SOURCE CONFLICT'/);
 const html=read('equip-load-calculator/index.html');
 assert.match(html,/Roll tier \(player-confirmed inputs only\)/);
});
