/** Two independent real Chrome reads, 2026-11-01, Tarnished.dev public v1.17.
 * CI run 41285325858, jobs 124785346388 and 124785346531:
 * Gravebird Bracelets, Arms, Weight 1.7, Poise 3.
 * Wretch baseline eight character stats all 10 unchanged after equipped.
 * 12 other metrics and conditional bonuses UNKNOWN; no asset/data files copied.
 */
const otherKeys=["physical","strike","slash","pierce","magic","fire","lightning","holy","immunity","robustness","focus","vitality"];
export const DIRECT_V117_GRAVEBIRD_BRACELETS=Object.freeze({
 id:'dlc-gravebird-bracelets-v117-direct',
 name:'Gravebird Bracelets',slot:'Arms',weight:1.7,poise:3,
 metrics:Object.freeze(Object.fromEntries([['poise',3],...otherKeys.map(k=>[k,null])])),
 siteDirectFields:Object.freeze({
  weight:'Tarnished.dev v1.17 real UI twice: 124785346388, 124785346531',
  poise:'Tarnished.dev v1.17 real UI twice: 124785346388, 124785346531'
 }),dlc:true,
 effectNotModeled:'Eight final character attributes unchanged at Wretch 10. Twelve other armor metrics and contextual special effects remain unverified.'
});
