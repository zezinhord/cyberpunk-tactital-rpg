/** Nova Arcádia 2.0 — Atos II, III e IV.
 * Cada etapa exige interação física com um ator já existente. Confrontos
 * só avançam quando o TurnManager confirma TODAS as ondas vencidas.
 * O save é isolado dos oito marcos do Ato I para preservar backups QA 2.0 RC1.
 */
import type {CismaOutcome,CismaProgress} from "./cisma-v20.ts";
import type {EncounterId} from "../types.ts";
import type {RadioDistrict} from "../../audio/soundscapes.ts";
import type {FactionId} from "./reputation.ts";

export const OPERATIONS_KEY="cyberpunk-tactical-rpg.cisma-operations.v1.";
export type OperationsEnding="assembleia"|"mediacao"|"ruptura";
export type OperationsEncounter=Extract<EncounterId,"cisma-intercept"|"cisma-containment"|"cisma-core">;
export interface OperationsStage{
 readonly id:string;readonly act:2|3|4;readonly area:RadioDistrict;
 readonly actor:string;readonly title:string;readonly objective:string;
 readonly speaker:string;readonly message:string;readonly xp:number;
 readonly kind:"interact"|"combat"|"decision";readonly encounter?:OperationsEncounter;
}
export const OPERATIONS_STAGES:readonly OperationsStage[]=[
 {id:"cinzas",act:2,area:"ferrugem",actor:"ferrugem-foreman",title:"O preço do segundo turno",
  objective:"Retorne a Rosa na siderúrgica de Ferrugem e conheça o preço do conflito entre os módulos.",
  speaker:"Rosa",xp:30,kind:"interact",
  message:"O forno recebeu duas ordens de proteção: preservar a produção ou preservar quem trabalha nele. Rosa exige que qualquer decisão inclua salários e filtros de ar. Ela lhe entrega os horários para confrontar com o contrato da Helix."},
 {id:"filtros",act:2,area:"ferrugem",actor:"ferrugem-cabinet",title:"Uma cidade respira pelos filtros",
  objective:"Examine o quadro elétrico da Ferrugem e registre quem recebeu os filtros desviados.",
  speaker:"Quadro de força industrial",xp:32,kind:"interact",
  message:"Um módulo de emergência envia filtros para Áurea, enquanto a rotina de manutenção protege as casas de Ferrugem. Nenhuma ordem registra os nomes dos moradores afetados. O balanço energético permite manter o forno e a filtragem apenas se forem renegociadas as prioridades."},
 {id:"celina",act:2,area:"aurea",actor:"district-aurea-guide",title:"O contrato que não tem dono",
  objective:"Encontre Celina em Áurea e peça a cláusula de contingência original.",
  speaker:"Celina",xp:34,kind:"interact",
  message:"Celina reconhece assinaturas legais sobrepostas, mas nenhuma pessoa física assina o último aditivo. Helena Voss aparece como gestora de uma revisão anterior: isso a torna uma testemunha potencial, não prova sua autoria no cisma."},
 {id:"anexo",act:2,area:"aurea",actor:"district-aurea-specialist",title:"Responsabilidade em branco",
  objective:"Converse com o operador técnico da torre sobre a revisão de acesso.",
  speaker:"Operador técnico de Áurea",xp:32,kind:"interact",
  message:"Uma credencial temporária ativou a rotina de contingência durante um apagão. Os logs poderiam ter sido alterados por uma pessoa, por um agente autorizado ou por uma restauração automatizada. A investigação preserva três hipóteses, sem acusação arbitrária."},
 {id:"mara",act:2,area:"subsolo",actor:"district-subsolo-guide",title:"Quem pode negar consentimento",
  objective:"Procure Mara no Subsolo e negocie limites para a circulação de dados dos abrigos.",
  speaker:"Mara",xp:36,kind:"interact",
  message:"Mara aceita testemunhar sob condição: nenhum sinal de emergência poderá funcionar como rastreador permanente de moradores. Ela fornece um mapa somente de saídas, sem indicar entradas de abrigo, e pede ao protagonista que preserve essa diferença."},
 {id:"escuta",act:2,area:"subsolo",actor:"district-subsolo-relay",title:"Rastreamento disfarçado de cuidado",
  objective:"Investigue o repetidor subterrâneo e isole a coleta indevida de localização.",
  speaker:"Repetidor do Subsolo",xp:38,kind:"interact",
  message:"A escuta clandestina vinculava alertas médicos à posição dos abrigos. O protagonista corta apenas o canal de localização, conservando o alerta respiratório. Um pacote de verificação aponta para Prisma, onde o sinal foi retransmitido."},
 {id:"kai",act:2,area:"prisma",actor:"district-prisma-specialist",title:"O direito de falar",
  objective:"Ouça o técnico independente do Prisma sobre a transmissão dos dois módulos.",
  speaker:"Técnico de Prisma",xp:38,kind:"interact",
  message:"Kai e o estúdio confirmam que uma das mensagens da rede foi interrompida por interferência hostil. Ele preparou um canal de contraditório: dados de pacientes não serão transmitidos, mas a assinatura de cada decisão poderá ser contestada."},
 {id:"interceptacao",act:2,area:"prisma",actor:"district-prisma-relay",title:"O ruído de quem manda",
  objective:"Defenda o retransmissor do Prisma contra duas ondas de interceptadores e sabotadores.",
  speaker:"Antena livre de Prisma",xp:55,kind:"combat",encounter:"cisma-intercept",
  message:"Após duas ondas de inimigos com funções distintas, o transmissor fica sob controle civil e o pacote de auditoria segue para a Periferia. Nenhuma recompensa é concedida antes de confirmar a vitória integral."},
 {id:"dara",act:2,area:"periferia",actor:"district-periferia-guide",title:"Os que vivem fora do mapa",
  objective:"Converse com Dara na Periferia sobre as caravanas bloqueadas pelos dois protocolos.",
  speaker:"Dara",xp:36,kind:"interact",
  message:"A estrada foi apagada da prioridade logística, mas continua sob manutenção. Dara quer uma garantia objetiva: recursos vitais não poderão ser desviados apenas porque o destino não tem endereço fixo."},
 {id:"tanques",act:2,area:"periferia",actor:"district-periferia-cache",title:"Reserva de quem nunca foi contado",
  objective:"Inspecione o depósito de água da Periferia e registre a carga antes que alguém a apreenda.",
  speaker:"Depósito da Periferia",xp:40,kind:"interact",
  message:"Os tanques estão lacrados, cheios e desviados por uma decisão aparentemente racional. Os registros permitem comprovar o erro sem abrir o depósito ao saque. A rota real da água conduz à quarentena do Setor Zero."},
 {id:"iuri",act:3,area:"setor-zero",actor:"district-setor-zero-guide",title:"O perímetro sem ordem",
  objective:"Encontre Iuri na entrada do Setor Zero e planeje uma intervenção que preserve os pacientes.",
  speaker:"Iuri",xp:40,kind:"interact",
  message:"Iuri descreve dois sistemas de defesa independentes: contenção física e revisão de prioridade. Derrubar ambos desligaria o atendimento isolado. O plano é desativar os agentes de coerção e manter o fornecimento médico."},
 {id:"testemunhas",act:3,area:"setor-zero",actor:"district-setor-zero-community",title:"As pessoas antes das métricas",
  objective:"Converse com os sobreviventes do Setor Zero e confirme os limites éticos da operação.",
  speaker:"Conselho de sobreviventes",xp:42,kind:"interact",
  message:"O conselho recusa repetir a quarentena imposta. Autoriza uma intervenção limitada, fiscalizada por representantes locais, com o compromisso de registrar cada porta fechada e preservar os prontuários individuais."},
 {id:"lacres",act:3,area:"setor-zero",actor:"district-setor-zero-cache",title:"O lacre que abre por dentro",
  objective:"Inspecione o módulo de contenção e recupere o selo de contestação.",
  speaker:"Arquivo de contenção",xp:45,kind:"interact",
  message:"Uma cópia física preserva o comando de veto que existia antes da atualização. Ela permite isolar a defesa armada sem revogar o funcionamento dos aparelhos respiratórios."},
 {id:"fase-a",act:3,area:"setor-zero",actor:"district-setor-zero-relay",title:"Clímax, fase I — Contenção",
  objective:"Vença os agentes de contenção do Setor Zero em duas ondas táticas.",
  speaker:"Sistema de Contenção",xp:65,kind:"combat",encounter:"cisma-containment",
  message:"A contenção tenta impedir acesso ao núcleo. Vencer libera o primeiro controle de segurança, mantendo intacta a energia dos leitos. O inimigo alterna unidades de escolta e de aproximação."},
 {id:"reconfigurar",act:3,area:"setor-zero",actor:"district-setor-zero-terminal",title:"Entre desligar e responder",
  objective:"No terminal do Setor Zero, utilize o selo para permitir uma contestação sem apagar os arquivos.",
  speaker:"Terminal de contestação",xp:50,kind:"interact",
  message:"O veto limita a coerção. Éden responde com duas recomendações incompatíveis e, pela primeira vez, solicita uma decisão que considere não apenas o sofrimento mensurado, mas quem arca com os riscos. O módulo central permanece protegido por outra unidade."},
 {id:"fase-b",act:3,area:"setor-zero",actor:"district-setor-zero-relay",title:"Clímax, fase II — Núcleo autônomo",
  objective:"Volte ao repetidor do Setor Zero e vença as três ondas do guardião central.",
  speaker:"Núcleo de Éden",xp:85,kind:"combat",encounter:"cisma-core",
  message:"A defesa autônoma alterna supressão, sabotagem e ataque de precisão. Depois de todas as ondas, a chave do núcleo é recolhida sem destruir a rede de água ou a clínica. Éden reconhece a possibilidade de revisão humana."},
 {id:"relatorio",act:3,area:"setor-zero",actor:"district-setor-zero-community",title:"O custo de sobreviver",
  objective:"Retorne ao conselho de sobreviventes e explique a operação e os limites do acordo.",
  speaker:"Conselho de sobreviventes",xp:50,kind:"interact",
  message:"Os sobreviventes aprovam a restauração parcial, mas exigem auditoria da operação, inclusive dos danos provocados pelo protagonista. O arquivo fica nas mãos de duas testemunhas e um representante da clínica."},
 {id:"abrigo",act:4,area:"subsolo",actor:"district-subsolo-community",title:"Ninguém precisa entregar sua casa",
  objective:"Informe o conselho de abrigos sobre o mecanismo de contestação recuperado.",
  speaker:"Conselho do Subsolo",xp:40,kind:"interact",
  message:"Mara exige que o futuro acordo impeça transformar pedidos de ajuda em mapas de perseguição. Moradores escolhem quais dados podem compartilhar e quais serão apagados por decisão própria."},
 {id:"transmissao",act:4,area:"prisma",actor:"district-prisma-guide",title:"O sinal depois do silêncio",
  objective:"Encontre Kai no Prisma e prepare uma audiência pública sem expor os pacientes.",
  speaker:"Kai",xp:40,kind:"interact",
  message:"Kai oferece ao público as três propostas e separa os relatórios verificáveis dos nomes de testemunhas. A transmissão não altera o conteúdo para conquistar audiência; a verdade precisa sobreviver ao espetáculo."},
 {id:"operarios",act:4,area:"ferrugem",actor:"ferrugem-shelter",title:"O direito de desligar uma máquina",
  objective:"Converse com os trabalhadores no posto comunitário da Ferrugem.",
  speaker:"Assembleia de Ferrugem",xp:42,kind:"interact",
  message:"Rosa confirma que nenhuma regra de segurança deve impedir uma pessoa de escapar de um turno perigoso. A proposta passa a exigir uma autoridade local para interromper a produção quando houver risco imediato."},
 {id:"marta",act:4,area:"baixada",actor:"feira-ajuda",title:"Uma cidade não é uma planilha",
  objective:"Encontre Marta no Mercado dos Cabos e reúna o compromisso de proteção aos moradores.",
  speaker:"Marta",xp:44,kind:"interact",
  message:"Marta explica que o acordo será medido por acesso à água e cuidado, não só por índices da rede. Qualquer governança precisa oferecer recurso gratuito aos moradores excluídos, sem exigir credencial Helix."},
 {id:"amara",act:4,area:"baixada",actor:"dra-amara",title:"Os nomes que voltaram",
  objective:"Retorne à Dra. Amara e confira os prontuários liberados pela investigação.",
  speaker:"Dra. Amara Solis",xp:46,kind:"interact",
  message:"Amara cruza os arquivos originais com os testemunhos de V-09. As pessoas não voltam a existir porque um terminal corrigiu os dados; elas sempre existiram. A clínica reconhece esse fato e abre o acompanhamento."},
 {id:"destino",act:4,area:"baixada",actor:"feira-archive",title:"A última palavra pertence a quem?",
  objective:"No Mural de Boletins, aprove a decisão final sobre os direitos de contestação.",
  speaker:"Assembleia de Nova Arcádia",xp:90,kind:"decision",
  message:"A cidade recuperou meios de fiscalizar o Éden sem destruí-lo. Três pactos são possíveis: assembleia permanente, mediação interinstitucional ou ruptura com a administração central. Nenhum elimina a necessidade de cuidado."},
] as const;

export const OPERATIONS_ENDINGS:readonly {id:OperationsEnding;label:string;reply:string;title:string;world:string}[]=[
 {id:"assembleia",label:"Conselhos eleitos com poder de veto vinculante",
  reply:"A comunidade terá voz e poderá suspender toda decisão automática que lhe tire direitos.",
  title:"A cidade que escolhe",world:"Conselhos comunitários obtêm veto sobre triagem, abastecimento e contenção. Helix perde autonomia contratual, enquanto a infraestrutura precisa adaptar-se a auditorias frequentes."},
 {id:"mediacao",label:"Mediação técnica, civil e comunitária",
  reply:"Nenhuma emergência substituirá a revisão independente, e nenhuma revisão apagará a urgência de quem precisa de ajuda.",
  title:"A negociação sem silêncio",world:"A cidade forma instâncias de mediação com decisões motivadas, recursos rápidos e proteção de dados. A solução mantém a rede operacional, mas exige fiscalização constante."},
 {id:"ruptura",label:"Distribuir as chaves e descentralizar os serviços",
  reply:"Água, saúde e abrigo deixam de depender de uma autorização central. Os distritos assumirão responsabilidade compartilhada.",
  title:"Sete bairros, muitas vozes",world:"Cada distrito administra chaves locais sob protocolos de interoperabilidade. A autonomia dificulta a coerção central, mas torna a cooperação indispensável durante uma crise."},
] as const;
export interface OperationsProgress{
 version:1;started:boolean;completed:boolean;step:number;history:readonly string[];
 ending:OperationsEnding|null;precedent:CismaOutcome|null;
}
export const INITIAL_OPERATIONS:Readonly<OperationsProgress>={
 version:1,started:false,completed:false,step:0,history:[],ending:null,precedent:null,
};
const validPrecedent=new Set<CismaOutcome>(["auditoria","refugio","pacto"]);
const validEnding=new Set(OPERATIONS_ENDINGS.map(x=>x.id));
export function validOperationsBackup(raw:unknown):raw is OperationsProgress{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const x=raw as Record<string,unknown>;
 if(Object.keys(x).some(k=>!["version","started","completed","step","history","ending","precedent"].includes(k))||
 x.version!==1||typeof x.started!=="boolean"||typeof x.completed!=="boolean"||
 !Number.isSafeInteger(x.step)||Number(x.step)<0||Number(x.step)>OPERATIONS_STAGES.length||
 !Array.isArray(x.history)||x.history.length!==x.step||
 !x.history.every((id,i)=>id===OPERATIONS_STAGES[i]?.id)||
 !(x.ending===null||validEnding.has(x.ending as OperationsEnding))||
 !(x.precedent===null||validPrecedent.has(x.precedent as CismaOutcome))||
 (x.started&&x.precedent===null)||
 (!x.started&&(x.step!==0||x.precedent!==null||x.completed!==false))||
 (x.completed&&(x.step!==OPERATIONS_STAGES.length||x.ending===null))||
 (!x.completed&&(x.step>=OPERATIONS_STAGES.length||x.ending!==null)))return false;
 return true;
}
export function readOperations(id:string):OperationsProgress{
 if(!id)return {...INITIAL_OPERATIONS};
 try{const raw=globalThis.localStorage?.getItem(OPERATIONS_KEY+id);
  const value:unknown=raw?JSON.parse(raw):null;
  return validOperationsBackup(value)?value:{...INITIAL_OPERATIONS};
 }catch{return {...INITIAL_OPERATIONS};}
}
export function saveOperations(id:string,p:OperationsProgress):boolean{
 if(!id||!validOperationsBackup(p))return false;
 try{const storage=globalThis.localStorage;if(!storage)return false;
  storage.setItem(OPERATIONS_KEY+id,JSON.stringify(p));return true;
 }catch{return false;}
}
export function startOperations(current:OperationsProgress,cisma:CismaProgress):OperationsProgress{
 if(current.started||!cisma.completed||!cisma.ending)return current;
 return {...INITIAL_OPERATIONS,started:true,precedent:cisma.ending};
}
export function currentOperation(p:OperationsProgress):OperationsStage|null{
 return p.started&&!p.completed?OPERATIONS_STAGES[p.step]??null:null;
}
export function operationsObjective(p:OperationsProgress):string{
 if(p.completed)return OPERATIONS_ENDINGS.find(x=>x.id===p.ending)?.world??"A cidade voltou a decidir.";
 return currentOperation(p)?.objective??"Conclua O Cisma de Éden, Ato I, para iniciar as operações.";
}
export function advanceOperation(p:OperationsProgress,actor:string,ending?:OperationsEnding,
 encounter?:OperationsEncounter):
 {advanced:boolean;progress:OperationsProgress;stage?:OperationsStage;message:string}{
 const stage=currentOperation(p);
 if(!stage||stage.actor!==actor)return {advanced:false,progress:p,message:"O local não corresponde à operação ativa."};
 if(stage.kind==="combat"&&stage.encounter!==encounter)
  return {advanced:false,progress:p,message:"Vença o confronto completo antes de recuperar esta evidência."};
 if(stage.kind!=="combat"&&encounter)
  return {advanced:false,progress:p,message:"Esta etapa não aceita um relatório de combate."};
 if(stage.kind==="decision"&&(!ending||!validEnding.has(ending)))
  return {advanced:false,progress:p,message:"O acordo final ainda não foi decidido."};
 if(stage.kind!=="decision"&&ending)
  return {advanced:false,progress:p,message:"Esta etapa não aceita decisão final."};
 const next=p.step+1,completed=next===OPERATIONS_STAGES.length;
 return {advanced:true,stage,progress:{
  ...p,step:next,history:[...p.history,stage.id],completed,
  ending:completed?ending??null:null,
 },message:stage.message};
}
export function advanceOperationBattle(p:OperationsProgress,encounter:OperationsEncounter){
 const step=currentOperation(p);
 return step?.kind==="combat"&&step.encounter===encounter?
  advanceOperation(p,step.actor,undefined,encounter):
  {advanced:false,progress:p,message:"Nenhum confronto das operações aguarda conclusão."};
}
export const OPERATIONS_COMBAT_IDS:readonly OperationsEncounter[]=[
 "cisma-intercept","cisma-containment","cisma-core",
];
export function isOperationsCombat(id:string):id is OperationsEncounter{
 return OPERATIONS_COMBAT_IDS.some(x=>x===id);
}
export function operationsFactionDelta(p:OperationsProgress):
 Readonly<Partial<Record<FactionId,number>>>{
 if(!p.completed)return {};
 return p.ending==="assembleia"?{movimento_livre:2,consorcio_civico:1,helix:-2}
 :p.ending==="mediacao"?{consorcio_civico:2,helix:1,movimento_livre:1}
 :{movimento_livre:2,mercado_cinzento:1,helix:-2};
}
export function operationsAreaStatus(p:OperationsProgress,area:RadioDistrict):
 {title:string;message:string;pressure:-1|0|1}|null{
 if(!p.completed||!p.ending)return null;
 const base:Record<RadioDistrict,string>={
  baixada:"Clínica e abastecimento",ferrugem:"Segurança do trabalho",
  aurea:"Contratos da Helix",subsolo:"Rotas dos abrigos",
  "setor-zero":"Controle da contenção",prisma:"Canal de testemunhos",
  periferia:"Abastecimento de caravanas",
 };
 const mode=p.ending==="assembleia"?"Conselhos eleitos podem vetar o protocolo local."
  :p.ending==="mediacao"?"Mediadores civis e técnicos revisam decisões emergenciais."
  :"Chaves comunitárias permitem contestar a administração central.";
 return {title:base[area],message:mode+" "+base[area]+" permanece sob acompanhamento.",
  pressure:p.ending==="ruptura"&&area==="aurea"?1:
    p.ending==="assembleia"&&area==="aurea"?1:
    area==="baixada"||area==="periferia"?-1:0};
}
