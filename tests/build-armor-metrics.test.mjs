import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ARMOR_METRICS} from '../public/src/armor-source-optin.mjs';
import {emptyBuildLoadout,decodeBuildLoadout,encodeBuildLoadout} from '../public/src/build-loadout.mjs';
import {summarizeEquippedArmorMetrics} from '../public/src/build-armor-metrics.mjs';

const full=(physical,immunity,poise)=>Object.fromEntries(
 Object.keys(ARMOR_METRICS).map(k=>[k,k==='physical'?physical:
  k==='immunity'?immunity:k==='poise'?poise:
  ARMOR_METRICS[k].kind==='negation'?0:1])
);
const reference=()=>[
 {id:'helm',slot:'Head',name:'Known Helm',weight:3,poise:10,
  metrics:full(20,12,10)},
 {id:'chest',slot:'Chest',name:'Known Chest',weight:8,poise:20,
  metrics:full(30,21,20)},
 {id:'arms',slot:'Arms',name:'Known Hands',weight:2,poise:5,
  metrics:full(5,9,5)},
 {id:'legs',slot:'Legs',name:'Known Legs',weight:4,poise:7,
  metrics:full(7,15,7)}
];
const equip=()=>{const s=emptyBuildLoadout();
 s.armorSlots[0]={name:'Known Helm',weight:'3',weightSource:'community'};
 s.armorSlots[1]={name:'Known Chest',weight:'8',weightSource:'community'};
 return s;
};
test('selected Build armor aggregates thirteen real source metrics from 4 slots, no active buffs',()=>{
 const state=equip(),src=reference();
 const a=summarizeEquippedArmorMetrics(state,src);
 assert.equal(a.status,'complete-source-armor');
 assert.equal(a.equipped,2);
 assert.equal(a.matched,2);
 assert.equal(Object.keys(a.metrics).length,13);
 assert.equal(a.metrics.physical.value,44);
 assert.equal(a.metrics.immunity.value,33);
 assert.equal(a.metrics.poise.value,30);
 assert.equal(a.metrics.physical.unit,'%');
 assert.equal(a.metrics.poise.unit,'points');
 assert.equal(a.metrics.fire.value,0,'Explicitly sourced zeros may aggregate to zero');
 assert.match(a.caveat,/No talismans, Great Runes/);
 const p=structuredClone(state);
 p.armorSlots[2]={name:'Known Hands',weight:'2',weightSource:'manual'};
 const b=summarizeEquippedArmorMetrics(p,src);
 assert.equal(b.metrics.physical.value,46.8); // 1 - 0.8 * 0.7 * 0.95
 assert.equal(b.metrics.poise.value,35);
 assert.equal(b.metrics.immunity.value,42);
 assert.ok(Object.keys(b.metrics).every(k=>b.metrics[k].known===3));
});
test('source is never implicitly downloaded or reconstructed from a saved loadout',()=>{
 const input=equip();
 const before=summarizeEquippedArmorMetrics(input,null);
 assert.equal(before.status,'source-not-loaded');
 assert.equal(before.metrics,null);
 assert.equal(before.equipped,2);
 const restored=decodeBuildLoadout(encodeBuildLoadout(input));
 const after=summarizeEquippedArmorMetrics(restored,null);
 assert.equal(after.sourceLoaded,false);
 assert.equal(after.metrics,null);
});
test('missing item or missing metric invalidates only relevant totals, never guessed zero',()=>{
 const input=equip();
 input.armorSlots[1].name='Unlisted armor';
 const partial=summarizeEquippedArmorMetrics(input,reference());
 assert.equal(partial.status,'partial-source-armor');
 assert.deepEqual(partial.missingNames,['Unlisted armor']);
 assert.equal(partial.metrics.physical.value,null);
 assert.equal(partial.metrics.physical.known,1);
 const missing=reference();missing[1].metrics.magic=null;
 const result=summarizeEquippedArmorMetrics(equip(),missing);
 assert.equal(result.status,'partial-metric-fields');
 assert.equal(result.metrics.magic.value,null);
 assert.equal(result.metrics.magic.known,1);
 assert.equal(result.metrics.poise.value,30);
});
test('empty slots, ambiguity and changed source labels are not counted as equipment',()=>{
 const x=emptyBuildLoadout();
 const empty=summarizeEquippedArmorMetrics(x,reference());
 assert.equal(empty.status,'no-equipped-armor');
 assert.equal(empty.equipped,0);
 assert.equal(empty.metrics.poise.value,null);
 const bad=reference();
 bad.push({...bad[0],id:'duplicated-helm'});
 const multiple=summarizeEquippedArmorMetrics(equip(),bad);
 assert.equal(multiple.matched,1);
 assert.equal(multiple.metrics.poise.value,null);
 assert.deepEqual(multiple.missingNames,['Known Helm']);
});
test('Build UI has actual opt-in metric calculation, dynamic table and correct safety label',()=>{
 const app=readFileSync(new URL('../public/src/build-loadout-app.mjs',import.meta.url),'utf8');
 const page=readFileSync(new URL('../public/build-planner/index.html',import.meta.url),'utf8');
 assert.match(app,/summarizeEquippedArmorMetrics\(evaluated.state,armorReference\?\.armors\?\?null\)/);
 assert.match(app,/id:'build-armor-metric-summary'/);
 assert.match(app,/field\.value===null\?'UNKNOWN'/);
 assert.match(app,/field\.kind==='negation'/);
 assert.match(app,/not a separate Tarnished.dev v1.17/i);
 assert.match(page,/568-entry armor reference/);
 assert.match(page,/13 source stats/);
});
