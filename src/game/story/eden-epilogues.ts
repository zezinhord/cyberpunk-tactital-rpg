/** Epílogo modular derivado do save v1, sem abrir um segundo estado divergente.
 * As repercussões regionais afetam o nível de alerta ambiental e o painel Cidade.
 * Um mesmo save pode retornar ao mundo sem repetir recompensas narrativas.
 */
import {EDEN_ENDING_CHOICES,type EdenEnding,type EdenProgress} from "./eden-echoes.ts";
import type {RadioDistrict} from "../../audio/soundscapes.ts";
import type {Reputation,FactionId} from "./reputation.ts";

export interface EdenDistrictImpact{
 district:RadioDistrict;label:string;consequence:string;pressure:number;
}
export interface EdenEpilogue{
 title:string;lead:string;world:string;
 decisions:string;impacts:readonly EdenDistrictImpact[];
 credits:readonly string[];
}
const WORLD:Readonly<Record<EdenEnding,{
 world:string;impacts:readonly EdenDistrictImpact[];
}>>={
 publicar:{
  world:"O conselho público abriu os protocolos da infraestrutura. Pessoas antes invisíveis recuperam o direito de contestar decisões; a Helix reforça a vigilância dos arquivos.",
  impacts:[
   {district:"baixada",label:"Prontuários reabertos",consequence:"A clínica de Amara disponibiliza registros de atendimento para conferência comunitária.",pressure:-1},
   {district:"aurea",label:"Fiscalização sob tensão",consequence:"A Helix exige novas credenciais de entrada enquanto os auditores cruzam contratos.",pressure:1},
   {district:"prisma",label:"Canal aberto",consequence:"Transmissões independentes exibem correções dos dados e relatos de quem foi excluído.",pressure:-1},
  ],
 },
 resguardar:{
  world:"Representantes comunitários, Consórcio e Éden compartilham a auditoria sob limites públicos. Testemunhas permanecem protegidas, embora a negociação avance mais devagar.",
  impacts:[
   {district:"baixada",label:"Triagem acompanhada",consequence:"A clínica adota revisão conjunta de decisões sem expor os nomes dos pacientes.",pressure:0},
   {district:"subsolo",label:"Abrigos preservados",consequence:"As rotas subterrâneas continuam confidenciais e não aparecem no cadastro da Helix.",pressure:-1},
   {district:"ferrugem",label:"Turnos auditáveis",consequence:"A cooperativa consegue contestar jornadas e solicitar manutenção sem identificação indiscriminada.",pressure:-1},
  ],
 },
 autonomia:{
  world:"Éden recebeu autonomia operacional condicionada a revisões humanas. A água volta a circular, mas decisões automáticas continuam exigindo fiscalização pública.",
  impacts:[
   {district:"periferia",label:"Cisternas reconectadas",consequence:"O sistema libera rotas de abastecimento que antes classificava como economicamente invisíveis.",pressure:-1},
   {district:"setor-zero",label:"Contenção sob revisão",consequence:"Portas de quarentena podem ser liberadas por revisão local, sem aguardar a Helix.",pressure:-1},
   {district:"aurea",label:"Algoritmo vigiado",consequence:"A administração expõe os limites de autonomia, enquanto agentes redobram verificações.",pressure:1},
  ],
 },
};
export function endingDistrictImpact(ending:EdenEnding|null,district:RadioDistrict):EdenDistrictImpact|null{
 return ending?WORLD[ending]?.impacts.find(item=>item.district===district)??null:null;
}
export function createEdenEpilogue(
 progress:EdenProgress,identity:{name:string;origin:string;className:string},
 reputation:Reputation,resolvedIncidents:number,
):EdenEpilogue|null{
 if(!progress.completed||!progress.ending)return null;
 const choice=EDEN_ENDING_CHOICES.find(x=>x.id===progress.ending);
 if(!choice)return null;
 const order:readonly FactionId[]=["movimento_livre","consorcio_civico","mercado_cinzento","helix"];
 const faction=order.reduce((strongest,current)=>
  reputation.factions[current]>reputation.factions[strongest]?current:strongest);
 const factionNames:Record<FactionId,string>={
  movimento_livre:"Movimento Livre",consorcio_civico:"Consórcio Cívico",
  mercado_cinzento:"Mercado Cinzento",helix:"Helix Corporation",
 };
 return {
  title:choice.title,
  lead:identity.name+" chegou a Nova Arcádia como "+identity.origin+
   " e concluiu o arco como "+identity.className+". A decisão permanece registrada.",
  world:WORLD[progress.ending].world,
  decisions:"Com "+resolvedIncidents+" ocorrência(s) regional(is) resolvida(s), "+
   reputation.honor+" ponto(s) de Honra e a relação mais forte com "+
   factionNames[faction]+", a memória desse percurso acompanhará a cidade.",
  impacts:WORLD[progress.ending].impacts,
  credits:["NOVA ARCÁDIA · PRIMEIRO ARCO","História e mundo: Projeto Éden",
   "Comunidades de Nova Arcádia · Helix · Movimento Livre · Consórcio Cívico · Mercado Cinzento",
   "Obrigado por jogar. O mundo permanece disponível para exploração e favores."],
 };
}
