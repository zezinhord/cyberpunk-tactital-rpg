/**
 * RC19 — bounded tactical squads, one integrated RPG, no additional renderer.
 * Invariants: test/V-09 stay one-on-one; campaign squads spawn on walkable,
 * distinct tiles; downed allies do not block A*; all enemies in a wave must
 * be neutralized before the canonical quest engine advances once.
 */
import {isBlocked,isInsideBoard,findPath} from "../map.ts";
import type {EncounterId,GameState,Unit,Position} from "../types.ts";
import type {TacticalLayout} from "./tactical-maps.ts";
import type {EnemyProfile} from "../tactics.ts";

export function squadSizeForEncounter(id:EncounterId,wave:number):number{
 if(!Number.isSafeInteger(wave)||wave<1)return 1;
 if(id.startsWith("council-")||id.startsWith("district-"))
  return wave>=2?3:2;
 if(id==="eden-core"||id==="cisma-core"||id==="cisma-containment")
  return wave>=2?3:2;
 if(id==="eden-relay"||id==="cisma-intercept"||id==="trial-3")
  return 2;
 return 1;
}
export const activeEnemies=(state:Pick<GameState,"units">):Unit[]=>
 state.units.filter(unit=>unit.side==="enemy"&&unit.hp>0);
export function targetEnemy(state:Pick<GameState,"units"|"selectedEnemyId">):Unit|undefined{
 const enemies=activeEnemies(state);
 return enemies.find(e=>e.id===state.selectedEnemyId)??enemies[0];
}
export function squadSupportProfile(leader:EnemyProfile,wing:number):EnemyProfile{
 return {
  role:wing%2===0?"hunter":"helix",
  name:wing%2===0?"Batedor de flanco":"Operador de cobertura",
  range:Math.min(4,Math.max(2,leader.range)),
  mobility:2,
  preferredDistance:wing%2===0?2:3,
 };
}
const adjacentOffsets:ReadonlyArray<Readonly<Position>>=[
 {x:0,y:1},{x:1,y:0},{x:-1,y:0},{x:0,y:-1},
 {x:0,y:2},{x:1,y:1},{x:-1,y:1},{x:1,y:2},{x:-1,y:2},
 {x:2,y:0},{x:2,y:1},{x:0,y:3},{x:-2,y:0},{x:2,y:2},
];
export function spawnSquadMembers(
 encounter:EncounterId,wave:number,leader:Unit,player:Unit,
 layout:TacticalLayout|null,
):Unit[]{
 const number=squadSizeForEncounter(encounter,wave)-1;
 if(number<=0)return [];
 const reserved:Unit[]=[player,leader];
 const result:Unit[]=[];
 for(let wing=1;wing<=number;wing++){
  // Candidate order intentionally changes with wave. No random teleportation.
  const candidates=adjacentOffsets.map((_,index)=>
    adjacentOffsets[(index+(wave-1)*3+wing-1)%adjacentOffsets.length]!)
    .map(pos=>({x:leader.x+pos.x,y:leader.y+pos.y}))
    .filter(pos=>isInsideBoard(pos)&&!isBlocked(pos,layout)&&
      !reserved.some(unit=>unit.hp>0&&unit.x===pos.x&&unit.y===pos.y));
  const spot=candidates.find(pos=>Boolean(findPath(leader,pos,
    reserved,leader.id,layout)));
  if(!spot)break; // No fabricated unit on a blocked or occupied tile.
  const hp=7+wave*2;
  const fighter:Unit={
   id:"drone-wing-"+wing,name:wing===1?"Vigia de cobertura":"Batedor de flanco",
   side:"enemy",x:spot.x,y:spot.y,
   hp,maxHp:hp,armorClass:11+wave,attackBonus:2+wave,
  };
  reserved.push(fighter);result.push(fighter);
 }
 return result;
}
