/** New v1.17 public-site WEIGHT-only candidate list; no guessed numbers.
 * Every name is an original local canonical weight=null row, checked against
 * competitor Build Planner by two independent single-item Equip Load reads.
 * Existing proven 9-weight fixtures, community catalog & AR 86 unaffected.
 */
const names=Object.freeze([
 "Bandit's Curved Sword",
 "Banished Knight's Shield",
 "Beast Crest Heater Shield",
 "Beastman's Jar-Shield",
 "Black Leather Shield",
 "Blue Crest Heater Shield",
 "Blue-Gold Kite Shield",
 "Blue-White Wooden Shield",
 "Briar Greatshield",
 "Buckler",
 "Candletree Wooden Shield",
 "Carian Knight's Shield",
 "Crossed-Tree Towershield",
 "Cuckoo Greatshield",
 "Distinguished Greatshield",
 "Dragon Towershield",
 "Eclipse Crest Greatshield",
 "Eclipse Crest Heater Shield",
 "Flame Crest Wooden Shield",
 "Gilded Greatshield",
 "Gilded Iron Shield",
 "Haligtree Crest Greatshield",
 "Hawk Crest Wooden Shield",
 "Heater Shield",
 "Horse Crest Wooden Shield",
 "Ice Crest Shield",
 "Inverted Hawk Heater Shield",
 "Inverted Hawk Towershield",
 "Iron Roundshield",
 "Kite Shield"
]);
export const V117_WEIGHT_BATCH2_CANDIDATES=Object.freeze(
 names.map((name,i)=>Object.freeze({id:'batch2-'+String(i+1).padStart(2,'0'),
 name,hand:i===0?'rh1':'lh1',affinity:'Standard'}))
);
