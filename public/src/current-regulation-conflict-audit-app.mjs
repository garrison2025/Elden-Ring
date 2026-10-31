import {validateCommunityCatalog} from './community-weapons.mjs';

const id=x=>document.getElementById('reg-seven-'+x);
const make=(tag,s)=>{const e=document.createElement(tag);if(s!==undefined)e.textContent=String(s);return e;};
const status=(message,isBad=false)=>{
 id('feedback').textContent=message;
 id('feedback').className=isBad?'feedback bad':'note';
};
let catalog=null,ledger=null,worker=null,revision=0,report=null;
function clearReport(){
 report=null;id('results').hidden=true;id('table').replaceChildren();
 id('download').disabled=true;
}
function showReport(result){
 clearReport();report=result;
 const c=result.counts;
 id('summary').textContent=c.compared+' / 7 uniquely compared; '+c.pinnedMatches+
  ' match pinned 1.17; '+c.communityMatches+' match original community; '+
  c.neitherMatches+' match neither; '+(c.unmatched+c.ambiguous+c.invalid)+
  ' unmatched, ambiguous or invalid. File version is USER-DECLARED, not authenticated.';
 id('version').textContent='Declared App '+result.declaredGameAppVersion+
  ' / Regulation '+result.declaredRegulationVersion+
  (result.declaredTargetMatches?' (matches requested target TEXT only).':
   ' (DIFFERS from intended 1.17.2 / 1.17.3 target).')+
  ' Local file SHA-256: '+(result.sourceFileSha256||'not computed')+
  '. Game verified: NO · Reviewed screenshot goldens added: 0.';
 for(const row of result.results){
  const tr=make('tr'),name=make('th',row.name),kind=make('td',row.field==='baseAttack'?'+0 base attack':'requirements');
  name.scope='row';
  const numbers=x=>Array.isArray(x)?x.join(' / '):'—';
  const cells=[
   kind,make('td',numbers(row.community)),make('td',numbers(row.pinned)),
   make('td',numbers(row.sourceValues)),
   make('td',row.sourceStatus==='compared'?
    (row.matchPinned?'Matches pinned':'Differs from pinned')+'; '+
    (row.matchCommunity?'matches community':'differs from community'):
    row.sourceStatus.toUpperCase())
  ];
  tr.append(name,...cells);id('table').append(tr);
 }
 id('results').hidden=false;id('download').disabled=false;
 status('Local comparison completed. No source file uploaded or stored. These are UNREVIEWED parameter-source differences; the six contested AR inputs remain blocked.');
}
async function init(){
 try{
  const [a,b]=await Promise.all([
   fetch('../data/community-weapon-catalog.json',{cache:'no-store'}),
   fetch('../data/weapon-conflict-evidence.json',{cache:'no-store'})
  ]);
  if(!a.ok||!b.ok)throw Error('Unable to load bundled catalog or seven-case source ledger.');
  catalog=validateCommunityCatalog(await a.json());ledger=await b.json();
  if(ledger.cases?.length!==7)throw Error('Site conflict evidence is not the expected seven-case dataset.');
  worker=new Worker(new URL('./current-regulation-conflict-audit-worker.mjs',import.meta.url),{type:'module'});
  worker.onmessage=({data:m})=>{
   if(m.revision!==revision)return;
   id('run').disabled=false;
   if(m.op==='audit-result')showReport(m.report);
   else if(m.op==='audit-error'){clearReport();status('Local file comparison rejected: '+m.message,true);}
  };
  worker.onerror=()=>{
   revision++;clearReport();id('run').disabled=true;
   status('Local worker failed. No values or approvals were produced.',true);
  };
  id('run').disabled=false;
  status('Ready to examine a user-supplied compact Regulation JSON locally. No file contents leave your browser.');
 }catch(e){status('Cannot start seven-case local source audit: '+e.message,true);}
}
id('run').addEventListener('click',async()=>{
 const file=id('file').files?.[0];
 const app=id('app').value.trim(),reg=id('regulation').value.trim(),sourceDescription=id('source').value.trim();
 if(!file||file.size<10||file.size>30*1024*1024||!/\.json$/i.test(file.name)){
  status('Select one local .json compact regulation file between 10 bytes and 30 MB.',true);return;
 }
 if(!app||app.length>40||!reg||reg.length>40||!sourceDescription||sourceDescription.length>240){
  status('Enter a short, truthful App version, Regulation version and origin description. These are self-declared, not authenticated.',true);return;
 }
 const current=++revision;clearReport();id('run').disabled=true;
 status('Reading and fingerprinting the local file. Nothing is uploaded.');
 try{
  const bytes=await file.arrayBuffer();
  if(current!==revision)return;
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  const hash=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const sourceText=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  if(current!==revision)return;
  worker.postMessage({op:'audit-seven',revision:current,
   sourceText,catalog,ledger,meta:{gameAppVersion:app,regulationVersion:reg,
    sourceDescription,sourceFileSha256:hash}});
 }catch(e){id('run').disabled=false;status('Cannot read file locally: '+e.message,true);}
});
id('clear').addEventListener('click',()=>{
 revision++;clearReport();id('file').value='';id('run').disabled=!worker;
 status('Local session cleared. No file was uploaded.');
});
id('download').addEventListener('click',()=>{
 if(!report)return;
 const blob=new Blob([JSON.stringify(report,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=make('a');
 a.href=url;a.download='seven-current-regulation-source-audit-UNREVIEWED.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
});
init();