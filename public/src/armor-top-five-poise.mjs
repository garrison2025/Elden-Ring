/**
 * Bounded EXACT top-five Poise solutions from the locally eligible armor pool.
 * At each exact occupied weight retain the five best partial combinations:
 * any future suffix adds identical weight/Poise to those prefixes, so a
 * discarded lower-ranked prefix cannot enter the final global top five.
 * This computes genuine local alternatives and never claims Tarnished.dev's
 * unpublished rank/tie policy is identical.
 */
import {optimizePinnedArmorPoise,ARMOR_OPT_SLOTS} from './armor-full-source-optimizer.mjs';
import {restrictedArmorGroups} from './armor-slot-restrictions.mjs';
const fail=msg=>{throw new RangeError(msg)};
const sig=parts=>parts.map(x=>x?.id??'').join('|');
const cmp=(a,b)=>b.poise-a.poise||a.weight-b.weight||sig(a.pieces).localeCompare(sig(b.pieces));
const wu=x=>Math.round(x*1000);
export function optimizePinnedArmorPoiseTopFive(rows,options={}){
 const base=optimizePinnedArmorPoise(rows,options);
 if(base.status==='no-solution')return{status:'no-solution',best:base,ranked:[],exact:true};
 const k=options.topK??5;
 if(!Number.isInteger(k)||k<1||k>5)fail('Choose 1–5 exact local rankings.');
 const excluded=new Set(options.excludedIds||[]);
 const eligible=rows.filter(x=>!excluded.has(x.id)&&Number.isInteger(x.poise)&&
  x.poise>=0&&x.poise<=800);
 const g=restrictedArmorGroups(eligible,rows,{
  lockedIds:options.lockedIds||{},disabledSlots:options.disabledSlots||[],
  excludedIds:options.excludedIds||[]
 });
 const groups=ARMOR_OPT_SLOTS.map(slot=>g[slot]);
 const max=Number(options.maxEquipLoad),reserved=Number(options.reservedWeight??0);
 const tier=options.tier??'medium';
 const frac=tier==='light'?.3:tier==='medium'?.7:1;
 const cap=Math.ceil((max*frac-reserved)*1000-1e-9)-1;
 const maxTransitions=options.maxTransitions??16000000;
 if(!Number.isInteger(maxTransitions)||maxTransitions<1||maxTransitions>50000000)
  fail('Invalid exact ranking memory budget');
 let states=new Map([[0,[{weight:0,poise:0,pieces:[]}]]]),transitions=0;
 for(const group of groups){
  const next=new Map();
  for(const [weight,paths] of states){
   for(const old of paths)for(const piece of group){
    if(++transitions>maxTransitions)fail('Top-five exact armor search exceeded the budget; no approximate answer returned.');
    const used=weight+wu(piece?.weight??0);
    if(used>cap)continue;
    const candidate={weight:used,poise:old.poise+(piece?.poise??0),
     pieces:[...old.pieces,piece]};
    const shortlist=next.get(used)||[];
    if(shortlist.some(p=>sig(p.pieces)===sig(candidate.pieces)))continue;
    shortlist.push(candidate);
    shortlist.sort(cmp);
    if(shortlist.length>k)shortlist.length=k;
    next.set(used,shortlist);
   }
  }
  states=next;
 }
 const ranked=[...states.values()].flat().filter(x=>x.poise>=(options.minPoise??0))
  .sort(cmp).slice(0,k).map((r,index)=>({
   rank:index+1,poise:r.poise,weight:r.weight/1000,
   combination:r.pieces.map((p,i)=>({
    id:p?.id??null,name:p?.name??'Empty slot',
    slot:ARMOR_OPT_SLOTS[i],weight:p?.weight??0,poise:p?.poise??0
   }))
  }));
 if(!ranked.length||ranked[0].poise!==base.poise||
  Math.abs(ranked[0].weight-base.armorWeight)>1e-8||
  ranked[0].combination.map(x=>x.id??'').join('|')!==
   base.combination.map(x=>x.id??'').join('|'))
  fail('Exact top-five ranking must agree with the independently tested top-one DP. No contradictory source results published.');
 return {
  status:'exact-local-top-five-poise',best:base,ranked,exact:true,transitions,
  referenceRankingVerified:false,
  note:'All ranked rows are exact under this local maximum-Poise / minimum-weight / lexical tie-break. Tarnished.dev v1.17 uses different tie/ordering and may have a different DLC pool; do not label these as its actual ranked list.'
 };
}
