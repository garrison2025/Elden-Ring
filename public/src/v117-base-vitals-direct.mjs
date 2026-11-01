/**
 * Unbuffed BASE vitals: REAL numeric readouts from public Tarnished.dev v1.17.
 * 90 consecutive Wretch no-gear browser keyboard observations per stat.
 * GitHub Actions run 41281685407, artifact:
 * https://github.com/garrison2025/Elden-Ring/actions/runs/41281685407
 *
 * HP(VIG), FP(MND), Stamina(END), displayed Max Equip Load(END) only.
 * Wretch starting stats 10 across all 8, NO equipped gear, no buffs.
 * Each stat was swept 10..99 individually and restored to 10.
 * Results are input->actual displayed BASE values, not fitted formulas.
 * NO interpolation, NO claim of values for attributes 1..9.
 * Max Equip Load is the Tarnished UI rounded display (1 decimal)
 * and should NOT be used to calculate exact equipment roll thresholds.
 */
export const V117_BASE_CURVE_FIRST=10;
export const V117_BASE_CURVE_LAST=99;
export const V117_WRETCH_NO_GEAR_CURVES=Object.freeze({
 hp:Object.freeze([414,434,455,476,499,522,547,572,598,624,652,680,709,738,769,800,833,870,910,951,994,1037,1081,1125,1170,1216,1262,1308,1355,1402,1450,1476,1503,1529,1555,1581,1606,1631,1656,1680,1704,1727,1750,1772,1793,1814,1834,1853,1871,1887,1900,1906,1912,1918,1924,1930,1936,1942,1948,1954,1959,1965,1971,1977,1982,1988,1993,1999,2004,2010,2015,2020,2026,2031,2036,2041,2046,2051,2056,2060,2065,2070,2074,2078,2083,2087,2090,2094,2097,2100]),
 fp:Object.freeze([78,82,85,88,91,95,100,105,110,116,121,126,131,137,142,147,152,158,163,168,173,179,184,189,194,200,207,214,221,228,235,242,248,255,262,268,275,281,287,294,300,305,311,317,322,328,333,338,342,346,350,352,355,357,360,362,365,367,370,373,375,378,380,383,385,388,391,393,396,398,401,403,406,408,411,414,416,419,421,424,426,429,432,434,437,439,442,444,447,450]),
 stamina:Object.freeze([96,97,99,101,103,105,106,108,110,111,113,115,116,118,120,121,123,125,126,128,130,131,132,133,135,136,137,138,140,141,142,143,145,146,147,148,150,151,152,153,155,155,155,155,156,156,156,157,157,157,158,158,158,158,159,159,159,160,160,160,161,161,161,162,162,162,162,163,163,163,164,164,164,165,165,165,166,166,166,166,167,167,167,168,168,168,169,169,169,170]),
 maxEquipLoad:Object.freeze([48.2,49.8,51.4,52.9,54.5,56.1,57.7,59.3,60.9,62.5,64.1,65.6,67.2,68.8,70.4,72,73,74.1,75.2,76.4,77.6,78.9,80.2,81.5,82.8,84.1,85.4,86.8,88.1,89.5,90.9,92.3,93.7,95.1,96.5,97.9,99.4,100.8,102.2,103.7,105.2,106.6,108.1,109.6,111,112.5,114,115.5,117,118.5,120,121,122.1,123.1,124.1,125.1,126.2,127.2,128.2,129.2,130.3,131.3,132.3,133.3,134.4,135.4,136.4,137.4,138.5,139.5,140.5,141.5,142.6,143.6,144.6,145.6,146.7,147.7,148.7,149.7,150.8,151.8,152.8,153.8,154.9,155.9,156.9,157.9,159,160]),
});
export function verifiedV117BaseVitals(stats,{origin='Wretch'}={}){
 if(!Array.isArray(stats)||stats.length!==8||
  stats.some(n=>!Number.isInteger(Number(n))||Number(n)<1||Number(n)>99))
  throw new RangeError('Eight whole character attributes 1–99 are required.');
 const [vig,mnd,end]=stats.map(Number);
 if([vig,mnd,end].some(v=>v<V117_BASE_CURVE_FIRST||v>V117_BASE_CURVE_LAST)){
  return {status:'unsupported-baseline',hp:null,fp:null,stamina:null,maxEquipLoadDisplay:null,
   note:'Tarnished.dev v1.17 Wretch numeric browser reads cover VIG/MND/END 10–99 only; no below-10 guesses.'};
 }
 const c=V117_WRETCH_NO_GEAR_CURVES;
 const directlyObserved=origin==='Wretch'&&stats.every((v,i)=>i===0||i===1||i===2||Number(v)===10)&&
  [vig,mnd,end].filter(x=>x!==10).length<=1;
 const mixedNote=directlyObserved?
  'Directly sampled single-axis Wretch, 10 other base attributes, no equipment.':
  'Base per-attribute curves were each measured separately with Wretch. This combined/class-specific state was not itself independently checked.';
 return {status:directlyObserved?'direct-wretch-axis':'per-stat-site-curves-not-build-parity',
  hp:c.hp[vig-10],fp:c.fp[mnd-10],stamina:c.stamina[end-10],
  maxEquipLoadDisplay:c.maxEquipLoad[end-10],
  note:mixedNote+' All passive effects and actual equipped weight excluded; max load rounded for display only.'};
}
