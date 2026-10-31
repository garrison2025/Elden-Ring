/**
 * ADDITIONAL PUBLIC UI PROBE CANDIDATES ONLY.
 *
 * These are input combinations to be observed at Tarnished.dev v1.17,
 * NOT measured AR values, NOT 35 benchmark passes and NOT certified data.
 * Promote nothing to the counted benchmark without two runs confirming
 * the site's version, exact input controls, selected source weapon/affinity,
 * rendered numeric output and matching independently computed total.
 * No game client is necessary.
 */
const c=(id,weaponName,affinity,upgrade,str,dex,int=10,fai=10,arc=10,twoHanded=false,somber=false)=>
 Object.freeze({id,weaponName,affinity,upgrade,str,dex,int,fai,arc,twoHanded,somber});
export const V117_ADDITIONAL_UI_CANDIDATES=Object.freeze([
 // Ten regular upgrades: physical/elemental/status affinity branches.
 c('longsword-fire-p12','Longsword','Fire',12,30,20),
 c('longsword-flameart-p15','Longsword','Flame Art',15,20,20,10,60),
 c('longsword-sacred-p15','Longsword','Sacred',15,20,20,10,60),
 c('longsword-lightning-p15','Longsword','Lightning',15,20,60),
 c('longsword-magic-p15','Longsword','Magic',15,20,20,60),
 c('longsword-cold-p15','Longsword','Cold',15,20,20,50),
 c('longsword-poison-p15','Longsword','Poison',15,30,20,10,10,60),
 c('longsword-blood-p15','Longsword','Blood',15,30,20,10,10,60),
 c('longsword-occult-p15','Longsword','Occult',15,30,20,10,10,60),
 c('longsword-quality-p25','Longsword','Quality',25,55,55),
 // Six Uchigatana paths.
 c('uchigatana-blood-p25','Uchigatana','Blood',25,30,60,10,10,60),
 c('uchigatana-cold-p20','Uchigatana','Cold',20,30,40,60),
 c('uchigatana-occult-p25','Uchigatana','Occult',25,30,40,10,10,70),
 c('uchigatana-lightning-p25','Uchigatana','Lightning',25,30,70),
 c('uchigatana-magic-p25','Uchigatana','Magic',25,30,40,70),
 c('uchigatana-poison-p25','Uchigatana','Poison',25,30,45,10,10,60),
 // Five Claymore branches including middle upgrade and 2H.
 c('claymore-flameart-p25','Claymore','Flame Art',25,40,30,10,60),
 c('claymore-sacred-p25','Claymore','Sacred',25,40,30,10,60),
 c('claymore-fire-p25','Claymore','Fire',25,70,30),
 c('claymore-magic-p25','Claymore','Magic',25,40,30,60),
 c('claymore-heavy-p12-2h','Claymore','Heavy',12,40,20,10,10,10,true),
 // Three Greatsword branches.
 c('greatsword-quality-p25','Greatsword','Quality',25,60,60),
 c('greatsword-cold-p25','Greatsword','Cold',25,50,30,50),
 c('greatsword-fire-p12-2h','Greatsword','Fire',12,50,25,10,10,10,true),
 // Two Dismounter cases.
 c('dismounter-blood-p12','Dismounter','Blood',12,35,50,10,10,50),
 c('dismounter-standard-p12','Dismounter','Standard',12,35,50),
 // Two DLC Milady variants.
 c('milady-standard-p0','Milady','Standard',0,30,40),
 c('milady-keen-p25','Milady','Keen',25,25,70),
 // Two DLC fire-element weapon cases.
 c('fire-knight-greatsword-flameart-p25',"Fire Knight's Greatsword",'Flame Art',25,40,30,10,60),
 c('fire-knight-greatsword-fire-p25',"Fire Knight's Greatsword",'Fire',25,60,30,10,30),
 // Five unique/Somber cases, +0 / +5 / +10.
 c('moonveil-unique-s10','Moonveil','None',10,20,40,70,10,10,false,true),
 c('blasphemous-blade-unique-s10','Blasphemous Blade','None',10,30,25,10,70,10,false,true),
 c('dark-moon-greatsword-unique-s5','Dark Moon Greatsword','None',5,25,20,60,10,10,false,true),
 c('bloodhounds-fang-unique-s0',"Bloodhound's Fang",'None',0,25,50,10,10,10,false,true),
 c('rivers-of-blood-unique-s10','Rivers of Blood','None',10,20,60,10,10,60,false,true)
]);
