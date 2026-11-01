/**
 * Narrow equipability gate for Build Planner, NOT a talisman-effect calculator.
 * The public v1.17 site directly rejected Radagon Scarseal -> Soreseal
 * in precisely that click order. Other directions/rules are supported by
 * separate community documentation, NOT by two-browser Tarnished goldens.
 *
 * Reference site: docs/TARNISHED_V117_FIVE_MULTITALISMAN_AND_ONE_EXCLUSION_20261101.md
 * Independent sources (rules only):
 * https://eldenring.wiki.gg/wiki/Radagon%27s_Scarseal
 * https://eldenring.wiki.gg/wiki/Radagon%27s_Soreseal
 * https://eldenring.fandom.com/wiki/Marika%27s_Seals
 * https://steamcommunity.com/app/1245620/discussions/0/4511002742441868752/
 */
const EXCLUSIVE_PAIRS=Object.freeze([
 Object.freeze({
  names:Object.freeze(["Radagon's Scarseal","Radagon's Soreseal"]),
  family:'Radagon seal variants',
  evidence:'direct-site-one-order-plus-independent-documentation',
  note:'Only Scarseal then Soreseal was directly rejected by public Tarnished.dev v1.17 in two fresh browser runs. Reverse order is based on separate equipability documentation, not an observed reverse-order result.'
 }),
 Object.freeze({
  names:Object.freeze(["Marika's Scarseal","Marika's Soreseal"]),
  family:'Marika seal variants',
  evidence:'independent-documentation-only',
  note:'Community documentation says the Marika seal variants cannot be worn together. No two-browser Tarnished.dev Marika pair rejection has been measured.'
 })
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
 for(const rule of EXCLUSIVE_PAIRS){
  if(rule.names.every(n=>seen.has(n)))
   conflicts.push({type:'exclusive-family',family:rule.family,
    names:[...rule.names],evidence:rule.evidence,note:rule.note});
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
