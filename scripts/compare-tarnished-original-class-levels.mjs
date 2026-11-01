#!/usr/bin/env node
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {CLASSES,buildLevel} from '../public/src/core.mjs';
const shard=Number(process.env.TARNISHED_CLASS_SHARD);
if(!Number.isInteger(shard)||shard<0||shard>=5)throw Error('Invalid class shard');
const orig=CLASSES.filter(x=>!x.dlc).slice(shard*2,shard*2+2);
const first=JSON.parse(readFileSync(resolve('.audit/class-first.json'),'utf8'));
const second=JSON.parse(readFileSync(resolve('.audit/v117-original-classes-'+shard+'.json'),'utf8'));
const list=[];
for(const source of [first,second]){
 if(source.site!=='Tarnished.dev public v1.17'||source.shard!==shard||
  source.rows?.length!==2)throw Error('Complete independent public class reads required');
}
for(let i=0;i<2;i++){
 const a=first.rows[i],b=second.rows[i],c=orig[i],expected=buildLevel(c,c.stats);
 const eq=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 if(a.class!==c.name||b.class!==c.name||a.valid!==true||b.valid!==true||
  a.version!=='Elden Ring Version: v1.17'||b.version!==a.version||
  a.publicLevel!==expected||b.publicLevel!==expected||
  a.expectedLevel!==expected||b.expectedLevel!==expected||
  a.delta!==0||b.delta!==0||
  !eq(a.expectedStats,c.stats)||!eq(b.expectedStats,c.stats)||
  !eq(a.actualStats,c.stats.map(String))||!eq(b.actualStats,c.stats.map(String))||
  a.observedLabel!==c.name||b.observedLabel!==c.name)
  throw Error('Invalid or mismatched double-read for original class '+c.name);
 list.push({class:c.name,level:expected,startingStats:c.stats,readTwice:true});
}
const result={site:'Tarnished.dev public v1.17',shard,accepted:2,
  independentReads:2,status:'CLASS_LEVEL_AND_EIGHT_STATS_MATCH',cases:list};
mkdirSync(resolve('.audit'),{recursive:true});
writeFileSync(resolve('.audit/class-comparison.json'),JSON.stringify(result,null,2)+'\n');
console.log('[CLASS LEVEL VERIFIED] '+JSON.stringify({shard,classes:list.map(x=>x.class),count:list.length}));
