import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {emptyBuildLoadout} from '../public/src/build-loadout.mjs';
import {DIRECT_V117_CIRCLET_OF_LIGHT as c} from '../public/src/tarnished-v117-dlc-circlet.mjs';
import {previewDirectV117ArmorAttributeEffect as fx} from '../public/src/build-verified-armor-attribute-effect.mjs';
const base=Array(8).fill(10);
const armed=()=>{const s=emptyBuildLoadout();s.armorSlots[0]={name:c.name,weight:'1',weightSource:'community'};return s};
test('the exact Wretch 10 naked Circlet reads change only INT FAI ARC +1',()=>{
 const x=fx(base,armed(),[c]);
 assert.equal(x.status,'direct-site-observed-baseline');
 assert.deepEqual(x.preview,[10,10,10,10,10,11,11,11]);
 assert.deepEqual(x.observed.bonuses,{int:1,fai:1,arc:1});
 assert.equal(x.observed.weight,1);
 assert.equal(x.observed.poise,5);
});
test('all other armor names, manual weight, missing source and unproved identity cannot unlock effects',()=>{
 const none=emptyBuildLoadout();
 assert.equal(fx(base,none,[c]).status,'no-proven-effect');
 const s=armed();
 assert.equal(fx(base,s,null).status,'source-not-loaded');
 assert.equal(fx(base,s,[{...c,poise:999}]).status,'unverified-item-identity');
 assert.equal(fx(base,{...s,armorSlots:[{...s.armorSlots[0],weightSource:'manual'},...s.armorSlots.slice(1)]},[c]).status,'unverified-item-identity');
 assert.equal(fx(base,{...s,armorSlots:[{...s.armorSlots[0],name:'Not Circlet of Light'},...s.armorSlots.slice(1)]},[c]).status,'no-proven-effect');
});
test('unverified stat cap and other equipment prevent full Build equivalence certification',()=>{
 const x=[...base];x[5]=99;
 assert.equal(fx(x,armed(),[c]).status,'unverified-stat-cap');
 assert.equal(fx(x,armed(),[c]).preview,null);
 const s=armed();s.talismans[0]='UNVERIFIED BONUS';
 const y=fx(base,s,[c]);
 assert.equal(y.status,'isolated-verified-bonus-not-full-build');
 assert.deepEqual(y.preview,[10,10,10,10,10,11,11,11]);
});
test('Build user interface shows only the source-gated bonus view without mutating original AR links',()=>{
 const app=readFileSync(new URL('../public/src/build-loadout-app.mjs',import.meta.url),'utf8');
 assert.match(app,/previewDirectV117ArmorAttributeEffect\(topStats\(\),evaluated.state,armorReference\?\.armors\?\?null\)/);
 assert.match(app,/build-direct-effect-result/);
 assert.match(app,/NEVER feed these isolated preview stats into level, AR, spell or defense/);
});
