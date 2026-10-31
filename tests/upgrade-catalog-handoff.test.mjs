import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeCatalogSmithingHandoff,parseCatalogSmithingHandoff}
 from '../public/src/upgrade-catalog-handoff.mjs';
import {planUpgradeMaterials} from '../public/src/upgrade-materials.mjs';

const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
const base='https://elden-ring-5i9.pages.dev/weapon-database/';
const item=name=>catalog.weapons.find(w=>w.name===name);

test('only six source-attributed Somber upgrade records carry optional track hints',()=>{
 let known=0,unknown=0;
 for(const weapon of catalog.weapons){
  const url=new URL(makeCatalogSmithingHandoff(weapon,base),'https://example.com');
  const parsed=parseCatalogSmithingHandoff(url.search);
  assert.equal(parsed.weaponId,weapon.id);
  assert.equal(parsed.weaponName,weapon.name);
  assert.equal(url.pathname,'/weapon-upgrade-calculator/');
  assert.equal(url.searchParams.has('from'),false);
  assert.equal(url.searchParams.has('to'),false);
  assert.equal(url.searchParams.has('upgrade'),false);
  if(weapon.upgradeReference?.path==='somber'){
   known++;
   assert.equal(parsed.suggestedTrack,'somber');
  }else{
   unknown++;
   assert.equal(parsed.suggestedTrack,null);
  }
 }
 assert.equal(known,6);
 assert.equal(unknown,catalog.weapons.length-known);
});
test('selected weapon name, not a supposed current weapon upgrade level, is handed off',()=>{
 const blade=item('Sword of Night');
 const uri=makeCatalogSmithingHandoff(blade,base);
 const parsed=parseCatalogSmithingHandoff(new URL(uri,'https://example.com').search);
 assert.equal(parsed.weaponName,'Sword of Night');
 assert.equal(parsed.suggestedTrack,'somber');
 assert.equal(planUpgradeMaterials('somber',0,10).totalStones,10);
 const normal=item('Uchigatana');
 const a=parseCatalogSmithingHandoff(new URL(
  makeCatalogSmithingHandoff(normal,base),'https://example.com').search);
 assert.equal(a.weaponName,'Uchigatana');
 assert.equal(a.suggestedTrack,null);
 assert.equal(planUpgradeMaterials('regular',0,25).totalStones,97);
});
test('untrusted or mismatched sources never unlock a sourced upgrade-track claim',()=>{
 const normal=item('Uchigatana');
 const falseSource={...normal,upgradeReference:{path:'somber',status:'community-published-base-attack',sourceUrl:'https://random.example/'}};
 assert.equal(parseCatalogSmithingHandoff(new URL(makeCatalogSmithingHandoff(falseSource,base),
  'https://example.com').search).suggestedTrack,null);
 for(const bad of [undefined,{},null,{id:'bad/id',name:'test'},{id:'okay',name:'<invalid>\n'}]){
  assert.throws(()=>makeCatalogSmithingHandoff(bad,base),/Invalid/);
 }
 for(const url of ['https://example.com/other/','javascript:alert(1)','file:///weapon-database/'])
  assert.throws(()=>makeCatalogSmithingHandoff(normal,url),RangeError);
 const long='?weapon=ok&name='+encodeURIComponent('x'.repeat(130));
 assert.equal(parseCatalogSmithingHandoff(long).weaponId,null);
 assert.equal(parseCatalogSmithingHandoff('?weapon=bad%2Fvalue&name=Weapon').weaponId,null);
 assert.equal(parseCatalogSmithingHandoff('?weapon=ok&name=Weapon&track=regular').suggestedTrack,null);
 assert.equal(parseCatalogSmithingHandoff('?weapon=ok&name=Weapon&track=somber').suggestedTrack,'somber');
});
test('weapon database and upgrade page connect the handoff without auto-selecting current +level',()=>{
 const catalogHtml=readFileSync(new URL('../public/weapon-database/index.html',import.meta.url),'utf8');
 const catalogJs=readFileSync(new URL('../public/src/weapon-catalog-app.mjs',import.meta.url),'utf8');
 const upgradeHtml=readFileSync(new URL('../public/weapon-upgrade-calculator/index.html',import.meta.url),'utf8');
 const upgradeJs=readFileSync(new URL('../public/src/upgrade-materials-app.mjs',import.meta.url),'utf8');
 for(const id of ['catalog-smithing-link','catalog-smithing-note']){
  assert.equal(catalogHtml.split('id="'+id+'"').length-1,1);
  assert.ok(catalogJs.includes("'"+id+"'"));
 }
 for(const id of ['upgrade-weapon-context','upgrade-weapon-name','upgrade-weapon-hint','upgrade-weapon-back']){
  assert.equal(upgradeHtml.split('id="'+id+'"').length-1,1);
  assert.ok(upgradeJs.includes("'"+id+"'"));
 }
 assert.ok(catalogJs.includes('makeCatalogSmithingHandoff(chosen,location.href)'));
 assert.ok(upgradeJs.includes('parseCatalogSmithingHandoff(location.search)'));
 assert.ok(!upgradeJs.includes("el('upgrade-from').value=handoff."));
 assert.ok(!upgradeJs.includes("el('upgrade-to').value=handoff."));
 assert.ok(upgradeHtml.includes('noindex,follow'));
});
