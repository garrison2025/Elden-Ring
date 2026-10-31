import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compareWeaponReferences,parseReferenceCompareIds,referenceCompareQuery} from '../public/src/weapon-compare-reference.mjs';
const catalog=JSON.parse(await readFile('public/data/community-weapon-catalog.json','utf8'));
const find=name=>catalog.weapons.find(w=>w.name===name);
test('three distinct armaments compare factual base attack, weight and attributes only',()=>{
 const a=find('Spirit Sword'),b=find('Spread Crossbow'),c=find("Rellana's Twin Blades");
 const model=compareWeaponReferences(catalog.weapons,[a.id,b.id,c.id],[12,20,16,16,10]);
 assert.equal(model.columns.length,3);
 const row=label=>model.rows.find(x=>x.label===label).values;
 assert.deepEqual(row('Physical +0 base'),['92','68','103']);
 assert.deepEqual(row('Magic +0 base'),['59','0','66']);
 assert.deepEqual(row('Weight'),['2.5','5','8']);
 assert.deepEqual(row('STR requirement'),['8','11','13']);
 assert.ok(row('One-hand requirements').includes('Met'));
 assert.ok(model.warning.includes('No total AR'));
 assert.equal(model.rows.some(x=>x.label==='Total AR'),false);
});
test('Stone-Sheathed +0 and weight conflicts are displayed as DISPUTED source figures',()=>{
 const partial=find('Stone-Sheathed Sword'),requirements=find('Anvil Hammer');
 const model=compareWeaponReferences(catalog.weapons,[partial.id,requirements.id]);
 const get=name=>model.rows.find(x=>x.label===name).values;
 assert.deepEqual(get('Physical +0 base'),['DISPUTED (community 89)','131']);
 assert.deepEqual(get('Weight'),['DISPUTED (community 3.5)','22']);
 assert.deepEqual(get('STR requirement'),['16','39']);
 assert.deepEqual(get('DEX requirement'),['8','10']);
 assert.equal(model.rows.some(x=>x.label==='One-hand requirements'),false);
});
test('untrusted share ids are bounded, unique, whitelisted and URL-encoded',()=>{
 const a=find('Milady').id,b=find('Tooth Whip').id;
 const known=new Set(catalog.weapons.map(x=>x.id));
 assert.deepEqual(parseReferenceCompareIds(null,known),[]);
 assert.deepEqual(parseReferenceCompareIds(a+','+b,known),[a,b]);
 const query=referenceCompareQuery([a,b],[12,17,10,10,10]);
 assert.deepEqual(parseReferenceCompareIds(new URLSearchParams(query).get('compare'),known),[a,b]);
 assert.match(query,/player=12%2C17%2C10%2C10%2C10/);
 for(const ids of [[a,a],[a,b,'other',a],['not-a-weapon']]){
  assert.throws(()=>compareWeaponReferences(catalog.weapons,ids),/Select 1 to 3|Unknown weapon/);
 }
 assert.throws(()=>parseReferenceCompareIds(a+',not-a-weapon',known),/Unknown weapon/);
 assert.throws(()=>parseReferenceCompareIds('x'.repeat(306),known),/too long/);
 assert.throws(()=>referenceCompareQuery([a],[12,17,0,10,10]),/valid attributes/);
});
test('research comparison remains noindex and mobile-friendly; no standalone thin compare page',async()=>{
 const html=await readFile('public/weapon-database/index.html','utf8');
 const css=await readFile('public/assets/style.css','utf8');
 const app=await readFile('public/src/weapon-catalog-app.mjs','utf8');
 assert.match(html,/robots" content="noindex,follow"/);
 assert.match(html,/id="catalog-compare-table"/);
 assert.match(html,/id="catalog-compare-add"/);
 assert.match(html,/id="catalog-compare-link"/);
 assert.match(css,/reference-compare-table/);
 assert.match(css,/overflow-x:auto/);
 assert.match(app,/parseReferenceCompareIds/);
 assert.match(app,/aria-pressed/);
});