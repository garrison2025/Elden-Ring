/** REAL public Tarnished.dev v1.17 Build single-selection Wretch(10×8) values.
 * Each item twice observed in two separate public Chromium sessions,
 * https://github.com/garrison2025/Elden-Ring/actions/runs/41289643394
 * NO stacked effect, game-client patch, alternate attributes or activation
 * equivalence is certified. Great Rune and Physick produced stat changes even
 * when their UI "Activate" checkboxes read false. Never hide that discrepancy.
 */
export const V117_ISOLATED_SELECTED_EFFECTS=Object.freeze({
 'talisman:Starscourge Heirloom':Object.freeze({
  kind:'talisman',name:'Starscourge Heirloom',delta:Object.freeze([0,0,0,5,0,0,0,0]),
  weight:0.8,checkboxMismatch:false,
  sourceJobs:Object.freeze([124798010798,124798010663])}),
 "rune:Godrick's Great Rune":Object.freeze({
  kind:'rune',name:"Godrick's Great Rune",delta:Object.freeze([5,5,5,5,5,5,5,5]),
  weight:0,checkboxMismatch:true,
  sourceJobs:Object.freeze([124798010836,124798010915])}),
 'physick:Intelligence-knot Crystal Tear':Object.freeze({
  kind:'physick',name:'Intelligence-knot Crystal Tear',delta:Object.freeze([0,0,0,0,0,10,0,0]),
  weight:0,checkboxMismatch:true,
  sourceJobs:Object.freeze([124798010824,124798010834])})
});
export const V117_DOUBLE_READ_TALISMAN_WEIGHTS=Object.freeze({
 'Starscourge Heirloom':0.8
});
