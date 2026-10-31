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
  tarnishedPackBaseFacts:tarnished.filter(w=>w.dataCoverage==='base-reference').length};
 if(!Number.isInteger(catalog.meta.count)||catalog.meta.count!==result.weapons||
  catalog.meta.dlcCatalogCount!==result.dlc||
  catalog.meta.dlcBaseFactCount!==result.dlcBaseFacts||
  catalog.meta.tarnishedPackCount!==result.tarnishedPack||
  catalog.meta.tarnishedPackBaseFactCount!==result.tarnishedPackBaseFacts||
  catalog.meta.baseCommunityCount!==result.weapons-result.dlc-result.tarnishedPack)
  fail('Weapon catalog count metadata is out of sync with actual records.');
 return result;
}
export function catalogCoverageCopy(c){
 if(!c||![c.weapons,c.dlc,c.dlcBaseFacts,c.tarnishedPack,c.tarnishedPackBaseFacts].every(Number.isInteger)||
  c.weapons<1||c.dlc<0||c.dlc>c.weapons||
  c.dlcBaseFacts<0||c.dlcBaseFacts>c.dlc||
  c.tarnishedPack<0||c.tarnishedPack+c.dlc>c.weapons||
  c.tarnishedPackBaseFacts<0||c.tarnishedPackBaseFacts>c.tarnishedPack)
  fail('Invalid source-derived catalog coverage.');
 return 'Search '+c.weapons+' community-reported weapon and shield references, including '+
  c.dlc+' Shadow of the Erdtree entries ('+c.dlcBaseFacts+
  ' with sourced +0 base-attack facts) and '+c.tarnishedPack+
  ' Tarnished Pack armaments ('+c.tarnishedPackBaseFacts+
  ' with separately sourced community +0 base facts; remaining requirements/weight only). Source versions and current-patch game accuracy remain unverified. These are not player Attack Ratings.';
}
export function injectCatalogCoverageIntoHomepage(home,coverage){
 if(typeof home!=='string')fail('Missing homepage HTML.');
 const pattern=/<p data-home-weapon-coverage>[^<]*<\/p>/g;
 if([...home.matchAll(pattern)].length!==1)
  fail('Expected exactly one plain-text home weapon coverage paragraph.');
 return home.replace(pattern,
  '<p data-home-weapon-coverage>'+catalogCoverageCopy(coverage)+'</p>');
}
