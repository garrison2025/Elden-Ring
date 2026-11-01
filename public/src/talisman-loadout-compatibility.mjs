/**
 * Narrow equipability gate for Build Planner, NOT a talisman-effect calculator.
 * Public v1.17 source-site selection: Radagon and Marika seal pairs have
 * direct rejections measured in BOTH click orders; Arsenal/Crimson Amber/
 * Erdtree variants have ONE exact observed order each. All other alternate
 * tier variants remain independently documented, NOT reference-site goldens.
 *
 * Direct source: docs/TALISMAN_VARIANT_FAMILY_AND_LIVE_SELECTION_AUDIT_20261101.md
 * Independent sources (rules only):
 * https://eldenring.wiki.gg/wiki/Radagon%27s_Scarseal
 * https://eldenring.wiki.gg/wiki/Radagon%27s_Soreseal
 * https://eldenring.fandom.com/wiki/Marika%27s_Seals
 * https://steamcommunity.com/app/1245620/discussions/0/4511002742441868752/
 */
const EXCLUSIVE_FAMILIES=Object.freeze([
 Object.freeze({
  names:Object.freeze(["Radagon's Scarseal","Radagon's Soreseal"]),
  family:'Radagon seal variants',
  evidence:'direct-site-both-orders-plus-independent-documentation',
  note:'Both Radagon seal click orders were independently rejected in two fresh Chromium runs on public Tarnished.dev v1.17. The source-site selector kept the first item in either order. This is not a game-client capture.'
 }),
 Object.freeze({
  names:Object.freeze(["Marika's Scarseal","Marika's Soreseal"]),
  family:'Marika seal variants',
  evidence:'direct-site-both-orders-plus-independent-documentation',
  note:'Both Marika seal click orders were independently rejected in two fresh Chromium runs on public Tarnished.dev v1.17. The selector kept the first item in either order. This is not a game-client capture.'
 }),
 Object.freeze({
  names:Object.freeze(["Erdtree's Favor","Erdtree's Favor +1","Erdtree's Favor +2"]),
  family:"Erdtree's Favor upgrade variants",
  evidence:'direct-site-one-order-plus-independent-documentation',
  note:'Public Tarnished.dev v1.17 twice rejected Erdtree\'s Favor then Erdtree\'s Favor +2, retaining the base item. Other tier pairings and reverse click order rely on https://eldenring.wiki.gg/wiki/Erdtree%27s_Favor_%2B2 ; no numeric stacking golden.'
 }),
 Object.freeze({
  names:Object.freeze(["Arsenal Charm","Arsenal Charm +1","Great-Jar's Arsenal"]),
  family:'Arsenal load-boost variants',
  evidence:'direct-site-one-order-plus-independent-documentation',
  note:"Public Tarnished.dev v1.17 twice rejected Arsenal Charm then Arsenal Charm +1, retaining Arsenal Charm. Great-Jar and reverse-order restrictions rely on https://eldenring.wiki.gg/wiki/Equip_Load ; no numeric stacking golden."
 }),
 Object.freeze({
  names:Object.freeze(['Crimson Amber Medallion','Crimson Amber Medallion +1','Crimson Amber Medallion +2','Crimson Amber Medallion +3']),
  family:'Crimson Amber Medallion upgrade variants',
  evidence:'direct-site-one-order-plus-independent-documentation',
  note:'Public Tarnished.dev v1.17 twice rejected Crimson Amber Medallion then +1, retaining the base item. Other tiers or reverse orders rely on https://eldenring.wiki.gg/wiki/Crimson_Amber_Medallion_%2B3 ; no numeric stacking golden.'
 }),
 Object.freeze({
  names:Object.freeze(['Cerulean Amber Medallion','Cerulean Amber Medallion +1','Cerulean Amber Medallion +2','Cerulean Amber Medallion +3']),
  family:'Cerulean Amber Medallion upgrade variants',
  evidence:'independent-documentation-only',
  note:'An upgraded talisman replaces another tier of its own family; restriction from https://eldenring.fandom.com/wiki/Talismans . Not directly measured on public Tarnished.dev.'
 }),
 Object.freeze({
  names:Object.freeze(['Viridian Amber Medallion','Viridian Amber Medallion +1','Viridian Amber Medallion +2','Viridian Amber Medallion +3']),
  family:'Viridian Amber Medallion upgrade variants',
  evidence:'independent-documentation-only',
  note:'An upgraded talisman replaces another tier of its own family; restriction from https://eldenring.fandom.com/wiki/Talismans . Not directly measured on public Tarnished.dev.'
 }),
 Object.freeze({
  names:Object.freeze(['Dragoncrest Shield Talisman','Dragoncrest Shield Talisman +1','Dragoncrest Shield Talisman +2','Dragoncrest Greatshield Talisman']),
  family:'Dragoncrest physical-defense variants',
  evidence:'independent-documentation-only',
  note:'Only one tier of the Dragoncrest physical-defense talisman family can be equipped. Source: https://wiki.eso-ui.com/index.php/Category:Elden_Ring_-_Talismans . Not directly measured on public Tarnished.dev.'
 }),
 Object.freeze({
  names:Object.freeze(['Warrior Jar Shard','Shard of Alexander']),
  family:'Alexander shard variants',
  evidence:'independent-documentation-only',
  note:'Warrior Jar Shard and Shard of Alexander exclude each other. Source: https://wiki.eso-ui.com/index.php/Category:Elden_Ring_-_Talismans . Not directly measured on public Tarnished.dev.'
 }),
 Object.freeze({
  names:Object.freeze(['Crimson Seed Talisman','Crimson Seed Talisman +1']),
  family:'Crimson Seed upgrade variants',
  evidence:'independent-documentation-only',
  note:'An upgraded talisman replaces another tier of its own family; restriction from https://eldenring.fandom.com/wiki/Talismans . Not directly measured on public Tarnished.dev.'
 }),
 Object.freeze({
  names:Object.freeze(['Cerulean Seed Talisman','Cerulean Seed Talisman +1']),
  family:'Cerulean Seed upgrade variants',
  evidence:'independent-documentation-only',
  note:'An upgraded talisman replaces another tier of its own family; restriction from https://eldenring.fandom.com/wiki/Talismans . Not directly measured on public Tarnished.dev.'
 }),
]);
export function reviewTalismanLoadoutCompatibility(names){
 if(!Array.isArray(names)||names.length!==4||
    names.some(n=>typeof n!=='string'))
  throw new TypeError('Expected four normalized talisman slot names.');
 const selected=names.map(x=>x.trim()).filter(Boolean);
 const conflicts=[];
 const seen=new Set();
 for(const name of selected){
  if(seen.has(name)&&!conflicts.some(x=>x.type==='duplicate-item'&&x.names[0]===name)){
   conflicts.push({
    type:'duplicate-item',names:[name],evidence:'independent-documentation-only',
    note:'The same talisman cannot occupy two equipped slots. This is a documented equipability restriction, not a direct double-read reference-site sample.'
   });
  }
  seen.add(name);
 }
 for(const rule of EXCLUSIVE_FAMILIES){
  const selectedVariants=rule.names.filter(n=>seen.has(n));
  if(selectedVariants.length>=2)
   conflicts.push({type:'exclusive-family',family:rule.family,
    names:selectedVariants,evidence:rule.evidence,note:rule.note});
 }
 return {
  status:conflicts.length?'UNWEARABLE':'NO_DOCUMENTED_CONFLICT',
  selectedCount:selected.length,
  conflicts,
  note:conflicts.length?
   'No valid combined equipment weight, roll tier or stat-stack can be claimed for this selection.':
   'No conflict detected among the limited documented rules; this does NOT certify all other talisman combinations.'
 };
}
