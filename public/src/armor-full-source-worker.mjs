import {optimizePinnedArmorPoiseTopFive} from './armor-top-five-poise.mjs';
import {optimizePinnedArmorMetric} from './armor-source-metric-optimizer.mjs';
import {optimizeWeightedArmor} from './armor-weighted-optimizer.mjs';
self.onmessage=event=>{
 const msg=event.data||{};
 if(msg.op!=='optimize')return;
 try{
  const result=msg.options?.metric==='weighted'?
   optimizeWeightedArmor(msg.armors,msg.options):optimizePinnedArmorMetric(msg.armors,msg.options);
  const topFive=msg.options?.metric==='weighted'&&result.ranked?
   {ranked:result.ranked,metric:'weighted',referenceRankingVerified:false}:
   msg.options?.metric==='poise'&&msg.options?.includeTopFive?
    optimizePinnedArmorPoiseTopFive(msg.armors,msg.options):null;
  self.postMessage({op:'result',requestId:msg.requestId,result,topFive});
 }catch(error){
  self.postMessage({op:'error',requestId:msg.requestId,
   message:String(error?.message??error).slice(0,250)});
 }
};
