/**
 * Real independent multi-move damage sequence computation, given complete
 * user-supplied frame and motion parameters. No invented weapon movesets.
 * Defense/negation remains delegated to the explicit tested math engine.
 * Unlike "estimated attacks per second", this uses recorded frames for each
 * attack and a finite user-selected rendering FPS.
 * Not yet same-input Tarnished.dev DPS parity without a measured moveset.
 */
import {calculateManualDamage} from './damage-reference-model.mjs';
const fail=message=>{throw new RangeError(message)};
const int=(x,name,lo,hi)=>{if(!Number.isInteger(x)||x<lo||x>hi)fail(name+' must be an integer '+lo+'–'+hi);return x};
const scalar=(x,name,lo,hi)=>{
 if(typeof x!=='number'||!Number.isFinite(x)||x<lo||x>hi)fail(name+' out of range');
 return x;
};
const round=n=>Math.round(n*1e6)/1e6;
export function calculateManualMoveSequence({
 attack,enemy,moves,physicalType='physical',
 damageMultiplier=1,afterNegationMultiplier=1,framesPerSecond=60
}={}){
 if(!Array.isArray(moves)||moves.length<1||moves.length>8)
  fail('Provide 1–8 explicitly entered moves.');
 int(framesPerSecond,'Frames per second',1,240);
 const perMove=moves.map((entry,i)=>{
  if(!entry||typeof entry!=='object'||Array.isArray(entry))fail('Malformed move '+(i+1));
  const label=typeof entry.label==='string'&&entry.label.trim()&&entry.label.length<=100?
   entry.label.trim():null;
  if(!label)fail('A short move label is required.');
  const frames=int(entry.frames,'Move '+label+' animation frames',1,10000);
  const hits=int(entry.hits??1,'Move '+label+' hit count',1,100);
  // Individual hit motion values are essential for multi-hit actions. A single
  // motionValue remains supported for legacy uniform-hit manual sequences.
  const hasIndividual=entry.hitMotionValues!==undefined;
  if(hasIndividual&&(!Array.isArray(entry.hitMotionValues)||
     entry.hitMotionValues.length!==hits))
   fail('Move '+label+' hitMotionValues must contain exactly '+hits+' entries.');
  const motionValues=hasIndividual?
   entry.hitMotionValues.map((mv,j)=>scalar(mv,'Move '+label+' hit '+(j+1)+' motion value',0,500)):
   Array(hits).fill(scalar(entry.motionValue,'Move '+label+' motion value',0,500));
  const hitResults=motionValues.map(motionValue=>calculateManualDamage({
   attack,enemy,physicalType,motionValue,damageMultiplier,afterNegationMultiplier,attacksPerSecond:1
  }));
  const hitDamages=hitResults.map(x=>x.damagePerHit);
  const sequenceDamage=round(hitDamages.reduce((sum,x)=>sum+x,0));
  return{label,frames,hits,
   motionValue:hasIndividual?null:motionValues[0],
   hitMotionValues:motionValues,hitDamages,sequenceDamage,
   perHitDamage:hasIndividual?null:hitDamages[0],
   perElement:hasIndividual?null:hitResults[0].perType,
   perHitElements:hasIndividual?hitResults.map(x=>x.perType):null};
 });
 const totalFrames=perMove.reduce((a,b)=>a+b.frames,0);
 const attacks=perMove.reduce((a,b)=>a+b.hits,0);
 const totalDamage=perMove.reduce((a,b)=>a+b.sequenceDamage,0);
 return {status:'INDEPENDENT_MANUAL_FRAME_SEQUENCE',
  totalFrames,framesPerSecond:framesPerSecond,attackCount:attacks,
  damagePerSequence:round(totalDamage),
  averageDamagePerHit:round(totalDamage/attacks),
  sequenceSeconds:round(totalFrames/framesPerSecond),
  damagePerSecond:round(totalDamage*framesPerSecond/totalFrames),
  perMove,provenance:'User-specified per-hit motion values and frame counts, independent local defense/negation formula',
  caveat:'Not a directly benchmarked Tarnished.dev DPS value: actual weapon/moveset animations, motion values, repeat/recovery frames, conditional buffs and named enemy stats must be supplied and independently checked, not inferred from AR.'};
}
