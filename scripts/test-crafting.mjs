import assert from "node:assert/strict";
import {ITEM_CATALOG,ITEM_IDS,createStartingInventory,loadInventory,saveInventory,
 grantItem,toggleEquipment,getEquipmentBonuses} from "../src/game/inventory.ts";
import {CRAFTING_RECIPES,canCraft,craftRecipe,craftingIngredientsLabel}
 from "../src/game/crafting.ts";
const id="protagonista-teste";
const old={version:1,ownerId:id,quantities:{
 pistola_manutencao:1,colete_reaproveitado:1,curativo_campo:2,conector_reuso:1,
},equipped:{weapon:null,armor:null}};
let storage=new Map([["cyberpunk-tactical-rpg.inventory.v1."+id,JSON.stringify(old)]]);
globalThis.localStorage={
 getItem:key=>storage.get(key)??null,
 setItem:(key,val)=>storage.set(key,String(val)),
 removeItem:key=>storage.delete(key),
};
let inventory=loadInventory(id);
assert.equal(inventory.quantities.residuo_metalico,0,"Material novo não existe em save legado");
assert.equal(inventory.quantities.celula_energia,0);
assert.equal(inventory.quantities.colete_reforcado,0);
assert.equal(inventory.quantities.pistola_inducao,0);
assert.equal(ITEM_IDS.length,Object.keys(inventory.quantities).length);
assert.equal(CRAFTING_RECIPES.length,2);
assert.ok(!canCraft(inventory,"colete-ferroviario"));
assert.equal(craftRecipe(inventory,"colete-ferroviario").ok,false);
inventory=grantItem(inventory,"residuo_metalico");
inventory=grantItem(inventory,"celula_energia");
inventory=grantItem(inventory,"conector_reuso");
assert.ok(canCraft(inventory,"colete-ferroviario"));
assert.ok(canCraft(inventory,"arma-inducao"));
const before=JSON.stringify(inventory);
const armor=craftRecipe(inventory,"colete-ferroviario");
assert.ok(armor.ok);
assert.equal(JSON.stringify(inventory),before,"Craft não pode mutar inventário original");
assert.equal(armor.state.quantities.residuo_metalico,0);
assert.equal(armor.state.quantities.conector_reuso,1);
assert.equal(armor.state.quantities.colete_reforcado,1);
assert.equal(canCraft(armor.state,"colete-ferroviario"),false,"Não duplicar equipamento sem material");
const pistol=craftRecipe(armor.state,"arma-inducao");
assert.ok(pistol.ok);
assert.equal(pistol.state.quantities.celula_energia,0);
assert.equal(pistol.state.quantities.conector_reuso,0);
assert.equal(pistol.state.quantities.pistola_inducao,1);
assert.equal(craftRecipe(pistol.state,"arma-inducao").ok,false,"Não criar arma sem ingredientes");
assert.equal(craftRecipe(pistol.state,"receita-inexistente").ok,false);
const equipped=toggleEquipment(toggleEquipment(pistol.state,"pistola_inducao"),"colete_reforcado");
assert.equal(getEquipmentBonuses(equipped).attackBonus,2);
assert.equal(getEquipmentBonuses(equipped).armorBonus,2);
assert.ok(craftingIngredientsLabel(CRAFTING_RECIPES[0]).includes(ITEM_CATALOG.residuo_metalico.name));
assert.equal(saveInventory(equipped),true);
assert.deepEqual(loadInventory(id),equipped,"Equipamentos novos persistem no save v1");
assert.ok(Object.values(equipped.quantities).every(x=>Number.isSafeInteger(x)&&x>=0&&x<=999));
console.log("Fabricação: migração de save legado, duas receitas, consumo real e equipamentos +2 aprovados.");
