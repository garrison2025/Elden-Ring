import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE as evidence,getTarnishedV117DirectWeight as get} from '../public/src/tarnished-v117-public-weights.mjs';
const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
test('107 individually twice-observed public site weight facts remain versioned and source explicit',()=>{
 assert.equal(evidence.length,107);
 assert.equal(evidence.filter(x=>x.evidenceRun===41257934288).length,30);
 assert.equal(evidence.filter(x=>x.evidenceRun===41259504988).length,37);
 assert.equal(evidence.filter(x=>x.evidenceRun===41260697800).length,31);
 assert.equal(new Set(evidence.map(x=>x.weaponName)).size,107);
 for(const x of evidence){
  assert.ok(catalog.weapons.some(w=>w.name===x.weaponName));
  assert.equal(x.observedTwice,true);
  assert.equal(x.comparatorVersion,'1.17');
  assert.ok([41257042883,41257934288,41259504988,41260697800].includes(x.evidenceRun));
  assert.equal(x.baseAttackVerified,false);
  assert.equal(x.requirementsVerified,false);
  assert.ok(x.weight>0&&Number.isFinite(x.weight));
 }
 assert.equal(get('Stone-Sheathed Sword').weight,5);
 assert.equal(get('Albinauric Shield').weight,4.5);
 assert.equal(get('Brass Shield').weight,7);
 assert.equal(get('Fingerprint Stone Shield').weight,29);
 assert.equal(get('Golden Greatshield').weight,17);
 assert.equal(get('Great Turtle Shell').weight,5.5);
 assert.equal(get('Moonveil'),null);
 assert.equal(get(null),null);
});
test('community catalog remains intact and source disagreements are NOT silently erased',()=>{
 const stone=catalog.weapons.find(x=>x.name==='Stone-Sheathed Sword');
 assert.equal(stone.weight,3.5);
 assert.ok(stone.flags.includes('stone-sheathed-weight-source-conflict'));
 for(const name of ['Albinauric Shield','Brass Shield','Fingerprint Stone Shield',
  'Golden Greatshield','Great Turtle Shell']){
  const w=catalog.weapons.find(x=>x.name===name);
  assert.equal(w.attack,null);
  assert.equal(w.weight,null);
  assert.equal(w.dataCoverage,'requirements-only');
 }
});

test('all 30 distinct new missing-weight names are mapped to exact twice-observed v1.17 values',async()=>{
 const {V117_WEIGHT_BATCH2_CANDIDATES:planned}=await import('../scripts/tarnished-v117-weight-batch2-candidates.mjs');
 const expected=[5,6,3.5,5,3,3.5,5,2,8.5,1.5,3.5,4.5,15.5,15,16,16.5,15,3.5,3.5,16.5,3,17,3.5,3.5,3.5,3,3.5,15.5,3,4.5];
 assert.equal(planned.length,30);
 assert.equal(evidence.length,107);
 for(let i=0;i<30;i++){
  const c=planned[i],row=get(c.name);
  assert.ok(row,c.name);
  assert.equal(row.weight,expected[i],c.name);
  assert.equal(row.evidenceRun,41257934288,c.name);
  assert.equal(row.observedTwice,true,c.name);
  assert.equal(row.evidenceCategory,'missing-primary-weight',c.name);
  assert.equal(catalog.weapons.find(x=>x.name===c.name).weight,null,c.name+' original source is never overwritten');
 }
});

test('final 37 original weight gaps all have independently repeated Tarnished.dev v1.17 numeric evidence',async()=>{
 const {V117_WEIGHT_FINAL37_CANDIDATES:planned}=await import('../scripts/tarnished-v117-weight-final37-candidates.mjs');
 const exact=[12.5,1.5,11.5,13.5,11.5,10.5,1.5,9,10,8,3,9,2,15.5,3,4,20.5,1.5,3.5,3.5,1.5,14,1,2,2,4,4.5,1.5,2,3.5,3,9.5,2,3.5,4.5,24,8];
 assert.equal(planned.length,37);
 assert.equal(evidence.length,107);
 for(let i=0;i<37;i++){
  const c=planned[i],record=get(c.name);
  assert.ok(record,c.name);
  assert.equal(record.weight,exact[i],c.name);
  assert.equal(record.evidenceRun,41259504988,c.name);
  assert.equal(record.observedTwice,true,c.name);
  assert.equal(record.verifiedSingleItem,true,c.name);
  assert.equal(record.evidenceCategory,'missing-primary-weight',c.name);
  assert.equal(catalog.weapons.find(w=>w.name===c.name).weight,null,c.name+' canonical provenance remains original');
 }
 const originallyMissing=catalog.weapons.filter(w=>w.weight===null);
 assert.equal(originallyMissing.length,72);
 assert.equal(originallyMissing.filter(w=>get(w.name)?.evidenceCategory==='missing-primary-weight').length,72);
});

test('direct v1.17 public-site Staff of the Great Beyond discrepancy is corrected without rewriting community provenance',()=>{
 const staff=catalog.weapons.find(x=>x.name==='Staff of the Great Beyond');
 assert.ok(staff);
 assert.equal(staff.weight,2,'historic community reference must not be silently overwritten');
 const observed=get(staff.name);
 assert.equal(observed.weight,2.5);
 assert.equal(observed.evidenceCategory,'known-community-weight-disagreement');
 assert.equal(observed.evidenceRun,41260697800);
 assert.equal(observed.observedTwice,true);
 assert.equal(observed.baseAttackVerified,false);
 assert.equal(observed.requirementsVerified,false);
 assert.equal(get('Carian Sorcery Sword').weight,2.5);
 assert.equal(get('Beast-repellent Torch'),null,'unactivated competitor torch must not be approved');
});
