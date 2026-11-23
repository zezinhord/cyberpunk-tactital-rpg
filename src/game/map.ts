import type { Position, Unit } from "./types";
import type {TacticalLayout} from "./combat/tactical-maps.ts";

export const BOARD_WIDTH = 8;
export const BOARD_HEIGHT = 8;
export const MOVEMENT_PER_TURN = 6;

const blockedCells = new Set([
  "3,1",
  "3,2",
  "3,3",
  "3,4",
  "5,5",
  "5,6",
  "2,5",
]);

export function isInsideBoard({ x, y }: Position): boolean {
  return x >= 0 && y >= 0 && x < BOARD_WIDTH && y < BOARD_HEIGHT;
}

export function isBlocked({ x, y }: Position, layout:TacticalLayout|null=null): boolean {
  return (layout?.blocked??blockedCells).has(`${x},${y}`);
}

function positionKey({ x, y }: Position): string {
  return `${x},${y}`;
}

/** Terrain and height remain shared across player, AI and animation. */
export function tileHeight(p:Position,layout:TacticalLayout|null=null):number{
 return layout?.heights.get(positionKey(p))??0;
}
export function movementCost(p:Position,layout:TacticalLayout|null=null):number{
 switch(layout?.terrain.get(positionKey(p))){
   case "water":case "rubble":case "ramp":return 2;
   case "hazard":return 3;
   default:return 1;
 }
}
export function canStep(from:Position,to:Position,layout:TacticalLayout|null=null):boolean{
 return isInsideBoard(to)&&!isBlocked(to,layout)&&
   Math.abs(tileHeight(to,layout)-tileHeight(from,layout))<=1;
}
export function pathCost(path:readonly Position[],layout:TacticalLayout|null=null):number{
 return path.slice(1).reduce((sum,p)=>sum+movementCost(p,layout),0);
}
/** Dijkstra on a bounded 8×8 board; cost-optimal and occupancy-safe.
 * No pathfinder state survives a change to doors or destructibles. */
export function findPath(
 start:Position,target:Position,units:Unit[],movingUnitId:string,
 layout:TacticalLayout|null=null
):Position[]|null{
 if(!isInsideBoard(start)||!isInsideBoard(target)||isBlocked(target,layout))return null;
 const occupied=new Set(units.filter(u=>u.hp>0&&u.id!==movingUnitId).map(positionKey));
 if(occupied.has(positionKey(target)))return null;
 const startKey=positionKey(start),targetKey=positionKey(target);
 const costs=new Map<string,number>([[startKey,0]]);
 const previous=new Map<string,string|null>([[startKey,null]]);
 const frontier:[Position,number][]=[[start,0]];
 const directions=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
 while(frontier.length){
   frontier.sort((a,b)=>a[1]-b[1]||a[0].y-b[0].y||a[0].x-b[0].x);
   const entry=frontier.shift()!;
   const current=entry[0],cost=entry[1],key=positionKey(current);
   if(cost!==costs.get(key))continue;
   if(key===targetKey)break;
   for(const dir of directions){
     const next={x:current.x+dir.x,y:current.y+dir.y},nextKey=positionKey(next);
     if(!canStep(current,next,layout)||occupied.has(nextKey))continue;
     const total=cost+movementCost(next,layout);
     if(total>=(costs.get(nextKey)??Infinity))continue;
     costs.set(nextKey,total);previous.set(nextKey,key);frontier.push([next,total]);
   }
 }
 if(!previous.has(targetKey))return null;
 const path:Position[]=[];
 let cursor:string|null=targetKey;
 while(cursor!==null){
   const [x=0,y=0]=cursor.split(",").map(Number);
   path.unshift({x,y});cursor=previous.get(cursor)??null;
 }
 return path;
}
/** One bounded Dijkstra for the movement overlay; avoids 64 separate
 * path searches on every UI render in entry-level Android WebViews. */
export function getReachableCells(units:Unit[],unit:Unit,movement:number,
 layout:TacticalLayout|null=null):Position[]{
 if(!isInsideBoard(unit)||movement<=0)return [];
 const occupied=new Set(units.filter(u=>u.hp>0&&u.id!==unit.id).map(positionKey));
 const scores=new Map<string,number>([[positionKey(unit),0]]);
 const frontier:[Position,number][]=[[{x:unit.x,y:unit.y},0]];
 const dirs=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
 while(frontier.length){
   frontier.sort((a,b)=>a[1]-b[1]||a[0].y-b[0].y||a[0].x-b[0].x);
   const [current,cost]=frontier.shift()!;
   if(cost!==scores.get(positionKey(current)))continue;
   for(const dir of dirs){
     const next={x:current.x+dir.x,y:current.y+dir.y},key=positionKey(next);
     if(occupied.has(key)||!canStep(current,next,layout))continue;
     const total=cost+movementCost(next,layout);
     if(total>movement||total>=(scores.get(key)??Infinity))continue;
     scores.set(key,total);frontier.push([next,total]);
   }
 }
 const reachable:Position[]=[];
 for(let y=0;y<BOARD_HEIGHT;y++)for(let x=0;x<BOARD_WIDTH;x++){
   if((x!==unit.x||y!==unit.y)&&scores.has(x+","+y))reachable.push({x,y});
 }
 return reachable;
}

/** Visibilidade entre os centros das células. O algoritmo supercover
 * impede que disparos atravessem paredes ou cantos de duas paredes.
 * É puro e usa a mesma malha de colisão do movimento. */
export function isOpaque(p:Position,layout:TacticalLayout|null=null):boolean{
 return layout?layout.opaque.has(positionKey(p)):isBlocked(p);
}
export function hasLineOfSight(start:Position,target:Position,
 layout:TacticalLayout|null=null):boolean{
 if(!isInsideBoard(start)||!isInsideBoard(target)||
    isOpaque(start,layout)||isOpaque(target,layout))return false;
 let x=start.x,y=start.y,ix=0,iy=0;
 const dx=target.x-x,dy=target.y-y;
 const horizon=Math.max(tileHeight(start,layout),tileHeight(target,layout));
 const nx=Math.abs(dx),ny=Math.abs(dy);
 const sx=Math.sign(dx),sy=Math.sign(dy);
 while(ix<nx||iy<ny){
   const a=(1+2*ix)*ny,b=(1+2*iy)*nx;
   if(a===b){
     // No cruzamento de quina, ambas as células vizinhas devem estar livres.
     if(isOpaque({x:x+sx,y},layout)||isOpaque({x,y:y+sy},layout))return false;
     x+=sx;y+=sy;ix++;iy++;
   }else if(a<b){x+=sx;ix++;}
   else{y+=sy;iy++;}
   if(isOpaque({x,y},layout))return false;
   // A higher platform interrupts sight between two lower elevations.
   // An attacker standing above the rim still has a valid sightline.
   if(tileHeight({x,y},layout)>horizon)return false;
 }
 return true;
}
export type CoverGrade="none"|"partial"|"full";
export function coverBetween(attacker:Position,target:Position,
 layout:TacticalLayout|null=null):CoverGrade{
 if(!hasLineOfSight(attacker,target,layout))return "full";
 const dx=attacker.x-target.x,dy=attacker.y-target.y;
 if(Math.abs(dx)+Math.abs(dy)<=1)return "none";
 const offsets=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
 return offsets.some(dir=>
   (dir.x*dx+dir.y*dy)>0&&isBlocked({x:target.x+dir.x,y:target.y+dir.y},layout))
     ?"partial":"none";
}
export function elevationAccuracyBonus(attacker:Position,target:Position,
 layout:TacticalLayout|null=null):number{
 const difference=tileHeight(attacker,layout)-tileHeight(target,layout);
 return difference>0?Math.min(2,difference):0;
}
export function coverArmorBonus(attacker:Position,target:Position,
 layout:TacticalLayout|null=null):number{
 return coverBetween(attacker,target,layout)==="partial"?2:0;
}
