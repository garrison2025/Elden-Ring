#!/usr/bin/env node
/**
 * Offline AR comparison CLI.
 * A passing result means only "computed numbers match observations".
 * NEVER implies licensed weapon data or independently verified game parity.
 */
import {readFile,writeFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {compareArObservations} from '../public/src/ar-validation.mjs';
import {AR_SYNTHETIC_FIXTURE} from '../public/data/ar-synthetic-fixture.mjs';
import {AR_SYNTHETIC_OBSERVATIONS} from '../public/data/ar-observation-example.mjs';

const args=process.argv.slice(2);
function usage(){
  console.log('Usage: node scripts/verify-ar.mjs --example');
  console.log('   or: node scripts/verify-ar.mjs --profile profile.json --observations readings.json [--out report.json]');
  console.log('Research-only. Matching values do not certify real-game accuracy.');
}
async function jsonFile(filename,maxBytes){
  const path=resolve(filename);
  const info=await stat(path);
  if(!info.isFile()||info.size>maxBytes)throw Error('Input file missing, invalid or exceeds '+maxBytes+' bytes: '+filename);
  return JSON.parse(await readFile(path,'utf8'));
}
async function run(){
 if(args.length===1&&args[0]==='--help'){usage();return}
 let profile,observations,outPath=null;
 if(args.length===1&&args[0]==='--example'){
   profile=AR_SYNTHETIC_FIXTURE;observations=AR_SYNTHETIC_OBSERVATIONS;
   console.log('SYNTHETIC REGRESSION ONLY — no real Elden Ring weapon parameters.');
 }else{
   const allowed=new Set(['--profile','--observations','--out']);
   if(args.length<4||args.length%2!==0||args.some((a,i)=>i%2===0&&!allowed.has(a)))throw Error('Invalid arguments. Use --help for usage.');
   const map={};for(let i=0;i<args.length;i+=2){if(map[args[i]])throw Error('Duplicate argument '+args[i]);map[args[i]]=args[i+1]}
   if(!map['--profile']||!map['--observations'])throw Error('Both --profile and --observations are required.');
   profile=await jsonFile(map['--profile'],950000);
   observations=await jsonFile(map['--observations'],100000);
   outPath=map['--out']||null;
 }
 const result=compareArObservations(profile,observations);
 console.log('Profile:',result.profileLabel,'| Version:',result.gameVersion);
 console.log('Total:',result.summary.total,'| Exact matches:',result.summary.matches,
   '| Mismatches:',result.summary.mismatches,'| Errors:',result.summary.errors);
 for(const item of result.items){
   console.log(item.id+': '+item.status+' | expected '+item.expected+' | computed '+(item.computed??'n/a')+
     (item.error?' | '+item.error:''));
 }
 console.log('NOTE:',result.assessment);
 if(outPath)await writeFile(resolve(outPath),JSON.stringify(result,null,2)+'\n','utf8');
 if(result.summary.mismatches>0||result.summary.errors>0)process.exitCode=1;
}
run().catch(error=>{console.error('AR verification failed:',error.message);usage();process.exitCode=2});
