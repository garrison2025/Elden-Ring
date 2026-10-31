/**
 * Local-only seven-conflict comparison of a user-provided compact regulation JSON.
 * This is a parameter-file cross-check, NEVER a game-client screenshot review.
 * No global source corpus is copied into the output.
 */
const err=s=>{throw new RangeError(s);};
const attrs=['str','dex','int','fai','arc'];
const normalize=s=>String(s??'').toLowerCase()
 .replace(/[\u2018\u2019]/g,"'").replace(/[^a-z0-9]/g,'');
const vecEqual=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>v===b[i]);
const safeString=(v,max=160)=>typeof v==='string'&&v.trim().length>0&&v.trim().length<=max;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const isObject=v=>v&&typeof v==='object'&&!Array.isArray(v);
const safeInt=(v,n)=>Number.isInteger(v)&&v>=0&&v<=n;
export const REQUIRED_GAME_TARGET=Object.freeze({app:'1.17.2',regulation:'1.17.3'});
const requiredCases=['sote-reference-032','sote-reference-041','sote-reference-042',
 'sote-reference-051','sote-reference-064','sote-reference-071','sote-reference-058'];

function plusZeroAttack(item,reinforceTypes){
 if(!Array.isArray(item.attack)||item.attack.length<1||item.attack.length>12)
  err('Missing compact attack pairs');
 const raw=Object.create(null),allow=new Set(['0','1','2','3','4','5','6','7','8','9','10','11']);
 for(const pair of item.attack){
  if(!Array.isArray(pair)||pair.length!==2||!allow.has(String(pair[0]))||
     own(raw,String(pair[0]))||!safeInt(pair[1],50000))
   err('Malformed or duplicated raw attack entry');
  raw[String(pair[0])]=pair[1];
 }
 const steps=reinforceTypes[String(item.reinforceTypeId)];
 if(!Array.isArray(steps)||!isObject(steps[0])||!isObject(steps[0].attack))
  err('Missing unupgraded reinforcement data');
 const factors=steps[0].attack;
 const output=[];
 for(let i=0;i<5;i++){
  const original=raw[String(i)]??0;
  if(!original){output.push(0);continue;}
  if(!own(factors,String(i))||typeof factors[String(i)]!=='number'||
     !Number.isFinite(factors[String(i)])||factors[String(i)]<=0||factors[String(i)]>100)
   err('Unknown or invalid +0 reinforcement multiplier');
  const val=Math.round(original*factors[String(i)]);
  if(!safeInt(val,100000))err('Invalid unupgraded attack result');
  output.push(val);
 }
 if(output.every(x=>x===0))err('Missing physical/elemental +0 attack');
 return output;
}
function sourceRequirements(item){
 if(!isObject(item.requirements))err('Missing source requirement object');
 return attrs.map(a=>{
  const n=item.requirements[a]??0;
  if(!safeInt(n,99))err('Invalid requirement '+a);
  return n;
 });
}
export function auditCurrentRegulationConflicts(catalog,ledger,root,meta={}){
 if(!Array.isArray(catalog?.weapons)||!Array.isArray(ledger?.cases)||
    ledger.cases.length!==7||!isObject(root)||
    !Array.isArray(root.weapons)||root.weapons.length<1||root.weapons.length>50000||
    !isObject(root.reinforceTypes)||!isObject(meta)||
    !safeString(meta.gameAppVersion,40)||!safeString(meta.regulationVersion,40)||
    !safeString(meta.sourceDescription,240))
  err('Missing exact seven-case catalog, compact source or manually described version');
 if(new Set(ledger.cases.map(x=>x.id)).size!==7||
    requiredCases.some(id=>!ledger.cases.some(x=>x.id===id)))
  err('Exact seven source cases are required');
 if(meta.sourceFileSha256!==undefined&&!/^[a-f0-9]{64}$/i.test(meta.sourceFileSha256))
  err('Malformed local source fingerprint');
 const catalogById=new Map(catalog.weapons.map(w=>[w.id,w]));
 const index=new Map();
 for(const item of root.weapons){
  if(!isObject(item))continue;
  const name=item.weaponName||item.name;
  if(typeof name!=='string'||!name.trim())continue;
  const key=normalize(name);
  if(!key)continue;
  const list=index.get(key)??[];list.push(item);index.set(key,list);
 }
 const results=ledger.cases.map(row=>{
  const w=catalogById.get(row.id);
  if(!w||normalize(w.name)===''||!Array.isArray(row.pinned)||row.pinned.length!==5||
     !Array.isArray(row.community)||row.community.length!==5||
     !['baseAttack','requirements'].includes(row.field))
   err('Missing original weapon or pinned seven-case facts');
  const base={
   id:row.id,name:w.name,field:row.field,
   community:[...row.community],pinned:[...row.pinned],
   sourceStatus:'unmatched',sourceValues:null,matchPinned:null,matchCommunity:null,
   note:'No matching unique neutral-affinity record was available in the supplied local file.'
  };
  const all=index.get(normalize(w.name))??[];
  const neutral=all.filter(r=>r.affinityId===0||r.affinityId===-1);
  if(neutral.length===0)return base;
  if(neutral.length!==1)return {...base,sourceStatus:'ambiguous',
   note:'More than one neutral/default affinity row matched; do not guess which one is correct.'};
  try{
   const observed=row.field==='baseAttack'?
    plusZeroAttack(neutral[0],root.reinforceTypes):sourceRequirements(neutral[0]);
   return {...base,sourceStatus:'compared',sourceValues:observed,
    matchPinned:vecEqual(observed,row.pinned),
    matchCommunity:vecEqual(observed,row.community),
    note:'Compared from user-selected local source; its declared version and origin are NOT independently authenticated.'};
  }catch{
   return {...base,sourceStatus:'invalid',
    note:'Matching neutral row contains missing/invalid data; no value inferred.'};
  }
 });
 const counts={
  compared:results.filter(x=>x.sourceStatus==='compared').length,
  pinnedMatches:results.filter(x=>x.matchPinned===true).length,
  communityMatches:results.filter(x=>x.matchCommunity===true).length,
  neitherMatches:results.filter(x=>x.sourceStatus==='compared'&&
   !x.matchPinned&&!x.matchCommunity).length,
  unmatched:results.filter(x=>x.sourceStatus==='unmatched').length,
  ambiguous:results.filter(x=>x.sourceStatus==='ambiguous').length,
  invalid:results.filter(x=>x.sourceStatus==='invalid').length
 };
 return {
  schemaVersion:1,kind:'LOCAL_SEVEN_WEAPON_PARAMETER_FILE_CROSSCHECK_NOT_GAME_VERIFICATION',
  generatedFrom:'player-supplied-compact-regulation-json',
  declaredGameAppVersion:meta.gameAppVersion,
  declaredRegulationVersion:meta.regulationVersion,
  expectedTarget:REQUIRED_GAME_TARGET,
  declaredTargetMatches:
   meta.gameAppVersion===REQUIRED_GAME_TARGET.app&&
   meta.regulationVersion===REQUIRED_GAME_TARGET.regulation,
  sourceDescription:meta.sourceDescription,
  ...(meta.sourceFileSha256?{sourceFileSha256:meta.sourceFileSha256}:{}),
  sourceVersionAuthenticated:false,
  sourceOwnershipVerified:false,
  gameClientVerified:false,
  reviewerApproved:false,
  screenshotGoldensAdded:0,
  currentCatalogNotModified:true,
  counts,results,
  note:'This file-local cross-check does not authenticate the origin/version of the supplied parameters, inspect a game-client screen, resolve legacy flags, certify AR or authorize indexing.'
 };
}
