import {listCompactWeaponNames,searchLocalWeapons,describeLocalWeapon,compareLocalGrips} from './ar-workbench-core.mjs';

/**
 * Worker holds the loaded JSON only in memory, not in localStorage, caches,
 * service workers, IndexedDB or on a server. No fetch / network calls.
 */
let source=null,names=[],version='',reference='',selected=null;
self.onmessage=event=>{
 const m=event.data||{};
 try{
  switch(m.op){
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
    source=next;names=indexed;selected=null;
    self.postMessage({op:'loaded',count:names.length,preview:searchLocalWeapons(names,'')});
    break;
   }
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
    self.postMessage({op:'compared',result:compareLocalGrips(selected,m.stats,m.upgrade)});
    break;
   case 'clear':
    source=null;names=[];version='';reference='';selected=null;
    self.postMessage({op:'cleared'});
    break;
   default:throw new RangeError('Unknown workbench command.');
  }
 }catch(error){
  if(m.op==='load'){source=null;names=[];selected=null;}
  if(m.op==='select')selected=null;
  self.postMessage({op:'error',phase:m.op||'unknown',message:String(error?.message??error).slice(0,350)});
 }
};
