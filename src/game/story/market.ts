import type {ClassId} from "../classes/registry.ts";
import type {OriginId} from "../character/origins.ts";

export type MarketActorId="feira-corretor"|"feira-ajuda"|"feira-archive"|"iza"|"tomas";
export interface MarketState {
  readonly clues:readonly string[];
  readonly decisions:readonly string[];
  readonly trust:number;
  readonly heat:number;
}
export interface MarketAction {
  readonly id:string; readonly actor:MarketActorId;
  readonly label:string; readonly reply:string;
  readonly classId?:ClassId; readonly clue:string;
  readonly trustDelta:number;readonly heatDelta:number;
}
export interface MarketConversation {
  readonly speaker:string;readonly role:string;readonly portrait:string;readonly text:string;
  readonly choices:readonly {id:string;label:string;reply:string;marketAction:string}[];
}
const KEY="cyberpunk-tactical-rpg.market.v1.";
export const INITIAL_MARKET:MarketState={clues:[],decisions:[],trust:0,heat:0};

/** As escolhas são originais de Nova Arcádia; cada classe tem uma utilidade
 * narrativa com consequência persistente, sem copiar regras ou cenários externos.
 */
export const MARKET_ACTIONS:readonly MarketAction[]=[
  {id:"converse",actor:"feira-corretor",label:"Perguntar sobre a chegada dos carregamentos",reply:"Davi aponta recibos de entregas que não figuram no inventário público. O mercado anota tudo em papel quando a rede municipal falha.",clue:"market-receipts",trustDelta:1,heatDelta:0},
  {id:"mutirao",actor:"feira-ajuda",label:"Ajudar na distribuição de água",reply:"Marta agradece pelo trabalho. As famílias escolhem coletivamente quem recebe a reserva em caso de falta; a plataforma central mudou a prioridade sem explicação.",clue:"market-water",trustDelta:1,heatDelta:0},
  {id:"boletim",actor:"feira-archive",label:"Consultar avisos sobre a manutenção",reply:"O boletim da feira mostra que um lote de válvulas foi desviado para um endereço sem cadastro, na mesma janela da ocorrência V-09.",clue:"market-lot",trustDelta:0,heatDelta:0},
  {id:"entrega",actor:"iza",label:"Ouvir sobre as rotas de entrega",reply:"Iza mostra um desvio de caixas de material médico. A rota oficial foi alterada durante a noite por uma conta que não pertencia à cooperativa.",clue:"market-route",trustDelta:0,heatDelta:0},
  {id:"caminho",actor:"tomas",label:"Perguntar pelos caminhos do entreposto",reply:"Tomás marca a passagem dos trabalhadores entre a feira e o Canal Sul. Nenhum deles autorizou a transferência V-09.",clue:"market-passage",trustDelta:0,heatDelta:0},
  {id:"solo-guarda",actor:"feira-ajuda",classId:"solo",label:"Solo · Escoltar a distribuição comunitária",reply:"A presença do Solo afasta cobradores clandestinos. Marta abre os registros de quem ficou sem água; uma empresa de segurança fez cobranças seletivas.",clue:"market-security",trustDelta:2,heatDelta:1},
  {id:"netrunner-eco",actor:"feira-archive",classId:"netrunner",label:"Netrunner · Comparar assinaturas da rede",reply:"O terminal confirma um protocolo de triagem marcado E.D.N. em arquivos espelhados. A assinatura é compatível com um sistema autônomo, mas não prova a origem da ordem.",clue:"market-signature",trustDelta:0,heatDelta:1},
  {id:"tech-bombas",actor:"feira-archive",classId:"tecnico",label:"Técnico · Reparar o regulador do mural",reply:"O regulador volta a funcionar e revela um aviso ocultado: um lote de peças foi requisitado por um serviço sem equipe cadastrada.",clue:"market-regulator",trustDelta:2,heatDelta:0},
  {id:"medtech-ajuda",actor:"feira-ajuda",classId:"medtech",label:"Tecnólogo Médico · Atender moradores feridos",reply:"A triagem identifica lesões provocadas por implantes de manutenção defeituosos. Marta registra o encaminhamento para a clínica de Amara.",clue:"market-injuries",trustDelta:2,heatDelta:0},
  {id:"rockerboy-reuniao",actor:"feira-ajuda",classId:"rockerboy",label:"Garoto Roqueiro · Mobilizar assembleia",reply:"A praça se organiza para exigir transparência. Os moradores reúnem testemunhos do bloqueio de serviços, sem depender da imprensa corporativa.",clue:"market-assembly",trustDelta:2,heatDelta:1},
  {id:"media-fonte",actor:"feira-archive",classId:"midia",label:"Mídia · Confrontar duas fontes",reply:"Duas cópias discordam quanto ao destino da carga. A versão pública apagou o nome do responsável, mas manteve a trilha do documento.",clue:"market-redaction",trustDelta:1,heatDelta:1},
  {id:"corpo-credencial",actor:"feira-corretor",classId:"corporativo",label:"Executivo · Auditar o manifesto com credencial",reply:"A credencial revela uma terceirizada da Helix no campo de autorização. A consulta ficou registrada no sistema, aumentando a atenção da segurança.",clue:"market-helix",trustDelta:0,heatDelta:2},
  {id:"lawman-protocolo",actor:"feira-archive",classId:"policial",label:"Policial · Verificar cadeia de custódia",reply:"A ordem de apreensão não apresenta número de protocolo válido. A falta de autorização formal pode sustentar a denúncia dos moradores.",clue:"market-illegal-order",trustDelta:1,heatDelta:1},
  {id:"nomad-desvio",actor:"iza",classId:"nomade",label:"Nômade · Reconstituir trajeto dos caminhões",reply:"As marcas nos pneus indicam uma rota de serviço fora do mapa oficial. Iza recebe uma alternativa segura para futuras entregas.",clue:"market-hidden-route",trustDelta:1,heatDelta:0},
  {id:"street-atalho",actor:"feira-corretor",classId:"marginal",label:"Marginal · Consultar rede de becos",reply:"Os contatos de rua identificam um operador que troca credenciais por água e energia. O acesso ao mercado informal fica registrado.",clue:"market-broker",trustDelta:1,heatDelta:0},
  {id:"fixer-negocio",actor:"feira-corretor",classId:"fixador",label:"Fixador · Negociar acesso aos registros",reply:"Davi aceita um acordo de reciprocidade. A cooperativa compartilha um manifesto de cargas sem exigir pagamento dos moradores.",clue:"market-deal",trustDelta:2,heatDelta:0},
] as const;
const ACTORS:Readonly<Record<MarketActorId,{speaker:string;role:string;portrait:string;text:string}>>={
 "feira-corretor":{speaker:"Davi",role:"INTERMEDIÁRIO DE ACESSOS",portrait:"D",text:"Não existe mercado livre se metade das rotas passa por uma chave corporativa. Eu vendo contatos, mas também sei quando dizer não."},
 "feira-ajuda":{speaker:"Marta",role:"ARTICULADORA COMUNITÁRIA",portrait:"M",text:"A água chega quando a bomba funciona. Quando alguém muda a prioridade dos serviços, uma família fica sem nada. A Casa Comum guarda o que as redes apagam."},
 "feira-archive":{speaker:"MURAL DE BOLETINS",role:"REDE COMUNITÁRIA DESCENTRALIZADA",portrait:"▤",text:"NOTÍCIAS LOCAIS: manutenção de válvulas, escala de atendimento e avisos de entregas. Alguns registros possuem divergências com o cadastro municipal."},
 iza:{speaker:"Iza",role:"ENTREGADORA DA FEIRA",portrait:"I",text:"Rodo entre o Pátio e a feira todos os dias. Um caminhão pode sumir da rede, mas não some das ruas."},
 tomas:{speaker:"Tomás",role:"VOLUNTÁRIO DO ENTREPOSTO",portrait:"T",text:"Os cabos são reaproveitados aqui, não porque somos atrasados, mas porque ninguém garante peças para nossa rede."}
};
export const MARKET_CLUE_TEXT:Readonly<Record<string,string>>=Object.fromEntries(
 MARKET_ACTIONS.map(action=>[action.clue,action.reply])
);
export function isMarketActor(id:string):id is MarketActorId{return Object.prototype.hasOwnProperty.call(ACTORS,id);}
export function getMarketConversation(actor:MarketActorId,classId:ClassId|null,
  state:MarketState,reported:boolean,originId:OriginId):MarketConversation{
 const base=ACTORS[actor];
 const text=base.text
   +(reported?" Após a queda da sentinela V-09, circulam novas informações de quem controlava as transferências.":"")
   +(originId==="baixada"?" Você conhece estes caminhos desde antes do último bloqueio.":"")
   +(state.heat>=3?" A vigilância municipal aumentou as rondas depois das consultas à rede; os comerciantes baixam o tom de voz.":"")
   +(state.trust>=2?" Os trabalhadores conhecem seus atos em favor da comunidade e compartilham informações com mais confiança.":"");
 return {...base,text,choices:MARKET_ACTIONS.filter(action=>
   action.actor===actor&&(!action.classId||action.classId===classId)&&!state.decisions.includes(action.id))
   .map(action=>({id:action.id,label:action.label,reply:action.reply,marketAction:action.id}))};
}
export function applyMarketAction(state:MarketState,actionId:string,classId:ClassId|null):
  {state:MarketState;applied:boolean;clue?:string}{
 const action=MARKET_ACTIONS.find(a=>a.id===actionId);
 if(!action||state.decisions.includes(action.id)||action.classId&&action.classId!==classId)
   return {state,applied:false};
 const next:MarketState={
   decisions:[...state.decisions,action.id],
   clues:state.clues.includes(action.clue)?state.clues:[...state.clues,action.clue],
   trust:Math.max(0,Math.min(5,state.trust+action.trustDelta)),
   heat:Math.max(0,Math.min(5,state.heat+action.heatDelta)),
 };
 return {state:next,applied:true,clue:action.clue};
}
export function readMarket(characterId:string):MarketState {
 try{
   const raw=globalThis.localStorage?.getItem(KEY+characterId);
   if(!raw)return {...INITIAL_MARKET};
   const obj=JSON.parse(raw) as Partial<MarketState>;
   const knownDecisions=new Set(MARKET_ACTIONS.map(a=>a.id));
   const knownClues=new Set(MARKET_ACTIONS.map(a=>a.clue));
   return {
     decisions:Array.isArray(obj.decisions)?obj.decisions.filter((x):x is string=>typeof x==="string"&&knownDecisions.has(x)):[],
     clues:Array.isArray(obj.clues)?obj.clues.filter((x):x is string=>typeof x==="string"&&knownClues.has(x)):[],
     trust:Math.max(0,Math.min(5,Number.isFinite(obj.trust)?obj.trust!:0)),
     heat:Math.max(0,Math.min(5,Number.isFinite(obj.heat)?obj.heat!:0)),
   };
 }catch{return {...INITIAL_MARKET};}
}
export function saveMarket(characterId:string,state:MarketState):boolean{
 if(!characterId)return false;
 try{globalThis.localStorage?.setItem(KEY+characterId,JSON.stringify(state));return true;}
 catch{return false;}
}
