import {listCompactWeaponNames,searchLocalWeapons,describeLocalWeapon,compareLocalGrips} from './ar-workbench-core.mjs';
import {COMPACT_SYNTHETIC_REGULATION} from '../data/ar-compact-synthetic.mjs';
import {compareWeaponPair} from './ar-weapon-compare.mjs';
import {auditCompactRegulation} from './regulation-audit.mjs';
import {auditRawMathParity} from './regulation-parity.mjs';

/**
 * Worker holds the loaded JSON only in memory, not in localStorage, caches,
 * service workers, IndexedDB or on a server. No fetch / network calls.
 */
let source=null,names=[],version='',reference='',selected=null,selectedB=null;
self.onmessage=event=>{
 const m=event.data||{};
 try{
  switch(m.op){
   case 'demo':{
    source=structuredClone(COMPACT_SYNTHETIC_REGULATION);
    version='SYNTHETIC-EXAMPLE-NOT-GAME';
    reference='Invented regression fixture. Not a game weapon database.';
    names=listCompactWeaponNames(source);selected=null;selectedB=null;
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
    source=next;names=indexed;selected=null;selectedB=null;
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
   case 'search':
    if(!source)throw new RangeError('Import a local regulation JSON file first.');
    self.postMessage({op:'search-results',result:searchLocalWeapons(names,m.term??'')});
    break;
   case 'select':{
    if(!source)throw new RangeError('Import a local regulation JSON file first.');
    const found=describeLocalWeapon(source,m.name,version,reference);
    selected=found.profile;
    self.postMessage({op:'selected',description:found.description});
    break;
   }
   case 'compare':
    if(!selected)throw new RangeError('Choose a weapon and reinforcement level first.');
    self.postMessage({op:'compared',requestId:m.requestId,result:compareLocalGrips(selected,m.stats,m.upgrade)});
    break;
   case 'selectB':{
    if(!source)throw new RangeError('Import a local file before choosing weapon B.');
    const found=describeLocalWeapon(source,m.name,version,reference);
    selectedB=found.profile;
    self.postMessage({op:'selectedB',description:found.description});
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
    source=null;names=[];version='';reference='';selected=null;selectedB=null;
    self.postMessage({op:'cleared'});
    break;
   default:throw new RangeError('Unknown workbench command.');
  }
 }catch(error){
  if(m.op==='load'){source=null;names=[];selected=null;}
  if(m.op==='select')selected=null;
  if(m.op==='selectB')selectedB=null;
  self.postMessage({op:'error',phase:m.op||'unknown',message:String(error?.message??error).slice(0,350)});
 }
};
