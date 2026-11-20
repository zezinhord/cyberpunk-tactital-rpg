/** Nova Arcádia 2.0 — Cyberware secundário verdadeiro.
 * O slot legado inventory.equipped.implant permanece funcional. Estes módulos
 * adicionais usam slots anatômicos, carga neural e materiais reais do inventário.
 * Todos os custos, capacidades e bônus são calculados sem efeitos colaterais:
 * instalação + consumo ficam na MESMA gravação de InventoryState v1.
 */
import type {InventoryState,ItemId,EquipmentBonuses} from "./inventory.ts";
export const CYBERWARE_IDS=[
 "retina-espectral","olhos-balisticos","nervo-silencioso","reflexo-sinaptico",
 "derme-regenerativa","malha-ceramica","braco-industrial","interface-mnemonica",
] as const;
export type CyberwareId=typeof CYBERWARE_IDS[number];
export type CyberwareSlot="optics"|"nervous"|"dermal"|"arm"|"cortex";
export interface CyberwareDefinition{
 id:CyberwareId;name:string;description:string;slot:CyberwareSlot;
 minLevel:number;load:number;cost:Readonly<Partial<Record<ItemId,number>>>;
 bonuses:Readonly<EquipmentBonuses>;stealth:number;
}
const bon=(attackBonus=0,armorBonus=0,hpBonus=0,energyBonus=0,movementBonus=0):EquipmentBonuses=>
 ({attackBonus,armorBonus,hpBonus,energyBonus,movementBonus});
export const CYBERWARE_CATALOG:Readonly<Record<CyberwareId,CyberwareDefinition>>={
 "retina-espectral":{id:"retina-espectral",name:"Retina espectral",description:"Detecta vigias e fontes de calor durante operações. Alcance visual reforçado.",
  slot:"optics",minLevel:2,load:1,cost:{fibra_optica:2,dados_criptografados:1},
  bonuses:bon(0,0,0,0,0),stealth:2},
 "olhos-balisticos":{id:"olhos-balisticos",name:"Óptica balística",description:"Mira calculada com rastreamento de micro movimentos, melhora a precisão.",
  slot:"optics",minLevel:4,load:2,cost:{fibra_optica:2,microatuador:2,dados_criptografados:1},
  bonuses:bon(2,0,0,0,0),stealth:0},
 "nervo-silencioso":{id:"nervo-silencioso",name:"Nervo silencioso",description:"Reduz assinaturas motoras e ruído da aproximação clandestina.",
  slot:"nervous",minLevel:3,load:2,cost:{reagente_bio:2,fibra_optica:2},
  bonuses:bon(0,0,0,0,1),stealth:2},
 "reflexo-sinaptico":{id:"reflexo-sinaptico",name:"Reflexo sináptico",description:"Impulsos antecipados melhoram reposicionamento sob fogo.",
  slot:"nervous",minLevel:6,load:3,cost:{microatuador:3,reagente_bio:2,fibra_optica:1},
  bonuses:bon(0,0,0,0,2),stealth:0},
 "derme-regenerativa":{id:"derme-regenerativa",name:"Derme regenerativa",description:"Reservatórios médicos aumentam a tolerância a ferimentos.",
  slot:"dermal",minLevel:3,load:2,cost:{reagente_bio:3,tecido_tecnico:2},
  bonuses:bon(0,0,6,0,0),stealth:0},
 "malha-ceramica":{id:"malha-ceramica",name:"Malha cerâmica subcutânea",description:"Microplacas sob a pele reduzem ferimentos diretos.",
  slot:"dermal",minLevel:5,load:3,cost:{placa_ceramica:3,tecido_tecnico:2},
  bonuses:bon(0,2,2,0,0),stealth:-1},
 "braco-industrial":{id:"braco-industrial",name:"Braço de torque industrial",description:"Assistência muscular usada em Ferrugem para lidar com equipamentos pesados.",
  slot:"arm",minLevel:4,load:2,cost:{microatuador:3,placa_ceramica:1},
  bonuses:bon(1,0,3,0,0),stealth:-1},
 "interface-mnemonica":{id:"interface-mnemonica",name:"Interface mnemônica",description:"Cache neural preserva pacotes e melhora a reserva de energia.",
  slot:"cortex",minLevel:5,load:2,cost:{dados_criptografados:3,fibra_optica:2},
  bonuses:bon(0,0,0,4,0),stealth:1},
};
export function isCyberwareId(value:unknown):value is CyberwareId{
 return typeof value==="string"&&Object.prototype.hasOwnProperty.call(CYBERWARE_CATALOG,value);
}
export function safeCyberware(raw:unknown):CyberwareId[]{
 if(!Array.isArray(raw)||raw.length>3)return [];
 const used=new Set<CyberwareSlot>();const list:CyberwareId[]=[];
 for(const id of raw){
  if(!isCyberwareId(id))return [];
  const slot=CYBERWARE_CATALOG[id].slot;
  if(used.has(slot))return [];
  used.add(slot);list.push(id);
 }
 return list;
}
export function cyberwareCapacity(level:number):number{
 return Math.min(9,5+Math.floor(Math.max(1,level)/5));
}
export function cyberwareLoad(ids:readonly CyberwareId[]):number{
 return ids.reduce((sum,id)=>sum+CYBERWARE_CATALOG[id].load,0);
}
export function getCyberwareBonuses(ids:readonly CyberwareId[]|undefined):EquipmentBonuses{
 return safeCyberware(ids).reduce((sum,id)=>{
  const b=CYBERWARE_CATALOG[id].bonuses;
  return {attackBonus:sum.attackBonus+b.attackBonus,
   armorBonus:sum.armorBonus+b.armorBonus,hpBonus:sum.hpBonus+b.hpBonus,
   energyBonus:sum.energyBonus+b.energyBonus,movementBonus:sum.movementBonus+b.movementBonus};
 },bon());
}
export function cyberwareStealth(ids:readonly CyberwareId[]|undefined):number{
 return safeCyberware(ids).reduce((v,id)=>v+CYBERWARE_CATALOG[id].stealth,0);
}
export function canInstallCyberware(state:InventoryState,id:CyberwareId,level:number):
 {ok:boolean;message:string}{
 const item=CYBERWARE_CATALOG[id],installed=safeCyberware(state.cyberware);
 if(installed.includes(id))return {ok:false,message:"Implante já instalado."};
 if(installed.some(other=>CYBERWARE_CATALOG[other].slot===item.slot))
  return {ok:false,message:"Este slot anatômico já está ocupado. Remova primeiro o implante anterior."};
 if(installed.length>=3)return {ok:false,message:"Limite de três cyberwares auxiliares atingido."};
 if(level<item.minLevel)return {ok:false,message:"Exige nível "+item.minLevel+"."};
 if(cyberwareLoad(installed)+item.load>cyberwareCapacity(level))
  return {ok:false,message:"Sobrecarga neural. Melhore seu nível ou libere capacidade."};
 for(const [material,amount] of Object.entries(item.cost) as [ItemId,number][]){
  if((state.quantities[material]??0)<amount)
   return {ok:false,message:"Materiais insuficientes: "+material.replaceAll("_"," ")+" ("+amount+")."};
 }
 return {ok:true,message:"Instalação pronta."};
}
export function installCyberware(state:InventoryState,id:CyberwareId,level:number):
 {ok:boolean;state:InventoryState;message:string}{
 const check=canInstallCyberware(state,id,level);
 if(!check.ok)return {...check,state};
 const quantities={...state.quantities};
 for(const [material,amount] of Object.entries(CYBERWARE_CATALOG[id].cost) as [ItemId,number][])
  quantities[material]-=amount;
 return {ok:true,state:{...state,quantities,cyberware:[...safeCyberware(state.cyberware),id]},
  message:CYBERWARE_CATALOG[id].name+" instalado. Custos debitados do inventário."};
}
export function removeCyberware(state:InventoryState,id:CyberwareId):
 {ok:boolean;state:InventoryState;message:string}{
 if(!safeCyberware(state.cyberware).includes(id))
  return {ok:false,state,message:"Implante não encontrado."};
 return {ok:true,state:{...state,cyberware:safeCyberware(state.cyberware).filter(x=>x!==id)},
  message:CYBERWARE_CATALOG[id].name+" removido. Materiais de implantação não são recuperáveis."};
}
export function cyberwareCostLabel(id:CyberwareId):string{
 return Object.entries(CYBERWARE_CATALOG[id].cost)
  .map(([material,amount])=>amount+"× "+material.replaceAll("_"," ")).join(" · ");
}
