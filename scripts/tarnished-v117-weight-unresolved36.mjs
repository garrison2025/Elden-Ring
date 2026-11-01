/** Read the final 36 NOT_OBSERVED entries without inventing any values.
 * Public-site name variants are just candidates; only actual rendered item
 * activation and independently repeated Equip Load can count as observed.
 */
import {readFileSync} from 'node:fs';
import {TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE} from '../public/src/tarnished-v117-public-weights.mjs';
const catalog=JSON.parse(readFileSync(new URL('../public/data/community-weapon-catalog.json',import.meta.url),'utf8'));
const known=new Set(TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE.filter(x=>x.evidenceRun!==41262468777).map(x=>x.weaponName));
const remaining=catalog.weapons.filter(x=>!known.has(x.name));
if(catalog.weapons.length!==487||known.size!==451||remaining.length!==36)
 throw new RangeError('Not the frozen 36-name unresolved set; refresh live source audit before retry.');
const overrides=Object.freeze({
 'Miséricorde':'Misericorde',"Varré's Bouquet":"Varre's Bouquet",
 'Great Épée':'Great Epee','Scepter Of The All-knowing':'Scepter of the All-Knowing',
 "Serpent-god's Curved Sword":"Serpent-God's Curved Sword",
 'Serpent-hunter':'Serpent-Hunter','Cross-naginata':'Cross-Naginata',
 'Giant-crusher':'Giant-Crusher',"Demi-human Queen's Staff":"Demi-Human Queen's Staff",
 'Steel-wire Torch':'Steel-Wire Torch',"Celebrant's Rib-rake":"Celebrant's Rib-Rake",
 "Crepus's Black-key Crossbow":"Crepus's Black-Key Crossbow",
 'Beast-repellent Torch':'Beast-Repellent Torch'
});
const stripAccents=name=>name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
function namesFor(name){
 const normalized=name.replace(/\bOf\b/g,'of').replace(/\bThe\b/g,'the')
  .replace(/\bAnd\b/g,'and').replace(/-([a-z])/g,(_,c)=>'-'+c.toUpperCase());
 return Object.freeze([...new Set([overrides[name],normalized,stripAccents(normalized),
  stripAccents(name),name])].filter(x=>typeof x==='string'&&x.length>0).slice(0,5));
}
export const V117_WEIGHT_UNRESOLVED36=Object.freeze(remaining.map((x,i)=>Object.freeze({
 id:'alias-'+String(i+1).padStart(2,'0'),
 name:x.name,category:x.category,hand:/Shield$/.test(x.name)?'lh1':'rh1',
 affinities:Object.freeze(['None','Standard']),
 catalyst:['Glintstone Staff','Sacred Seal'].includes(x.category),
 siteNames:namesFor(x.name)
})));
export function getUnresolvedAliasShard(index){
 if(!Number.isInteger(index)||index<0||index>=4)throw new RangeError('Four equal alias shards 0-3');
 return Object.freeze(V117_WEIGHT_UNRESOLVED36.slice(index*9,(index+1)*9));
}
