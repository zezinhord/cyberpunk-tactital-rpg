/** Seven physically distinct council-defense battlefields.
 * The 8x8 navigation grid, scene objects and firing lanes must be shared by
 * player input, hostile AI and rendering. No global mutable arena singleton.
 * The original test and story encounters retain their proven default layout.
 */
import type {EncounterId,Position} from "../types.ts";

export const TACTICAL_SIEGE_IDS=[
 "council-baixada","council-ferrugem","council-aurea","council-subsolo",
 "council-setor-zero","council-prisma","council-periferia",
] as const;
export type SiegeEncounter=(typeof TACTICAL_SIEGE_IDS)[number];
export type TacticalSite="water"|"furnace"|"records"|"ventilation"|
 "quarantine"|"broadcast"|"road";
export interface TacticalLayout{
 id:SiegeEncounter;site:TacticalSite;title:string;
 /** Hard cover cells; there are no invisible or decorative-only walls. */
 blocked:ReadonlySet<string>;
 playerSpawn:Readonly<Position>;enemySpawn:Readonly<Position>;
 /** Objective terminal is the already-implemented interactable tile. */
 terminal:Readonly<Position>;
}
const name=(x:number,y:number)=>x+","+y;
const positions=(cells:readonly (readonly [number,number])[]):ReadonlySet<string>=>
 new Set(cells.map(([x,y])=>name(x,y)));
const SPAWN_PLAYER={x:1,y:6} as const;
const SPAWN_ENEMY={x:6,y:1} as const;
const TERMINAL={x:0,y:6} as const;
function define(id:SiegeEncounter,site:TacticalSite,title:string,
 cells:readonly (readonly [number,number])[]):TacticalLayout{
 const blocked=positions(cells);
 if(blocked.size!==cells.length)throw Error("Arena contém obstáculos repetidos: "+id);
 for(const key of blocked){
  const [x,y]=key.split(",").map(Number);
  if(x===undefined||y===undefined||x<0||y<0||x>=8||y>=8)
   throw Error("Obstáculo fora da malha 8x8 em "+id);
 }
 for(const [label,point] of [["entrada",SPAWN_PLAYER],["inimigo",SPAWN_ENEMY],
                              ["terminal",TERMINAL]] as const)
  if(blocked.has(name(point.x,point.y)))
   throw Error("A "+label+" está bloqueada em "+id);
 return {id,site,title,blocked,playerSpawn:SPAWN_PLAYER,
   enemySpawn:SPAWN_ENEMY,terminal:TERMINAL};
}
export const TACTICAL_SIEGE_MAPS:Readonly<Record<SiegeEncounter,TacticalLayout>>={
 "council-baixada":define("council-baixada","water","A rede das cisternas",[
  [2,2],[2,3],[5,4],[5,5],[3,1],[4,4],[6,3],[3,6],
 ]),
 "council-ferrugem":define("council-ferrugem","furnace","Caldeira Nove e os trilhos",[
  [3,2],[4,2],[3,3],[4,3],[2,5],[5,5],[4,6],[1,2],
 ]),
 "council-aurea":define("council-aurea","records","Arquivo clínico blindado",[
  [2,1],[2,2],[5,3],[5,4],[3,5],[4,5],[4,1],[6,5],
 ]),
 "council-subsolo":define("council-subsolo","ventilation","Galeria do filtro central",[
  [2,1],[2,2],[2,4],[4,3],[4,4],[5,5],[6,5],[3,6],
 ]),
 "council-setor-zero":define("council-setor-zero","quarantine","Portas de equalização",[
  [3,1],[3,2],[4,4],[4,5],[2,5],[5,2],[6,3],[2,2],
 ]),
 "council-prisma":define("council-prisma","broadcast","Estúdio da transmissão livre",[
  [3,3],[4,3],[3,4],[4,4],[2,2],[5,5],[1,3],[6,4],
 ]),
 "council-periferia":define("council-periferia","road","Estrada do corredor de socorro",[
  [2,2],[2,3],[4,4],[5,4],[3,5],[6,4],[4,1],[1,2],
 ]),
};
export function isSiegeEncounter(raw:unknown):raw is SiegeEncounter{
 return typeof raw==="string"&&
  Object.prototype.hasOwnProperty.call(TACTICAL_SIEGE_MAPS,raw);
}
export function layoutForEncounter(encounter:EncounterId):TacticalLayout|null{
 return isSiegeEncounter(encounter)?TACTICAL_SIEGE_MAPS[encounter]:null;
}
