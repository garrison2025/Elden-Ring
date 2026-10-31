/**
 * Exact single-metric optimization over the opt-in, PINNED public armor
 * snapshot. This is a field-wise community SOURCE calculation, not a
 * numeric Tarnished.dev v1.17 UI golden or a redistribution of its dataset.
 * One armor per slot, optional empty slots, strict equip-load threshold.
 *
 * Resistance and poise are additive. Damage negation follows the
 * independent multiplicative combination rule for SOURCE percentages:
 * 100 * (1 - product(1 - individualPct/100)).
 * The source rounds many per-piece fields to whole percentages; therefore
 * the reported combined percentage is a SOURCE MODEL, not exact in-game
 * negation or independently observed Tarnished.dev numerical parity.
 */
import {ARMOR_METRICS} from './armor-source-optin.mjs';
import {ARMOR_OPT_SLOTS,optimizePinnedArmorPoise} from './armor-full-source-optimizer.mjs';
import {loadTier} from './core.mjs';
const fail=s=>{throw new RangeError(s)};
const scale=1000;
const signature=pieces=>pieces.map(x=>x?.id??'').join('|');
function number(raw,label,min,max){
 if((typeof raw!=='string'&&typeof raw!=='number')||
  (typeof raw==='string'&&!/^(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(raw.trim())))
  fail(label+' requires a nonnegative number with no more than 3 decimals.');
 const n=Number(raw);
 if(!Number.isFinite(n)||n<min||n>max)fail(label+' out of range.');
 return n;
}
const units=n=>Math.round(n*scale);
function utility(value,kind){
 if(kind==='resistance')return value;
 // Maximizing log-transformed value is mathematically equivalent to
 // minimizing the combined surviving-damage fraction.
 return -Math.log1p(-value/100);
}
const prefer=(a,b)=>!b||a.value>b.value+1e-12||
 Math.abs(a.value-b.value)<=1e-12&&signature(a.pieces)<signature(b.pieces);
function validateRows(rows,metric,excluded){
 const valid=[],ids=new Set();let missingMetric=0,excludedCount=0;
 for(const item of rows){
  if(!item||typeof item.id!=='string'||!item.id||ids.has(item.id)||
   typeof item.name!=='string'||!item.name.trim()||
   !ARMOR_OPT_SLOTS.includes(item.slot)||!Number.isFinite(item.weight)||
   item.weight<0||item.weight>100||
   Math.abs(units(item.weight)/scale-item.weight)>1e-9)
   fail('Invalid or duplicate source armor item.');
  ids.add(item.id);
  if(excluded.has(item.id)){excludedCount++;continue;}
  const v=item.metrics?.[metric];
  const kind=ARMOR_METRICS[metric].kind;
  if(!Number.isFinite(v)||v<0||v>(kind==='negation'?99:800)||
   (kind==='resistance'&&!Number.isInteger(v))){
   missingMetric++;continue;
  }
  valid.push(item);
 }
 return {valid,missingMetric,excludedCount};
}
export function optimizePinnedArmorMetric(rows,{
 metric='poise',maxEquipLoad,reservedWeight=0,tier='medium',
 minPoise=0,excludedIds=[]
}={}){
 if(!Object.hasOwn(ARMOR_METRICS,metric))fail('Unsupported armor optimization objective.');
 if(!Array.isArray(rows)||rows.length<1||rows.length>2000)
  fail('Pinned armor item rows are required.');
 if(!Array.isArray(excludedIds)||excludedIds.length>2000||
  excludedIds.some(x=>typeof x!=='string'||x.length>80))
  fail('Invalid armor exclusions.');
 const max=number(maxEquipLoad,'Maximum equip load',0.001,999);
 const reserved=number(reservedWeight,'Other equipped weight',0,999);
 if(!['light','medium','heavy'].includes(tier))fail('Unsupported roll tier.');
 if(!Number.isInteger(minPoise)||minPoise<0||minPoise>500)
  fail('Minimum Poise must be an integer from 0 to 500.');
 if(metric==='poise'){
  const result=optimizePinnedArmorPoise(rows,{
   maxEquipLoad:max,reservedWeight:reserved,tier,minPoise,excludedIds
  });
  return {...result,metric,metricLabel:ARMOR_METRICS.poise.label,
   metricValue:result.status==='no-solution'?null:result.poise,
   metricUnit:'points',missingMetricExcluded:result.missingPoiseExcluded,
   combination:result.combination?.map(x=>({...x,metricValue:x.poise}))??null};
 }
 if(minPoise!==0)fail(
  'Set Minimum Poise to 0 for the selected damage-negation/resistance objective; '+
  'multi-constraint exact optimization is not implemented. Choose Poise objective to enforce Minimum Poise.');
 const excluded=new Set(excludedIds);
 const {valid,missingMetric,excludedCount}=validateRows(rows,metric,excluded);
 const factor=tier==='light'?.3:tier==='medium'?.7:1;
 const maxArmorUnits=Math.ceil((max*factor-reserved)*scale-1e-9)-1;
 const meta=ARMOR_METRICS[metric];
 if(maxArmorUnits<0)return {
  status:'no-solution',reason:'Reserved gear reaches the strict load threshold.',
  metric,metricLabel:meta.label,metricValue:null,
  missingMetricExcluded:missingMetric,explicitExcluded:excludedCount,
  combination:null,stages:[],evaluatedRows:rows.length,sourceVerified:false
 };
 const groups=ARMOR_OPT_SLOTS.map(slot=>[
  null,...valid.filter(x=>x.slot===slot).sort((a,b)=>a.id.localeCompare(b.id))
 ]);
 let states=new Map([[0,{value:0,pieces:[]}]]);
 const stages=[];
 for(let si=0;si<ARMOR_OPT_SLOTS.length;si++){
  const next=new Map();
  for(const [weight,state] of states){
   for(const piece of groups[si]){
    const total=weight+units(piece?.weight??0);
    if(total>maxArmorUnits)continue;
    const candidate={value:state.value+(piece?
     utility(piece.metrics[metric],meta.kind):0),
     pieces:[...state.pieces,piece]};
    if(prefer(candidate,next.get(total)))next.set(total,candidate);
   }
  }
  states=next;
  stages.push({slot:ARMOR_OPT_SLOTS[si],candidates:groups[si].length,
   stateCount:states.size});
 }
 let best=null;
 for(const [armorUnits,state] of states){
  if(!best||state.value>best.value+1e-12||
   Math.abs(state.value-best.value)<=1e-12&&(
    armorUnits<best.armorUnits||
    armorUnits===best.armorUnits&&signature(state.pieces)<signature(best.pieces)))
   best={...state,armorUnits};
 }
 if(!best)return {
  status:'no-solution',reason:'No source-supported combination fits the strict weight limit.',
  metric,metricLabel:meta.label,metricValue:null,
  missingMetricExcluded:missingMetric,explicitExcluded:excludedCount,
  combination:null,stages,evaluatedRows:rows.length,sourceVerified:false
 };
 const armorWeight=best.armorUnits/scale;
 const totalWeight=armorWeight+reserved;
 const result=meta.kind==='negation'?
  100*(1-Math.exp(-best.value)):best.value;
 const rounded=Math.round(result*1e6)/1e6;
 const items=best.pieces.map((x,i)=>x?{
  id:x.id,name:x.name,slot:ARMOR_OPT_SLOTS[i],weight:x.weight,
  poise:x.poise??null,metricValue:x.metrics[metric]
 }:{
  id:null,name:'Empty slot',slot:ARMOR_OPT_SLOTS[i],weight:0,
  poise:0,metricValue:0
 });
 const allPoiseKnown=items.every(x=>x.poise!==null);
 return {
  status:'optimized-source-reference',sourceVerified:false,
  metric,metricLabel:meta.label,metricUnit:meta.kind==='negation'?'%':'points',
  metricValue:rounded,sourceFieldAggregation:meta.kind==='negation'?
   'multiplicative source-percentages':'additive source-points',
  // A missing source Poise is unknown, NOT 0.
  poise:allPoiseKnown?items.reduce((a,x)=>a+x.poise,0):null,
  armorWeight,totalWeight,maxEquipLoad:max,
  rollTier:loadTier(totalWeight,max).tier,targetTier:tier,
  combination:items,missingMetricExcluded:missingMetric,
  explicitExcluded:excludedCount,evaluatedRows:rows.length,stages,
  caveat:'Exact single-metric optimum from rounded or missing pinned community source fields. '+
   'NOT independently verified Tarnished.dev v1.17 same-input output; '+
   'does not include active buffs, passive equipment effects or game-client accuracy.'
 };
}
