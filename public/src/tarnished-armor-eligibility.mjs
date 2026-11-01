/** Eligibility for Tarnished.dev numerical-reference-only armor optimization.
 * Weight must ALWAYS be directly observed, while the selected objective
 * must have its own separate real-site evidence. Do not count unknown,
 * duplicates, or stat-changing source fields as numerical parity.
 */
export function siteVerifiedArmorSubset(rows,metric){
 if(!Array.isArray(rows)||typeof metric!=='string'||!metric)
  throw new TypeError('Loaded armor rows and a metric are required.');
 const accepted=[],excluded=[];
 for(const item of rows){
  const proof=item?.siteDirectFields;
  const ok=!!(proof?.weight&&proof?.poise&&
   (metric==='poise'?proof.poise:proof?.[metric])&&
   Number.isFinite(item.weight)&&Number.isInteger(item.poise)&&
   Number.isFinite(metric==='poise'?item.poise:item.metrics?.[metric]));
  (ok?accepted:excluded).push(item);
 }
 return {accepted,excluded,metric,proofLevel:metric==='poise'?
  'Tarnished.dev twice-read armor Weight+Poise only':
  'Tarnished.dev twice-read Weight, Poise and one stat-neutral derived armor metric',
  fullComparatorOptimizerParityVerified:false};
}
