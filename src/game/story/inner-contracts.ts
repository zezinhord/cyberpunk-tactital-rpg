/** Nova Arcádia 2.0 — 28 contratos de investigação, cada um em um
 * interior próprio. Ciclo completo: falar com contato → obter 3 provas
 * do cenário físico → retornar ao contato → registrar XP UMA vez.
 * As provas são recibos no inventário, não caixas fictícias no painel.
 */
import {EXPANSION_ROOM_DESIGNS,type ExpansionInnerId} from "../districts/expansion-interiors.ts";
import {INNER_BLUEPRINTS} from "../districts/interiors.ts";
import {innerReceipt} from "./indoor-rewards.ts";
import type {InventoryState} from "../inventory.ts";
export const CONTRACTS_KEY="cyberpunk-tactical-rpg.inner-contracts-v20.v1.";
export interface InnerContract{
 id:ExpansionInnerId;title:string;guide:string;introduction:string;conclusion:string;
 rewardXp:number;requires:readonly string[];
}
export const INNER_CONTRACTS:Readonly<Record<ExpansionInnerId,InnerContract>>=
 Object.fromEntries(EXPANSION_ROOM_DESIGNS.map(room=>{
  const props=INNER_BLUEPRINTS[room.id].props;
  return [room.id,{
   id:room.id,title:"Dossiê de "+room.title,guide:room.guide,
   introduction:room.guideWords+" Reúna os registros, examine o sistema de manutenção e localize os suprimentos antes de voltar para entregar o dossiê.",
   conclusion:"Três evidências foram verificadas: "+room.archiveDetail+
    " "+room.machineDetail+" "+room.cacheDetail+
    " O relato será preservado sob responsabilidade da comunidade.",
   rewardXp:45+room.variant*4+room.themeIndex*2,
   requires:props.map(prop=>innerReceipt(room.id,prop)),
  } satisfies InnerContract];
 })) as unknown as Record<ExpansionInnerId,InnerContract>;
export const CONTRACT_IDS=Object.keys(INNER_CONTRACTS) as ExpansionInnerId[];
export interface InnerContractsState{
 version:1;accepted:readonly ExpansionInnerId[];completed:readonly ExpansionInnerId[];
}
export const EMPTY_CONTRACTS:Readonly<InnerContractsState>={
 version:1,accepted:[],completed:[],
};
export function isContractId(value:unknown):value is ExpansionInnerId{
 return typeof value==="string"&&Object.prototype.hasOwnProperty.call(INNER_CONTRACTS,value);
}
export function validateContracts(input:unknown):input is InnerContractsState{
 if(!input||typeof input!=="object"||Array.isArray(input))return false;
 const x=input as Record<string,unknown>,accepted=x.accepted,completed=x.completed;
 return Object.keys(x).every(k=>["version","accepted","completed"].includes(k))&&x.version===1&&
  Array.isArray(accepted)&&Array.isArray(completed)&&
  accepted.length<=CONTRACT_IDS.length&&completed.length<=CONTRACT_IDS.length&&
  accepted.every(isContractId)&&completed.every(isContractId)&&
  new Set(accepted).size===accepted.length&&new Set(completed).size===completed.length&&
  completed.every((id:ExpansionInnerId)=>accepted.includes(id));
}
export function readContracts(id:string):InnerContractsState{
 if(!id)return {...EMPTY_CONTRACTS};
 try{const raw=globalThis.localStorage?.getItem(CONTRACTS_KEY+id);
  const value:unknown=raw?JSON.parse(raw):null;
  return validateContracts(value)?value:{...EMPTY_CONTRACTS};
 }catch{return {...EMPTY_CONTRACTS};}
}
export function saveContracts(id:string,state:InnerContractsState):boolean{
 if(!id||!validateContracts(state))return false;
 try{const db=globalThis.localStorage;if(!db)return false;
  db.setItem(CONTRACTS_KEY+id,JSON.stringify(state));return true;
 }catch{return false;}
}
export function contractEvidenceCount(id:ExpansionInnerId,inventory:InventoryState):number{
 const receipts=inventory.rewardReceipts??[];
 return INNER_CONTRACTS[id].requires.filter(receipt=>receipts.includes(receipt)).length;
}
export function contractObjective(id:ExpansionInnerId,state:InnerContractsState,
 inventory:InventoryState):string{
 const contract=INNER_CONTRACTS[id];
 if(state.completed.includes(id))return contract.title+" concluído. Evidências arquivadas.";
 if(!state.accepted.includes(id))return "Fale com "+contract.guide+" para iniciar "+contract.title+".";
 const count=contractEvidenceCount(id,inventory);
 return count===contract.requires.length?"Volte a "+contract.guide+" e entregue as três evidências.":
  "Examine os arquivos, o sistema e os suprimentos desta área ("+count+"/3 provas).";
}
export function startContract(state:InnerContractsState,id:ExpansionInnerId):
 {ok:boolean;state:InnerContractsState;message:string}{
 if(state.accepted.includes(id))return {ok:false,state,message:"Contrato já aceito."};
 return {ok:true,state:{...state,accepted:[...state.accepted,id]},
 message:INNER_CONTRACTS[id].introduction};
}
export function completeContract(state:InnerContractsState,id:ExpansionInnerId,
 inventory:InventoryState):{ok:boolean;state:InnerContractsState;message:string;xp:number}{
 const contract=INNER_CONTRACTS[id];
 if(!state.accepted.includes(id))return {ok:false,state,message:"Converse com o contato antes de entregar o dossiê.",xp:0};
 if(state.completed.includes(id))return {ok:false,state,message:"Dossiê já entregue. Sem recompensa repetida.",xp:0};
 if(contractEvidenceCount(id,inventory)!==contract.requires.length)return {
  ok:false,state,message:contractObjective(id,state,inventory),xp:0,
 };
 return {ok:true,state:{...state,completed:[...state.completed,id]},
  message:contract.conclusion,xp:contract.rewardXp};
}
