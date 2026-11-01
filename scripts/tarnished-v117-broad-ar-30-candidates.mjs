/** Planned inputs only; no site output or source-derived AR values appear here.
 * 13 distinct regular affinities, intermediate regular upgrades,
 * multiple reinforcement types, paired/special weapons and true 2H.
 */
const c=(id,weaponName,affinity,upgrade,{str=60,dex=60,int=45,fai=45,arc=45,twoHanded=false,somber=false}={})=>
 Object.freeze({id,weaponName,affinity,upgrade,str,dex,int,fai,arc,twoHanded,somber});
export const V117_BROAD_AR_30=Object.freeze([
 ...['Standard','Heavy','Keen','Quality','Fire','Flame Art','Lightning','Sacred','Magic','Cold','Poison','Blood','Occult']
 .map((affinity,i)=>c('longsword-affinity-'+String(i).padStart(2,'0'),'Longsword',affinity,7)),
 c('claymore-standard-plus1','Claymore','Standard',1),
 c('claymore-heavy-plus1','Claymore','Heavy',1),
 c('claymore-quality-plus20','Claymore','Quality',20),
 c('claymore-fire-plus20','Claymore','Fire',20),
 c('claymore-flameart-plus20','Claymore','Flame Art',20),
 c('greatsword-heavy-plus7-1h','Greatsword','Heavy',7),
 c('greatsword-heavy-plus7-2h','Greatsword','Heavy',7,{twoHanded:true}),
 c('greatsword-quality-plus20','Greatsword','Quality',20),
 c('milady-cold-plus17','Milady','Cold',17),
 c('milady-keen-plus17','Milady','Keen',17),
 c('rellana-somber-plus5',"Rellana's Twin Blades",'None',5,{somber:true}),
 c('moonveil-somber-plus5','Moonveil','None',5,{somber:true}),
 c('blasphemous-somber-plus5','Blasphemous Blade','None',5,{somber:true}),
 c('grafted-somber-plus5','Grafted Blade Greatsword','None',5,{somber:true}),
 c('uchigatana-blood-plus13','Uchigatana','Blood',13),
 c('uchigatana-cold-plus13','Uchigatana','Cold',13),
 c('uchigatana-occult-plus13','Uchigatana','Occult',13)
]);
if(V117_BROAD_AR_30.length!==30||new Set(V117_BROAD_AR_30.map(x=>x.id)).size!==30)
 throw Error('Expected thirty unique exact-input v1.17 AR candidates.');
export function getBroadArShard(shard){
 if(!Number.isInteger(shard)||shard<0||shard>4)throw RangeError('AR shard must be 0–4');
 return V117_BROAD_AR_30.slice(shard*6,shard*6+6);
}
