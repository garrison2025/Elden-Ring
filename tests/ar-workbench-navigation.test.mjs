import test from 'node:test';
import assert from 'node:assert/strict';
import {makeArWorkbenchUrl,parseArWorkbenchHandoff} from '../public/src/ar-workbench-navigation.mjs';

test('catalog handoff transfers exact weapon, five combat attributes and selected reinforcement safely',()=>{
 const url=makeArWorkbenchUrl("Fire Knight's Shortsword",[40,25,10,14,10],7);
 assert.equal(url,"../weapon-data-workbench/?weapon=Fire+Knight%27s+Shortsword&player=40%2C25%2C10%2C14%2C10&upgrade=7");
 assert.deepEqual(parseArWorkbenchHandoff(url.split('?')[1]),{
  weapon:"Fire Knight's Shortsword",stats:[40,25,10,14,10],upgrade:7});
 assert.deepEqual(parseArWorkbenchHandoff('?weapon=Greatsword'),{
  weapon:'Greatsword',stats:null,upgrade:null});
});
test('invalid characters, URL lengths, upgrade values and stats fail closed',()=>{
 for(const stats of [[0,10,10,10,10],[20,20,20,20],[100,10,10,10,10],
  ['80',10,10,10,10]])
  assert.throws(()=>makeArWorkbenchUrl('Test',stats),/Character stats/);
 assert.throws(()=>makeArWorkbenchUrl(' ',[40,20,10,10,10]),/weapon/);
 assert.throws(()=>makeArWorkbenchUrl('A'.repeat(101)),/weapon/);
 assert.throws(()=>makeArWorkbenchUrl('Test',null,26),/upgrade/);
 assert.deepEqual(parseArWorkbenchHandoff('?weapon=Greatsword&player=100,10,10,10,10&upgrade=25'),
  {weapon:'Greatsword',stats:null,upgrade:25});
 assert.deepEqual(parseArWorkbenchHandoff('?weapon=Greatsword&player=1,2,3,4,5&upgrade=99'),
  {weapon:'Greatsword',stats:[1,2,3,4,5],upgrade:null});
 assert.deepEqual(parseArWorkbenchHandoff('?weapon='+('x'.repeat(110))),
  {weapon:'',stats:null,upgrade:null});
});
test('URL parameters cannot initiate remote downloads; parser accepts only supported query fields',()=>{
 const result=parseArWorkbenchHandoff('?weapon=Longsword&player=20,10,10,10,10&source=https%3A%2F%2Fevil.com&autorun=true&upgrade=-5');
 assert.deepEqual(result,{weapon:'Longsword',stats:[20,10,10,10,10],upgrade:null});
});
