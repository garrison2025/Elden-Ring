import {POWER_STATS} from './weapon-ar.mjs';

/**
 * Prepare a locally downloadable, independently supplied game-menu observation.
 * Comparing one user-entered value never authenticates its origin or grants
 * permission to publish game-derived datasets/screenshots.
 */
const fail=message=>{throw new RangeError(message);};
function field(value,label,max=160){
 if(typeof value!=='string'||!value.trim()||value.trim().length>max||
    /[\u0000-\u001f\u007f]/.test(value))fail(label+' is required (max '+max+' characters).');
 return value.trim();
}
function arInteger(value,label,max=20000){
 if(!Number.isInteger(value)||value<0||value>max)fail(label+' must be a whole number from 0 to '+max+'.');
 return value;
}
function date(value){
 if(typeof value!=='string'||!/^20\d{2}-\d{2}-\d{2}$/.test(value))fail('Enter the date the game menu was observed.');
 const parsed=new Date(value+'T00:00:00Z');
 if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==value)
  fail('Invalid game observation date.');
 return value;
}
export function makeUnreviewedArObservation({
 weaponName,sourceVersion,gameAppVersion,regulationVersion,platform,observedAt,
 evidenceReference,stats,upgrade,twoHanded,observedTotal,candidateTotal,synthetic=false
}={}){
 if(synthetic)fail('Fictional demo calculations cannot be exported as real-game observations.');
 if(!stats||typeof stats!=='object'||Array.isArray(stats)||
    !POWER_STATS.every(s=>Number.isInteger(stats[s])&&stats[s]>=1&&stats[s]<=99))
  fail('Five actual player attributes are required.');
 if(typeof twoHanded!=='boolean')fail('Grip must be specified.');
 arInteger(upgrade,'Upgrade',25);
 const observed=arInteger(observedTotal,'Observed game AR');
 const candidate=arInteger(candidateTotal,'Candidate calculated AR');
 const when=date(observedAt);
 const name=field(weaponName,'Exact weapon/affinity name',120);
 const app=field(gameAppVersion,'Game app version',60);
 const regulation=field(regulationVersion,'Game regulation version',60);
 const gamePlatform=field(platform,'Game platform',60);
 const evidence=field(evidenceReference,'Game-menu evidence reference',300);
 const source=field(sourceVersion,'Candidate parameter source version',60);
 const difference=candidate-observed;
 return {
  schemaVersion:1,
  recordType:'independent-game-menu-ar-observation-draft',
  reviewStatus:'UNREVIEWED',
  gameClientVerified:false,
  publicationApproved:false,
  evidenceType:'manually-transcribed-game-equipment-menu',
  gameAppVersion:app,regulationVersion:regulation,platform:gamePlatform,observedAt:when,
  exactInputs:{weaponName:name,upgrade,twoHanded,
   stats:Object.fromEntries(POWER_STATS.map(s=>[s,stats[s]]))},
  expectedOutputs:{totalAr:observed},
  candidateCalculation:{parameterSourceVersion:source,totalAr:candidate,
   differenceCandidateMinusObserved:difference,numericMatch:difference===0},
  sourceEvidence:{reference:evidence,screenshotReviewed:false,independentReviewer:null},
  codeCommit:null,dataRevision:null,
  limitations:[
   'User transcription and evidence reference have NOT been independently inspected.',
   'A numeric match is not proof of game version parity or game-data publication rights.',
   'Weapon skills, status buildup, moveset multipliers and enemy damage are not validated.'
  ]
 };
}
