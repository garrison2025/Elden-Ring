/** Final 37 originally missing source weights, no numerical values supplied.
 * Two independent live reads are required for every accepted weight.
 * Somber/unique items are only accepted if public UI confirms an active
 * matching affinity, nonzero load and numeric attack (except catalysts).
 */
const names=Object.freeze([
  "Ant's Skull Plate",
  "Coil Shield",
  "Crucible Hornshield",
  "Dragonclaw Shield",
  "Erdtree Greatshield",
  "Golden Beast Crest Shield",
  "Gravel Stone Seal",
  "Icon Shield",
  "Inseparable Sword",
  "Jellyfish Shield",
  "Large Leather Shield",
  "Lordsworn's Shield",
  "Man-Serpent's Shield",
  "Manor Towershield",
  "Marred Leather Shield",
  "Marred Wooden Shield",
  "One-Eyed Shield",
  "Perfumer's Shield",
  "Pillory Shield",
  "Red Crest Heater Shield",
  "Red Thorn Roundshield",
  "Redmane Greatshield",
  "Rickety Shield",
  "Rift Shield",
  "Riveted Wooden Shield",
  "Round Shield",
  "Scorpion Kite Shield",
  "Scripture Wooden Shield",
  "Shield of the Guilty",
  "Silver Mirrorshield",
  "Smoldering Shield",
  "Spiked Palisade Shield",
  "Spiralhorn Shield",
  "Sun Realm Shield",
  "Twinbird Kite Shield",
  "Visage Shield",
  "Wooden Greatshield"
]);
export const V117_WEIGHT_FINAL37_CANDIDATES=Object.freeze(names.map((name,index)=>
 Object.freeze({id:'batch3-'+String(index+1).padStart(2,'0'),name,
 hand:name==='Inseparable Sword'?'rh1':'lh1',
 affinities:Object.freeze(['Standard','None']),
 catalyst:name==='Gravel Stone Seal'})
));
