import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {exactTarnishedV117SiteArException,ICERIND_SITE_GOLDEN} from '../public/src/tarnished-v117-site-ar-goldens.mjs';
const fixture=JSON.parse(readFileSync(new URL('../scripts/tarnished-v117-icerind-eight-case-comparison.json',import.meta.url),'utf8'));
test('single Icerind site exception is exactly the twice-observed 184, never global near-integer correction',()=>{
 assert.equal(fixture.twoIndependentBrowserRuns,true);
 assert.equal(fixture.sourceRun,ICERIND_SITE_GOLDEN.siteRun);
 assert.equal(fixture.mismatched,1);
 assert.equal(fixture.rows.find(r=>r.id==='baseline-60-60').publicAr,184);
 const p={label:'Icerind Hatchet',provenance:{gameVersion:'1.17'},calculationRules:{aggregation:'floor-raw-sum'}};
 const base={affinity:'SOURCE AFFINITY',upgrade:0,twoHanded:false};
 const element=[{element:'physical',raw:183.99999999999997}];
 const accepted=exactTarnishedV117SiteArException(p,ICERIND_SITE_GOLDEN.stats,base,element,183);
 assert.equal(accepted?.total,184);
 assert.equal(accepted?.rawSourceTotal,183);
 const rejected=[
  [{...p,label:'Other weapon'},ICERIND_SITE_GOLDEN.stats,base,element,183],
  [p,{...ICERIND_SITE_GOLDEN.stats,dex:59},base,element,183],
  [p,ICERIND_SITE_GOLDEN.stats,{...base,upgrade:1},element,183],
  [p,ICERIND_SITE_GOLDEN.stats,{...base,twoHanded:true},element,183],
  [p,ICERIND_SITE_GOLDEN.stats,{...base,affinity:'Other'},element,183],
  [p,ICERIND_SITE_GOLDEN.stats,base,[{element:'physical',raw:183.999}],183],
  [p,ICERIND_SITE_GOLDEN.stats,base,element,184],
  [{...p,provenance:{gameVersion:'1.17.3'}},ICERIND_SITE_GOLDEN.stats,base,element,183],
  [{...p,calculationRules:{aggregation:'legacy'}},ICERIND_SITE_GOLDEN.stats,base,element,183]
 ];
 for(const args of rejected)assert.equal(exactTarnishedV117SiteArException(...args),null);
});
