import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateAr, validateArProfile, effectiveStrength} from '../public/src/weapon-ar.mjs';
import {AR_SYNTHETIC_FIXTURE as demo} from '../public/data/ar-synthetic-fixture.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const stats=(str=40,dex=20)=>({str,dex,int:10,fai:10,arc:10});
test('research fixture is validated; game-certified status is refused',()=>{
 assert.equal(validateArProfile(demo).provenance.status,'synthetic-test');
 const f=clone(demo);f.provenance.status='game-verified';assert.throws(()=>validateArProfile(f),/status/);
});
test('base + independent attribute correction generates fixture AR',()=>{
 const r=calculateAr(demo,stats(),{affinity:'TEST ONLY'});
 assert.equal(r.perElement[0].base,100);
 assert.ok(Math.abs(r.perElement[0].scaling-36)<1e-8);
 assert.equal(r.total,136);
 assert.match(r.status,/UNVERIFIED/);
});
test('two-handing increases effective strength, not real STR stat or level',()=>{
 assert.equal(effectiveStrength(99,true),148);
 const r=calculateAr(demo,stats(),{twoHanded:true});
 assert.equal(r.effectiveStats.str,60);
 assert.equal(r.stats.str,40);
 assert.equal(r.total,152);
});
test('below weapon requirement follows negative scaling and lower clamp',()=>{
 const r=calculateAr(demo,stats(5,20));
 assert.deepEqual(r.missingRequirements,['str']);
 assert.equal(r.total,64);
});
test('data-driven upgrade multiplies base damage and individual stat scaling',()=>{
 const r=calculateAr(demo,stats(),{upgrade:1});
 assert.ok(Math.abs(r.perElement[0].base-110)<1e-8);
 assert.equal(r.total,151);
});
test('missing level cannot be guessed by interpolation',()=>assert.throws(()=>calculateAr(demo,stats(),{upgrade:2}),/no supplied data/));
test('invalid or incomplete curve must be rejected',()=>{
 const f=clone(demo);f.affinities['TEST ONLY'].correctionCurves.physical=[0,1];
 assert.throws(()=>calculateAr(f,stats()),/151/);
});
test('rejects corrupted numeric parameters and missing weapon requirement',()=>{
 const bad=clone(demo);bad.affinities['TEST ONLY'].baseDamage.physical='100';
 assert.throws(()=>validateArProfile(bad),/finite number/);
 const req=clone(demo);delete req.requirements.str;
 assert.throws(()=>validateArProfile(req),/requirements.str/);
});
test('correctly keeps physical/magic elements independent and floors only final total',()=>{
 const f=clone(demo),a=f.affinities['TEST ONLY'];
 a.baseDamage.magic=30;a.elementScaling.magic=Object.fromEntries(['str','dex','int','fai','arc'].map(x=>[x,{enabled:false}]));
 a.correctionCurves.magic=Array.from({length:151},()=>0);
 a.upgrades.forEach(u=>{u.damageMultipliers.magic=1});
 const r=calculateAr(f,stats(),{});
 assert.equal(r.total,166);
 assert.equal(r.perElement.length,2);
});
test('supports impact correction overrides and unmet requirement penalty based on impact',()=>{
 const f=clone(demo),rule=f.affinities['TEST ONLY'].elementScaling.physical.str;
 rule.impactRatio=1.1;rule.overrideScaling=0.5;
 let r=calculateAr(f,stats());assert.equal(r.total,136); // 0.1 + 0.5*.4*1.1 + 0.04 = 0.36
 r=calculateAr(f,stats(5));assert.ok(r.perElement[0].attributes.some(a=>a.stat==='str'&&Math.abs(a.multiplier+0.34)<1e-8));
});

test('research AR respects paired and forced-two-hand grip modes',()=>{
 const f=clone(demo);f.gripMode='paired';
 const paired=calculateAr(f,stats(),{twoHanded:true});
 assert.equal(paired.effectiveStats.str,40);
 assert.equal(paired.total,136);
 f.gripMode='forced-two-hand';
 const forced=calculateAr(f,stats(),{twoHanded:false});
 assert.equal(forced.effectiveStats.str,60);
 assert.equal(forced.total,152);
 f.gripMode='not-a-mode';
 assert.throws(()=>validateArProfile(f),/gripMode/);
});
