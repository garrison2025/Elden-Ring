import {planWeaponUpgradeBasket} from './upgrade-multi-weapon.mjs';

/**
 * Opt-in browser-only snapshot of manually confirmed smithing inputs.
 * Nothing is written unless the player clicks Save. No catalog source data,
 * game files, inventory API, weapon AR or player account is persisted.
 */
export const SMITHING_BASKET_STORAGE_KEY='buildlab:smithing-basket:v1';
export const SMITHING_BASKET_STORAGE_VERSION=1;
export const SMITHING_BASKET_MAX_JSON=10000;
const reject=message=>{throw new RangeError(message);};

export function makeSmithingBasketSnapshot(weapons,inventory){
 const plan=planWeaponUpgradeBasket(weapons,inventory);
 const saved={
  version:SMITHING_BASKET_STORAGE_VERSION,
  weapons:plan.weapons.map(w=>({
   name:w.name,track:w.track,from:w.from,to:w.to
  })),
  inventory:Object.fromEntries(plan.allMaterials
   .filter(row=>row.owned>0).map(row=>[row.key,row.owned]))
 };
 if(JSON.stringify(saved).length>SMITHING_BASKET_MAX_JSON)
  reject('Saved smithing list exceeds the local size limit.');
 return saved;
}

export function parseSmithingBasketSnapshot(raw){
 if(typeof raw!=='string'||raw.length<2||raw.length>SMITHING_BASKET_MAX_JSON)
  reject('Saved smithing list is empty or too large.');
 let data;
 try{data=JSON.parse(raw);}catch{reject('Saved smithing list contains invalid JSON.');}
 if(!data||typeof data!=='object'||Array.isArray(data)||
  data.version!==SMITHING_BASKET_STORAGE_VERSION||
  !Array.isArray(data.weapons)||!data.inventory||
  typeof data.inventory!=='object'||Array.isArray(data.inventory))
  reject('Saved smithing list has an unsupported or invalid format.');
 // For saved files we only allow normalized numeric upgrade levels.
 // Do not coerce null, empty strings, objects, or stale version data.
 for(const row of data.weapons){
  if(!row||typeof row!=='object'||Array.isArray(row)||
   typeof row.name!=='string'||typeof row.track!=='string'||
   !Number.isInteger(row.from)||!Number.isInteger(row.to))
   reject('Saved smithing weapon row has invalid field types.');
 }
 return makeSmithingBasketSnapshot(data.weapons,data.inventory);
}
