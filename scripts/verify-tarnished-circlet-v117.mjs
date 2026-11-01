import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const a=JSON.parse(readFileSync('.audit/tarnished-dlc-circlet-first.json','utf8'));
const b=JSON.parse(readFileSync('.audit/tarnished-dlc-circlet-v117.json','utf8'));
for(const [pass,x] of [['first',a],['second',b]]){
 assert.equal(x.rows?.length,1,pass+' must read only Circlet');
 const row=x.rows[0];
 assert.equal(row.valid,true,pass+' must select actual public item');
 assert.equal(row.name,'Circlet of Light');
 assert.equal(row.siteName,'Circlet of Light');
 assert.equal(row.slot,'Head');
 assert.equal(row.weight,1,pass+' public weight');
 assert.equal(row.poise,5,pass+' public Poise');
 assert.equal(x.baseline.emptyWeight,0);
 assert.equal(x.baseline.emptyPoise,0);
 assert.equal(x.baseline.unbuffed,true);
}
assert.deepEqual(a.rows[0].liveMetrics,b.rows[0].liveMetrics);
assert.deepEqual(a.rows[0].equippedFinalStats,b.rows[0].equippedFinalStats);
console.log('[NEW DLC DIRECT PARITY]',JSON.stringify({name:'Circlet of Light',
 weight:1,poise:5,passes:2,site:'Tarnished.dev v1.17',slots:'Head only'}));
