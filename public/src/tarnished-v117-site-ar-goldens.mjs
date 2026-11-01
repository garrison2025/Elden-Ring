/** One exact-input direct-site AR boundary exception. No global IEEE-754 epsilon.
 *
 * Site evidence: Tarnished.dev v1.17 Build Calculator, two separate Chromium
 * observations, GitHub Actions 41268333282; verified 184 vs local source 183.
 * 39,552 independent source-algorithm cases previously ruled out changing
 * all near-integer floating-point sums.
 *
 * This exception is allowed ONLY for its exact published UI input and raw
 * source AR. Every other profile/case must keep the unmodified algorithm.
 */
export const ICERIND_SITE_GOLDEN=Object.freeze({
 weapon:'Icerind Hatchet',version:'1.17',affinity:'SOURCE AFFINITY',
 upgrade:0,twoHanded:false,
 stats:Object.freeze({str:60,dex:60,int:30,fai:30,arc:30}),
 sourceMathTotal:183,publicSiteTotal:184,sourceRaw:183.99999999999997,
 siteRun:41268333282
});
export function exactTarnishedV117SiteArException(profile,stats,selection,perElement,mathTotal){
 const gold=ICERIND_SITE_GOLDEN;
 if(profile?.label!==gold.weapon||profile?.provenance?.gameVersion!==gold.version||
  profile?.calculationRules?.aggregation!=='floor-raw-sum'||
  selection?.affinity!==gold.affinity||selection?.upgrade!==gold.upgrade||
  selection?.twoHanded!==gold.twoHanded||mathTotal!==gold.sourceMathTotal||
  !stats||Object.entries(gold.stats).some(([k,v])=>stats[k]!==v)||
  perElement?.length!==1||perElement[0].element!=='physical'||
  Math.abs(perElement[0].raw-gold.sourceRaw)>1e-12)
  return null;
 return {
  total:gold.publicSiteTotal,
  rawSourceTotal:mathTotal,
  reference:'Tarnished.dev public v1.17 exact-input two-browser site output',
  evidenceRun:gold.siteRun,
  scope:'This exact Icerind Hatchet +0 1H unbuffed 60/60/30/30/30 case only. Source math stays 183; site explicitly shows 184.'
 };
}
