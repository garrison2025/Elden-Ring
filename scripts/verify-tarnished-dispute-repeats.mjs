/** Strict, evidence-backed TWO independent Tarnished.dev v1.17 UI runs.
 * No single-run observations are approved. Every observation is preserved.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {V117_DISPUTED_UI_CANDIDATES} from './tarnished-v117-disputed-candidates.mjs';
export function compareDisputeRounds(first,second,{candidates=V117_DISPUTED_UI_CANDIDATES}={}){
 if(!Array.isArray(first?.results)||!Array.isArray(second?.results))throw new RangeError('Two complete comparison reports required.');
 const ids=candidates.map(c=>c.id);
 const a=new Map(first.results.map(r=>[r.id,r])),b=new Map(second.results.map(r=>[r.id,r]));
 if(a.size!==ids.length||b.size!==ids.length||first.results.length!==ids.length||second.results.length!==ids.length)
  throw new RangeError('Both rounds must contain all distinct dispute candidates, no extra or missing rows.');
 const rows=ids.map(id=>{
  const x=a.get(id),y=b.get(id);
  if(!x||!y)throw new RangeError('Dispute comparison missing ID '+id);
  const bothExact=x.status==='matched-unpromoted'&&y.status==='matched-unpromoted'&&
   x.observed===y.observed&&x.calculated===y.calculated&&x.delta===0&&y.delta===0;
  const anyMismatch=x.status==='numeric-mismatch'||y.status==='numeric-mismatch';
  return {id,weapon:x.weapon??y.weapon??null,
   observedFirst:x.observed??null,observedSecond:y.observed??null,
   localFirst:x.calculated??null,localSecond:y.calculated??null,
   deltaFirst:x.delta??null,deltaSecond:y.delta??null,
   status:bothExact?'TWICE_MATCHED':anyMismatch?'NUMERIC_MISMATCH':
    x.status==='matched-unpromoted'&&y.status==='matched-unpromoted'?
     'INCONSISTENT_SOURCE_OBSERVATION':'NOT_VERIFIED',
   sourceStatusFirst:x.status,sourceStatusSecond:y.status};
 });
 const counts={total:rows.length,twiceMatched:rows.filter(x=>x.status==='TWICE_MATCHED').length,
  mismatched:rows.filter(x=>x.status==='NUMERIC_MISMATCH').length,
  inconsistent:rows.filter(x=>x.status==='INCONSISTENT_SOURCE_OBSERVATION').length,
  notVerified:rows.filter(x=>x.status==='NOT_VERIFIED').length};
 return {source:'Tarnished.dev public v1.17 live Chromium UI',countedAsNewApproved:0,
   qualification:'AR parity of tested inputs does not resolve missing weapon weight or prove all individual source fields.',counts,rows};
}
export async function run(){
 const [one,two]=await Promise.all(['.audit/dispute-first.json','.audit/tarnished-chrome-comparison.json']
   .map(path=>readFile(resolve(path),'utf8').then(JSON.parse)));
 const report=compareDisputeRounds(one,two);
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-dispute-repeat-audit.json'),JSON.stringify(report,null,2)+'\n');
 console.log('[DISPUTE 2-RUN] '+JSON.stringify(report.counts));
 for(const row of report.rows)console.log('[DISPUTE 2-RUN ROW] '+JSON.stringify(row));
 if(report.counts.inconsistent>0)throw new Error('Different competitor readouts across repeated same-input runs: investigate.');
 if(report.counts.mismatched>0)throw new Error('Comparator mismatch exists; investigate before any approval.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await run();
