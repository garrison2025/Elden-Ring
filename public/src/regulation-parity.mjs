import {convertCompactRegulation} from './regulation-import.mjs';
import {calculateAr,POWER_STATS,DAMAGE_TYPES} from './weapon-ar.mjs';

/**
 * Independent RAW-snapshot arithmetic parity probe.
 * This does not copy or distribute upstream weapon rows. It compares the
 * current converter+AR pipeline with separately evaluated compact tables.
 * Agreement is NOT independent game-screenshot or exact-version validation.
 */
const error=message=>{throw new RangeError(message);};
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const get=(table,id,label)=>{
 if(!record(table)||!own(table,String(id)))error('Missing raw '+label+' '+id);
 return table[String(id)];
};
const ATTRS=POWER_STATS;
// This matrix deliberately probes additional reinforcement points and each
// damage-related attribute independently; no test is a game-client golden.
const statsCases={
 low:{str:9,dex:9,int:9,fai:9,arc:9},
 mid:{str:40,dex:40,int:40,fai:40,arc:40},
 high:{str:55,dex:45,int:35,fai:35,arc:30},
 str:{str:99,dex:10,int:10,fai:10,arc:10},
 dex:{str:10,dex:99,int:10,fai:10,arc:10},
 int:{str:10,dex:10,int:99,fai:10,arc:10},
 fai:{str:10,dex:10,int:10,fai:99,arc:10},
 arc:{str:10,dex:10,int:10,fai:10,arc:99},
 all:{str:99,dex:99,int:99,fai:99,arc:99}
};
export const PARITY_SCENARIO_LABELS=Object.freeze([
 'low +0 one-hand','low +0 two-hand',
 'high max one-hand','high max two-hand',
 'midpoint one-hand','midpoint two-hand',
 'STR-focused max two-hand','DEX-focused max one-hand',
 'INT-focused max one-hand','FAI-focused max one-hand',
 'ARC-focused max one-hand','all-99 max two-hand'
]);

/**
 * Evaluate the original correction stages directly at one stat, without
 * precomputing the 151-value curve used by our conversion engine.
 */
function rawCurve(stages,at){
 if(!Array.isArray(stages)||stages.length<2||!Number.isInteger(at)||at<1||at>148)
  error('Invalid raw correction curve');
 for(let i=1;i<stages.length;i++){
  const before=stages[i-1],after=stages[i];
  if(at>after.maxVal&&i!==stages.length-1)continue;
  const t=Math.max(0,Math.min(1,(at-before.maxVal)/(after.maxVal-before.maxVal)));
  const exponent=before.adjPt;
  const adjusted=exponent>0?Math.pow(t,exponent):exponent<0?1-Math.pow(1-t,-exponent):t;
  return before.maxGrowVal+(after.maxGrowVal-before.maxGrowVal)*adjusted;
 }
 error('Raw correction curve not found');
}
/** Compute physical+elemental raw AR for one source variant, without importing a profile. */
export function calculateRawV117Reference(root,item,stats,{upgrade=0,twoHanded=false}={}){
 if(!record(root)||!record(item)||!record(stats)||!Number.isInteger(upgrade)||upgrade<0||upgrade>25)
  error('Malformed raw source, weapon or upgrade');
 for(const a of ATTRS)if(!Number.isInteger(stats[a])||stats[a]<1||stats[a]>99)error('Invalid raw stat '+a);
 const reinforce=get(root.reinforceTypes,item.reinforceTypeId,'reinforcement');
 if(!Array.isArray(reinforce)||!record(reinforce[upgrade]))error('Upgrade row missing from source');
 const step=reinforce[upgrade],correct=get(root.attackElementCorrects,item.attackElementCorrectId,'attack-correction');
 const baseScale=Object.fromEntries(item.attributeScaling);
 const base=Object.fromEntries(item.attack);
 const requirements=item.requirements||{};
 const forced=[50,51,53,56].includes(item.weaponType);
 const bonus=forced||(!item.paired&&twoHanded);
 const actual={...stats,str:bonus?Math.floor(stats.str*1.5):stats.str};
 const missing=ATTRS.filter(a=>actual[a]<(requirements[a]??0));
 const parts=[];
 for(let n=0;n<5;n++){
  const original=base[String(n)]??0;if(original===0)continue;
  const factor=step.attack?.[String(n)];
  if(typeof factor!=='number'||!Number.isFinite(factor))
   error('Missing raw reinforcement multiplier for damage type '+n);
  const attack=original*factor,attributes=correct[String(n)]||{};
  let multiplier=1;
  if(missing.some(a=>Boolean(attributes[a])))multiplier=0.6;
  else for(const a of ATTRS){
   const setting=attributes[a];if(!setting)continue;
   const levelScaling=baseScale[a]===undefined?0:baseScale[a]*(step.attributeScaling?.[a]??0);
   let effectiveScaling;
   if(setting===true)effectiveScaling=levelScaling;
   else if(typeof setting==='number'){
    if(!baseScale[a])error('Raw numeric override has no initial scaling');
    effectiveScaling=setting*levelScaling/baseScale[a];
   }else error('Unknown raw attribute correction');
   if(!effectiveScaling)continue;
   const stageId=item.calcCorrectGraphIds?.[String(n)]??0;
   const curve=rawCurve(get(root.calcCorrectGraphs,stageId,'graph'),actual[a]);
   multiplier+=curve*effectiveScaling;
  }
  const unrounded=attack*multiplier;
  if(!Number.isFinite(unrounded))error('Reference produced a nonfinite damage component');
  parts.push({element:DAMAGE_TYPES[n],raw:unrounded,floored:Math.floor(unrounded)});
 }
 if(!parts.length)error('Weapon has no attack components in source');
 return {parts,total:parts.reduce((t,x)=>t+x.floored,0),actualStrength:actual.str,
  strengthBonusApplied:bonus};
}
const scenariosFor=maxLevel=>{
 const midLevel=Math.floor(maxLevel/2);
 return [
  {stats:statsCases.low,upgrade:0,twoHanded:false},
  {stats:statsCases.low,upgrade:0,twoHanded:true},
  {stats:statsCases.high,upgrade:maxLevel,twoHanded:false},
  {stats:statsCases.high,upgrade:maxLevel,twoHanded:true},
  {stats:statsCases.mid,upgrade:midLevel,twoHanded:false},
  {stats:statsCases.mid,upgrade:midLevel,twoHanded:true},
  {stats:statsCases.str,upgrade:maxLevel,twoHanded:true},
  {stats:statsCases.dex,upgrade:maxLevel,twoHanded:false},
  {stats:statsCases.int,upgrade:maxLevel,twoHanded:false},
  {stats:statsCases.fai,upgrade:maxLevel,twoHanded:false},
  {stats:statsCases.arc,upgrade:maxLevel,twoHanded:false},
  {stats:statsCases.all,upgrade:maxLevel,twoHanded:true}
 ];
};
/** Compare all supplied source records (up to 5000), report no source names or parameters. */
export function auditRawMathParity(root,{
 gameVersion='1.17',sourceReference='unverified research',maxExamples=20,
 maxRows=5000,onProgress
}={}){
 if(!record(root)||!Array.isArray(root.weapons)||root.weapons.length<1||
    root.weapons.length>50000||!Number.isInteger(maxRows)||maxRows<1||maxRows>5000||
    !Number.isInteger(maxExamples)||maxExamples<0||maxExamples>50||
    (onProgress!==undefined&&typeof onProgress!=='function'))
  error('Invalid raw AR audit input');
 const failures=new Map(),samples=[];let converted=0,compared=0,mismatched=0,unsupported=0;
 const total=Math.min(root.weapons.length,maxRows);
 const count=(key,index)=>{
  failures.set(key,(failures.get(key)||0)+1);
  if(samples.length<maxExamples)samples.push({index,reason:key});
 };
 for(let index=0;index<total;index++){
  const item=root.weapons[index];
  try{
   // One row only avoids O(N²) lookup in existing converter.
   const profile=convertCompactRegulation({...root,weapons:[item]},{
    weaponName:item.name,gameVersion,sourceReference});
   converted++;
   const maxLevel=profile.affinities['SOURCE AFFINITY'].upgrades.length-1;
   for(const [caseIndex,s] of scenariosFor(maxLevel).entries()){
    try{
     const raw=calculateRawV117Reference(root,item,s.stats,s);
     const current=calculateAr(profile,s.stats,{upgrade:s.upgrade,twoHanded:s.twoHanded});
     compared++;
     const equal=current.total===raw.total&&
      current.perElement.length===raw.parts.length&&
      current.effectiveStats.str===raw.actualStrength&&
      current.perElement.every((p,j)=>p.element===raw.parts[j].element&&
        Math.abs(p.raw-raw.parts[j].raw)<0.000001);
     if(!equal){mismatched++;count('arithmetic-mismatch-case-'+caseIndex,index);}
    }catch(error){
     unsupported++;count('reference-case-error-'+caseIndex,index);
    }
   }
  }catch(error){count('converter-failure',index);}
  if(onProgress&&((index+1)%100===0||index===total-1))
   onProgress({processed:index+1,total});
 }
 return {schemaVersion:1,auditType:'RAW-TO-CONVERTED FORMULA PARITY — NOT GAME VALIDATION',
  gameVersion,totalRows:total,scenarioCount:PARITY_SCENARIO_LABELS.length,
  scenarioLabels:PARITY_SCENARIO_LABELS,converted,compared,mismatched,unsupported,
  errorsByReason:Object.fromEntries([...failures].sort((a,b)=>b[1]-a[1])),
  examples:samples,sourceParametersExported:false,
  parityPass:converted===total&&unsupported===0&&mismatched===0,
  gameVerified:false,
  note:'Formula parity only between two implementations using the SAME public community source. Not independent current-patch equipment-menu verification, licensing review, status/spell parity or PvE damage validation.'};
}
