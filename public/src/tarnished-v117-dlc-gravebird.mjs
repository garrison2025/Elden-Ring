/** Two independent real Chrome reads, 2026-11-01, Tarnished.dev public v1.17.
 * CI run 41285325858, jobs 124785346388 and 124785346531:
 * Gravebird Bracelets, Arms, Weight 1.7, Poise 3.
 * Wretch baseline eight character stats all 10 unchanged after equipped.
 * 12 metrics separately verified on two identical no-gear Wretch browser reads; conditional bonuses UNKNOWN; no asset/data files copied.
 */
const verifiedMetrics=Object.freeze({
 poise:3,
 physical:1.6,strike:1.7,slash:1.7,pierce:1.5,
 magic:2.1,fire:1.9,lightning:2.3,holy:2.3,
 immunity:17,robustness:8,focus:13,vitality:12
});
const proof='Tarnished.dev v1.17 real UI, separately observed on Wretch no-gear in 2 Chrome jobs: 124786798063 and 124786798232';
export const DIRECT_V117_GRAVEBIRD_BRACELETS=Object.freeze({
 id:'dlc-gravebird-bracelets-v117-direct',
 name:'Gravebird Bracelets',slot:'Arms',weight:1.7,poise:3,
 metrics:verifiedMetrics,
 siteDirectFields:Object.freeze(Object.fromEntries(
  ['weight','poise',...Object.keys(verifiedMetrics)].map(k=>[k,proof])
  )),dlc:true,
 effectNotModeled:'Eight final character attributes unchanged at Wretch 10. All twelve armor-only metrics were double-read with unchanged base stats; other contextual special effects remain unverified.'
});
