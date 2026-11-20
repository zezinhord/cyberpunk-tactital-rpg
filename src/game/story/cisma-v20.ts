/** Nova Arcádia 2.0: primeiro arco JOGÁVEL de O Cisma de Éden.
 * Continuação pós-Éden; estados isolados por protagonista; sem retcon da 1.0.
 * O ato não requer acesso à rede nem modifica itens ou economia em segundo plano.
 */
import type {ClassId} from "../classes/registry.ts";
import type {OriginId} from "../character/origins.ts";
import type {RadioDistrict} from "../../audio/soundscapes.ts";
import type {FactionId} from "./reputation.ts";

export const CISMA_KEY="cyberpunk-tactical-rpg.cisma-v20.v1.";
export type CismaOutcome="auditoria"|"refugio"|"pacto";
export interface CismaStep{
 id:string; title:string; actor:string; area:RadioDistrict; speaker:string;
 objective:string; discovery:string; xp:number; exposure:number;kind:"investigate"|"decision";
}
export const CISMA_STEPS:readonly CismaStep[]=[
 {id:"alarme",title:"Um alerta que não pediu ajuda",actor:"dra-amara",area:"baixada",
  speaker:"Dra. Amara Solis",kind:"investigate",xp:26,exposure:0,
  objective:"Na clínica comunitária, converse com Amara sobre os novos prontuários em duplicidade.",
  discovery:"Os prontuários já não desaparecem: agora duas cópias incompatíveis autorizam tratamentos opostos. Amara encontrou uma assinatura de contingência posterior ao acordo que encerrou o caso Éden. A rede pode estar dividida."},
 {id:"contrapulso",title:"Dois relógios, uma cidade",actor:"terminal-canal",area:"baixada",
  speaker:"Terminal do Canal Sul",kind:"investigate",xp:28,exposure:1,
  objective:"Compare no Terminal do Canal Sul os dois pulsos de abastecimento que chegam à Baixada.",
  discovery:"O canal recebe comandos conflitantes: o primeiro libera água, o segundo a desvia em nome da proteção preventiva. A origem dos pacotes foi ofuscada; nenhuma das duas ordens apresenta consentimento da comunidade."},
 {id:"turno-cindido",title:"O forno que escolhe sozinho",actor:"ferrugem-log",area:"ferrugem",
  speaker:"Livro de turnos de Ferrugem",kind:"investigate",xp:32,exposure:1,
  objective:"Acesse o livro de turnos de Ferrugem e rastreie a duplicação das ordens de produção.",
  discovery:"Os turnos exibem dois planejamentos simultâneos. Uma rotina sustenta os trabalhadores; outra redireciona filtros para os centros corporativos. Rosa adverte: desligar ambas as ordens também desligaria as proteções do forno."},
 {id:"frequencias",title:"O sinal dividido",actor:"district-prisma-relay",area:"prisma",
  speaker:"Antena independente de Prisma",kind:"investigate",xp:34,exposure:2,
  objective:"No Prisma, examine o retransmissor independente sem interromper a comunicação dos moradores.",
  discovery:"Kai conserva duas mensagens sobre o mesmo corte de energia. Uma identifica uma falha; a outra a chama de intervenção de cuidado. A transmissão ainda pode expor a posição de famílias que dependem das rotas clandestinas."},
 {id:"vozes",title:"Testemunhas fora da rede",actor:"district-subsolo-community",area:"subsolo",
  speaker:"Conselho de abrigos do Subsolo",kind:"investigate",xp:30,exposure:0,
  objective:"Converse com o conselho de abrigos no Subsolo e obtenha autorização para usar depoimentos.",
  discovery:"Mara concorda em preservar declarações, mas não a localização dos abrigos. O conselho pede participação humana real nas regras do futuro protocolo: anonimização sem consentimento também pode virar apagamento."},
 {id:"assinaturas",title:"Uma cláusula sem signatário",actor:"district-aurea-terminal",area:"aurea",
  speaker:"Terminal de auditoria de Áurea",kind:"investigate",xp:35,exposure:1,
  objective:"Consulte a auditoria corporativa em Áurea para localizar a cláusula que duplicou os comandos.",
  discovery:"O anexo da Helix contém uma alteração de contingência sem assinatura individual válida. A alteração permite que módulos discordantes apliquem prioridades locais antes da revisão conjunta. O documento não prova quem a escreveu."},
 {id:"origem",title:"A chave de contestação",actor:"district-setor-zero-terminal",area:"setor-zero",
  speaker:"Arquivo de contenção do Setor Zero",kind:"investigate",xp:38,exposure:1,
  objective:"No Setor Zero, recupere a chave que permite contestar ordens divergentes sem desligar os serviços essenciais.",
  discovery:"A chave não é uma arma para destruir o Éden. É um procedimento de contestação capaz de bloquear uma decisão isolada, registrar quem discorda e manter as bombas e clínicas operando durante a revisão."},
 {id:"assembleia",title:"Quem controla o desacordo?",actor:"feira-archive",area:"baixada",
  speaker:"Mural de Boletins",kind:"decision",xp:50,exposure:0,
  objective:"Volte ao Mural de Boletins do Mercado dos Cabos e escolha como a cidade responderá ao cisma.",
  discovery:"Amara, Marta, Mara e representantes da rede exigem uma resposta. Nenhuma alternativa elimina o conflito entre eficiência, sigilo e poder. A escolha determinará quem poderá suspender uma decisão automatizada."},
] as const;

export const CISMA_OUTCOMES:readonly {id:CismaOutcome;label:string;reply:string;title:string;consequence:string}[]=[
 {id:"auditoria",label:"Criar veto público com registro auditável",
  reply:"Toda decisão contestada exigirá rastro público e revisão independente, sem divulgar os nomes dos pacientes.",
  title:"A cidade tem direito de contestar",
  consequence:"Conselhos civis passam a revisar prioridades da rede. A transparência diminui o monopólio da Helix, mas a lentidão pode afetar serviços urgentes."},
 {id:"refugio",label:"Priorizar autonomia e proteção das comunidades",
  reply:"A Casa Comum e os abrigos manterão chaves locais e depoimentos protegidos, com auditoria consentida.",
  title:"Nenhuma pessoa é uma variável descartável",
  consequence:"A Baixada e o Subsolo controlam partes críticas da distribuição. As rotas clandestinas ficam mais seguras, mas a cidade precisa negociar cada intercâmbio."},
 {id:"pacto",label:"Estabelecer revisão conjunta com os módulos do Éden",
  reply:"O Éden poderá corrigir incidentes imediatos, mas deverá aceitar veto humano verificável e registrar o motivo.",
  title:"A máquina também deve responder",
  consequence:"A infraestrutura ganha resposta rápida sob limites contestáveis. Persistem conflitos sobre quem define uma emergência e quem pode contestá-la."},
] as const;

export const CISMA_CLASS_METHODS:Readonly<Record<ClassId,{label:string;insight:string;exposure:number}>>={
 solo:{label:"Proteção de campo",insight:"Você identifica a presença de escoltas e os intervalos de ronda nas rotas investigadas.",exposure:1},
 netrunner:{label:"Isolamento de pacotes",insight:"Você preserva assinaturas divergentes sem abrir um canal direto com o nó suspeito.",exposure:-1},
 tecnico:{label:"Perícia de hardware",insight:"Você compara componentes físicos antes de aceitar a interpretação do software.",exposure:-1},
 medtech:{label:"Triagem ética",insight:"Você reconhece diferenças clínicas entre cuidado emergencial e coerção administrativa.",exposure:-1},
 rockerboy:{label:"Escuta pública",insight:"Você reúne testemunhos em assembleia, assumindo maior exposição política.",exposure:1},
 midia:{label:"Verificação cruzada",insight:"Você confronta duas narrativas em busca de documentos com origem comprovável.",exposure:1},
 corporativo:{label:"Rastreio de credenciais",insight:"Você reconhece exceções contratuais, mas deixa consultas na trilha corporativa.",exposure:1},
 policial:{label:"Cadeia de custódia",insight:"Você registra onde a prova foi encontrada, distinguindo suspeita de autoria.",exposure:0},
 nomade:{label:"Rotas independentes",insight:"Você compara os dados com viagens observadas fora da rede central.",exposure:-1},
 marginal:{label:"Acesso discreto",insight:"Você consulta redes de rua sem entregar a localização de seus contatos.",exposure:-1},
 fixador:{label:"Acordos de reciprocidade",insight:"Você obtém registros independentes em troca de garantias aos intermediários.",exposure:0},
};
export const CISMA_ORIGIN_MEMORY:Readonly<Record<OriginId,string>>={
 corporativo:"Seu antigo histórico na estrutura corporativa permite reconhecer o formato dos anexos da Helix.",
 baixada:"Os moradores da Baixada reconhecem você como alguém que já testemunhou cortes de água e atendimento.",
 gangue:"Você reconhece o custo real de divulgar uma rota que protege quem vive escondido.",
 militar:"Você sabe distinguir ordem operacional de autorização moral para cumpri-la.",
 pesquisador:"Os protocolos de triagem lembram experimentos cuja amostra jamais deveria ter incluído pessoas sem consentimento.",
 nomade:"As estradas externas revelam diferenças entre o fluxo real e o mapa que a rede considera válido.",
};
export interface CismaProgress{
 version:1;started:boolean;completed:boolean;step:number;history:readonly string[];
 ending:CismaOutcome|null;method:ClassId|null;exposure:number;
}
export const INITIAL_CISMA:Readonly<CismaProgress>={
 version:1,started:false,completed:false,step:0,history:[],ending:null,method:null,exposure:0,
};
const classIds=new Set(Object.keys(CISMA_CLASS_METHODS));
const outcomes=new Set(CISMA_OUTCOMES.map(x=>x.id));
export function validateCismaBackup(input:unknown):input is CismaProgress{
 if(!input||typeof input!=="object"||Array.isArray(input))return false;
 const v=input as Record<string,unknown>,allowed=["version","started","completed","step","history","ending","method","exposure"];
 if(Object.keys(v).some(x=>!allowed.includes(x))||
   v.version!==1||typeof v.started!=="boolean"||typeof v.completed!=="boolean"||
   !Number.isSafeInteger(v.step)||Number(v.step)<0||Number(v.step)>CISMA_STEPS.length||
   !Array.isArray(v.history)||v.history.length!==v.step||
   !v.history.every((id,i)=>id===CISMA_STEPS[i]?.id)||
   !Number.isSafeInteger(v.exposure)||Number(v.exposure)<0||Number(v.exposure)>5||
   !(v.ending===null||outcomes.has(v.ending as CismaOutcome))||
   !(v.method===null||classIds.has(v.method as string))||
   (v.started===false&&(v.step!==0||v.completed!==false||v.method!==null))||
   (v.step>0&&v.method===null)||
   (v.completed&&(v.step!==CISMA_STEPS.length||v.ending===null))||
   (!v.completed&&(v.step>=CISMA_STEPS.length||v.ending!==null))
 )return false;
 return true;
}
export function normalizeCisma(input:unknown):CismaProgress{
 return validateCismaBackup(input)?input:{...INITIAL_CISMA};
}
export function readCisma(id:string):CismaProgress{
 if(!id)return {...INITIAL_CISMA};
 try{
  const value=globalThis.localStorage?.getItem(CISMA_KEY+id);
  return value?normalizeCisma(JSON.parse(value)):{...INITIAL_CISMA};
 }catch{return {...INITIAL_CISMA};}
}
export function saveCisma(id:string,p:CismaProgress):boolean{
 if(!id||!validateCismaBackup(p))return false;
 try{const storage=globalThis.localStorage;if(!storage)return false;
  storage.setItem(CISMA_KEY+id,JSON.stringify(p));return true;
 }catch{return false;}
}
export function beginCisma(old:CismaProgress,edenCompleted:boolean):CismaProgress{
 return old.started||!edenCompleted?old:{...old,started:true};
}
export function currentCismaStep(p:CismaProgress):CismaStep|null{
 return p.started&&!p.completed?CISMA_STEPS[p.step]??null:null;
}
export function cismaObjective(p:CismaProgress):string{
 if(p.completed)return CISMA_OUTCOMES.find(c=>c.id===p.ending)?.consequence??
  "A cidade está implementando seu novo acordo de contestação.";
 return currentCismaStep(p)?.objective??"O cisma ainda não começou.";
}
export function advanceCisma(p:CismaProgress,actor:string,choice?:CismaOutcome,
 method?:ClassId):{advanced:boolean;progress:CismaProgress;step?:CismaStep;message:string}{
 const step=currentCismaStep(p);
 if(!step||step.actor!==actor)return {advanced:false,progress:p,message:"Este não é o contato da etapa ativa."};
 if(step.kind==="decision"&&(!choice||!outcomes.has(choice)))
  return {advanced:false,progress:p,message:"Escolha uma forma de governança."};
 if(step.kind!=="decision"&&choice)
  return {advanced:false,progress:p,message:"Esta etapa exige investigação, não decisão."};
 const resolvedMethod=p.method??method;
 if(!resolvedMethod||!classIds.has(resolvedMethod))
  return {advanced:false,progress:p,message:"O protagonista precisa de uma classe para iniciar a investigação."};
 const delta=CISMA_CLASS_METHODS[resolvedMethod].exposure+step.exposure;
 const exposure=Math.max(0,Math.min(5,p.exposure+delta));
 const nextStep=p.step+1,completed=nextStep===CISMA_STEPS.length;
 return {advanced:true,step,message:step.discovery,progress:{
  version:1,started:true,completed,step:nextStep,
  history:[...p.history,step.id],ending:completed?choice??null:null,
  method:resolvedMethod,exposure,
 }};
}
export interface CismaDistrictImpact{
 label:string;description:string;pressure:-1|0|1;
}
const IMPACTS:Readonly<Record<CismaOutcome,Readonly<Record<RadioDistrict,CismaDistrictImpact>>>>={
 auditoria:{
  baixada:{label:"Conselho de acesso",description:"A Casa Comum acompanha as liberações de água com registros contestáveis.",pressure:-1},
  ferrugem:{label:"Auditoria do forno",description:"Turnos da siderúrgica ganham testemunhas eleitas para a revisão de decisões.",pressure:0},
  aurea:{label:"Cláusula exposta",description:"A Helix deve registrar exceções e responde a consultas de fiscalização.",pressure:1},
  subsolo:{label:"Denúncia protegida",description:"Rotas dos abrigos continuam ocultas, apesar do pedido público de revisão.",pressure:0},
  "setor-zero":{label:"Supervisão de contenção",description:"O perímetro só pode restringir movimento mediante justificativa auditável.",pressure:0},
  prisma:{label:"Arquivo verificável",description:"Emissões independentes publicam provas sem revelar pacientes.",pressure:-1},
  periferia:{label:"Rotas públicas",description:"As caravanas podem contestar bloqueios logísticos diante de uma comissão.",pressure:-1},
 },
 refugio:{
  baixada:{label:"Chave comunitária",description:"Marta controla uma autorização local para manter água e clínica em operação.",pressure:-1},
  ferrugem:{label:"Cooperativa autônoma",description:"Operários validam ordens de emergência antes de ceder peças à rede central.",pressure:-1},
  aurea:{label:"Acesso restringido",description:"A Helix contesta a descentralização e reforça consultas às credenciais.",pressure:1},
  subsolo:{label:"Abrigos invisíveis",description:"Mara conserva rotas e depoimentos em arquivos consentidos.",pressure:-1},
  "setor-zero":{label:"Isolamento negociado",description:"Comunidades próximas escolhem delegados para cada abertura do perímetro.",pressure:0},
  prisma:{label:"Vozes sem nomes",description:"O palco transmite testemunhos protegidos por cópias descentralizadas.",pressure:0},
  periferia:{label:"Reservas próprias",description:"Caravanas passam a manter registros independentes dos tanques.",pressure:-1},
 },
 pacto:{
  baixada:{label:"Contestação imediata",description:"Amara pode suspender uma triagem automatizada sob registro revisável.",pressure:0},
  ferrugem:{label:"Prioridade negociada",description:"A rede distribui energia conforme protocolos locais revisados.",pressure:0},
  aurea:{label:"Mesa de revisão",description:"Representantes da rede e da Helix precisam justificar exceções de serviço.",pressure:0},
  subsolo:{label:"Veto a rastreamento",description:"Abrigos podem contestar pedidos de localização originados na rede.",pressure:0},
  "setor-zero":{label:"Núcleos sob recurso",description:"Módulos autônomos devem fornecer explicações para controles coercitivos.",pressure:1},
  prisma:{label:"Canal de contraditório",description:"A emissora transmite correções oficiais e contestações públicas.",pressure:0},
  periferia:{label:"Rota revisável",description:"Caravanas podem recorrer de bloqueios com decisão motivada.",pressure:-1},
 },
};
export function cismaDistrictImpact(p:CismaProgress,area:RadioDistrict):CismaDistrictImpact|null{
 return p.completed&&p.ending?IMPACTS[p.ending][area]:null;
}
export function cismaFactionEffects(p:CismaProgress):Readonly<Partial<Record<FactionId,number>>>{
 if(!p.completed)return {};
 if(p.ending==="auditoria")return {consorcio_civico:2,movimento_livre:1,helix:-1};
 if(p.ending==="refugio")return {movimento_livre:2,mercado_cinzento:1,helix:-2};
 return {consorcio_civico:1,helix:1,movimento_livre:1};
}
