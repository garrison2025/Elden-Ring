/** Conservative comparator-only weight inference from TWO independent public
 * Tarnished.dev v1.17 Build UI equip-load readings for empty vs one item.
 * No inference from AR, no third-party weights, no automatic catalog writes.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {V117_WEIGHT_BATCH2_CANDIDATES} from './tarnished-v117-weight-batch2-candidates.mjs';
import {V117_WEIGHT_FINAL37_CANDIDATES} from './tarnished-v117-weight-final37-candidates.mjs';
const fail=s=>{throw new RangeError(s)};
const HISTORIC_TARGETS=['missing-albinauric-shield','missing-brass-shield',
 'missing-fingerprint-stone-shield','missing-golden-greatshield','missing-great-turtle-shell'];
const BASELINE=['baseline-no-items','known-longsword-rh1','known-longsword-lh1'];
const batch2=process.env.TARNISHED_WEIGHT_BATCH==='2';
const batch3=process.env.TARNISHED_WEIGHT_BATCH==='3';
const TARGETS=batch3?V117_WEIGHT_FINAL37_CANDIDATES.map(x=>x.id):batch2?V117_WEIGHT_BATCH2_CANDIDATES.map(x=>x.id):HISTORIC_TARGETS;
const CANDIDATES=batch2||batch3?[...BASELINE,...TARGETS]:[...BASELINE,...TARGETS,
 'conflict-stone-sheathed','conflict-fire-knights-shortsword',
 'conflict-radahn-light','conflict-ritual-thrusting-shield'];
const round3=n=>Math.round(n*1000)/1000;
export function comparePublicItemWeights(first,second,catalog){
 if(!Array.isArray(first?.cases)||!Array.isArray(second?.cases)||
   !Array.isArray(catalog?.weapons))fail('Need two raw real-site observations and the local catalog.');
 const makeMap=rows=>{
  if(rows.length!==CANDIDATES.length)fail('Unexpected field probe length');
  const map=new Map(rows.map(x=>[x.id,x]));
  if(map.size!==rows.length||CANDIDATES.some(id=>!map.has(id)))fail('Duplicate, missing or extra field probe ID');
  return map;
 };
 const a=makeMap(first.cases),b=makeMap(second.cases);
 const check=x=>x?.status==='INPUT_AND_ITEM_VERIFIED'&&
  x.version==='Elden Ring Version: v1.17'&&
  x.equipCap===48.2&&Number.isFinite(x.equipLoad)&&x.equipLoad>=0;
 const baseline=a.get('baseline-no-items'),baseline2=b.get('baseline-no-items');
 const verifiedBaseline=check(baseline)&&check(baseline2)&&
  baseline.equipLoad===0&&baseline2.equipLoad===0;
 const known1=a.get('known-longsword-rh1'),known2=b.get('known-longsword-rh1'),
  knownLeft=a.get('known-longsword-lh1'),knownLeft2=b.get('known-longsword-lh1');
 const knownControl=verifiedBaseline&&[known1,known2,knownLeft,knownLeft2]
  .every(x=>check(x)&&x.requested==='Longsword'&&x.equipLoad===3.5);
 const catalogNames=new Map(catalog.weapons.map(x=>[x.name,x]));
 const rows=CANDIDATES.filter(id=>!id.startsWith('baseline-')&&!id.startsWith('known-'))
  .map(id=>{
   const x=a.get(id),y=b.get(id),row=catalogNames.get(x.requested);
   const good=Boolean(knownControl&&check(x)&&check(y)&&x.requested===y.requested&&
    x.hand===y.hand&&x.affinity===y.affinity&&x.equipLoad===y.equipLoad&&
    x.activationEvidence===y.activationEvidence&&
    x.equipLoad>0&&row);
   const observedWeight=good?round3(x.equipLoad-baseline.equipLoad):null;
   const localWeight=row?.weight??null;
   const status=!good?'NOT_OBSERVED':localWeight===null?'COMPETITOR_WEIGHT_OBSERVED':
    localWeight===observedWeight?'WEIGHT_MATCH':'WEIGHT_MISMATCH';
   return {id,weapon:x.requested,source:'Tarnished.dev rendered public v1.17',
    itemSlot:x.hand,observedWeight,localWeight,delta:observedWeight===null||
    localWeight===null?null:round3(localWeight-observedWeight),
    status,inputsConfirmed:good===true,baseAttackVerified:false,
    requirementsVerified:false,arNotUsedAsWeightEvidence:true};
  });
 const counts={total:rows.length,weightObserved:rows.filter(x=>x.observedWeight!==null).length,
  sourceMissingObserved:rows.filter(x=>TARGETS.includes(x.id)&&x.observedWeight!==null).length,
  sameAsLocal:rows.filter(x=>x.status==='WEIGHT_MATCH').length,
  differentFromLocal:rows.filter(x=>x.status==='WEIGHT_MISMATCH').length,
  notObserved:rows.filter(x=>x.status==='NOT_OBSERVED').length};
 return {comparator:'Tarnished.dev public v1.17',
  verifiedBaseline,knownLongswordBothHands:knownControl,
  counts,rows,qualification:'Weight inferred from public equip-load difference only when empty and both Longsword controls pass. Base attack, requirements, status and in-game accuracy are not established. No catalog fields auto-modified.'};
}
export async function run(){
 const [one,two,catalog]=await Promise.all([
  readFile(resolve('.audit/item-field-first.json'),'utf8').then(JSON.parse),
  readFile(resolve('.audit/tarnished-public-field-visibility.json'),'utf8').then(JSON.parse),
  readFile(resolve('public/data/community-weapon-catalog.json'),'utf8').then(JSON.parse)]);
 const report=comparePublicItemWeights(one,two,catalog);
 await mkdir(resolve('.audit'),{recursive:true});
 await writeFile(resolve('.audit/tarnished-v117-item-weight-comparison.json'),JSON.stringify(report,null,2)+'\n');
 console.log('[V117 DIRECT ITEM WEIGHT] '+JSON.stringify({mode:batch3?'final37':batch2?'batch2-30':'historical-9',verifiedBaseline:report.verifiedBaseline,
  knownLongswordBothHands:report.knownLongswordBothHands,...report.counts}));
 for(const row of report.rows)console.log('[V117 WEIGHT ROW] '+JSON.stringify(row));
 if(!report.knownLongswordBothHands)throw Error('Known-weight controls failed; no direct item weights may be approved.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await run();
