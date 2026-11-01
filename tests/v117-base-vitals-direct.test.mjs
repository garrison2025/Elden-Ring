import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {V117_WRETCH_NO_GEAR_CURVES,verifiedV117BaseVitals} from '../public/src/v117-base-vitals-direct.mjs';
const keys=['hp','fp','stamina','maxEquipLoad'];
test('exact 4×90 real public site readouts, not made-up polynomial interpolation',()=>{
 for(const key of keys){
  assert.equal(V117_WRETCH_NO_GEAR_CURVES[key].length,90);
  assert.ok(V117_WRETCH_NO_GEAR_CURVES[key].every((x,i,arr)=>Number.isFinite(x)&&
   (i===0||x>=arr[i-1])));
 }
 assert.deepEqual([V117_WRETCH_NO_GEAR_CURVES.hp[30],V117_WRETCH_NO_GEAR_CURVES.hp[50],
  V117_WRETCH_NO_GEAR_CURVES.fp[20],V117_WRETCH_NO_GEAR_CURVES.stamina[15],
  V117_WRETCH_NO_GEAR_CURVES.maxEquipLoad[15]],[1450,1900,173,121,72]);
});
test('same-input public Wretch derived-stat samples match exactly',()=>{
 const a=verifiedV117BaseVitals([40,10,10,10,10,10,10,10]);
 assert.equal(a.status,'direct-wretch-axis');
 assert.deepEqual([a.hp,a.fp,a.stamina,a.maxEquipLoadDisplay],[1450,78,96,48.2]);
 const b=verifiedV117BaseVitals([40,30,25,10,10,10,10,40]);
 assert.equal(b.status,'per-stat-site-curves-not-build-parity');
 assert.deepEqual([b.hp,b.fp,b.stamina,b.maxEquipLoadDisplay],[1450,173,121,72]);
 assert.equal(verifiedV117BaseVitals([40,30,25,10,10,10,10,40],{origin:'Samurai'}).status,
  'per-stat-site-curves-not-build-parity');
});
test('below proven 10 has explicit UNKNOWN and invalid stats fail closed',()=>{
 const v=verifiedV117BaseVitals([9,10,10,10,10,10,10,10]);
 assert.equal(v.status,'unsupported-baseline');
 assert.equal(v.hp,null);
 for(const stats of [[100,10,10,10,10,10,10,10],[40,30,25],Array(8).fill('')])
  assert.throws(()=>verifiedV117BaseVitals(stats),RangeError);
});
test('Build Planner displays unbuffed vitals as a bounded view, not effect-modified stats',()=>{
 const html=readFileSync(new URL('../public/build-planner/index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../public/src/app.mjs',import.meta.url),'utf8');
 for(const id of ['build-base-vitals','base-hp','base-fp','base-stamina','base-equip-load','base-vitals-note'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.match(app,/verifiedV117BaseVitals\(v,\{origin:current.name\}\)/);
 assert.match(app,/base-vitals-note/);
});
