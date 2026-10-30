import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../public/weapon-data-workbench/index.html',import.meta.url),'utf8');
const ui=readFileSync(new URL('../public/src/ar-workbench-app.mjs',import.meta.url),'utf8');
const worker=readFileSync(new URL('../public/src/ar-workbench-worker.mjs',import.meta.url),'utf8');

test('manual AR evidence planner HTML inputs and browser handlers agree',()=>{
 const ids=[
  'arw-plan-run','arw-plan-download','arw-plan-export',
  'arw-plan-feedback','arw-plan-results','arw-plan-summary','arw-plan-rows',
  'arw-observation-app','arw-observation-reg','arw-observation-platform',
  'arw-observation-date','arw-recheck-batch','arw-recheck-batch-rows'
 ];
 for(const id of ids){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))??[]).length,1,
   id+' must appear exactly once');
  assert.ok(ui.includes("get('"+id+"')"),id+' must be referenced by browser UI');
 }
 for(const op of ['game-validation-plan','game-validation-plan-result',
  'recheck-observation','recheck-observation-result'])
  assert.ok(ui.includes(op)&&worker.includes(op),'Missing UI/Worker operation '+op);
 assert.ok(ui.includes('makeUnreviewedArObservationBatch('));
 assert.ok(ui.includes('gamePlanRevision'));
 assert.ok(ui.includes('if(!gamePlan||syntheticMode||gamePlan.synthetic)'));
 assert.ok(worker.includes('plan.synthetic=synthetic'));
});
