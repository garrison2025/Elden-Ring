/**
 * Compare JSON data by its actual shape. Object key order is irrelevant;
 * arrays remain ordered; missing, extra, altered or differently typed values
 * are not accepted. Neither parser nor comparison approves evidence origin.
 */
export function sameJsonStructure(a,b){
 if(a===b)return true;
 if(a===null||b===null||typeof a!==typeof b||
  typeof a!=='object')return false;
 const aa=Array.isArray(a),bb=Array.isArray(b);
 if(aa!==bb)return false;
 if(aa)return a.length===b.length&&
  a.every((value,i)=>sameJsonStructure(value,b[i]));
 const ak=Object.keys(a),bk=Object.keys(b);
 return ak.length===bk.length&&ak.every(key=>
  Object.hasOwn(b,key)&&sameJsonStructure(a[key],b[key]));
}
