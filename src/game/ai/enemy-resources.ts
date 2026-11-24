/** Tactical enemy devices are finite, auditable, and renewed only for a
 * NEW enemy/wave. A missed attempt still consumes a charge; status effects
 * apply only after a legal hit. No real-time timer or network required.
 */
import type {EnemyRole} from "../tactics.ts";
export type TacticalDevice="suppression"|"sabotage";
export interface EnemyTacticPool{
 role:EnemyRole;charges:number;cooldown:number;
}
export interface EnemyDeviceDecision{
 device:TacticalDevice|null;next:EnemyTacticPool;reason:string;
}
export function capacityForEnemy(role:EnemyRole):number{
 return role==="suppressor"||role==="saboteur"?2:0;
}
export function initializeEnemyTactics(role:EnemyRole):EnemyTacticPool{
 return {role,charges:capacityForEnemy(role),cooldown:0};
}
/** Runs exactly once on each enemy turn, including JAM/blocked turns.
 * On use: charge -1, cooldown 1 (the NEXT enemy turn is basic attack).
 */
export function enemyTacticTurn(
 current:EnemyTacticPool,role:EnemyRole,canFire:boolean,
 availableEnergy:number
):EnemyDeviceDecision{
 const pool=current.role===role?current:initializeEnemyTactics(role);
 const cooled:EnemyTacticPool={...pool,cooldown:Math.max(0,pool.cooldown-1)};
 if(!canFire)return {device:null,next:cooled,reason:"Sem ataque legal"};
 if(pool.cooldown>0)return {device:null,next:cooled,reason:"Dispositivo em recarga"};
 if(pool.charges<=0)return {device:null,next:cooled,reason:"Dispositivo sem cargas"};
 if(role==="saboteur"&&availableEnergy<=0)
  return {device:null,next:cooled,reason:"Alvo sem energia para sabotar"};
 const device=role==="suppressor"?"suppression":
  role==="saboteur"?"sabotage":null;
 if(!device)return {device:null,next:cooled,reason:"Perfil sem dispositivo"};
 return {device,next:{...cooled,charges:pool.charges-1,cooldown:1},
  reason:"Dispositivo consumiu 1 carga, independentemente do acerto"};
}
