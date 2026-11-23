/** Offline citizen schedule. One decision every 1.35s in the lightweight
 * Baixada scene, not on the render loop. No global clock service or network.
 */
export type CitizenPhase="work"|"rest";
export interface CitizenContext{phase:CitizenPhase;alarmed:boolean}
export function citizenPhase(hour:number):CitizenPhase{
 if(!Number.isInteger(hour)||hour<0||hour>23)return "work";
 return hour>=22||hour<6?"rest":"work";
}
export function citizenTickDivider(distance:number):number{
 if(!Number.isFinite(distance))return 3;
 return distance<=14?1:distance<=30?2:3;
}
