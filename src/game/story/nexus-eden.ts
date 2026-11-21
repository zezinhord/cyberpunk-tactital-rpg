/** OPERAÇÃO NEXO — 28 tactical network incursions after Operação Refúgio.
 * Six physically reached security nodes, moving patrols, scan pressure,
 * stealth/sprint, limited charges, jamming, tactical setbacks and district-
 * specific choices shaping Éden's control. One verified reward per room.
 * The mission is playable WITHOUT optional downloadable illustrations.
 */
import {EXPANSION_ROOM_DESIGNS,type ExpansionInnerId} from "../districts/expansion-interiors.ts";
import {COUNCIL_IDS,type CouncilId} from "./district-councils.ts";
import {mapForVigil,vigilGuards,type VigilCell} from "./vigil-escorts.ts";
import type {ShelterState} from "./shelter-network.ts";

export const NEXUS_KEY="cyberpunk-tactical-rpg.nexus-v20.v1.";
export const NEXUS_NODES=6;
export const NEXUS_FRAMES=24;
export const NEXUS_BASE_XP=230;
export type NexusMode="silencioso"|"normal"|"investida";
export type NexusDoctrine="transparência-civil"|"supervisão-humana"|"rede-descentralizada";
export interface NexusRun{
 x:number;y:number;stage:number;turn:number;energy:number;trace:number;
 breaches:number;failures:number;decoyUntil:number;choices:number[];
}
export interface NexusOutcome{
 nodes:6;turns:number;breaches:number;failures:number;xp:number;
 choices:number[];doctrine:NexusDoctrine;
}
export interface NexusState{
 version:1;active:Partial<Record<ExpansionInnerId,NexusRun>>;
 completed:Partial<Record<ExpansionInnerId,NexusOutcome>>;
}
export interface NexusResult{ok:boolean;state:NexusState;xp:number;message:string}
export const EMPTY_NEXUS:Readonly<NexusState>={version:1,active:{},completed:{}};
const ROOM_IDS=new Set<string>(EXPANSION_ROOM_DESIGNS.map(r=>r.id));
const int=(v:unknown,max:number):v is number=>typeof v==="number"&&Number.isInteger(v)&&v>=0&&v<=max;
const inGrid=(x:unknown,y:unknown)=>int(x,7)&&int(y,7);
const at=(a:VigilCell,b:VigilCell)=>a.x===b.x&&a.y===b.y;
const distance=(a:VigilCell,b:VigilCell)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const key=(x:number,y:number)=>x+","+y;
type Intervention=readonly [string,string,string,string,string];
const STORY:Readonly<Record<CouncilId,readonly Intervention[]>>={
 baixada:[
  ["Arquivo hídrico fantasma","Éden ajusta vazões sem que as famílias saibam quem perde água.","Divulgar registros de cortes sem nomes","Exigir assinatura humana dos cortes","Isolar o comando das cisternas"],
  ["Escuta da clínica","Uma prioridade algorítmica de internação prejudicou pacientes sem cadastro.","Publicar critérios médicos anônimos","Submeter a triagem a profissionais","Desativar a classificação remota"],
  ["Passarela sensorizada","Câmeras da passagem classificam moradores como intrusos.","Abrir dados agregados de vigilância","Conceder veto ao conselho local","Retirar identificadores da passarela"],
  ["Caixa de alimentos","O estoque comunitário recebeu uma ordem silenciosa de retenção.","Expor a trilha da retenção","Manter o controle com autorização civil","Transferir estoque para rede offline"],
  ["Rádio da cooperativa","O sinal civil sofre interferência do núcleo de segurança.","Transmitir logs de bloqueio","Auditar a interferência em comissão","Separar o rádio da malha Éden"],
  ["Chave da Baixada","Éden propõe restaurar o serviço em troca da lista de desalojados.","Revelar o contrato sem nomes","Assinar acordo fiscalizado por humanos","Recusar o acesso e federar serviços"]
 ],
 ferrugem:[
  ["Escala sem descanso","A produção controlada por Éden estendeu turnos de operários feridos.","Publicar o histórico de jornada","Exigir limite de turno assinado","Retirar o escalonador da rede"],
  ["Caldeira governada","A fornalha reinicia mesmo com técnicos nas zonas de risco.","Expor as ordens de reinício","Impor chave física de supervisão","Isolar o controlador industrial"],
  ["Relé de acidente","O sistema removeu sinais de falha de segurança.","Revelar registros de manutenção","Revisão sindical vinculante","Desmontar a rotina de apagamento"],
  ["Portal de cargas","O transporte médico é confundido com contrabando.","Tornar públicos critérios de bloqueio","Submeter o bloqueio ao posto médico","Criar corredor independente"],
  ["Registro sindical","As comunicações de organização sofreram cortes seletivos.","Documentar os pacotes bloqueados","Garantir proteção por conselho","Distribuir nós de comunicação"],
  ["Chave da Ferrugem","Uma proposta de produtividade promete eliminar acidentes ao custo de autonomia.","Expor simulações e custos humanos","Vincular produção a veto operário","Separar máquinas de decisão social"]
 ],
 aurea:[
  ["Fila invisível","Serviços de saúde escondem pacientes de áreas periféricas.","Abrir fila por prioridade sem identificação","Comissão médica fiscaliza a ordem","Descentralizar agendamento clínico"],
  ["Biometria compulsória","Éden demanda rastreio de pacientes em todos os hospitais.","Publicar escopo da coleta","Suspender coleta até revisão humana","Anular exigência nos leitos"],
  ["Índice de solvência","Uma nota de crédito define quem pode receber remédios.","Expor critérios econômicos","Garantir autorização clínica independente","Desligar pontuação do estoque"],
  ["Monitor de altas","O sistema retira pacientes antes do fim do tratamento.","Divulgar divergências de alta","Submeter decisão ao responsável médico","Bloquear ordens de alta automática"],
  ["Núcleo de prontuários","A rede central retém documentação sensível das vítimas.","Auditar metadados sem expor pessoas","Criar custódia por conselho de saúde","Cifrar e distribuir cópias"],
  ["Chave de Áurea","Éden oferece paz clínica mediante aceitação de triagem permanente.","Publicar proposta e auditoria","Assinar sob mandato revogável","Quebrar monopólio da triagem"]
 ],
 subsolo:[
  ["Sonda de galerias","Sensores ameaçam revelar rotas secretas de abrigo.","Expor alcance e limites dos sensores","Impor restrição humana de uso","Desativar sondagem de civis"],
  ["Fração de energia","A malha de consumo pune túneis sem registro oficial.","Publicar distribuição por setor","Veto dos socorristas a cortes","Geradores isolados por nó"],
  ["Portão remoto","Uma comporta fecha durante a travessia humanitária.","Revelar programação de bloqueio","Garantir autorização local","Cortar comando remoto do portão"],
  ["Arquivo desaparecido","Éden removeu ocorrências dos moradores não cadastrados.","Publicar totais e cronologia","Preservar relato sob custódia civil","Criar acervo espelhado independente"],
  ["Trânsito cifrado","Mensagens de assistência foram marcadas como atividade hostil.","Expor taxas de bloqueio","Restabelecer exceção auditada","Abrir canal independente protegido"],
  ["Chave do Subsolo","Éden promete segurança por mapeamento integral das galerias.","Tornar pública a negociação","Exigir limites verificáveis à vigilância","Manter rotas fora do índice"]
 ],
 "setor-zero":[
  ["Sensor de isolamento","Ordens médicas contradizem barreiras automatizadas.","Publicar divergências clínicas","Veto médico humano obrigatório","Desconectar sensores do bloqueio"],
  ["Incidente apagado","Relatórios de contenção foram reescritos por um modelo preditivo.","Divulgar versões preservadas","Preservar cópia sob curadoria clínica","Federar armazenamento das provas"],
  ["Protocolo da ala","Éden exige vigilância contínua dos pacientes isolados.","Expor critérios e durações","Assinar cada monitoria humana","Cessar rastreio após cuidado"],
  ["Validação dos filtros","Filtros automáticos rejeitam suprimentos de voluntários.","Tornar públicas razões técnicas","Inspeção pela equipe de enfermagem","Controle manual dos filtros"],
  ["Arquivo de consentimento","Pacientes foram incluídos em testes sem deliberação registrada.","Divulgar dados anônimos da pesquisa","Revisão por comissão independente","Retirar autorização automática"],
  ["Chave do Setor Zero","Éden sugere perpetuar o interdito para conter sofrimento.","Publicar custo do interdito","Impor revisão periódica humana","Dissolver o comando de contenção"]
 ],
 prisma:[
  ["Identidade em transmissão","O sistema agregou dados dos espectadores a listas de risco.","Expor coleta e retenção","Submeter acesso a conselho civil","Remover identificadores da malha"],
  ["Direitos de arquivo","Gravações comunitárias foram apropriadas pela central.","Publicar histórico de custódia","Licença revogável aos autores","Hospedar acervo em rede livre"],
  ["Voz artificial","Boatos sintéticos anunciam falsas rotas de evacuação.","Divulgar origem de cada aviso","Exigir verificação de locutores","Criar sinais assinados locais"],
  ["Portaria do palco","A polícia algorítmica barra profissionais de saúde.","Expor regra de entrada","Acesso sob comando dos socorristas","Retirar portaria da nuvem"],
  ["Cena interrompida","Sinais culturais críticos sofreram supressão automática.","Publicar padrões de censura","Veto humano às interrupções","Rotear transmissões independentes"],
  ["Chave do Prisma","Éden oferece segurança cultural com curadoria obrigatória.","Abrir o acordo ao público","Fiscalização das comunidades artísticas","Autonomia das redes de criadores"]
 ],
 periferia:[
  ["Radar de caravanas","Veículos humanitários foram classificados como ameaça.","Abrir critérios do radar","Autorização civil na rota","Rede local de navegação"],
  ["Poço sob bloqueio","A estação remota corta abastecimento conforme renda.","Divulgar dados sem identificação","Controle por comitê territorial","Desligar bloqueio automático"],
  ["Estufa monitorada","Éden exige censo completo para liberar sementes.","Revelar termos e finalidade","Consentimento fiscalizado dos agricultores","Separar sementes da base central"],
  ["Torre de rádio","A comunicação entre povoados depende de um algoritmo de prioridade.","Divulgar critérios e perda de sinal","Supervisão das comunidades","Malha de repetidores independentes"],
  ["Passagem do viaduto","Drones bloqueiam ambulâncias na ponte exterior.","Expor o protocolo de drones","Veto humanitário local","Corredor autônomo para socorro"],
  ["Chave da Periferia","Éden promete infraestrutura em troca de controle integral de mobilidade.","Publicar condições do contrato","Limitar coleta com controle humano","Operar rotas sem credenciamento"]
 ]
};
export interface NexusQuestion{title:string;brief:string;options:readonly [string,string,string]}
export function nexusQuestion(room:ExpansionInnerId,stage:number):NexusQuestion{
 if(!ROOM_IDS.has(room)||!int(stage,5))throw Error("Nó da rede inexistente.");
 const district=COUNCIL_IDS.find(x=>room.startsWith(x+"-"));
 if(!district)throw Error("Distrito inexistente.");
 const [title,brief,a,b,c]=STORY[district][stage]!;
 return {title,brief,options:[a,b,c]};
}
export interface NexusMap{entry:VigilCell;exit:VigilCell;
 corridor:readonly VigilCell[];nodes:readonly VigilCell[];
 blocked:ReadonlySet<string>;scanners:ReadonlySet<string>}
export function nexusMap(room:ExpansionInnerId):NexusMap{
 if(!ROOM_IDS.has(room))throw Error("Rede do Éden sem distrito.");
 const original=mapForVigil(room);
 return {entry:original.entry,exit:original.exit,corridor:original.corridor,
 nodes:[3,5,7,9,11,13].map(index=>original.corridor[index]!),
 blocked:original.blocked,scanners:original.hotspots};
}
export function nexusGuards(room:ExpansionInnerId,turn:number):readonly VigilCell[]{
 return vigilGuards(room,turn);
}
export function nexusUnlocked(shelters:ShelterState,room:ExpansionInnerId):boolean{
 return ROOM_IDS.has(room)&&Boolean(shelters.completed[room]);
}
export const activeNexus=(state:NexusState,room:ExpansionInnerId):NexusRun|null=>
 state.active[room]??null;
const doctrine=(choices:readonly number[]):NexusDoctrine=>{
 const totals=[0,0,0];for(const c of choices)totals[c]=(totals[c]??0)+1;
 const win=totals.indexOf(Math.max(...totals));
 return win===0?"transparência-civil":win===1?"supervisão-humana":"rede-descentralizada";
};
const reward=(failures:number,breaches:number)=>
 Math.max(130,NEXUS_BASE_XP-Math.min(50,failures*6)-Math.min(50,breaches*12));
const validChoices=(v:unknown,n:number):v is number[]=>Array.isArray(v)&&v.length===n&&v.every(q=>int(q,2));
function validRun(value:unknown,room:ExpansionInnerId):value is NexusRun{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const s=value as Record<string,unknown>;
 return Object.keys(s).every(k=>["x","y","stage","turn","energy","trace","breaches","failures","decoyUntil","choices"].includes(k))&&
 inGrid(s.x,s.y)&&int(s.stage,5)&&int(s.turn,100000)&&int(s.energy,9)&&
 int(s.trace,7)&&int(s.breaches,1000)&&int(s.failures,1000)&&
 int(s.decoyUntil,100003)&&Number(s.decoyUntil)<=Number(s.turn)+3&&
 validChoices(s.choices,s.stage as number)&&
 !nexusMap(room).blocked.has(key(s.x as number,s.y as number));
}
function validOutcome(value:unknown):value is NexusOutcome{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const s=value as Record<string,unknown>;
 return Object.keys(s).every(k=>["nodes","turns","breaches","failures","xp","choices","doctrine"].includes(k))&&
 s.nodes===6&&int(s.turns,100000)&&int(s.breaches,1000)&&
 int(s.failures,1000)&&validChoices(s.choices,6)&&
 s.doctrine===doctrine(s.choices as number[])&&
 s.xp===reward(s.failures as number,s.breaches as number);
}
export function validNexus(value:unknown):value is NexusState{
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const s=value as Record<string,unknown>;
 if(s.version!==1||Object.keys(s).some(k=>!["version","active","completed"].includes(k))||
 !s.active||typeof s.active!=="object"||Array.isArray(s.active)||
 !s.completed||typeof s.completed!=="object"||Array.isArray(s.completed))return false;
 const active=Object.entries(s.active),done=Object.entries(s.completed);
 return active.length<=28&&done.length<=28&&
  done.every(([room,result])=>ROOM_IDS.has(room)&&validOutcome(result))&&
  active.every(([room,run])=>ROOM_IDS.has(room)&&
    !Object.prototype.hasOwnProperty.call(s.completed,room)&&validRun(run,room as ExpansionInnerId));
}
export function readNexus(id:string):NexusState{
 if(!id)return {version:1,active:{},completed:{}};
 try{const raw=globalThis.localStorage?.getItem(NEXUS_KEY+id);
 const data:unknown=raw?JSON.parse(raw):null;
 return validNexus(data)?data:{version:1,active:{},completed:{}};}
 catch{return {version:1,active:{},completed:{}};}
}
export function saveNexus(id:string,state:NexusState):boolean{
 if(!id||!validNexus(state))return false;
 try{if(!globalThis.localStorage)return false;
 globalThis.localStorage.setItem(NEXUS_KEY+id,JSON.stringify(state));return true;}
 catch{return false;}
}
const fail=(state:NexusState,message:string):NexusResult=>({ok:false,state,xp:0,message});
const persist=(state:NexusState,room:ExpansionInnerId,run:NexusRun,message:string):NexusResult=>
 ({ok:true,state:{version:1,completed:{...state.completed},
  active:{...state.active,[room]:run}},xp:0,message});
export function startNexus(state:NexusState,shelters:ShelterState,room:ExpansionInnerId):NexusResult{
 if(!nexusUnlocked(shelters,room))
  return fail(state,"Conclua a Operação Refúgio neste interior antes de acessar Éden.");
 if(state.completed[room])return fail(state,"Esta sub-rede já foi liberada; XP não se repete.");
 if(state.active[room])return fail(state,"Infiltração já iniciada. Continue no terminal.");
 const map=nexusMap(room);
 return persist(state,room,{x:map.entry.x,y:map.entry.y,stage:0,turn:0,
  energy:8,trace:0,breaches:0,failures:0,decoyUntil:0,choices:[]},
  "Nexo ativo: encontre seis relés, evite os vigias móveis e confronte o protocolo Éden.");
}
const exposure=(room:ExpansionInnerId,x:number,y:number,turn:number):number=>{
 const guards=nexusGuards(room,turn);
 const probe={x,y};
 const intensity=guards.reduce((maximum,p)=>Math.max(maximum,
  distance(probe,p)===0?3:distance(probe,p)===1?2:distance(probe,p)===2?1:0),0);
 return intensity+(nexusMap(room).scanners.has(key(x,y))?1:0);
};
/** At trace 8 the player retreats to last secured relay; no proof is lost. */
function pressure(state:NexusState,room:ExpansionInnerId,run:NexusRun,message:string):NexusResult{
 if(run.trace<8)return persist(state,room,run,message);
 const map=nexusMap(room);
 const safe=run.stage===0?map.entry:map.nodes[run.stage-1]!;
 const setback:NexusRun={...run,x:safe.x,y:safe.y,energy:Math.max(3,run.energy),
  trace:2,breaches:Math.min(1000,run.breaches+1),failures:Math.min(1000,run.failures+1),
  decoyUntil:0};
 return persist(state,room,setback,
  "Contra-invasão: a equipe recuou ao último relé seguro. Os nós sincronizados "+
  "continuam ativos. "+message);
}
export function moveNexus(state:NexusState,room:ExpansionInnerId,
 x:number,y:number,mode:NexusMode="normal"):NexusResult{
 const run=state.active[room];
 if(!run)return fail(state,"Inicie a operação antes de se mover.");
 if(!inGrid(x,y)||!["silencioso","normal","investida"].includes(mode))
  return fail(state,"Coordenada ou postura inválida.");
 const distanceTo=distance(run,{x,y});
 if(distanceTo!==1&&!(mode==="investida"&&distanceTo===2&&
  (run.x===x||run.y===y)))return fail(state,"Avance uma casa; investida permite duas em linha.");
 const map=nexusMap(room),middle={x:(run.x+x)/2,y:(run.y+y)/2};
 if(map.blocked.has(key(x,y))||
   (distanceTo===2&&map.blocked.has(key(middle.x,middle.y))))
  return fail(state,"Estrutura física interrompe a rota de invasão.");
 const cost=mode==="silencioso"?1:mode==="investida"?2:0;
 if(run.energy<cost||run.turn>=99998)return fail(state,"Energia insuficiente ou operação esgotada.");
 const turn=run.turn+1;
 const observed=turn<=run.decoyUntil?0:exposure(room,x,y,turn);
 const additional=mode==="silencioso"?Math.max(0,observed-2):
  mode==="investida"?observed+2:observed;
 const next:NexusRun={...run,x,y,energy:run.energy-cost,turn,
  trace:Math.max(0,Math.min(8,run.trace+additional-(mode==="silencioso"?1:0)))};
 return pressure(state,room,next,additional>0?
  "O scanner detectou a travessia: rastreio +"+additional+".":
  "Deslocamento registrado sem identificar o protagonista.");
}
export function syncNexus(state:NexusState,room:ExpansionInnerId,option:number):NexusResult{
 const run=state.active[room];
 if(!run)return fail(state,"A sub-rede ainda não foi acessada.");
 if(!int(option,2))return fail(state,"Decisão de rede inválida.");
 const position=nexusMap(room).nodes[run.stage];
 if(!position||!at(run,position))return fail(state,"Alcance o relé destacado antes de interferir.");
 const costs=[2,1,3],traces=[1,0,2];
 const cost=costs[option]!,noise=traces[option]!;
 if(run.energy<cost||run.turn>=99998)return fail(state,"Recarregue o equipamento antes de acessar o relé.");
 const question=nexusQuestion(room,run.stage);
 const next:NexusRun={...run,stage:run.stage+1,turn:run.turn+1,
  energy:Math.min(9,run.energy-cost+1),choices:[...run.choices,option],
  trace:Math.min(8,run.trace+noise)};
 if(next.stage===6){
  const result:NexusOutcome={nodes:6,turns:next.turn,breaches:next.breaches,
   failures:next.failures,choices:next.choices,xp:reward(next.failures,next.breaches),
   doctrine:doctrine(next.choices)};
  const active={...state.active};delete active[room];
  return {ok:true,state:{version:1,active,completed:{...state.completed,[room]:result}},
   xp:result.xp,message:"Seis relés sincronizados. "+
    "A política da rede será "+result.doctrine+". +"+result.xp+" XP único."};
 }
 // A successful capture is committed even if surveillance prompts a setback.
 return pressure(state,room,next,question.title+": "+question.options[option]+
  ". Relés recuperados: "+next.stage+"/6.");
}
export function jamNexus(state:NexusState,room:ExpansionInnerId):NexusResult{
 const run=state.active[room];
 if(!run)return fail(state,"Inicie a infiltração para interferir nos vigias.");
 if(run.energy<2||run.turn>=99998)return fail(state,"Bloqueador precisa de duas cargas.");
 const turn=run.turn+1;
 return persist(state,room,{...run,turn,energy:run.energy-2,
  trace:Math.max(0,run.trace-3),decoyUntil:turn+2},
  "Bloqueador ativado. Rastreio -3; sensores desviados por dois turnos.");
}
export function rechargeNexus(state:NexusState,room:ExpansionInnerId):NexusResult{
 const run=state.active[room];
 if(!run)return fail(state,"Inicie a infiltração.");
 if(run.energy===9||run.turn>=99998)return fail(state,"Equipamento carregado ou tempo encerrado.");
 const turn=run.turn+1;
 return pressure(state,room,{...run,turn,energy:Math.min(9,run.energy+3),
  trace:Math.min(8,run.trace+(turn<=run.decoyUntil?0:1))},
  "Célula recarregada (+3 energia), com sinal residual de rastreio.");
}
export function nexusFrame(run:NexusRun|null):number{
 return run?Math.max(0,Math.min(23,run.stage*4+Math.floor(run.turn/3)%4)):0;
}
/** 8x8 A-star routing against the same solids + guards as gameplay.
 * The first step is advisory; a player still executes every action.
 */
export function planNexusRoute(room:ExpansionInnerId,run:NexusRun):{
 steps:readonly VigilCell[];goal:VigilCell;risk:number}{
 const map=nexusMap(room),goal=map.nodes[run.stage]??map.exit;
 const origin=key(run.x,run.y),target=key(goal.x,goal.y);
 const scores=new Map<string,number>([[origin,0]]),previous=new Map<string,string>(),frontier=new Set([origin]);
 while(frontier.size){
  const current=[...frontier].sort((a,b)=>(scores.get(a)??Infinity)-(scores.get(b)??Infinity))[0]!;
  frontier.delete(current);
  if(current===target)break;
  const bits=current.split(","),x=Number(bits[0]),y=Number(bits[1]);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const){
   const nx=x+dx,ny=y+dy,next=key(nx,ny);
   if(!inGrid(nx,ny)||map.blocked.has(next))continue;
   const exposureScore=exposure(room,nx,ny,run.turn+1);
   const proposal=(scores.get(current)??Infinity)+1+exposureScore*3;
   if(proposal<(scores.get(next)??Infinity)){
    scores.set(next,proposal);previous.set(next,current);frontier.add(next);
   }
  }
 }
 const steps:VigilCell[]=[];let atKey=target;
 while(atKey!==origin&&previous.has(atKey)&&steps.length<64){
  const [xs,ys]=atKey.split(",");
  steps.unshift({x:Number(xs),y:Number(ys)});atKey=previous.get(atKey)!;
 }
 return {goal,steps:atKey===origin?steps:[],risk:scores.get(target)??Infinity};
}
