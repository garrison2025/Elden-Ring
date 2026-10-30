import {convertCompactRegulation} from './regulation-import.mjs';
import {DAMAGE_TYPES} from './weapon-ar.mjs';

/**
 * Offline whole-dataset structural audit, without retaining game-derived
 * profiles. This checks convertibility only, not gameplay accuracy or rights.
 * Report deliberately omits all weapon names and parameter values.
 */
const SCAN_LIMIT=50000;
const fail=message=>{throw new RangeError(message);};
function text(value,label,max){
 if(typeof value!=='string'||!value.trim()||value.length>max)fail(label+' must be a nonempty string of at most '+max+' characters.');
 return value.trim();
}
function classify(message){
 const m=String(message);
 if(m.startsWith('Missing scaling graph'))return 'missing-correction-graph';
 if(m.startsWith('Missing attack-element-correction'))return 'missing-element-correction';
 if(m.startsWith('Missing reinforcement'))return 'missing-reinforcement-table';
 if(m.includes('graph')||m.includes('curve')||m.includes('stage'))return 'invalid-correction-graph';
 if(m.includes('upgrade')||m.includes('reinforcement'))return 'invalid-reinforcement-row';
 if(m.includes('base damage')||m.includes('attack')||m.includes('scaling'))return 'invalid-attack-or-scaling';
 return 'invalid-other';
}
function bucketLength(n){
 return n===26?'26 levels':n===11?'11 levels':n===1?'1 level':'other ('+n+')';
}
export function auditCompactRegulation(regulation,{gameVersion,sourceReference,maxExamples=25,onProgress}={}){
 const version=text(gameVersion,'gameVersion',60),source=text(sourceReference,'sourceReference',300);
 if(!regulation||typeof regulation!=='object'||Array.isArray(regulation))fail('Regulation data must be an object.');
 const weapons=regulation.weapons;
 if(!Array.isArray(weapons)||weapons.length<1||weapons.length>SCAN_LIMIT)
  fail('Expected 1 to '+SCAN_LIMIT+' weapon records.');
 if(!Number.isInteger(maxExamples)||maxExamples<0||maxExamples>100)
  fail('maxExamples must be an integer from 0 to 100.');
 if(onProgress!==undefined&&typeof onProgress!=='function')
  fail('onProgress must be a function if supplied.');
 const counts=new Map();
 for(const item of weapons){
  if(item&&typeof item.name==='string')counts.set(item.name,(counts.get(item.name)||0)+1);
 }
 const problems=new Map(),examples=[],types=Object.fromEntries(DAMAGE_TYPES.map(x=>[x,0]));
 const grip={standard:0,paired:0,'forced-two-hand':0},upgradeLevels={};
 const reviewReasons=new Map();
 let convertible=0,blocked=0,duplicateEntries=0,scalingToolEntries=0,statusEntries=0;
 let needsReview=0,partialUpgradeRows=0;
 const reportProblem=(code,index)=>{
  blocked++;
  problems.set(code,(problems.get(code)||0)+1);
  if(examples.length<maxExamples)examples.push({index,code});
 };
 for(let i=0;i<weapons.length;i++){
  if(onProgress&&((i+1)%100===0||i===weapons.length-1))
   onProgress({processed:i+1,total:weapons.length});
  const item=weapons[i];
  if(!item||typeof item.name!=='string'||!item.name.trim()){
   reportProblem('invalid-item-name',i);continue;
  }
  if(counts.get(item.name)>1){
   duplicateEntries++;
   reportProblem('duplicate-exact-name',i);continue;
  }
  try{
   // Restrict converter's search to one record: O(N) list traversal rather
   // than converting N records with an O(N) name scan each (O(N²)).
   const profile=convertCompactRegulation({...regulation,weapons:[item]},
    {weaponName:item.name,gameVersion:version,sourceReference:source});
   const params=profile.affinities['SOURCE AFFINITY'];
   convertible++;
   grip[profile.gripMode??'standard']++;
   for(const [type,value] of Object.entries(params.baseDamage))
    if(value>0)types[type]++;
   const key=bucketLength(params.upgrades.length);
   upgradeLevels[key]=(upgradeLevels[key]||0)+1;
   // Convertible records may still omit important gameplay mechanics.
   const flags=[];
   if(item.sorceryTool===true||item.incantationTool===true){
    scalingToolEntries++;flags.push('spell-tool-formula-not-modeled');
   }
   if(Array.isArray(item.attack)&&item.attack.some(p=>
     Array.isArray(p)&&Number(p[0])>=5&&Number(p[0])<=11)){
    statusEntries++;flags.push('status-buildup-not-modeled');
   }
   if(params.upgrades.length!==11&&params.upgrades.length!==26){
    partialUpgradeRows++;flags.push('incomplete-or-unknown-upgrade-coverage');
   }
   if(flags.length)needsReview++;
   for(const reason of flags)reviewReasons.set(reason,(reviewReasons.get(reason)||0)+1);
  }catch(e){reportProblem(classify(e.message),i);}
 }
 const invalidByReason=Object.fromEntries([...problems].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])));
 return {
  schemaVersion:1,auditType:'RESEARCH STRUCTURE ONLY',gameVersion:version,
  sourceReferenceProvided:source.length>0,
  totals:{records:weapons.length,convertible,blocked,duplicateEntries,uniqueNames:counts.size},
  conversionCoverage:Math.round(convertible/weapons.length*10000)/100,
  invalidByReason,anonymousExamples:examples,
  byGripMode:grip,byReinforcementLength:upgradeLevels,byDamageType:types,
  excludedMechanics:{spellToolEntries:scalingToolEntries,statusEffectEntries:statusEntries},
  scopeReview:{
   needsReview,partialUpgradeRows,limitedModelCandidates:convertible-needsReview,
   limitedModelCoverage:Math.round((convertible-needsReview)/weapons.length*10000)/100,
   byReason:Object.fromEntries([...reviewReasons].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))),
   note:'Heuristic model coverage only; cannot detect every unmodeled game mechanic.'
  },
  candidateStructureComplete:blocked===0,
  candidateModelScopeComplete:blocked===0&&needsReview===0,
  publishable:false,
  releaseBlockers:[
   'This report validates structure/convertibility, NOT formula correctness or official game parity.',
   'Game-derived data distribution rights have not been reviewed or granted by this test.',
   'No independent current-patch in-game golden AR evidence was supplied or reviewed.',
   'Spell catalysts, status buildup and incomplete reinforcement coverage are not production-ready.',
   '100% structural conversion may still require scope review and never authorizes publication.'
  ],
  privacy:'No full weapon names or parameter rows are included in this report; indices are zero-based.'
 };
}
