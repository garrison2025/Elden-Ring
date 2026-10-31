/**
 * Manual-input armor combination optimizer.
 * Does not include game-derived item data or claim that summed user scores
 * represent the game's actual multiplicative damage-negation percentage.
 */
export const ARMOR_SLOTS=Object.freeze(['head','chest','hands','legs']);
// Slot + case-folded name is an in-memory identity. Same names in different
// armor slots must remain independent. JSON tuples avoid separator collisions.
export const armorItemKey=item=>JSON.stringify([item.slot,item.name.toLowerCase()]);
const fail=s=>{throw new RangeError(s)};
const number=(raw,label,min,max,decimals=3)=>{
 const value=Number(raw);
 if(raw===''||raw===null||raw===undefined||!Number.isFinite(value)||value<min||value>max)
   fail(label+' must be a number between '+min+' and '+max+'.');
 if(Math.abs(value-Number(value.toFixed(decimals)))>1e-8)fail(label+' supports up to '+decimals+' decimals.');
 return value;
};
function int(raw,label,min,max){const n=number(raw,label,min,max,0);if(!Number.isInteger(n))fail(label+' must be a whole number.');return n;}
const weightUnits=v=>Math.round(v*1000);
export function validateArmorItems(items){
 if(!Array.isArray(items)||items.length===0||items.length>48)fail('Provide between 1 and 48 manually entered items.');
 const perSlot=Object.fromEntries(ARMOR_SLOTS.map(s=>[s,0])),names=new Set();
 return items.map((item,i)=>{
   if(!item||typeof item!=='object'||Array.isArray(item))fail('Each item must be an object.');
   const slot=String(item.slot??'').trim().toLowerCase();
   if(!ARMOR_SLOTS.includes(slot))fail('Item '+(i+1)+': slot must be head, chest, hands or legs.');
   const name=String(item.name??'').trim();
   if(!name||name.length>70)fail('Item '+(i+1)+': name must be 1–70 characters.');
   if(/[\r\n]/.test(name))fail('Item names cannot contain line breaks.');
   const k=slot+':'+name.toLowerCase();
   if(names.has(k))fail('Duplicate item name in '+slot+': '+name);
   names.add(k);perSlot[slot]++;
   if(perSlot[slot]>12)fail('Maximum 12 items per armor slot.');
   const weight=number(item.weight,'Weight for '+name,0,200);
   const score=number(item.score,'Custom score for '+name,0,1000,2);
   const poise=int(item.poise,'Poise for '+name,0,200);
   return {slot,name,weight,score,poise};
 });
}
function validateLimits(limits){
 if(!limits||typeof limits!=='object')fail('Supply optimization constraints.');
 const maxLoad=number(limits.maxLoad,'Maximum equipment load',0.001,2000);
 const reservedWeight=number(limits.reservedWeight,'Other equipped weight',0,2000);
 const targetTier=String(limits.targetTier??'medium').toLowerCase();
 if(!['light','medium','heavy'].includes(targetTier))fail('Target must be light, medium or under heavy threshold.');
 const minPoise=int(limits.minPoise??0,'Minimum poise',0,800);
 const poiseWeight=number(limits.poiseWeight??0,'Poise score weight',0,10,2);
 return {maxLoad,reservedWeight,targetTier,minPoise,poiseWeight};
}
const empty=slot=>({slot,name:'No armor',weight:0,score:0,poise:0,empty:true});
function better(a,b){
 if(a.objective!==b.objective)return b.objective-a.objective;
 if(a.totalWeight!==b.totalWeight)return a.totalWeight-b.totalWeight;
 if(a.poise!==b.poise)return b.poise-a.poise;
 return a.items.map(x=>x.name).join('|').localeCompare(b.items.map(x=>x.name).join('|'));
}
export function optimizeArmor(items,limits,excludedKeys=[]){
 const normalized=validateArmorItems(items),config=validateLimits(limits);
 const keys=excludedKeys instanceof Set?[...excludedKeys]:excludedKeys;
 if(!Array.isArray(keys)||keys.length>48||keys.some(k=>typeof k!=='string'))
   fail('Exclusions must be an array or Set of at most 48 armor item keys.');
 const excluded=new Set(keys);
 const available=normalized.filter(item=>!excluded.has(armorItemKey(item)));
 const groups=ARMOR_SLOTS.map(slot=>[empty(slot),...available.filter(x=>x.slot===slot)]);
 const maxUnits=weightUnits(config.maxLoad);
 const reservedUnits=weightUnits(config.reservedWeight);
 const tierTenths={light:3,medium:7,heavy:10}[config.targetTier];
 const maxSelected=5,best=[];
 let evaluated=0,valid=0;
 for(const head of groups[0])for(const chest of groups[1])
  for(const hands of groups[2])for(const legs of groups[3]){
    evaluated++;
    const selection=[head,chest,hands,legs];
    const poise=selection.reduce((a,v)=>a+v.poise,0);
    if(poise<config.minPoise)continue;
    const totalUnits=reservedUnits+selection.reduce((a,v)=>a+weightUnits(v.weight),0);
    // Strictly BELOW target percentage: exactly 30%, 70%, or 100% is excluded.
    if(totalUnits*10>=maxUnits*tierTenths)continue;
    valid++;
    const score=selection.reduce((a,v)=>a+v.score,0);
    const itemWeight=selection.reduce((a,v)=>a+v.weight,0);
    const objective=Math.round((score+config.poiseWeight*poise)*10000)/10000;
    const candidate={items:selection,poise,score,objective,totalWeight:totalUnits/1000,
      armorWeight:weightUnits(itemWeight)/1000,ratio:100*totalUnits/maxUnits};
    best.push(candidate);best.sort(better);if(best.length>maxSelected)best.pop();
  }
 return {constraints:config,evaluated,valid,excludedCount:normalized.length-available.length,top:best,
  note:'Optimizes the SUM of the custom scores you enter plus optional poise weighting; it does not calculate actual Elden Ring damage negation. Every slot may be empty.'};
}
export function parseArmorCsv(text){
 if(typeof text!=='string'||!text.trim()||text.length>14000)fail('CSV must be non-empty and no longer than 14,000 characters.');
 const rows=[];let row=[],field='',inside=false;
 const add=()=>{row.push(field);field='';rows.push(row);row=[];};
 for(let i=0;i<text.length;i++){
   const c=text[i];
   if(c==='"'){
     if(inside&&text[i+1]==='"'){field+='"';i++;}
     else inside=!inside;
   }else if(c===','&&!inside){row.push(field);field='';}
   else if((c==='\n'||c==='\r')&&!inside){if(c==='\r'&&text[i+1]==='\n')i++;add();}
   else field+=c;
 }
 if(inside)fail('Unterminated quoted CSV field.');
 if(field||row.length)add();
 const meaningful=rows.filter(r=>r.some(x=>x.trim()));
 if(meaningful.length<2)fail('CSV needs a header and at least one item.');
 const header=meaningful[0].map(v=>v.replace(/^\uFEFF/,'').trim().toLowerCase());
 const expected=['slot','name','weight','score','poise'];
 if(header.length!==5||header.some((x,i)=>x!==expected[i]))fail('CSV header must be exactly: slot,name,weight,score,poise');
 const items=meaningful.slice(1).map((r,i)=>{
   if(r.length!==5)fail('CSV line '+(i+2)+' must have exactly five columns.');
   return {slot:r[0].trim(),name:r[1].trim(),weight:r[2].trim(),score:r[3].trim(),poise:r[4].trim()};
 });
 return validateArmorItems(items);
}
export function armorCsv(items){
 const normalized=validateArmorItems(items);
 const q=x=>'"'+String(x).replace(/"/g,'""')+'"';
 return 'slot,name,weight,score,poise\r\n'+normalized.map(x=>[x.slot,x.name,x.weight,x.score,x.poise].map(q).join(',')).join('\r\n')+'\r\n';
}
