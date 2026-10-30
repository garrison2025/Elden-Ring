#!/usr/bin/env node
/**
 * Convert one local JSON game-regulation object into a research-only AR profile.
 * Never executes .js files or downloads external data.
 */
import {readFile,writeFile,stat,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {convertCompactRegulation,listCompactWeaponNames} from '../public/src/regulation-import.mjs';
function fail(x){throw new Error(x)}
const args=process.argv.slice(2);
function usage(){console.log([
 'Usage: node scripts/import-regulation.mjs --input /path/regulation.json --list',
 '   or: node scripts/import-regulation.mjs --input /path/regulation.json --weapon "Exact Weapon Affinity Name" --version "1.17" --source "provenance and rights notes" --out local-ar-data/profile.json',
 '',
 'JSON only. No JS parsing/execution, game-file extraction or automatic downloads.',
 'Every generated profile is MANUAL-UNVERIFIED and cannot be publicly certified by this tool.'
 ].join('\n'))}
async function run(){
 if(args.length===1&&args[0]==='--help'){usage();return}
 if(args.length%2!==0 && args.at(-1)!=='--list')fail('Invalid arguments; use --help.');
 const flags=new Map();
 for(let i=0;i<args.length;i++){
  if(args[i]==='--list'){flags.set('--list',true);continue}
  const flag=args[i],value=args[++i];
  if(!['--input','--weapon','--version','--source','--out'].includes(flag)||!value||flags.has(flag))fail('Invalid argument: '+flag);
  flags.set(flag,value);
 }
 const file=flags.get('--input');if(!file)fail('Provide a local JSON input file.');
 const pathname=resolve(file);
 if(!pathname.endsWith('.json'))fail('Only .json files are allowed; never execute extracted JavaScript.');
 const size=await stat(pathname);
 if(!size.isFile()||size.size>16000000)fail('Input is not a file or exceeds 16 MB.');
 const raw=await readFile(pathname,'utf8');
 const hash=createHash('sha256').update(raw).digest('hex');
 const data=JSON.parse(raw);
 if(flags.has('--list')){
  const names=listCompactWeaponNames(data);
  console.log('Source SHA256:',hash,'| Unique exact names:',names.length);
  for(const name of names)console.log(name);
  return;
 }
 for(const f of ['--weapon','--version','--source','--out'])if(!flags.get(f))fail('Required argument missing: '+f);
 const profile=convertCompactRegulation(data,{weaponName:flags.get('--weapon'),gameVersion:flags.get('--version'),sourceReference:flags.get('--source')});
 profile.provenance.sourceSha256=hash;
 const dest=resolve(flags.get('--out'));
 if(dest===pathname)fail('Output path must not overwrite input.');
 await mkdir(dirname(dest),{recursive:true});
 await writeFile(dest,JSON.stringify(profile,null,2)+'\n','utf8');
 console.log('Wrote UNVERIFIED profile:',dest);
 console.log('Source SHA256:',hash);
 console.log('Next: collect INDEPENDENT in-game AR observations and run npm run verify:ar with matching version.');
 console.log('Do NOT commit or redistribute game data without a separate rights review.');
}
run().catch(e=>{console.error('Import failed:',e.message);usage();process.exitCode=2});
