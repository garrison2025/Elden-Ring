/** Limited public Tarnished.dev v1.17 single-item Equip Load observations.
 * Not from another community database or an inferred AR/scaling formula.
 * Each value is the delta versus 0.0 empty equip load in TWO independently
 * opened Chromium pages, with valid weapon selection/affinity/AR/controls.
 * The 3.5 Longsword both-hand control passed in BOTH rounds.
 * First nine: https://github.com/garrison2025/Elden-Ring/actions/runs/41257042883
 * Another 30 distinct two-read items, all input-verified:
 * https://github.com/garrison2025/Elden-Ring/actions/runs/41257934288
 * Final 37, direct public v1.17 two-run verification, every input confirmed:
 * https://github.com/garrison2025/Elden-Ring/actions/runs/41259504988
 * No game-client version equivalence or third-party code reuse is claimed.
 */
const rows=Object.freeze([
 ['Albinauric Shield',4.5,'missing-primary-weight'],
 ['Brass Shield',7,'missing-primary-weight'],
 ['Fingerprint Stone Shield',29,'missing-primary-weight'],
 ['Golden Greatshield',17,'missing-primary-weight'],
 ['Great Turtle Shell',5.5,'missing-primary-weight'],
 ['Stone-Sheathed Sword',5,'known-community-weight-disagreement'],
 ["Fire Knight's Shortsword",2,'matched-community-weight'],
 ['Greatsword of Radahn (Light)',19,'matched-community-weight'],
 ['Ritual Thrusting Shield',10,'matched-community-weight'],
 ["Bandit's Curved Sword",5,'missing-primary-weight',41257934288],
 ["Banished Knight's Shield",6,'missing-primary-weight',41257934288],
 ["Beast Crest Heater Shield",3.5,'missing-primary-weight',41257934288],
 ["Beastman's Jar-Shield",5,'missing-primary-weight',41257934288],
 ["Black Leather Shield",3,'missing-primary-weight',41257934288],
 ["Blue Crest Heater Shield",3.5,'missing-primary-weight',41257934288],
 ["Blue-Gold Kite Shield",5,'missing-primary-weight',41257934288],
 ["Blue-White Wooden Shield",2,'missing-primary-weight',41257934288],
 ["Briar Greatshield",8.5,'missing-primary-weight',41257934288],
 ["Buckler",1.5,'missing-primary-weight',41257934288],
 ["Candletree Wooden Shield",3.5,'missing-primary-weight',41257934288],
 ["Carian Knight's Shield",4.5,'missing-primary-weight',41257934288],
 ["Crossed-Tree Towershield",15.5,'missing-primary-weight',41257934288],
 ["Cuckoo Greatshield",15,'missing-primary-weight',41257934288],
 ["Distinguished Greatshield",16,'missing-primary-weight',41257934288],
 ["Dragon Towershield",16.5,'missing-primary-weight',41257934288],
 ["Eclipse Crest Greatshield",15,'missing-primary-weight',41257934288],
 ["Eclipse Crest Heater Shield",3.5,'missing-primary-weight',41257934288],
 ["Flame Crest Wooden Shield",3.5,'missing-primary-weight',41257934288],
 ["Gilded Greatshield",16.5,'missing-primary-weight',41257934288],
 ["Gilded Iron Shield",3,'missing-primary-weight',41257934288],
 ["Haligtree Crest Greatshield",17,'missing-primary-weight',41257934288],
 ["Hawk Crest Wooden Shield",3.5,'missing-primary-weight',41257934288],
 ["Heater Shield",3.5,'missing-primary-weight',41257934288],
 ["Horse Crest Wooden Shield",3.5,'missing-primary-weight',41257934288],
 ["Ice Crest Shield",3,'missing-primary-weight',41257934288],
 ["Inverted Hawk Heater Shield",3.5,'missing-primary-weight',41257934288],
 ["Inverted Hawk Towershield",15.5,'missing-primary-weight',41257934288],
 ["Iron Roundshield",3,'missing-primary-weight',41257934288],
 ["Kite Shield",4.5,'missing-primary-weight',41257934288],
 ["Ant's Skull Plate",12.5,'missing-primary-weight',41259504988],
 ["Coil Shield",1.5,'missing-primary-weight',41259504988],
 ["Crucible Hornshield",11.5,'missing-primary-weight',41259504988],
 ["Dragonclaw Shield",13.5,'missing-primary-weight',41259504988],
 ["Erdtree Greatshield",11.5,'missing-primary-weight',41259504988],
 ["Golden Beast Crest Shield",10.5,'missing-primary-weight',41259504988],
 ["Gravel Stone Seal",1.5,'missing-primary-weight',41259504988],
 ["Icon Shield",9,'missing-primary-weight',41259504988],
 ["Inseparable Sword",10,'missing-primary-weight',41259504988],
 ["Jellyfish Shield",8,'missing-primary-weight',41259504988],
 ["Large Leather Shield",3,'missing-primary-weight',41259504988],
 ["Lordsworn's Shield",9,'missing-primary-weight',41259504988],
 ["Man-Serpent's Shield",2,'missing-primary-weight',41259504988],
 ["Manor Towershield",15.5,'missing-primary-weight',41259504988],
 ["Marred Leather Shield",3,'missing-primary-weight',41259504988],
 ["Marred Wooden Shield",4,'missing-primary-weight',41259504988],
 ["One-Eyed Shield",20.5,'missing-primary-weight',41259504988],
 ["Perfumer's Shield",1.5,'missing-primary-weight',41259504988],
 ["Pillory Shield",3.5,'missing-primary-weight',41259504988],
 ["Red Crest Heater Shield",3.5,'missing-primary-weight',41259504988],
 ["Red Thorn Roundshield",1.5,'missing-primary-weight',41259504988],
 ["Redmane Greatshield",14,'missing-primary-weight',41259504988],
 ["Rickety Shield",1,'missing-primary-weight',41259504988],
 ["Rift Shield",2,'missing-primary-weight',41259504988],
 ["Riveted Wooden Shield",2,'missing-primary-weight',41259504988],
 ["Round Shield",4,'missing-primary-weight',41259504988],
 ["Scorpion Kite Shield",4.5,'missing-primary-weight',41259504988],
 ["Scripture Wooden Shield",1.5,'missing-primary-weight',41259504988],
 ["Shield of the Guilty",2,'missing-primary-weight',41259504988],
 ["Silver Mirrorshield",3.5,'missing-primary-weight',41259504988],
 ["Smoldering Shield",3,'missing-primary-weight',41259504988],
 ["Spiked Palisade Shield",9.5,'missing-primary-weight',41259504988],
 ["Spiralhorn Shield",2,'missing-primary-weight',41259504988],
 ["Sun Realm Shield",3.5,'missing-primary-weight',41259504988],
 ["Twinbird Kite Shield",4.5,'missing-primary-weight',41259504988],
 ["Visage Shield",24,'missing-primary-weight',41259504988],
 ["Wooden Greatshield",8,'missing-primary-weight',41259504988]
]);
export const TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE=Object.freeze(
 rows.map(([weaponName,weight,evidenceCategory,evidenceRun=41257042883])=>Object.freeze({
  weaponName,weight,evidenceCategory,source:'Tarnished.dev public Build Calculator',
  comparatorVersion:'1.17',observedDate:'2026-11-01',
  evidenceRun,observedTwice:true,verifiedSingleItem:true,
  baseAttackVerified:false,requirementsVerified:false,
  gameClientVerified:false
 }))
);
const map=new Map(TARNISHED_V117_DIRECT_WEIGHT_EVIDENCE.map(v=>[v.weaponName,v]));
export function getTarnishedV117DirectWeight(weaponName){
 return typeof weaponName==='string'?map.get(weaponName)??null:null;
}
