/** RC20 — salvage is a deterministic campaign consequence, not an XP hack.
 * One signed, per-character inventory receipt for each FIRST completed
 * encounter. Replaying a test or retrying a battle cannot generate items.
 * No changes to quests, factions, money or existing character save schema.
 */
import {ITEM_CATALOG,grantRewardInventoryItem,
  type ItemId,type InventoryState} from "../inventory.ts";
import {activeEnemies} from "../combat/squad-encounters.ts";
import type {EncounterId,GameState} from "../types.ts";

export type SalvageRarity="recuperado"|"incomum"|"raro";
export interface SalvageDrop{
 item:ItemId;amount:number;rarity:SalvageRarity;
}
export interface SalvageResult {
 ok:boolean;awarded:boolean;state:InventoryState;
 drops:readonly SalvageDrop[];message:string;
}
const districtDrop:Partial<Record<EncounterId,ItemId>>={
 "district-aurea":"fibra_optica","district-subsolo":"dados_criptografados",
 "district-setor-zero":"placa_ceramica","district-prisma":"microatuador",
 "district-periferia":"tecido_tecnico",
 "council-baixada":"reagente_bio","council-ferrugem":"residuo_metalico",
 "council-aurea":"dados_criptografados","council-subsolo":"fibra_optica",
 "council-setor-zero":"placa_ceramica","council-prisma":"microatuador",
 "council-periferia":"tecido_tecnico",
};
export function campaignSalvage(encounter:EncounterId):readonly SalvageDrop[]{
 if(encounter==="test")return [];
 if(encounter==="v09")return [{item:"celula_energia",amount:1,rarity:"recuperado"}];
 const local=districtDrop[encounter];
 if(local)return [
  {item:local,amount:2,rarity:"incomum"},
  {item:"celula_energia",amount:1,rarity:"recuperado"},
 ];
 if(encounter.startsWith("eden-")||encounter.startsWith("cisma-"))
  return [
   {item:"dados_criptografados",amount:2,rarity:"raro"},
   {item:"fibra_optica",amount:2,rarity:"incomum"},
  ];
 if(encounter.startsWith("trial-"))
  return [{item:"microatuador",amount:1,rarity:"recuperado"}];
 return [];
}
export function battleSalvageReceipt(encounter:EncounterId):string{
 return "rc20:salvage:"+encounter;
}
export function grantBattleSalvage(inventory:InventoryState,state:GameState):SalvageResult{
 const reject=(message:string):SalvageResult=>
   ({ok:false,awarded:false,state:inventory,drops:[],message});
 const player=state.units.find(unit=>unit.id==="runner");
 const drops=campaignSalvage(state.encounterId);
 if(!player||player.hp<=0||!state.combatComplete||
   activeEnemies(state).length!==0||
   state.defeatedEnemyCount!==state.totalWaves||!drops.length)
  return reject("Somente um confronto de campanha efetivamente vencido gera componentes.");
 const receipt=battleSalvageReceipt(state.encounterId);
 if(inventory.rewardReceipts?.includes(receipt))
  return {ok:true,awarded:false,state:inventory,drops:[],
    message:"Componentes deste confronto já foram recuperados."};
 if(drops.some(d=>!ITEM_CATALOG[d.item]||
   inventory.quantities[d.item]+d.amount>999))
  return reject("Inventário de componentes cheio. Sem resgate parcial.");
 let next=inventory;
 for(const drop of drops){
  // One receipt per item; a final master receipt ensures idempotent replay.
  next=grantRewardInventoryItem(next,drop.item,drop.amount,
    receipt+":"+drop.item);
 }
 next={...next,rewardReceipts:[...(next.rewardReceipts??[]),receipt]};
 return {ok:true,awarded:true,state:next,drops,
  message:"Recuperação pós-batalha: "+drops.map(drop=>
    drop.amount+"× "+ITEM_CATALOG[drop.item].name+" ["+drop.rarity+"]").join(" · ")};
}
