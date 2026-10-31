import {listCompactWeaponNames,searchLocalWeapons,findLocalWeaponFamily,describeLocalWeapon,compareLocalGrips,compareLocalFamilyAffinities} from './ar-workbench-core.mjs';
import {COMPACT_SYNTHETIC_REGULATION} from '../data/ar-compact-synthetic.mjs';
import {rankLocalWeaponVariants} from './ar-cross-weapon-ranking.mjs';
import {compareWeaponPair} from './ar-weapon-compare.mjs';
import {auditCompactRegulation} from './regulation-audit.mjs';
import {auditRawMathParity} from './regulation-parity.mjs';
import {calculateSourceUpgradeProgression} from './ar-upgrade-progression.mjs';
import {recheckUnreviewedArDraft} from './ar-observation-recheck.mjs';
import {calculateStatInvestmentSensitivity} from './ar-stat-sensitivity.mjs';
import {createLocalArValidationPlan} from './ar-game-validation-plan.mjs';
import {recheckUnreviewedArBatch} from './ar-observation-batch-recheck.mjs';

/**
 * Worker holds the loaded JSON only in memory, not in localStorage, caches,
 * service workers, IndexedDB or on a server. No fetch / network calls.
 */
let source=null,names=[],version='',reference='',selected=null,selectedB=null,selectedScopeFlags=[],synthetic=false;
self.onmessage=event=>{
 const m=event.data||{};
 try{
  switch(m.op){
   case 'demo':{
    source=structuredClone(COMPACT_SYNTHETIC_REGULATION);synthetic=true;
    version='SYNTHETIC-EXAMPLE-NOT-GAME';
    reference='Invented regression fixture. Not a game weapon database.';
    names=listCompactWeaponNames(source);selected=null;selectedB=null;selectedScopeFlags=[];
    self.postMessage({op:'loaded',count:names.length,synthetic:true,preview:searchLocalWeapons(names,'')});
    break;
   }
   case 'load':{
    if(typeof m.text!=='string'||m.text.length>16_000_000)
      throw new RangeError('Please choose a local JSON file smaller than 16 MB.');
    version=String(m.version??'').trim();
    reference=String(m.reference??'').trim();
    if(!version||version.length>60||!reference||reference.length>300)
      throw new RangeError('Game version and provenance are required.');
    const next=JSON.parse(m.text);
    const indexed=listCompactWeaponNames(next);
    if(!indexed.length)throw new RangeError('The file contains no weapon entries.');
    source=next;names=indexed;selected=null;selectedB=null;selectedScopeFlags=[];synthetic=false;
    self.postMessage({op:'loaded',count:names.length,synthetic:false,preview:searchLocalWeapons(names,'')});
    break;
   }
   case 'audit':
    if(!source)throw new RangeError('Import a local regulation JSON file first.');
    self.postMessage({op:'audit-complete',report:auditCompactRegulation(source,{
      gameVersion:version,sourceReference:reference,maxExamples:40,
      onProgress:progress=>self.postMessage({op:'audit-progress',progress})})});
    break;
   case 'math-audit':
    if(!source)throw new RangeError('Import a local regulation JSON file first.');
    self.postMessage({op:'math-audit-complete',report:auditRawMathParity(source,{
      gameVersion:version,sourceReference:reference,maxExamples:20,
      onProgress:progress=>self.postMessage({op:'math-audit-progress',progress})})});
    break;
   case 'rank-variants':{
    if(!source)throw new RangeError('Load an opt-in source before ranking weapons.');
    self.postMessage({op:'ranked-variants',requestId:m.requestId,
     result:rankLocalWeaponVariants(source,{
      term:m.term,affinityId:m.affinityId,regularUpgrade:m.regularUpgrade,
      somberUpgrade:m.somberUpgrade,stats:m.stats,twoHanded:m.twoHanded,
      gameVersion:version,sourceReference:reference
     }),synthetic});
    break;
   }
   case 'family':
    if(!source)throw new RangeError('Import a local regulation JSON file first.');
    self.postMessage({op:'family-results',requestId:m.requestId,
      result:findLocalWeaponFamily(source,m.name)});
    break;
   case 'search':
    if(!source)throw new RangeError('Import a local regulation JSON file first.');
    self.postMessage({op:'search-results',requestId:m.requestId,result:searchLocalWeapons(names,m.term??'')});
    break;
   case 'select':{
    if(!source)throw new RangeError('Import a local regulation JSON file first.');
    const found=describeLocalWeapon(source,m.name,version,reference);
    selected=found.profile;selectedScopeFlags=found.description.scopeFlags;
    self.postMessage({op:'selected',requestId:m.requestId,description:found.description});
    break;
   }
   case 'compare':
    if(!selected)throw new RangeError('Choose a weapon and reinforcement level first.');
    self.postMessage({op:'compared',requestId:m.requestId,result:compareLocalGrips(selected,m.stats,m.upgrade)});
    break;
   case 'game-validation-plan':{
    if(!selected)throw new RangeError('Select an exact source weapon first.');
    const plan=createLocalArValidationPlan(selected,m.stats,{
     maxCases:24,scopeFlags:selectedScopeFlags});
    plan.synthetic=synthetic;
    self.postMessage({op:'game-validation-plan-result',requestId:m.requestId,result:plan});
    break;
   }
   case 'stat-sensitivity':{
    if(!selected)throw new RangeError('Select an exact source weapon before probing stats.');
    const result=calculateStatInvestmentSensitivity(selected,m.stats,{
     upgrade:m.upgrade,twoHanded:m.twoHanded});
    self.postMessage({op:'stat-sensitivity-result',requestId:m.requestId,result});
    break;
   }
   case 'upgrade-progression':{
    if(!selected)throw new RangeError('Select an exact source weapon first.');
    self.postMessage({op:'upgrade-progression-result',requestId:m.requestId,
     result:calculateSourceUpgradeProgression(selected,m.stats)});
    break;
   }
   case 'recheck-observation':{
    if(!source)throw new RangeError('Load the candidate parameter source first.');
    if(typeof m.text!=='string'||m.text.length>120000)
     throw new RangeError('Observation JSON must be smaller than 120 kB.');
    const draft=JSON.parse(m.text);
    const result=draft?.recordType==='unreviewed-game-menu-AR-observation-batch'?
     recheckUnreviewedArBatch(source,{gameVersion:version,sourceReference:reference,
      batch:draft,synthetic}):
     recheckUnreviewedArDraft(source,{gameVersion:version,sourceReference:reference,
      draft,synthetic});
    self.postMessage({op:'recheck-observation-result',requestId:m.requestId,result});
    break;
   }
   case 'family-compare':{
     if(!source)throw new RangeError('Load a local regulation source first.');
     const result=compareLocalFamilyAffinities(source,m.name,version,reference,m.stats,
      {upgrade:m.upgrade,twoHanded:m.twoHanded});
     self.postMessage({op:'family-compared',requestId:m.requestId,result});
     break;
    }
    case 'selectB':{
    if(!source)throw new RangeError('Import a local file before choosing weapon B.');
    const found=describeLocalWeapon(source,m.name,version,reference);
    selectedB=found.profile;
    self.postMessage({op:'selectedB',requestId:m.requestId,description:found.description});
    break;
   }
   case 'compare-weapons':{
    if(!selected||!selectedB)throw new RangeError('Choose two weapon entries first.');
    const result=compareWeaponPair(selected,selectedB,m.stats,{
      leftUpgrade:m.leftUpgrade,rightUpgrade:m.rightUpgrade,twoHanded:m.twoHanded});
    self.postMessage({op:'compared-weapons',requestId:m.requestId,result});
    break;
   }
   case 'clear':
    source=null;names=[];version='';reference='';selected=null;selectedB=null;selectedScopeFlags=[];synthetic=false;
    self.postMessage({op:'cleared'});
    break;
   default:throw new RangeError('Unknown workbench command.');
  }
 }catch(error){
  if(m.op==='load'){source=null;names=[];selected=null;}
  if(m.op==='select'){selected=null;selectedScopeFlags=[];}
  if(m.op==='selectB')selectedB=null;
  self.postMessage({op:'error',phase:m.op||'unknown',requestId:m.requestId,message:String(error?.message??error).slice(0,350)});
 }
};
