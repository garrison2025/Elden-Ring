import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditDirectRequirements} from '../scripts/audit-tarnished-v117-requirements-archive.mjs';
const c=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-direct-requirements-actual10.json',import.meta.url),'utf8'));
test('only exactly twice-read public Req vectors count as observations, at effective Wretch10',()=>{
 assert.equal(c.rows.length,487);
 assert.equal(c.rows.filter(x=>x.observedRequirements!==null).length,357);
 assert.equal(new Set(c.rows.map(x=>x.id)).size,487);
 assert.equal(new Set(c.rows.map(x=>x.name)).size,487);
 assert.ok(c.rows.every(x=>x.sourceRun===41263897966));
 assert.ok(c.rows.filter(x=>x.observedRequirements!==null).every(x=>
  x.independentlyObservedTwice===true&&x.status==='DIRECT_SITE_REQ_VERIFIED'&&
  x.observedRequirements.length===5));
 assert.deepEqual(c.effectiveStats,[10,10,10,10,10]);
});
test('cannot promote a malformed browser requirement even with local source values',()=>{
 const catalog={weapons:c.rows.map((x,i)=>({name:x.name,id:String(i),requirements:[10,10,10,10,10]}))};
 const input={...c,rows:c.rows.map(x=>({...x}))};
 const row=input.rows.find(x=>x.observedRequirements!==null);
 row.independentlyObservedTwice=false;
 assert.throws(()=>auditDirectRequirements(input,catalog,{weapons:[],reinforceTypes:{}}),/require/i);
});
