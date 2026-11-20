/**
 * Primeiro ciclo funcional de itens: armazenamento por personagem, equipamento
 * e consumíveis. Não altera nem migra o formato do save do protagonista.
 */
import {safeCyberware,getCyberwareBonuses,type CyberwareId} from "./cyberware.ts";
export const ITEM_IDS = ["pistola_manutencao","colete_reaproveitado","curativo_campo","conector_reuso","residuo_metalico","celula_energia","colete_reforcado","pistola_inducao","carabina_patio","escopeta_ferrugem","fuzil_aurea","faca_ceramica","pistola_prisma","subfuzil_baixada","bastao_choque","rifle_periferia","jaqueta_chuva","armadura_placas","capa_subsolo","traje_prisma","traje_aurea","colete_comunitario","implante_reflexos","modulador_interface","nanofibras_dermicas","mira_neural","kit_trauma","bioespuma","bateria_portatil","fibra_optica","placa_ceramica","reagente_bio","tecido_tecnico","dados_criptografados","microatuador"] as const;
export type ItemId = typeof ITEM_IDS[number];
export type ItemCategory = "weapon" | "armor" | "implant" | "consumable" | "material";
export type EquipmentSlot = "weapon" | "armor" | "implant";

export interface ItemDefinition {
  id: ItemId;
  name: string;
  category: ItemCategory;
  description: string;
  slot?: EquipmentSlot;
  attackBonus?: number;
  armorBonus?: number;
  healAmount?: number;
  energyAmount?: number;
  hpBonus?:number;energyBonus?:number;movementBonus?:number;range?:number;
}
export interface InventoryState {
  version: 1;
  ownerId: string;
  quantities: Record<ItemId, number>;
  equipped: Record<EquipmentSlot, ItemId | null>;
  /** Comprovantes de itens de favores/loja; mantém compatibilidade com saves v1. */
  rewardReceipts?: readonly string[];
  /** Módulos secundários da versão 2.0; os 3 slots são anatômicos e
   * independem do slot `equipped.implant` das versões anteriores. */
  cyberware?: readonly CyberwareId[];
}
export const INVENTORY_KEY = "cyberpunk-tactical-rpg.inventory.v1.";
export const ITEM_CATALOG: Readonly<Record<ItemId, ItemDefinition>> = {
  pistola_manutencao: {
    id: "pistola_manutencao", name: "Pistola de manutenção", category: "weapon",
    description: "Arma de serviço compacta, adaptada para defesa nas ruas.", slot: "weapon", attackBonus: 1, range:4,
  },
  colete_reaproveitado: {
    id: "colete_reaproveitado", name: "Colete reaproveitado", category: "armor",
    description: "Proteção leve montada com placas recuperadas.", slot: "armor", armorBonus: 1,
  },
  curativo_campo: {
    id: "curativo_campo", name: "Curativo de campo", category: "consumable",
    description: "Recupera até 5 pontos de Vida no Limbo de Teste, usando a ação bônus.", healAmount: 5,
  },
  conector_reuso: {
    id:"conector_reuso",name:"Conector reutilizável",category:"material",
    description:"Componente de rede recuperado. Usado para fabricar armaduras e armas industriais.",
  },
  residuo_metalico:{
    id:"residuo_metalico",name:"Liga reaproveitada",category:"material",
    description:"Placa metálica recuperada na sucata de Ferrugem. Material para reforços de armadura.",
  },
  celula_energia:{
    id:"celula_energia",name:"Célula de indução",category:"material",
    description:"Célula industrial estabilizada. Componente necessário para armamento de indução.",
  },
  colete_reforcado:{
    id:"colete_reforcado",name:"Colete ferroviário reforçado",category:"armor",
    description:"Proteção artesanal produzida em Ferrugem, com placas de liga reaproveitada.",
    slot:"armor",armorBonus:2,
  },
  pistola_inducao:{
    id:"pistola_inducao",name:"Pistola de indução",category:"weapon",
    description:"Projeto de arma eletrificada montada com peças de manutenção e uma célula estabilizada.",
    slot:"weapon",attackBonus:2,range:5,
  },
  carabina_patio: {id:"carabina_patio",name:"Carabina do Pátio",category:"weapon",description:"Carabina do Pátio · attackBonus 2, range 4",slot:"weapon",attackBonus:2,range:4},
  escopeta_ferrugem: {id:"escopeta_ferrugem",name:"Escopeta de Ferrugem",category:"weapon",description:"Escopeta de Ferrugem · attackBonus 3, range 2",slot:"weapon",attackBonus:3,range:2},
  fuzil_aurea: {id:"fuzil_aurea",name:"Fuzil de Áurea",category:"weapon",description:"Fuzil de Áurea · attackBonus 4, range 5",slot:"weapon",attackBonus:4,range:5},
  faca_ceramica: {id:"faca_ceramica",name:"Lâmina cerâmica",category:"weapon",description:"Lâmina cerâmica · attackBonus 3, range 1",slot:"weapon",attackBonus:3,range:1},
  pistola_prisma: {id:"pistola_prisma",name:"Pistola de Prisma",category:"weapon",description:"Pistola de Prisma · attackBonus 2, range 5",slot:"weapon",attackBonus:2,range:5},
  subfuzil_baixada: {id:"subfuzil_baixada",name:"Subfuzil da Baixada",category:"weapon",description:"Subfuzil da Baixada · attackBonus 3, range 4",slot:"weapon",attackBonus:3,range:4},
  bastao_choque: {id:"bastao_choque",name:"Bastão de choque",category:"weapon",description:"Bastão de choque · attackBonus 2, range 1",slot:"weapon",attackBonus:2,range:1},
  rifle_periferia: {id:"rifle_periferia",name:"Rifle de escolta",category:"weapon",description:"Rifle de escolta · attackBonus 4, range 6",slot:"weapon",attackBonus:4,range:6},
  jaqueta_chuva: {id:"jaqueta_chuva",name:"Jaqueta de chuva blindada",category:"armor",description:"Jaqueta de chuva blindada · armorBonus 1, movementBonus 1",slot:"armor",armorBonus:1,movementBonus:1},
  armadura_placas: {id:"armadura_placas",name:"Armadura de placas",category:"armor",description:"Armadura de placas · armorBonus 4, movementBonus -1",slot:"armor",armorBonus:4,movementBonus:-1},
  capa_subsolo: {id:"capa_subsolo",name:"Capa de infiltração",category:"armor",description:"Capa de infiltração · armorBonus 2, movementBonus 1",slot:"armor",armorBonus:2,movementBonus:1},
  traje_prisma: {id:"traje_prisma",name:"Traje condutor de Prisma",category:"armor",description:"Traje condutor de Prisma · armorBonus 2, energyBonus 2",slot:"armor",armorBonus:2,energyBonus:2},
  traje_aurea: {id:"traje_aurea",name:"Traje de auditoria",category:"armor",description:"Traje de auditoria · armorBonus 3",slot:"armor",armorBonus:3},
  colete_comunitario: {id:"colete_comunitario",name:"Colete da Casa Comum",category:"armor",description:"Colete da Casa Comum · armorBonus 2, hpBonus 4",slot:"armor",armorBonus:2,hpBonus:4},
  implante_reflexos: {id:"implante_reflexos",name:"Servoimplante reflexivo",category:"implant",description:"Servoimplante reflexivo · movementBonus 2",slot:"implant",movementBonus:2},
  modulador_interface: {id:"modulador_interface",name:"Modulador de interface",category:"implant",description:"Modulador de interface · energyBonus 4",slot:"implant",energyBonus:4},
  nanofibras_dermicas: {id:"nanofibras_dermicas",name:"Nanofibras dérmicas",category:"implant",description:"Nanofibras dérmicas · hpBonus 6, armorBonus 1",slot:"implant",hpBonus:6,armorBonus:1},
  mira_neural: {id:"mira_neural",name:"Mira neural",category:"implant",description:"Mira neural · attackBonus 2",slot:"implant",attackBonus:2},
  kit_trauma: {id:"kit_trauma",name:"Kit de trauma",category:"consumable",description:"Kit de trauma · healAmount 10",healAmount:10},
  bioespuma: {id:"bioespuma",name:"Bioespuma cicatrizante",category:"consumable",description:"Bioespuma cicatrizante · healAmount 7",healAmount:7},
  bateria_portatil: {id:"bateria_portatil",name:"Bateria portátil",category:"consumable",description:"Bateria portátil · energyAmount 5",energyAmount:5},
  fibra_optica: {id:"fibra_optica",name:"Fibra óptica recuperada",category:"material",description:"Fibra óptica recuperada · ",},
  placa_ceramica: {id:"placa_ceramica",name:"Placa cerâmica",category:"material",description:"Placa cerâmica · ",},
  reagente_bio: {id:"reagente_bio",name:"Reagente biomédico",category:"material",description:"Reagente biomédico · ",},
  tecido_tecnico: {id:"tecido_tecnico",name:"Tecido técnico",category:"material",description:"Tecido técnico · ",},
  dados_criptografados: {id:"dados_criptografados",name:"Pacote criptografado",category:"material",description:"Pacote criptografado · ",},
  microatuador: {id:"microatuador",name:"Microatuador recuperado",category:"material",description:"Microatuador recuperado · ",},
};
export function createStartingInventory(ownerId: string): InventoryState {
  return {
    version: 1, ownerId,
    quantities:Object.fromEntries(ITEM_IDS.map(id=>[id,id==="pistola_manutencao"||id==="colete_reaproveitado"?1:id==="curativo_campo"?2:0])) as Record<ItemId,number>,
    equipped: { weapon: null, armor: null,implant:null }, rewardReceipts:[],cyberware:[],
  };
}
export function loadInventory(ownerId: string): InventoryState {
  const fresh = createStartingInventory(ownerId);
  if (!ownerId) return fresh;
  try {
    const raw = globalThis.localStorage?.getItem(INVENTORY_KEY + ownerId);
    if (!raw) return fresh;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fresh;
    const value = parsed as Partial<InventoryState>;
    if (value.version !== 1 || value.ownerId !== ownerId) return fresh;
    const quantities = { ...fresh.quantities };
    for (const id of ITEM_IDS) {
      const quantity = value.quantities?.[id];
      if (typeof quantity === "number" && Number.isSafeInteger(quantity) && quantity >= 0 && quantity <= 999) {
        quantities[id] = quantity;
      }
    }
    const equipped: InventoryState["equipped"] = { weapon: null, armor: null, implant:null };
    for (const slot of ["weapon", "armor", "implant"] as const) {
      const id = value.equipped?.[slot];
      if (id && ITEM_IDS.includes(id) && ITEM_CATALOG[id].slot === slot && quantities[id] > 0) {
        equipped[slot] = id;
      }
    }
    const rewardReceipts=Array.isArray(value.rewardReceipts)?
      [...new Set(value.rewardReceipts.filter((x):x is string=>
        typeof x==="string"&&x.length>0&&x.length<90))].slice(0,20000):[];
    return { ...fresh, quantities, equipped, rewardReceipts,
      cyberware:safeCyberware(value.cyberware) };
  } catch { return fresh; }
}
export function saveInventory(inventory: InventoryState): boolean {
  if (!inventory.ownerId) return false;
  try {
    const storage=globalThis.localStorage;
    if(!storage)return false;
    storage.setItem(INVENTORY_KEY + inventory.ownerId, JSON.stringify(inventory));
    return true;
  } catch { return false; }
}
export function deleteInventory(ownerId: string): void {
  try { globalThis.localStorage?.removeItem(INVENTORY_KEY + ownerId); }
  catch { /* Armazenamento indisponível. */ }
}
export function toggleEquipment(state: InventoryState, id: ItemId): InventoryState {
  const item = ITEM_CATALOG[id];
  if (!item.slot || state.quantities[id] < 1) return state;
  return { ...state, equipped: { ...state.equipped, [item.slot]: state.equipped[item.slot] === id ? null : id } };
}
export function consumeItem(state: InventoryState, id: ItemId): InventoryState {
  if (ITEM_CATALOG[id].category !== "consumable" || state.quantities[id] < 1) return state;
  return { ...state, quantities: { ...state.quantities, [id]: state.quantities[id] - 1 } };
}
export function grantItem(state: InventoryState, id: ItemId, amount = 1): InventoryState {
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > 99) return state;
  return { ...state, quantities: { ...state.quantities, [id]: Math.min(999, state.quantities[id] + amount) } };
}
export interface EquipmentBonuses{attackBonus:number;armorBonus:number;hpBonus:number;energyBonus:number;movementBonus:number}
export function getEquipmentBonuses(state:InventoryState):EquipmentBonuses{
 const equipped=(["weapon","armor","implant"] as const).map(slot=>state.equipped[slot]?
   ITEM_CATALOG[state.equipped[slot]!] :null);
 const base=equipped.reduce<EquipmentBonuses>((sum,item)=>({
  attackBonus:sum.attackBonus+(item?.attackBonus??0),
  armorBonus:sum.armorBonus+(item?.armorBonus??0),
  hpBonus:sum.hpBonus+(item?.hpBonus??0),
  energyBonus:sum.energyBonus+(item?.energyBonus??0),
  movementBonus:sum.movementBonus+(item?.movementBonus??0),
 }),{attackBonus:0,armorBonus:0,hpBonus:0,energyBonus:0,movementBonus:0});
 const extra=getCyberwareBonuses(state.cyberware);
 return {attackBonus:base.attackBonus+extra.attackBonus,
  armorBonus:base.armorBonus+extra.armorBonus,hpBonus:base.hpBonus+extra.hpBonus,
  energyBonus:base.energyBonus+extra.energyBonus,
  movementBonus:base.movementBonus+extra.movementBonus};
}

/** Itens concedidos apenas uma vez, mesmo após reload e reconciliação de recibos. */
export function grantRewardInventoryItem(state:InventoryState,id:ItemId,amount:number,receipt:string):InventoryState{
 if(!receipt||receipt.length>90||(state.rewardReceipts??[]).includes(receipt)||
    !Number.isSafeInteger(amount)||amount<1||amount>99)return state;
 if(state.quantities[id]+amount>999)return state;
 return {...state,quantities:{...state.quantities,[id]:state.quantities[id]+amount},
  rewardReceipts:[...(state.rewardReceipts??[]),receipt]};
}
