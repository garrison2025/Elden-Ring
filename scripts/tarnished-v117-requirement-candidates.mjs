/** Exactly 487 candidate names for REAL rendered Tarnished.dev v1.17 Req: text.
 * 348 site spellings were observed twice alongside numeric +0 AR.
 * The rest remain CANDIDATES, never automatically accepted if selector fails.
 */
import {readFileSync} from 'node:fs';
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
