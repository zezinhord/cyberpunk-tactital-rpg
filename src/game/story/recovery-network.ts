/** OPERAÇÃO RETOMADA — pós-conselhos, nova missão de reconstrução em sete distritos.
 * Depois de defender o acordo, volte fisicamente aos sistemas de 3 interiores
 * diferentes (21 equipamentos) e escolha quem administrará a infraestrutura.
 * As decisões repercutem em relações e suporte tático; nada usa XP repetível.
 *
 * Este estado é independente dos conselhos para não invalidar salvamentos RC4
 * e backups já exportados; a campanha principal nunca depende desta expansão.
 */
import {EXPANSION_ROOM_DESIGNS,type ExpansionInnerId} from "../districts/expansion-interiors.ts";
import type {CouncilId,CouncilProgress,CouncilFactionDelta} from "./district-councils.ts";
import {COUNCIL_IDS,isCouncilId} from "./district-councils.ts";
import type {UrbanCombatSupport} from "./urban-chronicles.ts";

export const RECOVERY_KEY="cyberpunk-tactical-rpg.reconstruction-v20.v1.";
export const RECOVERY_METHODS=["collective","audited","contracted"] as const;
export type RecoveryMethod=(typeof RECOVERY_METHODS)[number];
export interface RecoveryProgress{
 version:1;
 /** Máquinas reparadas: 0–3 comprovantes por distrito. */
 repairs:Partial<Record<CouncilId,readonly ExpansionInnerId[]>>;
 /** Decisões finais só após os 3 pontos de manutenção. */
 outcomes:Partial<Record<CouncilId,RecoveryMethod>>;
}
export const EMPTY_RECOVERY:Readonly<RecoveryProgress>={
 version:1,repairs:{},outcomes:{},
};
export const RECOVERY_LINES:Readonly<Record<CouncilId,{
 title:string;purpose:string;completion:string;
 finalOptions:Readonly<Record<RecoveryMethod,{label:string;outcome:string;
  effect:CouncilFactionDelta;support:UrbanCombatSupport}>>;
}>>={
 baixada:{
  title:"A Água Volta a Circular",
  purpose:"Os hidrômetros, a feira e os varais ainda precisam de manutenção coordenada antes que o abastecimento seja realmente independente.",
  completion:"A reserva voltou a abastecer os bairros. A documentação da manutenção foi entregue aos moradores, com possibilidade de contestação.",
  finalOptions:{
   collective:{label:"Entregar o sistema à cooperativa de água",
    outcome:"As famílias mantêm a válvula de emergência e o quadro de leituras aberto à fiscalização social.",
    effect:{movimento_livre:2,helix:-1},
    support:{label:"Cooperativa das cisternas: proteção compartilhada",armor:1}},
   audited:{label:"Operar com medição e revisão pública",
    outcome:"Um cadastro apenas de volumes e falhas assegura auditoria dos cortes sem recolher nomes de moradores.",
    effect:{consorcio_civico:2,movimento_livre:1},
    support:{label:"Auditoria hídrica: baterias de campo revisadas",energy:2}},
   contracted:{label:"Reativar a concessionária sob contrato limitado",
    outcome:"A vazão sobe mais rapidamente, mas qualquer interrupção exige comprovante e aviso prévio à comunidade.",
    effect:{helix:2,movimento_livre:-1},
    support:{label:"Obras da concessionária: rota logística aberta",movement:1}},
  },
 },
 ferrugem:{
  title:"A Memória dos Turnos",
  purpose:"É preciso sincronizar relógios, freios térmicos e contagem dos votos para que os turnos não possam mais desaparecer.",
  completion:"A fundição reabre com bloqueio de emergência, registros imutáveis e escala auditável.",
  finalOptions:{
   collective:{label:"Organizar equipes de manutenção operária",
    outcome:"Trabalhadores elegem responsáveis pelo freio de emergência e recebem acesso às paradas do forno.",
    effect:{movimento_livre:2,helix:-1},
    support:{label:"Operários da Ferrugem: blindagem artesanal",armor:1}},
   audited:{label:"Exigir dupla assinatura dos registros",
    outcome:"A medição do forno e o registro de horas precisam coincidir com a assinatura sindical para entrar no painel.",
    effect:{consorcio_civico:2,movimento_livre:1},
    support:{label:"Engenharia auditada: sensores de mira",attack:1}},
   contracted:{label:"Alugar servos industriais sob fiscalização",
    outcome:"A produção retoma com velocidade, mas os contratos impõem inspeções e direito de parada humana.",
    effect:{helix:2,movimento_livre:-1},
    support:{label:"Servos de fábrica: propulsores táticos",movement:1}},
  },
 },
 aurea:{
  title:"Os Registros Não Desaparecem",
  purpose:"Reconecte contabilidade, triagem e arquivo para impedir que a recuperação apague novamente as trilhas das pessoas atendidas.",
  completion:"As decisões sobre saúde e pagamentos poderão ser contestadas sem divulgar dados clínicos pessoais.",
  finalOptions:{
   collective:{label:"Confiar cópias anonimizadas aos pacientes",
    outcome:"Representantes de pacientes acompanham triagens e correções, sem expor prontuários particulares.",
    effect:{movimento_livre:2,helix:-1},
    support:{label:"Rede de pacientes: suprimentos de apoio",energy:2}},
   audited:{label:"Criar custódia técnica com auditoria independente",
    outcome:"Toda modificação deixa registro verificável com duas chaves e contraditório público.",
    effect:{consorcio_civico:2,helix:-1},
    support:{label:"Auditoria de Áurea: dados balísticos verificados",attack:1}},
   contracted:{label:"Retomar auditoria corporativa sob supervisão",
    outcome:"A Helix reabre a rede contábil, mas admite auditoria externa de ordens médicas.",
    effect:{helix:2,consorcio_civico:1},
    support:{label:"Credenciais corporativas: escudo de acesso",armor:1}},
  },
 },
 subsolo:{
  title:"Ar Que Não Exige Identidade",
  purpose:"Verifique os filtros de ar, os corredores clandestinos e a enfermaria sem entregar a lista de moradores aos operadores.",
  completion:"O circuito de ar e a ajuda médica funcionam sem expor a localização de pessoas vulneráveis.",
  finalOptions:{
   collective:{label:"Manter o sistema com equipes anônimas",
    outcome:"Técnicos voluntários compartilham pressão e necessidade de remédios, nunca nomes ou rotas pessoais.",
    effect:{movimento_livre:2,mercado_cinzento:1},
    support:{label:"Batedores do Subsolo: passagens auxiliares",movement:1}},
   audited:{label:"Publicar níveis de ar sem identificar moradores",
    outcome:"Um painel público mostra apenas vazão, contaminantes e prazos de manutenção, com revisão independente.",
    effect:{consorcio_civico:2,movimento_livre:1},
    support:{label:"Sensores ambientais: proteção respiratória",armor:1}},
   contracted:{label:"Negociar filtros com o Mercado Cinzento",
    outcome:"As trocas clandestinas aceleram a entrega, mas o preço fica sujeito ao veto da enfermaria.",
    effect:{mercado_cinzento:2,helix:-1},
    support:{label:"Fornecedores clandestinos: baterias sobressalentes",energy:2}},
  },
 },
 "setor-zero":{
  title:"O Veto Continua Humano",
  purpose:"Repare equalização, isolamento e centro de triagem para que nenhuma rotina volte a confinar pacientes sem decisão humana.",
  completion:"A enfermaria dispõe de energia, filtros e um veto médico operacional sobre os módulos de contenção.",
  finalOptions:{
   collective:{label:"Garantir veto permanente às equipes de saúde",
    outcome:"Médicos podem suspender uma ordem automática sem pedir autorização à central corporativa.",
    effect:{movimento_livre:2,helix:-2},
    support:{label:"Equipes médicas: reserva de energia",energy:2}},
   audited:{label:"Separar autorizações clínicas e industriais",
    outcome:"Uma dupla de técnicos verifica pressão, assinatura e consentimento antes de qualquer abertura.",
    effect:{consorcio_civico:2,helix:-1},
    support:{label:"Perícia de contenção: blindagem segura",armor:1}},
   contracted:{label:"Manter automação com desligamento externo",
    outcome:"O reator responde mais rápido, mas o veto físico permanece fora do controle da Helix.",
    effect:{helix:2,consorcio_civico:-1},
    support:{label:"Reator sincronizado: assistência de mira",attack:1}},
  },
 },
 prisma:{
  title:"Sinal de Quem Vive Aqui",
  purpose:"Repare o emissor, os equipamentos de palco e o painel de retificações antes de entregar a transmissão a qualquer grupo.",
  completion:"O canal retorna com histórico de cortes, direito de resposta e proteção voluntária das testemunhas.",
  finalOptions:{
   collective:{label:"Eleger curadoria pública do sinal",
    outcome:"Fontes e trabalhadores do palco aprovam trechos, legendas e retificações com direito a retirar informações pessoais.",
    effect:{movimento_livre:2,mercado_cinzento:1},
    support:{label:"Sinal popular: interferência mapeada",attack:1}},
   audited:{label:"Criar registro aberto de cortes editoriais",
    outcome:"A transmissão mantém log público das alterações e prazo verificável para correções.",
    effect:{consorcio_civico:2,movimento_livre:1},
    support:{label:"Técnicos de edição: bateria de transmissão",energy:2}},
   contracted:{label:"Aceitar patrocínio com cláusula de não censura",
    outcome:"O estúdio recebe peças novas, mas cada interrupção deve ser sinalizada no canal comunitário.",
    effect:{mercado_cinzento:2,helix:1},
    support:{label:"Equipe patrocinada: proteção de transmissão",armor:1}},
  },
 },
 periferia:{
  title:"Estrada de Socorro",
  purpose:"A estação de reserva, o posto de trânsito e os pontos de apoio precisam funcionar antes que caravanas e ambulâncias retornem.",
  completion:"O corredor de resgate ficou sinalizado e as caravanas podem atravessar sem rastreamento permanente.",
  finalOptions:{
   collective:{label:"Entregar a estrada às caravanas solidárias",
    outcome:"Batedores organizam salvamentos por necessidade e deixam apenas relatórios agregados de perigo.",
    effect:{movimento_livre:2,mercado_cinzento:1},
    support:{label:"Caravanas livres: rota rápida",movement:1}},
   audited:{label:"Registrar emergências com direito a contestação",
    outcome:"O conselho mantém horários e incidentes documentados sem guardar trajetos pessoais.",
    effect:{consorcio_civico:2,movimento_livre:1},
    support:{label:"Sinalização auditada: cobertura em marcha",armor:1}},
   contracted:{label:"Adotar escolta logística com prazo de expiração",
    outcome:"A rota recebe suprimentos, mas os dados de localização são descartados após a entrega.",
    effect:{helix:1,mercado_cinzento:2},
    support:{label:"Escolta comercial: reserva de energia",energy:2}},
  },
 },
};
export const RECOVERY_TASKS:Readonly<Record<CouncilId,readonly {
 room:ExpansionInnerId;machine:"sistema";title:string;detail:string;xp:number
}[]>>=Object.fromEntries(COUNCIL_IDS.map(region=>[
 region,EXPANSION_ROOM_DESIGNS.filter(room=>room.id.startsWith(region+"-"))
  .slice(0,3).map((room,index)=>({
    room:room.id,machine:"sistema" as const,title:room.machineTitle,
    detail:"RECONSTRUÇÃO "+(index+1)+"/3 · "+room.machineDetail,
    xp:24+index*3,
  })),
])) as unknown as Record<CouncilId,readonly {
 room:ExpansionInnerId;machine:"sistema";title:string;detail:string;xp:number
}[]>;
export function isRecoveryMethod(x:unknown):x is RecoveryMethod{
 return typeof x==="string"&&RECOVERY_METHODS.some(item=>item===x);
}
export function validateRecovery(input:unknown):input is RecoveryProgress{
 if(!input||typeof input!=="object"||Array.isArray(input))return false;
 const r=input as Record<string,unknown>;
 if(r.version!==1||Object.keys(r).some(k=>!["version","repairs","outcomes"].includes(k))||
  !r.repairs||typeof r.repairs!=="object"||Array.isArray(r.repairs)||
  !r.outcomes||typeof r.outcomes!=="object"||Array.isArray(r.outcomes))return false;
 const repairs=r.repairs as Record<string,unknown>;
 const outcomes=r.outcomes as Record<string,unknown>;
 if(Object.keys(repairs).length>7||Object.keys(outcomes).length>7)return false;
 for(const [region,rooms] of Object.entries(repairs)){
  if(!isCouncilId(region)||!Array.isArray(rooms)||rooms.length>3||
   new Set(rooms).size!==rooms.length||
   !rooms.every(room=>typeof room==="string"&&
    RECOVERY_TASKS[region].some(task=>task.room===room)))return false;
 }
 for(const [region,method] of Object.entries(outcomes))
  if(!isCouncilId(region)||!isRecoveryMethod(method)||
     !Array.isArray(repairs[region])||(repairs[region] as unknown[]).length!==3)
   return false;
 return true;
}
export function readRecovery(characterId:string):RecoveryProgress{
 if(!characterId)return {version:1,repairs:{},outcomes:{}};
 try{
  const raw=globalThis.localStorage?.getItem(RECOVERY_KEY+characterId);
  const decoded:unknown=raw?JSON.parse(raw):null;
  return validateRecovery(decoded)?decoded:{version:1,repairs:{},outcomes:{}};
 }catch{return {version:1,repairs:{},outcomes:{}};}
}
export function saveRecovery(characterId:string,state:RecoveryProgress):boolean{
 if(!characterId||!validateRecovery(state))return false;
 try{const db=globalThis.localStorage;if(!db)return false;
  db.setItem(RECOVERY_KEY+characterId,JSON.stringify(state));return true;
 }catch{return false;}
}
export function recoveryObjective(state:RecoveryProgress,councils:CouncilProgress,
 region:CouncilId):string{
 const plan=RECOVERY_LINES[region],done=state.repairs[region]??[];
 if(!councils.choices[region])return "O plano de obras depende da audiência e das quatro perícias independentes.";
 if(!(councils.defended??[]).includes(region))
  return "O conselho foi realizado. Defenda o acordo antes de iniciar a reconstrução.";
 if(state.outcomes[region]){
  const option=plan.finalOptions[state.outcomes[region]];
  return "RECONSTRUÇÃO CONCLUÍDA · "+plan.title+". "+option.outcome;
 }
 if(done.length===3)
  return "TRÊS MÁQUINAS RECUPERADAS · Volte ao contato local e escolha quem administrará "+
   "a infraestrutura. Essa decisão será permanente.";
 const pending=RECOVERY_TASKS[region].filter(task=>!done.includes(task.room));
 const next=pending[0]!;
 const scene=EXPANSION_ROOM_DESIGNS.find(room=>room.id===next.room)!;
 return "RECONSTRUÇÃO "+done.length+"/3 · "+plan.purpose+
  " Próximo sistema: "+scene.title+" — "+next.title+
  ". Interaja fisicamente com a máquina indicada no interior.";
}
export function repairRecoveryEquipment(state:RecoveryProgress,councils:CouncilProgress,
 room:ExpansionInnerId,propId:string):
 {ok:boolean;state:RecoveryProgress;message:string;xp:number}{
 const region=COUNCIL_IDS.find(id=>room.startsWith(id+"-"));
 if(!region||!(councils.defended??[]).includes(region))
  return {ok:false,state,message:"A reconstrução requer uma vitória na defesa do conselho.",xp:0};
 if(state.outcomes[region])return {ok:false,state,
  message:"O circuito já foi reconstruído e tem responsável definido.",xp:0};
 const task=RECOVERY_TASKS[region].find(entry=>entry.room===room&&entry.machine===propId);
 if(!task)return {ok:false,state,
  message:"Esta peça não integra o circuito de manutenção. Verifique o diário.",xp:0};
 const done=state.repairs[region]??[];
 if(done.includes(room))return {ok:false,state,
  message:"Este sistema já foi reparado. Procure outro dos três pontos de serviço.",xp:0};
 const next:RecoveryProgress={...state,repairs:{...state.repairs,[region]:[...done,room]}};
 return {ok:true,state:next,xp:task.xp,
  message:task.detail+" O sistema foi recuperado e as leituras preservadas. "+
   (done.length===2?"Os três serviços estão prontos. Procure o contato para decidir a gestão.":
    "A manutenção avança; faltam "+(2-done.length)+" sistemas físicos.")};
}
export function resolveRecovery(state:RecoveryProgress,councils:CouncilProgress,
 region:CouncilId,method:RecoveryMethod):
 {ok:boolean;state:RecoveryProgress;message:string;xp:number}{
 if(!isCouncilId(region)||!isRecoveryMethod(method)||
  !(councils.defended??[]).includes(region))return {ok:false,state,
    message:"Apenas um conselho defendido pode autorizar a gestão da rede.",xp:0};
 if(state.outcomes[region])return {ok:false,state,
  message:"A gestão desta infraestrutura já foi registrada. Não há XP duplicada.",xp:0};
 if((state.repairs[region]??[]).length!==3)return {ok:false,state,
   message:"Examine e recupere os três sistemas reais antes de concluir.",xp:0};
 return {ok:true,state:{...state,outcomes:{...state.outcomes,[region]:method}},
  message:RECOVERY_LINES[region].finalOptions[method].outcome, xp:78};
}
export function recoveryFactionEffects(state:RecoveryProgress):CouncilFactionDelta[]{
 return COUNCIL_IDS.flatMap(region=>{
  const method=state.outcomes[region];
  return method?[RECOVERY_LINES[region].finalOptions[method].effect]:[];
 });
}
/** Only post-completion operations receive this buff; legacy combat is
 * untouched. A regional battle uses a passive equipment supply perk and
 * may already have support earned from the 1.0 urban investigations. */
export function recoveryCombatSupport(state:RecoveryProgress,encounter:string):
 UrbanCombatSupport|null{
 const region=COUNCIL_IDS.find(id=>encounter==="district-"+id||
  encounter==="council-"+id);
 if(region){
  const method=state.outcomes[region];
  if(method)return RECOVERY_LINES[region].finalOptions[method].support;
 }
 // Completing three *different* local services unlocks a modest city-wide
 // reserve for subsequent missions; never stack seven entire district buffs.
 if(Object.keys(state.outcomes).length>=3)
  return {label:"Rede de reconstrução: suprimentos compartilhados",energy:1};
 return null;
}
/** Preserve the previous urban support. Battle constructor already accepts
 * one support object, so combine the two earned sources without overwriting. */
export function mergeRecoverySupport(a:UrbanCombatSupport|null,
 b:UrbanCombatSupport|null):UrbanCombatSupport|null{
 if(!a)return b;
 if(!b)return a;
 return {label:a.label+" · "+b.label,
  attack:(a.attack??0)+(b.attack??0),
  armor:(a.armor??0)+(b.armor??0),
  energy:(a.energy??0)+(b.energy??0),
  movement:(a.movement??0)+(b.movement??0)};
}
