/**
 * Elden Ring weapon upgrade material schedule. Plain, small factual rules.
 * No game item assets or extracted parameter tables are redistributed.
 * Regular +1..+24: stone grades 1..8, steps 2/4/6; +25 Ancient Dragon.
 * Somber +1..+9: one stone of the matching grade; +10 Somber Ancient Dragon.
 * Runes and special-weapon eligibility are NOT calculated.
 */
export const TRACKS=Object.freeze(['regular','somber']);
const MAX_LEVEL=Object.freeze({regular:25,somber:10});
const error=s=>{throw new RangeError(s)};
const level=(raw,field,max)=>{
 const n=Number(raw);
 if(raw===''||raw===null||raw===undefined||!Number.isInteger(n)||n<0||n>max)error(field+' must be a whole number from 0 to '+max+'.');
 return n;
};
export function materialCatalog(track){
 if(!TRACKS.includes(track))error('Choose regular or somber weapon upgrades.');
 const rows=[];
 if(track==='regular'){
  for(let i=1;i<=8;i++)rows.push({key:'regular-'+i,label:'Smithing Stone ['+i+']'});
  rows.push({key:'regular-ancient',label:'Ancient Dragon Smithing Stone'});
 }else{
  for(let i=1;i<=9;i++)rows.push({key:'somber-'+i,label:'Somber Smithing Stone ['+i+']'});
  rows.push({key:'somber-ancient',label:'Somber Ancient Dragon Smithing Stone'});
 }
 return rows;
}
export function stoneForStep(track,targetLevel){
 if(!TRACKS.includes(track))error('Choose regular or somber weapon upgrades.');
 const n=level(targetLevel,'Target upgrade step',MAX_LEVEL[track]);
 if(n===0)error('Upgrade step must be at least +1.');
 if(track==='regular'){
  if(n===25)return {key:'regular-ancient',label:'Ancient Dragon Smithing Stone',amount:1};
  const grade=Math.ceil(n/3);
  return {key:'regular-'+grade,label:'Smithing Stone ['+grade+']',amount:[2,4,6][(n-1)%3]};
 }
 if(n===10)return {key:'somber-ancient',label:'Somber Ancient Dragon Smithing Stone',amount:1};
 return {key:'somber-'+n,label:'Somber Smithing Stone ['+n+']',amount:1};
}
export function planUpgradeMaterials(track,from,to,inventory={}){
 if(!TRACKS.includes(track))error('Choose regular or somber weapon upgrades.');
 const max=MAX_LEVEL[track];
 const a=level(from,'Current upgrade level',max);
 const b=level(to,'Target upgrade level',max);
 if(b<a)error('Target upgrade level cannot be below current level.');
 if(!inventory||typeof inventory!=='object'||Array.isArray(inventory))error('Inventory must be an object.');
 const catalog=materialCatalog(track);
 const valid=new Set(catalog.map(x=>x.key));
 for(const [key,value] of Object.entries(inventory)){
  if(!valid.has(key))error('Unknown material inventory key: '+key);
  if(!Number.isSafeInteger(value)||value<0||value>999999)error('Owned stones must be whole numbers from 0 to 999999.');
 }
 const required=Object.fromEntries(catalog.map(({key})=>[key,0]));
 const steps=[];
 for(let n=a+1;n<=b;n++){
  const s=stoneForStep(track,n);
  required[s.key]+=s.amount;
  steps.push({from:n-1,to:n,key:s.key,label:s.label,amount:s.amount});
 }
 const materials=catalog.map(row=>{
  const need=required[row.key],owned=inventory[row.key]??0;
  return {...row,required:need,owned,missing:Math.max(0,need-owned),leftover:Math.max(0,owned-need)};
 });
 return {track,from:a,to:b,steps,materials:materials.filter(row=>row.required>0),
  allMaterials:materials,
  totalStones:materials.reduce((s,v)=>s+v.required,0),
  totalMissing:materials.reduce((s,v)=>s+v.missing,0),
  totalSteps:steps.length,
  note:'Materials only. Does not estimate weapon-specific rune costs, current merchant prices, or eligibility for either upgrade track.'};
}
export function materialsCsv(result){
 const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';
 const cols=['material','required','owned','missing','leftover'];
 return 'material,required,owned,missing,leftover\r\n'+
   result.materials.map(r=>[r.label,r.required,r.owned,r.missing,r.leftover].map(quote).join(',')).join('\r\n')+'\r\n';
}
