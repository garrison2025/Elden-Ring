/**
 * Publicly available community game-param snapshot — consumed ONLY after user action.
 * No third-party script is run, and no game regulation file ships with this site.
 * Pin the upstream git commit so the user knows precisely which artifact was requested.
 *
 * Upstream project's COPYING is MIT for its authored software. It does not independently
 * establish rights to third-party/game-derived numerical data or visual assets.
 */
export const V117_UPSTREAM_COMMIT='3539d87e446f3b9d5b94157f8a2023e28ffea7d2';
export const V117_UPSTREAM_URL=
 'https://raw.githubusercontent.com/ThomasJClark/elden-ring-weapon-calculator/'+
 V117_UPSTREAM_COMMIT+'/public/regulation-vanilla-v1.17.js';
export const V117_SOURCE_PAGE=
 'https://github.com/ThomasJClark/elden-ring-weapon-calculator/blob/'+
 V117_UPSTREAM_COMMIT+'/public/regulation-vanilla-v1.17.js';
export const V117_COPYING_URL=
 'https://github.com/ThomasJClark/elden-ring-weapon-calculator/blob/'+
 V117_UPSTREAM_COMMIT+'/COPYING';
export const V117_MAX_BYTES=16_000_000;
export const V117_EXPECTED_VARIANTS=3296;
export const V117_PROVENANCE='ThomasJClark/elden-ring-weapon-calculator @ '+
 V117_UPSTREAM_COMMIT+' · public game-derived v1.17 JSON · third-party rights and game accuracy NOT independently certified';

const invalid=message=>{throw new RangeError(message);};
const isRecord=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);

/** Strict JSON parsing only; rejects JavaScript even though upstream filename ends in .js. */
export function inspectV117Json(text,{expectedEntries=V117_EXPECTED_VARIANTS}={}){
 if(typeof text!=='string'||!text.length||text.length>V117_MAX_BYTES)
  invalid('The selected source must be nonempty JSON smaller than 16 MB.');
 if(!Number.isInteger(expectedEntries)||expectedEntries<1||expectedEntries>50000)
  invalid('Invalid source entry count expectation.');
 let value;
 try{value=JSON.parse(text);}catch{invalid('Source is not valid JSON; JavaScript is never executed.');}
 if(!isRecord(value))invalid('Expected a compact regulation JSON object.');
 for(const key of ['calcCorrectGraphs','attackElementCorrects','reinforceTypes','statusSpEffectParams'])
  if(!isRecord(value[key]))invalid('Missing or invalid source table: '+key);
 if(!Array.isArray(value.weapons)||value.weapons.length!==expectedEntries)
  invalid('Unexpected number of source weapon variants. The pinned snapshot may have changed.');
 if(!Array.isArray(value.scalingTiers))invalid('Missing source scaling tiers.');
 const names=new Set();
 for(const item of value.weapons){
  if(!isRecord(item)||typeof item.name!=='string'||!item.name.trim()||
     item.name.length>120||!Array.isArray(item.attack)||!Array.isArray(item.attributeScaling)||
     !isRecord(item.requirements)||!Number.isInteger(item.reinforceTypeId)||
     !Number.isInteger(item.attackElementCorrectId))
   invalid('One or more source weapon records are malformed.');
  if(names.has(item.name))invalid('Duplicate upstream weapon/affinity name.');
  names.add(item.name);
 }
 return {entries:value.weapons.length,uniqueNames:names.size,
   dlcRows:value.weapons.filter(w=>w.dlc===true).length,version:'1.17'};
}

/** This retrieves an external GitHub JSON artifact only when the user explicitly clicks. */
export async function downloadV117Source(fetcher,{signal}={}){
 if(typeof fetcher!=='function')invalid('A secure browser fetch implementation is required.');
 const response=await fetcher(V117_UPSTREAM_URL,{
  method:'GET',mode:'cors',credentials:'omit',cache:'no-store',redirect:'error',
  referrerPolicy:'no-referrer',signal
 });
 if(!response?.ok)invalid('Could not retrieve the pinned v1.17 source (HTTP '+(response?.status??'unknown')+').');
 const size=Number(response.headers?.get?.('content-length')||0);
 if(size>V117_MAX_BYTES)invalid('Upstream source exceeds 16 MB limit.');
 let text;
 if(response.body?.getReader){
  const reader=response.body.getReader(),parts=[];let length=0;
  try{
   while(true){
    const {value,done}=await reader.read();if(done)break;
    length+=value.byteLength;
    if(length>V117_MAX_BYTES){
     await reader.cancel().catch(()=>{});
     invalid('Source exceeds 16 MB streaming limit.');
    }
    parts.push(value);
   }
  }finally{reader.releaseLock();}
  const merged=new Uint8Array(length);
  let offset=0;for(const part of parts){merged.set(part,offset);offset+=part.byteLength;}
  text=new TextDecoder('utf-8',{fatal:true}).decode(merged);
 }else{
  text=await response.text();
  if(new TextEncoder().encode(text).byteLength>V117_MAX_BYTES)
   invalid('Source exceeds 16 MB limit.');
 }
 const summary=inspectV117Json(text);
 return {text,summary};
}
