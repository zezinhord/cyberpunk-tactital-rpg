import assert from "node:assert/strict";
import {TurnManager} from "../src/game/TurnManager.ts";
import {ITEM_CATALOG,createStartingInventory,grantItem,toggleEquipment,
 getEquipmentBonuses} from "../src/game/inventory.ts";
import {enemyProfile} from "../src/game/tactics.ts";
const inv=createStartingInventory("runner");
let ready=toggleEquipment(grantItem(inv,"rifle_periferia"),"rifle_periferia");
ready=toggleEquipment(grantItem(ready,"nanofibras_dermicas"),"nanofibras_dermicas");
const bonuses=getEquipmentBonuses(ready);
assert.equal(bonuses.attackBonus,4);
assert.equal(bonuses.hpBonus,6);
assert.equal(bonuses.armorBonus,1);
const core=new TurnManager({playerName:"Test Runner",encounterId:"eden-core",
 classId:"solo",weaponId:"rifle_periferia",equipmentBonuses:bonuses,currentHp:12});
let s=core.getState();
assert.equal(s.totalWaves,3,"Núcleo Éden precisa de três ondas");
assert.equal(s.units[0].maxHp,24,"Nanofibras aumentam a Vida máxima sem alterar bônus de origem");
assert.equal(s.units[0].hp,12,"A batalha deve iniciar com Vida persistida");
assert.equal(s.units[0].attackBonus,9,"A arma precisa modificar o combate");
assert.equal(s.units[0].armorClass,13,"Implante protege de verdade");
assert.equal(core.getBasicAttackPreview().range,6,"Rifle realmente altera alcance");
assert.equal(enemyProfile("eden-core",2).role,"hunter");
assert.equal(enemyProfile("eden-relay",1).role,"drone");
assert.equal(core.useMedicalSupply(10),true,"Kit médico utilizável como ação bônus");
assert.equal(core.getState().units[0].hp,22);
assert.equal(core.useMedicalSupply(10),false,"Ação bônus não duplica cura");
const relay=new TurnManager({encounterId:"eden-relay",
 equipmentBonuses:{attackBonus:0,armorBonus:0,hpBonus:0,energyBonus:4,movementBonus:2},
 currentHp:10});
s=relay.getState();
assert.equal(s.totalWaves,2);
assert.equal(s.energy,14);
assert.equal(s.maxEnergy,14);
assert.equal(s.movementPerTurn>=8,true);
assert.equal(relay.useEnergySupply(5),false,"Bateria não pode ser usada com energia cheia");
relay.state.energy=8; // Condição controlada para simular gasto anterior em combate.
assert.equal(relay.useEnergySupply(5),true);
assert.equal(relay.getState().energy,13);
assert.equal(relay.useEnergySupply(5),false,"Uma bateria por ação bônus");
assert.equal(ITEM_CATALOG.bateria_portatil.energyAmount,5);
console.log("Combate v0.8: alcance de arma, implantes, Vida, bateria, cura e duas interceptações Éden aprovados.");
