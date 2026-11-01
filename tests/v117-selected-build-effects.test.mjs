import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {emptyBuildLoadout,evaluateBuildLoadout} from '../public/src/build-loadout.mjs';
import {previewV117SelectedBuildEffects as preview} from '../public/src/v117-selected-build-effects.mjs';
import {V117_ISOLATED_SELECTED_EFFECTS as known} from '../public/src/v117-isolated-effect-goldens.mjs';
import {V117_TALISMAN_SINGLE_SELECTION as MATRIX} from '../public/src/v117-talisman-isolated-matrix.mjs';
const base=Array(8).fill(10);
const load=(type,name)=>{const s=emptyBuildLoadout();
 if(type==='talisman')s.talismans[0]=name;
 if(type==='rune')s.greatRune=name;
 if(type==='physick')s.crystalTears[0]=name;
 return s;
};
test('three genuine twice-read single-selection reference rows stay exact, no conflated activation',()=>{
 const targets=[
  ['talisman','Starscourge Heirloom',[10,10,10,15,10,10,10,10],false],
  ['rune',"Godrick's Great Rune",[15,15,15,15,15,15,15,15],true],
  ['physick','Intelligence-knot Crystal Tear',[10,10,10,10,10,20,10,10],true]
 ];
 assert.equal(Object.keys(known).length,16);
 for(const [type,name,expected,mismatch] of targets){
  const x=preview(base,load(type,name));
  assert.equal(x.items.length,1);
  assert.equal(x.items[0].status,'direct-site-same-input-selection');
  assert.deepEqual(x.items[0].values,expected);
  assert.equal(x.items[0].checkBoxMismatch,mismatch);
  assert.equal(x.items[0].sourceJobs.length,2);
  if(mismatch)assert.match(x.items[0].note,/checkbox still OFF/);
 }
});
test('new same-name entry combined with other effect never presents a fully checked Build',()=>{
 const s=load('talisman','Starscourge Heirloom');
 s.greatRune="Godrick's Great Rune";s.crystalTears[0]='Intelligence-knot Crystal Tear';
 const out=preview(base,s);
 assert.equal(out.items.length,3);
 for(const x of out.items)assert.equal(x.status,'isolated-effect-arithmetic-not-full-build');
 assert.match(out.note,/never sum multiple/);
 assert.equal(preview(base,s,{origin:'Samurai'}).items.length,3);
});
test('unobserved effects never invent a numeric result; caps fail closed',()=>{
 const x=load('talisman','Unknown Placeholder Talisman');
 assert.equal(preview(base,x).items.length,0);
 assert.equal(preview(base,x).unresolved[0],'talisman: Unknown Placeholder Talisman');
 const rune=load('rune',"Godrick's Great Rune"),stats=[98,10,10,10,10,10,10,10];
 assert.equal(preview(stats,rune).items[0].status,'unverified-stat-cap');
 assert.equal(preview(stats,rune).items[0].values,null);
 assert.throws(()=>preview([100,...base.slice(1)],rune),RangeError);
});
test('talisman weight is only exact for real Wretch 0.8 source record, unknown names prevent fictitious exact load',()=>{
 const catalog={weapons:[]},a=evaluateBuildLoadout(load('talisman','Starscourge Heirloom'),catalog);
 assert.equal(a.exactTotal,0.8);
 assert.equal(a.items[0].provenance,'tarnished-dev-v1.17-direct-ui-double-read');
 const unknown=evaluateBuildLoadout(load('talisman','Unknown Weight Talisman'),catalog);
 assert.equal(unknown.exactTotal,null);
 assert.ok(unknown.unknowns.some(x=>x.slot==='Talisman 1'));
});
test('UI renders source-gated selected-item preview separate from real Build base formulas',()=>{
 const app=readFileSync(new URL('../public/src/build-loadout-app.mjs',import.meta.url),'utf8');
 assert.match(app,/previewV117SelectedBuildEffects\(topStats\(\),evaluated.state/);
 assert.match(app,/build-v117-isolated-effect-results/);
 assert.match(app,/effectSelection\.note/);
});

test('fourteen real talisman weights and isolated Wretch10 Build data have double site-proof identities',()=>{
 assert.equal(Object.keys(MATRIX).length,14);
 const catalog={weapons:[]};
 for(const record of Object.values(MATRIX)){
  assert.equal(record.sourceJobs.length,2);
  assert.notEqual(record.sourceJobs[0],record.sourceJobs[1]);
  assert.ok(Number.isFinite(record.weight));
  assert.equal(Object.keys(record.defensiveFields).length,12);
  const input=load('talisman',record.name);
  const x=preview(base,input).items[0];
  assert.equal(x.status,'direct-site-same-input-selection');
  assert.deepEqual(x.bonus,record.delta);
  assert.deepEqual(x.siteObserved.vitals,record.vitals);
  assert.equal(evaluateBuildLoadout(input,catalog).exactTotal,record.weight);
 }
});
test('seal penalty negation, Wretch special HP/stamina/load and discovery are actual browser references, not arithmetic full-Build claims',()=>{
 assert.equal(MATRIX["Radagon's Scarseal"].defensiveFields.physical,-10);
 assert.equal(MATRIX["Radagon's Soreseal"].defensiveFields.magic,-15);
 assert.equal(MATRIX["Marika's Scarseal"].defensiveFields.holy,-10);
 assert.equal(MATRIX["Marika's Soreseal"].defensiveFields.lightning,-15);
 assert.equal(MATRIX['Silver Scarab'].vitals.Discovery,185);
 assert.equal(MATRIX["Erdtree's Favor +2"].vitals.HP,430);
 assert.equal(MATRIX["Erdtree's Favor +2"].vitals.Stamina,105);
 assert.equal(MATRIX["Erdtree's Favor +2"].maxEquipLoad,52);
 assert.equal(MATRIX["Great-Jar's Arsenal"].maxEquipLoad,57.3);
 assert.equal(preview([20,10,10,10,10,10,10,10],
  load('talisman',"Erdtree's Favor +2")).items[0].siteObserved,null);
});
