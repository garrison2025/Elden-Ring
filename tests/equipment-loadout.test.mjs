import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCommunityCatalog} from '../public/src/community-weapons.mjs';
import {
 LOADOUT_WEAPON_SLOTS,LOADOUT_MANUAL_SLOTS,planEquipmentLoadout,
 parseEquipCandidates,makeEquipCandidatesUrl
} from '../public/src/equipment-loadout.mjs';
const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const catalog=validateCommunityCatalog(JSON.parse(read('data/community-weapon-catalog.json')));
const find=name=>catalog.weapons.find(w=>w.name===name);
const weapons={
 rh1:find('Uchigatana').id,rh2:'',rh3:'',lh1:'',lh2:'',lh3:''
};
const armor=()=>Object.fromEntries(LOADOUT_MANUAL_SLOTS.map(x=>[x.id,{mode:'empty',weight:''}]));
const data=(over={})=>({weaponSlots:{...weapons},manualSlots:armor(),
 maxLoad:'75',confirmed:true,...over});

test('actual equipment slot counts and known source weapon weight, without summing shortlist candidates',()=>{
 assert.equal(LOADOUT_WEAPON_SLOTS.length,6);
 assert.equal(LOADOUT_MANUAL_SLOTS.length,8);
 assert.equal(find('Uchigatana').weight>0,true);
 const d=planEquipmentLoadout(data(),catalog.weapons);
 assert.equal(d.knownSubtotal,find('Uchigatana').weight);
 assert.equal(d.knownWeaponWeight,find('Uchigatana').weight);
 assert.equal(d.knownManualWeight,0);
 assert.equal(d.selectedCount,1);
 assert.equal(d.allKnown,true);
 assert.equal(d.complete,true);
 assert.equal(d.load.percent,find('Uchigatana').weight/75*100);
 assert.equal(d.load.tier,'Light');
});
test('manual armor/talisman weights are additive and actual six selected weapon slots are counted',()=>{
 const items=armor();
 items.head={mode:'equipped',weight:'4.5'};
 items.chest={mode:'equipped',weight:'11.25'};
 items.talisman1={mode:'equipped',weight:'0'};
 const w={...weapons,lh2:find('Greatsword').id};
 const p=planEquipmentLoadout(data({weaponSlots:w,manualSlots:items,maxLoad:'30'}),catalog.weapons);
 const expected=find('Uchigatana').weight+find('Greatsword').weight+4.5+11.25;
 assert.equal(p.knownSubtotal,Math.round(expected*1000)/1000);
 assert.equal(p.knownManualWeight,15.75);
 assert.equal(p.selectedCount,5);
 assert.equal(p.load.tier,'Overloaded');
});
test('strict threshold equality 30/70/100 percent crosses to the heavier tier',()=>{
 const noWeapons=Object.fromEntries(LOADOUT_WEAPON_SLOTS.map(x=>[x.id,'']));
 for(const [weight,tier] of [[29.999,'Light'],[30,'Medium'],[69.999,'Medium'],
  [70,'Heavy'],[99.999,'Heavy'],[100,'Overloaded']]){
  const manual=armor();manual.head={mode:'equipped',weight:String(weight)};
  const p=planEquipmentLoadout(data({weaponSlots:noWeapons,
   manualSlots:manual,maxLoad:'100'}),[]);
  assert.equal(p.load.tier,tier,String(weight));
 }
});
test('unverified selected weapon weight blocks final tier and does not become zero',()=>{
 const unknown={id:'unverified-weight',name:'Unknown DLC weight',
  expansion:'Shadow of the Erdtree',weight:null};
 const d=planEquipmentLoadout(data({weaponSlots:{...weapons,rh1:unknown.id}}),[unknown]);
 assert.equal(d.allKnown,false);
 assert.equal(d.complete,false);
 assert.equal(d.load,null);
 assert.deepEqual(d.unknown,['Right hand 1 · Unknown DLC weight']);
 assert.equal(d.knownSubtotal,0);
 assert.match(d.caution,/UNKNOWN weight/);
});
test('equipped armor with missing weight blocks final tier; explicit empty and explicit zero differ',()=>{
 const manual=armor();manual.legs={mode:'equipped',weight:''};
 const p=planEquipmentLoadout(data({manualSlots:manual}),catalog.weapons);
 assert.equal(p.complete,false);
 assert.deepEqual(p.unknown,['Leg armor']);
 manual.legs={mode:'equipped',weight:'0'};
 const ok=planEquipmentLoadout(data({manualSlots:manual}),catalog.weapons);
 assert.equal(ok.complete,true);
 assert.equal(ok.items.find(x=>x.slot==='Leg armor').weight,0);
});
test('unconfirmed or missing in-game max load shows subtotal but NO final roll tier',()=>{
 const unconfirmed=planEquipmentLoadout(data({confirmed:false}),catalog.weapons);
 assert.equal(unconfirmed.complete,false);
 assert.equal(unconfirmed.load,null);
 const noMax=planEquipmentLoadout(data({maxLoad:''}),catalog.weapons);
 assert.equal(noMax.maximum,null);
 assert.equal(noMax.complete,false);
 assert.equal(noMax.knownSubtotal,find('Uchigatana').weight);
});
test('malformed manual numbers, slots, IDs and inventory fail rather than inventing weights',()=>{
 const manual=armor();
 for(const value of ['-1','NaN','1e4','5.1234','201','01','',null,{},'4,5']){
  // Blank and null are UNKNOWN, not errors.
  manual.head={mode:'equipped',weight:value};
  if(value===''||value===null){
   assert.equal(planEquipmentLoadout(data({manualSlots:manual}),catalog.weapons).complete,false);
  }else{
   assert.throws(()=>planEquipmentLoadout(data({manualSlots:manual}),catalog.weapons),
    RangeError,String(value));
  }
 }
 manual.head={mode:'empty',weight:''};
 for(const max of ['NaN','0','-2','10001','1e3','3.1234']){
  assert.throws(()=>planEquipmentLoadout(data({manualSlots:manual,maxLoad:max}),
   catalog.weapons),RangeError);
 }
 assert.throws(()=>planEquipmentLoadout(data({weaponSlots:{...weapons,rh1:'../hack'}}),
  catalog.weapons),RangeError);
 assert.throws(()=>planEquipmentLoadout(data({weaponSlots:{...weapons,rh1:'not-present'}}),
  catalog.weapons),RangeError);
 assert.throws(()=>planEquipmentLoadout(data({confirmed:'true'}),catalog.weapons),RangeError);
});
test('Build shortlist candidate URL is ID-only, bounded, and NEVER pre-equips',()=>{
 const ids=[find('Greatsword').id,find('Uchigatana').id];
 const path=makeEquipCandidatesUrl(ids,'https://example.com/build-planner/?stats=99,99');
 assert.ok(path.startsWith('/equip-load-calculator/?candidates='));
 assert.deepEqual(parseEquipCandidates(new URL(path,'https://example.com').search),ids);
 for(const key of ['stats','weapon','weight','max','equipped'])
  assert.equal(new URL(path,'https://example.com').searchParams.has(key),false);
 assert.deepEqual(parseEquipCandidates('?other=hello'),[]);
 for(const value of ['?candidates=','?candidates=a&candidates=b',
  '?candidates=a,a','?candidates=../inject',
  '?candidates='+Array(9).fill('valid-weapon').join(',')])
  assert.throws(()=>parseEquipCandidates(value),RangeError);
 assert.throws(()=>makeEquipCandidatesUrl(ids,'javascript:alert(1)'),RangeError);
 assert.throws(()=>makeEquipCandidatesUrl(ids,'https://example.com/other/'),RangeError);
});
test('loadout page and Build handoff are wired without paid APIs or invented armor catalog',()=>{
 const html=read('equip-load-calculator/index.html');
 const app=read('src/equipment-loadout-app.mjs');
 const builder=read('src/equipment-loadout.mjs');
 const build=read('src/app.mjs');
 const buildHtml=read('build-planner/index.html');
 for(const id of ['equipment-weapon-fields','equipment-manual-fields','equipment-maximum',
  'equipment-confirm','equipment-clear','equipment-total','equipment-subtotal','equipment-tier']){
  assert.equal(html.split('id="'+id+'"').length-1,1,id);
  assert.ok(app.includes("'"+id+"'"));
 }
 assert.ok(html.includes('../src/equipment-loadout-app.mjs'));
 assert.ok(app.includes("validateCommunityCatalog(await response.json())"));
 assert.ok(app.includes("select.value='';select.disabled=false"));
 assert.ok(app.includes("confirmed.checked=false"));
 assert.ok(app.includes("planEquipmentLoadout(read(),catalog.weapons)"));
 assert.ok(buildHtml.includes('id="build-equipment-open"'));
 assert.ok(build.includes('makeEquipCandidatesUrl(smithingIds,location.href)'));
 assert.ok(!builder.includes('localStorage'));
 assert.ok(html.includes('Your character\'s maximum equip load'));
});
