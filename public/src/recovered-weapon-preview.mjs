import {DAMAGE_LABELS,ATTRIBUTE_LABELS} from './community-weapons.mjs';
const fail=m=>{throw new RangeError(m)};
const labels=Object.freeze(['Physical','Magic','Fire','Lightning','Holy']);
export function buildRecoveredWeaponPreview(weapon,row){
 if(!weapon?.flags?.includes('source-v117-neutral-requirements-only'))return null;
 if(!row||row.id!==weapon.id||row.name!==weapon.name||row.gameClientVerified!==false||
  row.publicationApproved!==false||row.reference?.gameClientVerified!==false||
  row.crosscheck?.gameClientVerified!==false||!Array.isArray(row.disputedFields))
  fail('Cannot show an unmatched or falsely certified community source reference.');
 const reference=row.reference,secondary=row.crosscheck;
 if(reference.attackAtPlusZero?.length!==5||secondary.attackAtPlusZero?.length!==5||
  reference.scalingAtPlusZero?.length!==5||secondary.scalingGradesAsReported?.length!==5||
  weapon.attack!==null||weapon.weight!==null||weapon.scaling!==null||weapon.critical!==null||
  weapon.requirements?.join(',')!==row.requirementsPinned117?.join(','))
  fail('Canonical unknown and preview-only source boundaries must remain separate.');
 const attacks=DAMAGE_LABELS.map((label,index)=>{
  const primary=reference.attackAtPlusZero[index],other=secondary.attackAtPlusZero[index];
  const sourceNotListed=other===0&&primary>0;
  return {label,primary,secondary:sourceNotListed?null:other,
   evidence:sourceNotListed?'SECONDARY_NOT_LISTED':
    Math.abs(primary-other)>1.01?'SOURCE_CONFLICT':'SOURCE_COMPARISON'};
 });
 const scalings=ATTRIBUTE_LABELS.map((label,index)=>{
  const primary=reference.scalingAtPlusZero[index],other=secondary.scalingGradesAsReported[index];
  return {label,primary:primary==='?'?null:primary,secondary:other,
   evidence:primary==='?'&&other===null?'UNREPORTED':
    primary==='?'?'SECONDARY_ONLY':
    other!==null&&primary!==other?'SOURCE_CONFLICT':
    other===null?'PRIMARY_ONLY':'SOURCE_COMPARISON'};
 });
 const requirements=ATTRIBUTE_LABELS.map((label,index)=>{
  const primary=row.requirementsPinned117[index],other=row.requirementsFromReference[index];
  return {label,primary,secondary:other,
   evidence:other===null?'SECONDARY_NOT_LISTED':
    other!==primary?'SOURCE_CONFLICT':'SOURCE_COMPARISON'};
 });
 return {
  id:weapon.id,name:weapon.name,sourceStatus:row.sourceStatus,
  sourceConflicts:[...row.disputedFields],sourceOnly:true,
  gameClientVerified:false,publicationApproved:false,readyForExactAR:false,
  attack:attacks,scaling:scalings,requirements,weight:reference.weight,
  critical:reference.critical,
  sourceAUrl:reference.sourceUrl,sourceBUrl:secondary.sourceUrl,
  sourceCUrl:row.thirdSource?.sourceUrl??null,
  unknownScalingCells:scalings.filter(x=>x.evidence==='UNREPORTED').length,
  warning:'Unversioned published +0 source readings, not certified current-game values. The canonical attack, weight, critical and scaling remain unknown. No AR or accurate equip-load claim.'
 };
}
