import test from 'node:test';
import assert from 'node:assert/strict';
import {createDamageHandoffUrl,AR_DAMAGE_CHANNELS} from '../public/src/damage-ar-handoff.mjs';
const base='https://elden-ring-5i9.pages.dev/weapon-ar-calculator/?weapon=Moonveil';
test('magic-only weapon AR hands off physical=0, not damage page fictional 500 default',()=>{
 const u=new URL(createDamageHandoffUrl(base,[{element:'magic',displayed:250}]));
 assert.equal(u.pathname,'/damage-calculator/');
 assert.deepEqual(AR_DAMAGE_CHANNELS.map(k=>u.searchParams.get(k)),['0','250','0','0','0']);
 assert.equal(u.searchParams.has('weapon'),false);
});
test('split elemental AR values are complete and retain all five channels',()=>{
 const u=new URL(createDamageHandoffUrl(base,[
  {element:'physical',displayed:320},{element:'fire',displayed:98},
  {element:'magic',displayed:0}
 ]));
 assert.deepEqual(AR_DAMAGE_CHANNELS.map(k=>u.searchParams.get(k)),['320','0','98','0','0']);
});
test('invalid, ambiguous, duplicate, negative and empty component sets are rejected',()=>{
 for(const entries of [
  [],[{element:'physical',displayed:0}],
  [{element:'other',displayed:200}],
  [{element:'magic',displayed:200},{element:'magic',displayed:30}],
  [{element:'fire',displayed:-1}],
  [{element:'fire',displayed:2.5}],
  [{element:'fire',displayed:10001}],
  null
 ])assert.throws(()=>createDamageHandoffUrl(base,entries),RangeError);
});
