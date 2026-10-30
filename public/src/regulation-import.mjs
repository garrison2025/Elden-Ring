import {POWER_STATS,DAMAGE_TYPES,validateArProfile} from './weapon-ar.mjs';

/**
 * Research-only, standalone converter for an independently obtained *JSON*
 * regulation object with weapon/reinforce/correction tables. The repository
 * never downloads, bundles, or redistributes data from the game or third parties.
 * Its output is always manual-unverified, never a game-verified profile.
 * Compatible conceptually with compact regulationData encoding from
 * ThomasJClark/elden-ring-weapon-calculator; no source code is copied.
 */
const attrs=POWER_STATS, types=DAMAGE_TYPES;
const err=x=>{throw new RangeError(x)};
function object(v,key){if(!v||typeof v!=='object'||Array.isArray(v))err(key+' must be an object.');return v}
function finite(v,key,low=0,high=10000){if(typeof v!=='number'||!Number.isFinite(v)||v<low||v>high)err(key+' out of allowed range.');return v}
function short(v,key,max=120){if(typeof v!=='string'||!v.trim()||v.length>max)err(key+' must be a short nonempty string.');return v}
function choose(records,id,label){
 const out=Object.hasOwn(records,String(id))?records[String(id)]:undefined;
 if(out===undefined||out===null)err('Missing '+label+' table '+id);
 return out;
}
function correctionCurve(stages){
 if(!Array.isArray(stages)||stages.length<2||stages.length>50)err('Correction graph needs 2–50 stages.');
 const values=new Array(151).fill(0);
 let end=0;
 for(let i=1;i<stages.length;i++){
  const prev=object(stages[i-1],'stage '+(i-1)),next=object(stages[i],'stage '+i);
  for(const stage of [prev,next]){
   finite(stage.maxVal,'stage maxVal',0,150);
   finite(stage.maxGrowVal,'stage maxGrowVal',0,10);
   finite(stage.adjPt,'stage exponent',-20,20);
  }
  if(next.maxVal<=prev.maxVal)err('Correction graph stages must have strictly increasing thresholds.');
  const from=i===1?1:prev.maxVal+1;
  const through=i===stages.length-1?148:next.maxVal;
  if(!Number.isInteger(from)||!Number.isInteger(through))err('Graph stage cutoffs must be integers.');
  for(let n=from;n<=through;n++){
   let t=Math.min(1,Math.max(0,(n-prev.maxVal)/(next.maxVal-prev.maxVal)));
   if(prev.adjPt>0)t=Math.pow(t,prev.adjPt);
   else if(prev.adjPt<0)t=1-Math.pow(1-t,-prev.adjPt);
   values[n]=prev.maxGrowVal+(next.maxGrowVal-prev.maxGrowVal)*t;
   finite(values[n],'curve['+n+']',0,10);
  }
  end=Math.max(end,through);
 }
 if(end!==148)err('Correction graph must cover effective STR up to 148.');
 // Values 149–150 are deliberately unused: max character STR is 99 and
 // the standard two-hand effective cap is floor(99*1.5)=148.
 values[149]=values[148];values[150]=values[148];
 return values;
}
function fromPairs(pairs,label,allowed){
 if(!Array.isArray(pairs))err(label+' must be array pairs.');
 const found=Object.create(null),valid=new Set(allowed);
 for(const entry of pairs){
  if(!Array.isArray(entry)||entry.length!==2)err(label+' contains an invalid pair.');
  const key=String(entry[0]);
  if(!valid.has(key))err('Unexpected '+label+' key: '+key);
  if(Object.hasOwn(found,key))err('Duplicate '+label+' key: '+key);
  found[key]=entry[1];
 }
 return found;
}
/** Converts ONE exact weapon/affinity entry to our local unverified AR profile. */
export function convertCompactRegulation(regulation,{weaponName,gameVersion,sourceReference}={}){
 const root=object(regulation,'Regulation data');
 const name=short(weaponName,'weaponName');
 const version=short(gameVersion,'gameVersion',60);
 const source=short(sourceReference,'sourceReference',300);
 if(!Array.isArray(root.weapons)||root.weapons.length===0||root.weapons.length>50000)err('Invalid regulation weapons array.');
 for(const k of ['calcCorrectGraphs','attackElementCorrects','reinforceTypes'])object(root[k],k);
 const selected=root.weapons.filter(w=>w&&w.name===name);
 if(selected.length!==1)err('An exact, unique weapon/affinity name is required; matches: '+selected.length);
 const weapon=selected[0];
 const attack=fromPairs(weapon.attack,'weapon attack',Array.from({length:12},(_,i)=>String(i)));
 const baseScale=fromPairs(weapon.attributeScaling,'weapon attribute scaling',attrs);
 const requirements=object(weapon.requirements??{},'weapon requirements');
 const corrections=object(choose(root.attackElementCorrects,weapon.attackElementCorrectId,'attack-element-correction'),'attack element correction');
 const reinforcement=choose(root.reinforceTypes,weapon.reinforceTypeId,'reinforcement');
 if(!Array.isArray(reinforcement)||reinforcement.length<1||reinforcement.length>26)err('Invalid reinforcement table length.');
 const graphIds=weapon.calcCorrectGraphIds??{};
 const baseDamage={},scaling={},curves={},rules={};
 let anyAttack=false;
 for(let d=0;d<5;d++){
  const key=types[d],base=finite(attack[String(d)]??0,key+' base damage',0,100000);
  baseDamage[key]=base;if(base===0)continue;
  anyAttack=true;
  const graphId=graphIds[String(d)]??0;
  curves[key]=correctionCurve(choose(root.calcCorrectGraphs,graphId,'scaling graph'));
  rules[key]={};
  const elemRules=corrections[String(d)]??{};
  for(const attribute of attrs){
   const value=elemRules[attribute];
   if(value===undefined||value===false||value===null||value===0){
    rules[key][attribute]={enabled:false};continue;
   }
   if(value!==true)finite(value,'override '+key+'/'+attribute,0,100);
   rules[key][attribute]={enabled:true,impactRatio:1,overrideScaling:value===true?null:value};
  }
 }
 if(!anyAttack)err('Selected weapon has no physical/magic/fire/lightning/holy damage.');
 for(const a of attrs)scaling[a]=finite(baseScale[a]??0,'base scaling '+a,0,100);
 const upgrades=reinforcement.map((reinf,level)=>{
  object(reinf,'reinforcement step '+level);
  const attackMult=object(reinf.attack,'reinforcement damage multipliers');
  const attrMult=object(reinf.attributeScaling,'reinforcement scaling multipliers');
  const damageMultipliers={},scalingMultipliers={};
  for(let i=0;i<5;i++){
   const key=types[i];if(baseDamage[key]>0)damageMultipliers[key]=finite(attackMult[String(i)],key+' upgrade +'+level,0,100);
  }
  for(const a of attrs)scalingMultipliers[a]=finite(attrMult[a],'scaling '+a+' upgrade +'+level,0,100);
  return {level,damageMultipliers,scalingMultipliers};
 });
 const gripMode=weapon.paired?'paired':[50,51,53,56].includes(weapon.weaponType)?'forced-two-hand':'standard';
 const profile={
  schemaVersion:1,label:name,gripMode,
  provenance:{status:'manual-unverified',note:'Locally converted parameters; NOT certified against game observations.',gameVersion:version,sourceReference:source},
  requirements:Object.fromEntries(attrs.map(a=>[a,requirements[a]??0])),
  affinities:{'SOURCE AFFINITY':{baseDamage,baseScaling:scaling,correctionCurves:curves,elementScaling:rules,upgrades}}
 };
 validateArProfile(profile);
 return profile;
}
export function listCompactWeaponNames(root){
 object(root,'Regulation data');
 if(!Array.isArray(root.weapons)||root.weapons.length>50000)err('Invalid weapons array.');
 return [...new Set(root.weapons.map(x=>short(x.name,'weapon name',120)))].sort((a,b)=>a.localeCompare(b));
}
