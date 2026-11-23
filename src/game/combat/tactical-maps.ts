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
export type TacticalTerrain="normal"|"rubble"|"water"|"hazard"|"ramp"|"metal"|"shadow";
export type TacticalPropKind="barricade"|"container"|"security-door"|"generator"|"pipe";
export type TacticalPropState="intact"|"damaged"|"disabled"|"destroyed";
export interface TacticalProp{
 id:string;position:Position;kind:TacticalPropKind;
 state:TacticalPropState;hp:number;maxHp:number;
 blocksMovement:boolean;blocksShots:boolean;cover:"partial"|"full";
}
/** One shared blueprint for rules, AI and SVG; instances must be copied per fight. */
export interface TacticalLayout{
 id:EncounterId;site:TacticalSite;title:string;
 blocked:ReadonlySet<string>;
 /** Opaque obstacles block shots; low barricades block walking, not firing. */
 opaque:ReadonlySet<string>;
 terrain:ReadonlyMap<string,TacticalTerrain>;
 heights:ReadonlyMap<string,number>;
 objects:ReadonlyMap<string,TacticalProp>;
 playerSpawn:Readonly<Position>;enemySpawn:Readonly<Position>;
 terminal:Readonly<Position>;
}
const name=(x:number,y:number)=>x+","+y;
const positions=(cells:readonly (readonly [number,number])[]):ReadonlySet<string>=>
 new Set(cells.map(([x,y])=>name(x,y)));
const SPAWN_PLAYER={x:1,y:6} as const;
const SPAWN_ENEMY={x:6,y:1} as const;
const TERMINAL={x:0,y:6} as const;
function define(id:EncounterId,site:TacticalSite,title:string,
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
 // Only true physical props contribute collision, never decorative scenery.
 const opaque=new Set(blocked);
 const objects=new Map<string,TacticalProp>();
 const kinds:readonly TacticalPropKind[]=["barricade","container","security-door","generator","pipe"];
 cells.slice(0,5).forEach(([x,y],index)=>{
   const kind=kinds[index]!;
   const cover=kind==="barricade"||kind==="pipe"?"partial":"full";
   const key=name(x,y);
   if(cover==="partial")opaque.delete(key);
   objects.set(key,{id:id+"-"+kind,position:{x,y},kind,state:"intact",
     hp:kind==="container"?3:2,maxHp:kind==="container"?3:2,
     blocksMovement:true,blocksShots:cover==="full",cover});
 });
 const terrain=new Map<string,TacticalTerrain>();
 const heights=new Map<string,number>();
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){
   const key=name(x,y);
   if(blocked.has(key))continue;
   if(x>=4&&y>=4)heights.set(key,x>=5&&y>=5?2:1);
   // Move penalties and cover are terrain properties, not arbitrary animation.
   if((x*3+y*5+id.length)%13===0)terrain.set(key,site==="water"?"water":
     site==="quarantine"?"hazard":"rubble");
   else if(x>=4&&y===4)terrain.set(key,"ramp");
   else if((x+y)%7===0)terrain.set(key,site==="ventilation"?"shadow":"metal");
 }
 return {id,site,title,blocked,opaque,objects,terrain,heights,
   playerSpawn:SPAWN_PLAYER,enemySpawn:SPAWN_ENEMY,terminal:TERMINAL};
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
/** Seven campaign-integrated combat sites plus operational variants.
 * The Limbo and V-09 legacy arenas are preserved for compatibility.
 */
export const TACTICAL_MISSION_MAPS:Readonly<Partial<Record<EncounterId,TacticalLayout>>> = {
 "district-aurea":define("district-aurea","records","Laboratório Helix · ala de contenção",[
   [2,1],[2,2],[4,2],[5,2],[5,4],[3,5],[6,4],[4,6]
 ]),
 "district-subsolo":define("district-subsolo","ventilation","Rede de esgotos · canal de manutenção",[
   [2,2],[3,2],[5,2],[2,4],[4,4],[5,5],[6,5],[3,6]
 ]),
 "district-setor-zero":define("district-setor-zero","quarantine","Setor Zero · núcleo interditado",[
   [2,1],[3,1],[4,2],[5,3],[2,4],[3,5],[5,5],[6,3]
 ]),
 "district-prisma":define("district-prisma","broadcast","Distrito Prisma · corredor de neon",[
   [2,2],[4,1],[4,3],[5,3],[3,4],[5,5],[4,6],[1,3]
 ]),
 "district-periferia":define("district-periferia","road","Periferia · posto de controle",[
   [2,1],[3,2],[5,2],[4,4],[5,5],[2,5],[3,6],[6,4]
 ]),
 "trial-1":define("trial-1","water","Mercado da Baixada · rotas laterais",[
   [2,1],[2,2],[4,1],[4,3],[5,3],[3,5],[5,5],[6,4]
 ]),
 "trial-2":define("trial-2","furnace","Ferrugem · complexo industrial",[
   [2,2],[3,2],[4,2],[5,2],[3,4],[4,5],[5,5],[2,6]
 ]),
 "trial-3":define("trial-3","records","Centro de distribuição corporativo",[
   [2,1],[2,2],[4,2],[5,2],[3,4],[5,4],[4,6],[6,5]
 ]),
 "eden-relay":define("eden-relay","broadcast","Prisma · nó de retransmissão",[
   [2,2],[3,2],[5,3],[4,4],[2,5],[4,6],[5,5],[6,3]
 ]),
 "eden-core":define("eden-core","quarantine","Setor Zero · matriz Éden",[
   [2,1],[3,2],[4,2],[5,3],[2,4],[4,5],[5,5],[6,4]
 ]),
 "cisma-intercept":define("cisma-intercept","broadcast","Prisma · anel de interceptação",[
   [2,2],[4,1],[5,2],[3,4],[5,4],[4,5],[2,6],[6,3]
 ]),
 "cisma-containment":define("cisma-containment","records","Helix · contenção corporativa",[
   [2,1],[4,1],[5,2],[3,3],[5,4],[2,5],[4,6],[6,4]
 ]),
 "cisma-core":define("cisma-core","quarantine","Setor Zero · isolamento do núcleo",[
   [2,2],[3,1],[5,2],[2,4],[4,3],[5,5],[3,6],[6,4]
 ])
};
/** The returned layout is a read-only design blueprint, never a mutable combat session. */
export function layoutForEncounter(encounter:EncounterId):TacticalLayout|null{
 return isSiegeEncounter(encounter)?TACTICAL_SIEGE_MAPS[encounter]:
   TACTICAL_MISSION_MAPS[encounter]??null;
}
/** Mutations are local to one TurnManager and cannot leak between saves. */
export function copyTacticalLayout(blueprint:TacticalLayout|null):TacticalLayout|null{
 if(!blueprint)return null;
 return {...blueprint,blocked:new Set(blueprint.blocked),opaque:new Set(blueprint.opaque),
   terrain:new Map(blueprint.terrain),heights:new Map(blueprint.heights),
   objects:new Map([...blueprint.objects].map(([k,prop])=>
     [k,{...prop,position:{...prop.position}}]))};
}
export function updateTacticalProp(layout:TacticalLayout,position:Position,
 state:TacticalPropState):TacticalProp|null{
 const key=name(position.x,position.y),object=layout.objects.get(key);
 if(!object)return null;
 const value={...object,state,hp:state==="destroyed"?0:
   state==="damaged"?Math.max(1,object.hp-1):object.hp};
 (layout.objects as Map<string,TacticalProp>).set(key,value);
 if(state==="destroyed"||state==="disabled"&&object.kind==="security-door"){
   (layout.blocked as Set<string>).delete(key);
   (layout.opaque as Set<string>).delete(key);
 }
 return value;
}
