import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeCatalogSmithingHandoff,parseCatalogSmithingHandoff}
 from '../public/src/upgrade-catalog-handoff.mjs';
const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const catalog=JSON.parse(read('data/community-weapon-catalog.json'));
const get=name=>catalog.weapons.find(w=>w.name===name);
test('Build Planner has the selected-weapon smithing control and clear conditional visibility',()=>{
 const html=read('build-planner/index.html'),js=read('src/app.mjs');
 for(const id of ['build-weapon-smithing-link','build-weapon-smithing-note']){
  assert.equal(html.split('id="'+id+'"').length-1,1);
  assert.ok(js.includes("'#"+id+"'"));
 }
 assert.ok(js.includes('makeCatalogSmithingHandoff(weapon,'));
 assert.ok(js.includes("smithingLink.hidden=true;smithingNote.hidden=true"));
 assert.ok(js.includes("smithingLink.hidden=false;smithingNote.hidden=false"));
 assert.ok(js.includes("weaponCatalog.weapons.find(w=>w.id===selectedWeaponId)"));
 assert.ok(js.includes("new URL('../weapon-database/',location.href).toString()"));
});
test('Build Planner handoff uses same exact catalog item and preserves unknown track',()=>{
 for(const name of ['Greatsword','Uchigatana','Stone-Sheathed Sword']){
  const w=get(name);
  const url=makeCatalogSmithingHandoff(w,'https://example.com/weapon-database/');
  const out=parseCatalogSmithingHandoff(new URL(url,'https://example.com').search);
  assert.equal(out.weaponId,w.id);
  assert.equal(out.weaponName,w.name);
  assert.equal(out.suggestedTrack,null);
  assert.equal(url.includes('from='),false);
  assert.equal(url.includes('to='),false);
 }
});
test('Only explicitly supported Somber entries inherit optional recommendation, no build level or current upgrade assumed',()=>{
 const w=get('Sword of Night');
 const url=makeCatalogSmithingHandoff(w,'https://example.com/weapon-database/');
 const result=parseCatalogSmithingHandoff(new URL(url,'https://example.com').search);
 assert.equal(result.suggestedTrack,'somber');
 assert.equal(result.weaponName,w.name);
 assert.ok(!url.includes('level='));
 assert.ok(!url.includes('from='));
});
