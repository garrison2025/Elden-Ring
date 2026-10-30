import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCommunityCatalog,searchCatalog,weaponWieldShortfall}
 from '../public/src/community-weapons.mjs';
import {makeWeaponCatalogShareUrl}
 from '../public/src/weapon-catalog-navigation.mjs';
const file=new URL('../public/data/community-weapon-catalog.json',import.meta.url);
const catalog=validateCommunityCatalog(JSON.parse(readFileSync(file,'utf8')));
const get=name=>catalog.weapons.find(w=>w.name===name);
const stats=[16,14,10,10,10];

test('real community catalog requirement shortfall identifies exact stat deficits',()=>{
 const great=get('Greatsword'),sword=get('Uchigatana');
 assert.deepEqual(great.requirements,[31,12,0,0,0]);
 assert.deepEqual(weaponWieldShortfall(great,stats).oneHandMissing,[{stat:'STR',points:15}]);
 assert.equal(weaponWieldShortfall(great,stats).oneHandPoints,15);
 assert.equal(weaponWieldShortfall(great,stats).twoHandPoints,7);
 assert.deepEqual(weaponWieldShortfall(sword,stats).oneHandMissing,[{stat:'DEX',points:1}]);
 assert.equal(weaponWieldShortfall(sword,stats).oneHandPoints,1);
 const other=get('Stone-Sheathed Sword');
 assert.equal(weaponWieldShortfall(other,stats).oneHandPoints,0);
 assert.throws(()=>weaponWieldShortfall(great,[16,14,100,10,10]),/Five integer/);
});
test('fewest missing one-handed points sort is deterministic, supports filters and unknowns last',()=>{
 const pool=[get('Greatsword'),get('Uchigatana'),get('Stone-Sheathed Sword'),
  {...get('Sword of Night'),id:'synthetic-unknown-requirements',category:'unknown',requirements:null,name:'Unknown Sample'}];
 const sorted=searchCatalog(pool,{sort:'requirements',stats,limit:10});
 assert.deepEqual(sorted.results.map(x=>x.name),[
  'Stone-Sheathed Sword','Uchigatana','Greatsword','Unknown Sample']);
 assert.equal(sorted.total,4);
 const only=searchCatalog(pool,{sort:'requirements',stats,category:'Katana',limit:10});
 assert.deepEqual(only.results.map(x=>x.name),['Uchigatana']);
 const page=searchCatalog(pool,{sort:'requirements',stats,limit:2,offset:2});
 assert.deepEqual(page.results.map(x=>x.name),['Greatsword','Unknown Sample']);
 assert.throws(()=>searchCatalog(pool,{sort:'requirements'}),/Character/);
 assert.throws(()=>searchCatalog(pool,{sort:'requirements',stats:[1,2,3]}),RangeError);
});
test('source unknown requirements stay unknown and cannot be ranked as free to equip',()=>{
 const unknown={...get('Uchigatana'),requirements:null};
 const v=weaponWieldShortfall(unknown,stats);
 assert.equal(v.known,false);
 assert.equal(v.oneHandPoints,null);
 assert.deepEqual(v.oneHandMissing,[]);
 const results=searchCatalog([unknown,get('Uchigatana')],{sort:'requirements',stats,limit:5});
 assert.equal(results.results.at(-1).requirements,null);
});
test('weapon share link uses only selected ID and five integer attributes',()=>{
 const id=get('Uchigatana').id;
 const base='https://elden-ring-5i9.pages.dev/weapon-database/?compare=evil&stats=malformed#fragment';
 const result=makeWeaponCatalogShareUrl(id,stats,base);
 const url=new URL(result);
 assert.equal(url.pathname,'/weapon-database/');
 assert.equal(url.searchParams.get('weapon'),id);
 assert.equal(url.searchParams.get('player'),'16,14,10,10,10');
 assert.equal(url.searchParams.get('compare'),null);
 assert.equal(url.searchParams.get('stats'),null);
 assert.equal(url.hash,'');
 assert.equal(makeWeaponCatalogShareUrl(id,null,base).includes('player='),false);
 assert.equal(new URL(makeWeaponCatalogShareUrl(id,stats,
  'https://elden-ring-5i9.pages.dev/weapon-database/index.html')).pathname,'/weapon-database/');
});
test('weapon direct-link input validation blocks arbitrary pages or untrusted IDs',()=>{
 for(const id of ['', 'bad&compare=other','../bad','invalid!', 'x'.repeat(81)])
  assert.throws(()=>makeWeaponCatalogShareUrl(id,stats,
   'https://example.com/weapon-database/'),/Invalid weapon/);
 for(const path of ['/other/','/weapon-database/fake','/weapon-database/weapon/'])
  assert.throws(()=>makeWeaponCatalogShareUrl(get('Uchigatana').id,stats,
   'https://example.com'+path),/Not a weapon catalog/);
 assert.throws(()=>makeWeaponCatalogShareUrl(get('Uchigatana').id,
  [1,2,3,4,100],'https://example.com/weapon-database/'),/Shareable/);
});
test('weapon database UI connects new controls, source-reported sorting and share safely',()=>{
 const html=readFileSync(new URL('../public/weapon-database/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../public/src/weapon-catalog-app.mjs',import.meta.url),'utf8');
 for(const id of ['catalog-shortfall','catalog-weapon-link','catalog-weapon-copy',
  'catalog-weapon-share-feedback','catalog-clear-filters']){
  assert.equal(html.split('id="'+id+'"').length-1,1);
  assert.ok(js.includes("$('"+id+"')"),id+' missing in browser handler');
 }
 assert.ok(html.includes('value="requirements"'));
 assert.ok(js.includes("sort!=='requirements'?null:readStats()"));
 assert.ok(js.includes('makeWeaponCatalogShareUrl(chosen.id,shareStats,location.href)'));
 assert.ok(js.includes("if(chosen)$('catalog-search').value=chosen.name"));
});
