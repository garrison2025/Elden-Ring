/**
 * Independent, parameter-driven research implementation of weapon attack rating.
 * NO game-owned weapon data or official-game parity is bundled.
 * References: ERDB algorithm documentation (math only), see docs/AR_VALIDATION.md.
 */
export const DAMAGE_TYPES = Object.freeze(['physical','magic','fire','lightning','holy']);
export const POWER_STATS = Object.freeze(['str','dex','int','fai','arc']);
const own = (obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
function fail(msg){throw new RangeError(msg)}
function record(v,label){if(!v||typeof v!=='object'||Array.isArray(v))fail(`${label} must be an object.`);return v}
function number(v,label,min=0,max=1e8){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail(`${label} must be a finite number between ${min} and ${max}.`);return v}
function integer(v,label,min,max){if(!Number.isInteger(v)||v<min||v>max)fail(`${label} must be an integer from ${min} to ${max}.`);return v}
function shortText(v,label){if(typeof v!=='string'||!v.trim()||v.length>120)fail(`${label} must be a short, nonempty string.`);return v}
export function effectiveStrength(str,twoHanded=false){
  integer(str,'Strength',1,99);
  return twoHanded ? Math.floor(str*1.5) : str;
}
export function validateArProfile(input){
  const p=record(input,'Profile');
  if(p.schemaVersion!==1)fail('Only schemaVersion: 1 is supported.');
  shortText(p.label,'Profile label');
  const provenance=record(p.provenance,'provenance');
  if(!['synthetic-test','manual-unverified'].includes(provenance.status))fail('Profile status must be synthetic-test or manual-unverified; game-verified status is not supported by this preview.');
  shortText(provenance.note,'provenance.note');
  const req=record(p.requirements,'requirements');
  for(const s of POWER_STATS)integer(req[s],`requirements.${s}`,0,99);
  const affinities=record(p.affinities,'affinities');
  const affinityNames=Object.keys(affinities);
  if(!affinityNames.length||affinityNames.length>40)fail('Add at least one affinity (up to 40).');
  for(const name of affinityNames){
    shortText(name,'affinity name');
    const a=record(affinities[name],`affinities.${name}`);
    record(a.baseDamage,`${name}.baseDamage`);
    record(a.baseScaling,`${name}.baseScaling`);
    record(a.correctionCurves,`${name}.correctionCurves`);
    record(a.elementScaling,`${name}.elementScaling`);
    if(!Array.isArray(a.upgrades)||!a.upgrades.length||a.upgrades.length>26)fail(`${name}.upgrades must have 1–26 levels.`);
    for(const s of POWER_STATS)number(a.baseScaling[s],`${name}.baseScaling.${s}`,0,100);
    let hasDamage=false;
    for(const d of DAMAGE_TYPES){
      const base=number(a.baseDamage[d],`${name}.baseDamage.${d}`,0,100000);
      if(base>0)hasDamage=true;
      if(base===0)continue;
      const c=a.correctionCurves[d];
      if(!Array.isArray(c)||c.length!==151)fail(`${name}.correctionCurves.${d} must contain exactly 151 numeric entries, indexes 0–150; interpolation is not accepted.`);
      for(let i=0;i<c.length;i++)number(c[i],`${name}.correctionCurves.${d}[${i}]`,0,10);
      const rules=record(a.elementScaling[d],`${name}.elementScaling.${d}`);
      for(const s of POWER_STATS){
        const v=record(rules[s],`${name}.elementScaling.${d}.${s}`);
        if(typeof v.enabled!=='boolean')fail(`${name}.${d}.${s}.enabled must be boolean.`);
        if(v.enabled){
          number(v.impactRatio,`${name}.${d}.${s}.impactRatio`,0,10);
          if(v.overrideScaling!==null && v.overrideScaling!==undefined)number(v.overrideScaling,`${name}.${d}.${s}.overrideScaling`,0,100);
        }
      }
    }
    if(!hasDamage)fail(`${name} must have at least one positive base-damage type.`);
    const levels=new Set();
    for(const u of a.upgrades){
      record(u,`${name} upgrade`);
      integer(u.level,`${name}.upgrade.level`,0,25);
      if(levels.has(u.level))fail(`${name}: duplicate upgrade level ${u.level}.`);
      levels.add(u.level);
      record(u.damageMultipliers,`${name} upgrade.damageMultipliers`);
      record(u.scalingMultipliers,`${name} upgrade.scalingMultipliers`);
      for(const d of DAMAGE_TYPES)if(a.baseDamage[d]>0)number(u.damageMultipliers[d],`${name}.upgrade ${u.level}.damageMultipliers.${d}`,0,100);
      for(const s of POWER_STATS)number(u.scalingMultipliers[s],`${name}.upgrade ${u.level}.scalingMultipliers.${s}`,0,100);
    }
  }
  return p;
}
export function calculateAr(profile,rawStats,{affinity,upgrade=0,twoHanded=false}={}){
  const p=validateArProfile(profile),stats=record(rawStats,'Player stats');
  const a=p.affinities[affinity??Object.keys(p.affinities)[0]];
  if(!a)fail('Unknown affinity.');
  integer(upgrade,'Upgrade',0,25);
  const u=a.upgrades.find(x=>x.level===upgrade);
  if(!u)fail(`Upgrade +${upgrade} has no supplied data; cannot interpolate missing game parameters.`);
  for(const s of POWER_STATS)integer(stats[s],`Player ${s}`,1,99);
  if(typeof twoHanded!=='boolean')fail('twoHanded must be boolean.');
  const effective={...stats,str:effectiveStrength(stats.str,twoHanded)};
  const missing=POWER_STATS.filter(s=>effective[s]<p.requirements[s]);
  const result=[];
  for(const d of DAMAGE_TYPES){
    if(a.baseDamage[d]===0)continue;
    const base=a.baseDamage[d]*u.damageMultipliers[d];
    const attr=[];
    for(const s of POWER_STATS){
      const rule=a.elementScaling[d][s];
      if(!rule.enabled){attr.push({stat:s,multiplier:0,reason:'disabled'});continue}
      const impact=rule.impactRatio;
      if(effective[s]<p.requirements[s]){
        attr.push({stat:s,multiplier:0.6*(impact-1)-0.4,reason:'requirement-not-met'});
        continue;
      }
      const scaling=rule.overrideScaling??a.baseScaling[s];
      const correction=a.correctionCurves[d][effective[s]];
      attr.push({stat:s,multiplier:impact-1+scaling*u.scalingMultipliers[s]*correction*impact,reason:'scaled'});
    }
    const sum=attr.reduce((t,v)=>t+v.multiplier,0);
    const lower=Math.min(...attr.map(v=>v.multiplier));
    const scalingMultiplier=Math.max(lower,sum);
    const scaling=base*scalingMultiplier;
    const raw=base+scaling;
    result.push({element:d,base,scaling,raw,displayed:Math.floor(raw),attributes:attr});
  }
  const total= Math.floor(result.reduce((s,e)=>s+e.raw,0));
  return {label:p.label,affinity:affinity??Object.keys(p.affinities)[0],upgrade,twoHanded,stats:{...stats},effectiveStats:effective,missingRequirements:missing,perElement:result,total,provenance:p.provenance,status:'UNVERIFIED — parameter-driven research output; not an in-game prediction'};
}
