import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLASSES} from '../public/src/core.mjs';
import {
 validateCommunityCatalog,hasDisputedAttack,hasDisputedRequirements,
 weaponRequirementComparison,weaponWieldShortfall,requirementsUrl,
 searchCatalog,cautionForWeapon
} from '../public/src/community-weapons.mjs';
import {inspectBuildWeapon} from '../public/src/build-weapon-reference.mjs';
import {compareWeaponReferences} from '../public/src/weapon-compare-reference.mjs';
import {planShortlistWielding} from '../public/src/build-shortlist-feasibility.mjs';
import {compareBuildSnapshots} from '../public/src/build-compare.mjs';
const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const catalog=validateCommunityCatalog(JSON.parse(read('data/community-weapon-catalog.json')));
const find=name=>catalog.weapons.find(x=>x.name===name);
const madding=find('Madding Hand'),axe=find('Smithscript Axe'),milady=find('Milady');
const samurai=CLASSES.find(x=>x.name==='Samurai');
const stats5=[20,20,20,15,10],stats8=[40,20,25,...stats5];

test('unresolved Madding Hand faith 13 versus 20 must not produce a definitive meets-requirements verdict',()=>{
 assert.equal(hasDisputedRequirements(madding),true);
 assert.equal(hasDisputedAttack(madding),false);
 assert.equal(madding.requirements[3],13,'Community source data remains unchanged');
 assert.throws(()=>weaponRequirementComparison(madding,stats5),/unresolved.*source conflict/i);
 const shortfall=weaponWieldShortfall(madding,stats5);
 assert.equal(shortfall.known,false);
 assert.equal(shortfall.sourceDisputed,true);
 assert.equal(shortfall.oneHandPoints,null);
 assert.equal(shortfall.twoHandPoints,null);
 assert.throws(()=>requirementsUrl(madding,stats5),/Disputed source requirements/);
 assert.match(cautionForWeapon(madding).join(' '),/SOURCE CONFLICT/);
 const selected=inspectBuildWeapon(catalog.weapons,madding.id,stats8,{allowSote:true});
 assert.equal(selected.requirementsDisputed,true);
 assert.equal(selected.oneHanded,null);
 assert.equal(selected.twoHanded,null);
 assert.equal(selected.missingOneHanded,null);
 assert.equal(selected.requirements,null);
 assert.deepEqual(selected.reportedRequirements,[8,8,13,13,0]);
 assert.match(selected.note,/DISPUTED/);
});
test('wield filters and rank ordering cannot treat contested requirements as confirmed',()=>{
 for(const mode of ['one','standard-two']){
  const matches=searchCatalog(catalog.weapons,{
   term:'Madding Hand',wield:mode,stats:[99,99,99,99,99]
  });
  assert.equal(matches.results.some(w=>w.id===madding.id),false);
 }
 const sorted=searchCatalog(catalog.weapons,{term:'Hand',sort:'requirements',
  stats:[99,99,99,99,99],limit:100});
 assert.ok(sorted.results.some(w=>w.id===madding.id));
 assert.equal(weaponWieldShortfall(madding,[99,99,99,99,99]).known,false);
});
test('disputed requirement never enters minimal stat target, including same shortlist as known weapon',()=>{
 const plan=planShortlistWielding([madding.id,milady.id],
  catalog.weapons,[...samurai.stats],samurai,{allowSote:true});
 assert.equal(plan.allSafeToApply,false);
 assert.equal(plan.allRequirementsKnown,false);
 assert.equal(plan.oneHand.canApply,false);
 assert.equal(plan.twoHand.canApply,false);
 const row=plan.rows.find(x=>x.id===madding.id);
 assert.equal(row.requirementsDisputed,true);
 assert.equal(row.requirementsKnown,false);
 assert.equal(row.oneHand,null);
 assert.equal(row.twoHand,null);
 assert.equal(plan.rows.find(x=>x.id===milady.id).requirementsKnown,true);
});
test('Build A/B preserves disputed status without inventing source weapon eligibility',()=>{
 const a={origin:'Samurai',stats:[...samurai.stats],
  ownsTarnishedPack:false,ownsSote:true,weaponId:madding.id};
 const b={...a,weaponId:milady.id};
 const model=compareBuildSnapshots(a,b,{weapons:catalog.weapons});
 assert.equal(model.baseline.weapon.requirementsDisputed,true);
 assert.equal(model.baseline.weapon.oneHanded,null);
 assert.equal(model.current.weapon.requirementsDisputed,false);
 assert.equal(model.current.weapon.oneHanded,false,'Samurai DEX 15 does not meet Milady DEX 17; unaffected lookup remains reliable');
});
test('all six attack disputes have explicitly labelled community +0 values but no confident attack filter',()=>{
 const disputed=catalog.weapons.filter(hasDisputedAttack);
 assert.equal(disputed.length,6);
 for(const item of disputed){
  const model=compareWeaponReferences(catalog.weapons,[item.id]);
  const byLabel=key=>model.rows.find(row=>row.label===key).values[0];
  assert.match(byLabel('Source dispute'),/Base attack unresolved/);
  for(const [i,component] of ['Physical','Magic','Fire','Lightning','Holy'].entries())
   assert.equal(byLabel(component+' +0 base'),
    'DISPUTED (community '+item.attack[i]+')');
  const selected=inspectBuildWeapon(catalog.weapons,item.id,stats8,{allowSote:true});
  assert.equal(selected.attackAtZero,null);
  assert.deepEqual(selected.reportedAttackAtZero,item.attack);
  assert.equal(selected.attackDisputed,true);
 }
 const matches=searchCatalog(catalog.weapons,{
  term:'Smithscript Axe',damage:'physical'
 });
 assert.equal(matches.results.some(w=>w.id===axe.id),false);
 const model=compareWeaponReferences(catalog.weapons,[madding.id,milady.id],stats5);
 const byLabel=key=>model.rows.find(row=>row.label===key).values;
 assert.match(byLabel('FAI requirement')[0],/DISPUTED/);
 assert.equal(byLabel('One-hand requirements')[0],'UNRESOLVED source conflict');
 assert.equal(byLabel('Two-hand STR assumption')[0],'UNRESOLVED source conflict');
 assert.equal(byLabel('One-hand requirements')[1],'Met');
});
test('unaffected weapon behaviour stays unchanged and UI explicitly displays conflict caveats',()=>{
 const sword=find('Greatsword');
 const result=weaponRequirementComparison(sword,[31,12,10,10,10]);
 assert.equal(result.oneHanded.canWield,true);
 assert.equal(hasDisputedAttack(sword),false);
 assert.equal(hasDisputedRequirements(sword),false);
 const html=read('src/weapon-catalog-app.mjs');
 assert.ok(html.includes('NOT confirmed in-game figures'));
 assert.ok(html.includes('hasDisputedRequirements(chosen)'));
 assert.ok(html.includes("'catalog-requirements-link').hidden=true"));
 assert.ok(read('src/app.mjs').includes('requirements DISPUTED'));
 const page=read('weapon-database/index.html');
 assert.ok(page.includes('Stone-Sheathed Sword has an UNKNOWN +0 base attack'));
 assert.ok(page.includes('six +0 base attacks and one attribute requirement'));
 assert.ok(page.includes('href="../validation-status/#conflict-dossier"'));
 assert.ok(!page.includes('only Stone-Sheathed Sword retains a disputed +0 base attack'));
});
