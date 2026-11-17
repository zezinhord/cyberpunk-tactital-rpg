/** Recompensas reais dos sete interiores: recibos únicos no inventário existente.
 * Não cria novo tipo de save nem dobra o prêmio após queda do Android.
 */
import {INNER_IDS,INNER_BLUEPRINTS,type InnerId,type InnerProp} from "../districts/interiors.ts";
import {grantRewardInventoryItem,type InventoryState} from "../inventory.ts";
export const INNER_RECEIPT_PREFIX="indoor-v081-";
export function innerReceipt(area:InnerId,prop:InnerProp):string{
 return INNER_RECEIPT_PREFIX+area+"-"+prop.id;
}
export function collectInnerProp(inventory:InventoryState,area:InnerId,propId:string):
 {ok:boolean;state:InventoryState;xp:number;message:string}{
 const prop=INNER_BLUEPRINTS[area].props.find(p=>p.id===propId);
 if(!prop)return {ok:false,state:inventory,xp:0,message:"Objeto não encontrado."};
 const next=grantRewardInventoryItem(inventory,prop.item,1,innerReceipt(area,prop));
 return next===inventory?{ok:false,state:inventory,xp:0,message:"O objeto já foi recuperado."}:
  {ok:true,state:next,xp:prop.xp,message:prop.detail};
}
export function reconcileInnerExperience(inventory:InventoryState,grant:(id:string,xp:number)=>boolean):boolean{
 for(const area of INNER_IDS)for(const prop of INNER_BLUEPRINTS[area].props){
  const receipt=innerReceipt(area,prop);
  if(inventory.rewardReceipts?.includes(receipt)&&!grant(receipt,prop.xp))return false;
 }
 return true;
}
