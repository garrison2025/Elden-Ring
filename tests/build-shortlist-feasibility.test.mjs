import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CLASSES,runeRange} from '../public/src/core.mjs';
import {validateCommunityCatalog,weaponRequirementComparison} from '../public/src/community-weapons.mjs';
import {planShortlistWielding} from '../public/src/build-shortlist-feasibility.mjs';

const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const catalog=validateCommunityCatalog(JSON.parse(read('data/community-weapon-catalog.json')));
const find=name=>catalog.weapons.find(w=>w.name===name);
const samurai=CLASSES.find(c=>c.name==='Samurai');
const stats=[...samurai.stats];

test('existing Uchigatana + Greatsword shortlist computes proper per-weapon requirements and cheapest cumulative stat targets',()=>{
 const weapons=[find('Uchigatana'),find('Greatsword')];
 assert.ok(weapons.every(Boolean));
 const plan=planShortlistWielding(weapons.map(w=>w.id),catalog.weapons,stats,samurai);
 assert.equal(plan.weaponCount,2);
 assert.equal(plan.currentLevel,9);
 assert.equal(plan.allRequirementsKnown,true);
 assert.equal(plan.allSafeToApply,true);
 assert.equal(plan.rows[0].oneHand.canWield,true);
 assert.equal(plan.rows[1].oneHand.canWield,false);
 const greatsword=weapons[1];
 const expected=weaponRequirementComparison(greatsword,stats.slice(3));
 assert.equal(plan.rows[1].oneHand.totalMissing,expected.oneHanded.totalMissing);
 assert.equal(plan.rows[1].twoHand.totalMissing,expected.twoHanded.totalMissing);
 assert.equal(plan.rows[1].standardTwoHandBonus,true);
 assert.equal(plan.oneHand.targetStats[3],Math.max(stats[3],greatsword.requirements[0]));
 assert.equal(plan.twoHand.targetStats[3],
  Math.max(stats[3],Math.ceil(greatsword.requirements[0]*2/3)));
 assert.ok(plan.oneHand.additionalLevels>plan.twoHand.additionalLevels);
 assert.equal(plan.oneHand.additionalRunes,runeRange(9,plan.oneHand.level));
 assert.equal(plan.twoHand.additionalRunes,runeRange(9,plan.twoHand.level));
 assert.equal(plan.oneHand.delta.reduce((a,b)=>a+b,0),plan.oneHand.additionalLevels);
 assert.equal(plan.twoHand.delta.reduce((a,b)=>a+b,0),plan.twoHand.additionalLevels);
 assert.ok(!('totalWeight' in plan));
 assert.match(plan.note,/No combination of weapons is assumed equipped/i);
});

test('separately evaluated candidates use per-attribute MAX, not SUM of requirements',()=>{
 const a={id:'one',name:'One',category:'Colossal Sword',requirements:[30,16,0,0,0],weight:16};
 const b={id:'two',name:'Two',category:'Colossal Sword',requirements:[25,22,0,0,0],weight:12};
 const plan=planShortlistWielding(['one','two'],[a,b],stats,samurai);
 assert.equal(plan.oneHand.targetStats[3],30);
 assert.equal(plan.oneHand.targetStats[4],22);
 assert.equal(plan.oneHand.additionalLevels,(30-stats[3])+(22-stats[4]));
 assert.equal(plan.twoHand.targetStats[3],20);
 assert.equal(plan.twoHand.targetStats[4],22);
 assert.equal(plan.twoHand.additionalLevels,(20-stats[3])+(22-stats[4]));
 assert.equal(plan.rows[0].weight,16);
 assert.equal(plan.rows[1].weight,12);
 assert.equal(plan.rows[1].oneHand.minimumStats[0],25);
 assert.equal(plan.oneHand.canApply,true);
});

test('weapon categories with no standard two-hand bonus never receive invented STR discount',()=>{
 const staff={id:'staff',name:'Staff',category:'Glintstone Staff',
  requirements:[30,25,15,0,0],weight:3};
 const plan=planShortlistWielding(['staff'],[staff],stats,samurai);
 assert.equal(plan.rows[0].standardTwoHandBonus,false);
 assert.deepEqual(plan.twoHand.targetStats,plan.oneHand.targetStats);
 assert.deepEqual(plan.twoHand.shortfalls,plan.oneHand.shortfalls);
});

test('unknown and source-conflicted requirements are shown but disable automatic stat changes',()=>{
 const absent={id:'unknown-req',name:'Unavailable requirements',
  category:'Greatsword',requirements:null,weight:null};
 const unknown=planShortlistWielding([absent.id],[absent],stats,samurai);
 assert.equal(unknown.allRequirementsKnown,false);
 assert.equal(unknown.allSafeToApply,false);
 assert.equal(unknown.rows[0].oneHand,null);
 assert.equal(unknown.rows[0].weight,null);
 assert.equal(unknown.oneHand.canApply,false);
 const flagged={id:'disputed',name:'Conflicting requirement source',
  category:'Greatsword',requirements:[30,12,0,0,0],weight:12,
  flags:['v117-community-requirement-conflict']};
 const disputed=planShortlistWielding([flagged.id],[flagged],stats,samurai);
 assert.equal(disputed.rows[0].requirementsDisputed,true);
 assert.equal(disputed.allSafeToApply,false);
 assert.equal(disputed.oneHand.canApply,false);
});

test('SOTE off rejects DLC candidate; invalid stats and duplicate IDs fail closed',()=>{
 const dlc=catalog.weapons.find(w=>w.expansion==='Shadow of the Erdtree');
 assert.throws(()=>planShortlistWielding([dlc.id],catalog.weapons,stats,samurai),
  /Enable Shadow/);
 assert.throws(()=>planShortlistWielding(['unknown'],catalog.weapons,stats,samurai),
  /unknown source weapon/);
 assert.throws(()=>planShortlistWielding([find('Uchigatana').id,find('Uchigatana').id],
  catalog.weapons,stats,samurai),/distinct/);
 assert.throws(()=>planShortlistWielding([],catalog.weapons,stats,samurai),/1 to 8/);
 assert.throws(()=>planShortlistWielding([find('Uchigatana').id],
  catalog.weapons,[...stats.slice(0,3),'',...stats.slice(4)],samurai),/valid integer/);
 assert.throws(()=>planShortlistWielding([find('Uchigatana').id],
  catalog.weapons,stats,{name:'Unknown origin'}),/Valid Build origin/);
});

test('live Build shortlist planner is visibly wired to source rows and actions and not represented as AR',()=>{
 const html=read('build-planner/index.html'),js=read('src/app.mjs'),css=read('assets/style.css');
 for(const id of ['build-wield-plan','build-wield-title','build-wield-rows',
  'build-wield-apply-one','build-wield-apply-two','build-wield-one-summary',
  'build-wield-two-summary','build-wield-note']){
  assert.equal(html.split('id="'+id+'"').length-1,1,id);
 }
 assert.ok(js.includes("planShortlistWielding(smithingIds,weaponCatalog?.weapons,read(),current,"));
 assert.ok(js.includes("renderWieldPlan();"));
 assert.ok(js.includes("applyWieldStats('oneHand')"));
 assert.ok(js.includes("applyWieldStats('twoHand')"));
 assert.ok(css.includes('.build-wield-table{min-width:'));
 assert.ok(html.includes('individual reference weights'));
 assert.ok(html.includes('not a respec-cost estimate'));
});
