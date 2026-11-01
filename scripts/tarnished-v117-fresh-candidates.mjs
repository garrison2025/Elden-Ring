/** New, unverified Tarnished.dev public v1.17 browser input candidates.
 * No AR values are pre-filled. Two independent live UI observations
 * and matching local mathematics are required before approval.
 */
const c=(id,weaponName,affinity,upgrade,str,dex,int=10,fai=10,arc=10,twoHanded=false,somber=false)=>
 Object.freeze({id,weaponName,affinity,upgrade,str,dex,int,fai,arc,twoHanded,somber});
export const V117_FRESH_UI_CANDIDATES=Object.freeze([
 c('fresh-broadsword-standard-p0','Broadsword','Standard',0,20,20),
 c('fresh-lordsworn-quality-p25',"Lordsworn's Straight Sword",'Quality',25,50,50),
 c('fresh-zweihander-heavy-p25-2h','Zweihander','Heavy',25,60,20,10,10,10,true),
 c('fresh-nagakiba-keen-p25','Nagakiba','Keen',25,20,80),
 c('fresh-godskin-peeler-blood-p25','Godskin Peeler','Blood',25,30,60,10,10,60),
 c('fresh-antspur-rapier-poison-p25','Antspur Rapier','Poison',25,30,60,10,10,50),
 c('fresh-scavenger-curved-occult-p25',"Scavenger's Curved Sword",'Occult',25,30,50,10,10,80),
 c('fresh-guardian-swordspear-keen-p25',"Guardian's Swordspear",'Keen',25,25,80),
 c('fresh-rellanas-twin-blades-s10',"Rellana's Twin Blades",'None',10,30,30,40,40,10,false,true),
 c('fresh-star-fist-heavy-p25-2h','Star Fist','Heavy',25,80,30,10,10,10,true),
 c('fresh-great-stars-cold-p25','Great Stars','Cold',25,60,30,60),
 c('fresh-black-knife-s10','Black Knife','None',10,20,40,10,60,10,false,true),
 c('fresh-deaths-poker-s10',"Death's Poker",'None',10,30,45,60,10,10,false,true),
 c('fresh-claymans-harpoon-magic-p25',"Clayman's Harpoon",'Magic',25,30,30,60),
 c('fresh-magma-blade-s10','Magma Blade','None',10,35,35,10,50,10,false,true),
 c('fresh-urumi-keen-p25','Urumi','Keen',25,20,80),
 c('fresh-warhawks-talon-lightning-p25',"Warhawk's Talon",'Lightning',25,20,70),
 c('fresh-grafted-blade-greatsword-s10','Grafted Blade Greatsword','None',10,50,20,10,10,10,false,true)
]);
