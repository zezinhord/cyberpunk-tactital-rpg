/** Fabricação offline em Nova Arcádia.
 * O crafting usa os mesmos itens e o mesmo save versionado v1, preservando
 * backups anteriores. Não pode consumir um item equipado acidentalmente.
 */
import {ITEM_CATALOG,type InventoryState,type ItemId} from "./inventory.ts";
export type RecipeId = "colete-ferroviario"|"arma-inducao"|"carabina-patio"|"escopeta-ferrugem"|"fuzil-aurea"|"faca-ceramica"|"pistola-prisma"|"subfuzil-baixada"|"bastao-choque"|"rifle-periferia"|"jaqueta-chuva"|"armadura-placas"|"capa-subsolo"|"traje-prisma"|"traje-aurea"|"colete-comunitario"|"implante-reflexos"|"modulador-interface"|"nanofibras-dermicas"|"mira-neural"|"kit-trauma"|"bioespuma"|"bateria-portatil"|"recuperar-placa"|"recuperar-fibra";
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
 {id:"carabina-patio",title:"Carabina do Pátio",description:"Oficina de Nova Arcádia: fabricação de Carabina do Pátio",inputs:{"conector_reuso":1,"residuo_metalico":1},output:"carabina_patio",amount:1},
 {id:"escopeta-ferrugem",title:"Escopeta de Ferrugem",description:"Oficina de Nova Arcádia: fabricação de Escopeta de Ferrugem",inputs:{"residuo_metalico":2,"microatuador":1},output:"escopeta_ferrugem",amount:1},
 {id:"fuzil-aurea",title:"Fuzil de Áurea",description:"Oficina de Nova Arcádia: fabricação de Fuzil de Áurea",inputs:{"fibra_optica":2,"dados_criptografados":1,"celula_energia":2},output:"fuzil_aurea",amount:1},
 {id:"faca-ceramica",title:"Lâmina cerâmica",description:"Oficina de Nova Arcádia: fabricação de Lâmina cerâmica",inputs:{"placa_ceramica":1,"residuo_metalico":1},output:"faca_ceramica",amount:1},
 {id:"pistola-prisma",title:"Pistola de Prisma",description:"Oficina de Nova Arcádia: fabricação de Pistola de Prisma",inputs:{"fibra_optica":1,"dados_criptografados":1,"microatuador":1},output:"pistola_prisma",amount:1},
 {id:"subfuzil-baixada",title:"Subfuzil da Baixada",description:"Oficina de Nova Arcádia: fabricação de Subfuzil da Baixada",inputs:{"conector_reuso":2,"residuo_metalico":2},output:"subfuzil_baixada",amount:1},
 {id:"bastao-choque",title:"Bastão de choque",description:"Oficina de Nova Arcádia: fabricação de Bastão de choque",inputs:{"celula_energia":1,"conector_reuso":1},output:"bastao_choque",amount:1},
 {id:"rifle-periferia",title:"Rifle de escolta",description:"Oficina de Nova Arcádia: fabricação de Rifle de escolta",inputs:{"microatuador":2,"placa_ceramica":2},output:"rifle_periferia",amount:1},
 {id:"jaqueta-chuva",title:"Jaqueta blindada",description:"Oficina de Nova Arcádia: fabricação de Jaqueta blindada",inputs:{"tecido_tecnico":2,"placa_ceramica":1},output:"jaqueta_chuva",amount:1},
 {id:"armadura-placas",title:"Armadura de placas",description:"Oficina de Nova Arcádia: fabricação de Armadura de placas",inputs:{"placa_ceramica":3,"residuo_metalico":2},output:"armadura_placas",amount:1},
 {id:"capa-subsolo",title:"Capa do Subsolo",description:"Oficina de Nova Arcádia: fabricação de Capa do Subsolo",inputs:{"tecido_tecnico":2,"fibra_optica":1},output:"capa_subsolo",amount:1},
 {id:"traje-prisma",title:"Traje de Prisma",description:"Oficina de Nova Arcádia: fabricação de Traje de Prisma",inputs:{"tecido_tecnico":2,"fibra_optica":2,"celula_energia":1},output:"traje_prisma",amount:1},
 {id:"traje-aurea",title:"Traje de Áurea",description:"Oficina de Nova Arcádia: fabricação de Traje de Áurea",inputs:{"placa_ceramica":1,"dados_criptografados":2,"tecido_tecnico":1},output:"traje_aurea",amount:1},
 {id:"colete-comunitario",title:"Colete comunitário",description:"Oficina de Nova Arcádia: fabricação de Colete comunitário",inputs:{"tecido_tecnico":2,"placa_ceramica":1,"reagente_bio":1},output:"colete_comunitario",amount:1},
 {id:"implante-reflexos",title:"Servoimplante reflexivo",description:"Oficina de Nova Arcádia: fabricação de Servoimplante reflexivo",inputs:{"microatuador":2,"fibra_optica":1},output:"implante_reflexos",amount:1},
 {id:"modulador-interface",title:"Modulador de interface",description:"Oficina de Nova Arcádia: fabricação de Modulador de interface",inputs:{"fibra_optica":2,"dados_criptografados":1},output:"modulador_interface",amount:1},
 {id:"nanofibras-dermicas",title:"Nanofibras dérmicas",description:"Oficina de Nova Arcádia: fabricação de Nanofibras dérmicas",inputs:{"reagente_bio":2,"placa_ceramica":1},output:"nanofibras_dermicas",amount:1},
 {id:"mira-neural",title:"Mira neural",description:"Oficina de Nova Arcádia: fabricação de Mira neural",inputs:{"dados_criptografados":2,"fibra_optica":1},output:"mira_neural",amount:1},
 {id:"kit-trauma",title:"Kit de trauma",description:"Oficina de Nova Arcádia: fabricação de Kit de trauma",inputs:{"reagente_bio":2,"tecido_tecnico":1},output:"kit_trauma",amount:1},
 {id:"bioespuma",title:"Bioespuma",description:"Oficina de Nova Arcádia: fabricação de Bioespuma",inputs:{"reagente_bio":1,"tecido_tecnico":1},output:"bioespuma",amount:1},
 {id:"bateria-portatil",title:"Bateria portátil",description:"Oficina de Nova Arcádia: fabricação de Bateria portátil",inputs:{"celula_energia":1,"microatuador":1},output:"bateria_portatil",amount:1},
 {id:"recuperar-placa",title:"Recuperar placa cerâmica",description:"Oficina de Nova Arcádia: fabricação de Recuperar placa cerâmica",inputs:{"residuo_metalico":2},output:"placa_ceramica",amount:1},
 {id:"recuperar-fibra",title:"Recuperar fibra óptica",description:"Oficina de Nova Arcádia: fabricação de Recuperar fibra óptica",inputs:{"conector_reuso":2},output:"fibra_optica",amount:1},
] as const;
/** Craft batches share one transactional save. Only stackable components
 * and consumables are eligible, preventing accidental duplication of
 * equipment and keeping the original inventory v1 format unchanged.
 */
export function canCraft(inventory:InventoryState,id:RecipeId,quantity=1):boolean{
 const recipe=CRAFTING_RECIPES.find(x=>x.id===id);
 if(!recipe||!Number.isSafeInteger(quantity)||quantity<1||quantity>5)return false;
 const kind=ITEM_CATALOG[recipe.output].category;
 if(quantity>1&&kind!=="material"&&kind!=="consumable")return false;
 if((inventory.quantities[recipe.output]??0)+recipe.amount*quantity>999)return false;
 return Object.entries(recipe.inputs).every(([key,cost])=>{
  const item=key as ItemId;
  return (inventory.quantities[item]??0)>=(cost??0)*quantity&&
    inventory.equipped.weapon!==item&&inventory.equipped.armor!==item&&
    inventory.equipped.implant!==item;
 });
}
export function craftRecipe(inventory:InventoryState,id:RecipeId,quantity=1):
 {ok:boolean;state:InventoryState;message:string}{
 const recipe=CRAFTING_RECIPES.find(x=>x.id===id);
 if(!recipe)return {ok:false,state:inventory,message:"Receita desconhecida."};
 if(!canCraft(inventory,id,quantity))return {ok:false,state:inventory,
  message:"Quantidade inválida, materiais insuficientes ou componente equipado."};
 const quantities={...inventory.quantities};
 for(const [key,cost] of Object.entries(recipe.inputs))
  quantities[key as ItemId]-=(cost??0)*quantity;
 quantities[recipe.output]+=recipe.amount*quantity;
 return {ok:true,state:{...inventory,quantities},message:
  quantity*recipe.amount+"× "+recipe.title+" fabricado(s)!"+
  (ITEM_CATALOG[recipe.output].slot?" Abra Equipamentos para utilizar.":"")};
}
export function craftingIngredientsLabel(recipe:CraftingRecipe):string{
 return Object.entries(recipe.inputs).map(([id,cost])=>
  String(cost)+"× "+ITEM_CATALOG[id as ItemId].name).join(" + ");
}
