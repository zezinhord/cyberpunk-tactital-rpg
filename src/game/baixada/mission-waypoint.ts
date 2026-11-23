/** Contextual waypoint for the introductory V-09 investigation.
 * Shows only the NEXT known destination. Never exposes future plot beats
 * or tries to replace the campaign journal / player's choices.
 */
import {ACTOR_TILES} from "./layout.ts";
export type MissionWaypointActor=keyof typeof ACTOR_TILES|"lia";
export interface V09WaypointState{
 step:number;
 hasSewerEvidence:boolean;
 patioConsoleRead:boolean;
 sentinelDefeated:boolean;
 evidenceReported:boolean;
}
export interface MissionWaypoint{
 actorId:MissionWaypointActor;
 label:string;
}
export function firstMissionWaypoint(state:V09WaypointState):MissionWaypoint|null{
 if(!Number.isInteger(state.step)||state.step<0||state.step>3)return null;
 if(state.step<=2)
  return {actorId:"enter-clinic",label:"Clínica Comunitária · Dra. Amara"};
 if(!state.sentinelDefeated&&!state.hasSewerEvidence)
  return {actorId:"enter-sewer-drain",label:"Pátio do Reúso · acesso à drenagem"};
 if(!state.sentinelDefeated&&!state.patioConsoleRead)
  return {actorId:"patio-console",label:"Pátio do Reúso · console V-09"};
 if(!state.sentinelDefeated)
  return {actorId:"patio-sentinel",label:"Pátio do Reúso · sentinela V-09"};
 if(!state.evidenceReported)
  return {actorId:"lia",label:"Pátio do Reúso · Lia"};
 return null;
}
