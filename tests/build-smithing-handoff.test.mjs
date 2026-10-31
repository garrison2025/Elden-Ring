import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
import {makeBuildSmithingUrl,parseBuildSmithingIds,resolveBuildSmithingWeapons,
 validateBuildSmithingIds} from '../public/src/build-smithing-handoff.mjs';
import {planWeaponUpgradeBasket} from '../public/src/upgrade-multi-weapon.mjs';
const catalog=validateCommunityCatalog(JSON.parse(readFileSync(
 new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8')));
const find=name=>catalog.weapons.find(w=>w.name===name);
const build='https://elden-ring-5i9.pages.dev/build-planner/?stats=99,99,99,99,99,99,99,99';
const names=['Uchigatana','Greatsword','Sword of Night'];
const ids=names.map(name=>find(name).id);

test('Build -> smithing URL carries only source weapon IDs, never player stats or fabricated tracks',()=>{
 const url=makeBuildSmithingUrl(ids,build);
 const parsed=new URL(url,'https://elden-ring-5i9.pages.dev');
 assert.equal(parsed.pathname,'/weapon-upgrade-calculator/');
 assert.deepEqual(parseBuildSmithingIds(parsed.search),ids);
 assert.equal(parsed.searchParams.get('stats'),null);
 assert.equal(parsed.searchParams.get('name'),null);
 assert.equal(parsed.searchParams.get('track'),null);
 assert.equal(parsed.searchParams.get('from'),null);
 assert.equal(parsed.searchParams.get('to'),null);
 const html=makeBuildSmithingUrl(ids,'https://example.com/build-planner/index.html');
 assert.ok(html.startsWith('/weapon-upgrade-calculator/?weapons='));
});
test('all 408 catalog entries can be linked by identifier and resolved by source data',()=>{
 for(const w of catalog.weapons){
  const url=makeBuildSmithingUrl([w.id],build);
  const resolved=resolveBuildSmithingWeapons(parseBuildSmithingIds(url.split('?')[1]),catalog.weapons);
  assert.equal(resolved[0].id,w.id);
  assert.equal(resolved[0].name,w.name);
  assert.equal(resolved[0].from,'');
  assert.equal(resolved[0].to,'');
  assert.equal(resolved[0].track,'');
 }
});
test('eight distinct weapons accepted and nine, duplicates, malformed IDs rejected',()=>{
 const eight=catalog.weapons.slice(0,8).map(w=>w.id);
 assert.deepEqual(validateBuildSmithingIds(eight),eight);
 assert.deepEqual(parseBuildSmithingIds('?weapons='+eight.join(',')),eight);
 for(const bad of [[],[ids[0],ids[0]],catalog.weapons.slice(0,9).map(w=>w.id),
  ['bad/id'],['x'.repeat(81)],['<script>'],['']])
  assert.throws(()=>validateBuildSmithingIds(bad),RangeError);
 for(const query of ['?weapons=','?weapons='+ids[0]+'&weapons='+ids[1],
  '?weapons='+ids[0]+','+ids[0], '?weapons='+ids[0]+',../admin',
  '?weapons='+Array.from({length:9},()=>ids[0]).join(',')])
  assert.throws(()=>parseBuildSmithingIds(query),RangeError);
 assert.deepEqual(parseBuildSmithingIds(''),[]);
 assert.deepEqual(parseBuildSmithingIds('?unrelated=x'),[]);
 for(const wrong of ['javascript:alert(1)','https://example.com/other/','file:///build-planner/'])
  assert.throws(()=>makeBuildSmithingUrl(ids,wrong),RangeError);
});
test('catalog resolution is source-scope limited; unknown IDs fail closed',()=>{
 assert.throws(()=>resolveBuildSmithingWeapons(['unknown-id'],catalog.weapons),/not found/);
 const somber=resolveBuildSmithingWeapons([find('Sword of Night').id],catalog.weapons)[0];
 assert.equal(somber.suggestedTrack,'somber');
 assert.equal(somber.track,'');
 assert.match(somber.trackHint,/confirm in game/);
 const noTrack=resolveBuildSmithingWeapons([find('Uchigatana').id],catalog.weapons)[0];
 assert.equal(noTrack.suggestedTrack,null);
 assert.match(noTrack.trackHint,/Unknown track/);
 assert.throws(()=>planWeaponUpgradeBasket([noTrack]),/confirm regular or somber track/);
 const confirmed={...noTrack,track:'regular',from:0,to:25};
 assert.equal(planWeaponUpgradeBasket([confirmed]).totalStones,97);
 const spoofed={...find('Uchigatana'),name:'Forged Item',
  upgradeReference:{path:'somber',status:'community-published-base-attack',sourceUrl:'https://fake.example'}};
 assert.equal(resolveBuildSmithingWeapons([spoofed.id],[spoofed])[0].suggestedTrack,null);
});
test('source-backed page controls, DLC gating and import re-validation are wired',()=>{
 const buildHtml=readFileSync(new URL('../public/build-planner/index.html',import.meta.url),'utf8');
 const buildJs=readFileSync(new URL('../public/src/app.mjs',import.meta.url),'utf8');
 const upgradeJs=readFileSync(new URL('../public/src/upgrade-materials-app.mjs',import.meta.url),'utf8');
 for(const id of ['build-smithing-shortlist-panel','build-smithing-add','build-smithing-clear',
  'build-smithing-list','build-smithing-feedback','build-smithing-open']){
  assert.equal(buildHtml.split('id="'+id+'"').length-1,1,id);
  assert.ok(buildJs.includes("'#"+id+"'"),id+' not in Build Planner JS');
 }
 assert.ok(buildJs.includes('smithingIds=smithingIds.filter(id=>weaponCatalog.weapons.find'));
 assert.ok(buildJs.includes('makeBuildSmithingUrl(smithingIds,location.href)'));
 assert.ok(buildHtml.includes('NOT included in saved Build stats'));
 assert.ok(upgradeJs.includes('validateCommunityCatalog(await response.json())'));
 assert.ok(upgradeJs.includes('resolveBuildSmithingWeapons(linkedIds,local.weapons)'));
 assert.ok(upgradeJs.includes('parseBuildSmithingIds(location.search)'));
 assert.ok(upgradeJs.includes('multiRows.append(row)'));
 assert.ok(upgradeJs.includes('manually'));
});
