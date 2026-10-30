import test from 'node:test';
import assert from 'node:assert/strict';
import {COMPACT_SYNTHETIC_REGULATION} from '../public/data/ar-compact-synthetic.mjs';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {calculateAr,POWER_STATS,DAMAGE_TYPES} from '../public/src/weapon-ar.mjs';
import {calculateStatInvestmentSensitivity} from '../public/src/ar-stat-sensitivity.mjs';

const stats={str:40,dex:20,int:10,fai:10,arc:10};
const profile=(name='Fictional Bronze Sword — QA ONLY')=>
 convertCompactRegulation(COMPACT_SYNTHETIC_REGULATION,{weaponName:name,
  gameVersion:'SYNTHETIC',sourceReference:'invented math fixture'});
const one=(p,stats=stats,extra={})=>calculateStatInvestmentSensitivity(p,stats,extra);

test('five attributes × three exact investments match direct source AR',()=>{
 const p=profile(),out=one(p,stats,{upgrade:1});
 assert.equal(out.rows.length,15);
 assert.deepEqual(out.rows.map(x=>x.stat),
  POWER_STATS.flatMap(s=>[s,s,s]));
 assert.deepEqual(out.increments,[1,5,10]);
 assert.equal(out.gameClientVerified,false);
 assert.equal(out.publicationApproved,false);
 const baseline=calculateAr(p,stats,{upgrade:1,twoHanded:false});
 assert.equal(out.baselineTotal,baseline.total);
 for(const row of out.rows){
  const changed={...stats,[row.stat]:stats[row.stat]+row.spentPoints};
  const exact=calculateAr(p,changed,{upgrade:1,twoHanded:false});
  assert.equal(row.total,exact.total);
  assert.equal(row.gain,exact.total-out.baselineTotal);
  assert.equal(row.gainPerPoint,row.gain/row.spentPoints);
  assert.equal(DAMAGE_TYPES.reduce((s,d)=>s+row.componentGains[d],0),row.gain);
  assert.equal(row.status,'calculated-unverified');
 }
 assert.match(out.note,/UNCERTIFIED/);
});

test('99 stat caps are explicit; 97 +5 invests only 2 and never overstates ROI',()=>{
 const p=profile(),s={...stats,str:99,dex:97};
 const out=one(p,s,{upgrade:0,twoHanded:true});
 const capped=out.rows.filter(x=>x.stat==='str');
 assert.deepEqual(capped.map(x=>x.status),['stat-at-99-cap','stat-at-99-cap','stat-at-99-cap']);
 assert.ok(capped.every(x=>x.total===null&&x.spentPoints===0&&x.gainPerPoint===null));
 const dex5=out.rows.find(x=>x.stat==='dex'&&x.requestedPoints===5);
 assert.equal(dex5.status,'capped-at-99');
 assert.equal(dex5.spentPoints,2);assert.equal(dex5.statAfter,99);
 assert.equal(dex5.gainPerPoint,dex5.gain/2);
 assert.equal(out.effectiveStrength,148);
 assert.deepEqual(out.inputStats,s);
 assert.equal(s.dex,97);
});

test('requirements threshold appears as crossed only in a true one-stat delta',()=>{
 const p=profile('Fictional Heavy Sword — QA ONLY');
 const s={...stats,str:20};
 const oneHand=one(p,s,{upgrade:0});
 assert.ok(oneHand.missingRequirementsBefore.includes('str'));
 const str1=oneHand.rows.find(x=>x.stat==='str'&&x.requestedPoints===1);
 assert.ok(str1.missingRequirementsAfter.includes('str'));
 assert.deepEqual(str1.requirementsNewlyMet,[]);
 const str5=oneHand.rows.find(x=>x.stat==='str'&&x.requestedPoints===5);
 assert.deepEqual(str5.requirementsNewlyMet,['str']);
 assert.equal(str5.missingRequirementsAfter.includes('str'),false);
 const twoHand=one(p,s,{upgrade:0,twoHanded:true});
 assert.equal(twoHand.missingRequirementsBefore.includes('str'),false);
 assert.equal(twoHand.effectiveStrength,30);
});

test('paired grip does not invent a two-handed STR multiplier',()=>{
 const p=profile('Fictional Paired Knives — QA ONLY');
 const a=one(p,stats,{twoHanded:false});
 const b=one(p,stats,{twoHanded:true});
 assert.equal(a.baselineTotal,b.baselineTotal);
 assert.equal(a.effectiveStrength,40);assert.equal(b.effectiveStrength,40);
 assert.deepEqual(a.rows.map(x=>x.gain),b.rows.map(x=>x.gain));
});

test('magic/physical deltas remain separate and requirement boundary is flagged',()=>{
 const p=profile('Fictional Magic Sword — QA ONLY');
 const s={...stats,int:14};
 const out=one(p,s,{upgrade:1});
 assert.ok(out.missingRequirementsBefore.includes('int'));
 const int5=out.rows.find(x=>x.stat==='int'&&x.requestedPoints===5);
 assert.deepEqual(int5.requirementsNewlyMet,['int']);
 assert.ok(int5.componentGains.magic>0);
 assert.equal(DAMAGE_TYPES.reduce((t,d)=>t+int5.componentGains[d],0),int5.gain);
});

test('unknown upgrade, corrupted attributes, and ambiguous increments fail closed',()=>{
 const p=profile();
 assert.throws(()=>one(p,stats,{upgrade:25}),/no supplied data/);
 for(const s of [{...stats,str:100},{...stats,str:0},{...stats,dex:1.5}])
  assert.throws(()=>one(p,s),RangeError);
 for(const increments of [[],[1,1],[0],[100],[1.5],Array(11).fill(1)])
  assert.throws(()=>one(p,stats,{increments}),/Increments/);
 assert.throws(()=>one(p,stats,{twoHanded:'yes'}),/boolean/);
 const bad=structuredClone(p);
 bad.affinities['ALTERNATIVE']=bad.affinities['SOURCE AFFINITY'];
 assert.throws(()=>one(bad,stats),/single-affinity/);
});
