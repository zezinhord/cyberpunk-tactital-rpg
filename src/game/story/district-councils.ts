/** Nova Arcádia 2.0: seven playable district councils, each unlocked
 * by four physical evidence quests AND their four completed forensic cases.
 * Three exclusive outcomes per district (21 endings), unique one-time XP,
 * persistent neighborhood pressure, and backwards-compatible local saves.
 */
import {EXPANSION_ROOM_DESIGNS,type ExpansionInnerId} from "../districts/expansion-interiors.ts";
import type {InnerContractsState} from "./inner-contracts.ts";
export const COUNCIL_KEY="cyberpunk-tactical-rpg.district-councils-v20.v1.";
export const COUNCIL_IDS=["baixada","ferrugem","aurea","subsolo","setor-zero","prisma","periferia"] as const;
export type CouncilId=(typeof COUNCIL_IDS)[number];
export const COUNCIL_METHODS=["solidarity","oversight","centralized"] as const;
export type CouncilMethod=(typeof COUNCIL_METHODS)[number];
export interface CouncilChoice{id:CouncilMethod;label:string;outcome:string;pressure:-1|0|1}
export interface RegionalCouncil{
 id:CouncilId;title:string;guide:string;question:string;rewardXp:number;
 choices:readonly [CouncilChoice,CouncilChoice,CouncilChoice];
}
export const DISTRICT_COUNCILS:Readonly<Record<CouncilId,RegionalCouncil>>={
 baixada:{
  id:"baixada",title:"A água pertence a quem?",guide:"Marta",rewardXp:90,
  question:"Os quatro laudos provam desvio de água, corte de luz da feira, invasão de privacidade e apagamento de moradores. Quem deve controlar a infraestrutura?",
  choices:[
   {id:"solidarity",label:"Instituir uma assembleia das cisternas",pressure:-1,
    outcome:"A associação organiza medições públicas e rodízio de água. A feira recupera energia, os sensores deixam de apontar para janelas e o memorial preserva testemunhos autorizados."},
   {id:"oversight",label:"Convocar fiscalização externa com poder de veto",pressure:0,
    outcome:"Uma auditoria independente acompanha os hidrômetros e os cortes. A solução é mais lenta, mas toda intervenção deixa uma trilha de contestação pública."},
   {id:"centralized",label:"Aceitar a recuperação emergencial da Helix",pressure:1,
    outcome:"O abastecimento retorna antes, mas a prioridade volta a ser definida por uma central opaca. Os moradores mantêm cadernos de leituras para documentar novos abusos."},
  ],
 },
 ferrugem:{
  id:"ferrugem",title:"Direito ao turno",guide:"Ramon",rewardXp:98,
  question:"Os registros provam jornadas apagadas, falhas da caldeira, divergência no voto sindical e cargas desviadas. Como reabrir a fábrica?",
  choices:[
   {id:"solidarity",label:"Entregar o comando de segurança aos trabalhadores",pressure:-1,
    outcome:"A assembleia recupera os livros de ponto e concede aos operários poder de interromper equipamentos perigosos, mesmo quando a produção cair."},
   {id:"oversight",label:"Exigir dupla assinatura de técnicos e sindicato",pressure:0,
    outcome:"Os turnos e as válvulas são auditados de forma conjunta; nenhum supervisor pode apagar registros sem deixar uma contestação verificável."},
   {id:"centralized",label:"Reativar os controles automáticos de produção",pressure:1,
    outcome:"A fábrica acelera, mas painéis corporativos voltam a definir horas e condições sem a participação dos operários. O sindicato organiza registros paralelos."},
  ],
 },
 aurea:{
  id:"aurea",title:"O direito de auditar",guide:"Iris",rewardXp:106,
  question:"Cobranças duplicadas, triagem seletiva, circuitos bloqueados e contratos sem consentimento mostram uma política invisível. Quem deve verificar as decisões?",
  choices:[
   {id:"solidarity",label:"Transferir os registros a uma custódia cívica",pressure:-1,
    outcome:"Pacientes e trabalhadores recebem acesso a versões anonimizadas e podem questionar recusas de triagem e pagamentos sem expor dados clínicos."},
   {id:"oversight",label:"Criar duas instâncias de auditoria independente",pressure:0,
    outcome:"O Consórcio Cívico e representantes sociais passam a confrontar assinaturas, rotas e critérios de atendimento antes de ratificar decisões."},
   {id:"centralized",label:"Confiar a correção interna aos executivos da Helix",pressure:1,
    outcome:"Divergências contábeis são rapidamente corrigidas, mas a corporação mantém a trilha completa sob sigilo. Médicos registram recusas para contestação futura."},
  ],
 },
 subsolo:{
  id:"subsolo",title:"Sem nomes, sem abandono",guide:"Mara",rewardXp:114,
  question:"Ar desigual, exigência de prontuários, canais sem mapa nominal e dívidas de energia formam uma disputa por privacidade e sobrevivência. Qual acordo aceitar?",
  choices:[
   {id:"solidarity",label:"Criar manutenção coletiva sem identificação nominal",pressure:-1,
    outcome:"Moradores compartilham apenas vazões, defeitos e necessidades agregadas. A enfermaria recebe insumos sem divulgar pessoas ou esconderijos."},
   {id:"oversight",label:"Negociar assistência sob mediação anônima",pressure:0,
    outcome:"Uma comissão acompanha filtros e dívidas sem recolher prontuários. Os serviços chegam de modo gradual, e qualquer novo cadastro exige consentimento."},
   {id:"centralized",label:"Solicitar credenciais temporárias à corporação",pressure:1,
    outcome:"A entrega de energia e filtros acelera, mas o acesso aos túneis passa a depender de credenciais. A rede clandestina intensifica cuidados contra vigilância."},
  ],
 },
 "setor-zero":{
  id:"setor-zero",title:"Quando o veto salva vidas",guide:"Amara",rewardXp:122,
  question:"Uma enfermaria bloqueada, portas sob pressão, um reator dividido e o veto revogado exigem decisão sobre quem pode autorizar emergências.",
  choices:[
   {id:"solidarity",label:"Devolver o poder de veto às equipes médicas",pressure:-1,
    outcome:"Profissionais recuperam o direito de interromper comandos que ameaçam pacientes; o circuito hospitalar permanece ligado enquanto módulos coercitivos são isolados."},
   {id:"oversight",label:"Reabrir somente após perícia e equalização",pressure:0,
    outcome:"Especialistas auditam assinaturas e pressão antes de liberar os setores. A recuperação demora, mas preserva documentação e segurança."},
   {id:"centralized",label:"Liberar a retomada sob controle automático",pressure:1,
    outcome:"O complexo restabelece energia rapidamente, porém ordens críticas permanecem opacas. Amara exige cópias independentes de cada ocorrência."},
  ],
 },
 prisma:{
  id:"prisma",title:"Quem possui a palavra?",guide:"Duda",rewardXp:130,
  question:"Gravações interrompidas, pressões de patrocinadores, memória da galeria e retificações ocultas revelam controle editorial da cidade. Como publicar as provas?",
  choices:[
   {id:"solidarity",label:"Conceder a curadoria às fontes e aos moradores",pressure:-1,
    outcome:"As pessoas afetadas autorizam publicações com contexto e proteção de identidade; o público pode solicitar correções sem depender da corporação."},
   {id:"oversight",label:"Criar revisão independente com direito de resposta",pressure:0,
    outcome:"As versões e cortes editoriais ficam rastreáveis. Patrocinadores ainda disputam a pauta, mas não podem apagar o histórico sem contestação."},
   {id:"centralized",label:"Aceitar a intermediação editorial da Helix",pressure:1,
    outcome:"A emissora recupera alcance e equipamentos, mas perde autonomia nos horários e retificações. Jornalistas preservam arquivos fora da rede."},
  ],
 },
 periferia:{
  id:"periferia",title:"Estrada de ninguém",guide:"Dara",rewardXp:138,
  question:"A garagem, estufa, posto de socorro e farol demonstram que a cidade depende de caravanas sem cadastro. Qual pacto mantém a estrada aberta?",
  choices:[
   {id:"solidarity",label:"Instituir corredores solidários de passagem",pressure:-1,
    outcome:"Caravanas recebem peças e atendimento sem rastreamento permanente. Equipes comunitárias mantêm mapas de trechos públicos e pontos de socorro."},
   {id:"oversight",label:"Criar fiscalização rotativa das rotas de emergência",pressure:0,
    outcome:"O acordo registra incidentes e segurança viária, não trajetos pessoais. Ambulâncias têm passagem prioritária e direito de contestação."},
   {id:"centralized",label:"Integrar todas as rotas ao cadastro urbano",pressure:1,
    outcome:"A rede de estradas ganha peças e sinal, mas os movimentos entram no sistema de vigilância. Dara mantém um serviço de resgate independente."},
  ],
 },
};
export interface CouncilProgress{version:1;choices:Partial<Record<CouncilId,CouncilMethod>>}
export const EMPTY_COUNCILS:Readonly<CouncilProgress>={version:1,choices:{}};
export function isCouncilId(id:unknown):id is CouncilId{
 return typeof id==="string"&&COUNCIL_IDS.some(x=>x===id);
}
export function isCouncilMethod(id:unknown):id is CouncilMethod{
 return typeof id==="string"&&COUNCIL_METHODS.some(x=>x===id);
}
export function districtOfRoom(id:ExpansionInnerId):CouncilId{
 for(const district of COUNCIL_IDS)
  if(id.startsWith(district+"-"))return district;
 throw new Error("Unrecognized interior district");
}
export function councilForRoom(id:ExpansionInnerId):RegionalCouncil{
 return DISTRICT_COUNCILS[districtOfRoom(id)];
}
export function validateCouncilProgress(raw:unknown):raw is CouncilProgress{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const v=raw as Record<string,unknown>;
 if(v.version!==1||Object.keys(v).some(key=>key!=="version"&&key!=="choices")||
  !v.choices||typeof v.choices!=="object"||Array.isArray(v.choices))return false;
 const entries=Object.entries(v.choices);
 return entries.length<=COUNCIL_IDS.length&&
  entries.every(([region,choice])=>isCouncilId(region)&&isCouncilMethod(choice));
}
export function readCouncils(characterId:string):CouncilProgress{
 if(!characterId)return {version:1,choices:{}};
 try{
  const raw=globalThis.localStorage?.getItem(COUNCIL_KEY+characterId);
  const data:unknown=raw?JSON.parse(raw):null;
  return validateCouncilProgress(data)?data:{version:1,choices:{}};
 }catch{return {version:1,choices:{}};}
}
export function saveCouncils(characterId:string,data:CouncilProgress):boolean{
 if(!characterId||!validateCouncilProgress(data))return false;
 try{
  const storage=globalThis.localStorage;
  if(!storage)return false;
  storage.setItem(COUNCIL_KEY+characterId,JSON.stringify(data));
  return true;
 }catch{return false;}
}
export function councilUnlocked(region:CouncilId,contracts:InnerContractsState):boolean{
 const completed=new Set(contracts.completed);
 const analysed=new Set(contracts.analysed??[]);
 const matching=EXPANSION_ROOM_DESIGNS.filter(room=>room.id.startsWith(region+"-"));
 return matching.length===4&&matching.every(room=>
  completed.has(room.id)&&analysed.has(room.id));
}
export function councilObjective(region:CouncilId,contracts:InnerContractsState,
 progress:CouncilProgress):string{
 const decision=progress.choices[region];
 if(decision)return DISTRICT_COUNCILS[region].choices.find(c=>c.id===decision)!.outcome;
 const analysed=new Set(contracts.analysed??[]);
 const matching=EXPANSION_ROOM_DESIGNS.filter(room=>room.id.startsWith(region+"-"));
 const count=matching.filter(room=>analysed.has(room.id)).length;
 return count===4?"As quatro provas foram examinadas. Procure o contato em um dos interiores para deliberar.":
  "Complete os quatro pareceres forenses deste distrito ("+count+"/4).";
}
export function resolveCouncil(state:CouncilProgress,contracts:InnerContractsState,
 region:CouncilId,method:CouncilMethod):
 {ok:boolean;state:CouncilProgress;message:string;xp:number;pressure:number}{
 if(!isCouncilId(region)||!isCouncilMethod(method))
  return {ok:false,state,message:"Decisão inválida.",xp:0,pressure:0};
 if(state.choices[region])
  return {ok:false,state,message:"Este distrito já possui uma decisão registrada.",
   xp:0,pressure:0};
 if(!councilUnlocked(region,contracts))
  return {ok:false,state,message:"A audiência exige as quatro investigações e pareceres completos.",
   xp:0,pressure:0};
 const council=DISTRICT_COUNCILS[region];
 const choice=council.choices.find(x=>x.id===method)!;
 return {ok:true,state:{version:1,choices:{...state.choices,[region]:method}},
  message:choice.outcome,xp:council.rewardXp,pressure:choice.pressure};
}
export function councilImpact(state:CouncilProgress,region:CouncilId):
 CouncilChoice|null{
 const selected=state.choices[region];
 if(!selected)return null;
 return DISTRICT_COUNCILS[region].choices.find(x=>x.id===selected)??null;
}
