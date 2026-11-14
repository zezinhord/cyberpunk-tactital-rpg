/**
 * Primeiro ciclo funcional de itens: armazenamento por personagem, equipamento
 * e consumíveis. Não altera nem migra o formato do save do protagonista.
 */
export type ItemId = "pistola_manutencao" | "colete_reaproveitado" | "curativo_campo" | "conector_reuso";
export type ItemCategory = "weapon" | "armor" | "consumable" | "material";
export type EquipmentSlot = "weapon" | "armor";

export interface ItemDefinition {
  id: ItemId;
  name: string;
  category: ItemCategory;
  description: string;
  slot?: EquipmentSlot;
  attackBonus?: number;
  armorBonus?: number;
  healAmount?: number;
}
export interface InventoryState {
  version: 1;
  ownerId: string;
  quantities: Record<ItemId, number>;
  equipped: Record<EquipmentSlot, ItemId | null>;
}
export const INVENTORY_KEY = "cyberpunk-tactical-rpg.inventory.v1.";
export const ITEM_IDS: readonly ItemId[] = ["pistola_manutencao", "colete_reaproveitado", "curativo_campo", "conector_reuso"];
export const ITEM_CATALOG: Readonly<Record<ItemId, ItemDefinition>> = {
  pistola_manutencao: {
    id: "pistola_manutencao", name: "Pistola de manutenção", category: "weapon",
    description: "Arma de serviço compacta, adaptada para defesa nas ruas.", slot: "weapon", attackBonus: 1,
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
    id: "conector_reuso", name: "Conector reutilizável", category: "material",
    description: "Componente recuperado da infraestrutura urbana. Ainda não tem receita de fabricação.",
  },
};
export function createStartingInventory(ownerId: string): InventoryState {
  return {
    version: 1, ownerId,
    quantities: { pistola_manutencao: 1, colete_reaproveitado: 1, curativo_campo: 2, conector_reuso: 0 },
    equipped: { weapon: null, armor: null },
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
    const equipped: InventoryState["equipped"] = { weapon: null, armor: null };
    for (const slot of ["weapon", "armor"] as const) {
      const id = value.equipped?.[slot];
      if (id && ITEM_IDS.includes(id) && ITEM_CATALOG[id].slot === slot && quantities[id] > 0) {
        equipped[slot] = id;
      }
    }
    return { ...fresh, quantities, equipped };
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
export function getEquipmentBonuses(state: InventoryState): { attackBonus: number; armorBonus: number } {
  const weapon = state.equipped.weapon ? ITEM_CATALOG[state.equipped.weapon] : null;
  const armor = state.equipped.armor ? ITEM_CATALOG[state.equipped.armor] : null;
  return { attackBonus: weapon?.attackBonus ?? 0, armorBonus: armor?.armorBonus ?? 0 };
}
