import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 validateCommunityCatalog,searchCatalog,catalogSourceQuality,catalogQualityCounts
} from '../public/src/community-weapons.mjs';

const source=validateCommunityCatalog(JSON.parse(
 await readFile(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8')
));
const items=source.weapons;
const get=name=>items.find(w=>w.name===name);

test('source quality counts are derived from real bundled records and are not accuracy certification',()=>{
 const counts=catalogQualityCounts(items);
 assert.equal(counts.total,items.length);
 assert.equal(counts.complete+counts.partial,counts.total);
 assert.equal(counts.sourceOnly,items.filter(w=>w.flags?.includes('source-v117-neutral-requirements-only')).length);
 for(const key of ['complete','partial','conflict','source-only']){
  const filtered=searchCatalog(items,{quality:key,limit:100,offset:0});
  const expected=key==='source-only'?counts.sourceOnly:counts[key];
  assert.equal(filtered.total,expected,'quality='+key);
 }
 assert.ok(counts.complete>0);
 assert.ok(counts.partial>0);
 assert.ok(counts.conflict>0);
 assert.ok(counts.sourceOnly>0);
 assert.throws(()=>searchCatalog(items,{quality:'verified-current-patch'}),/Invalid catalog search/);
 assert.throws(()=>catalogQualityCounts(null),RangeError);
});
test('source conflicts remain excluded from complete despite present +0/weight fields',()=>{
 const stone=catalogSourceQuality(get('Stone-Sheathed Sword'));
 assert.equal(stone.complete,false);assert.equal(stone.conflict,true);assert.equal(stone.partial,true);
 const madding=catalogSourceQuality(get('Madding Hand'));
 assert.equal(madding.complete,false);assert.equal(madding.conflict,true);
 const recovered=items.find(w=>w.flags?.includes('source-v117-neutral-requirements-only'));
 assert.ok(recovered);assert.equal(catalogSourceQuality(recovered).sourceOnly,true);
 assert.equal(catalogSourceQuality(recovered).complete,false);
 const uchigatana=catalogSourceQuality(get('Uchigatana'));
 assert.equal(uchigatana.complete,true);
 assert.equal(uchigatana.conflict,false);
 const conflict=searchCatalog(items,{quality:'conflict',term:'Stone-Sheathed'});
 assert.deepEqual(conflict.results.map(w=>w.name),['Stone-Sheathed Sword']);
 assert.equal(searchCatalog(items,{quality:'complete',term:'Stone-Sheathed'}).total,0);
});
test('quality filters compose with DLC filter, class and search and paginate consistently',()=>{
 const dlc=searchCatalog(items,{coverage:'dlc',quality:'complete',limit:100});
 assert.ok(dlc.total>0&&dlc.results.every(w=>w.expansion==='Shadow of the Erdtree'));
 const search=searchCatalog(items,{term:'Greatsword',quality:'complete',limit:5,offset:0});
 assert.ok(search.total>5);
 assert.ok(search.results.every(w=>w.name.toLowerCase().includes('greatsword')||
  w.category.toLowerCase().includes('greatsword')));
 const next=searchCatalog(items,{term:'Greatsword',quality:'complete',limit:5,offset:5});
 assert.ok(next.results.every(w=>!search.results.some(first=>first.id===w.id)));
});
test('weight/base sorting puts unknown and disputed sources last in stable name/id order',()=>{
 const a=get('Uchigatana');
 const unknown=[{...a,id:'test-z',name:'Zulu Unknown',weight:null,attack:null},
  {...a,id:'test-a',name:'Alpha Unknown',weight:null,attack:null}];
 for(const sort of ['weight','base']){
  const list=searchCatalog([unknown[0],a,unknown[1]],{sort});
  assert.deepEqual(list.results.slice(-2).map(w=>w.name),['Alpha Unknown','Zulu Unknown']);
 }
});
test('catalog UI exposes truthful quality selection and re-ranks on stat changes',async()=>{
 const html=await readFile(new URL('../public/weapon-database/index.html',import.meta.url),'utf8');
 const js=await readFile(new URL('../public/src/weapon-catalog-app.mjs',import.meta.url),'utf8');
 for(const id of ['catalog-quality','catalog-quality-summary'])
  assert.equal(html.split('id="'+id+'"').length-1,1);
 for(const value of ['complete','partial','conflict','source-only'])
  assert.match(html,new RegExp('value="'+value+'"'));
 assert.match(js,/catalogQualityCounts\(catalog\.weapons\)/);
 assert.match(js,/const quality=\$\('catalog-quality'\)\.value/);
 assert.match(js,/coverage,quality/);
 assert.match(js,/\$\('catalog-sort'\)\.value==='requirements'/);
 assert.match(js,/Disputed source fields/);
});
