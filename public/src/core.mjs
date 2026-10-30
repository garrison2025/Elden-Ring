/** Standalone formulas, no fetched data and no copyrighted art. */
export const STAT_KEYS = ['vig','mnd','end','str','dex','int','fai','arc'];
export const STATS = ['Vigor','Mind','Endurance','Strength','Dexterity','Intelligence','Faith','Arcane'];
export const CLASSES = [
 ['Wretch',1,10,10,10,10,10,10,10,10,false],
 ['Bandit',5,10,11,10,9,13,9,8,14,false],
 ['Astrologer',6,9,15,9,8,12,16,7,9,false],
 ['Hero',7,14,9,12,16,9,7,8,11,false],
 ['Prophet',7,10,14,8,11,10,7,16,10,false],
 ['Idus Knight',7,10,12,11,13,15,8,11,6,true],
 ['Warrior',8,11,12,11,10,16,10,8,9,false],
 ['Prisoner',9,11,12,11,11,14,14,6,9,false],
 ['Samurai',9,12,11,13,12,15,9,8,8,false],
 ['Vagabond',9,15,10,11,14,13,9,9,7,false],
 ['Confessor',10,10,13,10,12,12,9,14,9,false],
 ['Heavy Knight',10,14,8,17,15,11,7,8,9,true]
].map(([name,level,...rest])=>({name,level,stats:rest.slice(0,8),dlc:rest[8]}));

export function requireLevel(n){const v=Number(n);if(!Number.isInteger(v)||v<1||v>713)throw new RangeError('Character level must be an integer from 1 to 713.');return v}
export function runeCostForLevel(level){
  const L=requireLevel(level);if(L===713) return 0;
  // Cost paid to advance from character level L to L+1.
  const coefficient=0.1 + Math.max(0,L-11)*0.02;
  return Math.floor(coefficient*(L+81)**2 + 1 + 1e-6);
}
export function runeRange(start,target){
  const from=requireLevel(start),to=requireLevel(target);
  if(to<from)throw new RangeError('Target level must not be below current level.');
  let result=0;for(let n=from;n<to;n++)result+=runeCostForLevel(n);return result;
}
export function targetFromRunes(start,budget){
  let level=requireLevel(start),remaining=Number(budget);
  if(!Number.isSafeInteger(remaining)||remaining<0)throw new RangeError('Runes must be a non-negative whole number.');
  while(level<713&&remaining>=runeCostForLevel(level)){remaining-=runeCostForLevel(level);level++}
  return {level,remaining};
}
export function classForName(name){return CLASSES.find(c=>c.name===name)||CLASSES[0]}
export function validateStats(raw,cls){
  if(!Array.isArray(raw)||raw.length!==8)throw new RangeError('Eight attributes are required.');
  return raw.map((value,i)=>{const n=Number(value);if(!Number.isInteger(n)||n<cls.stats[i]||n>99)throw new RangeError(`${STATS[i]} must be ${cls.stats[i]}–99 for ${cls.name}.`);return n});
}
export function buildLevel(cls,stats){const values=validateStats(stats,cls);return cls.level+values.reduce((sum,v,i)=>sum+v-cls.stats[i],0)}
export function optimizeClasses(target,allowDlc=true){
  if(!Array.isArray(target)||target.length!==8||target.some(x=>!Number.isInteger(Number(x))||Number(x)<1||Number(x)>99))throw new RangeError('Target stats must be integers from 1 to 99.');
  return CLASSES.filter(c=>allowDlc||!c.dlc).map(c=>({className:c.name,dlc:c.dlc,level:c.level+c.stats.reduce((sum,v,i)=>sum+Math.max(0,Number(target[i])-v),0),stats:c.stats})).sort((a,b)=>a.level-b.level||a.className.localeCompare(b.className));
}
export function loadTier(weight,maxWeight){
 const w=Number(weight),max=Number(maxWeight);if(!Number.isFinite(w)||!Number.isFinite(max)||w<0||max<=0||w>100000||max>100000)throw new RangeError('Enter non-negative weight and a positive maximum load.');
 const pct=100*w/max;
 return {percent:pct,tier:pct<30?'Light':pct<70?'Medium':pct<100?'Heavy':'Overloaded',
 // The game treats exactly 30/70/100 percent as the heavier tier.
  lightBelow:0.3*max,mediumBelow:0.7*max,heavyBelow:1*max,
  lightMargin:0.3*max-w,mediumMargin:0.7*max-w};
}
export function commas(n){return new Intl.NumberFormat('en-US').format(n)}

/** Number of whole farming runs needed, using only a user-supplied yield per run. */
export function farmingRunsNeeded(from,to,budget,perRun){
  const spent=runeRange(from,to);
  if(!Number.isSafeInteger(budget)||budget<0)throw new RangeError('Available runes must be a non-negative whole number.');
  if(!Number.isSafeInteger(perRun)||perRun<=0)throw new RangeError('Runes per run must be a positive whole number.');
  return Math.ceil(Math.max(0,spent-budget)/perRun);
}
/** Shared links intentionally contain only eight bounded numeric attributes. */
export function parseSharedStats(str){
  if(typeof str!=='string'||str.length>100)return null;
  const parts=str.split(',');
  if(parts.length!==8||parts.some(s=>!/^\d{1,2}$/.test(s)))return null;
  const values=parts.map(Number);
  return values.every(n=>n>=1&&n<=99)?values:null;
}


/**
 * Compare an existing character's attribute allocation with a proposed respec.
 * Respec preserves the starting origin and total character level. Neither gear
 * effects nor consumable availability is modeled.
 */
export function compareRespec(origin,original,proposed){
  if(!origin||!CLASSES.some(c=>c.name===origin.name))throw new RangeError('Choose a valid starting class.');
  const before=validateStats(original,origin),after=validateStats(proposed,origin);
  const currentLevel=buildLevel(origin,before),plannedLevel=buildLevel(origin,after);
  return {
    currentLevel,plannedLevel,
    remainingPoints:currentLevel-plannedLevel,
    changes:after.map((value,i)=>value-before[i]),
    valid:plannedLevel===currentLevel,
    withinBudget:plannedLevel<=currentLevel
  };
}
