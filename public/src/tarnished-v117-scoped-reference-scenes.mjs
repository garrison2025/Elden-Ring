/**
 * Twice-observed actual PUBLIC Tarnished.dev v1.17 rendered result rows.
 * Reference RESULT LOOKUPS only. This is NOT an independent DPS or spell formula.
 * Same-input runs: https://github.com/garrison2025/Elden-Ring/actions/runs/41297001066
 * Strictly limit to exactly tested scenarios; never interpolate or extrapolate.
 */
export const V117_UCHIGATANA_DAMAGE_ROWS=Object.freeze([
 Object.freeze({str:15,dex:20,ar:376,poise:5,dpsSingle:464,dpsPaired:547}),
 Object.freeze({str:20,dex:20,ar:388,poise:5,dpsSingle:483,dpsPaired:570}),
 Object.freeze({str:15,dex:25,ar:392,poise:5,dpsSingle:489,dpsPaired:577})
]);
export const V117_PEBBLE_STAFF_ROWS=Object.freeze([
 Object.freeze({int:25,magic:242,bullets:1,fp:7,intRequirement:10}),
 Object.freeze({int:30,magic:267,bullets:1,fp:7,intRequirement:10}),
 Object.freeze({int:40,magic:315,bullets:1,fp:7,intRequirement:10}),
 Object.freeze({int:50,magic:363,bullets:1,fp:7,intRequirement:10}),
 Object.freeze({int:60,magic:410,bullets:1,fp:7,intRequirement:10})
]);
const integer=n=>Number.isInteger(n)&&n>=1&&n<=99;
export function exactPublicUchigatanaDamage({origin='Wretch',str,dex,otherStats=[10,10,10],weapon='Uchigatana',
 affinity='Standard',upgrade=25,twoHanded=false,effects=false,enemy='Default',ng='NG'}={}){
 if(origin!=='Wretch'||weapon!=='Uchigatana'||affinity!=='Standard'||upgrade!==25||
  twoHanded!==false||effects!==false||enemy!=='Default'||ng!=='NG'||
  !integer(str)||!integer(dex)||!Array.isArray(otherStats)||otherStats.length!==3||
  otherStats.some(x=>x!==10))
  return {status:'NOT_OBSERVED',reference:null};
 const row=V117_UCHIGATANA_DAMAGE_ROWS.find(x=>x.str===str&&x.dex===dex);
 return row?{status:'REFERENCE_UI_OBSERVED_TWICE',reference:row,
  source:'Tarnished.dev public v1.17 Damage result table; independent Chromium passes (41297001066)',
  caveat:'Reference table DPS and AR are observed values. This is not a local animation-timing, enemy damage or DPS formula.'}:
  {status:'NOT_OBSERVED',reference:null};
}
export function exactPublicPebbleSpell({origin='Wretch',int,otherStats=[10,10,10,10,10,10,10],
 catalyst="Astrologer's Staff",spell='Glintstone Pebble',
 smithing=25,somber=10,enemyDefense=0,enemyNegation=0,effects=false}={}){
 if(origin!=='Wretch'||!integer(int)||!Array.isArray(otherStats)||otherStats.length!==7||
  otherStats.some(x=>x!==10)||catalyst!=="Astrologer's Staff"||spell!=='Glintstone Pebble'||
  smithing!==25||somber!==10||enemyDefense!==0||enemyNegation!==0||effects!==false)
  return {status:'NOT_OBSERVED',reference:null};
 const row=V117_PEBBLE_STAFF_ROWS.find(x=>x.int===int);
 return row?{status:'REFERENCE_UI_OBSERVED_TWICE',reference:row,
  source:'Tarnished.dev public v1.17 Spell result table; independent Chromium passes (41297001066)',
  caveat:'A twice-observed reference result, NOT an independently calculated spell multiplier. No interpolation or new catalyst/spell combinations.'}:
  {status:'NOT_OBSERVED',reference:null};
}
export const V117_ARMOR_POISE_REFERENCE=Object.freeze({
 source:'Tarnished.dev public v1.17 Armor Optimizer, normal roll, all multipliers 0 except Poise 1',
 context:Object.freeze({origin:'Wretch',baseStat:10,maxEquipLoad:48.176,
  reservedWeight:0,tier:'medium',minimumPoise:0}),
 maximumPoise:70,
 ranked:Object.freeze([
  Object.freeze({head:'Circlet of Light',chest:'Tree Sentinel Armor',arms:"Preceptor's Gloves",
   legs:'Tree Sentinel Greaves',poise:70,weight:33.7}),
  Object.freeze({head:'Circlet of Light',chest:'Tree Sentinel Armor',arms:'Gravebird Bracelets',
   legs:'Tree Sentinel Greaves',poise:70,weight:33.3}),
  Object.freeze({head:'Circlet of Light',chest:'Tree Sentinel Armor',arms:'Vulgar Militia Gauntlets',
   legs:'Tree Sentinel Greaves',poise:70,weight:33.7})
 ]),
 note:'Exact published browser observations, not a generalized or fully reconstructed Tarnished 13-metric ranking formula.'
});
export function comparePoiseResultToPublicReference({maxEquipLoad,reservedWeight,tier,
 minPoise,metric,combination,poise,excludedIds=[],lockedIds={},disabledSlots=[],weighted=false}={}){
 const c=V117_ARMOR_POISE_REFERENCE.context;
 if(weighted||metric!=='poise'||Number(maxEquipLoad)!==c.maxEquipLoad||
  Number(reservedWeight)!==c.reservedWeight||tier!==c.tier||Number(minPoise)!==0||
  excludedIds.length||Object.keys(lockedIds).length||disabledSlots.length||
  !Array.isArray(combination)||combination.length!==4)
  return {status:'REFERENCE_SCENARIO_NOT_IDENTICAL',reference:null};
 const names=combination.map(x=>x.name);
 const matchIndex=V117_ARMOR_POISE_REFERENCE.ranked.findIndex(x=>
  [x.head,x.chest,x.arms,x.legs].every((n,i)=>names[i]===n));
 return {status:poise===70&&matchIndex>=0?'SAME_POISE_AND_LISTED_REFERENCE_COMBINATION':
  poise===70?'SAME_POISE_BUT_REFERENCE_RANK_NOT_PROVEN':'POISE_VALUE_MISMATCH',
  reference:V117_ARMOR_POISE_REFERENCE,
  listedReferenceRank:matchIndex>=0?matchIndex+1:null,
  localPoise:poise,
  warning:'The local optimizer uses a different tie-break and candidate set. A matching maximum Poise does not prove the same ranking or 13-metric optimization.'};
}
