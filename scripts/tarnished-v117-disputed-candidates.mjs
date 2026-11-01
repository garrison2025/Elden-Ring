/** Prioritize catalog source conflicts and missing +0/weight records.
 * Each row is a Tarnished.dev v1.17 UI input only, NOT a fabricated AR.
 * Existing catalog source flags must remain intact until competitor fields
 * are directly observed and reconciled. No game-client verification needed.
 */
const c=(id,weaponName,affinity,upgrade,str,dex,int=10,fai=10,arc=10,twoHanded=false,somber=false)=>
 Object.freeze({id,weaponName,affinity,upgrade,str,dex,int,fai,arc,twoHanded,somber});
export const V117_DISPUTED_UI_CANDIDATES=Object.freeze([
 c('conflict-fire-knights-shortsword', "Fire Knight's Shortsword",'Standard',0,12,18,10,18),
 c('conflict-radahn-light', 'Greatsword of Radahn (Light)','None',0,40,30,20,10,10,false,true),
 c('conflict-radahn-lord', 'Greatsword of Radahn (Lord)','None',10,40,30,20,10,10,false,true),
 c('conflict-madding-hand', 'Madding Hand','None',0,20,20,20,20,10,false,true),
 c('conflict-queeligns-greatsword', "Queelign's Greatsword",'Standard',0,20,25,10,20),
 c('conflict-smithscript-axe', 'Smithscript Axe','Standard',0,20,15,15,15),
 c('conflict-smithscript-dagger', 'Smithscript Dagger','Standard',0,10,20,20,20),
 c('conflict-stone-sheathed', 'Stone-Sheathed Sword','None',0,25,15,10,10,10,false,true),
 c('conflict-barbed-staff-spear', 'Barbed Staff-Spear','None',0,20,25,10,30,10,false,true),
 c('conflict-claws-of-night', 'Claws of Night','None',0,12,30,10,10,10,false,true),
 c('conflict-falx', 'Falx','None',0,20,30,10,10,10,false,true),
 c('conflict-messmer-soldier-spear', "Messmer Soldier's Spear",'Standard',0,30,30),
 c('conflict-swift-spear', 'Swift Spear','Standard',0,20,35),
 c('conflict-ritual-thrusting-shield', 'Ritual Thrusting Shield','Standard',0,25,25),
 c('missing-albinauric-shield', 'Albinauric Shield','Standard',0,20,20),
 c('missing-brass-shield', 'Brass Shield','Standard',0,20,20),
 c('missing-fingerprint-stone-shield', 'Fingerprint Stone Shield','Standard',0,50,20),
 c('missing-golden-greatshield', 'Golden Greatshield','Standard',0,50,20)
]);
