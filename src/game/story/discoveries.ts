/** Descobertas urbanas localizadas em mapas realmente exploráveis.
 * Cada recibo dá um item e XP apenas uma vez; se o processo cair entre
 * escrituras, a experiência pode ser recuperada pelo recibo do inventário.
 */
import type {DistrictId} from "../districts/catalog.ts";
import {grantRewardInventoryItem,type InventoryState,type ItemId} from "../inventory.ts";
export type DiscoveryArea=DistrictId|"ferrugem";
export const DISCOVERY_REWARDS:Readonly<Record<DiscoveryArea,{item:ItemId;xp:number;story:string}>>={
 aurea:{item:"dados_criptografados",xp:12,
  story:"Uma cópia da auditoria sobreviveu na caixa de serviço de Áurea."},
 subsolo:{item:"tecido_tecnico",xp:12,
  story:"O abrigo esqueceu um rolo de tecido técnico no depósito desativado."},
 "setor-zero":{item:"reagente_bio",xp:12,
  story:"A quarentena deixou um reagente isolado do cadastro sanitário."},
 prisma:{item:"fibra_optica",xp:12,
  story:"Os artistas guardaram fibra óptica no retransmissor de emergência."},
 periferia:{item:"microatuador",xp:12,
  story:"As caravanas esconderam um microatuador para reparar o farol."},
 ferrugem:{item:"microatuador",xp:12,
  story:"Um microatuador da linha de montagem estava escondido na caixa lacrada."},
};
export const DISCOVERY_AREAS=Object.keys(DISCOVERY_REWARDS) as DiscoveryArea[];
export function claimDiscovery(state:InventoryState,area:DiscoveryArea):
 {ok:boolean;state:InventoryState;xp:number;message:string}{
 const d=DISCOVERY_REWARDS[area];
 if(!d)return {ok:false,state,xp:0,message:"Arquivo desconhecido."};
 const next=grantRewardInventoryItem(state,d.item,1,"discovery-"+area);
 return next===state?{ok:false,state,xp:0,message:"Esta caixa já foi recolhida."}:
  {ok:true,state:next,xp:d.xp,message:d.story};
}
