/** Create complete, fail-closed AR -> Damage scenario links.
 * An absent damage channel is zero AR, never the Damage page's demo default.
 * This only transports v1.17 reference values; it does not certify damage. */
export const AR_DAMAGE_CHANNELS=Object.freeze(['physical','magic','fire','lightning','holy']);
export function createDamageHandoffUrl(currentUrl,perElement){
 if(!Array.isArray(perElement)||perElement.length>AR_DAMAGE_CHANNELS.length)
  throw new RangeError('Invalid AR components for a damage scenario.');
 const components=Object.fromEntries(AR_DAMAGE_CHANNELS.map(key=>[key,0]));
 const seen=new Set();
 for(const part of perElement){
  if(!part||!AR_DAMAGE_CHANNELS.includes(part.element)||
   seen.has(part.element)||!Number.isInteger(part.displayed)||
   part.displayed<0||part.displayed>10000)
   throw new RangeError('Missing, duplicate or unsupported AR damage component.');
  seen.add(part.element);
  components[part.element]=part.displayed;
 }
 if(!AR_DAMAGE_CHANNELS.some(key=>components[key]>0))
  throw new RangeError('At least one positive attack component is required.');
 const dest=new URL('../damage-calculator/',currentUrl);
 for(const key of AR_DAMAGE_CHANNELS)
  dest.searchParams.set(key,String(components[key]));
 return dest.toString();
}
