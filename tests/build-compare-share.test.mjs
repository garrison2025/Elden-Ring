import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLASSES} from '../public/src/core.mjs';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
import {makeBuildAbShareUrl,parseSharedBuildAb,validateSharedBuildAb}
 from '../public/src/build-compare-share.mjs';

const read=path=>readFileSync(new URL('../public/'+path,import.meta.url),'utf8');
const catalog=validateCommunityCatalog(JSON.parse(read('data/community-weapon-catalog.json')));
const sword=catalog.weapons.find(w=>w.name==='Sword of Night');
const katana=catalog.weapons.find(w=>w.name==='Uchigatana');
const hero=CLASSES.find(x=>x.name==='Samurai');
const snapshot=(x={})=>({
 origin:hero.name,stats:[...hero.stats],weaponId:null,
 ownsTarnishedPack:false,ownsSote:false,...x
});
const site='https://elden-ring-5i9.pages.dev/build-planner/';
test('two-Build URLs round-trip differing source weapons, attributes and origin gates',()=>{
 const baseline=snapshot({origin:'Idus Knight',
  stats:[...CLASSES.find(x=>x.name==='Idus Knight').stats],
  weaponId:sword.id,ownsTarnishedPack:true,ownsSote:true});
 const B=snapshot({stats:hero.stats.map((n,i)=>i===0?n+5:n),weaponId:katana.id});
 const link=makeBuildAbShareUrl(baseline,B,site+'?bad=stale#bad');
 const result=validateSharedBuildAb(new URL(link).search,catalog.weapons);
 assert.deepEqual(result,{baseline,current:B});
 assert.equal(new URL(link).pathname,'/build-planner/');
 assert.equal(new URL(link).searchParams.has('bad'),false);
 assert.equal(new URL(link).hash,'');
 assert.equal(new URL(link).searchParams.get('weapon'),katana.id);
 assert.equal(new URL(link).searchParams.get('sote'),null);
 assert.ok(link.length<750);
 assert.equal(link.includes(sword.name),false,'Weapon name must not be serialized');
 assert.equal(link.includes('AR='),false);
});
test('legacy existing one-Build URL stays unchanged and returns no pinned comparison',()=>{
 assert.equal(parseSharedBuildAb('?origin=Samurai&stats=12%2C11%2C13%2C12%2C15%2C9%2C8%2C8'),null);
 assert.equal(parseSharedBuildAb(''),null);
 const link=makeBuildAbShareUrl(snapshot(),snapshot(),'https://example.org/build-planner/index.html');
 assert.ok(link.startsWith('https://example.org/build-planner/?'));
 assert.deepEqual(parseSharedBuildAb(new URL(link).search).baseline,snapshot());
});
test('strict rejected duplicate, malformed and versioned comparison URLs',()=>{
 const valid=new URL(makeBuildAbShareUrl(snapshot(),snapshot(),site));
 const list=[
  '?compare=v2.invalid',
  '?compare=v1.99.12.11.13.12.15.9.8.8.-.00',
  '?compare=v1.8.12.11.13.12.15.9.8.8.-.22',
  valid.search+'&compare=extra',
  valid.search+'&stats=10,10,10,10,10,10,10,10',
  valid.search.replace('compare=', 'compare=wrong.'),
  valid.search.replace('origin=Samurai','origin=not-a-class'),
  valid.search.replace('stats=', 'stats=not-values'),
  '?compare='+encodeURIComponent('x'.repeat(1500))
 ];
 for(const bad of list)
  assert.throws(()=>parseSharedBuildAb(bad),RangeError,bad.slice(0,100));
});
test('reject forged DLC access, malformed values, stale ID, invalid starting classes',()=>{
 const valid=new URL(makeBuildAbShareUrl(snapshot({weaponId:katana.id}),
  snapshot({weaponId:katana.id}),site));
 const malicious=new URL(valid);
 malicious.searchParams.set('weapon','missing-id');
 assert.throws(()=>validateSharedBuildAb(malicious.search,catalog.weapons),/no longer exists/);
 const dlc=new URL(makeBuildAbShareUrl(snapshot({weaponId:sword.id,ownsSote:true}),
  snapshot(),site));
 const token=dlc.searchParams.get('compare');
 dlc.searchParams.set('compare',token.slice(0,-2)+'00');
 assert.throws(()=>validateSharedBuildAb(dlc.search,catalog.weapons),/Enable Shadow of the Erdtree/);
 const tpack=CLASSES.find(x=>x.name==='Idus Knight');
 assert.throws(()=>makeBuildAbShareUrl(snapshot({origin:tpack.name,stats:[...tpack.stats]}),
  snapshot(),site),/requires Tarnished Pack/);
 for(const wrong of ['javascript:alert(1)','file:///build-planner/',
  'https://example.com/other/'])
  assert.throws(()=>makeBuildAbShareUrl(snapshot(),snapshot(),wrong),RangeError);
});
test('Build Planner provides visible share and manually selectable fallback with revalidation',()=>{
 const page=read('build-planner/index.html'),app=read('src/app.mjs');
 for(const id of ['build-ab-share','build-ab-share-field','build-ab-share-url']){
  assert.equal(page.split('id="'+id+'"').length-1,1,id);
  assert.ok(app.includes("'#"+id+"'"),id);
 }
 assert.ok(page.includes('Copy link to both Builds'));
 assert.ok(page.includes('Links are validated against'));
 assert.ok(app.includes('makeBuildAbShareUrl(pinnedBuild,currentB,location.href)'));
 assert.ok(app.includes('validateSharedBuildAb(location.search,catalog.weapons)'));
 assert.ok(app.includes("if(query.has('compare'))"));
 assert.ok(app.includes('pinnedBuild=sharedAb.baseline'));
 assert.ok(app.includes('pinnedBuild=null;'));
 assert.ok(!page.includes('form method="post"'));
});
