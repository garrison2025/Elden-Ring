/**
 * Human-reviewed source-vs-source discrepancy ledger. These are NOT gameplay
 * goldens. Never silently select one source's numeric value as authoritative.
 * Validation fails the build on stale IDs, changed community fields/flags,
 * missing disputed records or accidental "game verified" status.
 */
const ATTACK='v117-community-attack-conflict';
const REQUIREMENTS='v117-community-requirement-conflict';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const fail=x=>{throw new RangeError(x);};
const format=v=>v.join(' / ');
const labels=['PHY','MAG','FIRE','LGT','HOLY'];
const attrs=['STR','DEX','INT','FAI','ARC'];
function isUrl(u){
 if(typeof u!=='string'||u.length>500)return false;
 try{const x=new URL(u);return x.protocol==='https:'&&!x.username&&!x.password;}
 catch{return false;}
}
export function validateConflictEvidence(catalog,ledger){
 if(!Array.isArray(catalog?.weapons)||!ledger||ledger.schemaVersion!==1||
  !Array.isArray(ledger.cases)||ledger.cases.length<1||ledger.cases.length>30||
  !isUrl(ledger.pinnedSourceUrl)||!isUrl(ledger.officialPatchUrl)||
  ledger.status!=='SOURCE_DISAGREEMENT_NOT_GAME_VERIFIED'||
  ledger.requiredGameVersion?.app!=='1.17.2'||
  ledger.requiredGameVersion?.regulation!=='1.17.3'||
  ledger.verification?.gameClientVerified!==false||
  ledger.verification?.publicationApproved!==false||
  ledger.verification?.acceptedCurrentGameScreenshots!==0||
  ledger.verification?.reviewStatus!=='UNREVIEWED')
  fail('Invalid or falsely certified conflict ledger.');
 const map=new Map(catalog.weapons.map(w=>[w.id,w]));
 const flagged=catalog.weapons.filter(w=>(w.flags||[]).includes(ATTACK)||
  (w.flags||[]).includes(REQUIREMENTS));
 const seen=new Set();
 const entries=ledger.cases.map(row=>{
  if(!row||typeof row.id!=='string'||seen.has(row.id))fail('Duplicate or missing conflict ID.');
  seen.add(row.id);
  const weapon=map.get(row.id),expected=row.field==='baseAttack'?ATTACK:
   row.field==='requirements'?REQUIREMENTS:null;
  if(!weapon||!expected||!(weapon.flags||[]).includes(expected)||
   (row.field==='baseAttack'&&(weapon.flags||[]).includes(REQUIREMENTS))||
   (row.field==='requirements'&&(weapon.flags||[]).includes(ATTACK)))
   fail('Evidence record no longer matches exact conflict flags: '+row.id);
  const madding=row.id==='sote-reference-051';
  const p=row.currentPatchCorroboration;
  const q=weapon.currentPatchRequirementCorroboration;
  if(madding){
   if(row.field!=='requirements'||!p||!q||
      p.sourceClass!=='independent-version-labelled-secondary-game-parameter-reference'||
      p.sourceUrl!=='https://almanauts.com/eldenring/tiers/weapons-fist/'||
      p.patchChangeUrl!=='https://almanauts.com/eldenring/patches/1-17-3/'||
      p.regulation!=='1.17.3'||p.gameBuild!=='25827938'||
      p.agreesWith!=='pinned-v117'||p.notVerifiedByGameClient!==true||
      !Array.isArray(p.observedValues)||p.observedValues.join(',')!=='8,8,13,20,0'||
      q.sourceUrl!==p.sourceUrl||q.values.join(',')!==p.observedValues.join(',')||
      q.gameClientVerified!==false)
    fail('Current-patch Madding Hand corroboration missing, stale or falsely game-verified.');
  }else if(p!==undefined||q!==undefined)
   fail('Unexpected unsupported current-patch corroboration on another weapon.');
  const current=row.field==='baseAttack'?weapon.attack:weapon.requirements;
  if(!Array.isArray(current)||current.length!==5||
   !Array.isArray(row.community)||row.community.length!==5||
   !Array.isArray(row.pinned)||row.pinned.length!==5||
   !row.community.every((n,i)=>Number.isInteger(n)&&n>=0&&n===current[i])||
   !row.pinned.every(n=>Number.isInteger(n)&&n>=0)||
   row.pinned.every((n,i)=>n===row.community[i])||
   !isUrl(row.wiki)||!isUrl(row.other)||
   row.gameClientVerified!==false||row.reviewStatus!=='UNREVIEWED'||
   row.doNotAutoCorrect!==true||row.screenshotCount!==0)
   fail('Unverifiable/stale conflicting source evidence: '+row.id);
  return {
   id:row.id,name:weapon.name,field:row.field,
   sourceCommunity:[...row.community],sourcePinned:[...row.pinned],
   priority:row.priority,sourceUrl:row.wiki,otherSourceUrl:row.other,
   currentPatchCorroboration:madding?{
    sourceUrl:p.sourceUrl,observedValues:[...p.observedValues],
    regulation:p.regulation,gameBuild:p.gameBuild,
    agreesWith:'pinned-v117',gameClientVerified:false
   }:null,
   gameClientVerified:false,reviewStatus:'UNREVIEWED',acceptedScreenshots:0
  };
 });
 if(flagged.length!==entries.length||flagged.some(w=>!seen.has(w.id)))
  fail('Disputed catalog flags missing from evidence dossier.');
 if(entries.filter(x=>x.field==='baseAttack').length!==6||
  entries.filter(x=>x.field==='requirements').length!==1)
  fail('Unexpected v1.17 conflict type distribution; review evidence before changing.');
 return {status:ledger.status,reviewDate:ledger.checkedDate,
  app:ledger.requiredGameVersion.app,regulation:ledger.requiredGameVersion.regulation,
  pinnedSourceUrl:ledger.pinnedSourceUrl,officialPatchUrl:ledger.officialPatchUrl,
  entries:entries.sort((a,b)=>a.priority-b.priority||a.name.localeCompare(b.name)),
  currentPatchCorroborationCount:entries.filter(x=>x.currentPatchCorroboration).length,
  screenshotCount:0,gameClientVerified:false};
}
export function conflictDossierHtml(data){
 if(!data?.entries?.length||data.gameClientVerified!==false)
  fail('Missing verified source-conflict audit data.');
 const rows=data.entries.map(item=>{
  const labelsForField=item.field==='requirements'?attrs:labels;
  const detail=labelsForField.map((key,i)=>key+': '+
   item.sourceCommunity[i]+' / '+item.sourcePinned[i])
   .filter((_,i)=>item.sourceCommunity[i]!==item.sourcePinned[i]).join('; ');
  return '<tr><th scope="row"><a href="../weapon-database/?weapon='+esc(encodeURIComponent(item.id))+
   '">'+esc(item.name)+'</a></th><td>'+
   esc(item.field==='requirements'?'Attribute requirements':'Uninfused +0 base attack')+
   '</td><td><code>'+esc(format(item.sourceCommunity))+'</code></td>'+
   '<td><code>'+esc(format(item.sourcePinned))+'</code></td>'+
   '<td>'+esc(detail)+'</td><td><a href="'+esc(item.sourceUrl)+
   '" rel="noopener noreferrer">Community record</a> · '+
   '<a href="'+esc(item.otherSourceUrl)+
   '" rel="noopener noreferrer">Additional reference</a></td>'+
   '<td>'+ (item.currentPatchCorroboration?
    '1.17.3 secondary data supports pinned '+esc(format(item.currentPatchCorroboration.observedValues))+
    ' · <a href="'+esc(item.currentPatchCorroboration.sourceUrl)+
    '" rel="noopener noreferrer">Current-patch source</a> · ':'')+
    'Not game verified</td></tr>';
 }).join('');
 return '<section class="panel info" id="conflict-dossier" data-source-conflict-dossier>'+
  '<h2>Seven unresolved weapon-source disagreements</h2>'+
  '<p>These are <strong>two contradictory published data sources</strong>, not two sets of game-client screenshots. '+
  'The first value is from our attributed community +0 reference; the second comes from the pinned '+
  '<a href="'+esc(data.pinnedSourceUrl)+'" rel="noopener noreferrer">Regulation 1.17 parameter source</a>'+
  ' after applying the +0 reinforcement factor. Data order for attacks: '+
  'Physical / Magic / Fire / Lightning / Holy; for requirements: '+
  'STR / DEX / INT / FAI / ARC. A source disagreement is <strong>not</strong> proof that either side is correct for App '+
  esc(data.app)+' / Regulation '+esc(data.regulation)+'.</p>'+
  '<div class="table-wrap"><table class="datatable source-conflict-table"><thead><tr>'+
  '<th scope="col">Weapon</th><th scope="col">Disputed field</th>'+
  '<th scope="col">Community source</th><th scope="col">Pinned 1.17</th>'+
  '<th scope="col">Different components</th><th scope="col">Source links</th>'+
  '<th scope="col">Review status</th></tr></thead><tbody>'+
  rows+'</tbody></table></div>'+
  '<p><strong>Current-patch corroboration: 1 of 7 historical disagreements.</strong> '+
  'Madding Hand FAI 20 in an independently published Regulation 1.17.3-labelled '+
  'parameter reference agrees with pinned Regulation 1.17; unversioned wiki reports FAI 13. '+
  'This supports 20 as a <strong>version-labelled source reading</strong>, not an original '+
  'game-menu screenshot or definitive verified wield verdict. Six +0 attack disputes remain '+
  'without independent comparable current-patch +0 game-menu readings.</p>'+
  '<h3>How to resolve one entry</h3>'+
  '<p>In the actual App '+esc(data.app)+' / Regulation '+esc(data.regulation)+
  ', capture the title-screen version and the exact weapon at +0, '+
  'default/uninfused state. For six base-attack cases, compare the weapon information panel’s five '+
  'base damage components, <strong>not character AR</strong>. For Madding Hand, capture the weapon’s '+
  'five attribute requirements, not effective two-hand Strength. Keep screenshots locally and '+
  'record platform, date, file SHA-256, weapon, reinforcement and affinity. '+
  'A separate reviewer must inspect authentic game images and both version labels before changing a source flag. '+
  'Numerical agreement between websites alone cannot close an item.</p>'+
  '<p class="note">Current accepted game screenshot count: 0 · all seven items UNREVIEWED. '+
  '<a href="../data/weapon-conflict-evidence.json">Download source comparison and manual verification checklist JSON</a> · '+
  '<a href="#conflict-capture">Record the seven +0 game readings locally</a> · '+
  '<a href="../weapon-data-workbench/">Open existing local AR/observation workbench</a>. '+
  'No game files, screenshots or user identifiers are uploaded.</p>'+
  '</section>';
}
export function injectConflictDossier(html,data){
 if(typeof html!=='string'||html.split('<section data-source-conflict-placeholder></section>').length!==2)
  fail('Exactly one audit placeholder must be present.');
 return html.replace('<section data-source-conflict-placeholder></section>',conflictDossierHtml(data));
}
