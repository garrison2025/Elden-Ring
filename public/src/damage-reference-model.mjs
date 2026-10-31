/**
 * Manual damage preview based on the documented Elden Ring defense-ratio
 * formula. All attack, enemy defense/negation, motion value and attack-rate
 * inputs come from the user or an explicitly chosen AR calculator handoff.
 * This is a transparent community-reported formula, NOT a same-input numeric
 * Tarnished.dev v1.17 website observation or a claim of all game modifiers.
 *
 * Reference (ratio breakpoints and equations):
 * https://steamcommunity.com/sharedfiles/filedetails/?id=3476225321
 * https://eldenring.wiki.gg/wiki/Stats_and_Attributes
 */
export const DAMAGE_TYPES=Object.freeze(['physical','magic','fire','lightning','holy']);
export const ENEMY_TYPES=Object.freeze(['physical','strike','slash','pierce','magic','fire','lightning','holy']);
const fail=m=>{throw new RangeError(m)};
const number=(raw,label,min,max)=>{
 if((typeof raw!=='number'&&typeof raw!=='string')||
  typeof raw==='string'&&!/^(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(raw.trim()))
  fail(label+' must be a nonnegative decimal with at most 3 places.');
 const n=Number(raw);
 if(!Number.isFinite(n)||n<min||n>max||
  Math.abs(Math.round(n*1000)/1000-n)>1e-9)
  fail(label+' must be between '+min+' and '+max+'.');
 return n;
};
const negation=(raw,label)=>{
 if((typeof raw!=='number'&&typeof raw!=='string')||
  typeof raw==='string'&&!/^-?(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(raw.trim()))
  fail(label+' must be a decimal between -100% and 100%.');
 const n=Number(raw);
 if(!Number.isFinite(n)||n< -100||n>100||
  Math.abs(Math.round(n*1000)/1000-n)>1e-9)
  fail(label+' must be between -100% and 100%.');
 return n;
};
const round=n=>Math.round(n*1e6)/1e6;
export function defenseMultiplier(attack,defense){
 // Internal computed AR×motion×buff is often fractional beyond three places.
 // Validate the resulting finite NUMBER without pretending it is an input field.
 if(typeof attack!=='number'||!Number.isFinite(attack)||
  attack<0||attack>1000000||
  typeof defense!=='number'||!Number.isFinite(defense)||
  defense<0||defense>100000)
  fail('Defense formula requires finite, nonnegative attack and defense.');
 const a=attack,d=defense;
 if(a===0)return 0;
 const ratio=d===0?Infinity:a/d;
 if(ratio<0.125)return 0.1;
 if(ratio<1)return 0.1+(ratio-.125)**2/2.552;
 if(ratio<2.5)return 0.7-(2.5-ratio)**2/7.5;
 if(ratio<8)return 0.9-(8-ratio)**2/151.25;
 return 0.9;
}
export function calculateManualDamage({
 attack,physicalType='physical',enemy,motionValue=100,
 damageMultiplier=1,attacksPerSecond=1
}={}){
 if(!attack||typeof attack!=='object'||Array.isArray(attack)||
  !enemy||typeof enemy!=='object'||Array.isArray(enemy))
  fail('Provide five Attack Rating channels and eight enemy defenses/negations.');
 if(!['physical','strike','slash','pierce'].includes(physicalType))
  fail('Select the actual physical damage type of the attack.');
 const mv=number(motionValue,'Attack motion value',0,500);
 const buff=number(damageMultiplier,'User-entered damage multiplier',0,5);
 const aps=number(attacksPerSecond,'Attacks per second',0.001,20);
 const out=[];
 for(const type of DAMAGE_TYPES){
  const v=number(attack[type],'Attack Rating: '+type,0,10000);
  const defenseType=type==='physical'?physicalType:type;
  const target=enemy[defenseType];
  if(!target||typeof target!=='object'||Array.isArray(target))
   fail('Missing target defense/negation for '+defenseType+'.');
  const def=number(target.defense,'Enemy '+defenseType+' defense',0,100000);
  const neg=negation(target.negation,'Enemy '+defenseType+' damage negation');
  // Separate per damage type: do not apply enemy defense once to the sum.
  const effectiveAttack=v*mv/100*buff;
  const throughDefense=effectiveAttack*defenseMultiplier(effectiveAttack,def);
  const afterNegation=throughDefense*(1-neg/100);
  out.push({type,defenseType,attackRating:v,effectiveAttack:round(effectiveAttack),
   enemyDefense:def,enemyNegation:neg,defenseMultiplier:round(
    defenseMultiplier(effectiveAttack,def)),
   afterDefense:round(throughDefense),afterNegation:round(afterNegation)});
 }
 const beforeDefense=out.reduce((s,p)=>s+p.effectiveAttack,0);
 const total=out.reduce((s,p)=>s+p.afterNegation,0);
 return {
  status:'community-formula-estimate',beforeDefense:round(beforeDefense),
  perType:out,damagePerHit:round(total),
  attacksPerSecond:aps,estimatedDps:round(total*aps),
  physicalType,motionValue:mv,damageMultiplier:buff,
  caveat:'Community defense-ratio approximation from user-entered AR/MV/enemy values. '+
   'Not Tarnished.dev v1.17 same-input numerical parity or an enemy database. '+
   'No PvP multipliers, attack-specific motion values, status procs, weakspots, '+
   'counter hits, Great Runes, talisman conditionals, buffs stacking, hitboxes or game-rounding stages.'
 };
}
