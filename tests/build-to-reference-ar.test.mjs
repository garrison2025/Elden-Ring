import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeBuildToReferenceArUrl} from '../public/src/build-to-reference-ar.mjs';
import {parseArWorkbenchHandoff} from '../public/src/ar-workbench-navigation.mjs';
import {inspectBuildWeapon} from '../public/src/build-weapon-reference.mjs';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
const catalog=validateCommunityCatalog(JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8')));
const byName=name=>catalog.weapons.find(w=>w.name===name);
const samurai=[12,11,13,12,15,9,8,8];
test('real selected Uchigatana carries only five combat attributes to opt-in AR page',()=>{
 const model=inspectBuildWeapon(catalog.weapons,byName('Uchigatana').id,samurai);
 const url=makeBuildToReferenceArUrl(model,samurai);
 assert.equal(url,'../weapon-ar-calculator/?weapon=Uchigatana&player=12%2C15%2C9%2C8%2C8');
 const received=parseArWorkbenchHandoff(new URL(url,'https://test.example/build-planner/').search);
 assert.deepEqual(received,{weapon:'Uchigatana',stats:[12,15,9,8,8],upgrade:null});
 assert.equal(url.includes('affinity'),false);
 assert.equal(url.includes('upgrade'),false);
 assert.equal(url.includes('ar='),false);
});
test('SOTE name and explicitly disputed +0 source data are not copied into AR link',()=>{
 const milady=byName('Milady');
 const model=inspectBuildWeapon(catalog.weapons,milady.id,samurai,{allowSote:true});
 assert.equal(parseArWorkbenchHandoff(new URL(makeBuildToReferenceArUrl(model,samurai),
  'https://site.example/build-planner/').search).weapon,'Milady');
 const sword=byName('Stone-Sheathed Sword');
 const disputed=inspectBuildWeapon(catalog.weapons,sword.id,samurai,{allowSote:true});
 assert.equal(disputed.attackDisputed,true);
 assert.ok(makeBuildToReferenceArUrl(disputed,samurai).includes('Stone-Sheathed+Sword'));
});
test('invalid selected ID, unavailable weapon and malformed stats are rejected',()=>{
 const model=inspectBuildWeapon(catalog.weapons,byName('Uchigatana').id,samurai);
 for(const weapon of [null,{},'fake',{...model,id:'../invalid'},{...model,name:' '},
  {...model,name:'x'.repeat(101)}])
  assert.throws(()=>makeBuildToReferenceArUrl(weapon,samurai),RangeError);
 for(const stats of [[],null,samurai.slice(0,7),[...samurai.slice(0,7),100],
  [...samurai.slice(0,7),'8'],[...samurai.slice(0,7),0]])
  assert.throws(()=>makeBuildToReferenceArUrl(model,stats),RangeError);
});
test('Build Planner only reveals AR handoff from a valid selected weapon and still requires source opt in',()=>{
 const html=readFileSync(new URL('../public/build-planner/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/src/app.mjs',import.meta.url),'utf8');
 const ar=readFileSync(new URL('../public/weapon-ar-calculator/index.html',import.meta.url),'utf8');
 assert.match(html,/id="build-weapon-ar-link"[^>]*hidden/);
 assert.match(html,/five combat attributes/);
 assert.match(html,/id="build-planner-workflow"/);
 assert.match(app,/const weaponDetails=\$\('#build-weapon-detail-link'\),weaponAr=\$\('#build-weapon-ar-link'\)/);
 assert.match(app,/weaponAr\.href=makeBuildToReferenceArUrl\(model,stats\)/);
 assert.match(app,/weaponDetails\.hidden=true;weaponAr\.hidden=true/);
 assert.match(ar,/id="qar-load-source"/);
 assert.match(ar,/id="qar-workspace" hidden/);
});
