/** Read-only evidence checker: independently recalculate captured live-site AR
 * from our own AR engine with an opt-in pinned public v1.17 source.
 *
 * IMPORTANT: a matching single-run observation is NOT a passed reference
 * acceptance case. The 35 new candidates require a separate repeat run and
 * explicit review before ever entering TARNISHED_REFERENCE_AR_CASES.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {convertCompactRegulation} from '../public/src/regulation-import.mjs';
import {calculateAr} from '../public/src/weapon-ar.mjs';
import {TARNISHED_V117_AFFINITIES} from '../public/src/tarnished-same-input.mjs';
import {downloadV117Source} from '../public/src/upstream-regulation-v117.mjs';

const error=message=>{throw new RangeError(message);};
export function compareTarnishedChromeObservations(snapshot,source){
 if(!snapshot||snapshot.comparatorVersion!=='v1.17'||
  !Array.isArray(snapshot.cases)||!source||!Array.isArray(source.weapons))
  error('Expected version-labelled raw public Chrome observations and a validated v1.17 source.');
 const results=[];
 for(const result of snapshot.cases){
  const c=result?.request;
  if(!c||typeof c.id!=='string'||c.id!==result.id){
   results.push({id:result?.id??'UNKNOWN',status:'malformed-observation'});continue;
  }
  const affinityId=c.affinity==='None'?-1:TARNISHED_V117_AFFINITIES.indexOf(c.affinity);
  // Tarnished.dev's SPA replaces the address bar with /build-planner after
  // parsing build query parameters. Verify the actual page origin/path and
  // separately verify rendered input values; a retained query is NOT required.
  let siteUrlValid=false;
  try{
   const u=new URL(result.url);
   siteUrlValid=u.protocol==='https:'&&u.hostname==='www.tarnished.dev'&&
    u.pathname==='/build-planner'&&!u.hash;
  }catch{/* absent or invalid page URL remains untrusted */}
  const valid=(c.affinity==='None'||affinityId>=0)&&siteUrlValid&&
   Number.isInteger(result.observedAr)&&result.observedAr>=0&&
   result.status==='INPUT-VERIFIED-AR'&&result.verifiedInputs===true&&
   typeof result.version==='string'&&result.version.includes('v1.17')&&
   typeof result.browserWeaponBlock==='string'&&
   result.browserWeaponBlock.includes('Total AR : '+result.observedAr);
  if(!valid){
   results.push({id:c.id,weapon:c.weaponName??'Uchigatana',
    status:'unverified-live-input',observed:result.observedAr??null,
    sourceStatus:result.status??'unavailable'});continue;
  }
  const name=c.weaponName||'Uchigatana';
  const variants=source.weapons.filter(w=>(w?.weaponName??w?.name)===name&&
   w.affinityId===affinityId);
  if(variants.length!==1){
   results.push({id:c.id,weapon:name,status:variants.length?
    'ambiguous-variant':'source-variant-unavailable',observed:result.observedAr});continue;
  }
  try{
   const profile=convertCompactRegulation(source,{
    weaponName:variants[0].name,gameVersion:'1.17',
    sourceReference:'Pinned public v1.17 source · user-initiated external reference'
   });
   const stats={str:c.str,dex:c.dex,int:c.int??10,fai:c.fai??10,arc:c.arc??10};
   const actual=calculateAr(profile,stats,{
    affinity:'SOURCE AFFINITY',upgrade:c.upgrade,twoHanded:c.twoHanded
   }).total;
   results.push({id:c.id,weapon:name,affinity:c.affinity,
    upgrade:c.upgrade,reinforcement:c.somber?'somber':'regular',
    source:'tarnished.dev rendered public v1.17 UI',observed:result.observedAr,
    calculated:actual,delta:actual-result.observedAr,
    status:actual===result.observedAr?'matched-unpromoted':'numeric-mismatch',
    needsIndependentRepeat:true
   });
  }catch(e){
   results.push({id:c.id,weapon:name,status:'source-conversion-blocked',
    observed:result.observedAr,reason:String(e?.message??e).slice(0,160)});
  }
 }
 const counts={total:results.length,
  numericallyMatched:results.filter(x=>x.status==='matched-unpromoted').length,
  numericMismatches:results.filter(x=>x.status==='numeric-mismatch').length,
  unverifiedOrBlocked:results.filter(x=>!['matched-unpromoted','numeric-mismatch'].includes(x.status)).length,
  newApprovedCases:0
 };
 return {source:'Tarnished.dev public v1.17 with independently calculated AR',
  comparatorOnly:true,gameClientVerificationRequired:false,
  qualification:'A single browser run does NOT approve the fresh 18 reference candidates. Repeat UI capture and independent review are required before promotion.',
  counts,results};
}
export async function run(){
 const path=resolve('.audit/tarnished-chrome-ui.json');
 const snapshot=JSON.parse(await readFile(path,'utf8'));
 if(snapshot.priorCaseCount!==15||snapshot.newCandidateCount!==35||
  snapshot.freshCandidateCount!==18||snapshot.cases?.length!==68)
  error('Raw Chrome probe did not contain all 50 prior + 18 fresh observations.');
 const {text}=await downloadV117Source(fetch);
 const comparison=compareTarnishedChromeObservations(snapshot,JSON.parse(text));
 const out=resolve('.audit/tarnished-chrome-comparison.json');
 await mkdir(dirname(out),{recursive:true});
 await writeFile(out,JSON.stringify(comparison,null,2)+'\n','utf8');
 console.log('[COMPARATOR] '+JSON.stringify(comparison.counts));
 for(const item of comparison.results.slice(50)) console.log('[FRESH COMPARE] '+JSON.stringify(item));
 console.log('[COMPARATOR] '+comparison.qualification);
 for(const r of comparison.results){
  if(r.status!=='matched-unpromoted')
   console.log('[COMPARATOR BLOCKER] '+r.id+' '+r.status+
    (r.delta===undefined?'':' delta='+r.delta));
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 await run();
