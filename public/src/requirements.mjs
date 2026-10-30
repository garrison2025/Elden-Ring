/**
 * User-supplied requirements only. No game weapon catalog or copyrighted assets.
 * Standard two-handed Strength is floor(1.5 x actual STR), while other stats
 * remain unchanged. Paired or other exceptional weapons may not receive it.
 */
export const REQUIREMENT_KEYS=Object.freeze(['str','dex','int','fai','arc']);
export const REQUIREMENT_LABELS=Object.freeze(['Strength','Dexterity','Intelligence','Faith','Arcane']);
function validArray(raw,label,min){
 if(!Array.isArray(raw)||raw.length!==5)throw new RangeError(label+' must contain exactly five attributes.');
 return raw.map((n,index)=>{
   const value=Number(n);
   if(n===''||n===null||n===undefined||!Number.isInteger(value)||value<min||value>99)
     throw new RangeError(label+' '+REQUIREMENT_LABELS[index]+' must be a whole number from '+min+' to 99.');
   return value;
 });
}
export function effectiveTwoHandStrength(str){
 if(!Number.isInteger(str)||str<1||str>99)throw new RangeError('Strength must be 1–99.');
 return Math.floor(str*1.5);
}
export function minStrengthToTwoHand(requirement){
 if(!Number.isInteger(requirement)||requirement<0||requirement>99)
   throw new RangeError('Strength requirement must be 0–99.');
 return Math.ceil(requirement*2/3);
}
export function compareWeaponRequirements(rawStats,rawRequirements,{applyTwoHandBonus=true}={}){
 if(typeof applyTwoHandBonus!=='boolean')throw new RangeError('Two-hand option must be true or false.');
 const stats=validArray(rawStats,'Character',1);
 const requirements=validArray(rawRequirements,'Weapon requirement',0);
 const assess=(twoHanded)=>{
   const effectiveStrength=twoHanded&&applyTwoHandBonus?effectiveTwoHandStrength(stats[0]):stats[0];
   const effective=[effectiveStrength,...stats.slice(1)];
   const neededRaw=requirements.map((v,i)=>i===0&&twoHanded&&applyTwoHandBonus?minStrengthToTwoHand(v):v);
   const missing=neededRaw.map((required,i)=>Math.max(0,required-stats[i]));
   return {
     twoHanded, effectiveStrength, effectiveStats:effective, missing, neededRaw,
     totalMissing:missing.reduce((sum,n)=>sum+n,0),
     canWield:missing.every(n=>n===0),
     rows:requirements.map((required,i)=>({
       key:REQUIREMENT_KEYS[i],label:REQUIREMENT_LABELS[i],
       current:stats[i],required,effective:effective[i],minimumRaw:neededRaw[i],missing:missing[i],
       meets:missing[i]===0
     }))
   };
 };
 return {stats,requirements,applyTwoHandBonus,oneHanded:assess(false),twoHanded:assess(true),
   caution:'Attribute requirements only. Does not calculate AR, affinity, unique grip behavior, buffs or special abilities.'};
}
