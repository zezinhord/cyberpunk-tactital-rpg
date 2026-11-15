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
export function approachRoute(start: Tile, target: Tile, options: WalkOptions = {}): Tile[] | null {
  const paths = ORTHOGONAL_STEPS.map(d=>({x:target.x+d.x,y:target.y+d.y}))
    .map(t=>route(start,t,options))
    .filter((path):path is Tile[]=>Boolean(path));
  paths.sort((a,b)=>a.length-b.length);
  return paths[0]??null;
}
export function assertRoute(path: readonly Tile[], options: WalkOptions = {}): boolean {
  if(path.length===0 || !isInside(path[0]!))return false;
  return path.slice(1).every((tile,i)=>canTraverse(path[i]!,tile,options));
}
export const WORLD_TILES = GRID_WIDTH*GRID_HEIGHT;
