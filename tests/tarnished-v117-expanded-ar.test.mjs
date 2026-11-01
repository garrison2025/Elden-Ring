import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compareObservedAr} from '../scripts/audit-tarnished-v117-expanded-ar.mjs';
const observations=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-weight-probe-ar-observations.json',import.meta.url),'utf8'));
test('348 exact-input public v1.17 Total AR samples have two full browser reads and unique IDs',()=>{
 assert.equal(observations.records.length,348);
 assert.equal(new Set(observations.records.map(x=>x.id)).size,348);
 assert.ok(observations.records.every(x=>x.verifiedInputsTwice===true&&
 x.upgrade===0&&x.somber===0&&x.twoHanded===false&&
 Number.isInteger(x.observedTotalAr)&&
 ['Standard','None'].includes(x.affinity)));
});
test('comparator blocks synthetic unconfirmed samples and never treats missing source variant as match',()=>{
 const mock={weapons:[]};
 const small={records:[observations.records[0]]};
 const result=compareObservedAr(small,mock);
 assert.equal(result.counts.sourceUnavailable,1);
 assert.equal(result.counts.matched,0);
 assert.throws(()=>compareObservedAr({records:[{...observations.records[0],verifiedInputsTwice:false}]},mock));
});
