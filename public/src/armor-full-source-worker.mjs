import {optimizePinnedArmorPoise} from './armor-full-source-optimizer.mjs';
self.onmessage=event=>{
 const msg=event.data||{};
 if(msg.op!=='optimize')return;
 try{
  self.postMessage({op:'result',requestId:msg.requestId,
   result:optimizePinnedArmorPoise(msg.armors,msg.options)});
 }catch(error){
  self.postMessage({op:'error',requestId:msg.requestId,
   message:String(error?.message??error).slice(0,250)});
 }
};
