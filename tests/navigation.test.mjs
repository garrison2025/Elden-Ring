import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {injectToolNavigation} from '../scripts/navigation.mjs';
test('all 11 tool/reference entries are present in source homepage grid',async()=>{
 const html=await readFile(resolve('public/index.html'),'utf8');
 const slugs=['build-planner','class-optimizer','level-rune-calculator','equip-load-calculator',
              'respec-planner','weapon-requirements','armor-optimizer','weapon-upgrade-calculator','weapon-database','weapon-ar-calculator','damage-calculator'];
 for(const slug of slugs)assert.ok(html.includes('class="panel tool-card" href="'+slug+'/'),slug+' missing');
 assert.equal((html.match(/class="panel tool-card"/g)||[]).length,11);
 assert.equal((html.match(/class="respec-feature"/g)||[]).length,0);
});
test('builder adds accessible desktop and mobile links with relative paths',async()=>{
 for(const path of ['public/index.html','public/build-planner/index.html','public/weapon-data-workbench/index.html']){
  const source=await readFile(resolve(path),'utf8');
  const uri=path==='public/index.html'?'':path.split('/')[1];
  const html=injectToolNavigation(source,uri);
  assert.match(html,/class="header-more"/);
  for(const name of ['respec-planner','weapon-requirements','armor-optimizer','weapon-upgrade-calculator','weapon-database','weapon-ar-calculator','damage-calculator']){
   const prefix=uri?'../':'';
   assert.equal((html.match(new RegExp('href="'+prefix+name+'/"','g'))||[]).length>=2,true,name+' absent in '+uri);
  }
  const prefix=uri?'../':'';
  assert.ok(html.includes('href="'+prefix+'updates/"'),'recent updates page missing in navigation');
  assert.equal(injectToolNavigation(html,uri),html,'build transform must be idempotent');
 }
});
