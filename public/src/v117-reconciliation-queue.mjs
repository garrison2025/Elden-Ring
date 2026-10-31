/**
 * Browser-only evidence triage for the explicitly user-loaded v1.17 snapshot.
 * No source is fetched here, no canonical weapon is mutated, and no row is
 * labelled as independently confirmed against the Tarnished.dev website.
 */
import {V117_CATALOG_SOURCE_PAGE} from './v117-catalog-overlay.mjs';

const FIELDS=Object.freeze(['name','category','expansion','reviewField',
 'communityValue','pinnedV117Value','catalogStatus','reviewStatus','reviewNote','sourceURL']);
const value=x=>Array.isArray(x)?x.join(' / '):x===null||x===undefined?'UNKNOWN':String(x);
const entry=(weapon,field,community,reference,status,note)=>({
 name:weapon.name,category:weapon.category??'UNKNOWN',
 expansion:weapon.expansion??'UNKNOWN',reviewField:field,
 communityValue:value(community),pinnedV117Value:value(reference),
 catalogStatus:status,reviewStatus:'UNREVIEWED',reviewNote:note,
 sourceURL:V117_CATALOG_SOURCE_PAGE
});

/**
 * One row per distinct unresolved FIELD, not one row per weapon. Source-only
 * attack and weight are two different unresolved questions. Never assert that
 * the pinned v1.17 source settles a legacy discrepancy automatically.
 */
export function buildV117ReconciliationQueue(catalog,overlay){
 if(!Array.isArray(catalog?.weapons)||catalog.weapons.length>5000||
  !(overlay?.rows instanceof Map))throw new TypeError('Catalog and loaded v1.17 overlay required.');
 const result=[];
 const seen=new Set();
 for(const weapon of catalog.weapons){
  if(!weapon||typeof weapon.id!=='string'||typeof weapon.name!=='string'||
   seen.has(weapon.id))throw new TypeError('Invalid or duplicate catalog weapon.');
  seen.add(weapon.id);
  const row=overlay.rows.get(weapon.id);
  if(!row||row.status!=='pinned-v117-neutral-reference'){
   result.push(entry(weapon,'source_mapping',null,null,row?.status??'missing-overlay',
    'No unique validated neutral source. Source matching must be reviewed.'));
   continue;
  }
  let pushed=false;
  if(row.sourceOnly){
   result.push(entry(weapon,'base_attack',row.communityAttack,row.attack,'source-only',
    'Pinned source +0 reference only; original attack remains UNKNOWN.'));
   pushed=true;
  }else if(row.attackDiff){
   result.push(entry(weapon,'base_attack',row.communityAttack,row.attack,'source-disagreement',
    'Compare against the same-input Tarnished.dev v1.17 public interface.'));
   pushed=true;
  }
  if(row.requirementDiff){
   result.push(entry(weapon,'minimum_requirements',row.communityRequirements,row.requirements,
    'source-disagreement','Check original reference version and public v1.17 comparator.'));
   pushed=true;
  }
  if(row.sourceOnly||row.weightIsDisputed){
   result.push(entry(weapon,'weight',row.communityWeight,null,'source-unavailable',
    'Pinned v1.17 snapshot has no validated weapon weight. Keep UNKNOWN/disputed.'));
   pushed=true;
  }
  if(row.flaggedSourceDispute&&!pushed){
   result.push(entry(weapon,'legacy_source_dispute',null,null,'flagged-dispute',
    'Previously flagged disagreement still needs field-level human review.'));
  }
 }
 return result;
}

const csvCell=raw=>{
 let text=value(raw);
 // Neutralize spreadsheet formulas even after whitespace/control prefixes.
 if(/^[\s\u0000-\u001f]*[=+\-@]/u.test(text))text="'"+text;
 return '"'+text.replace(/"/g,'""')+'"';
};
export function v117ReconciliationCsv(rows){
 if(!Array.isArray(rows)||rows.length>15000||
  rows.some(r=>!r||typeof r!=='object'))throw new TypeError('Invalid audit queue.');
 return '\uFEFF'+FIELDS.map(csvCell).join(',')+'\r\n'+
  rows.map(r=>FIELDS.map(k=>csvCell(r[k])).join(',')).join('\r\n')+'\r\n';
}
