import { GRID_WIDTH, GRID_HEIGHT, BUILDING_CELLS, PROP_CELLS, ACTOR_CELLS, cellKey, isInside } from "./layout.ts";
import type { Tile } from "./layout.ts";

/** Navegação isométrica independente de Phaser.
 * Oito direções diminuem o zigue-zague. As diagonais exigem as duas células
 * laterais livres (sem cortar cantos de edifícios, NPCs ou portas).
 * Cada passo continua sendo revalidado durante a animação.
 */
export const ORTHOGONAL_STEPS: readonly Tile[] = [
  {x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0},
];
export const DIAGONAL_STEPS:readonly Tile[]=[
  {x:1,y:-1},{x:1,y:1},{x:-1,y:1},{x:-1,y:-1},
];
export const WALK_STEPS:readonly Tile[]=[...ORTHOGONAL_STEPS,...DIAGONAL_STEPS];
export function isAdjacent(a:Tile,b:Tile):boolean{
  const dx=Math.abs(a.x-b.x),dy=Math.abs(a.y-b.y);
  return dx<=1&&dy<=1&&(dx+dy)>0;
}
export type BlockReason = "outside" | "building" | "prop" | "actor" | "dynamic" | null;
export interface WalkOptions {
  occupied?: ReadonlySet<string>;
  allowedActorId?: string;
}
export function collisionAt(tile: Tile, options: WalkOptions = {}): BlockReason {
  if (!isInside(tile)) return "outside";
  const key = cellKey(tile);
  if (BUILDING_CELLS.has(key)) return "building";
  if (PROP_CELLS.has(key)) return "prop";
  if (ACTOR_CELLS.has(key)) return "actor";
  if (options.occupied?.has(key)) return "dynamic";
  return null;
}
export function canStand(tile: Tile, options: WalkOptions = {}): boolean {
  return collisionAt(tile, options) === null;
}
export function canTraverse(a: Tile, b: Tile, options: WalkOptions = {}): boolean {
  if(!isAdjacent(a,b)||!canStand(b,options))return false;
  // O percurso diagonal só é permitido quando não atravessa a esquina de
  // um obstáculo; evita cortes que pareçam atravessar paredes.
  const dx=b.x-a.x,dy=b.y-a.y;
  return dx===0||dy===0||
    (canStand({x:a.x+dx,y:a.y},options)&&canStand({x:a.x,y:a.y+dy},options));
}
export function route(start: Tile, target: Tile, options: WalkOptions = {}): Tile[] | null {
  if (!isInside(start) || !canStand(target, options)) return null;
  const queue: Tile[] = [start];
  const parent = new Map<string, string | null>([[cellKey(start),null]]);
  for (let i=0;i<queue.length;i+=1) {
    const current = queue[i]!;
    if (current.x === target.x && current.y === target.y) break;
    for (const d of WALK_STEPS) {
      const next={x:current.x+d.x,y:current.y+d.y};
      const key=cellKey(next);
      if (parent.has(key) || !canTraverse(current,next,options)) continue;
      parent.set(key,cellKey(current)); queue.push(next);
    }
  }
  const end=cellKey(target);
  if(!parent.has(end))return null;
  const result:Tile[]=[];
  let cursor: string | null=end;
  while(cursor) {
    const [x,y]=cursor.split(",").map(Number);
    result.push({x:x??0,y:y??0});
    cursor=parent.get(cursor)??null;
  }
  return result.reverse();
}
/** BFS shared by interaction and blocked-tap navigation: one search,
 * earliest reachable candidate and collision-safe diagonals. Exits as
 * soon as the best possible candidate proximity is reached.
 */
function searchReachable(start:Tile,options:WalkOptions,
 score:(tile:Tile)=>number|null,optimalScore:number):Tile[]|null{
 if(!isInside(start))return null;
 const queue:Tile[]=[start];
 const parent=new Map<string,string|null>([[cellKey(start),null]]);
 let bestKey:string|null=null,bestScore=Number.POSITIVE_INFINITY;
 for(let i=0;i<queue.length;i++){
  const current=queue[i]!;
  const key=cellKey(current);
  const currentScore=score(current);
  if(currentScore!==null&&currentScore<bestScore){
   bestKey=key;bestScore=currentScore;
   // BFS guarantees that the first optimal candidate has the
   // shortest valid approach, so no further grid scan is needed.
   if(currentScore===optimalScore)break;
  }
  for(const step of WALK_STEPS){
   const next={x:current.x+step.x,y:current.y+step.y};
   const nextKey=cellKey(next);
   if(parent.has(nextKey)||!canTraverse(current,next,options))continue;
   parent.set(nextKey,key);
   queue.push(next);
  }
 }
 if(bestKey===null)return null;
 const path:Tile[]=[];
 let cursor:string|null=bestKey;
 while(cursor!==null){
  const [x,y]=cursor.split(",").map(Number);
  path.push({x:x!,y:y!});
  cursor=parent.get(cursor)??null;
 }
 return path.reverse();
}
export function approachRoute(start: Tile, target: Tile, options: WalkOptions = {}): Tile[] | null {
 if(!isInside(target))return null;
 const neighbors=new Set(ORTHOGONAL_STEPS.map(step=>({
  x:target.x+step.x,y:target.y+step.y,
 })).filter(tile=>canStand(tile,options)).map(cellKey));
 if(neighbors.size===0)return null;
 // Previously launched four complete BFS searches and sorted the paths.
 return searchReachable(start,options,tile=>neighbors.has(cellKey(tile))?0:null,0);
}
export function assertRoute(path: readonly Tile[], options: WalkOptions = {}): boolean {
  if(path.length===0 || !isInside(path[0]!))return false;
  return path.slice(1).every((tile,i)=>canTraverse(path[i]!,tile,options));
}
export const WORLD_TILES = GRID_WIDTH*GRID_HEIGHT;

/** Touching a blocked tile selects the closest reachable pavement.
 * For ordinary blocked taps next to a street, stop at the first valid
 * radius-one cell rather than traversing all 1326 Baixada grid cells.
 * Unreachable candidates fall back to the next-nearest valid sidewalk.
 */
export function routeNearTarget(start:Tile,target:Tile,
 options:WalkOptions={},radius=3):Tile[]|null{
 if(!isInside(start)||!isInside(target)||!canStand(start,options)||
  !Number.isInteger(radius)||radius<1)return null;
 if(canStand(target,options))return route(start,target,options);
 const candidateScores=new Map<string,number>();
 let closest=Number.POSITIVE_INFINITY;
 for(let dx=-radius;dx<=radius;dx++){
  for(let dy=-radius;dy<=radius;dy++){
   const distance=Math.abs(dx)+Math.abs(dy);
   if(distance===0||distance>radius)continue;
   const tile={x:target.x+dx,y:target.y+dy};
   if(!canStand(tile,options))continue;
   candidateScores.set(cellKey(tile),distance);
   if(distance<closest)closest=distance;
  }
 }
 if(candidateScores.size===0)return null;
 return searchReachable(start,options,
  tile=>candidateScores.get(cellKey(tile))??null,closest);
}
