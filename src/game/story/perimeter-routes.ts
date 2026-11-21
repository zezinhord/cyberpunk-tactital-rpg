/** OPERAÇÃO LIMIAR — real navigable 8×8 grids in 28 interior sectors.
 * Five independent perimeter objectives, persistent route position, alarms
 * and field tools. Every stage requires reaching a real map coordinate and
 * evaluating a contextual choice. 28 independent runs, unique completion XP.
 * This is not a document quiz: move through physical obstacles and hazards.
 */
import {EXPANSION_ROOM_DESIGNS,type ExpansionInnerId} from "../districts/expansion-interiors.ts";
import {COUNCIL_IDS,type CouncilId} from "./district-councils.ts";
import {simulationPhase,type SimulationProgress,SIMULATION_PHASES}
 from "./field-simulations.ts";

export const PERIMETER_KEY="cyberpunk-tactical-rpg.perimeter-v20.v1.";
export const PERIMETER_STAGES=5;
export const PERIMETER_FRAMES=20;
export const PERIMETER_XP=138;
const ROOM_IDS=new Set<string>(EXPANSION_ROOM_DESIGNS.map(r=>r.id));
const ROOMS=Object.fromEntries(EXPANSION_ROOM_DESIGNS.map(r=>[r.id,r]))
 as Record<ExpansionInnerId,(typeof EXPANSION_ROOM_DESIGNS)[number]>;
export type RouteMode="careful"|"normal"|"fast";
export interface Cell{x:number;y:number}
export interface RouteRun{
 x:number;y:number;stage:number;alarm:number;tools:number;steps:number;retries:number;
}
export interface PerimeterState{
 version:1;active:Partial<Record<ExpansionInnerId,RouteRun>>;
 completed:Partial<Record<ExpansionInnerId,true>>;
}
export const EMPTY_PERIMETER:Readonly<PerimeterState>={version:1,active:{},completed:{}};
const ARRIVAL={x:0,y:7} as const;
const EXIT={x:7,y:1} as const;
const TASKS=[
 {x:2,y:6},{x:3,y:5},{x:4,y:4},{x:5,y:3},{x:6,y:2},
] as const;
const SAFE_WALK=[
 [0,7],[1,7],[2,7],[2,6],[3,6],[3,5],
 [4,5],[4,4],[5,4],[5,3],[6,3],[6,2],[7,2],[7,1],
] as const;
const SAFE_CELLS=new Set(SAFE_WALK.map(c=>c[0]+","+c[1]));
const EXTRA_COVER=[
 [0,1],[0,2],[1,1],[1,3],[1,5],[2,0],[2,2],[2,4],
 [3,0],[3,2],[3,7],[4,0],[4,2],[4,7],
 [5,0],[5,1],[5,6],[5,7],[6,0],[6,4],[6,6],[7,3],[7,4],[7,6],
] as const;
const mark=(x:number,y:number)=>x+","+y;
const roomRegion=(room:ExpansionInnerId):CouncilId=>{
 const id=COUNCIL_IDS.find(c=>room.startsWith(c+"-"));
 if(!id)throw Error("Rota sem setor urbano");
 return id;
};
const hash=(s:string):number=>{
 let h=2166136261;
 for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}
 return h>>>0;
};
const ROUTE_OPERATIONS:Record<CouncilId,readonly {
 title:string;prompt:string;options:readonly [string,string,string];
 correct:0|1|2;hint:string;result:string;
}[]>={
 baixada:[
  {title:"Interligar cisternas",prompt:"Dois reservatórios divergem após o desligamento corporativo. Qual ligação mantém o consumo civil?",
   options:["Conectar as saídas sem filtro","Isolar o desvio e testar o fluxo independente","Cortar o fornecimento da clínica"],correct:1,
   hint:"Preserve abastecimento médico e teste vazão independente.",result:"O canal comunitário opera sem desviar a reserva."},
  {title:"Inspecionar comportas",prompt:"Uma comporta tenta fechar contra o fluxo da chuva. Como impedir sobrepressão?",
   options:["Abrir o canal de alívio antes de desacoplar o motor","Forçar o fechamento manualmente","Ignorar o manômetro"],correct:0,
   hint:"A pressão deve cair antes da manutenção.",result:"A comporta mantém curso seguro."},
  {title:"Resguardar a passagem",prompt:"Famílias tentam cruzar uma passarela com condutores expostos.",
   options:["Aumentar corrente na ponte","Recolher os cabos por baixo da estrutura energizada","Desenergizar só o vão afetado e criar corredor lateral"],correct:2,
   hint:"Isole apenas a seção de risco.",result:"A passagem fica acessível sem interromper o reservatório."},
  {title:"Salvar os registros",prompt:"O arquivo local conserva versões diferentes da tabela de água.",
   options:["Apagar a versão anterior","Preservar os dois estados com horário e origem","Publicar consumo nominal dos moradores"],correct:1,
   hint:"Versões independentes permitem conferir intervenções.",result:"A disputa de abastecimento permanece documentada."},
  {title:"Abrir a rede",prompt:"O conselho precisa garantir inspeção futura sem expor as casas.",
   options:["Publicar vazão por setor com direito a auditoria","Entregar senhas privadas à Helix","Eliminar o registro de manutenção"],correct:0,
   hint:"A transparência deve preservar os dados dos moradores.",result:"A cooperativa assume a fiscalização da rede."},
 ],
 ferrugem:[
  {title:"Isolar a esteira",prompt:"O sensor indica colisão iminente entre carga e trabalhadores.",
   options:["Acelerar o motor","Cortar os alarmes","Parar só o trecho e testar o freio mecânico"],correct:2,
   hint:"A proteção depende do freio e da parada local.",result:"A carga fica contida fora da rota dos operários."},
  {title:"Reconstituir os turnos",prompt:"Dois relógios mostram horas de manutenção contraditórias.",
   options:["Usar a marcação mecânica e assinaturas independentes","Aceitar o relatório da corporação","Apagar os dois históricos"],correct:0,
   hint:"Provas fora da rede ajudam a reconstruir a jornada.",result:"O livro de turnos volta a ser auditável."},
  {title:"Controlar a fornalha",prompt:"Uma válvula aberta espalha calor pelo corredor de fuga.",
   options:["Aumentar o fluxo quente","Acionar exaustão e fechar a alimentação da seção","Bloquear a única saída"],correct:1,
   hint:"O calor precisa de exaustão e corte localizado.",result:"A rota de fuga volta a ficar transitável."},
  {title:"Proteger a oficina",prompt:"Seguranças tentam recolocar os freios sob comando corporativo.",
   options:["Concentrar civis na esteira","Desligar as luzes dos postos médicos","Preservar o controle manual e a passagem lateral"],correct:2,
   hint:"O freio humano deve permanecer acessível.",result:"A oficina mantém autonomia operacional."},
  {title:"Retomar com direitos",prompt:"Uma proposta exige turnos indefinidos para financiar o reparo.",
   options:["Garantir turnos registrados, revisão e direito à parada","Aceitar jornadas sem limite","Destruir os livros de ponto"],correct:0,
   hint:"A produção deve depender de controle humano e trabalho verificável.",result:"A oficina reabre sob fiscalização dos trabalhadores."},
 ],
 aurea:[
  {title:"Triagem clínica",prompt:"A porta bloqueia pacientes sem credencial empresarial.",
   options:["Adotar a ordem de chegada corporativa","Validar urgência clínica em módulo independente","Divulgar dados de triagem"],correct:1,
   hint:"Urgência médica não depende de vínculo contratual.",result:"O acesso à clínica deixa de depender de credencial."},
  {title:"Cadeia de auditoria",prompt:"Notas fiscais da enfermaria foram alteradas pela Helix.",
   options:["Apagar registros anteriores","Divulgar prontuários","Guardar histórico de lançamento e assinatura independente"],correct:2,
   hint:"A prova precisa preservar correções sem expor pacientes.",result:"Os desvios ficam demonstráveis."},
  {title:"Separar os cabos",prompt:"Dados de atendimento trafegam no mesmo barramento de anúncios.",
   options:["Isolar a linha clínica com prioridade vital","Aumentar banda dos anúncios","Transferir a base de pacientes para publicidade"],correct:0,
   hint:"O atendimento deve ter isolamento e prioridade.",result:"A rede clínica recebe circuito seguro."},
  {title:"Restaurar contestação",prompt:"Uma autorização automática impede pedidos de revisão.",
   options:["Aceitar o bloqueio","Reativar balcão humano e registro de recurso","Excluir todos os pedidos antigos"],correct:1,
   hint:"O direito de contestar requer canal independente.",result:"As revisões voltam a ser aceitas."},
  {title:"Contrato público",prompt:"Uma nova empresa tenta controlar sozinha alterações de gastos.",
   options:["Permitir edições sem registro","Publicar todos os prontuários","Exigir dupla custódia e histórico imutável"],correct:2,
   hint:"Controle compartilhado evita apagar responsabilidades.",result:"O orçamento clínico fica auditável."},
 ],
 subsolo:[
  {title:"Ar respirável",prompt:"Os sensores mostram refluxo no túnel ocupado.",
   options:["Isolar o trecho e equalizar a pressão","Desligar a enfermaria","Abrir todas as comportas"],correct:0,
   hint:"A pressão precisa ser estabilizada por setor.",result:"O ar segue pelo corredor ventilado."},
  {title:"Distribuição dos filtros",prompt:"Uma ordem exige o nome dos moradores para liberar filtros.",
   options:["Revelar toda a população","Registrar somente lote e qualidade do ar","Desligar o sistema"],correct:1,
   hint:"A manutenção não exige cadastro nominal.",result:"Os filtros chegam sem expor residentes."},
  {title:"Rotear a enfermaria",prompt:"A saída de emergência divide a rede elétrica com câmeras invasivas.",
   options:["Desligar tudo","Usar biometria para liberar a fuga","Desvincular câmeras e preservar a alimentação médica"],correct:2,
   hint:"Segurança clínica não necessita vigilância pessoal.",result:"A enfermaria conserva energia e autonomia."},
  {title:"Recolher evidências",prompt:"Uma patrulha tenta eliminar amostras do filtro clandestino.",
   options:["Preservar lotes e contraprova offline","Destruir a amostra","Expor o nome dos técnicos"],correct:0,
   hint:"A rastreabilidade está nas amostras e nos lotes.",result:"O histórico ambiental fica protegido."},
  {title:"Rede subterrânea",prompt:"O acordo exige corredores rastreados permanentemente.",
   options:["Aceitar o rastreio","Registrar apenas fluxo técnico agregado","Fechar o acesso à clínica"],correct:1,
   hint:"Sinalização de trânsito não depende de perfis pessoais.",result:"Os túneis permanecem acessíveis."},
 ],
 "setor-zero":[
  {title:"Porta de isolamento",prompt:"A ordem de confinamento contradiz o veto médico local.",
   options:["Priorizar controle automático","Aumentar a pressão da câmara","Aplicar revisão médica antes de liberar a porta"],correct:2,
   hint:"O veto clínico deve prevalecer sobre a rotina automatizada.",result:"A passagem fica subordinada à equipe médica."},
  {title:"Energia de suporte",prompt:"O mesmo circuito alimenta respiradores e travas coercitivas.",
   options:["Separar a rede de suporte à vida e testar redundância","Desligar os respiradores","Concentrar energia nas travas"],correct:0,
   hint:"A ventilação clínica não deve depender das portas.",result:"O suporte à vida ganha alimentação própria."},
  {title:"Ventilação forçada",prompt:"Um corredor sofre diferença perigosa de pressão.",
   options:["Abrir simultaneamente as portas","Equalizar gradualmente e abrir uma passagem por vez","Desativar alarmes"],correct:1,
   hint:"Equalização precede circulação.",result:"A pressão retorna à faixa segura."},
  {title:"Custódia de prontuários",prompt:"Uma decisão administrativa apagou revisões antigas.",
   options:["Aceitar o resumo automático","Publicar nomes dos internados","Guardar versões clínicas e assinaturas de revisão"],correct:2,
   hint:"A história dos cuidados precisa ser preservada.",result:"O isolamento irregular torna-se contestável."},
  {title:"Desativação da contenção",prompt:"O conselho exige impedir reativação por uma senha corporativa única.",
   options:["Garantir veto presencial e revisão independente","Confiar no antigo código","Desligar toda a enfermaria"],correct:0,
   hint:"Controle humano e prazos auditáveis limitam o poder.",result:"O Setor Zero deixa de impor confinamento sem revisão."},
 ],
 prisma:[
  {title:"Sinal livre",prompt:"A transmissão comunitária é substituída por publicidade corporativa.",
   options:["Cortar o canal local","Usar linha redundante e registrar a mudança de sinal","Divulgar identidades de fontes"],correct:1,
   hint:"A linha independente mantém o testemunho.",result:"A rádio recupera sua transmissão."},
  {title:"Acervo visual",prompt:"A gravação original e a versão patrocinada divergem.",
   options:["Apagar a cópia original","Confiar no patrocínio","Preservar as versões e identificar os cortes"],correct:2,
   hint:"Uma comparação transparente preserva a memória.",result:"A montagem é documentada."},
  {title:"Retirada da plateia",prompt:"Os cabos do palco ocupam uma saída de emergência.",
   options:["Isolar a iluminação defeituosa e abrir desvio","Fechar todas as portas","Aumentar a potência dos cabos"],correct:0,
   hint:"A rota precisa permanecer livre durante a transmissão.",result:"A plateia atravessa a passagem segura."},
  {title:"Defender o comutador",prompt:"Uma patrulha ameaça interromper a emissão dos testemunhos.",
   options:["Revelar as fontes","Proteger o switch de sinal e evacuar testemunhas","Cortar o microfone comunitário"],correct:1,
   hint:"A segurança exige simultaneamente proteger sinal e pessoas.",result:"A emissão permanece no ar."},
  {title:"Direito de resposta",prompt:"O estúdio precisa registrar correções sem censurar denúncias.",
   options:["Só patrocinadores podem corrigir","Eliminar a sessão de retificação","Abrir pedidos de revisão com fonte protegida"],correct:2,
   hint:"A retificação não deve expor quem denunciou.",result:"A comunicação passa a admitir revisão pública."},
 ],
 periferia:[
  {title:"Ambulância em trânsito",prompt:"A recarga da ambulância é bloqueada por uma exigência de cadastro.",
   options:["Priorizar energia de resgate sem rastreio permanente","Aguardar validação empresarial","Divulgar trajetos médicos"],correct:0,
   hint:"A urgência pode ser verificada sem criar perfil de viagem.",result:"O socorro recebe recarga imediata."},
  {title:"Estufa sem água",prompt:"A bomba continua operando com reservatório vazio.",
   options:["Forçar o rotor","Relacionar potência ao nível medido e prevenir operação a seco","Desligar toda a agricultura"],correct:1,
   hint:"O motor deve obedecer a disponibilidade hídrica.",result:"O fornecimento da estufa é estabilizado."},
  {title:"Passagem da ponte",prompt:"O viaduto possui uma seção parcialmente interditada.",
   options:["Acelerar os caminhões","Usar a pista danificada","Inspecionar sustentação e definir desvio com área de retorno"],correct:2,
   hint:"O desvio precisa permitir recuo de veículos.",result:"A caravana consegue atravessar."},
  {title:"Rede de socorro",prompt:"A central armazena coordenadas de pacientes após o atendimento.",
   options:["Descartar rotas depois do serviço, preservando indicadores gerais","Publicar o histórico","Desligar os rádios"],correct:0,
   hint:"A coordenação não justifica guardar deslocamentos para sempre.",result:"O rádio permanece funcional sem vigilância permanente."},
  {title:"Autonomia das caravanas",prompt:"Uma empresa oferece escolta em troca de geolocalização ilimitada.",
   options:["Aceitar a cessão permanente","Usar telemetria apenas durante entrega, com prazo e auditoria","Abandonar pacientes"],correct:1,
   hint:"A ajuda não deve exigir monitoramento vitalício.",result:"A Periferia mantém acesso independente."},
 ],
};
export interface RouteBrief{
 title:string;prompt:string;options:readonly [string,string,string];correct:0|1|2;
 hint:string;result:string;
}
export interface PerimeterMap{
 id:ExpansionInnerId;name:string;blocked:ReadonlySet<string>;
 hazards:ReadonlySet<string>;stations:readonly Cell[];entrance:Cell;exit:Cell;
}
export function layoutForRoom(room:ExpansionInnerId):PerimeterMap{
 const hashRoom=hash(room);
 const blocked=new Set<string>();
 for(let i=0;i<EXTRA_COVER.length;i++){
  const pair=EXTRA_COVER[i]!;
  if((hashRoom+(i*13)+((hashRoom>>4)&7))%5<2){
   const key=mark(pair[0],pair[1]);
   if(!SAFE_CELLS.has(key))blocked.add(key);
  }
 }
 const hazards=new Set<string>();
 const candidates=[
  [1,6],[1,5],[2,5],[3,6],[3,4],[4,5],[4,3],
  [5,4],[5,2],[6,3],[6,1],[7,2],
 ] as const;
 for(let i=0;i<candidates.length;i++){
  const [x,y]=candidates[i]!;
  if((hashRoom+i*11)%4===0&&!blocked.has(mark(x,y))&&
    !TASKS.some(a=>a.x===x&&a.y===y))hazards.add(mark(x,y));
 }
 return {id:room,name:ROOMS[room].title,blocked,hazards,
   entrance:ARRIVAL,exit:EXIT,stations:TASKS};
}
const isCoord=(v:unknown):v is number=>Number.isInteger(v)&&
 typeof v==="number"&&v>=0&&v<=7;
function isRun(raw:unknown,room:ExpansionInnerId):raw is RouteRun{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const a=raw as Record<string,unknown>;
 if(Object.keys(a).some(x=>!["x","y","stage","alarm","tools","steps","retries"].includes(x))||
  !isCoord(a.x)||!isCoord(a.y)||
  !Number.isInteger(a.stage)||Number(a.stage)<0||Number(a.stage)>5||
  !Number.isInteger(a.alarm)||Number(a.alarm)<0||Number(a.alarm)>5||
  !Number.isInteger(a.tools)||Number(a.tools)<0||Number(a.tools)>6||
  !Number.isInteger(a.steps)||Number(a.steps)<0||Number(a.steps)>100000||
  !Number.isInteger(a.retries)||Number(a.retries)<0||Number(a.retries)>10000)return false;
 return !layoutForRoom(room).blocked.has(mark(a.x,a.y));
}
export function validatePerimeter(raw:unknown):raw is PerimeterState{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const p=raw as Record<string,unknown>;
 if(p.version!==1||Object.keys(p).some(k=>!["version","active","completed"].includes(k))||
  !p.active||typeof p.active!=="object"||Array.isArray(p.active)||
  !p.completed||typeof p.completed!=="object"||Array.isArray(p.completed))return false;
 const active=Object.entries(p.active),done=Object.entries(p.completed);
 if(active.length>28||done.length>28)return false;
 return done.every(([room,v])=>ROOM_IDS.has(room)&&v===true)&&
  active.every(([room,v])=>ROOM_IDS.has(room)&&
   !Object.prototype.hasOwnProperty.call(p.completed,room)&&
   isRun(v,room as ExpansionInnerId));
}
export function readPerimeter(characterId:string):PerimeterState{
 if(!characterId)return {version:1,active:{},completed:{}};
 try{
  const raw=globalThis.localStorage?.getItem(PERIMETER_KEY+characterId);
  const v:unknown=raw?JSON.parse(raw):null;
  return validatePerimeter(v)?v:{version:1,active:{},completed:{}};
 }catch{return {version:1,active:{},completed:{}};}
}
export function savePerimeter(characterId:string,state:PerimeterState):boolean{
 if(!characterId||!validatePerimeter(state))return false;
 try{
  if(!globalThis.localStorage)return false;
  globalThis.localStorage.setItem(PERIMETER_KEY+characterId,JSON.stringify(state));
  return true;
 }catch{return false;}
}
export function perimeterUnlocked(simulations:SimulationProgress,room:ExpansionInnerId):boolean{
 return simulationPhase(simulations,room)===SIMULATION_PHASES;
}
export function currentRoute(state:PerimeterState,room:ExpansionInnerId):RouteRun|null{
 return state.active[room]??null;
}
export function routeBrief(room:ExpansionInnerId,stage:number):RouteBrief|null{
 const entries=ROUTE_OPERATIONS[roomRegion(room)];
 const brief=entries[stage];
 if(!brief)return null;
 return {...brief,prompt:brief.prompt+"\n\nSETOR: "+ROOMS[room].title+
  ". Vestígio local: "+ROOMS[room].machineDetail};
}
export function routeGoal(room:ExpansionInnerId,run:RouteRun):Cell{
 const m=layoutForRoom(room);
 return run.stage>=PERIMETER_STAGES?m.exit:m.stations[run.stage]!;
}
export type RouteAction={ok:boolean;state:PerimeterState;message:string;xp:number};
export function startPerimeter(state:PerimeterState,simulations:SimulationProgress,
 room:ExpansionInnerId):RouteAction{
 if(!ROOM_IDS.has(room)||!perimeterUnlocked(simulations,room))
  return {ok:false,state,message:"Conclua as seis fases da simulação deste local primeiro.",xp:0};
 if(state.completed[room])return {ok:false,state,
  message:"Este perímetro já foi protegido; a recompensa não pode ser duplicada.",xp:0};
 if(state.active[room])return {ok:false,state,
  message:"A patrulha já foi iniciada. Continue pelo mapa físico.",xp:0};
 const run:RouteRun={x:0,y:7,stage:0,alarm:0,tools:3,steps:0,retries:0};
 return {ok:true,state:{version:1,completed:{...state.completed},
   active:{...state.active,[room]:run}},
  message:"Operação Limiar iniciada. Cinco equipamentos exigem intervenção antes da evacuação.",xp:0};
}
export function movePerimeter(state:PerimeterState,room:ExpansionInnerId,
 x:number,y:number,mode:RouteMode="normal"):RouteAction{
 const run=state.active[room];
 if(!run)return {ok:false,state,message:"Abra uma patrulha antes de se deslocar.",xp:0};
 if(!isCoord(x)||!isCoord(y)||!["careful","normal","fast"].includes(mode)||
  Math.abs(x-run.x)+Math.abs(y-run.y)!==1)
  return {ok:false,state,message:"Só é possível avançar uma casa ortogonal por turno.",xp:0};
 const map=layoutForRoom(room);
 if(map.blocked.has(mark(x,y)))return {ok:false,state,
  message:"Estrutura bloqueada. Procure outra passagem.",xp:0};
 const danger=map.hazards.has(mark(x,y));
 if(danger&&mode==="careful"&&run.tools===0)return {ok:false,state,
  message:"Sem cargas de proteção. Use avanço normal, rápido ou reinicie o trecho.",xp:0};
 const charge=mode==="careful"&&danger?1:0;
 const increase=(danger&&(mode!=="careful")?1:0)+(mode==="fast"?1:0);
 const nextAlarm=run.alarm+increase;
 let next:RouteRun={
  ...run,x,y,steps:run.steps+1,
  tools:run.tools-charge,alarm:Math.min(5,nextAlarm),
 };
 let message=danger?(charge?"Campo contornado com proteção.":"Zona hostil atravessada; alerta aumentado."):
  "Posição registrada.";
 if(nextAlarm>=6){
  const last=run.stage===0?ARRIVAL:TASKS[run.stage-1]!;
  next={...run,x:last.x,y:last.y,alarm:2,tools:Math.max(1,run.tools-1),
    steps:run.steps+1,retries:run.retries+1};
  message="Alerta crítico: a patrulha recuou ao último posto seguro, sem perder as provas.";
 }
 const endpoint=run.stage===PERIMETER_STAGES&&x===map.exit.x&&y===map.exit.y&&nextAlarm<6;
 if(endpoint){
  const active={...state.active};delete active[room];
  return {ok:true,state:{version:1,active,completed:{...state.completed,[room]:true}},
   message:"Cinco sistemas protegidos e rota de evacuação liberada. +"+PERIMETER_XP+
    " XP concedidos uma única vez.",xp:PERIMETER_XP};
 }
 return {ok:true,state:{version:1,completed:{...state.completed},
    active:{...state.active,[room]:next}},message,xp:0};
}
export function answerPerimeter(state:PerimeterState,room:ExpansionInnerId,
 choice:number):RouteAction{
 const run=state.active[room];
 if(!run)return {ok:false,state,message:"A patrulha não está ativa.",xp:0};
 const target=routeGoal(room,run);
 if(run.stage>=PERIMETER_STAGES||run.x!==target.x||run.y!==target.y)
  return {ok:false,state,message:"Alcance a estação marcada na planta antes de decidir.",xp:0};
 if(!Number.isInteger(choice)||choice<0||choice>2)return {ok:false,state,
  message:"A opção selecionada é inválida.",xp:0};
 const brief=routeBrief(room,run.stage)!;
 if(choice!==brief.correct){
  const next={...run,alarm:Math.min(5,run.alarm+1)};
  return {ok:true,state:{version:1,completed:{...state.completed},
    active:{...state.active,[room]:next}},
    message:"Intervenção incorreta: "+brief.hint+" Alerta +1.",xp:0};
 }
 const next={...run,stage:run.stage+1,tools:Math.min(6,run.tools+1),
   alarm:Math.max(0,run.alarm-1)};
 return {ok:true,state:{version:1,completed:{...state.completed},
   active:{...state.active,[room]:next}},message:brief.result+
   (next.stage===PERIMETER_STAGES?" Cinco postos seguros; siga até a saída.":
    " Posto protegido; avance até a próxima estação."),xp:0};
}
export function routeFrame(run:RouteRun|null):number{
 if(!run)return 0;
 return Math.min(19,run.stage>=5?19:run.stage*4+(run.steps%4));
}
