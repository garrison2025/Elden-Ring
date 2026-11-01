/** Exactly 487 candidate names for REAL rendered Tarnished.dev v1.17 Req: text.
 * 348 site spellings were observed twice alongside numeric +0 AR.
 * The rest remain CANDIDATES, never automatically accepted if selector fails.
 */
import {readFileSync} from 'node:fs';
import {CLASSES} from '../public/src/core.mjs';
import {TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE} from '../public/src/tarnished-v117-public-weights.mjs';
const c=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
const a=JSON.parse(readFileSync(new URL('./tarnished-v117-weight-probe-ar-observations.json',import.meta.url),'utf8'));
const verifiedNames=new Set(TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE.map(x=>x.weaponName));
const observedNames=new Map(a.records.map(x=>[x.weaponName,{siteName:x.siteName,affinity:x.affinity}]));
if(c.weapons.length!==487||verifiedNames.size!==481||observedNames.size!==348)
 throw new RangeError('Source corpus changed; actual site display candidates require review.');
const alias=Object.freeze({
 'Miséricorde':'Misericorde',"Varré's Bouquet":"Varre's Bouquet",
 'Great Épée':'Great Epee','Scepter Of The All-knowing':'Scepter of the All-Knowing',
 "Serpent-god's Curved Sword":"Serpent-God's Curved Sword",
 'Serpent-hunter':'Serpent-Hunter','Cross-naginata':'Cross-Naginata',
 'Giant-crusher':'Giant-Crusher',"Demi-human Queen's Staff":"Demi-Human Queen's Staff",
 'Steel-wire Torch':'Steel-Wire Torch',"Celebrant's Rib-rake":"Celebrant's Rib-Rake",
 "Crepus's Black-key Crossbow":"Crepus's Black-Key Crossbow",
 'Beast-repellent Torch':'Beast-Repellent Torch'
});
export const REQUIREMENT_CANDIDATES=Object.freeze(c.weapons.map((w,i)=>{
 const known=observedNames.get(w.name);
 const fallback=w.name.replace(/\bOf\b/g,'of').replace(/\bThe\b/g,'the').replace(/\bAnd\b/g,'and');
 const names=[known?.siteName,alias[w.name],fallback,w.name,
 w.name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'')];
 const siteNames=[...new Set(names.filter(Boolean))].slice(0,5);
 return Object.freeze({id:'req-'+String(i+1).padStart(3,'0'),name:w.name,
  siteNames:Object.freeze(siteNames),affinities:Object.freeze(known?[known.affinity]:
   ['Standard','None']),hand:/Shield$/.test(w.name)?'lh1':'rh1',
  previouslyWeightVerified:verifiedNames.has(w.name)});
}));
export function getRequirementsShard(index,total=12){
 if(!Number.isInteger(index)||index<0||index>=12||total!==12)
  throw new RangeError('Expected shard index 0..11');
 const start=Math.floor(index*REQUIREMENT_CANDIDATES.length/12);
 const end=Math.floor((index+1)*REQUIREMENT_CANDIDATES.length/12);
 return REQUIREMENT_CANDIDATES.slice(start,end);
}

/** Retry only records with TWO direct public v1.17 AR reads but no Req.
 * Neither the AR total nor pinned parameter source supplies a direct Req.
 */
const reqAudit=JSON.parse(readFileSync(new URL('./tarnished-v117-direct-requirements-actual10.json',import.meta.url),'utf8'));
const arNames=new Set(a.records.map(x=>x.weaponName));
const missingReqWithAr=new Set(reqAudit.rows.filter(x=>
  x.status==='NOT_OBSERVED'&&arNames.has(x.name)).map(x=>x.name));
export const AR_GAP_REQUIREMENT_CANDIDATES=Object.freeze(
 REQUIREMENT_CANDIDATES.filter(x=>missingReqWithAr.has(x.name)));
if(reqAudit.total!==487||AR_GAP_REQUIREMENT_CANDIDATES.length!==22)
 throw new RangeError('Public-site AR/Req audit input drift; re-evaluate the 22 targeted gaps');
export function getArGapRequirementShard(index){
 if(!Number.isInteger(index)||index<0||index>=2)throw new RangeError('Expected AR-gap shard index 0..1');
 return AR_GAP_REQUIREMENT_CANDIDATES.slice(index*11,(index+1)*11);
}

/** Genuine public-site Req gaps for entries without prior direct AR, where
 * at least one original community requirement exceeds the 10-point Wretch
 * baseline. This is only a retry shortlist, NOT a certification.
 */
const highGapNames=new Set(reqAudit.rows.filter(x=>
 x.status==='NOT_OBSERVED'&&!arNames.has(x.name)&&
 c.weapons.some(w=>w.name===x.name&&Array.isArray(w.requirements)&&
  Math.max(...w.requirements)>10)).map(x=>x.name));
export const HIGH_GAP_REQUIREMENT_CANDIDATES=Object.freeze(
 REQUIREMENT_CANDIDATES.filter(x=>highGapNames.has(x.name)));
if(reqAudit.total!==487||HIGH_GAP_REQUIREMENT_CANDIDATES.length!==47)
 throw new RangeError('Previous 47 public v1.17 high-Req gap cases changed; inspect inputs');
export function getHighGapRequirementShard(index){
 if(!Number.isInteger(index)||index<0||index>=6)throw new RangeError('Expected high-gap shard 0..5');
 const start=Math.floor(index*47/6),end=Math.floor((index+1)*47/6);
 return HIGH_GAP_REQUIREMENT_CANDIDATES.slice(start,end);
}

/** Valid origin-lowering hypotheses, not certified values: 23 initially
 * activated-but-hidden plus 13 low-Req names without a direct AR reference.
 * Choose an actually playable original class with at least one stat below
 * LOCAL candidate requirements. These inputs do not certify game facts.
 */
const altOrigCandidates=Object.freeze(REQUIREMENT_CANDIDATES.flatMap(row=>{
 const old=reqAudit.rows.find(r=>r.id===row.id);
 if(!old)return [];
 const weapon=c.weapons.find(w=>w.name===row.name);
 if(!weapon||!Array.isArray(weapon.requirements))return [];
 const hidden=old.status==='REQ_NOT_EXPOSED_AT_WRETCH10';
 const lowNoAr=old.status==='NOT_OBSERVED'&&!arNames.has(row.name)&&
   Math.max(...weapon.requirements)<=10;
 if(!hidden&&!lowNoAr)return [];
 const candidates=CLASSES.filter(origin=>!origin.dlc).map(origin=>{
  const deficit=weapon.requirements.reduce((sum,need,i)=>sum+Number(need>origin.stats[i+3]),0);
  return {origin,deficit};
 }).filter(x=>x.deficit>0).sort((a,b)=>
  b.deficit-a.deficit||
  a.origin.stats.slice(3).reduce((s,n)=>s+n,0)-b.origin.stats.slice(3).reduce((s,n)=>s+n,0));
 if(!candidates.length)return [];
 const origin=candidates[0].origin;
 return [Object.freeze({...row,originName:origin.name,originStats:Object.freeze([...origin.stats])})];
}));
export const ALT_ORIGIN_REQUIREMENT_CANDIDATES=altOrigCandidates;
if(ALT_ORIGIN_REQUIREMENT_CANDIDATES.length!==36)
 throw new RangeError('Expected 36 low-Req site display hypotheses, actual '+ALT_ORIGIN_REQUIREMENT_CANDIDATES.length);
export function getAltOriginRequirementShard(index){
 if(!Number.isInteger(index)||index<0||index>=6)throw new RangeError('Expected origin shard 0..5');
 return ALT_ORIGIN_REQUIREMENT_CANDIDATES.slice(index*6,(index+1)*6);
}

/** The actual PUBLIC v1.17 RH1 dropdown inventory (two Chromium reads)
 * exposes the unusual exact spelling "Great epee" (lower-case epee).
 * Not the title-cased or accented guesses. This is only a UI input candidate.
 */
const greatEpeeBase=REQUIREMENT_CANDIDATES.find(x=>x.name==='Great Épée');
export const GREAT_EPEE_DIRECT_CANDIDATE=Object.freeze({
 ...greatEpeeBase,siteNames:Object.freeze(['Great epee']),
 affinities:Object.freeze(['Standard']),hand:'rh1'
});
if(greatEpeeBase?.id!=='req-177')throw Error('Great Epee source catalog changed');
export function getGreatEpeeRequirementShard(index){
 if(index!==0)throw new RangeError('Great Epee has one targeted shard');
 return [GREAT_EPEE_DIRECT_CANDIDATE];
}
