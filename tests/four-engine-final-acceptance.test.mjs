import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const audit=JSON.parse(readFileSync(new URL('../public/v117-verification-closure.json',import.meta.url),'utf8'));
test('the single final acceptance gate executes 4 engines without granting full game or competitor parity',()=>{
 const output=execFileSync(process.execPath,
  [new URL('../scripts/check-four-engine-final-disposition.mjs',import.meta.url).pathname],
  {encoding:'utf8',timeout:20000});
 assert.match(output,/FOUR ENGINES: ONE-SHOT FINITE ACCEPTANCE PASSED/);
 assert.match(output,/"fullEngineParityAccepted":0/);
 assert.match(output,/"spellDirectInputMatches":24/);
 assert.match(output,/"realGameClientGoldens":0/);
});
test('final report has 4 individual concrete evidence gates and explicitly disallows old audit loops',()=>{
 const x=audit.finalFourEngineDecision;
 assert.equal(x.acceptedModules,0);
 assert.equal(x.limitedScopeModules,4);
 assert.deepEqual(Object.keys(x.modules).sort(),['armor','build','damage','spell']);
 assert.equal(x.modules.spell.actualSpellKindsCovered,1);
 assert.equal(x.modules.spell.exactTotal,24);
 assert.equal(x.unobservableData.nonzeroDefenseSpell.status,'NO_COMPARATOR_INPUT');
 assert.deepEqual(x.modules.build.referenceToggles,{greatRune:false,physick:false});
 assert.match(x.stopRepeatRule,/Do not re-run historic 487 weapon or 568 armor audits/);
 assert.ok(x.nextReopenPrerequisites.every(reason=>reason.length>=45));
});
