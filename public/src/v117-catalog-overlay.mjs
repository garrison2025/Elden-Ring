/**
 * Explicit v1.17 reference-only overlay for the bundled 487-name catalog.
 * This never writes into canonical community weapons and never infers weight.
 * It reads an opt-in pinned public source snapshot (same source used by
 * the independently tested v1.17 AR engine), NOT Tarnished.dev's private data.
 * 50 actual same-input public v1.17 site AR cases were compared separately.
 */
import {hasDisputedAttack,hasDisputedRequirements,hasDisputedWeight} from './community-weapons.mjs';
import {V117_SOURCE_PAGE} from './upstream-regulation-v117.mjs';
export const V117_CATALOG_SOURCE_PAGE=V117_SOURCE_PAGE;
const ATTRS=Object.freeze(['str','dex','int','fai','arc']);
const normalize=name=>String(name).trim().replace(/[\u2018\u2019]/g,"'")
 .toLocaleLowerCase('en-US');
const bad=message=>{throw new RangeError(message);};
const pairs=obj=>Array.isArray(obj)?Object.fromEntries(obj):null;
const validAttack=x=>Number.isInteger(x)&&x>=0&&x<=10000;
const equal=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&
 a.length===b.length&&a.every((v,i)=>v===b[i]);
const disputed=w=>hasDisputedAttack(w)||hasDisputedRequirements(w)||hasDisputedWeight(w);
function neutralFacts(item,reinforceTypes){
 const raw=pairs(item.attack);
 if(!raw||!item.requirements||typeof item.requirements!=='object')return null;
 const upgrade0=reinforceTypes?.[String(item.reinforceTypeId)]?.[0];
 if(!upgrade0?.attack)return null;
 const attack=[];
 for(let i=0;i<5;i++){
  const base=raw[String(i)]??0;
  // A source with a missing multiplier for a positive damage element is
  // unknown, NOT multiplied by zero or treated as an absent damage type.
  const factor=upgrade0.attack[String(i)];
  if(!Number.isFinite(base)||base<0||base>10000||
   (base!==0&&(!Number.isFinite(factor)||factor<=0||factor>100)))return null;
  const result=base===0?0:Math.round(base*factor);
  if(!validAttack(result))return null;
  attack.push(result);
 }
 const requirements=ATTRS.map(k=>item.requirements[k]??0);
 if(requirements.some(x=>!Number.isInteger(x)||x<0||x>99))return null;
 return {attack,requirements,affinityId:item.affinityId,
  reinforcement:item.affinityId===-1?'Somber/unique':'Default/neutral'};
}
export function buildV117CatalogOverlay(catalog,source){
 if(!catalog||!Array.isArray(catalog.weapons)||catalog.weapons.length>5000||
  !source||!Array.isArray(source.weapons)||source.weapons.length<1||
  !source.reinforceTypes||typeof source.reinforceTypes!=='object')
  bad('Expected a local catalog and a validated pinned v1.17 source.');
 const byName=new Map();
 for(const item of source.weapons){
  if(!item||typeof (item.weaponName??item.name)!=='string')continue;
  if(item.affinityId!==0&&item.affinityId!==-1)continue;
  const key=normalize(item.weaponName??item.name);
  if(!key)continue;
  const arr=byName.get(key)??[];
  arr.push(item);byName.set(key,arr);
 }
 const rows=new Map(),summary={
  total:catalog.weapons.length,sourceMapped:0,sourceOnlyMapped:0,
  flaggedDisputesMapped:0,neutralAttackDifferences:0,
  neutralRequirementDifferences:0,missing:0,ambiguous:0,
  incompleteSource:0,
  sourceGameVersion:'1.17',actualSiteArCasesCompared:50,
  sourceProvenance:'Opt-in pinned PUBLIC v1.17 regulation-derived parameters; per-weapon +0 base is NOT independently read from Tarnished.dev, only AR representative cases were compared.',
  sourceIncludesWeight:false
 };
 for(const weapon of catalog.weapons){
  const matches=byName.get(normalize(weapon.name))??[];
  if(matches.length===0){rows.set(weapon.id,{status:'no-source',id:weapon.id});summary.missing++;continue;}
  if(matches.length!==1){rows.set(weapon.id,{status:'ambiguous-source',id:weapon.id});summary.ambiguous++;continue;}
  const facts=neutralFacts(matches[0],source.reinforceTypes);
  if(!facts){rows.set(weapon.id,{status:'incomplete-source',id:weapon.id});summary.incompleteSource++;continue;}
  const attackDiff=Array.isArray(weapon.attack)&&!equal(weapon.attack,facts.attack);
  const requirementDiff=Array.isArray(weapon.requirements)&&
   !equal(weapon.requirements,facts.requirements);
  const sourceOnly=weapon.flags?.includes('source-v117-neutral-requirements-only')??false;
  const flagged=disputed(weapon);
  summary.sourceMapped++;
  if(sourceOnly)summary.sourceOnlyMapped++;
  if(flagged)summary.flaggedDisputesMapped++;
  if(attackDiff)summary.neutralAttackDifferences++;
  if(requirementDiff)summary.neutralRequirementDifferences++;
  rows.set(weapon.id,{
   status:'pinned-v117-neutral-reference',id:weapon.id,name:weapon.name,
   ...facts,sourceOnly,flaggedSourceDispute:flagged,
   communityAttack:weapon.attack??null,communityRequirements:weapon.requirements??null,
   attackDiff,requirementDiff,communityWeight:weapon.weight??null,
   weightIsDisputed:hasDisputedWeight(weapon),
   referenceWeight:null, // source lacks a vetted weight field: never invent it
   sourcePage:V117_SOURCE_PAGE,sourceGameVersion:'1.17',
   comparatorStatus:'v1.17 public source only; this individual weapon is NOT a confirmed Tarnished.dev AR observation'
  });
 }
 return {rows,summary};
}
