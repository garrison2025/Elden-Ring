import test from 'node:test';
import assert from 'node:assert/strict';
import {
 V117_UPSTREAM_COMMIT,V117_UPSTREAM_URL,V117_EXPECTED_VARIANTS,
 V117_SOURCE_PAGE,V117_COPYING_URL,V117_MAX_BYTES,
 inspectV117Json,downloadV117Source
} from '../public/src/upstream-regulation-v117.mjs';

const fixture=()=>{
 const weapon=(name,dlc=false)=>({
  name,weaponName:name,weaponType:13,
  attack:[[0,100]],attributeScaling:[['str',0.8]],
  requirements:{str:10},attackElementCorrectId:1,reinforceTypeId:1,dlc
 });
 return {
  calcCorrectGraphs:{1:[{maxVal:0,maxGrowVal:0,adjPt:1},{maxVal:148,maxGrowVal:1,adjPt:1}]},
  attackElementCorrects:{1:{0:{str:true}}},
  reinforceTypes:{1:[{attack:{0:1},attributeScaling:{str:1,dex:1,int:1,fai:1,arc:1}}]},
  statusSpEffectParams:{},
  scalingTiers:[[0,'-']],
  weapons:[weapon('Milady',true),weapon('Longsword')]
 };
};
const response=text=>({
 ok:true,status:200,
 headers:{get:key=>key==='content-length'?String(new TextEncoder().encode(text).byteLength):null},
 text:async()=>text
});

test('static pinned upstream file never tracks mutable main branch or runs third-party JavaScript',()=>{
 assert.match(V117_UPSTREAM_COMMIT,/^[0-9a-f]{40}$/);
 assert.ok(V117_UPSTREAM_URL.includes(V117_UPSTREAM_COMMIT));
 assert.match(V117_UPSTREAM_URL,/\.js$/);
 assert.match(V117_SOURCE_PAGE,/github\.com/);
 assert.match(V117_COPYING_URL,/COPYING$/);
 assert.equal(V117_EXPECTED_VARIANTS,3296);
 assert.equal(V117_MAX_BYTES,16_000_000);
});
test('strict local JSON schema inspection counts variants and proves no JavaScript is accepted',()=>{
 const sample=fixture(),raw=JSON.stringify(sample);
 assert.deepEqual(inspectV117Json(raw,{expectedEntries:2}),{
  entries:2,uniqueNames:2,dlcRows:1,version:'1.17'
 });
 assert.throws(()=>inspectV117Json(raw),/Unexpected number of source weapon variants/);
 assert.throws(()=>inspectV117Json('window.weapons = '+raw,{expectedEntries:2}),/not valid JSON/);
 assert.throws(()=>inspectV117Json('import("evil")',{expectedEntries:2}),/not valid JSON/);
 const broken=structuredClone(sample);broken.weapons[1].name='Milady';
 assert.throws(()=>inspectV117Json(JSON.stringify(broken),{expectedEntries:2}),/Duplicate/);
 const missing=structuredClone(sample);delete missing.reinforceTypes;
 assert.throws(()=>inspectV117Json(JSON.stringify(missing),{expectedEntries:2}),/reinforceTypes/);
 const invalid=structuredClone(sample);delete invalid.weapons[0].attack;
 assert.throws(()=>inspectV117Json(JSON.stringify(invalid),{expectedEntries:2}),/malformed/);
});
test('user-initiated download uses pinned URL, fetches no credentials and never executes code',async()=>{
 const original=fixture(),variants=original.weapons;
 for(let i=2;i<V117_EXPECTED_VARIANTS;i++)
  variants.push({...variants[1],name:'Fixture Weapon '+i});
 const raw=JSON.stringify(original);
 let observed=null;
 const r=await downloadV117Source(async(url,opts)=>{
  observed={url,opts};return response(raw);
 });
 assert.equal(r.summary.entries,V117_EXPECTED_VARIANTS);
 assert.equal(r.summary.dlcRows,1);
 assert.equal(r.text,raw);
 assert.equal(observed.url,V117_UPSTREAM_URL);
 assert.equal(observed.opts.credentials,'omit');
 assert.equal(observed.opts.cache,'no-store');
 assert.equal(observed.opts.redirect,'error');
 assert.equal(observed.opts.mode,'cors');
});
test('early reject oversized, bad response and script-like remote data; never load silently',async()=>{
 await assert.rejects(()=>downloadV117Source(async()=>({
  ok:true,headers:{get:()=>String(V117_MAX_BYTES+1)}
 })),/exceeds 16 MB/);
 await assert.rejects(()=>downloadV117Source(async()=>({ok:false,status:403})),/HTTP 403/);
 await assert.rejects(()=>downloadV117Source(async()=>response('console.log("injected")')),/not valid JSON/);
});
test('streaming path enforces 16MB cap even if content-length omitted',async()=>{
 const payload=new TextEncoder().encode(JSON.stringify(fixture()));
 const stream=new ReadableStream({start(ctrl){ctrl.enqueue(payload);ctrl.close();}});
 await assert.rejects(()=>downloadV117Source(async()=>({
  ok:true,headers:{get:()=>null},body:stream
 })),/Unexpected number of source weapon variants/);
 const massive=new ReadableStream({start(ctrl){
  ctrl.enqueue(new Uint8Array(V117_MAX_BYTES+1));ctrl.close();
 }});
 await assert.rejects(()=>downloadV117Source(async()=>({
  ok:true,headers:{get:()=>null},body:massive
 })),/streaming limit/);
});
