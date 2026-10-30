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
  'arw-observation-date','arw-recheck-batch','arw-recheck-batch-rows',
  'arw-fingerprint-verify','arw-fingerprint-case','arw-fingerprint-file',
  'arw-fingerprint-run','arw-fingerprint-feedback'
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

test('optional screenshot SHA-256 is captured and compared without upload',()=>{
 assert.ok(ui.includes('fingerprintLocalScreenshot(file)'));
 assert.ok(ui.includes('compareLocalScreenshotToFingerprint(file,expected)'));
 assert.ok(ui.includes("input.type='file'")||ui.includes("imageInput.type='file'"));
 assert.ok(ui.includes('screenshotFingerprint'));
 assert.ok(ui.includes('if(revisionAtStart!==gamePlanRevision'));
 assert.ok(ui.includes('Screenshot-reviewed: 0.'));
});
