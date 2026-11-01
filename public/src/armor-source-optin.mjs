/** User-requested source reference only. Never bundle/copy third-party item
 * descriptions, images, code, or claimed patch-certified derived mechanics. */
export const ARMOR_SNAPSHOT_SHA='3d9cefcfcda7066796b9553825449039c2073926';
export const ARMOR_SOURCE_URL='https://raw.githubusercontent.com/deliton/eldenring-api/'+
 ARMOR_SNAPSHOT_SHA+'/api/public/data/armors.json';
export const ARMOR_SOURCE_PAGE='https://github.com/deliton/eldenring-api/blob/'+
 ARMOR_SNAPSHOT_SHA+'/api/public/data/armors.json';
export const ARMOR_SOURCE_COUNT=568;
const fail=msg=>{throw new RangeError(msg)};
/** Source field labels only. These are not per-game-client or v1.17-certified goldens. */
export const ARMOR_METRICS=Object.freeze({
 poise:{label:'Poise',kind:'resistance',source:'Poise'},
 immunity:{label:'Immunity',kind:'resistance',source:'Immunity'},
 robustness:{label:'Robustness',kind:'resistance',source:'Robustness'},
 focus:{label:'Focus',kind:'resistance',source:'Focus'},
 vitality:{label:'Vitality',kind:'resistance',source:'Vitality'},
 physical:{label:'Physical negation',kind:'negation',source:'Phy'},
 strike:{label:'Strike negation',kind:'negation',source:'Strike'},
 slash:{label:'Slash negation',kind:'negation',source:'Slash'},
 pierce:{label:'Pierce negation',kind:'negation',source:'Pierce'},
 magic:{label:'Magic negation',kind:'negation',source:'Magic'},
 fire:{label:'Fire negation',kind:'negation',source:'Fire'},
 lightning:{label:'Lightning negation',kind:'negation',source:'Ligt'},
 holy:{label:'Holy negation',kind:'negation',source:'Holy'}
});
const SOURCE_ALIASES=Object.freeze({Phy:['Phy','Physical'],Ligt:['Ligt','Light']});
function sourceCell(source,name,kind){
 if(!Array.isArray(source))return null;
 const accepted=SOURCE_ALIASES[name]??[name];
 const found=source.filter(row=>row&&typeof row==='object'&&accepted.includes(row.name));
 if(found.length!==1)return null; // Ambiguous or malformed source: no invented 0.
 const value=found[0].amount;
 // Negative damage negation is valid (Scarab helms; flowering Guardian Garb).
 // A negative SOURCE value increases incoming damage. Resistances/Poise
 // still cannot be negative; the optimizer uses log1p for signed negation.
 if(!Number.isFinite(value)||
  (kind==='negation'?(value< -99||value>99):
   (value<0||value>800||!Number.isInteger(value))))return null;
 return value;
}
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
  const poiseList=Array.isArray(entry.resistance)?
   entry.resistance.filter(x=>x?.name==='Poise'):[];
  const poise=poiseList.length===1&&Number.isInteger(poiseList[0].amount)&&
   poiseList[0].amount>=0&&poiseList[0].amount<=800?poiseList[0].amount:null;
  // Keep only the sourced numeric combat fields, not item descriptions/images.
  // Missing/malformed source cells are null rather than guessed zero.
  const metrics={};
  for(const [key,meta] of Object.entries(ARMOR_METRICS)){
   metrics[key]=sourceCell(meta.kind==='negation'?entry.dmgNegation:entry.resistance,
    meta.source,meta.kind);
  }
  armors.push({id:entry.id,name:entry.name.trim(),slot:categories[entry.category],
   weight:entry.weight,poise,metrics});
 }
 return {count:armors.length,armors,
  description:'Source-reported, exact pinned upstream snapshot; NOT game-client version/rights certified. No images or descriptions imported. Missing/invalid Poise is UNKNOWN, never zero.'};
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
