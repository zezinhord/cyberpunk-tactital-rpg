import assert from "node:assert/strict";
import {registerHooks} from "node:module";
registerHooks({resolve(specifier,context,next){
 if((specifier.startsWith("./")||specifier.startsWith("../"))&&
    !/\.[cm]?[jt]s$/.test(specifier))
  return next(specifier+".ts",context);
 return next(specifier,context);
}});
const {createStartingInventory,toggleEquipment,calibrateEquipment,
 grantItem,saveInventory,loadInventory,getEquipmentBonuses,
 equippedCalibration,ITEM_CATALOG,ITEM_IDS}=await import("../src/game/inventory.ts");
const {BATTLE_AFTERMATH_IDS,battleAftermathFor}=
 await import("../src/game/story/battle-aftermath.ts");
const {grantBattleSalvage,battleSalvageReceipt,campaignSalvage}=
 await import("../src/game/story/battle-salvage.ts");
const {readCouncils,DISTRICT_COUNCILS,COUNCIL_KEY}=
 await import("../src/game/story/district-councils.ts");
const {TurnManager}=await import("../src/game/TurnManager.ts");
const {CLASS_IDS}=await import("../src/game/classes/registry.ts");
const data=new Map();
globalThis.localStorage={
 getItem:id=>data.get(id)??null,
 setItem:(id,v)=>data.set(id,String(v)),
 removeItem:id=>data.delete(id),
};
const character={id:"rc20-test",originId:"corporativo",classId:"solo"};
assert.equal(CLASS_IDS.length,11);
assert(ITEM_IDS.length>=30);
assert.equal(BATTLE_AFTERMATH_IDS.length,21,
 "21 authored/parametric post-combat cinematic slots expected");
for(const encounter of BATTLE_AFTERMATH_IDS){
 const scene=battleAftermathFor(encounter,character);
 assert(scene&&scene.cinematicId==="battle-aftermath:"+encounter);
 assert(scene.text.length>160);
 assert.match(scene.text,/continuação depende|infraestrutura continua|A continuação depende/);
}
assert.equal(battleAftermathFor("test",character),null);
const councilProgress={version:1,choices:{baixada:"solidarity"},defended:[]};
data.set(COUNCIL_KEY+character.id,JSON.stringify(councilProgress));
assert.equal(readCouncils(character.id).choices.baixada,"solidarity");
const councilScene=battleAftermathFor("council-baixada",character);
assert(councilScene.text.includes(
 DISTRICT_COUNCILS.baixada.choices[0].outcome),
 "Cinematic must reflect the REAL persisted political choice");
assert(!councilScene.text.includes(DISTRICT_COUNCILS.baixada.choices[1].outcome));
let inv=createStartingInventory(character.id);
const oldHealth=getEquipmentBonuses(inv);
assert.equal(oldHealth.armorBonus,0);
inv=toggleEquipment(inv,"pistola_manutencao");
inv=toggleEquipment(inv,"colete_reaproveitado");
for(const material of ITEM_IDS.filter(x=>ITEM_CATALOG[x].category==="material"))
 inv=grantItem(inv,material,20);
const before=JSON.stringify(inv);
const tooLow=calibrateEquipment(inv,"pistola_manutencao",1);
assert.equal(tooLow.ok,false);
assert.equal(JSON.stringify(inv),before,"Failed calibration must not mutate save");
const first=calibrateEquipment(inv,"pistola_manutencao",2);
assert(first.ok);
assert.equal(equippedCalibration(first.state,"weapon"),1);
assert.equal(getEquipmentBonuses(first.state).attackBonus,2);
const second=calibrateEquipment(first.state,"pistola_manutencao",5);
assert(second.ok);
assert.equal(equippedCalibration(second.state,"weapon"),2);
assert.equal(getEquipmentBonuses(second.state).attackBonus,3);
const max=calibrateEquipment(second.state,"pistola_manutencao",10);
assert.equal(max.ok,false);
assert.equal(max.state,second.state);
const armor=calibrateEquipment(second.state,"colete_reaproveitado",2);
assert(armor.ok);
assert.equal(getEquipmentBonuses(armor.state).armorBonus,2);
const swapped=toggleEquipment(grantItem(armor.state,"pistola_inducao"),"pistola_inducao");
assert.equal(getEquipmentBonuses(swapped).attackBonus,2,
 "Calibrated stats MUST NOT transfer when swapping weapon");
assert.equal(swapped.calibrations.pistola_manutencao,2);
assert.equal(saveInventory(swapped),true);
const restored=loadInventory(character.id);
assert.deepEqual(restored.calibrations,swapped.calibrations);
assert.equal(getEquipmentBonuses(restored).attackBonus,2);
const bad={...restored,calibrations:{pistola_manutencao:900,
  colete_reaproveitado:2,fibra_optica:2}};
data.set("cyberpunk-tactical-rpg.inventory.v1."+character.id,JSON.stringify(bad));
const clean=loadInventory(character.id);
assert.equal(clean.calibrations.pistola_manutencao,undefined);
assert.equal(clean.calibrations.fibra_optica,undefined);
assert.equal(clean.calibrations.colete_reaproveitado,2);
const manager=new TurnManager({encounterId:"council-baixada"});
const premature=grantBattleSalvage(inv,manager.getState());
assert.equal(premature.awarded,false,"No loot before battle victory");
while(!manager.getState().combatComplete){
 manager.state.units.filter(x=>x.side==="enemy").forEach(x=>{x.hp=0});
 manager.resolveEnemyDown();
}
const won=manager.getState();
assert.equal(won.defeatedEnemyCount,won.totalWaves);
const loot=grantBattleSalvage(inv,won);
assert(loot.ok&&loot.awarded);
assert.equal(loot.drops.length,2);
assert(loot.state.rewardReceipts.includes(battleSalvageReceipt(won.encounterId)));
const retry=grantBattleSalvage(loot.state,won);
assert(retry.ok&&!retry.awarded);
assert.strictEqual(retry.state,loot.state,
 "Replaying an already completed battle must not duplicate items");
const defeated={...won,units:won.units.map(u=>
 u.id==="runner"?{...u,hp:0}:u)};
assert.equal(grantBattleSalvage(inv,defeated).awarded,false,
 "Player defeat may never generate salvage or XP");
const bounded={...inv,quantities:{...inv.quantities,reagente_bio:999}};
assert.equal(grantBattleSalvage(bounded,won).awarded,false,
 "No partial overflow or phantom receipts");
assert.equal(campaignSalvage("test").length,0);
assert(campaignSalvage("eden-core").some(x=>x.rarity==="raro"));
console.log("RC20 STORY + EQUIPMENT PASS: 21 encounter aftermaths, persisted council decisions, 11 classes, stat-bearing calibrations, v1 save compatibility, rare salvage and strict no-duplicate victory receipts.");