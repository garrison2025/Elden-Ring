import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeQuickArCalculatorUrl,makeArWorkbenchUrl,parseArWorkbenchHandoff} from '../public/src/ar-workbench-navigation.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('dedicated browser-only AR entry is discoverable and cannot trigger external load automatically',()=>{
 const html=read('public/weapon-ar-calculator/index.html');
 const app=read('public/src/weapon-ar-calculator-app.mjs');
 assert.match(html,/Weapon AR Calculator/);
 assert.match(html,/id="qar-load-source"/);
 assert.match(html,/id="qar-workspace" hidden/);
 assert.match(html,/50 \/ 50 matched website AR checks/);
 assert.match(html,/id="qar-weapon"/);
 assert.match(html,/id="qar-affinity"/);
 assert.match(html,/id="qar-twohand"/);
 assert.match(html,/id="qar-upgrade"/);
 assert.match(html,/noindex,nofollow/);
 assert.match(html,/Regulation 1\.17\.3/);
 assert.match(app,/sourceButton\.addEventListener\('click',async\(\)=>/);
 assert.match(app,/downloadV117Source\(fetch,\{signal:controller\.signal\}\)/);
 assert.doesNotMatch(app,/localStorage|sessionStorage|indexedDB/);
 assert.match(app,/new Worker\(new URL\('\.\/ar-workbench-worker\.mjs'/);
 assert.match(app,/op:'select'/);
 assert.match(app,/op:'compare'/);
 assert.match(app,/reference calculation complete|Reference calculation complete/);
});
test('deep links use exactly five attributes, same-source family and limited reinforcement',()=>{
 const url=makeQuickArCalculatorUrl('Uchigatana',[40,40,10,10,10],25);
 assert.equal(url,'../weapon-ar-calculator/?weapon=Uchigatana&player=40%2C40%2C10%2C10%2C10&upgrade=25');
 assert.deepEqual(parseArWorkbenchHandoff(url.slice(url.indexOf('?'))),{
  weapon:'Uchigatana',stats:[40,40,10,10,10],upgrade:25
 });
 assert.equal(makeArWorkbenchUrl('Uchigatana'),'../weapon-data-workbench/?weapon=Uchigatana');
 assert.throws(()=>makeQuickArCalculatorUrl('Uchigatana',[0,40,10,10,10]),/1 to 99/);
 assert.throws(()=>makeQuickArCalculatorUrl('Uchigatana',null,26),/upgrade/);
 assert.throws(()=>makeQuickArCalculatorUrl(' '.repeat(2)),/name/);
});
test('new page uses same Worker 1H/2H AR engine and exact source-supported upgrade levels, never inferred +25 for somber',()=>{
 const app=read('public/src/weapon-ar-calculator-app.mjs');
 const core=read('public/src/ar-workbench-core.mjs');
 assert.match(app,/m\.description\.upgradeLevels/);
 assert.match(app,/selectedDescription\.upgradeLevels\.includes\(upgrade\)/);
 assert.match(app,/selectedDescription\.scopeFlags/);
 assert.match(app,/result\.oneHand\.total/);
 assert.match(app,/result\.twoHand\.total/);
 assert.match(app,/chosen\.perElement/);
 assert.match(app,/chosen\.missingRequirements/);
 assert.match(core,/upgrade-unavailable/);
 assert.match(core,/somber-weapon-skill-damage-not-modeled/);
 assert.match(app,/sourceKind==='demo'/);
 assert.match(app,/FICTIONAL/);
 assert.match(app,/No parameters loaded|No calculated result yet/);
});
test('homepage, catalog and source navigation expose the simple AR mode without removing the advanced tool',()=>{
 const home=read('public/index.html');
 const catalog=read('public/weapon-database/index.html');
 const catalogScript=read('public/src/weapon-catalog-app.mjs');
 const navigation=read('scripts/navigation.mjs');
 assert.match(home,/href="weapon-ar-calculator\/"/);
 assert.match(home,/10 \/ WEAPON AR/);
 assert.match(home,/href="weapon-data-workbench\/"/);
 assert.match(catalog,/id="catalog-ar-source-link" href="\.\.\/weapon-ar-calculator\/"/);
 assert.match(catalogScript,/makeQuickArCalculatorUrl\(chosen\.name,arStats/);
 assert.match(navigation,/\['weapon-ar-calculator\/','Weapon AR Calculator'\]/);
});
test('new browser tool is withheld from SEO until relevant data rights/current-patch release gate is approved',()=>{
 const build=read('scripts/build.mjs');
 const artifact=read('scripts/verify-deployment-artifact.mjs');
 assert.match(build,/'weapon-ar-calculator'/);
 assert.match(artifact,/'weapon-ar-calculator'/);
 const html=read('public/weapon-ar-calculator/index.html');
 assert.doesNotMatch(html,/<link rel="canonical"/);
 assert.match(html,/Third-party game-derived data rights/);
});
