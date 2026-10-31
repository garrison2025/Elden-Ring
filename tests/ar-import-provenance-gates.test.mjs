import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMPACT_SYNTHETIC_REGULATION} from '../public/data/ar-compact-synthetic.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';
import {calculateSourceUpgradeProgression} from '../public/src/ar-upgrade-progression.mjs';

const copy=()=>structuredClone(COMPACT_SYNTHETIC_REGULATION);
const opts={
 weaponName:'Fictional Bronze Sword — QA ONLY',
 gameVersion:'FICTIONAL-QA',
 sourceReference:'independently invented local synthetic fixture'
};
const stats={str:40,dex:20,int:10,fai:10,arc:10};
const importRoot=root=>convertCompactRegulation(root,opts);

test('missing whole requirement record must not be interpreted as all-zero weapon requirements',()=>{
 for(const missing of [undefined,null]){
  const root=copy();
  if(missing===undefined)delete root.weapons[0].requirements;
  else root.weapons[0].requirements=missing;
  assert.throws(()=>importRoot(root),/weapon requirements must be an object/);
 }
 // Sparse requirement encoding is still permitted when the source explicitly
 // supplies its requirements record; absence of individual zero keys is normal.
 const present=copy();
 assert.equal(importRoot(present).requirements.str,10);
 assert.equal(importRoot(present).requirements.arc,0);
 present.weapons[0].requirements={};
 assert.equal(importRoot(present).requirements.str,0);
});

test('positive numeric attack-element correction cannot use missing or zero base attribute scaling',()=>{
 for(const variant of ['missing','explicit-zero']){
  const root=copy();
  root.attackElementCorrects[1][0].int=0.6;
  if(variant==='explicit-zero')root.weapons[0].attributeScaling.push(['int',0]);
  assert.throws(()=>importRoot(root),
   /requires positive source attribute scaling/);
 }
 const root=copy();
 root.attackElementCorrects[1][0].str=0.6;
 const p=importRoot(root);
 assert.equal(p.affinities['SOURCE AFFINITY'].elementScaling.physical.str.overrideScaling,0.6);
 const result=calculateAr(p,stats,{affinity:'SOURCE AFFINITY',upgrade:0});
 assert.equal(result.total,128,'0.6 source correction * 40% stat curve plus 0.2 DEX scaling');
 assert.equal(result.provenance.status,'manual-unverified');
 assert.match(result.status,/UNVERIFIED/);
});

test('invalid source never yields a misleading reinforcement progression or nominal AR',()=>{
 const incomplete=copy();
 incomplete.attackElementCorrects[1][0].arc=0.25;
 assert.throws(()=>calculateSourceUpgradeProgression(importRoot(incomplete),stats),
  /requires positive source attribute scaling/);
 // Unaffected synthetic source remains numerically reproducible.
 const valid=importRoot(copy());
 const progression=calculateSourceUpgradeProgression(valid,stats);
 assert.equal(progression.rows.length,2);
 assert.equal(progression.rows[0].status,'calculated-unverified');
 assert.equal(progression.gameClientVerified,false);
});

test('source data is unchanged: community facts remain distinct from game-client goldens',()=>{
 const p=readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8');
 const catalog=JSON.parse(p);
 assert.equal(catalog.weapons.length,487);
 assert.equal(catalog.meta.v117SourceConflictCount,7);
 const doc=readFileSync(new URL('../docs/AR_SOURCE_COMPLETENESS_GATES_20261031.md',import.meta.url),'utf8');
 assert.match(doc,/0 approved game-client AR screenshot goldens/);
});
