/**
 * Build-time, auditable summary of the exact checked-in community catalog.
 * Source records are not game-client goldens. Field availability is NOT
 * proof of current-regulation accuracy or copyright redistribution rights.
 */
import {validateCommunityCatalog,hasDisputedAttack,hasDisputedWeight} from '../public/src/community-weapons.mjs';
import {getCatalogCoverage} from './home-catalog-coverage.mjs';

const fail=message=>{throw new RangeError(message);};
const ATTACK='v117-community-attack-conflict';
const REQUIREMENTS='v117-community-requirement-conflict';
const esc=value=>String(value).replace(/[&<>"']/g,ch=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[ch]));

export function getCatalogEvidence(catalog){
 validateCommunityCatalog(catalog);
 const coverage=getCatalogCoverage(catalog);
 const weapons=catalog.weapons;
 const hit=(w,flag)=>(w.flags??[]).includes(flag);
 const conflicts=weapons.filter(w=>hit(w,ATTACK)||hit(w,REQUIREMENTS)).map(w=>({
  id:w.id,name:w.name,attackConflict:hit(w,ATTACK),
  requirementConflict:hit(w,REQUIREMENTS),
  // The public database links to its cited community facts; this is not
  // a link to a game-client validation result.
  catalogPath:'/weapon-database/?weapon='+encodeURIComponent(w.id)
 })).sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
 const c={
  total:coverage.weapons,baseGame:coverage.weapons-coverage.dlc-coverage.tarnishedPack,
  dlc:coverage.dlc,dlcBaseAttackSourced:coverage.dlcBaseFacts,
  tarnishedPack:coverage.tarnishedPack,
  tarnishedPackBaseFacts:coverage.tarnishedPackBaseFacts,
  tarnishedPackSecondaryConflicts:coverage.tarnishedPackSecondaryConflicts,
  versionedRequirementCorroborations:weapons.filter(w=>w.currentPatchRequirementCorroboration!==undefined).length,
  unversionedBaseCrosschecks:weapons.filter(w=>w.thirdPartyBasePlusZero!==undefined).length,
  requirementsPresent:weapons.filter(w=>Array.isArray(w.requirements)).length,
  weaponWeightsPresent:weapons.filter(w=>Number.isFinite(w.weight)).length,
  baseAttackPresent:weapons.filter(w=>Array.isArray(w.attack)).length,
  baseAttackSourceUncontested:weapons.filter(w=>Array.isArray(w.attack)&&!hasDisputedAttack(w)).length,
  disputedWeightReferences:weapons.filter(w=>hasDisputedWeight(w)).length,
  stoneSheathedSourceAttackDisputes:weapons.filter(w=>w.sourceAttackDisagreement!==undefined).length,
  stoneSheathedSourceWeightDisputes:weapons.filter(w=>w.sourceWeightDisagreement!==undefined).length,
  publishedRoundedUpgradeTables:weapons.filter(w=>w.upgradeReference!==undefined).length,
  completeArProfiles:weapons.filter(w=>w.arParameters!==undefined&&w.arParameters!==null).length,
  attackSourceConflicts:weapons.filter(w=>hit(w,ATTACK)).length,
  requirementSourceConflicts:weapons.filter(w=>hit(w,REQUIREMENTS)).length,
  recordsWithSourceConflicts:conflicts.length
 };
 if(c.baseAttackPresent>c.total||c.requirementsPresent>c.total||
  c.weaponWeightsPresent>c.total||c.recordsWithSourceConflicts>c.total)
  fail('Invalid catalog evidence counts.');
 return {
  schemaVersion:1,scope:'community-source-references-not-current-game-certified',
  provenance:{
   upstreamSource:catalog.meta.source,upstreamSourceRevision:catalog.meta.sourceRevision,
   reportedGameVersion:catalog.meta.version,
   caution:'This local source snapshot does not establish current-regulation accuracy or independent in-game golden tests.'
  },
  counts:c,conflicts
 };
}
const row=(title,quantity,definition)=>
 '<tr><th scope="row">'+esc(title)+'</th><td>'+esc(quantity)+
 '</td><td>'+esc(definition)+'</td></tr>';
export function catalogEvidenceRow(evidence){
 const c=evidence.counts;
 return '<tr data-catalog-audit-row><td>Community weapon catalog ('+
  c.total+' entries)</td><td>Research / noindex</td><td>'+
  c.baseGame+' legacy/base-game references, '+c.dlc+' Shadow of the Erdtree references and '+
  c.tarnishedPack+' Tarnished Pack armaments; '+
  c.dlcBaseAttackSourced+' Shadow of the Erdtree entries have attributed +0 base-attack facts. '+
  c.recordsWithSourceConflicts+' entries have unresolved v1.17 source conflicts; '+
  c.tarnishedPackSecondaryConflicts+' additional Tarnished Pack shield has independent secondary source disputes; '+
  c.stoneSheathedSourceAttackDisputes+' Stone-Sheathed Sword has a separate 89 vs 119 +0 and 3.5 vs 5 weight dispute. '+
  'No precise, current-game-client-certified AR profiles are bundled. '+
  '<a href="#catalog-evidence">See the live data-quality audit</a>.</td></tr>';
}
export function catalogEvidencePanel(evidence){
 const c=evidence.counts;
 const summary=[
  row('Total source weapon/shield entries',c.total,'Bundled community reference records, not a certified full game roster'),
  row('Base-game / legacy community entries',c.baseGame,'Community snapshot; individual current-regulation verification is incomplete'),
  row('Shadow of the Erdtree entries',c.dlc,'Roster subset; not a certified complete DLC armament list'),
  row('Tarnished Pack / Tarnished Edition entries',c.tarnishedPack,'All have version-labelled requirements/weights; +0 stats require separate per-weapon citations'),
  row('Tarnished Pack source-attributed +0 base facts',c.tarnishedPackBaseFacts,'Three named wiki pages, four class comparison tables and named cross-source Ritual +0; not game-client certified'),
  row('Tarnished Pack secondary-source disagreements',c.tarnishedPackSecondaryConflicts,'Ritual Thrusting Shield: version-labelled 10 weight / STR 13 vs other public 9 weight / STR 15; both calculations blocked pending original game evidence'),
  row('Current 1.17.3 requirement-source corroborations',c.versionedRequirementCorroborations,'Madding Hand FAI 20 supports pinned v1.17 against unversioned wiki FAI 13; no reviewed in-game screenshot'),
  row('Unversioned third-party +0 Base matches',c.unversionedBaseCrosschecks,'Six individually linked Base rows match pinned v1.17, but current game version/source lineage are unverified and no AR is released'),
  row('DLC with attributed +0 base-attack figures',c.dlcBaseAttackSourced,'Includes a disputed Stone-Sheathed +0 candidate 89; not certified current-game attack or AR'),
  row('Stone-Sheathed +0 source disagreement',c.stoneSheathedSourceAttackDisputes,'Published +0 89 versus competing 119 headline; numeric source reference shown, trusted attack calculation BLOCKED'),
  row('Stone-Sheathed weight disagreement',c.stoneSheathedSourceWeightDisputes,'3.5 versus 5 from named sources; weight and final roll-tier calculations BLOCKED'),
  row('Attribute requirement fields present',c.requirementsPresent+' / '+c.total,'Data availability only; conflicts may remain'),
  row('Individual weapon weight fields present',c.weaponWeightsPresent+' / '+c.total,'Data availability only; never imply actual equipped loadout'),
  row('Published +0 base-attack arrays present',c.baseAttackPresent+' / '+c.total,'Source-reported availability includes source-disputed values, NOT certified current game attacks'),
  row('Source-attack arrays without flagged attack conflicts',c.baseAttackSourceUncontested+' / '+c.total,'Even unflagged community values are NOT independently verified against current game-client AR'),
  row('Source-disputed weapon weight references',c.disputedWeightReferences,'Source reports conflict; weight filter and complete equipped-load calculation exclude these records'),
  row('Published rounded upgrade base-attack tables',c.publishedRoundedUpgradeTables,'Not exact strengthening, infusion, scaling or AR'),
  row('Complete precise AR parameter profiles',c.completeArProfiles,'Without these and current game goldens, precise weapon AR remains unavailable'),
  row('v1.17 reported +0 attack conflicts',c.attackSourceConflicts,'Open upstream/game-derived source disagreements; not resolved by automated tests'),
  row('v1.17 reported requirement conflicts',c.requirementSourceConflicts,'Do not claim an exact in-game wield requirement for conflicting references')
 ].join('');
 const conflictRows=evidence.conflicts.map(w=>
  '<tr><th scope="row"><a href="'+esc(w.catalogPath)+'">'+esc(w.name)+'</a></th><td>'+
   esc([w.attackConflict?'Base attack':'',w.requirementConflict?'Requirements':'']
     .filter(Boolean).join(' + '))+
   '</td><td>Unresolved community source disagreement; needs independent current-game confirmation</td></tr>'
 ).join('');
 const conflicts=conflictRows?
  '<h3>Unresolved source conflicts ('+c.recordsWithSourceConflicts+' catalog entries)</h3>'+
  '<div class="table-wrap"><table class="datatable"><thead><tr>'+
  '<th scope="col">Community weapon</th><th scope="col">Disputed field</th>'+
  '<th scope="col">Validation state</th></tr></thead><tbody>'+
  conflictRows+'</tbody></table></div>':
  '<p>No currently flagged source conflicts in this catalog snapshot. '+
  'That is not independent game-client verification.</p>';
 return '<section class="panel info" id="catalog-evidence" data-catalog-audit-panel>'+
  '<h2>Live catalog evidence audit</h2>'+
  '<p>Counts below are generated during the same build as this site from the '+
  'exact bundled weapon JSON, not manually transcribed. A present field is '+
  '<strong>not</strong> proof of current-patch accuracy. '+
  'Weapon requirements and weights are community-reported; this preview '+
  'does not contain fully validated per-weapon AR profiles.</p>'+
  '<div class="table-wrap"><table class="datatable"><thead><tr>'+
  '<th scope="col">Metric</th><th scope="col">Evidence count</th>'+
  '<th scope="col">Interpretation</th></tr></thead><tbody>'+
  summary+'</tbody></table></div>'+
  conflicts+
  '<p class="note">Source snapshot version: <strong>'+esc(evidence.provenance.reportedGameVersion)+
  '</strong>. Upstream revision: <code>'+esc(evidence.provenance.upstreamSourceRevision)+
  '</code>. This is a catalog consistency audit, <strong>not game-client QA</strong>. '+
  '<a href="../catalog-evidence.json">Open build-generated machine-readable evidence</a>.</p>'+
  '</section>';
}
export function injectCatalogEvidence(html,evidence){
 if(typeof html!=='string')fail('Missing validation-status HTML.');
 const oldRow=/<tr data-catalog-audit-row(?:\s[^>]*)?>[\s\S]*?<\/tr>/g;
 const section=/<section data-catalog-audit-panel(?:\s[^>]*)?><\/section>/g;
 if([...html.matchAll(oldRow)].length!==1||[...html.matchAll(section)].length!==1)
  fail('Expected one data-audit row and one data-audit panel in validation-status.');
 return html.replace(oldRow,catalogEvidenceRow(evidence))
  .replace(section,catalogEvidencePanel(evidence));
}
