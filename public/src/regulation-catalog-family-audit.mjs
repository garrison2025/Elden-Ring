/**
 * Two-way source-family coverage for a pinned 1.17 regulation snapshot.
 * Only source-visible names, classes and five minimum requirements are checked;
 * this is not a 1.17.3 gameplay certification.
 */
const normalized=s=>String(s).trim().replace(/[\u2018\u2019]/g,"'").toLocaleLowerCase('en-US');
const typeToCategory=Object.freeze({5:'Greatsword',9:'Curved Sword',61:'Sacred Seal',65:'Small Shield',67:'Medium Shield',69:'Greatshield'});
const requirementKeys=['str','dex','int','fai','arc'];
export function auditSourceFamilyCoverage(catalog,regulation,{maxExamples=20}={}){
 if(!catalog||!Array.isArray(catalog.weapons)||!regulation||!Array.isArray(regulation.weapons)||
  !Number.isInteger(maxExamples)||maxExamples<0||maxExamples>100)
  throw new RangeError('Invalid source family audit data.');
 const families=new Map();
 for(const item of regulation.weapons){
  const name=item?.weaponName??item?.name;
  if(typeof name!=='string'||!name.trim())continue;
  const key=normalized(name);
  const family=families.get(key)??{name,neutral:[],weaponType:null};
  if(item.affinityId===0||item.affinityId===-1){
   family.neutral.push(item);
   family.weaponType=item.weaponType;
  }
  families.set(key,family);
 }
 const found=new Set(),missingIndices=[];
 for(const [index,item] of catalog.weapons.entries()){
  if(!item||typeof item.name!=='string'||!item.name.trim())
   throw new RangeError('Invalid community weapon name.');
  const key=normalized(item.name);
  if(found.has(key))throw new RangeError('Duplicate normalized source weapon name '+item.name);
  found.add(key);
  const source=families.get(key);
  if(!source&&missingIndices.length<maxExamples)missingIndices.push(index);
  if(item.flags?.includes('source-v117-neutral-requirements-only')){
   if(!source||source.neutral.length!==1||
      typeToCategory[source.weaponType]!==item.category||
      requirementKeys.some((a,i)=>(source.neutral[0].requirements?.[a]??0)!==item.requirements?.[i]))
    throw new RangeError('Sourced 1.17 equipment name, category or attribute requirements have drifted for '+item.name);
  }
 }
 const absent=[...families.entries()].filter(([key])=>!found.has(key));
 const excluded=absent.filter(([key,source])=>key==='unarmed'&&source.neutral.length===1&&source.weaponType===35);
 const playable=absent.filter(x=>!excluded.includes(x));
 const otherUnlisted=playable.map(([key,source])=>({name:source.name,weaponType:source.weaponType}));
 const unmatchedRows=catalog.weapons.filter(w=>!families.has(normalized(w.name))).length;
 return {catalogRows:catalog.weapons.length,matchedRows:catalog.weapons.length-unmatchedRows,
  missingRows:unmatchedRows,uniqueSourceFamilies:families.size,
  missingIndices,allMatched:unmatchedRows===0,
  unlistedPlayableCount:otherUnlisted.length,unlistedPlayable:otherUnlisted.slice(0,maxExamples),
  excludedNonEquipmentCount:excluded.length,
  uniqueCatalogNames:found.size,sourceWearableFamilies:families.size-excluded.length,
  completeForPinnedSource:unmatchedRows===0&&playable.length===0&&excluded.length===1,
  namesOrSourceParamsExported:false,gameVerified:false,
  note:'Source-only two-way named-family coverage. Unarmed is a virtual state, not an equippable item. No current-version or AR certification.'};
}
