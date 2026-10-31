import {makeTarnishedSameInputUrl,TARNISHED_V117_AFFINITIES} from './tarnished-same-input.mjs';

/**
 * NEW APPROVED REFERENCE OBSERVATIONS: 35 distinct public-site v1.17
 * same-input cases, independently observed in BOTH Chrome runs:
 * https://github.com/garrison2025/Elden-Ring/actions/runs/41191448470
 * https://github.com/garrison2025/Elden-Ring/actions/runs/41191804102
 *
 * Every rendered total and source control was identical across runs.
 * Independent v1.17 calculation using floor-after-RAW-sum (distinct from
 * component-first floor) produces exactly the same integers in all 35.
 * These records are NOT verified against the game client.
 *
 * Row shape: short-id, name, affinity, upgrade, STR, DEX, INT, FAI, ARC,
 * 2-handed, somber, observed-in-Tarnished-dev AR.
 */
const rows=[
 ['longsword-fire-p12','Longsword','Fire',12,30,20,10,10,10,false,false,336],
 ['longsword-flameart-p15','Longsword','Flame Art',15,20,20,10,60,10,false,false,446],
 ['longsword-sacred-p15','Longsword','Sacred',15,20,20,10,60,10,false,false,435],
 ['longsword-lightning-p15','Longsword','Lightning',15,20,60,10,10,10,false,false,437],
 ['longsword-magic-p15','Longsword','Magic',15,20,20,60,10,10,false,false,432],
 ['longsword-cold-p15','Longsword','Cold',15,20,20,50,10,10,false,false,383],
 ['longsword-poison-p15','Longsword','Poison',15,30,20,10,10,60,false,false,297],
 ['longsword-blood-p15','Longsword','Blood',15,30,20,10,10,60,false,false,297],
 ['longsword-occult-p15','Longsword','Occult',15,30,20,10,10,60,false,false,358],
 ['longsword-quality-p25','Longsword','Quality',25,55,55,10,10,10,false,false,549],
 ['uchigatana-blood-p25','Uchigatana','Blood',25,30,60,10,10,60,false,false,538],
 ['uchigatana-cold-p20','Uchigatana','Cold',20,30,40,60,10,10,false,false,537],
 ['uchigatana-occult-p25','Uchigatana','Occult',25,30,40,10,10,70,false,false,601],
 ['uchigatana-lightning-p25','Uchigatana','Lightning',25,30,70,10,10,10,false,false,668],
 ['uchigatana-magic-p25','Uchigatana','Magic',25,30,40,70,10,10,false,false,681],
 ['uchigatana-poison-p25','Uchigatana','Poison',25,30,45,10,10,60,false,false,506],
 ['claymore-flameart-p25','Claymore','Flame Art',25,40,30,10,60,10,false,false,775],
 ['claymore-sacred-p25','Claymore','Sacred',25,40,30,10,60,10,false,false,775],
 ['claymore-fire-p25','Claymore','Fire',25,70,30,10,10,10,false,false,748],
 ['claymore-magic-p25','Claymore','Magic',25,40,30,60,10,10,false,false,774],
 ['claymore-heavy-p12-2h','Claymore','Heavy',12,40,20,10,10,10,true,false,396],
 ['greatsword-quality-p25','Greatsword','Quality',25,60,60,10,10,10,false,false,808],
 ['greatsword-cold-p25','Greatsword','Cold',25,50,30,50,10,10,false,false,823],
 ['greatsword-fire-p12-2h','Greatsword','Fire',12,50,25,10,10,10,true,false,597],
 ['dismounter-blood-p12','Dismounter','Blood',12,35,50,10,10,50,false,false,371],
 ['dismounter-standard-p12','Dismounter','Standard',12,35,50,10,10,10,false,false,370],
 ['milady-standard-p0','Milady','Standard',0,30,40,10,10,10,false,false,165],
 ['milady-keen-p25','Milady','Keen',25,25,70,10,10,10,false,false,560],
 ['fire-knight-greatsword-flameart-p25',"Fire Knight's Greatsword",'Flame Art',25,40,30,10,60,10,false,false,885],
 ['fire-knight-greatsword-fire-p25',"Fire Knight's Greatsword",'Fire',25,60,30,10,30,10,false,false,836],
 ['moonveil-unique-s10','Moonveil','None',10,20,40,70,10,10,false,true,697],
 ['blasphemous-blade-unique-s10','Blasphemous Blade','None',10,30,25,10,70,10,false,true,785],
 ['dark-moon-greatsword-unique-s5','Dark Moon Greatsword','None',5,25,20,60,10,10,false,true,482],
 ['bloodhounds-fang-unique-s0',"Bloodhound's Fang",'None',0,25,50,10,10,10,false,true,217],
 ['rivers-of-blood-unique-s10','Rivers of Blood','None',10,20,60,10,10,60,false,true,686]
];
export const TARNISHED_V117_35_APPROVED_ADDITIONAL=Object.freeze(rows.map(row=>{
 const [id,weaponName,affinity,upgrade,str,dex,int,fai,arc,twoHanded,somber,expectedTotal]=row;
 const affinityId=affinity==='None'?-1:TARNISHED_V117_AFFINITIES.indexOf(affinity);
 if(affinityId< -1||!Number.isInteger(expectedTotal)||expectedTotal<=0)
  throw new RangeError('Invalid approved v1.17 comparator observation.');
 const playerStats=Object.freeze({str,dex,int,fai,arc});
 return Object.freeze({
  id:'tarnished-v117-'+id,weaponName,affinity,affinityId,
  playerStats,upgrade,twoHanded,expectedTotal,
  sourceVersion:'1.17',sourceObservedDate:'2026-10-31',
  sourceUrl:makeTarnishedSameInputUrl({
   weaponName,affinityId,upgrade,stats:playerStats,twoHanded,
   reinforcement:somber?'somber':'smithing'
  }),
  observedDisplay:'Equipped Right Hand 1 / '+weaponName+' / '+affinity+
    ' / Total AR : '+expectedTotal,
  referenceObservedOnce:true,sourceRepeatable:true,
  note:'Two independent public Chrome v1.17 input/readout runs 41191448470 & 41191804102; independent same-input AR exact match after raw-sum aggregation; no game client.'
 });
}));
