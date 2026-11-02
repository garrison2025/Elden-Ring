/**
 * Browser-local, bounded EXACT weighted armor optimization.
 * The selected score is our own explicit additive objective:
 *   resistance / Poise: multiplier * reported points;
 *   negation: multiplier * (-ln(1 - per-item reported % / 100)).
 * This is NOT Tarnished.dev's unpublished 13-factor scoring function.
 * Bounds on negation are applied to the combined (multiplicative) percentage.
 * Strict equipment thresholds, locks, empty slots and excludes are honored.
 * Weighted no-extra-bound runs use an exact weight-indexed DP. Constrained
 * multi-attribute runs use exact branch-and-bound; NEVER return an
 * approximation if the explicit state budget is exceeded.
 */
import {ARMOR_METRICS} from './armor-source-optin.mjs';
import {restrictedArmorGroups,ARMOR_RESTRICTABLE_SLOTS} from './armor-slot-restrictions.mjs';
import {loadTier} from './core.mjs';
const fail=msg=>{throw new RangeError(msg)};
const keys=Object.keys(ARMOR_METRICS);
const asNumber=(v,name,lo,hi)=>{
 if((typeof v!=='number'&&typeof v!=='string')||
    typeof v==='string'&&!/^-?(?:\d+(?:\.\d{1,3})?|\.\d{1,3})$/.test(v.trim()))
  fail(name+' must be a decimal with at most 3 places.');
 const n=Number(v);
 if(!Number.isFinite(n)||n<lo||n>hi)fail(name+' is outside the permitted range.');
 return n;
};
const wu=n=>Math.round(n*1000);
const sign=p=>p.map(x=>x?.id??'').join('|');
const rounded=v=>Math.round(v*1e6)/1e6;
const transform=(v,key)=>ARMOR_METRICS[key].kind==='negation'?-Math.log1p(-v/100):v;
const untransform=(v,key)=>ARMOR_METRICS[key].kind==='negation'?100*(-Math.expm1(-v)):v;
const better=(a,b)=>!b||a.score>b.score+1e-10||
 Math.abs(a.score-b.score)<=1e-10&&
 (a.weight<b.weight||a.weight===b.weight&&sign(a.pieces)<sign(b.pieces));

export function weightedVerifiedArmorSubset(rows,activeKeys){
 if(!Array.isArray(rows)||!Array.isArray(activeKeys)||activeKeys.some(k=>!Object.hasOwn(ARMOR_METRICS,k)))
  fail('Need real armor rows and known active metric names.');
 const accepted=[],excluded=[];
 for(const x of rows){
  const p=x?.siteDirectFields;
  const valid=!!(p?.weight&&p?.poise&&Number.isFinite(x.weight)&&Number.isInteger(x.poise))&&
    activeKeys.every(k=>!!p?.[k]&&Number.isFinite(k==='poise'?x.poise:x.metrics?.[k]));
  (valid?accepted:excluded).push(x);
 }
 return {accepted,excluded,proof:'all active numeric fields individually evidenced in Tarnished.dev v1.17; no equipment effects or joint optimiser parity'};
}

export function optimizeWeightedArmor(rows,{
 maxEquipLoad,reservedWeight=0,tier='medium',minPoise=0,
 weights={},minimums={},maximums={},excludedIds=[],lockedIds={},disabledSlots=[],
 maxNodes=1500000,topK=1
}={}){
 if(!Array.isArray(rows)||!rows.length||rows.length>2000)fail('Armor source rows must be 1–2000.');
 if(!weights||typeof weights!=='object'||Array.isArray(weights)||
  !minimums||typeof minimums!=='object'||Array.isArray(minimums)||
  !maximums||typeof maximums!=='object'||Array.isArray(maximums))
  fail('Malformed weighted armor controls.');
 for(const obj of [weights,minimums,maximums])
  if(Object.keys(obj).some(k=>!keys.includes(k)))fail('Unknown weighted metric field.');
 const parsedWeights={},bounds={},active=[];
 for(const key of keys){
  parsedWeights[key]=asNumber(weights[key]??0,key+' multiplier',0,10);
  const rawMin=minimums[key],rawMax=maximums[key];
  const kind=ARMOR_METRICS[key].kind;
  const lo=kind==='negation'?-99:0,hi=kind==='negation'?99.999:4000;
  const min=rawMin===null||rawMin===undefined||rawMin===''?null:
   asNumber(rawMin,key+' minimum',lo,hi);
  const max=rawMax===null||rawMax===undefined||rawMax===''?null:
   asNumber(rawMax,key+' maximum',lo,hi);
  if(min!==null&&max!==null&&min>max)fail('Minimum exceeds maximum for '+key);
  bounds[key]={min,max};if(parsedWeights[key]>0||min!==null||max!==null)active.push(key);
 }
 if(!Number.isInteger(minPoise)||minPoise<0||minPoise>500)
  fail('Minimum combined Poise must be 0–500.');
 if(minPoise>0){
  const b=bounds.poise;
  b.min=Math.max(b.min??0,minPoise);
  if(b.max!==null&&b.max<b.min)fail('Poise minimum exceeds maximum.');
  if(!active.includes('poise'))active.push('poise');
 }
 if(!active.length||!keys.some(k=>parsedWeights[k]>0))fail('Select at least one positive objective multiplier.');
 const max=asNumber(maxEquipLoad,'Max equip load',.001,999);
 const reserved=asNumber(reservedWeight,'Reserved gear weight',0,999);
 if(!['light','medium','heavy'].includes(tier))fail('Unsupported roll tier.');
 if(!Array.isArray(excludedIds)||excludedIds.length>2000||
  excludedIds.some(s=>typeof s!=='string'||s.length>80))
  fail('Malformed exact armor exclusions.');
 if(!Number.isInteger(maxNodes)||maxNodes<1||maxNodes>3000000)
  fail('Invalid exact-search node budget.');
 if(!Number.isInteger(topK)||topK<1||topK>5)
  fail('Exact weighted ranking supports 1–5 results only.');
 const cap=Math.ceil((max*(tier==='light'?.3:tier==='medium'?.7:1)-reserved)*1000-1e-9)-1;
 const seen=new Set(),excluded=new Set(excludedIds),valid=[];let missing=0;
 for(const x of rows){
  if(!x||typeof x.id!=='string'||!x.id||seen.has(x.id)||typeof x.name!=='string'||
    !ARMOR_RESTRICTABLE_SLOTS.includes(x.slot)||!Number.isFinite(x.weight)||
    x.weight<0||x.weight>100||Math.abs(wu(x.weight)/1000-x.weight)>1e-9)
   fail('Malformed or duplicate source item.');
  seen.add(x.id);
  if(excluded.has(x.id))continue;
  let ok=true;
  for(const key of active){
   const n=key==='poise'?x.poise:x.metrics?.[key];
   if(!Number.isFinite(n)||(ARMOR_METRICS[key].kind==='resistance'?
    (!Number.isInteger(n)||n<0||n>800):(n< -99||n>99))){
    ok=false;break;
   }
  }
  if(ok)valid.push(x);else missing++;
 }
 const grouped=restrictedArmorGroups(valid,rows,{lockedIds,disabledSlots,excludedIds});
 const groups=ARMOR_RESTRICTABLE_SLOTS.map(slot=>grouped[slot]);
 if(cap<0)return {status:'no-solution',reason:'Reserved weight already reaches the strict roll tier.',combination:null,missingMetricExcluded:missing,activeMetrics:active};
 const pieceScores=new WeakMap(),pieceValues=new WeakMap();
 for(const piece of valid){
  const vals=Object.fromEntries(active.map(k=>[k,transform(k==='poise'?piece.poise:piece.metrics[k],k)]));
  pieceValues.set(piece,vals);
  pieceScores.set(piece,active.reduce((sum,k)=>sum+parsedWeights[k]*vals[k],0));
 }
 const ps=x=>x?pieceScores.get(x):0;
 const pv=(x,key)=>x?pieceValues.get(x)[key]:0;
 const constraints=active.filter(k=>bounds[k].min!==null||bounds[k].max!==null);
 const converted=Object.fromEntries(constraints.map(k=>[k,{
  min:bounds[k].min===null?-Infinity:transform(bounds[k].min,k),
  max:bounds[k].max===null?Infinity:transform(bounds[k].max,k)
 }]));
 const stats={evaluatedNodes:0,algorithm:constraints.length?'exact-bounded-branch-and-bound':'exact-weight-dp'};
 let best=null;
 // A discarded prefix at the SAME integer weight cannot enter the global
 // top K under additive scores and identical future slot options. Retaining
 // K paths per exact weight is therefore exact in the unbounded DP case.
 const rankCompare=(a,b)=>{
  if(Math.abs(a.score-b.score)>1e-10)return b.score-a.score;
  if(a.weight!==b.weight)return a.weight-b.weight;
  const x=sign(a.pieces),y=sign(b.pieces);
  return x<y?-1:x>y?1:0;
 };
 const winners=[];
 const offer=candidate=>{
  if(winners.some(x=>sign(x.pieces)===sign(candidate.pieces)))return;
  winners.push(candidate);winners.sort(rankCompare);
  if(winners.length>topK)winners.length=topK;
  best=winners[0];
 };
 if(!constraints.length){
  let dp=new Map([[0,[{score:0,weight:0,pieces:[]}]]]);
  for(const options of groups){
   const next=new Map();
   for(const paths of dp.values())for(const row of paths)for(const item of options){
    const w=row.weight+wu(item?.weight??0);
    if(w>cap)continue;
    const candidate={weight:w,score:row.score+ps(item),pieces:[...row.pieces,item]};
    const shortlist=next.get(w)??[];
    shortlist.push(candidate);shortlist.sort(rankCompare);
    if(shortlist.length>topK)shortlist.length=topK;
    next.set(w,shortlist);
   }
   if(next.size*topK>maxNodes)fail('Exact weighted DP exceeded browser memory budget; no approximate result.');
   dp=next;
  }
  for(const paths of dp.values())for(const row of paths)offer(row);
  stats.evaluatedNodes=[...dp.values()].reduce((n,x)=>n+x.length,0);
 }else{
  const options=groups.map(xs=>xs.map(x=>({item:x,w:wu(x?.weight??0),score:ps(x)}))
   .sort((a,b)=>b.score-a.score||a.w-b.w||String(a.item?.id??'').localeCompare(String(b.item?.id??''))));
  const tailScore=Array(5).fill(0),minTail={},maxTail={};
  for(const key of constraints){
   minTail[key]=Array(5).fill(0);maxTail[key]=Array(5).fill(0);
  }
  for(let i=3;i>=0;i--){
   tailScore[i]=tailScore[i+1]+Math.max(...options[i].map(o=>o.score));
   for(const key of constraints){
    minTail[key][i]=minTail[key][i+1]+Math.min(...options[i].map(o=>pv(o.item,key)));
    maxTail[key][i]=maxTail[key][i+1]+Math.max(...options[i].map(o=>pv(o.item,key)));
   }
  }
  const visit=(i,used,score,pieces,values)=>{
   if(++stats.evaluatedNodes>maxNodes)
    fail('Exact multi-bound search exceeded '+maxNodes+' states; refine locked/excluded slots or constraints. No approximate result.');
   // Prune by the WORST retained winner only when K distinct complete
   // solutions already exist; pruning by top-one would lose ranks 2–5.
   if(used>cap||winners.length===topK&&
      score+tailScore[i]<winners[winners.length-1].score-1e-10)return;
   for(const key of constraints){
    const val=values[key]??0;
    if(val+maxTail[key][i]<converted[key].min-1e-10||
       val+minTail[key][i]>converted[key].max+1e-10)return;
   }
   if(i===4){
    const candidate={score,weight:used,pieces:[...pieces]};
    offer(candidate);
    return;
   }
   for(const o of options[i]){
    const w=used+o.w;
    if(w>cap)continue;
    const next={...values};
    for(const key of constraints)next[key]=(next[key]??0)+pv(o.item,key);
    visit(i+1,w,score+o.score,[...pieces,o.item],next);
   }
  };
  visit(0,0,0,[],{});
 }
 if(!best)return{status:'no-solution',reason:'No complete four-slot set meets ALL selected metric bounds and the strict roll cap.',
  combination:null,missingMetricExcluded:missing,activeMetrics:active,...stats};
 const ranked=winners.map((row,index)=>({
  rank:index+1,score:rounded(row.score),weight:row.weight/1000,
  poise:row.pieces.every(p=>!p||Number.isInteger(p.poise))?
   row.pieces.reduce((sum,p)=>sum+(p?.poise??0),0):null,
  combination:row.pieces.map((piece,i)=>({
   id:piece?.id??null,name:piece?.name??'Empty slot',
   slot:ARMOR_RESTRICTABLE_SLOTS[i],weight:piece?.weight??0,
   poise:Number.isInteger(piece?.poise)?piece.poise:piece?null:0
  }))
 }));
 const values={};
 for(const key of active){
  let total=0;
  for(const item of best.pieces)total+=pv(item,key);
  values[key]=rounded(untransform(total,key));
 }
 const items=best.pieces.map((item,i)=>item?{
  id:item.id,name:item.name,slot:ARMOR_RESTRICTABLE_SLOTS[i],weight:item.weight,
  poise:Number.isInteger(item.poise)?item.poise:null,metricValue:rounded(ps(item))
 }:{id:null,name:'Empty slot',slot:ARMOR_RESTRICTABLE_SLOTS[i],
   weight:0,poise:0,metricValue:0});
 const armorWeight=best.weight/1000,totalWeight=armorWeight+reserved;
 return {
  status:'optimized-weighted-source-reference',metric:'weighted',
  metricLabel:'Weighted 13-attribute score',metricUnit:'score',
  metricValue:rounded(best.score),metricTotals:values,activeMetrics:active,
  bounds,weights:parsedWeights,armorWeight,totalWeight,maxEquipLoad:max,
  rollTier:loadTier(totalWeight,max).tier,targetTier:tier,
  poise:items.every(x=>x.poise!==null)?items.reduce((s,x)=>s+x.poise,0):null,
  combination:items,ranked,referenceRankingVerified:false,
  missingMetricExcluded:missing,
  explicitExcluded:excludedIds.length,evaluatedRows:rows.length,
  stages:[{slot:'Weighted',stateCount:stats.evaluatedNodes}],...stats,
  sourceVerified:false,
  caveat:'Independent exact weighted community-source objective, NOT the unpublished Tarnished.dev v1.17 scoring implementation. Directly verified source fields only when separately eligible. No equipment passive/active effects.'
 };
}
