/** Incidentes regionais: cada área possui escolhas únicas, consequências de
 * facções e XP concedido UMA única vez pelo sistema de recompensas existente.
 * O capítulo de cada território abre uma ocorrência por vez, sem despejar
 * dezenas de tarefas no HUD. O backup v1 permanece retrocompatível. */
import type {FactionId} from "./reputation.ts";
import type {RadioDistrict} from "../../audio/soundscapes.ts";

export const URBAN_KEY="cyberpunk-tactical-rpg.urban-cases.v1.";
export type UrbanChoiceId="a"|"b";
export type UrbanDelta=Readonly<Partial<Record<FactionId,number>>>;
export interface UrbanChoice{
 id:UrbanChoiceId;label:string;result:string;factions:UrbanDelta;pressure:number;
}
export interface UrbanCase{
 id:string;district:RadioDistrict;contact:string;title:string;
 situation:string;xp:number;choices:readonly [UrbanChoice,UrbanChoice];
}
export interface UrbanState{
 version:1;choices:Readonly<Record<string,UrbanChoiceId>>;evidence?:readonly string[];
}
export const INITIAL_URBAN:UrbanState={version:1,choices:{}};
const choice=(id:UrbanChoiceId,label:string,result:string,
 factions:UrbanDelta,pressure:number):UrbanChoice=>({id,label,result,factions,pressure});
function incident(district:RadioDistrict,id:string,contact:string,title:string,
 situation:string,xp:number,al:string,ar:string,ad:UrbanDelta,ap:number,
 bl:string,br:string,bd:UrbanDelta,bp:number):UrbanCase{
 return {district,id,contact,title,situation,xp,
  choices:[choice("a",al,ar,ad,ap),choice("b",bl,br,bd,bp)]};
}
export const URBAN_CASES:readonly UrbanCase[]=[
 incident("baixada","ba-agua","Marta","A última caixa-d'água",
  "A Casa Comum recebeu uma lista automática de famílias excluídas do abastecimento.",28,
  "Distribuir água fora da lista","Os moradores abrem uma cisterna coletiva e protegem os nomes das famílias.",{movimento_livre:2,helix:-1},-1,
  "Exigir fiscalização registrada","O Consórcio aceita a vistoria, mas solicita identificação de todos os beneficiários.",{consorcio_civico:2,movimento_livre:-1},1),
 incident("baixada","ba-vigilancia","Joana","Olhos sobre os varais",
  "Sensores instalados na passarela registram quem visita as casas à noite.",30,
  "Desativar os sensores com a cooperativa","A vigilância diminui; Joana coordena os turnos de observação comunitária.",{movimento_livre:2,helix:-2},-1,
  "Manter as câmeras sob controle local","Moradores assumem os registros para detectar extorsões sem entregar dados à Helix.",{consorcio_civico:1,movimento_livre:1},0),
 incident("baixada","ba-clinica","Dra. Amara","Os prontuários desaparecidos",
  "Uma rotina de Éden expurgou registros de pacientes sem justificativa clínica.",34,
  "Recuperar cópias para as famílias","Amara devolve aos pacientes o direito de consultar sua própria história.",{movimento_livre:2,helix:-1},-1,
  "Formalizar auditoria da triagem","A documentação recuperada força revisão administrativa da política de cuidado.",{consorcio_civico:2,helix:-1},1),

 incident("ferrugem","fe-fornos","Ramon","O forno sem turno",
  "A siderúrgica exige mais produção e registra trabalhadores como manutenção automática.",30,
  "Paralisar e auditar as escalas","A cooperativa descobre horas trabalhadas e obtém provas de jornadas ocultas.",{movimento_livre:2,helix:-1},1,
  "Renegociar o funcionamento","Uma redução emergencial evita demissões, mas preserva o registro corporativo.",{consorcio_civico:1,helix:1},-1),
 incident("ferrugem","fe-filtros","Rosa","A nuvem sobre as casas",
  "Filtros industriais desviados elevam o índice de partículas perto do bairro.",34,
  "Entregar filtros à comunidade","Trabalhadores restauram a proteção dos telhados e isolam o vazamento.",{movimento_livre:2,mercado_cinzento:1},-1,
  "Garantir reposição por contrato","O Consórcio impõe fornecimento verificável em troca de relatórios centralizados.",{consorcio_civico:2,helix:1},0),
 incident("ferrugem","fe-sindicato","Ramon","A assembleia interrompida",
  "Um sistema automático declarou ilegal a votação de representantes das oficinas.",38,
  "Restabelecer a votação independente","O conselho reconstrói seu quórum e anuncia uma pauta comum de proteção laboral.",{movimento_livre:2,helix:-2},1,
  "Negociar uma nova credencial","A assembleia ganha autorização provisória, mas o órgão pode revogá-la.",{consorcio_civico:2,movimento_livre:-1},0),

 incident("aurea","au-crachas","Celina","Os crachás sem rosto",
  "Funcionários terceirizados somem dos acessos corporativos antes de receber o salário.",32,
  "Entregar as provas aos trabalhadores","Celina reconecta contratos e permite cobranças coletivas de remuneração.",{movimento_livre:2,helix:-2},1,
  "Registrar infração no Consórcio","A fiscalização bloqueia novas demissões enquanto um recurso tramita.",{consorcio_civico:2,helix:-1},0),
 incident("aurea","au-elevadores","Celina","Elevadores seletivos",
  "Um algoritmo impede que visitantes da Baixada cheguem aos andares da saúde privada.",36,
  "Liberar uma rota de serviço","A equipe de apoio abre um corredor, arriscando seu acesso para atender pacientes.",{movimento_livre:2,helix:-2},1,
  "Exigir acesso público supervisionado","O Consórcio impõe uma auditoria e rastreia cada visitante autorizado.",{consorcio_civico:2,helix:-1},-1),
 incident("aurea","au-memoria","Celina","O memorial de vidro",
  "Uma parede de homenagens corporativas exclui nomes das vítimas da quarentena.",40,
  "Projetar os nomes omitidos","A memória dos trabalhadores aparece sobre a fachada Helix antes que os drones intervenham.",{movimento_livre:2,helix:-2},2,
  "Guardar as identidades em cartório","O memorial oficial passa a registrar vítimas sob proteção legal.",{consorcio_civico:2,movimento_livre:1},-1),

 incident("subsolo","su-rotas","Mara","O mapa que denuncia",
  "Uma rota de abastecimento vazou as posições dos abrigos clandestinos.",32,
  "Apagar o rastreio e proteger as rotas","O Subsolo preserva seu acesso à água sem expor seus moradores.",{mercado_cinzento:2,movimento_livre:1},-1,
  "Entregar o mapa à fiscalização","O Consórcio promete proteção, mas ganha as coordenadas dos esconderijos.",{consorcio_civico:2,mercado_cinzento:-2},2),
 incident("subsolo","su-oxigenio","Mara","Ar cobrado por minuto",
  "A ventilação do abrigo passou a exigir pagamento por ciclos de oxigenação.",36,
  "Reconfigurar as bombas coletivas","Técnicos restabelecem o ar respirável fora da tarifa automática.",{movimento_livre:2,mercado_cinzento:1},-1,
  "Negociar acesso com intermediários","A ventilação volta, mas a rede clandestina assume a distribuição.",{mercado_cinzento:2,consorcio_civico:-1},1),
 incident("subsolo","su-desaparecidos","Mara","Nomes nas paredes úmidas",
  "Um corredor guarda marcas dos desaparecidos não reconhecidos pelas autoridades.",42,
  "Preservar o memorial sob o chão","Mara mantém o lugar em segurança e conecta famílias com testemunhas.",{movimento_livre:2,mercado_cinzento:1},-1,
  "Publicar um registro cifrado","O aviso chega à superfície, mas abre um conflito sobre a localização das provas.",{consorcio_civico:1,movimento_livre:1},2),

 incident("setor-zero","sz-lacres","Iuri","O selo que ninguém assinou",
  "Portas autônomas continuam vedando casas embora não exista ordem humana ativa.",34,
  "Abrir um corredor de evacuação","Pessoas retidas saem sob responsabilidade de uma equipe comunitária.",{movimento_livre:2,helix:-2},1,
  "Suspender a contenção com peritos","A liberação ocorre sob fiscalização e é registrada pelo Consórcio.",{consorcio_civico:2,helix:1},-1),
 incident("setor-zero","sz-bio","Iuri","As amostras esquecidas",
  "A bancada de biossegurança registra exames de famílias nunca notificadas.",38,
  "Entregar resultados aos pacientes","A clínica de Amara recebe diagnósticos que foram ocultados.",{movimento_livre:2,helix:-1},0,
  "Determinar auditoria laboratorial","O Consórcio recebe as amostras e inicia rastreamento da origem dos dados.",{consorcio_civico:2,helix:1},1),
 incident("setor-zero","sz-eden","Iuri","A decisão de Éden",
  "Uma mensagem automática propõe isolar uma família para reduzir o risco estatístico.",46,
  "Devolver a escolha à família","A família decide ficar reunida; Éden registra que o consentimento alterou o resultado.",{movimento_livre:2,helix:-1},1,
  "Aplicar quarentena revisável","Um comitê aprova medidas limitadas e publica a data de revisão.",{consorcio_civico:2,movimento_livre:1},-1),

 incident("prisma","pr-sinal","Kai","O sinal silenciado",
  "O algoritmo substitui denúncias trabalhistas por publicidade durante o espetáculo.",34,
  "Transmitir a denúncia ao vivo","O palco recupera a fala coletiva antes que o feed seja cortado.",{movimento_livre:2,helix:-2},2,
  "Comprar tempo de antena independente","Uma rota informal assegura minutos de transmissão sem identificação de fontes.",{mercado_cinzento:2,movimento_livre:1},0),
 incident("prisma","pr-credito","Kai","Curtidas por crédito",
  "Artistas sem patrocínio recebem avaliações artificiais que impedem sua contratação.",36,
  "Expor a auditoria de audiência","O público descobre o mercado de métricas fabricadas e pressiona as produtoras.",{movimento_livre:2,helix:-1},1,
  "Negociar distribuição alternativa","Pequenos selos criam uma rota comercial para artistas independentes.",{mercado_cinzento:2,consorcio_civico:1},-1),
 incident("prisma","pr-eco","Kai","A canção interditada",
  "A rede associa uma composição ao Projeto Éden e impede seu compartilhamento.",40,
  "Recriar o arquivo em cópias livres","Artistas reconstroem o testemunho sonoro sem revelar o endereço de quem gravou.",{movimento_livre:2,helix:-2},1,
  "Solicitar salvaguarda do acervo","A peça entra em arquivo público com limites de identificação das fontes.",{consorcio_civico:2,movimento_livre:1},-1),

 incident("periferia","pe-agua","Dara","Pedágio para a água",
  "Caminhões carregados de água estão parados porque o sistema exige uma licença impossível.",32,
  "Escoltar uma rota comunitária","As famílias recebem a reserva antes que outra cancela seja ativada.",{movimento_livre:2,helix:-1},1,
  "Suspender a tarifa no Consórcio","A fiscalização reabre oficialmente a estrada e monitora o novo fluxo.",{consorcio_civico:2,helix:-1},-1),
 incident("periferia","pe-torres","Dara","Antenas sem comunidade",
  "Torres de sinal ignoram assentamentos móveis porque faltam endereços cadastrados.",36,
  "Montar repetidores autônomos","As caravanas passam a compartilhar avisos sem cadastro centralizado.",{mercado_cinzento:1,movimento_livre:2},0,
  "Registrar as caravanas na rede","O Consórcio restabelece a conectividade mediante dados de localização.",{consorcio_civico:2,movimento_livre:-1},1),
 incident("periferia","pe-fronteira","Dara","Fronteira sem cidade",
  "Um bloqueio urbano impede famílias deslocadas de chegar aos hospitais.",44,
  "Abrir acolhimento com a Casa Comum","Dara conduz as famílias à rede de apoio da Baixada.",{movimento_livre:2,helix:-2},1,
  "Criar corredores humanitários auditados","Uma passagem formal protege atendimentos, mas exige revisão periódica da vigilância.",{consorcio_civico:2,movimento_livre:1},-1),
] as const;

/** NPC ou objeto físico que o jogador precisa alcançar para liberar a decisão.
 * Os IDs são atores preexistentes no mapa, nenhum marcador fictício.
 */
export const URBAN_ACTORS:Readonly<Record<string,{id:string;objective:string}>>={
 "ba-agua":{id:"feira-ajuda",objective:"Converse com Marta na feira da Baixada"},
 "ba-vigilancia":{id:"moradora",objective:"Ouça Joana na passagem da Baixada"},
 "ba-clinica":{id:"dra-amara",objective:"Converse com Amara na clínica"},
 "fe-fornos":{id:"ferrugem-log",objective:"Inspecione o livro de turnos da Ferrugem"},
 "fe-filtros":{id:"ferrugem-cabinet",objective:"Inspecione a unidade de manutenção da Ferrugem"},
 "fe-sindicato":{id:"ferrugem-foundry-access",objective:"Acesse a Fundição Auxiliar"},
 "au-crachas":{id:"district-aurea-terminal",objective:"Inspecione o terminal de Áurea"},
 "au-elevadores":{id:"district-aurea-specialist",objective:"Converse com o especialista de Áurea"},
 "au-memoria":{id:"district-aurea-community",objective:"Visite a comissão comunitária de Áurea"},
 "su-rotas":{id:"district-subsolo-terminal",objective:"Inspecione o terminal do Subsolo"},
 "su-oxigenio":{id:"district-subsolo-specialist",objective:"Converse com o técnico do Subsolo"},
 "su-desaparecidos":{id:"district-subsolo-community",objective:"Visite o conselho de moradores do Subsolo"},
 "sz-lacres":{id:"district-setor-zero-terminal",objective:"Leia o terminal de contenção do Setor Zero"},
 "sz-bio":{id:"district-setor-zero-specialist",objective:"Converse com o técnico de biossegurança"},
 "sz-eden":{id:"district-setor-zero-community",objective:"Ouça os sobreviventes da quarentena"},
 "pr-sinal":{id:"district-prisma-terminal",objective:"Examine o terminal do centro de Prisma"},
 "pr-credito":{id:"district-prisma-specialist",objective:"Converse com o operador do estúdio de Prisma"},
 "pr-eco":{id:"district-prisma-community",objective:"Ouça a comissão de artistas de Prisma"},
 "pe-agua":{id:"district-periferia-terminal",objective:"Inspecione o terminal rodoviário da Periferia"},
 "pe-torres":{id:"district-periferia-specialist",objective:"Converse com a motorista das caravanas"},
 "pe-fronteira":{id:"district-periferia-community",objective:"Visite o conselho das caravanas"},
};
export function urbanActor(incident:UrbanCase):{id:string;objective:string}{
 return URBAN_ACTORS[incident.id]!;
}
export function recordUrbanEvidence(state:UrbanState,district:RadioDistrict,
 actorId:string,unlocked:boolean):{ok:boolean;state:UrbanState;incident?:UrbanCase}{
 const current=currentUrbanCase(state,district,unlocked);
 if(!current||urbanActor(current).id!==actorId||
    state.evidence?.includes(current.id))return {ok:false,state};
 return {ok:true,state:{...state,evidence:[...(state.evidence??[]),current.id]},incident:current};
}
const CASE_IDS=new Set(URBAN_CASES.map(e=>e.id));
export function normalizeUrban(input:unknown):UrbanState{
 if(!input||typeof input!=="object"||Array.isArray(input))return {...INITIAL_URBAN,choices:{}};
 const value=input as Record<string,unknown>;
 if(value.version!==1||!value.choices||typeof value.choices!=="object"||
    Array.isArray(value.choices))return {...INITIAL_URBAN,choices:{}};
 const safe:Record<string,UrbanChoiceId>={};
 for(const [key,result] of Object.entries(value.choices)){
   if(CASE_IDS.has(key)&&(result==="a"||result==="b"))safe[key]=result;
 }
 const evidence=Array.isArray(value.evidence)?
  [...new Set(value.evidence.filter((id):id is string=>typeof id==="string"&&CASE_IDS.has(id)))]:[];
 return {version:1,choices:safe,evidence};
}
export function validateUrbanBackup(input:unknown):boolean{
 if(!input||typeof input!=="object"||Array.isArray(input))return false;
 const value=input as Record<string,unknown>;
 if(Object.keys(value).some(key=>key!=="version"&&key!=="choices"&&key!=="evidence")||value.version!==1||
    !value.choices||typeof value.choices!=="object"||Array.isArray(value.choices))return false;
 return Object.entries(value.choices).every(([key,option])=>
   CASE_IDS.has(key)&&(option==="a"||option==="b"))&&
  (value.evidence===undefined||
   Array.isArray(value.evidence)&&value.evidence.length<=21&&
   value.evidence.every((id:unknown)=>typeof id==="string"&&CASE_IDS.has(id))&&
   new Set(value.evidence).size===value.evidence.length);
}
export function readUrban(characterId:string):UrbanState{
 if(!characterId)return {...INITIAL_URBAN,choices:{}};
 try{const raw=globalThis.localStorage?.getItem(URBAN_KEY+characterId);
  return raw?normalizeUrban(JSON.parse(raw)):{...INITIAL_URBAN,choices:{}};
 }catch{return {...INITIAL_URBAN,choices:{}};}
}
export function saveUrban(characterId:string,state:UrbanState):boolean{
 if(!characterId||!validateUrbanBackup(state))return false;
 try{globalThis.localStorage?.setItem(URBAN_KEY+characterId,JSON.stringify(state));return !!globalThis.localStorage;}
 catch{return false;}
}
export function currentUrbanCase(state:UrbanState,district:RadioDistrict,
 unlocked:boolean):UrbanCase|null{
 if(!unlocked)return null;
 return URBAN_CASES.find(e=>e.district===district&&!Object.prototype.hasOwnProperty.call(state.choices,e.id))??null;
}
export function decideUrban(state:UrbanState,district:RadioDistrict,
 id:string,optionId:UrbanChoiceId,unlocked:boolean):
 {ok:boolean;state:UrbanState;incident?:UrbanCase;choice?:UrbanChoice}{
 const incident=currentUrbanCase(state,district,unlocked);
 if(!incident||incident.id!==id||!state.evidence?.includes(id))return {ok:false,state};
 const selected=incident.choices.find(c=>c.id===optionId);
 if(!selected)return {ok:false,state};
 return {ok:true,state:{version:1,choices:{...state.choices,[id]:optionId},evidence:state.evidence},
  incident,choice:selected};
}
export function urbanFactionEffects(state:UrbanState):readonly UrbanDelta[]{
 return URBAN_CASES.flatMap(e=>{
  const value=state.choices[e.id],option=e.choices.find(x=>x.id===value);
  return option?[option.factions]:[];
 });
}
export function urbanPressure(state:UrbanState,district:RadioDistrict):number{
 let pressure=0;
 for(const e of URBAN_CASES.filter(c=>c.district===district)){
  const option=e.choices.find(x=>x.id===state.choices[e.id]);
  pressure+=option?.pressure??0;
 }
 return Math.max(0,Math.min(3,1+pressure));
}

/** Apoios de infraestrutura desbloqueados por decisões persistidas.
 * Sem novos campos no save: recalculado ao iniciar cada encontro regional. */
export interface UrbanCombatSupport{
 label:string;attack?:number;armor?:number;energy?:number;movement?:number;
}
const REGIONAL_COMBAT_CASE={
 "district-aurea":"au-crachas",
 "district-subsolo":"su-rotas",
 "district-setor-zero":"sz-lacres",
 "district-prisma":"pr-sinal",
 "district-periferia":"pe-agua",
} as const;
const COMBAT_BRANCHES:Readonly<Record<keyof typeof REGIONAL_COMBAT_CASE,
 Readonly<Record<UrbanChoiceId,UrbanCombatSupport>>>>={
 "district-aurea":{
  a:{label:"Rede de trabalhadores: informações de mira",attack:1},
  b:{label:"Credencial cívica: proteção validada",armor:1}},
 "district-subsolo":{
  a:{label:"Rotas clandestinas: mobilidade ampliada",movement:1},
  b:{label:"Acordo com operadores: bateria de emergência",energy:2}},
 "district-setor-zero":{
  a:{label:"Corredor livre: reserva de energia",energy:2},
  b:{label:"Protocolos periciais: blindagem auxiliar",armor:1}},
 "district-prisma":{
  a:{label:"Rede de artistas: alvos expostos",attack:1},
  b:{label:"Transmissor alternativo: energia auxiliar",energy:2}},
 "district-periferia":{
  a:{label:"Apoio das caravanas: deslocamento ampliado",movement:1},
  b:{label:"Escolta oficial: proteção regional",armor:1}},
};
export function urbanCombatSupport(state:UrbanState,encounter:string):UrbanCombatSupport|null{
 if(!Object.prototype.hasOwnProperty.call(REGIONAL_COMBAT_CASE,encounter))return null;
 const key=encounter as keyof typeof REGIONAL_COMBAT_CASE;
 const choice=state.choices[REGIONAL_COMBAT_CASE[key]];
 return choice?COMBAT_BRANCHES[key][choice]:null;
}
