import {auditCurrentRegulationConflicts} from './current-regulation-conflict-audit.mjs';
self.onmessage=({data:m})=>{
 if(!m||m.op!=='audit-seven')return;
 try{
  const source=JSON.parse(m.sourceText);
  const report=auditCurrentRegulationConflicts(m.catalog,m.ledger,source,m.meta);
  self.postMessage({op:'audit-result',revision:m.revision,report});
 }catch(e){
  self.postMessage({op:'audit-error',revision:m.revision,
   message:e instanceof SyntaxError?'The selected file is not valid JSON.':e.message});
 }
};