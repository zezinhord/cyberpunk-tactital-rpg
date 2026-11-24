/** Each council scenario has one physical, once-per-combat field terminal.
 * The original arena terminal is unchanged. These effects use existing,
 * tested combat state fields rather than an extra hidden stat wallet.
 */
import type {GameState} from "../types.ts";
import type {TacticalSite} from "./tactical-maps.ts";

export const SIEGE_TERMINAL_NAMES:Readonly<Record<TacticalSite,string>>={
 water:"Válvula de água",
 furnace:"Freio da caldeira",
 records:"Console de provas",
 ventilation:"Fluxo de ar",
 quarantine:"Veto médico",
 broadcast:"Transmissor livre",
 road:"Sinal de resgate",
};
export interface SiegeTerminalEffect{
 name:string;message:string;energy:number;
}
export function activateSiegeTerminal(state:GameState,site:TacticalSite):
 SiegeTerminalEffect{
 const before=state.energy;
 const refill=(amount:number):number=>{
  state.energy=Math.min(state.maxEnergy,state.energy+amount);
  return state.energy-before;
 };
 const name=SIEGE_TERMINAL_NAMES[site];
 switch(site){
  case "water":{
   const healed=Math.min(4,state.units.find(u=>u.id==="runner")?.maxHp??0);
   const player=state.units.find(u=>u.id==="runner");
   const recovery=player?Math.max(0,Math.min(healed,player.maxHp-player.hp)):0;
   if(player)player.hp+=recovery;
   const energy=refill(2);
   return {name,energy,message:"Válvula aberta: +"+recovery+" Vida e +"+energy+
     " energia. Moradores mantêm a rede viva."};
  }
  case "furnace":{
   state.enemyJamTurns=Math.max(state.enemyJamTurns,1);
   const energy=refill(2);
   return {name,energy,message:"Freio da Caldeira Nove acionado: circuito hostil travado por um turno. +"+
     energy+" energia."};
  }
  case "records":{
   state.classNextAccuracyBonus+=3;
   const energy=refill(1);
   return {name,energy,message:"Rota de assinaturas verificada: +3 de precisão no próximo ataque. +"+
     energy+" energia."};
  }
  case "ventilation":{
   state.suppressionTurns=0;
   state.movementRemaining+=2;
   const energy=refill(1);
   return {name,energy,message:"Ventilação comunitária restabelecida: supressão cancelada, "+
     "+2 de deslocamento e +"+energy+" energia."};
  }
  case "quarantine":{
   state.barrierTurns=Math.max(state.barrierTurns,2);
   const energy=refill(1);
   return {name,energy,message:"Veto clínico ativado: barreira de proteção por dois turnos e +"+
     energy+" energia."};
  }
  case "broadcast":{
   state.enemyJamTurns=Math.max(state.enemyJamTurns,1);
   const energy=refill(3);
   return {name,energy,message:"Transmissor aberto: comunicação hostil bloqueada por um turno e +"+
     energy+" energia."};
  }
  case "road":{
   state.movementRemaining+=3;
   const energy=refill(1);
   return {name,energy,message:"Sinal de resgate verde: +3 de deslocamento e +"+energy+
     " energia para atravessar o bloqueio."};
  }
 }
}
