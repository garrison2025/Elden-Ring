import {optimizePinnedArmorMetric} from './armor-source-metric-optimizer.mjs';
self.onmessage=event=>{
 const msg=event.data||{};
 if(msg.op!=='optimize')return;
 try{
  self.postMessage({op:'result',requestId:msg.requestId,
   result:optimizePinnedArmorMetric(msg.armors,msg.options)});
 }catch(error){
  self.postMessage({op:'error',requestId:msg.requestId,
   message:String(error?.message??error).slice(0,250)});
 }
};
