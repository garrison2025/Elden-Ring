/**
 * Derive homepage weapon coverage at build time from the checked-in catalog.
 * Do not hand-maintain numeric counts or claim game-client AR certification.
 */
const fail=message=>{throw new RangeError(message);};
export function getCatalogCoverage(catalog){
 if(!catalog||typeof catalog!=='object'||!Array.isArray(catalog.weapons)||
  !catalog.weapons.length||!catalog.meta||typeof catalog.meta!=='object')
  fail('Missing community catalog records and source metadata.');
 const all=catalog.weapons;
 const dlc=all.filter(w=>w?.expansion==='Shadow of the Erdtree');
 const baseDlc=dlc.filter(w=>w?.dataCoverage==='base-reference');
 const tarnished=all.filter(w=>w?.expansion==='Tarnished Pack');
 const result={weapons:all.length,dlc:dlc.length,dlcBaseFacts:baseDlc.length,
  tarnishedPack:tarnished.length,
  pinnedBaseRequirementsOnly:all.filter(w=>w.flags?.includes('source-v117-neutral-requirements-only')).length,
  tarnishedPackBaseFacts:tarnished.filter(w=>w.dataCoverage==='base-reference').length,
  tarnishedPackSecondaryConflicts:tarnished.filter(w=>w.secondarySourceDisagreement!==undefined).length};
 if(!Number.isInteger(catalog.meta.count)||catalog.meta.count!==result.weapons||
  catalog.meta.dlcCatalogCount!==result.dlc||
  catalog.meta.basePinnedRequirementsOnlyCount!==result.pinnedBaseRequirementsOnly||
  catalog.meta.dlcBaseFactCount!==result.dlcBaseFacts||
  catalog.meta.tarnishedPackCount!==result.tarnishedPack||
  catalog.meta.tarnishedPackBaseFactCount!==result.tarnishedPackBaseFacts||
  catalog.meta.tarnishedPackSecondarySourceConflictCount!==result.tarnishedPackSecondaryConflicts||
  catalog.meta.baseCommunityCount!==result.weapons-result.dlc-result.tarnishedPack)
  fail('Weapon catalog count metadata is out of sync with actual records.');
 return result;
}
export function catalogCoverageCopy(c){
 if(!c||![c.weapons,c.dlc,c.dlcBaseFacts,c.tarnishedPack,c.tarnishedPackBaseFacts,c.tarnishedPackSecondaryConflicts,c.pinnedBaseRequirementsOnly].every(Number.isInteger)||
  c.weapons<1||c.dlc<0||c.dlc>c.weapons||
  c.pinnedBaseRequirementsOnly<0||c.pinnedBaseRequirementsOnly>c.weapons-c.dlc-c.tarnishedPack||
  c.dlcBaseFacts<0||c.dlcBaseFacts>c.dlc||
  c.tarnishedPack<0||c.tarnishedPack+c.dlc>c.weapons||
  c.tarnishedPackBaseFacts<0||c.tarnishedPackBaseFacts>c.tarnishedPack||
  c.tarnishedPackSecondaryConflicts<0||c.tarnishedPackSecondaryConflicts>c.tarnishedPack)
  fail('Invalid source-derived catalog coverage.');
 return 'Search '+c.weapons+' uniquely named weapon and shield references ('+
  (c.weapons-c.dlc-c.tarnishedPack)+' base-game, '+c.dlc+' Shadow of the Erdtree, '+
  c.tarnishedPack+' Tarnished Pack). '+c.pinnedBaseRequirementsOnly+
  ' base-game entries were recovered by reverse matching pinned Regulation 1.17: their minimum attributes are sourced but attack/weight/critical/scaling remain unknown. Including '+
  c.dlc+' Shadow of the Erdtree entries ('+c.dlcBaseFacts+
  ' with sourced +0 base-attack facts) and '+c.tarnishedPack+
  ' Tarnished Pack armaments ('+c.tarnishedPackBaseFacts+
  ' with separately sourced community +0 base facts; remaining requirements/weight only, with '+
  c.tarnishedPackSecondaryConflicts+' new source-disputed shield). Source versions and current-patch game accuracy remain unverified. These are not player Attack Ratings.';
}
export function injectCatalogCoverageIntoHomepage(home,coverage){
 if(typeof home!=='string')fail('Missing homepage HTML.');
 const pattern=/<p data-home-weapon-coverage>[^<]*<\/p>/g;
 if([...home.matchAll(pattern)].length!==1)
  fail('Expected exactly one plain-text home weapon coverage paragraph.');
 return home.replace(pattern,
  '<p data-home-weapon-coverage>'+catalogCoverageCopy(coverage)+'</p>');
}
