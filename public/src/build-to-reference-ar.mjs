import {makeQuickArCalculatorUrl} from './ar-workbench-navigation.mjs';

/**
 * Carry only an explicitly selected community reference weapon name and the
 * five combat stats from a valid eight-stat Build into the opt-in v1.17
 * reference calculator. No affinity, upgrade, damage, data source, or AR is
 * invented or transferred. The destination independently looks up the name
 * after the visitor chooses to load a pinned external source.
 */
export function makeBuildToReferenceArUrl(weapon,stats8){
 if(!weapon||typeof weapon!=='object'||Array.isArray(weapon)||
   typeof weapon.name!=='string'||!weapon.name.trim()||weapon.name.length>100||
   !/^[a-zA-Z0-9-]{1,100}$/.test(weapon.id??''))
  throw new RangeError('Select a recognized source weapon first.');
 if(!Array.isArray(stats8)||stats8.length!==8||
    !stats8.every(x=>Number.isInteger(x)&&x>=1&&x<=99))
  throw new RangeError('A valid eight-attribute Build is required.');
 return makeQuickArCalculatorUrl(weapon.name,stats8.slice(3));
}
