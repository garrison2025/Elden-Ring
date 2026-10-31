/**
 * Exact two-constraint 4-slot DP: maximize a monotone additive utility with
 * a strict equipment-weight cap and a minimum additive Poise.
 *
 * For each weight and capped-Poise combination keep the best objective.
 * Capping Poise at the requested minimum is exact: additional Poise above
 * the threshold has no bearing on either feasibility or objective.
 * Damage negation can use -log(1 - pct/100) as its additive utility;
 * the caller converts that back to a combined source percentage.
 *
 * This remains browser-local; fail closed rather than silently applying
 * any approximation when the input would exceed the explicit memory cap.
 */
const fail=m=>{throw new RangeError(m)};
const SLOTS=['Head','Chest','Arms','Legs'];
const weightUnits=w=>Math.round(w*1000);
const signature=p=>p.map(x=>x?.id??'').join('|');
const better=(a,b)=>!b||a.value>b.value+1e-12||
 Math.abs(a.value-b.value)<=1e-12&&signature(a.pieces)<signature(b.pieces);
export function optimizeArmorPoiseConstrainedDP(groups,{
 maxArmorUnits,minPoise,metric,kind,maxStates=750000
}={}){
 if(!Array.isArray(groups)||groups.length!==4||
  !Number.isSafeInteger(maxArmorUnits)||maxArmorUnits<0||
  !Number.isInteger(minPoise)||minPoise<1||minPoise>500||
  !Number.isInteger(maxStates)||maxStates<1||maxStates>1000000||
  !['negation','resistance'].includes(kind)||typeof metric!=='string')
  fail('Unsupported exact Poise-constrained armor search.');
 const radix=minPoise+1;
 const unitValue=piece=>{
  if(!piece)return 0;
  const v=piece.metrics?.[metric];
  if(!Number.isFinite(v)||v<0||v>(kind==='negation'?99:800))
   fail('Objective source value is unavailable or malformed.');
  return kind==='negation'?-Math.log1p(-v/100):v;
 };
 // key = weight in 0.001 units * radix + min(requested Poise, actual Poise)
 let states=new Map([[0,{value:0,poise:0,pieces:[]}]]);
 const stages=[];
 for(let si=0;si<4;si++){
  if(!Array.isArray(groups[si])||groups[si].some(p=>p&&
   (p.slot!==SLOTS[si]||!Number.isFinite(p.weight)||
    p.weight<0||!Number.isInteger(p.poise)||p.poise<0||p.poise>800)))
   fail('Expected valid source armor records grouped by four slots.');
  const next=new Map(),candidates=groups[si];
  for(const [k,state] of states){
   const usedWeight=Math.floor(k/radix);
   for(const piece of candidates){
    const weight=usedWeight+weightUnits(piece?.weight??0);
    if(weight>maxArmorUnits)continue;
    const poise=Math.min(minPoise,state.poise+(piece?.poise??0));
    const key=weight*radix+poise;
    const candidate={
     value:state.value+unitValue(piece),
     poise,pieces:[...state.pieces,piece]
    };
    if(better(candidate,next.get(key)))next.set(key,candidate);
   }
  }
  if(next.size>maxStates)
   fail('Exact Poise-constrained search exceeds the browser memory budget; '+
    'narrow the armor list or select a smaller maximum equipment load. '+
    'No approximate result is returned.');
  states=next;
  stages.push({slot:SLOTS[si],candidates:candidates.length,stateCount:states.size});
 }
 let best=null;
 for(const [key,state] of states){
  if(state.poise<minPoise)continue;
  const armorUnits=Math.floor(key/radix);
  if(!best||state.value>best.value+1e-12||
   Math.abs(state.value-best.value)<=1e-12&&(
    armorUnits<best.armorUnits||
    armorUnits===best.armorUnits&&signature(state.pieces)<signature(best.pieces)))
   best={...state,armorUnits};
 }
 return {best,stages,method:'exact-weight-and-capped-poise-dp'};
}
