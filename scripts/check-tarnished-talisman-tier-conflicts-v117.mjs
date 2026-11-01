#!/usr/bin/env node
/**
 * Compare TWO independent actual public v1.17 Chrome passes per scenario.
 * This is a selection-behavior audit, not game-client or damage-model proof.
 * Expose exact DOM snapshots in a PR comment and fail closed on disagreement.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const rows=[];const problems=[];
const equal=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
const details=x=>({
  selectedNames:x.actualSelectedNames,observedSelection:x.observedSelection,
  clicks:x.clicks.map(k=>({ok:k.ok,why:k.why??null,name:k.name,status:k.status??null})),
  actual:{stats:x.actual.stats,HP:x.actual.extras?.HP,FP:x.actual.extras?.FP,
   Stamina:x.actual.extras?.Stamina,load:x.actual.load,maxEquipLoad:x.actual.maxEquipLoad,
   negation:x.actual.negation,version:x.actual.version}
});
for(let shard=0;shard<4;shard++){
 const source=[];
 for(const pass of [1,2]){
  const file=resolve('.audit/v117-talisman-gate-'+shard+'-pass-'+pass+'.json');
  try{source.push(JSON.parse(await readFile(file,'utf8')))}
  catch(e){problems.push('Missing or broken run: '+file+' '+e.message)}
 }
 if(source.length!==2)continue;
 for(let offset=0;offset<2;offset++){
  const index=shard*2+offset;
  const a=source[0].rows[offset],b=source[1].rows[offset];
  if(!a||!b||a.index!==index||b.index!==index){
   problems.push('Missing or mis-indexed row '+index);continue;
  }
  if(!a.valid||!b.valid)
   problems.push('Incomplete source selection for '+index+' '+a.names.join(' + '));
  if(!equal(a.names,b.names)||!equal(details(a),details(b)))
   problems.push('Independent browser mismatch for '+index+' '+a.names.join(' + '));
  rows.push({index,names:a.names,pass1:details(a),pass2:details(b),
   matched:a.valid&&b.valid&&equal(details(a),details(b))});
 }
}
if(rows.length!==8)problems.push('Expected 8 independently repeated scenarios; got '+rows.length);
const escaped=s=>String(s).replaceAll('|','\\|');
let body='# Public v1.17 talisman selector: two fresh Chromium reads\n\n';
body+='Reference-only selection outcomes; **not** proof of game-client legality, damage or arithmetic stacking.\n\n';
body+='| Test | Requested order | Public selector after two clicks | Independent passes |\n|---|---|---|---|\n';
for(const x of rows){
 body+='| '+x.index+' | '+x.names.map(escaped).join(' → ')+' | '+
  x.pass1.observedSelection+'; '+x.pass1.selectedNames.map(escaped).join(', ')+
  ' | '+(x.matched?'MATCH':'DISPUTED')+' |\n';
}
body+='\n**Overall:** '+(problems.length?'NOT CERTIFIED':'BOTH PASSES AGREED ON ALL EIGHT SCENARIOS')+'\n\n';
if(problems.length)body+='**Problems:**\n'+problems.map(x=>'- '+x).join('\n')+'\n\n';
body+='Actual field snapshots: [download eight JSON artifacts from the Actions run] (see job artifacts). No numerical goldens are imported by this discovery audit.\n';
await mkdir(resolve('.audit'),{recursive:true});
await writeFile(resolve('.audit/talisman-gate-audit-comment.md'),body);
await writeFile(resolve('.audit/talisman-gate-audit-summary.json'),JSON.stringify({
 status:problems.length?'NOT_CERTIFIED':'DOUBLE_READ_MATCH',problems,rows
},null,2)+'\n');
console.log(body);
if(problems.length)process.exitCode=1;
