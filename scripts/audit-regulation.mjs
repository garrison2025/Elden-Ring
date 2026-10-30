#!/usr/bin/env node
/**
 * Analyze a locally provided JSON regulation dataset. Never downloads game
 * files or distributes weapon parameters. Output is aggregated/anonymized.
 */
import {readFile,stat,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {auditCompactRegulation} from '../public/src/regulation-audit.mjs';
const usage=()=>{
 console.log('Usage: node scripts/audit-regulation.mjs --input local-ar-data/regulation.json --version 1.17 --source "rights/source note" [--out local-ar-data/audit-report.json]');
 console.log('Structure-only; outputs no weapon names, bundles no game data, and never certifies redistribution rights or accuracy.');
};
const args=process.argv.slice(2);
async function main(){
 if(args.length===1&&args[0]==='--help'){usage();return;}
 const allowed=new Set(['--input','--version','--source','--out']);
 if(args.length%2!==0)throw Error('Arguments must be --flag value pairs.');
 const opts=new Map();
 for(let i=0;i<args.length;i+=2){
  const k=args[i],v=args[i+1];
  if(!allowed.has(k)||opts.has(k)||!v)throw Error('Invalid or repeated argument: '+k);
  opts.set(k,v);
 }
 for(const k of ['--input','--version','--source'])if(!opts.has(k))throw Error('Required argument missing: '+k);
 const input=resolve(opts.get('--input'));
 if(extname(input).toLowerCase()!=='.json')throw Error('Input must be JSON; no JS code or game binaries are executed.');
 const info=await stat(input);
 if(!info.isFile()||info.size>16000000)throw Error('Input must be a file of at most 16 MB.');
 const raw=await readFile(input,'utf8');
 const data=JSON.parse(raw);
 const report=auditCompactRegulation(data,{
  gameVersion:opts.get('--version'),sourceReference:opts.get('--source')
 });
 report.sourceSha256=createHash('sha256').update(raw).digest('hex');
 const serialized=JSON.stringify(report,null,2)+'\n';
 if(opts.has('--out')){
  const output=resolve(opts.get('--out'));
  if(extname(output).toLowerCase()!=='.json'||output===input)throw Error('Output must be a different .json file.');
  await mkdir(dirname(output),{recursive:true});
  await writeFile(output,serialized,'utf8');
  console.log('Local anonymized audit saved to '+output);
 }else console.log(serialized);
 console.log('Records:',report.totals.records,'| convertible:',report.totals.convertible,
  '| blocked:',report.totals.blocked,'| structural coverage:',report.conversionCoverage+'%');
 console.log('Limited-model scope review:',report.scopeReview.needsReview,
  '| provisional candidate coverage:',report.scopeReview.limitedModelCoverage+'%');
 console.log('NOT PUBLISHABLE: structural success never certifies rights, game parity or unsupported effects.');
 if(report.totals.blocked>0||report.scopeReview.needsReview>0)process.exitCode=1;
}
main().catch(e=>{console.error('Audit failed:',e.message);usage();process.exitCode=2;});
