/** Comparator-only round 4: 20 source-sensitive + 12 established category controls.
 * Local weights are known but NOT trusted as Tarnished.dev v1.17 unless
 * the direct public calculator verifies each complete weapon setting TWICE.
 */
const sourceSensitive=Object.freeze([
  "Barbed Staff-Spear",
  "Claws of Night",
  "Falx",
  "Golden Order Flail",
  "Golem Fist",
  "Greatsword of Radahn (Lord)",
  "Hefty Scimitar",
  "Idus Sword",
  "Leontiel's Greatsword",
  "Madding Hand",
  "Main-gauche",
  "Messmer Soldier's Spear",
  "Queelign's Greatsword",
  "Reed Great Katana",
  "Reverse-Bladed Sword",
  "Silver Grooved Shield",
  "Smithscript Axe",
  "Smithscript Dagger",
  "Staff of the Great Beyond",
  "Swift Spear"
]);
const variedControls=Object.freeze([
  "Ancient Meteoric Ore Greatsword",
  "Anvil Hammer",
  "Black Bow",
  "Blasphemous Blade",
  "Bloodhound's Fang",
  "Broadsword",
  "Carian Thrusting Shield",
  "Caestus",
  "Arbalest",
  "Beast-repellent Torch",
  "Banished Knight's Halberd",
  "Carian Sorcery Sword"
]);
export const V117_WEIGHT_BATCH4_CANDIDATES=Object.freeze(
 [...sourceSensitive,...variedControls].map((name,index)=>Object.freeze({
  id:'batch4-'+String(index+1).padStart(2,'0'),
  name,
  hand:/Shield$/.test(name)?'lh1':'rh1',
  affinities:Object.freeze(['Standard','None']),
  catalyst:name==='Staff of the Great Beyond'||name==='Carian Sorcery Sword',
  segment:index<sourceSensitive.length?'source-sensitive':'category-control'
 }))
);
