import type {ItemId,InventoryState} from "../inventory.ts";
import {grantRewardInventoryItem} from "../inventory.ts";
import type {Reputation} from "./reputation.ts";

/** Encomendas locais: surgem por contato e avanço real da narrativa, não por pré-cadastro no HUD. */
export const FAVORS_KEY="cyberpunk-tactical-rpg.favors.v1.";
export type FavorId="triagem"|"filtros"|"agua"|"rotas"|"patio"|"seguranca"|"forja"|"auditoria"|"abrigos"|"quarentena"|"palco"|"caravana"|"farol"|"conexao"|"neon";
export interface FavorReward{xp:number;credits:number;honor:number;item:ItemId;amount:number}
export interface FavorQuest{
 id:FavorId;title:string;contact:string;contactId:string;taskId:string;objective:string;
 synopsis:string;minimumMission:number;needsDefeat?:boolean;minimumHonor?:number;requiresContact?:boolean;reward:FavorReward;
}
export const FAVORS:readonly FavorQuest[]=[
 {id:"triagem",title:"Arquivo de primeiros socorros",contact:"Dra. Amara",contactId:"dra-amara",
  taskId:"terminal-clinica",objective:"Consulte o terminal e retorne à Dra. Amara.",
  synopsis:"Organize cópias locais dos atendimentos para proteger os pacientes.",
  minimumMission:1,reward:{xp:18,credits:60,honor:1,item:"curativo_campo",amount:2}},
 {id:"filtros",title:"Peças para o Canal",contact:"Nilo",contactId:"vendedor",
  taskId:"terminal-canal",objective:"Inspecione o terminal do Canal Sul e volte a Nilo.",
  synopsis:"Verifique a origem das peças de manutenção destinadas ao Canal.",
  minimumMission:1,reward:{xp:24,credits:80,honor:1,item:"conector_reuso",amount:2}},
 {id:"agua",title:"Água para a Casa Comum",contact:"Marta",contactId:"feira-ajuda",
  taskId:"feira-archive",objective:"Verifique o mural de abastecimento e volte a Marta.",
  synopsis:"A cooperativa precisa confirmar entregas antes de repartir a reserva.",
  minimumMission:2,reward:{xp:28,credits:95,honor:2,item:"residuo_metalico",amount:2}},
 {id:"rotas",title:"Entrega fora da rede",contact:"Iza",contactId:"iza",
  taskId:"tomas",objective:"Confirme a rota com Tomás e retorne a Iza.",
  synopsis:"Recupere um percurso seguro para os entregadores do Mercado.",
  minimumMission:3,reward:{xp:30,credits:120,honor:1,item:"celula_energia",amount:2}},
 {id:"patio",title:"Reforço da cooperativa",contact:"Ramon",contactId:"ramon",
  taskId:"patio-console",objective:"Analise o console do Pátio e reporte a Ramon.",
  synopsis:"Ramon está montando equipamentos para quem protege as bombas.",
  minimumMission:3,reward:{xp:38,credits:140,honor:1,item:"colete_reforcado",amount:1}},
 {id:"seguranca",title:"Corredor protegido",contact:"Davi",contactId:"feira-corretor",
  taskId:"feira-ajuda",objective:"Combine o apoio com Marta e retorne a Davi.",
  synopsis:"Sem a sentinela V-09, moradores tentam reabrir rotas de suprimentos.",
  minimumMission:3,needsDefeat:true,minimumHonor:2,reward:{xp:46,credits:200,honor:2,item:"pistola_inducao",amount:1}},
 {id:"forja",title:"Reativar o forno auxiliar",contact:"Ramon",contactId:"ramon",taskId:"ferrugem-cabinet",objective:"Inspecione o quadro elétrico de Ferrugem e retorne a Ramon.",synopsis:"A cooperativa precisa verificar o consumo de uma rede que alimenta a siderúrgica.",minimumMission:3,needsDefeat:true,minimumHonor:1,requiresContact:true,reward:{xp:46,credits:160,honor:1,item:"microatuador",amount:2}},
 {id:"auditoria",title:"Cópias da torre",contact:"Nilo",contactId:"vendedor",taskId:"district-aurea-terminal",objective:"Recupere o protocolo de auditoria em Áurea e retorne a Nilo.",synopsis:"Uma credencial descartada pode esclarecer a origem dos componentes.",minimumMission:3,needsDefeat:true,minimumHonor:1,requiresContact:true,reward:{xp:44,credits:145,honor:1,item:"dados_criptografados",amount:2}},
 {id:"abrigos",title:"Mapa de abrigo seguro",contact:"Iza",contactId:"iza",taskId:"district-subsolo-community",objective:"Ouça o conselho do Subsolo e volte a Iza.",synopsis:"Moradores precisam de uma rota de entrega que não revele os abrigos.",minimumMission:3,needsDefeat:true,minimumHonor:2,requiresContact:true,reward:{xp:50,credits:160,honor:1,item:"tecido_tecnico",amount:2}},
 {id:"quarentena",title:"Medicação sem cadastro",contact:"Dra. Amara",contactId:"dra-amara",taskId:"district-setor-zero-terminal",objective:"Examine o terminal da quarentena e retorne à clínica.",synopsis:"A clínica precisa comparar protocolos de uma unidade isolada.",minimumMission:3,needsDefeat:true,minimumHonor:2,requiresContact:true,reward:{xp:60,credits:180,honor:1,item:"reagente_bio",amount:2}},
 {id:"palco",title:"Transmissor livre",contact:"Davi",contactId:"feira-corretor",taskId:"district-prisma-relay",objective:"Localize a antena independente de Prisma e retorne a Davi.",synopsis:"Um canal não rastreável pode proteger as testemunhas do Mercado.",minimumMission:3,needsDefeat:true,minimumHonor:1,requiresContact:true,reward:{xp:50,credits:165,honor:1,item:"fibra_optica",amount:2}},
 {id:"caravana",title:"Reserva de água externa",contact:"Marta",contactId:"feira-ajuda",taskId:"district-periferia-cache",objective:"Inspecione o depósito das caravanas e retorne a Marta.",synopsis:"A Casa Comum quer saber por que os tanques ainda não chegaram.",minimumMission:3,needsDefeat:true,minimumHonor:2,requiresContact:true,reward:{xp:55,credits:190,honor:1,item:"placa_ceramica",amount:2}},
 {id:"farol",title:"Sinal das caravanas",contact:"Téo",contactId:"teo",taskId:"district-periferia-terminal",objective:"Verifique o terminal rodoviário e volte a Téo.",synopsis:"Uma rota fora da rede pode salvar os entregadores do Canal.",minimumMission:3,needsDefeat:true,minimumHonor:3,requiresContact:true,reward:{xp:52,credits:190,honor:1,item:"rifle_periferia",amount:1}},
 {id:"conexao",title:"Lista de turnos apagados",contact:"Joana",contactId:"moradora",taskId:"ferrugem-log",objective:"Encontre o livro de turnos de Ferrugem e volte a Joana.",synopsis:"Joana procura parentes de trabalhadores registrados com nomes falsos.",minimumMission:3,needsDefeat:true,minimumHonor:2,requiresContact:true,reward:{xp:44,credits:130,honor:1,item:"colete_comunitario",amount:1}},
 {id:"neon",title:"O operador do palco",contact:"Iza",contactId:"iza",taskId:"district-prisma-specialist",objective:"Converse com o técnico de Prisma e retorne a Iza.",synopsis:"Entregas noturnas desapareceram após o corte do sinal da praça.",minimumMission:3,needsDefeat:true,minimumHonor:3,requiresContact:true,reward:{xp:57,credits:185,honor:1,item:"traje_prisma",amount:1}},
] as const;
export type FavorContext={missionStep:number;v09Defeated:boolean;honor?:number};
export interface PurchaseReceipt{id:number;item:ItemId;amount:number;cost:number}
export interface FavorState{
 version:1;accepted:readonly FavorId[];ready:readonly FavorId[];claimed:readonly FavorId[];
 credits:number;honor:number;purchases:readonly PurchaseReceipt[];
 discovered:readonly FavorId[];
}
export const INITIAL_FAVORS:FavorState={version:1,accepted:[],ready:[],claimed:[],credits:0,honor:0,purchases:[],discovered:[]};
export interface ShopOffer{item:ItemId;amount:number;price:number;label:string;minHonor?:number;minLivre?:number}
export const NILO_SHOP:readonly ShopOffer[]=[
 {item:"curativo_campo",amount:1,price:30,label:"Curativo de campo"},
 {item:"residuo_metalico",amount:1,price:45,label:"Liga reaproveitada"},
 {item:"conector_reuso",amount:1,price:55,label:"Conector reutilizável"},
 {item:"colete_reforcado",amount:1,price:240,label:"Colete reforçado"},
 {item:"celula_energia",amount:1,price:90,label:"Célula solidária · rede comunitária",
  minHonor:3,minLivre:2},
 {item:"fibra_optica",amount:1,price:50,label:"Fibra óptica"},
 {item:"placa_ceramica",amount:1,price:60,label:"Placa cerâmica"},
 {item:"reagente_bio",amount:1,price:65,label:"Reagente biomédico"},
 {item:"tecido_tecnico",amount:1,price:45,label:"Tecido técnico"},
 {item:"dados_criptografados",amount:1,price:90,label:"Pacote criptografado"},
 {item:"microatuador",amount:1,price:80,label:"Microatuador"},
 {item:"kit_trauma",amount:1,price:95,label:"Kit de trauma"},
 {item:"bioespuma",amount:1,price:65,label:"Bioespuma"},
 {item:"bateria_portatil",amount:1,price:90,label:"Bateria portátil"},
] as const;
export function shopOfferUnlocked(offer:ShopOffer,state:FavorState,reputation?:Reputation):boolean{
 return state.honor>=(offer.minHonor??0)&&
  (reputation?.factions.movimento_livre??-99)>=(offer.minLivre??-99);
}
const IDS=new Set(FAVORS.map(f=>f.id));
const ITEMS=new Set(NILO_SHOP.map(s=>s.item));
const safeNumber=(x:unknown,max:number)=>Number.isSafeInteger(x)&&Number(x)>=0&&Number(x)<=max?Number(x):0;
const ids=(x:unknown):FavorId[]=>Array.isArray(x)?
 [...new Set(x.filter((v):v is FavorId=>typeof v==="string"&&IDS.has(v as FavorId)))]:[];
export function readFavors(ownerId:string):FavorState{
 if(!ownerId)return {...INITIAL_FAVORS};
 try{
  const raw=globalThis.localStorage?.getItem(FAVORS_KEY+ownerId);
  if(!raw)return {...INITIAL_FAVORS};
  const v=JSON.parse(raw) as Partial<FavorState>;
  if(v.version!==1)return {...INITIAL_FAVORS};
  const accepted=ids(v.accepted),ready=ids(v.ready).filter(id=>accepted.includes(id));
  const discovered=ids(v.discovered);
  const claimed=ids(v.claimed).filter(id=>ready.includes(id));
  const purchases=Array.isArray(v.purchases)?v.purchases.filter((p):p is PurchaseReceipt=>{
   if(!p||typeof p!=="object")return false;
   return Number.isSafeInteger(p.id)&&p.id>0&&p.id<=10000&&
     ITEMS.has(p.item)&&p.amount===1&&NILO_SHOP.some(s=>s.item===p.item&&s.price===p.cost);
  }).slice(0,10000):[];
  return {version:1,accepted,ready,claimed,credits:safeNumber(v.credits,9999999),
   honor:safeNumber(v.honor,99999),purchases,discovered};
 }catch{return {...INITIAL_FAVORS};}
}
export function saveFavors(ownerId:string,state:FavorState):boolean{
 if(!ownerId)return false;
 try{const s=globalThis.localStorage;if(!s)return false;
  s.setItem(FAVORS_KEY+ownerId,JSON.stringify(state));return true;
 }catch{return false;}
}
export function favorUnlocked(quest:FavorQuest,ctx:FavorContext):boolean{
 return ctx.missionStep>=quest.minimumMission&&(!quest.needsDefeat||ctx.v09Defeated)&&
   (ctx.honor??0)>=(quest.minimumHonor??0);
}
export function visibleFavors(ctx:FavorContext):readonly FavorQuest[]{
 return FAVORS.filter(quest=>favorUnlocked(quest,ctx));
}
/** Atividades novas só entram no quadro depois que o contato contou o problema.
 * As seis tarefas antigas mantêm o desbloqueio legado sem exigir migração. */
export function knownFavors(state:FavorState,ctx:FavorContext):readonly FavorQuest[]{
 return visibleFavors(ctx).filter(f=>!f.requiresContact||
   state.discovered.includes(f.id)||state.accepted.includes(f.id));
}
export function discoverFavors(state:FavorState,actor:string,ctx:FavorContext):
 {state:FavorState;revealed:readonly FavorId[]}{
 const revealed=visibleFavors(ctx).filter(f=>f.requiresContact&&f.contactId===actor&&
   !state.discovered.includes(f.id)).map(f=>f.id);
 return revealed.length?{state:{...state,discovered:[...state.discovered,...revealed]},revealed}:
  {state,revealed:[]};
}
export function favorStatus(state:FavorState,id:FavorId):"offered"|"active"|"ready"|"claimed"{
 if(state.claimed.includes(id))return "claimed";
 if(state.ready.includes(id))return "ready";
 return state.accepted.includes(id)?"active":"offered";
}
export function acceptFavor(state:FavorState,id:FavorId,ctx:FavorContext):
 {ok:boolean;state:FavorState;message:string}{
 const quest=FAVORS.find(f=>f.id===id);
 if(!quest||!favorUnlocked(quest,ctx)||quest.requiresContact&&!state.discovered.includes(id))
  return {ok:false,state,message:"Este favor ainda não foi descoberto. Procure o contato."};
 if(state.accepted.includes(id))return {ok:false,state,message:"Este favor já está no seu diário."};
 if(state.accepted.filter(x=>!state.claimed.includes(x)).length>=3)
  return {ok:false,state,message:"Conclua um dos três favores ativos antes de aceitar outro."};
 return {ok:true,state:{...state,accepted:[...state.accepted,id]},
  message:quest.contact+" confiou este favor a você. "+quest.objective};
}
/** Um favor só avança quando a ação do cenário foi efetivamente autorizada.
 * Ex.: consultar um console bloqueado não equivale a recuperar seus registros. */
export function recordFavorActivity(state:FavorState,actor:string,accessible=true):
 {state:FavorState;ready:readonly FavorId[]}{
 if(!accessible)return {state,ready:[]};
 const ready=FAVORS.filter(f=>f.taskId===actor&&state.accepted.includes(f.id)&&
  !state.ready.includes(f.id)&&!state.claimed.includes(f.id)).map(f=>f.id);
 return ready.length?{state:{...state,ready:[...state.ready,...ready]},ready}:{state,ready:[]};
}
export function claimFavor(state:FavorState,id:FavorId):
 {ok:boolean;state:FavorState;message:string}{
 const quest=FAVORS.find(f=>f.id===id);
 if(!quest||!state.ready.includes(id)||state.claimed.includes(id))
  return {ok:false,state,message:"Este favor ainda não está pronto para entrega."};
 const {credits,honor}=quest.reward;
 const next={...state,claimed:[...state.claimed,id],
  credits:Math.min(9999999,state.credits+credits),
  honor:Math.min(99999,state.honor+honor)};
 return {ok:true,state:next,
  message:"Favor concluído: "+quest.title+". +"+quest.reward.xp+" XP, +"+
    credits+" créditos, +"+honor+" Honra e item de recompensa."};
}
export function buyFromNilo(state:FavorState,item:ItemId,reputation?:Reputation):
 {ok:boolean;state:FavorState;message:string}{
 const offer=NILO_SHOP.find(s=>s.item===item);
 if(!offer)return {ok:false,state,message:"Esse item não está disponível na oficina."};
 if(!shopOfferUnlocked(offer,state,reputation))
  return {ok:false,state,message:"A rede comunitária ainda não autorizou este suprimento."};
 if(state.credits<offer.price)return {ok:false,state,message:"Créditos insuficientes. Saldo: "+state.credits+"."};
 if(state.purchases.length>=10000)return {ok:false,state,message:"Limite de registros atingido; salve o personagem."};
 const nextId=(state.purchases.at(-1)?.id??0)+1;
 return {ok:true,state:{...state,credits:state.credits-offer.price,
  purchases:[...state.purchases,{id:nextId,item:offer.item,amount:offer.amount,cost:offer.price}]},
  message:offer.label+" adquirido por "+offer.price+" créditos."};
}
/** Recibos salvos no mesmo registro do item: reconstrução idempotente após encerramento do app. */
export function syncFavorItems(inventory:InventoryState,state:FavorState):InventoryState{
 let updated=inventory;
 for(const id of state.claimed){
  const quest=FAVORS.find(f=>f.id===id);
  if(quest)updated=grantRewardInventoryItem(updated,quest.reward.item,quest.reward.amount,"favor-"+id);
 }
 for(const p of state.purchases){
  updated=grantRewardInventoryItem(updated,p.item,p.amount,"shop-"+p.id);
 }
 return updated;
}

/** A importação de backups recusa campos estranhos e moeda não conquistada. */
export function validateFavorBackup(raw:unknown):raw is FavorState{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const s=raw as Record<string,unknown>;
 if(Object.keys(s).some(k=>!["version","accepted","ready","claimed","credits","honor","purchases","discovered"].includes(k))||
   s.version!==1)return false;
 const valid=(x:unknown):x is FavorId[]=>Array.isArray(x)&&x.length<=FAVORS.length&&
   new Set(x).size===x.length&&x.every(v=>typeof v==="string"&&IDS.has(v as FavorId));
 if(!valid(s.accepted)||!valid(s.ready)||!valid(s.claimed)||
   s.discovered!==undefined&&!valid(s.discovered))return false;
 const accepted=s.accepted as FavorId[],ready=s.ready as FavorId[],claimed=s.claimed as FavorId[];
 if(!ready.every(x=>accepted.includes(x))||!claimed.every(x=>ready.includes(x)))return false;
 if(!Array.isArray(s.purchases)||s.purchases.length>10000)return false;
 const purchases=s.purchases as unknown[];
 for(let i=0;i<purchases.length;i++){
  const x=purchases[i];
  if(!x||typeof x!=="object"||Array.isArray(x))return false;
  const p=x as Record<string,unknown>;
  if(Object.keys(p).some(k=>!["id","item","amount","cost"].includes(k))||
    p.id!==i+1||p.amount!==1||!NILO_SHOP.some(n=>n.item===p.item&&n.price===p.cost))return false;
 }
 const credits=claimed.reduce((v:number,id:FavorId)=>
  v+(FAVORS.find(f=>f.id===id)?.reward.credits??0),0)-
  purchases.reduce((v:number,p)=>v+(p as PurchaseReceipt).cost,0);
 const honor=claimed.reduce((v:number,id:FavorId)=>
  v+(FAVORS.find(f=>f.id===id)?.reward.honor??0),0);
 return Number.isSafeInteger(s.credits)&&Number.isSafeInteger(s.honor)&&
   s.credits===credits&&s.honor===honor;
}
