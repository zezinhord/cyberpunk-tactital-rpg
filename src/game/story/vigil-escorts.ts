/** OPERAÇÃO VIGÍLIA — twenty-eight original escort / civilian-rescue missions.
 * Four rescue parties, actively moving enemy observation squads, real 8×8
 * obstacles, adjustable movement posture, finite field energy, diversions,
 * retreat pressure and injury-aware XP. Physical decisions are saved at every
 * turn, isolated per player, and available for JSON backup.
 */
import {EXPANSION_ROOM_DESIGNS,type ExpansionInnerId} from "../districts/expansion-interiors.ts";
import {COUNCIL_IDS,type CouncilId} from "./district-councils.ts";
import type {PerimeterState} from "./perimeter-routes.ts";
import {layoutForRoom as perimeterLayout} from "./perimeter-routes.ts";

export const VIGIL_KEY="cyberpunk-tactical-rpg.vigil-v20.v1.";
export const VIGIL_GROUPS=4;
export const VIGIL_ART_FRAMES=16;
export const VIGIL_BASE_XP=168;
export type VigilApproach="normal"|"furtivo"|"corrida";
export interface VigilCell{x:number;y:number}
export interface VigilRun{
 x:number;y:number;turn:number;energy:number;alert:number;rescued:number;
 incidents:number;retreats:number;decoyUntil:number;
}
export interface VigilOutcome{
 turns:number;rescued:4;incidents:number;retreats:number;xp:number;
}
export interface VigilProgress{
 version:1;
 active:Partial<Record<ExpansionInnerId,VigilRun>>;
 completed:Partial<Record<ExpansionInnerId,VigilOutcome>>;
}
export const EMPTY_VIGIL:Readonly<VigilProgress>={version:1,active:{},completed:{}};
const ROOM_IDS=new Set<string>(EXPANSION_ROOM_DESIGNS.map(r=>r.id));
const ROOMS=Object.fromEntries(EXPANSION_ROOM_DESIGNS.map(r=>[r.id,r])) as
 Record<ExpansionInnerId,(typeof EXPANSION_ROOM_DESIGNS)[number]>;
const SPACE=8;
const ENTRY={x:0,y:7} as const;
const EXIT={x:7,y:1} as const;
const ROUTES:readonly (readonly (readonly [number,number])[])[]=[
 [[0,7],[1,7],[2,7],[2,6],[3,6],[3,5],[4,5],[4,4],[5,4],[5,3],[6,3],[6,2],[7,2],[7,1]],
 [[0,7],[0,6],[1,6],[2,6],[3,6],[3,5],[3,4],[4,4],[4,3],[5,3],[5,2],[6,2],[7,2],[7,1]],
 [[0,7],[1,7],[1,6],[1,5],[2,5],[3,5],[3,4],[4,4],[5,4],[5,3],[5,2],[6,2],[7,2],[7,1]],
 [[0,7],[0,6],[1,6],[1,5],[2,5],[2,4],[3,4],[4,4],[5,4],[5,3],[6,3],[6,2],[7,2],[7,1]],
];
const GROUP_ROUTE_INDICES=[3,5,9,11] as const;
const cellKey=(x:number,y:number)=>x+","+y;
const at=(a:VigilCell,b:VigilCell)=>a.x===b.x&&a.y===b.y;
const distance=(a:VigilCell,b:VigilCell)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const validCoord=(n:unknown):n is number=>typeof n==="number"&&
 Number.isInteger(n)&&n>=0&&n<SPACE;
const validBound=(n:unknown,max:number)=>typeof n==="number"&&
 Number.isInteger(n)&&n>=0&&n<=max;
const seeded=(raw:string):number=>{
 let seed=2166136261;
 for(const ch of raw){seed^=ch.charCodeAt(0);seed=Math.imul(seed,16777619);}
 return seed>>>0;
};
const regionFor=(room:ExpansionInnerId):CouncilId=>{
 const id=COUNCIL_IDS.find(d=>room.startsWith(d+"-"));
 if(!id)throw Error("Área de resgate sem distrito.");
 return id;
};
export interface VigilMap{
 id:ExpansionInnerId;title:string;entry:VigilCell;exit:VigilCell;
 corridor:readonly VigilCell[];groups:readonly VigilCell[];
 blocked:ReadonlySet<string>;hotspots:ReadonlySet<string>;
 guardStations:readonly VigilCell[];
}
const REGION_SURVIVORS:Readonly<Record<CouncilId,readonly [string,string,string,string]>>={
 baixada:["Famílias do canal","Técnicos dos hidrômetros","Pacientes da clínica","Guardiões da cisterna"],
 ferrugem:["Operários da caldeira","Equipe de segurança","Motoristas de carga","Conselheiros sindicais"],
 aurea:["Pacientes sem credencial","Funcionários da triagem","Arquivistas públicos","Médicos denunciantes"],
 subsolo:["Famílias das galerias","Responsáveis pelos filtros","Equipe da enfermaria","Moradores sem cadastro"],
 "setor-zero":["Pacientes em isolamento","Enfermeiros da contenção","Testemunhas clínicas","Técnicos do veto"],
 prisma:["Testemunhas protegidas","Operadores de transmissão","Equipe do palco","Arquivistas da rádio"],
 periferia:["Motoristas de ambulância","Agricultores da estufa","Civis das caravanas","Socorristas do viaduto"],
};
export function vigilGroupNames(room:ExpansionInnerId):readonly [string,string,string,string]{
 return REGION_SURVIVORS[regionFor(room)];
}
export function mapForVigil(room:ExpansionInnerId):VigilMap{
 if(!ROOM_IDS.has(room))throw Error("Interior de vigília inexistente.");
 const seed=seeded(room);
 const route=ROUTES[(seed>>>3)%ROUTES.length]!;
 const corridor=route.map(([x,y])=>({x,y}));
 const safe=new Set(corridor.map(p=>cellKey(p.x,p.y)));
 const groups=GROUP_ROUTE_INDICES.map(index=>corridor[index]!);
 const prior=perimeterLayout(room);
 const blocked=new Set([...prior.blocked].filter(key=>!safe.has(key)));
 for(let i=0;i<SPACE*SPACE;i++){
  const x=i%SPACE,y=Math.floor(i/SPACE),key=cellKey(x,y);
  if(safe.has(key)||blocked.has(key))continue;
  const n=(seed^Math.imul(i+1,0x9e3779b1))>>>0;
  if((n+i*7)%11<2)blocked.add(key);
 }
 const hotspots=new Set<string>();
 const possible:VigilCell[]=[];
 for(let y=0;y<SPACE;y++)for(let x=0;x<SPACE;x++){
  const key=cellKey(x,y);
  if(safe.has(key)||blocked.has(key))continue;
  const cell={x,y};
  const n=(seed^Math.imul(y*SPACE+x+13,0x85ebca6b))>>>0;
  if((n+y)%7===0)hotspots.add(key);
  if(x>0&&x<7&&y>0&&y<7&&
     corridor.some(p=>distance(cell,p)<=2))possible.push(cell);
 }
 possible.sort((a,b)=>((seed^Math.imul(a.x+8*a.y+19,0x9e3779b1))>>>0)-
    ((seed^Math.imul(b.x+8*b.y+19,0x9e3779b1))>>>0));
 const guardStations:VigilCell[]=[];
 for(const candidate of possible){
  if(guardStations.every(other=>distance(other,candidate)>=2))
   guardStations.push(candidate);
  if(guardStations.length===3)break;
 }
 if(guardStations.length!==3)throw Error("Vigília sem três pontos de observação: "+room);
 return {id:room,title:ROOMS[room].title,entry:ENTRY,exit:EXIT,
   corridor,groups,blocked,hotspots,guardStations};
}
/** Three active, deterministic sentries move every action; their patrol
 * positions are reproducible after a game reload (no random reroll abuse).
 */
export function vigilGuards(room:ExpansionInnerId,turn:number):readonly VigilCell[]{
 const map=mapForVigil(room);
 return map.guardStations.map((home,index)=>{
  const sequence:readonly (readonly [number,number])[]=[
   [0,0],[0,1],[1,0],[0,-1],[-1,0],[0,0],[-1,0],[0,1],
  ];
  const offset=sequence[(turn+index*3)%sequence.length]!;
  const probe={x:home.x+offset[0],y:home.y+offset[1]};
  if(validCoord(probe.x)&&validCoord(probe.y)&&
     !map.blocked.has(cellKey(probe.x,probe.y))&&
     !map.corridor.some(p=>at(p,probe)))return probe;
  return home;
 });
}
function validateRun(raw:unknown,room:ExpansionInnerId):raw is VigilRun{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const a=raw as Record<string,unknown>;
 if(Object.keys(a).some(k=>!["x","y","turn","energy","alert","rescued","incidents","retreats","decoyUntil"].includes(k)))return false;
 if(!validCoord(a.x)||!validCoord(a.y)||
  !validBound(a.turn,100000)||!validBound(a.energy,8)||
  !validBound(a.alert,6)||!validBound(a.rescued,15)||
  !validBound(a.incidents,6)||!validBound(a.retreats,1000)||
  !validBound(a.decoyUntil,100005)||
  Number(a.decoyUntil)>Number(a.turn)+3)return false;
 return !mapForVigil(room).blocked.has(cellKey(a.x,a.y));
}
function validateOutcome(raw:unknown):raw is VigilOutcome{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const r=raw as Record<string,unknown>;
 if(Object.keys(r).some(k=>!["turns","rescued","incidents","retreats","xp"].includes(k)))return false;
 if(r.rescued!==4||!validBound(r.turns,100000)||
   !validBound(r.incidents,6)||!validBound(r.retreats,1000))return false;
 return r.xp===Math.max(108,VIGIL_BASE_XP-Number(r.incidents)*10);
}
export function validVigil(raw:unknown):raw is VigilProgress{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const data=raw as Record<string,unknown>;
 if(data.version!==1||Object.keys(data).some(k=>!["version","active","completed"].includes(k))||
  !data.active||typeof data.active!=="object"||Array.isArray(data.active)||
  !data.completed||typeof data.completed!=="object"||Array.isArray(data.completed))return false;
 const active=Object.entries(data.active),done=Object.entries(data.completed);
 if(active.length>28||done.length>28)return false;
 return done.every(([id,entry])=>ROOM_IDS.has(id)&&validateOutcome(entry))&&
  active.every(([id,entry])=>ROOM_IDS.has(id)&&
   !Object.prototype.hasOwnProperty.call(data.completed,id)&&
   validateRun(entry,id as ExpansionInnerId));
}
export function readVigil(characterId:string):VigilProgress{
 if(!characterId)return {version:1,active:{},completed:{}};
 try{
  const value=globalThis.localStorage?.getItem(VIGIL_KEY+characterId);
  const raw:unknown=value?JSON.parse(value):null;
  return validVigil(raw)?raw:{version:1,active:{},completed:{}};
 }catch{return {version:1,active:{},completed:{}};}
}
export function saveVigil(characterId:string,state:VigilProgress):boolean{
 if(!characterId||!validVigil(state))return false;
 try{
  if(!globalThis.localStorage)return false;
  globalThis.localStorage.setItem(VIGIL_KEY+characterId,JSON.stringify(state));
  return true;
 }catch{return false;}
}
export function vigilUnlocked(perimeter:PerimeterState,room:ExpansionInnerId):boolean{
 return Boolean(perimeter.completed[room]);
}
export function vigilRun(state:VigilProgress,room:ExpansionInnerId):VigilRun|null{
 return state.active[room]??null;
}
export function countEvacuated(bits:number):number{
 return [1,2,4,8].filter(bit=>(bits&bit)!==0).length;
}
export type VigilResult={ok:boolean;state:VigilProgress;message:string;xp:number};
const fail=(state:VigilProgress,message:string):VigilResult=>({ok:false,state,message,xp:0});
function commit(state:VigilProgress,room:ExpansionInnerId,run:VigilRun,
 message:string):VigilResult{
 return {ok:true,state:{version:1,completed:{...state.completed},
  active:{...state.active,[room]:run}},message,xp:0};
}
export function startVigil(state:VigilProgress,perimeter:PerimeterState,
 room:ExpansionInnerId):VigilResult{
 if(!ROOM_IDS.has(room)||!vigilUnlocked(perimeter,room))
  return fail(state,"Conclua a Operação Limiar deste interior para abrir a evacuação.");
 if(state.completed[room])return fail(state,"Este resgate já foi concluído. Recompensas não se repetem.");
 if(state.active[room])return fail(state,"A missão está em andamento; continue pelo mapa.");
 const run:VigilRun={x:ENTRY.x,y:ENTRY.y,turn:0,energy:6,alert:0,
  rescued:0,incidents:0,retreats:0,decoyUntil:0};
 return commit(state,room,run,
  "Operação Vigília iniciada: encontre quatro grupos, proteja os civis e alcance a saída.");
}
function postPressure(state:VigilProgress,room:ExpansionInnerId,run:VigilRun,
 message:string):VigilResult{
 if(run.alert<7)return commit(state,room,run,message);
 const map=mapForVigil(room);
 const reached=map.groups.filter((_,i)=>(run.rescued&(1<<i))!==0);
 const checkpoint=reached.at(-1)??map.entry;
 const penalty=Math.min(6,run.incidents+1);
 const retreat:VigilRun={...run,x:checkpoint.x,y:checkpoint.y,alert:2,
  energy:Math.max(2,run.energy-1),incidents:penalty,retreats:run.retreats+1,
  decoyUntil:0};
 return commit(state,room,retreat,
  "Alarme crítico. A escolta recuou ao último posto, e uma pessoa precisou de atendimento. "+
  "Grupos encontrados continuam protegidos.");
}
function intensity(room:ExpansionInnerId,p:VigilCell,turn:number):number{
 return vigilGuards(room,turn).reduce((max,guard)=>Math.max(max,
    distance(guard,p)===0?3:distance(guard,p)===1?2:distance(guard,p)===2?1:0),0);
}
export function moveVigil(state:VigilProgress,room:ExpansionInnerId,
 x:number,y:number,approach:VigilApproach="normal"):VigilResult{
 const run=state.active[room];
 if(!run)return fail(state,"Abra a operação antes de atravessar o setor.");
 if(!validCoord(x)||!validCoord(y)||!["normal","furtivo","corrida"].includes(approach))
  return fail(state,"Movimento inválido.");
 const step=distance(run,{x,y});
 if(step!==1&&!(approach==="corrida"&&step===2&&(run.x===x||run.y===y)))
  return fail(state,"Selecione uma casa adjacente, ou duas em linha reta com corrida.");
 const map=mapForVigil(room);
 const mid={x:Math.floor((run.x+x)/2),y:Math.floor((run.y+y)/2)};
 if(map.blocked.has(cellKey(x,y))||
   (step===2&&map.blocked.has(cellKey(mid.x,mid.y))))
  return fail(state,"Uma estrutura bloqueia esta rota.");
 const cost=approach==="furtivo"||approach==="corrida"?1:0;
 if(run.energy<cost)return fail(state,"Falta energia. Use Reorganizar antes de avançar.");
 const nextTurn=run.turn+1;
 const alarmFromGuard=nextTurn<=run.decoyUntil?0:intensity(room,{x,y},nextTurn);
 const danger=map.hotspots.has(cellKey(x,y))?1:0;
 const increase=approach==="furtivo"?0:
  approach==="corrida"?2+danger+alarmFromGuard:
  danger+alarmFromGuard;
 const next:VigilRun={...run,x,y,turn:nextTurn,
  energy:run.energy-cost,
  alert:Math.max(0,Math.min(7,run.alert+increase-(approach==="furtivo"?1:0)))};
 if(at({x,y},map.exit)&&run.rescued===15&&next.alert<7){
  const wounds=Math.min(6,run.incidents);
  const xp=Math.max(108,VIGIL_BASE_XP-wounds*10);
  const record:VigilOutcome={turns:nextTurn,rescued:4,incidents:wounds,
    retreats:run.retreats,xp};
  const active={...state.active};delete active[room];
  return {ok:true,state:{version:1,active,completed:{...state.completed,[room]:record}},
   message:"Quatro grupos extraídos em "+nextTurn+" turnos. "+
    (wounds?"Houve "+wounds+" incidentes clínicos. ":"Todos atravessaram sem ferimentos. ")+
    "+"+xp+" XP registrados para este protagonista.",xp};
 }
 if(at({x,y},map.exit)&&run.rescued!==15)
  return fail(state,"A saída está livre, mas ainda existem grupos a resgatar.");
 return postPressure(state,room,next,increase>0?
  "Patrulha hostil detectou movimentação. Alerta +"+increase+".":
  "Avanço registrado; as equipes permanecem em cobertura.");
}
export function rescueVigil(state:VigilProgress,room:ExpansionInnerId):VigilResult{
 const run=state.active[room];
 if(!run)return fail(state,"A missão de evacuação não foi iniciada.");
 const map=mapForVigil(room);
 const index=map.groups.findIndex(p=>at(run,p));
 if(index<0)return fail(state,"Aproxime-se de um dos quatro grupos na planta.");
 if((run.rescued&(1<<index))!==0)
  return fail(state,"Este grupo já está protegido.");
 if(run.energy===0)return fail(state,"Energia insuficiente para estabilizar o grupo.");
 const rescued=run.rescued|(1<<index), names=vigilGroupNames(room);
 const next:VigilRun={...run,turn:run.turn+1,rescued,energy:Math.min(8,run.energy+2),
  alert:Math.max(0,run.alert-1)};
 return commit(state,room,next,names[index]+
  " incorporados à escolta. Reorganização de suprimentos: energia +2, alerta -1. "+
  countEvacuated(rescued)+"/4 grupos protegidos.");
}
export function divertVigil(state:VigilProgress,room:ExpansionInnerId):VigilResult{
 const run=state.active[room];if(!run)return fail(state,"Operação inativa.");
 if(run.energy<2)return fail(state,"Distração precisa de duas cargas de energia.");
 const turn=run.turn+1;
 const next:VigilRun={...run,turn,energy:run.energy-2,
  alert:Math.max(0,run.alert-3),decoyUntil:turn+3};
 return commit(state,room,next,
  "Isca eletrônica acionada: vigias desviados nos próximos três turnos. Alerta -3.");
}
export function reorganizeVigil(state:VigilProgress,room:ExpansionInnerId):VigilResult{
 const run=state.active[room];if(!run)return fail(state,"Operação inativa.");
 if(run.energy>=8)return fail(state,"A energia já está completa.");
 const nextTurn=run.turn+1;
 const guard=intensity(room,{x:run.x,y:run.y},nextTurn);
 const pressure=nextTurn<=run.decoyUntil?0:Math.min(1,guard);
 return postPressure(state,room,{...run,turn:nextTurn,
  energy:Math.min(8,run.energy+2),alert:Math.min(7,run.alert+pressure)},
  "Equipe reorganizada: duas cargas recuperadas."+
   (pressure?" A vigia próxima elevou a suspeita.":""));
}
export function vigilFrame(run:VigilRun|null):number{
 if(!run)return 0;
 return Math.min(15,Math.min(3,countEvacuated(run.rescued))*4+(run.turn%4));
}
