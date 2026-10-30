/**
 * Compare individual DLC community +0 facts against a pinned game-derived
 * Regulation v1.17 JSON without reproducing the full upstream database.
 * Important: raw attack pairs are BEFORE the reinforcement level-0 multiplier.
 */
const fail=s=>{throw new RangeError(s);};
const norm=s=>String(s).toLowerCase().replace(/[\u2018\u2019]/g,"'").replace(/[^a-z0-9]/g,'');
const attrib=['str','dex','int','fai','arc'];
export function compareDlcWithV117(catalog,regulation){
 if(!Array.isArray(catalog?.weapons)||!Array.isArray(regulation?.weapons)||
    !regulation.reinforceTypes||typeof regulation.reinforceTypes!=='object')
  fail('Invalid catalog or Regulation data.');
 const index=new Map();
 for(const item of regulation.weapons){
  const key=norm(item.weaponName||item.name),arr=index.get(key)||[];
  arr.push(item);index.set(key,arr);
 }
 const entries=catalog.weapons.filter(w=>w.expansion==='Shadow of the Erdtree');
 const differences=[],unmatched=[],ambiguous=[];let compared=0;
 for(let i=0;i<entries.length;i++){
  const w=entries[i],items=index.get(norm(w.name))||[];
  const base=items.filter(w=>w.affinityId===0||w.affinityId===-1);
  if(!base.length){unmatched.push(w.name);continue;}
  if(base.length!==1){ambiguous.push(w.name);continue;}
  const ref=base[0],reinforce=regulation.reinforceTypes[String(ref.reinforceTypeId)]?.[0];
  if(!reinforce?.attack)fail('Missing +0 reinforce multipliers for '+w.name);
  const attack=Object.fromEntries(ref.attack);
  const sourceAttack=Array.from({length:5},(_,j)=>{
   const original=Number(attack[j]??0);
   const factor=Number(reinforce.attack[j]??0);
   if(!Number.isFinite(original)||!Number.isFinite(factor))fail('Bad +0 reference');
   return Math.round(original*factor);
  });
  const req=attrib.map(a=>ref.requirements?.[a]??0);
  const attackConflict=w.attack!==null&&w.attack.some((v,j)=>v!==sourceAttack[j]);
  const requirementConflict=req.some((v,j)=>v!==w.requirements?.[j]);
  compared++;
  if(attackConflict||requirementConflict){
   differences.push({name:w.name,attackConflict,requirementConflict,
    communityAttack:w.attack,sourceAttack,
    communityRequirements:w.requirements,sourceRequirements:req});
  }
 }
 return {catalogDlcCount:entries.length,compared,unmatched,ambiguous,
  attackConflicts:differences.filter(x=>x.attackConflict).length,
  requirementConflicts:differences.filter(x=>x.requirementConflict).length,
  differences,gameVerified:false,sourceSnapshot:'public-v1.17-pinned',
  note:'Comparison of independent community fact sources at +0 only; no current regulation gameplay validation.'};
}
