import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ITEM_CATALOG,createStartingInventory,grantItem,toggleEquipment,
 getEquipmentBonuses} from "../src/game/inventory.ts";
import {enemyProfile} from "../src/game/tactics.ts";
const inv=createStartingInventory("runner");
let equipped=toggleEquipment(grantItem(inv,"rifle_periferia"),"rifle_periferia");
equipped=toggleEquipment(grantItem(equipped,"nanofibras_dermicas"),"nanofibras_dermicas");
const bonus=getEquipmentBonuses(equipped);
assert.deepEqual({...bonus},{attackBonus:4,armorBonus:1,hpBonus:6,energyBonus:0,movementBonus:0});
assert.equal(ITEM_CATALOG.rifle_periferia.range,6);
assert.equal(ITEM_CATALOG.kit_trauma.healAmount,10);
assert.equal(ITEM_CATALOG.bioespuma.healAmount,7);
assert.equal(ITEM_CATALOG.bateria_portatil.energyAmount,5);
assert.equal(enemyProfile("eden-core",1).role,"helix");
assert.equal(enemyProfile("eden-core",2).role,"hunter");
assert.equal(enemyProfile("eden-relay",1).role,"suppressor");
assert.equal(enemyProfile("eden-relay",1).range,4);
const manager=readFileSync(new URL("../src/game/TurnManager.ts",import.meta.url),"utf8");
for(const required of ["useEnergySupply(amount:number)","this.weaponRange=options.weaponId?",
  "options.equipmentBonuses?.movementBonus","options.equipmentBonuses?.energyBonus",
  "options.equipmentBonuses?.hpBonus","this.state.encounterId.startsWith(\"eden-\")"]){
 assert.ok(manager.includes(required),"Integração de combate ausente: "+required);
}
console.log("Combate v0.8: efeitos de itens, papéis inimigos Éden e contrato de integração TypeScript aprovados.");
