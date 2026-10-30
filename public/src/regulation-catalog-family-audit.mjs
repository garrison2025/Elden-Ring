/**
 * Anonymous exact-name coverage gate for source-defined base weapon families.
 * No game parameters, weapon names, or AR values enter audit artifacts.
 */
const normalized=s=>String(s).trim().replace(/[\u2018\u2019]/g,"'").toLocaleLowerCase('en-US');
export function auditSourceFamilyCoverage(catalog,regulation,{maxExamples=20}={}){
 if(!catalog||!Array.isArray(catalog.weapons)||!regulation||!Array.isArray(regulation.weapons)||
  !Number.isInteger(maxExamples)||maxExamples<0||maxExamples>100)
  throw new RangeError('Invalid source family audit data.');
 const families=new Set();
 for(const item of regulation.weapons)if(item&&typeof item.name==='string'&&
  typeof (item.weaponName??item.name)==='string')
  families.add(normalized(item.weaponName??item.name));
 let matchedRows=0;const missingIndices=[];
 for(const [index,item] of catalog.weapons.entries()){
  if(!item||typeof item.name!=='string'||!item.name.trim())
   throw new RangeError('Invalid community weapon name.');
  if(families.has(normalized(item.name)))matchedRows++;
  else if(missingIndices.length<maxExamples)missingIndices.push(index);
 }
 return {catalogRows:catalog.weapons.length,matchedRows,
  missingRows:catalog.weapons.length-matchedRows,uniqueSourceFamilies:families.size,
  missingIndices,allMatched:matchedRows===catalog.weapons.length,
  namesOrSourceParamsExported:false,gameVerified:false,
  note:'Exact normalized source family names only; does not verify numeric AR, patch parity or game data rights.'};
}
