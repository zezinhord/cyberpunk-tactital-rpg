/** Fabricação offline em Nova Arcádia.
 * O crafting usa os mesmos itens e o mesmo save versionado v1, preservando
 * backups anteriores. Não pode consumir um item equipado acidentalmente.
 */
import {ITEM_CATALOG,type InventoryState,type ItemId} from "./inventory.ts";
export type RecipeId="colete-ferroviario"|"arma-inducao";
export interface CraftingRecipe{
 readonly id:RecipeId;readonly title:string;readonly description:string;
 readonly inputs:Readonly<Partial<Record<ItemId,number>>>;
 readonly output:ItemId;readonly amount:number;
}
export const CRAFTING_RECIPES:readonly CraftingRecipe[]=[
 {id:"colete-ferroviario",title:"Colete ferroviário reforçado",
  description:"Proteção +2 · combina um conector e liga metálica recuperada.",
  inputs:{conector_reuso:1,residuo_metalico:1},
  output:"colete_reforcado",amount:1},
 {id:"arma-inducao",title:"Pistola de indução",
  description:"Ataque +2 · combina um conector e uma célula industrial.",
  inputs:{conector_reuso:1,celula_energia:1},
  output:"pistola_inducao",amount:1},
] as const;
export function canCraft(inventory:InventoryState,id:RecipeId):boolean{
 const recipe=CRAFTING_RECIPES.find(x=>x.id===id);
 if(!recipe)return false;
 if(inventory.quantities[recipe.output]+recipe.amount>999)return false;
 return Object.entries(recipe.inputs).every(([key,cost])=>{
  const item=key as ItemId;
  return (inventory.quantities[item]??0)>=(cost??0)&&
    inventory.equipped.weapon!==item&&inventory.equipped.armor!==item;
 });
}
export function craftRecipe(inventory:InventoryState,id:RecipeId):
 {ok:boolean;state:InventoryState;message:string}{
 const recipe=CRAFTING_RECIPES.find(x=>x.id===id);
 if(!recipe)return {ok:false,state:inventory,message:"Receita desconhecida."};
 if(!canCraft(inventory,id))return {ok:false,state:inventory,
  message:"Faltam componentes para "+recipe.title+" ou uma peça está equipada."};
 const quantities={...inventory.quantities};
 for(const [key,cost] of Object.entries(recipe.inputs))
  quantities[key as ItemId]-=cost??0;
 quantities[recipe.output]+=recipe.amount;
 return {ok:true,state:{...inventory,quantities},message:recipe.title+
  " fabricado! Abra Equipamentos para utilizá-lo."};
}
export function craftingIngredientsLabel(recipe:CraftingRecipe):string{
 return Object.entries(recipe.inputs).map(([id,cost])=>
  String(cost)+"× "+ITEM_CATALOG[id as ItemId].name).join(" + ");
}
