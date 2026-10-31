/**
 * User-selected Tarnished.dev v1.17 comparison mode.
 *
 * All 487 neutral families are paired to a fixed, public v1.17 parameter
 * snapshot. Fifty separately observed Tarnished.dev v1.17 same-input AR
 * calculations support this reference choice; we do NOT claim 487 individual
 * Tarnished.dev UI observations or independent game-client verification.
 *
 * This is an ephemeral VIEW, never a modification to the checked-in catalog.
 * Attack and requirements follow the user's chosen versioned comparator;
 * missing/disputed WEIGHT does not silently become 0 or get approved.
 */
const ACCEPTED_CONFLICT_FLAGS=new Set([
 'v117-community-attack-conflict','stone-sheathed-attack-source-conflict',
 'v117-community-requirement-conflict',
 'tarnished-pack-requirement-secondary-conflict',
 'source-v117-neutral-requirements-only',
 'weight-and-base-attack-unknown'
]);
const error=s=>{throw new RangeError(s);};
const validFive=a=>Array.isArray(a)&&a.length===5&&a.every(
 n=>Number.isInteger(n)&&n>=0&&n<=10000);
export function buildV117ComparatorCatalog(community,overlay){
 if(!community||!Array.isArray(community.weapons)||community.weapons.length<1||
  !(overlay?.rows instanceof Map)||overlay.rows.size!==community.weapons.length)
  error('A complete versioned comparison is required.');
 const byId=new Set();
 let recovered=0,overriddenAttack=0,overriddenRequirements=0;
 const weapons=community.weapons.map(w=>{
  if(!w||typeof w.id!=='string'||byId.has(w.id))error('Invalid or duplicate weapon ID.');
  byId.add(w.id);
  const row=overlay.rows.get(w.id);
  if(!row||row.status!=='pinned-v117-neutral-reference'||
   row.id!==w.id||!validFive(row.attack)||!validFive(row.requirements)||
   row.requirements.some(n=>n>99)||row.sourceGameVersion!=='1.17')
   error('Incomplete or invalid v1.17 neutral record for '+w.id);
  if(row.sourceOnly)recovered++;
  if(row.attackDiff)overriddenAttack++;
  if(row.requirementDiff)overriddenRequirements++;
  // A community reinforcement table is not automatically versioned.
  // Users needing numeric upgraded AR use the actual versioned AR calculator.
  const upgradeReference=row.attackDiff?null:w.upgradeReference;
  return {
   ...w,attack:[...row.attack],requirements:[...row.requirements],
   flags:(w.flags??[]).filter(f=>!ACCEPTED_CONFLICT_FLAGS.has(f)),
   upgradeReference,
   v117Comparator:true,
   v117ReferencePage:row.sourcePage,
   v117OriginalAttack:w.attack??null,
   v117OriginalRequirements:w.requirements??null
  };
 });
 return {
  catalog:{...community,weapons},
  summary:{mapped:weapons.length,recoveredAttack:recovered,
   overriddenAttack,overriddenRequirements,
   weightNotSupplied:weapons.filter(w=>w.weight===null).length,
   weightConflictsRemain:weapons.filter(w=>(w.flags??[]).some(f=>
    ['v117-community-weight-conflict','tarnished-pack-weight-secondary-conflict',
     'stone-sheathed-weight-source-conflict'].includes(f))).length}
 };
}
