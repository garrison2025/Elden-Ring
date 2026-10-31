/** User-requested source reference only. Never bundle/copy third-party item
 * descriptions, images, code, or claimed patch-certified derived mechanics. */
export const ARMOR_SNAPSHOT_SHA='3d9cefcfcda7066796b9553825449039c2073926';
export const ARMOR_SOURCE_URL='https://raw.githubusercontent.com/deliton/eldenring-api/'+
 ARMOR_SNAPSHOT_SHA+'/api/public/data/armors.json';
export const ARMOR_SOURCE_PAGE='https://github.com/deliton/eldenring-api/blob/'+
 ARMOR_SNAPSHOT_SHA+'/api/public/data/armors.json';
export const ARMOR_SOURCE_COUNT=568;
const fail=msg=>{throw new RangeError(msg)};
const categories=Object.freeze({'Helm':'Head','Chest Armor':'Chest','Gauntlets':'Arms',
 'Gauntlet':'Arms','Leg Armor':'Legs'});
export function inspectArmorSource(text){
 if(typeof text!=='string'||!text||text.length>1_500_000)
  fail('Pinned armor source must be nonempty JSON under 1.5 MB.');
 let raw;try{raw=JSON.parse(text)}catch{fail('Armor reference must contain strict JSON.');}
 if(!Array.isArray(raw)||raw.length!==ARMOR_SOURCE_COUNT)
  fail('Armor source count mismatch; do not silently accept changed upstream content.');
 const seen=new Set(),armors=[];
 for(const entry of raw){
  if(!entry||typeof entry!=='object'||Array.isArray(entry)||
   typeof entry.id!=='string'||!/^[a-zA-Z0-9-]{10,80}$/.test(entry.id)||
   typeof entry.name!=='string'||!entry.name.trim()||entry.name.length>120||
   !Object.hasOwn(categories,entry.category)||typeof entry.weight!=='number'||
   !Number.isFinite(entry.weight)||entry.weight<0||entry.weight>100||
   Math.round(entry.weight*1000)/1000!==entry.weight)
   fail('Malformed armor name, slot or weight; source cannot be safely used.');
  if(seen.has(entry.id))fail('Duplicate source armor ID.');seen.add(entry.id);
  armors.push({id:entry.id,name:entry.name.trim(),slot:categories[entry.category],
   weight:entry.weight});
 }
 return {count:armors.length,armors,
  description:'Source-reported, exact pinned upstream snapshot; NOT game-client version/rights certified. No images or descriptions imported.'};
}
export async function loadPinnedArmorSource(fetcher,{signal}={}){
 if(typeof fetcher!=='function')fail('A browser fetch implementation is required.');
 const response=await fetcher(ARMOR_SOURCE_URL,{
  method:'GET',mode:'cors',credentials:'omit',redirect:'error',
  cache:'no-store',referrerPolicy:'no-referrer',signal
 });
 if(!response?.ok)fail('Pinned armor source unavailable: HTTP '+(response?.status??'unknown'));
 const bytes=Number(response.headers?.get?.('content-length')||0);
 if(bytes>1_500_000)fail('Pinned armor file is too large.');
 const text=await response.text();
 if(text.length>1_500_000)fail('Pinned armor JSON exceeds limit.');
 return inspectArmorSource(text);
}
export function findExactArmor(rows,slot,name){
 if(!Array.isArray(rows)||typeof slot!=='string'||typeof name!=='string')return null;
 const key=name.trim().toLocaleLowerCase('en-US');
 if(!key)return null;
 const matches=rows.filter(x=>x.slot===slot&&
  x.name.toLocaleLowerCase('en-US')===key);
 return matches.length===1?matches[0]:null;
}
