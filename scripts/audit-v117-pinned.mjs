#!/usr/bin/env node
/**
 * Intentionally opt-in executable for an anonymized arithmetic source audit.
 * Fetches a pinned public JSON file from GitHub; never imports/evals that file.
 * Source file and weapon-specific calculated AR are never written to disk.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {downloadV117Source,V117_UPSTREAM_COMMIT} from '../public/src/upstream-regulation-v117.mjs';
import {auditRawMathParity} from '../public/src/regulation-parity.mjs';

const output=resolve(process.cwd(),'.audit/v117-math-audit.json');
async function main(){
 if(process.argv.length!==2)throw Error('This audit accepts no arbitrary URL or executable file arguments.');
 const start=Date.now();
 const {text,summary}=await downloadV117Source(fetch);
 // The file is strict JSON despite having a .js filename.
 const params=JSON.parse(text);
 const report=auditRawMathParity(params,{
  gameVersion:'1.17',sourceReference:'Public pinned source @ '+V117_UPSTREAM_COMMIT,
  maxRows:5000,maxExamples:25,
  onProgress:({processed,total})=>{
   if(processed%500===0||processed===total)
    console.log('[AR MATH AUDIT] Progress '+processed+'/'+total);
  }
 });
 const result={...report,
  source:{commit:V117_UPSTREAM_COMMIT,version:summary.version,
   variantCount:summary.entries,dlcVariantCount:summary.dlcRows,
   sourceDataNotBundled:true,rawParametersNotExported:true},
  durationSeconds:Math.round((Date.now()-start)/1000),
  performedOn:'public-pinned-1.17-parameter-snapshot',
  inGameCertified:false
 };
 await mkdir(dirname(output),{recursive:true});
 await writeFile(output,JSON.stringify(result,null,2)+'\n','utf8');
 console.log('[AR MATH AUDIT] variants='+result.totalRows+
  ' converted='+result.converted+' cases='+result.compared+
  ' mismatches='+result.mismatched+' unsupported='+result.unsupported);
 console.log('[AR MATH AUDIT] source=public pinned v1.17; pass='+result.parityPass+
  '; actual-game-verified=false; artifacts contain NO weapon data or AR values.');
 if(!result.parityPass){
  console.error('[AR MATH AUDIT] FAILURE CATEGORIES '+JSON.stringify(result.errorsByReason));
  process.exitCode=1;
 }
}
main().catch(e=>{console.error('[AR MATH AUDIT] Failed: '+e.message);process.exitCode=2;});
