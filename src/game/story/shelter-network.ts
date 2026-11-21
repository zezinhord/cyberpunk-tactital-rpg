/** Operação Refúgio — 28 missões pós-resgate, cinco intervenções em cada interior.
 * Todo turno usa a planta de colisões existente, recursos finitos, decisões
 * civis distintas por distrito e salvamento isolado por protagonista.
 */
import {EXPANSION_ROOM_DESIGNS,type ExpansionInnerId} from "../districts/expansion-interiors.ts";
import {COUNCIL_IDS,type CouncilId} from "./district-councils.ts";
import {layoutForRoom} from "./perimeter-routes.ts";
import type {VigilProgress} from "./vigil-escorts.ts";
export const SHELTER_KEY="cyberpunk-tactical-rpg.shelter-v20.v1.";
export const SHELTER_STEPS=5,SHELTER_FRAMES=20,SHELTER_BASE_XP=185;
export const SHELTER_GOALS=[{x:2,y:6},{x:3,y:5},{x:4,y:4},{x:5,y:3},{x:6,y:2}] as const;
const IDS=new Set<string>(EXPANSION_ROOM_DESIGNS.map(r=>r.id));
const bounded=(v:unknown,max:number):v is number=>typeof v==="number"&&Number.isInteger(v)&&v>=0&&v<=max;
const cell=(x:unknown,y:unknown)=>bounded(x,7)&&bounded(y,7);
const dist=(a:{x:number;y:number},b:{x:number;y:number})=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const gridKey=(x:number,y:number)=>x+","+y;
export type ShelterPace="cauteloso"|"equilibrado"|"urgente";
export type ShelterDoctrine="comunitária"|"institucional"|"autônoma";
export interface ShelterRun{x:number;y:number;stage:number;turn:number;supplies:number;morale:number;security:number;resupplies:number;choices:number[]}
export interface ShelterOutcome{stages:5;turns:number;xp:number;morale:number;security:number;resupplies:number;choices:number[];doctrine:ShelterDoctrine}
export interface ShelterState{version:1;active:Partial<Record<ExpansionInnerId,ShelterRun>>;completed:Partial<Record<ExpansionInnerId,ShelterOutcome>>}
export interface ShelterResult{ok:boolean;state:ShelterState;xp:number;message:string}
export const EMPTY_SHELTER:Readonly<ShelterState>={version:1,active:{},completed:{}};
export interface ShelterChoice{label:string;detail:string;cost:number;morale:number;security:number}
export interface ShelterTask{title:string;brief:string;choices:readonly [ShelterChoice,ShelterChoice,ShelterChoice]}
type Intervention=readonly [string,string,string,string,string];
const TASKS:Readonly<Record<CouncilId,readonly Intervention[]>>={
 baixada:[
  ["Cisterna de sobrevivência","A Helix encerrou a água para famílias sem crédito.","Abrir reserva cooperativa","Negociar acesso institucional","Interligar filtros alternativos"],
  ["Triagem da clínica","A clínica recebe pacientes sem identificação.","Prioridade por condição médica","Triagem registrada sob tutela","Equipe de socorro independente"],
  ["Travessia do canal","Crianças e idosos ficaram isolados pela cheia.","Mutirão de passarela","Contratar ponte de emergência","Rotas secundárias pelos telhados"],
  ["Proteção de cadastros","O controle urbano exige o endereço de cada deslocado.","Publicar somente totais","Registro com consentimento","Guarda cifrada dos registros"],
  ["Governança da água","O abrigo deve permanecer operante após a crise.","Conselho de moradores","Fiscalização municipal","Rede hídrica autônoma"]
 ],
 ferrugem:[
  ["Galpão de assistência","As equipes industriais resgatadas precisam de repouso.","Reserva sindical de materiais","Requisição formal às empresas","Reaproveitar peças da oficina"],
  ["Caldeira auxiliar","O ar frio ameaça pacientes estabilizados.","Manutenção feita pelos operários","Inspeção técnica corporativa","Ventilação paralela de emergência"],
  ["Turnos de descanso","Jornadas longas ameaçam os primeiros socorros.","Escala coletiva segura","Rodízio regulamentado","Turnos comunitários dispersos"],
  ["Livros de acidentes","A direção quer descartar os registros antigos.","Arquivo coletivo de trabalho","Custódia institucional","Cópias em unidades externas"],
  ["Rota humanitária","Cargas industriais bloqueiam ambulâncias.","Corredor sindical protegido","Passagem com licença oficial","Desvio pelo anel de carga"]
 ],
 aurea:[
  ["Leitos sem credencial","Hospitais fecham portas a pacientes não cadastrados.","Fundo comunitário de leitos","Acordo emergencial formal","Clínicas fora da rede central"],
  ["Medicamentos essenciais","O distribuidor exige biometria de todos os pacientes.","Entrega por critério clínico","Registro protegido de entrega","Rede anônima de farmacêuticos"],
  ["Prontuário preservado","O sistema apagará registros de pessoas não identificadas.","Arquivo anonimizado auditável","Custódia sob conselho médico","Cópias cifradas locais"],
  ["Energia clínica","Baterias precisam sustentar equipamentos vitais.","Decisão da equipe de enfermagem","Protocolo regulado de carga","Microrede isolada da Helix"],
  ["Fiscalização de acesso","A desigualdade pode regressar após a evacuação.","Ouvidoria de pacientes","Auditoria regulatória","Observadores médicos independentes"]
 ],
 subsolo:[
  ["Purificação subterrânea","Os filtros da galeria falham com a chegada dos novos civis.","Coleta comum de membranas","Suprimento contratado à superfície","Filtro antigo modificado"],
  ["Câmaras de abrigo","Há menos respiradouros que famílias desalojadas.","Distribuir pelos respiradouros","Controle central de ocupação","Abrir antigas câmaras seladas"],
  ["Alimentação e luz","Cozinhas subterrâneas operam sem energia estável.","Cozinhas solidárias","Energia contratada","Geradores clandestinos locais"],
  ["Ocultação de rotas","Rádio aberta expõe pessoas à perseguição.","Canal comunitário cifrado","Frequência sob proteção oficial","Sinais de baixíssima potência"],
  ["Comportas de saída","Uma descarga pode eliminar o corredor de fuga.","Inspeção pelos trabalhadores","Controle formal de comportas","Rotas redundantes independentes"]
 ],
 "setor-zero":[
  ["Corredor sanitário","O isolamento impede que pessoas recebam água.","Entrega assistida em equipe","Protocolo clínico centralizado","Robôs isolados de distribuição"],
  ["Contagem dos sobreviventes","Sensores registram números incompatíveis.","Contagem por testemunhas","Auditoria médica institucional","Sensores redundantes isolados"],
  ["Máscaras de contenção","O estoque de proteção deve durar toda a noite.","Priorizar pacientes mais frágeis","Distribuição sob protocolo","Descontaminação emergencial local"],
  ["Veto humano","Um terminal prioriza máquinas sobre pacientes.","Veto colegiado das equipes","Supervisão de emergência","Isolar barramento automatizado"],
  ["Monitoria do interdito","O fechamento não poderá ocultar crimes futuros.","Comissão de familiares","Inspeção oficial contínua","Coletivo técnico de observação"]
 ],
 prisma:[
  ["Refúgio das testemunhas","Uma transmissão expôs nomes dos deslocados.","Rede coletiva de proteção","Programa formal de testemunhas","Identidades independentes dispersas"],
  ["Rádio de emergência","Sinais falsos desviam os socorristas.","Checagem popular de notícias","Central regulada de comunicação","Assinaturas locais autônomas"],
  ["Posto do palco","Equipamentos cênicos ocupam o espaço de atendimento.","Mutirão com profissionais","Serviço emergencial contratado","Clínica móvel autogerida"],
  ["Preservar depoimentos","As gravações contêm evidências e dados de vítimas.","Consentimento e arquivo comum","Custódia pública protegida","Cópias independentes cifradas"],
  ["Retomada da noite","A economia cultural não pode expulsar os abrigados.","Pacto entre artistas e civis","Plano municipal de ocupação","Circuito cultural livre"]
 ],
 periferia:[
  ["Ponto da caravana","Chuva e calor ameaçam o acampamento temporário.","Abrigo coletivo organizado","Centro de atendimento formal","Núcleos móveis descentralizados"],
  ["Poços de abastecimento","A água superficial pode estar contaminada.","Testes comunitários contínuos","Suprimento central contratado","Destiladores locais distribuídos"],
  ["Transporte solidário","Ambulâncias e caravanas dividem combustível.","Rodízio por prioridade clínica","Frota supervisionada","Revezamento entre condutores"],
  ["Torres de energia","Uma falha apagará a única rota de rádio.","Baterias em cooperativa","Reparo pela concessionária","Microgeradores locais"],
  ["Estrada de assistência","O fim da patrulha não deve cancelar o socorro.","Guarda civil territorial","Posto oficial de passagem","Corredor alternativo monitorado"]
 ]
};
export function shelterTask(room:ExpansionInnerId,stage:number):ShelterTask{
 if(!IDS.has(room)||!bounded(stage,4))throw Error("Intervenção inválida.");
 const district=COUNCIL_IDS.find(d=>room.startsWith(d+"-"));
 if(!district)throw Error("Área sem conselho.");
 const [title,brief,a,b,c]=TASKS[district][stage]!;
 return {title,brief,choices:[
  {label:a,detail:"Mais participação local, com menor vigilância.",cost:2,morale:2,security:-1},
  {label:b,detail:"Mais controle institucional, com menor autonomia civil.",cost:1,morale:-1,security:2},
  {label:c,detail:"Autonomia técnica, com maior consumo de insumos.",cost:3,morale:1,security:1},
 ]};
}
export function shelterMap(room:ExpansionInnerId){
 if(!IDS.has(room))throw Error("Sala inexistente.");
 const m=layoutForRoom(room);
 return {blocked:m.blocked,hazards:m.hazards,entry:{x:0,y:7},goals:SHELTER_GOALS};
}
export function shelterUnlocked(vigil:VigilProgress,room:ExpansionInnerId):boolean{
 return IDS.has(room)&&Boolean(vigil.completed[room]);
}
export const activeShelter=(state:ShelterState,room:ExpansionInnerId)=>state.active[room]??null;
const doctrine=(choices:readonly number[]):ShelterDoctrine=>{
 const votes=[0,0,0];
 for(const n of choices)votes[n]=(votes[n]??0)+1;
 const win=votes.indexOf(Math.max(...votes));
 return win===0?"comunitária":win===1?"institucional":"autônoma";
};
const reward=(morale:number,security:number)=>
 Math.max(125,SHELTER_BASE_XP-5*Math.max(0,5-morale)-5*Math.max(0,5-security));
const validChoices=(v:unknown,n:number):v is number[]=>Array.isArray(v)&&v.length===n&&v.every(c=>bounded(c,2));
function validRun(raw:unknown,room:ExpansionInnerId):raw is ShelterRun{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const s=raw as Record<string,unknown>;
 return Object.keys(s).every(k=>["x","y","stage","turn","supplies","morale","security","resupplies","choices"].includes(k))&&
 cell(s.x,s.y)&&bounded(s.stage,4)&&bounded(s.turn,100000)&&
 bounded(s.supplies,9)&&bounded(s.morale,10)&&bounded(s.security,10)&&
 bounded(s.resupplies,100000)&&validChoices(s.choices,s.stage)&&
 !shelterMap(room).blocked.has(gridKey(s.x as number,s.y as number));
}
function validOutcome(raw:unknown):raw is ShelterOutcome{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const s=raw as Record<string,unknown>;
 return Object.keys(s).every(k=>["stages","turns","xp","morale","security","resupplies","choices","doctrine"].includes(k))&&
 s.stages===5&&bounded(s.turns,100000)&&bounded(s.morale,10)&&
 bounded(s.security,10)&&bounded(s.resupplies,100000)&&validChoices(s.choices,5)&&
 s.doctrine===doctrine(s.choices as number[])&&s.xp===reward(s.morale as number,s.security as number);
}
export function validShelter(raw:unknown):raw is ShelterState{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const s=raw as Record<string,unknown>;
 if(s.version!==1||Object.keys(s).some(k=>!["version","active","completed"].includes(k))||
 !s.active||typeof s.active!=="object"||Array.isArray(s.active)||
 !s.completed||typeof s.completed!=="object"||Array.isArray(s.completed))return false;
 const active=Object.entries(s.active),done=Object.entries(s.completed);
 return active.length<=28&&done.length<=28&&
 done.every(([id,value])=>IDS.has(id)&&validOutcome(value))&&
 active.every(([id,value])=>IDS.has(id)&&!Object.prototype.hasOwnProperty.call(s.completed,id)&&
 validRun(value,id as ExpansionInnerId));
}
export function readShelter(id:string):ShelterState{
 if(!id)return {version:1,active:{},completed:{}};
 try{const data=globalThis.localStorage?.getItem(SHELTER_KEY+id);
 const obj:unknown=data?JSON.parse(data):null;
 return validShelter(obj)?obj:{version:1,active:{},completed:{}};}
 catch{return {version:1,active:{},completed:{}};}
}
export function saveShelter(id:string,state:ShelterState):boolean{
 if(!id||!validShelter(state))return false;
 try{if(!globalThis.localStorage)return false;
 globalThis.localStorage.setItem(SHELTER_KEY+id,JSON.stringify(state));return true;}
 catch{return false;}
}
const failure=(s:ShelterState,message:string):ShelterResult=>({ok:false,state:s,xp:0,message});
const saved=(s:ShelterState,id:ExpansionInnerId,run:ShelterRun,message:string):ShelterResult=>({
 ok:true,state:{version:1,completed:{...s.completed},active:{...s.active,[id]:run}},xp:0,message
});
export function startShelter(s:ShelterState,v:VigilProgress,id:ExpansionInnerId):ShelterResult{
 if(!shelterUnlocked(v,id))return failure(s,"Conclua a Vigília deste interior.");
 if(s.completed[id])return failure(s,"Rede estabilizada. Não há recompensas repetidas.");
 if(s.active[id])return failure(s,"Missão de assistência em andamento.");
 return saved(s,id,{x:0,y:7,stage:0,turn:0,supplies:7,morale:5,security:5,resupplies:0,choices:[]},
 "Abrigo iniciado: atravesse a área e ative cinco postos civis.");
}
export function moveShelter(s:ShelterState,id:ExpansionInnerId,x:number,y:number,
 pace:ShelterPace="equilibrado"):ShelterResult{
 const run=s.active[id];
 if(!run)return failure(s,"Inicie o abrigo antes de se mover.");
 if(!cell(x,y)||dist(run,{x,y})!==1||!["cauteloso","equilibrado","urgente"].includes(pace))
  return failure(s,"Movimento ortogonal de uma casa obrigatório.");
 const map=shelterMap(id);
 if(map.blocked.has(gridKey(x,y)))return failure(s,"Paredes impedem o deslocamento.");
 const cost=pace==="cauteloso"?1:0,hazard=map.hazards.has(gridKey(x,y));
 if(run.supplies<cost||run.turn>=99999)return failure(s,"Reabasteça ou reduza o ritmo.");
 return saved(s,id,{...run,x,y,turn:run.turn+1,supplies:run.supplies-cost,
  security:Math.max(0,run.security-(hazard&&pace!=="cauteloso"?2:0)),
  morale:Math.max(0,run.morale-(hazard&&pace==="urgente"?1:0))},
  hazard?"Área vulnerável: sua postura alterou as condições de segurança.":"Equipe avançou ao próximo setor.");
}
export function supplyShelter(s:ShelterState,id:ExpansionInnerId):ShelterResult{
 const run=s.active[id];
 if(!run)return failure(s,"Inicie o abrigo.");
 if(run.supplies===9||run.turn>=99999||run.resupplies>=99999)return failure(s,"Suprimentos completos ou limite atingido.");
 return saved(s,id,{...run,turn:run.turn+1,resupplies:run.resupplies+1,
  supplies:Math.min(9,run.supplies+4),morale:Math.max(0,run.morale-1)},
  "Insumos recuperados (+4), moral reduzida (-1).");
}
export function decideShelter(s:ShelterState,id:ExpansionInnerId,option:number):ShelterResult{
 const run=s.active[id];
 if(!run)return failure(s,"Inicie o abrigo.");
 if(!bounded(option,2))return failure(s,"Escolha inválida.");
 const goal=SHELTER_GOALS[run.stage];
 if(!goal||run.x!==goal.x||run.y!==goal.y)return failure(s,"Alcance o posto de assistência indicado.");
 const task=shelterTask(id,run.stage),chosen=task.choices[option]!;
 if(run.supplies<chosen.cost)return failure(s,"Este plano exige "+chosen.cost+" insumos. Reabasteça.");
 if(run.turn>=99999)return failure(s,"Limite de turnos atingido.");
 const next:ShelterRun={...run,stage:run.stage+1,turn:run.turn+1,
  supplies:run.supplies-chosen.cost,choices:[...run.choices,option],
  morale:Math.max(0,Math.min(10,run.morale+chosen.morale)),
  security:Math.max(0,Math.min(10,run.security+chosen.security))};
 if(next.stage!==5)return saved(s,id,next,task.title+": "+chosen.label+". Avance para outro posto.");
 const outcome:ShelterOutcome={stages:5,turns:next.turn,xp:reward(next.morale,next.security),
  morale:next.morale,security:next.security,resupplies:next.resupplies,
  choices:next.choices,doctrine:doctrine(next.choices)};
 const active={...s.active};delete active[id];
 return {ok:true,state:{version:1,active,completed:{...s.completed,[id]:outcome}},
  xp:outcome.xp,message:"Rede de proteção estabilizada sob gestão "+outcome.doctrine+
  ". Moral "+outcome.morale+"/10. Segurança "+outcome.security+"/10. +"+outcome.xp+" XP."};
}
export function shelterFrame(stage:number,turn:number):number{
 return Math.max(0,Math.min(19,stage*4+Math.floor(turn/3)%4));
}
/** Menor caminho segundo penalidade real de perigo, sem teleporte. */
export function planShelterRoute(id:ExpansionInnerId,run:ShelterRun){
 const map=shelterMap(id),goal=SHELTER_GOALS[run.stage]??{x:7,y:1};
 const start=gridKey(run.x,run.y),end=gridKey(goal.x,goal.y);
 const scores=new Map<string,number>([[start,0]]),prev=new Map<string,string>(),queue=new Set([start]);
 while(queue.size){
  const current=[...queue].sort((a,b)=>(scores.get(a)??Infinity)-(scores.get(b)??Infinity))[0]!;
  queue.delete(current);if(current===end)break;
  const [xs,ys]=current.split(",");const x=Number(xs),y=Number(ys);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]] as const){
   const nx=x+dx,ny=y+dy,neighbor=gridKey(nx,ny);
   if(!cell(nx,ny)||map.blocked.has(neighbor))continue;
   const cost=(scores.get(current)??Infinity)+1+(map.hazards.has(neighbor)?3:0);
   if(cost<(scores.get(neighbor)??Infinity)){scores.set(neighbor,cost);prev.set(neighbor,current);queue.add(neighbor);}
  }
 }
 const steps:{x:number;y:number}[]=[];let current=end;
 while(current!==start&&prev.has(current)&&steps.length<64){
  const [xs,ys]=current.split(",");steps.unshift({x:Number(xs),y:Number(ys)});current=prev.get(current)!;
 }
 return {steps:current===start?steps:[],risk:scores.get(end)??Infinity,goal};
}
