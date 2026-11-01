import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const text=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('user-approved sole numeric benchmark is the actual Tarnished.dev v1.17 comparator',()=>{
 const policy=text('../docs/TARNISHED_ONLY_NUMERICAL_ACCEPTANCE_POLICY_20261101.md');
 const readme=text('../README.md');
 const page=text('../public/validation-status/index.html');
 assert.ok(policy.includes('pass/fail authority for numeric parity'));
 assert.match(policy,/Tarnished\.dev.*only/i);
 assert.match(policy,/independent.*browser process/i);
 assert.match(policy,/real public Tarnished\.dev calculator/i);
 assert.match(policy,/Icerind Hatchet/);
 for(const r of ['Build Planner','Weapon AR','Armor Optimizer','Damage Calculator'])
  assert.ok(policy.includes(r),r);
 assert.match(readme,/Tarnished\.dev only/);
 assert.match(readme,/116.*exact-input/);
 assert.match(readme,/one-point Icerind public AR discrepancy/);
 assert.match(page,/Numerical comparison standard: Tarnished\.dev public v1\.17 only/);
 assert.match(page,/matching the actual Tarnished\.dev calculator value passes numerical parity/);
 assert.match(page,/Icerind Hatchet/);
 assert.match(page,/name="robots" content="noindex,nofollow"/);
});
