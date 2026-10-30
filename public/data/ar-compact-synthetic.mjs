// Fictional, independently invented fixtures ONLY. Never real Elden Ring data.
const stages=[{maxVal:0,maxGrowVal:0,adjPt:1},{maxVal:148,maxGrowVal:1.48,adjPt:1}];
const attrs={str:1,dex:1,int:1,fai:1,arc:1};
const upr=[{attack:{0:1,1:1},attributeScaling:attrs},{attack:{0:1.1,1:1.1},attributeScaling:{...attrs,str:1.05,dex:1.05}}];
const base={weaponType:3,attack:[[0,100]],attributeScaling:[['str',0.8],['dex',0.2]],requirements:{str:10,dex:10},attackElementCorrectId:1,reinforceTypeId:1,calcCorrectGraphIds:{0:1}};
export const COMPACT_SYNTHETIC_REGULATION={
 weapons:[
  {...base,name:'Fictional Bronze Sword — QA ONLY',weaponName:'Invented Bronze Sword'},
  {...base,name:'Fictional Heavy Sword — QA ONLY',weaponName:'Invented Heavy Sword',attack:[[0,118]],attributeScaling:[['str',1.1],['dex',0.05]],requirements:{str:22,dex:10}},
  {...base,name:'Fictional Paired Knives — QA ONLY',weaponName:'Invented Knives',weaponType:35,paired:true,attack:[[0,75]],attributeScaling:[['str',0.4],['dex',0.6]],requirements:{str:8,dex:14}},
  {...base,name:'Fictional Magic Sword — QA ONLY',weaponName:'Invented Magic Sword',weaponType:5,attack:[[0,92],[1,38]],attributeScaling:[['str',0.45],['dex',0.2],['int',0.7]],requirements:{str:12,dex:11,int:16},calcCorrectGraphIds:{0:1,1:1},attackElementCorrectId:2}
 ],
 calcCorrectGraphs:{1:stages},attackElementCorrects:{1:{0:{str:true,dex:true}},2:{0:{str:true,dex:true},1:{int:true}}},reinforceTypes:{1:upr}
};
