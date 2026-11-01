import {makeTarnishedSameInputUrl,TARNISHED_V117_AFFINITIES} from './tarnished-same-input.mjs';

/** 18 Tarnished.dev public v1.17 same-input AR observations, independently
 * read with exact browser control verification in BOTH Chromium runs:
 * https://github.com/garrison2025/Elden-Ring/actions/runs/41255162868
 * https://github.com/garrison2025/Elden-Ring/actions/runs/41255239994
 * All 18 external AR totals repeated exactly and match our independent v1.17
 * reference arithmetic (difference 0). NOT game-client certified, NOT an
 * assertion of catalog coverage or third-party data redistribution rights.
 */
const rows=[
 ['fresh-broadsword-standard-p0','Broadsword','Standard',0,20,20,10,10,10,false,false,142],
 ['fresh-lordsworn-quality-p25',"Lordsworn's Straight Sword",'Quality',25,50,50,10,10,10,false,false,517],
 ['fresh-zweihander-heavy-p25-2h','Zweihander','Heavy',25,60,20,10,10,10,true,false,735],
 ['fresh-nagakiba-keen-p25','Nagakiba','Keen',25,20,80,10,10,10,false,false,599],
 ['fresh-godskin-peeler-blood-p25','Godskin Peeler','Blood',25,30,60,10,10,60,false,false,556],
 ['fresh-antspur-rapier-poison-p25','Antspur Rapier','Poison',25,30,60,10,10,50,false,false,449],
 ['fresh-scavenger-curved-occult-p25',"Scavenger's Curved Sword",'Occult',25,30,50,10,10,80,false,false,572],
 ['fresh-guardian-swordspear-keen-p25',"Guardian's Swordspear",'Keen',25,25,80,10,10,10,false,false,785],
 ['fresh-rellanas-twin-blades-s10',"Rellana's Twin Blades",'None',10,30,30,40,40,10,false,true,847],
 ['fresh-star-fist-heavy-p25-2h','Star Fist','Heavy',25,80,30,10,10,10,true,false,508],
 ['fresh-great-stars-cold-p25','Great Stars','Cold',25,60,30,60,10,10,false,false,748],
 ['fresh-black-knife-s10','Black Knife','None',10,20,40,10,60,10,false,true,501],
 ['fresh-deaths-poker-s10',"Death's Poker",'None',10,30,45,60,10,10,false,true,659],
 ['fresh-claymans-harpoon-magic-p25',"Clayman's Harpoon",'Magic',25,30,30,60,10,10,false,false,671],
 ['fresh-magma-blade-s10','Magma Blade','None',10,35,35,10,50,10,false,true,629],
 ['fresh-urumi-keen-p25','Urumi','Keen',25,20,80,10,10,10,false,false,609],
 ['fresh-warhawks-talon-lightning-p25',"Warhawk's Talon",'Lightning',25,20,70,10,10,10,false,false,568],
 ['fresh-grafted-blade-greatsword-s10','Grafted Blade Greatsword','None',10,50,20,10,10,10,false,true,732]
];
export const TARNISHED_V117_18_APPROVED_FRESH=Object.freeze(rows.map(row=>{
 const [id,weaponName,affinity,upgrade,str,dex,int,fai,arc,twoHanded,somber,expectedTotal]=row;
 const affinityId=affinity==='None'?-1:TARNISHED_V117_AFFINITIES.indexOf(affinity);
 if(affinityId< -1||!Number.isInteger(expectedTotal)||expectedTotal<1)
  throw new RangeError('Invalid fresh v1.17 public comparator input or AR.');
 const playerStats=Object.freeze({str,dex,int,fai,arc});
 return Object.freeze({
  id:'tarnished-v117-'+id,weaponName,affinity,affinityId,
  playerStats,upgrade,twoHanded,expectedTotal,
  sourceVersion:'1.17',sourceObservedDate:'2026-11-01',
  sourceUrl:makeTarnishedSameInputUrl({weaponName,affinityId,upgrade,
   stats:playerStats,twoHanded,reinforcement:somber?'somber':'smithing'}),
  observedDisplay:'Equipped Right Hand 1 / '+weaponName+' / '+affinity+
   ' / Total AR : '+expectedTotal,
  referenceObservedOnce:true,sourceRepeatable:true,
  evidenceRuns:Object.freeze([41255162868,41255239994]),
  note:'Exact public Tarnished.dev v1.17 AR, inputs verified and read twice in independent Chromium runs 41255162868 / 41255239994; 0 difference from independently computed reference AR.'
 });
}));
