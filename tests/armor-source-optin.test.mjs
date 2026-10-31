import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARMOR_SOURCE_COUNT,ARMOR_SOURCE_URL,inspectArmorSource,
 loadPinnedArmorSource,findExactArmor} from '../public/src/armor-source-optin.mjs';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
import {emptyBuildLoadout,evaluateBuildLoadout,encodeBuildLoadout,
 decodeBuildLoadout} from '../public/src/build-loadout.mjs';
const catalog=validateCommunityCatalog(JSON.parse(readFileSync(
 new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8')));
const categories=['Helm','Chest Armor','Gauntlets','Leg Armor'];
const fake=()=>Array.from({length:568},(_,i)=>({
 id:'fictional-'+String(i).padStart(7,'0')+'-qa-only',
 name:'FICTIONAL ITEM '+i,weight:1+i/100,
 category:categories[i%4],
 image:'https://not-used.invalid/photo.png',description:'DO NOT COPY!'
}));
test('source parser validates exact pinned count/categories and strips images, descriptions, effect claims',()=>{
 const result=inspectArmorSource(JSON.stringify(fake()));
 assert.equal(result.count,ARMOR_SOURCE_COUNT);
 assert.deepEqual(Object.keys(result.armors[0]),['id','name','slot','weight']);
 assert.equal(result.armors[0].slot,'Head');
 assert.equal(result.armors[1].slot,'Chest');
 assert.equal(result.armors[2].slot,'Arms');
 assert.equal(result.armors[3].slot,'Legs');
 assert.equal(findExactArmor(result.armors,'Head','fictional item 0').weight,1);
 assert.equal(findExactArmor(result.armors,'Legs','FICTIONAL ITEM 0'),null);
 assert.match(result.description,/NOT game-client/);
});
test('strict source fails closed for changed count, duplicate IDs, negative weights or unknown slot',()=>{
 const src=fake();
 for(const data of [
  src.slice(1),[...src,{...src[0]}],
  src.map((a,i)=>i===3?{...a,weight:-1}:a),
  src.map((a,i)=>i===4?{...a,category:'Fake Accessory'}:a),
  src.map((a,i)=>i===5?{...a,id:src[0].id}:a)
 ])assert.throws(()=>inspectArmorSource(JSON.stringify(data)),RangeError);
 assert.throws(()=>inspectArmorSource('JSON.parse(1)'),/strict JSON/);
});
test('source user click uses pinned fixed commit and strips credentials',async()=>{
 let calls=0;
 const result=await loadPinnedArmorSource(async(url,options)=>{
  calls++;assert.equal(url,ARMOR_SOURCE_URL);
  assert.equal(options.credentials,'omit');
  assert.equal(options.redirect,'error');
  return {ok:true,headers:{get:()=>String(JSON.stringify(fake()).length)},
   text:async()=>JSON.stringify(fake())};
 });
 assert.equal(calls,1);assert.equal(result.count,568);
});
test('sourced armor weight cannot be invented by stale saved JSON before original source is explicitly loaded',()=>{
 const armors=inspectArmorSource(JSON.stringify(fake())).armors;
 const state=emptyBuildLoadout();
 state.armorSlots[0]={name:'FICTIONAL ITEM 0',weight:'1',weightSource:'community'};
 state.maxEquipLoad='70';
 let result=evaluateBuildLoadout(state,catalog);
 assert.equal(result.exactTotal,null);
 assert.equal(result.unknowns.length,1);
 result=evaluateBuildLoadout(state,catalog,{armorReference:armors});
 assert.equal(result.exactTotal,1);
 assert.equal(result.items[0].provenance,'pinned-community-armor-unverified');
 const restored=decodeBuildLoadout(encodeBuildLoadout(state));
 assert.equal(evaluateBuildLoadout(restored,catalog).exactTotal,null);
 restored.armorSlots[0].weight='99';
 assert.equal(evaluateBuildLoadout(restored,catalog,{armorReference:armors}).exactTotal,null);
 restored.armorSlots[0].weightSource='manual';
 assert.equal(evaluateBuildLoadout(restored,catalog,{armorReference:armors}).exactTotal,99);
});
test('browser build exposes source opt-in button and guards manual versus sourced changes',()=>{
 const html=readFileSync(new URL('../public/build-planner/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../public/src/build-loadout-app.mjs',import.meta.url),'utf8');
 assert.match(html,/id="build-loadout-load-armor"/);
 assert.match(html,/568-entry armor reference/);
 assert.match(js,/loadPinnedArmorSource\(fetch\)/);
 assert.match(js,/weight\.dataset\.source='manual'/);
 assert.match(js,/findExactArmor\(armorReference\?\.armors/);
 assert.match(js,/armorReference:armorReference\?\.armors\?\?null/);
});
