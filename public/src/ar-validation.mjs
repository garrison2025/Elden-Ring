import {calculateAr, validateArProfile, POWER_STATS, DAMAGE_TYPES} from './weapon-ar.mjs';

/**
 * Offline AR evidence comparator, not an in-game certification service.
 * An expected number typed by a user is an UNREVIEWED observation even
 * when the difference is zero. No game assets or data are redistributed.
 */
const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const err=message=>{throw new RangeError(message)};
const bounded=(value,label,max=120)=>{
  if(typeof value!=='string'||!value.trim()||value.length>max)err(label+' must be a nonempty string (max '+max+').');
  return value.trim();
};
const int=(value,label,min=0,max=999999)=>{
  if(!Number.isSafeInteger(value)||value<min||value>max)err(label+' must be a whole number between '+min+' and '+max+'.');
  return value;
};
const limitedNotes=(value,label,max=600)=>{
  if(value===undefined||value===null||value==='')return '';
  if(typeof value!=='string'||value.length>max)err(label+' must be a string (max '+max+').');
  return value;
};
export function validateObservationSet(candidate){
  if(!isObject(candidate)||candidate.schemaVersion!==1)err('Observation file must have schemaVersion: 1.');
  bounded(candidate.profileLabel,'profileLabel');
  bounded(candidate.gameVersion,'gameVersion');
  if(!Array.isArray(candidate.cases)||candidate.cases.length<1||candidate.cases.length>100)err('Provide 1 to 100 observations.');
  const ids=new Set();
  for(const [index,c] of candidate.cases.entries()){
    const name='cases['+index+']';
    if(!isObject(c))err(name+' must be an object.');
    bounded(c.id,name+'.id',70);
    if(ids.has(c.id))err('Duplicate observation ID: '+c.id);
    ids.add(c.id);
    bounded(c.affinity,name+'.affinity');
    int(c.upgrade,name+'.upgrade',0,25);
    if(typeof c.twoHanded!=='boolean')err(name+'.twoHanded must be true or false.');
    if(!isObject(c.stats))err(name+'.stats must contain five attributes.');
    for(const stat of POWER_STATS)int(c.stats[stat],name+'.stats.'+stat,1,99);
    int(c.observedTotal,name+'.observedTotal',0,1000000);
    if(c.observedElements!==undefined){
      if(!isObject(c.observedElements))err(name+'.observedElements must be an object.');
      for(const [element,value] of Object.entries(c.observedElements)){
        if(!DAMAGE_TYPES.includes(element))err('Unknown observed damage element: '+element);
        int(value,name+'.observedElements.'+element,0,1000000);
      }
    }
    if(!isObject(c.evidence))err(name+'.evidence must identify the observation source.');
    if(!['synthetic-test','manual-transcription'].includes(c.evidence.kind))err(name+'.evidence.kind must be synthetic-test or manual-transcription.');
    bounded(c.evidence.reference,name+'.evidence.reference',300);
    limitedNotes(c.evidence.note,name+'.evidence.note');
  }
  return candidate;
}
export function compareArObservations(profile,observations){
  validateArProfile(profile);
  const input=validateObservationSet(observations);
  if(input.profileLabel!==profile.label)err('Observation profileLabel must match the imported AR profile label exactly.');
  const profileVersion=profile.provenance.gameVersion||null;
  const versionMismatch=Boolean(profileVersion&&profileVersion!==input.gameVersion);
  const items=[];
  for(const c of input.cases){
    let item={id:c.id,affinity:c.affinity,upgrade:c.upgrade,twoHanded:c.twoHanded,
      expected:c.observedTotal,observedElementCount:Object.keys(c.observedElements||{}).length,
      evidenceKind:c.evidence.kind,evidenceReference:c.evidence.reference,
      reviewStatus:'UNREVIEWED — requires independent evidence inspection',
      status:'error',delta:null,computed:null,elementMismatches:[]};
    try{
      if(versionMismatch)throw new RangeError('Game version differs from the profile provenance gameVersion.');
      const result=calculateAr(profile,c.stats,{affinity:c.affinity,upgrade:c.upgrade,twoHanded:c.twoHanded});
      item.computed=result.total;
      item.delta=result.total-c.observedTotal;
      for(const [element,expected] of Object.entries(c.observedElements||{})){
        const got=result.perElement.find(v=>v.element===element)?.displayed??0;
        if(expected!==got)item.elementMismatches.push({element,expected,computed:got,delta:got-expected});
      }
      item.status=(item.delta===0&&item.elementMismatches.length===0)?'match':'mismatch';
    }catch(e){item.error=e.message;}
    items.push(item);
  }
  const matches=items.filter(r=>r.status==='match').length;
  const mismatches=items.filter(r=>r.status==='mismatch').length;
  const errors=items.filter(r=>r.status==='error').length;
  return {
    schemaVersion:1,profileLabel:profile.label,gameVersion:input.gameVersion,
    profileGameVersion:profileVersion,versionMismatch,
    kind:profile.provenance.status,
    summary:{total:items.length,matches,mismatches,errors},
    assessment:'RESEARCH ONLY: matching user-entered values is not verified game accuracy or permission to redistribute a game dataset.',
    sourceReview:'All observations need human evidence, version, and licensing review.',
    items
  };
}
export function arReportCsv(report){
  const quote=value=>'"'+String(value===null||value===undefined?'':value).replace(/"/g,'""')+'"';
  const cols=['id','status','computed','expected','delta','evidenceKind','evidenceReference','reviewStatus','error'];
  return [cols.join(','),...report.items.map(item=>cols.map(c=>quote(item[c])).join(','))].join('\r\n')+'\r\n';
}
