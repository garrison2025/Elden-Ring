// Intentionally fictional numeric parameters, solely for testing the research engine.
// Never label these numbers as an Elden Ring weapon. No game database is included.
const curve=Array.from({length:151},(_,i)=>Math.min(i/100,1));
const emptyRules=()=>Object.fromEntries(['str','dex','int','fai','arc'].map(s=>[s,{enabled:false}]));
const physicalRules=emptyRules();
physicalRules.str={enabled:true,impactRatio:1,overrideScaling:null};
physicalRules.dex={enabled:true,impactRatio:1,overrideScaling:null};
export const AR_SYNTHETIC_FIXTURE={
 schemaVersion:1,
 label:'Fictional Test Blade — NOT a real game weapon',
 provenance:{status:'synthetic-test',note:'Invented regression-test parameters only. No real game file or weapon data.'},
 requirements:{str:10,dex:10,int:0,fai:0,arc:0},
 affinities:{
  'TEST ONLY':{
   baseDamage:{physical:100,magic:0,fire:0,lightning:0,holy:0},
   baseScaling:{str:0.8,dex:0.2,int:0,fai:0,arc:0},
   correctionCurves:{physical:curve},
   elementScaling:{physical:physicalRules},
   upgrades:[
    {level:0,damageMultipliers:{physical:1},scalingMultipliers:{str:1,dex:1,int:1,fai:1,arc:1}},
    {level:1,damageMultipliers:{physical:1.1},scalingMultipliers:{str:1.05,dex:1.05,int:1,fai:1,arc:1}}
   ]
  }
 }
};
