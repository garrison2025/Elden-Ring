import test from 'node:test';
import assert from 'node:assert/strict';
import {comparePublicItemWeights} from '../scripts/compare-tarnished-item-weights.mjs';
const ids=['baseline-no-items','known-longsword-rh1','known-longsword-lh1',
 'missing-albinauric-shield','missing-brass-shield',
 'missing-fingerprint-stone-shield','missing-golden-greatshield',
 'missing-great-turtle-shell','conflict-stone-sheathed',
 'conflict-fire-knights-shortsword','conflict-radahn-light',
 'conflict-ritual-thrusting-shield'];
const weights=[0,3.5,3.5,4.5,7,29,17,5.5,0,2,0,10];
const names=['','Longsword','Longsword','Albinauric Shield','Brass Shield',
 'Fingerprint Stone Shield','Golden Greatshield','Great Turtle Shell',
 'Stone-Sheathed Sword',"Fire Knight's Shortsword",
 'Greatsword of Radahn (Light)','Ritual Thrusting Shield'];
const snap=()=>({cases:ids.map((id,i)=>({id,requested:names[i],
 status:weights[i]>0||i===0?'INPUT_AND_ITEM_VERIFIED':'NOT_OBSERVED',
 version:'Elden Ring Version: v1.17',equipCap:48.2,equipLoad:weights[i],
 hand:i===2||i>=3&&i<=7||i===11?'lh1':'rh1',
 affinity:i===0?null:'Standard'}))});
const catalog={weapons:names.slice(1).filter(Boolean).map(name=>({name,weight:
 name==='Longsword'?3.5:name==="Fire Knight's Shortsword"?2:null}))};
test('only read actual weight when baseline and two independent known hand controls work',()=>{
 const one=snap(),two=snap();
 const r=comparePublicItemWeights(one,two,catalog);
 assert.equal(r.verifiedBaseline,true);
 assert.equal(r.knownLongswordBothHands,true);
 assert.equal(r.counts.sourceMissingObserved,5);
 assert.equal(r.counts.weightObserved,7);
 assert.equal(r.rows.find(x=>x.id==='missing-brass-shield').observedWeight,7);
 assert.equal(r.rows.find(x=>x.id==='conflict-stone-sheathed').status,'NOT_OBSERVED');
 assert.equal(r.rows.find(x=>x.id==='conflict-fire-knights-shortsword').status,'WEIGHT_MATCH');
 assert.equal(r.rows.find(x=>x.id==='missing-brass-shield').requirementsVerified,false);
});
test('never trust a fabricated nonzero weight when item activation fails',()=>{
 const a=snap(),b=snap();b.cases.find(x=>x.id==='missing-brass-shield').status='NOT_OBSERVED';
 assert.equal(comparePublicItemWeights(a,b,catalog).rows.find(x=>x.id==='missing-brass-shield').status,'NOT_OBSERVED');
});
test('refuse source weight when known Longsword control differs or case list altered',()=>{
 const a=snap(),b=snap();
 b.cases[1].equipLoad=3.6;
 const r=comparePublicItemWeights(a,b,catalog);
 assert.equal(r.knownLongswordBothHands,false);
 assert.equal(r.counts.weightObserved,0);
 assert.throws(()=>comparePublicItemWeights(a,{cases:b.cases.slice(1)},catalog),RangeError);
});
