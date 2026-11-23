/** Nova Arcádia: bounded, reproducible tactical cognition. No network/LLM.
 * Hierarchical FSM: unaware -> suspicious -> (investigate | search)
 *   -> engaged -> (attack | cover | retreat).
 * Utility scores choose between legal actions, reusing existing A* / cover
 * and enemy role profiles. Vision NEVER accesses occluded player coordinates.
 */
import type {Position,Unit} from "../types.ts";
import type {TacticalLayout} from "../combat/tactical-maps.ts";
import {BOARD_WIDTH,BOARD_HEIGHT,findPath,hasLineOfSight,
  isBlocked,coverArmorBonus} from "../map.ts";
import {manhattan,planEnemyTurn,type EnemyProfile,type EnemyPlan} from "../tactics.ts";

export type Awareness="patrol"|"suspicious"|"investigate"|"search"|"engaged"|"retreat";
export type Temperament="aggressive"|"defensive"|"opportunist"|"disciplined"|"stealthy"|"support";
export interface HearingEvent {at:Position;strength:number;round:number}
export interface Perception {saw:boolean;heard:boolean;lastKnown:Position|null;reason:string}
export interface EnemyMemory {
 awareness:Awareness;lastKnown:Position|null;lastSeenRound:number;
 lastKnownRound:number;lastKnownSense:"visual"|"sound"|null;
 searchRounds:number;noise:HearingEvent|null;sequence:number;
}
export interface BrainDecision {
 plan:EnemyPlan;memory:EnemyMemory;perception:Perception;
 selected:"attack"|"cover"|"flank"|"retreat"|"investigate"|"patrol"|"hold";
 reason:string;
}
const copy=(p:Position):Position=>({x:p.x,y:p.y});
const stationary=(at:Position,intent:string):EnemyPlan=>({
 action:"blocked",target:copy(at),mode:"melee",cover:"none",intent});
const maxVision=6;
export function initialEnemyMemory():EnemyMemory{
 return {awareness:"patrol",lastKnown:null,lastSeenRound:-1,
  lastKnownRound:-1,lastKnownSense:null,
  searchRounds:0,noise:null,sequence:0};
}
/** Noise is transmitted only if the action happened, not by the future
 * destination in a click preview. Loud attacks travel farther than footsteps.
 */
export function hearEnemy(memory:EnemyMemory,at:Position,round:number,
 strength:number):EnemyMemory{
 if(!Number.isFinite(strength)||strength<=0)return memory;
 return {...memory,noise:{at:copy(at),round,strength:Math.min(8,strength)}};
}
export function enemyTemperament(role:EnemyProfile["role"]):Temperament{
 switch(role){
  case "helix":return "disciplined";
  case "hunter":return "aggressive";
  case "sniper":return "defensive";
  case "suppressor":return "support";
  case "saboteur":return "stealthy";
  case "drone":return "opportunist";
  default:return "aggressive";
 }
}
const canSee=(enemy:Unit,player:Unit,layout:TacticalLayout|null):boolean=>
 manhattan(enemy,player)<=Math.max(profileVisionLimit(enemy),0)&&
 hasLineOfSight(enemy,player,layout);
const profileVisionLimit=(_enemy:Unit)=>maxVision;
const reachable=(enemy:Unit,units:Unit[],mobility:number,layout:TacticalLayout|null):{
 pos:Position;cost:number}[]=>{
 const positions:{pos:Position;cost:number}[]=[];
 for(let y=0;y<BOARD_HEIGHT;y++)for(let x=0;x<BOARD_WIDTH;x++){
  const pos={x,y};if(isBlocked(pos,layout))continue;
  if(manhattan(enemy,pos)>mobility)continue;
  const path=findPath(enemy,pos,units,enemy.id,layout);
  if(path&&path.length>1&&path.length-1<=mobility)
   positions.push({pos,cost:path.length-1});
 }
 return positions;
};
/** Visibility only if actual unobstructed line and distance. Even when the
 * engine knows the player's true coordinates, decision utilities do not.
 */
export function decideEnemy(
 enemy:Unit,player:Unit,units:Unit[],profile:EnemyProfile,
 memory:EnemyMemory,round:number,layout:TacticalLayout|null=null
):BrainDecision{
 const sight=canSee(enemy,player,layout);
 const sound=memory.noise&&memory.noise.round>=round-2&&
    manhattan(enemy,memory.noise.at)<=memory.noise.strength;
 const heard=Boolean(sound);
 const seen=sight?copy(player):null;
 const newKnowledge=seen??(heard?copy(memory.noise!.at):null);
 // Remember HEARD locations for 2 rounds and SEEN locations for 3.
 // Previously a sound vanished after one action if the agent had never
 // directly seen the protagonist (lastSeenRound was still -1).
 const maxAge=memory.lastKnownSense==="sound"?2:3;
 const age=memory.lastKnownRound<0?100:round-memory.lastKnownRound;
 const previous=age<=maxAge?memory.lastKnown:null;
 const target=newKnowledge??previous;
 const perception:Perception={
  saw:sight,heard,lastKnown:target?copy(target):null,
  reason:sight?"Linha de visão confirmada":
    heard?"Ruído percebido":target?"Última posição conhecida":"Sem contato"
 };
 const base:EnemyMemory={
   awareness:sight?"engaged":heard?"investigate":target?"search":"patrol",
   lastKnown:target?copy(target):null,
   lastSeenRound:sight?round:memory.lastSeenRound,
   lastKnownRound:newKnowledge?round:(target?memory.lastKnownRound:-1),
   lastKnownSense:sight?"visual":heard?"sound":
     target?memory.lastKnownSense:null,
   searchRounds:sight?0:Math.min(3,memory.searchRounds+1),
   noise:heard?null:memory.noise,sequence:memory.sequence+1
 };
 const temperament=enemyTemperament(profile.role);
 const hpRatio=enemy.maxHp>0?enemy.hp/enemy.maxHp:1;
 // The hidden player's true tile must not bias PATROL candidates either.
 // Real occupancy is checked by the executor just before committing movement.
 const perceivedOccupancy=sight?units:units.filter(u=>u.id!==player.id);
 const candidates=reachable(enemy,perceivedOccupancy,profile.mobility,layout);
 // Retreat is selected only after VISUAL contact; otherwise it would
 // leak the exact hidden player location into a tactical decision.
 if(sight&&hpRatio<=.32&&temperament!=="aggressive"){
  const retreats=candidates.filter(c=>manhattan(c.pos,player)>manhattan(enemy,player));
  retreats.sort((a,b)=>{
   const utility=(c:typeof a)=>
    (manhattan(c.pos,player)-manhattan(enemy,player))*8+
    coverArmorBonus(player,c.pos,layout)*5-c.cost;
   return utility(b)-utility(a)||a.cost-b.cost||a.pos.y-b.pos.y||a.pos.x-b.pos.x;
  });
  if(retreats.length){
   const p=retreats[0]!.pos;
   return {plan:{action:"reposition",target:copy(p),mode:"ranged",
     cover:"none",intent:"Recuar: integridade crítica"},
    memory:{...base,awareness:"retreat"},perception,
    selected:"retreat",reason:"Vida abaixo de 32% e rota segura"};
  }
 }
 if(sight){
  const plan=planEnemyTurn(enemy,player,units,profile,layout);
  return {plan,memory:base,perception,
   selected:plan.action==="attack"?"attack":
     plan.intent.includes("cobertura")?"cover":"flank",
   reason:"Alvo visualmente identificado; "+temperament};
 }
 if(target){
  // Substitute an observed/heard last-known position, never the actual
  // hidden position, in the legacy route planner.
  const ghost={...player,x:target.x,y:target.y};
  // Do not even leak the ACTUAL hidden player's position as an occupied
  // cell into A*: unknown occupancy must be calculated from known targets.
  const perceivedUnits=units.map(unit=>unit.id===player.id?ghost:unit);
  const plan=planEnemyTurn(enemy,ghost,perceivedUnits,profile,layout);
  if(plan.action==="attack"||plan.action==="blocked"||
      plan.target.x===enemy.x&&plan.target.y===enemy.y){
   return {plan:stationary(enemy,"Procurar sinais no último ponto conhecido"),
     memory:base,perception,selected:"hold",
     reason:"Posição investigada sem contato visual"};
  }
  return {plan:{...plan,intent:heard?"Investigar ruído detectado":
     "Investigar último contato visual"},memory:base,perception,
    selected:"investigate",reason:perception.reason};
 }
 // Patrol without a metagame destination or an A* search per render.
 // One deterministic reachable tile, alternating patrol directions.
 const turns=candidates.sort((a,b)=>
   a.cost-b.cost||a.pos.y-b.pos.y||a.pos.x-b.pos.x);
 const pick=turns.length?turns[(memory.sequence*7+3)%turns.length]:null;
 if(!pick)return {plan:stationary(enemy,"Patrulha sem rota disponível"),
   memory:base,perception,selected:"hold",reason:"Nenhuma rota legal"};
 return {plan:{action:"advance",target:copy(pick.pos),
   mode:"melee",cover:"none",intent:"Patrulha e observação"},
   memory:base,perception,selected:"patrol",reason:"Nenhum alvo percebido"};
}
