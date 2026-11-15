import type { Position, Unit } from "./types";

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

export function isBlocked({ x, y }: Position): boolean {
  return blockedCells.has(`${x},${y}`);
}

function positionKey({ x, y }: Position): string {
  return `${x},${y}`;
}

export function findPath(
  start: Position,
  target: Position,
  units: Unit[],
  movingUnitId: string,
): Position[] | null {
  if (!isInsideBoard(target) || isBlocked(target)) return null;

  const occupied = new Set(
    units
      .filter((unit) => unit.id !== movingUnitId && unit.hp > 0)
      .map(positionKey),
  );

  if (occupied.has(positionKey(target))) return null;

  const queue: Position[] = [start];
  const previous = new Map<string, string | null>([[positionKey(start), null]]);
  const directions: Position[] = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    if (current.x === target.x && current.y === target.y) break;

    for (const direction of directions) {
      const next = { x: current.x + direction.x, y: current.y + direction.y };
      const key = positionKey(next);

      if (!isInsideBoard(next) || isBlocked(next) || occupied.has(key) || previous.has(key)) {
        continue;
      }

      previous.set(key, positionKey(current));
      queue.push(next);
    }
  }

  const targetKey = positionKey(target);
  if (!previous.has(targetKey)) return null;

  const path: Position[] = [];
  let cursor: string | null = targetKey;

  while (cursor !== null) {
    const [x = 0, y = 0] = cursor.split(",").map(Number);
    path.unshift({ x, y });
    cursor = previous.get(cursor) ?? null;
  }

  return path;
}

export function getReachableCells(units: Unit[], unit: Unit, movement: number): Position[] {
  const reachable: Position[] = [];

  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      if (x === unit.x && y === unit.y) continue;
      const path = findPath(unit, { x, y }, units, unit.id);
      if (path && path.length - 1 <= movement) reachable.push({ x, y });
    }
  }

  return reachable;
}

/** Visibilidade entre os centros das células. O algoritmo supercover
 * impede que disparos atravessem paredes ou cantos de duas paredes.
 * É puro e usa a mesma malha de colisão do movimento. */
export function hasLineOfSight(start:Position,target:Position):boolean{
 if(!isInsideBoard(start)||!isInsideBoard(target)||
    isBlocked(start)||isBlocked(target))return false;
 let x=start.x,y=start.y,ix=0,iy=0;
 const dx=target.x-x,dy=target.y-y;
 const nx=Math.abs(dx),ny=Math.abs(dy);
 const sx=Math.sign(dx),sy=Math.sign(dy);
 while(ix<nx||iy<ny){
   const a=(1+2*ix)*ny,b=(1+2*iy)*nx;
   if(a===b){
     // No cruzamento de quina, ambas as células vizinhas devem estar livres.
     if(isBlocked({x:x+sx,y})||isBlocked({x,y:y+sy}))return false;
     x+=sx;y+=sy;ix++;iy++;
   }else if(a<b){x+=sx;ix++;}
   else{y+=sy;iy++;}
   if(isBlocked({x,y}))return false;
 }
 return true;
}
export type CoverGrade="none"|"partial"|"full";
export function coverBetween(attacker:Position,target:Position):CoverGrade{
 if(!hasLineOfSight(attacker,target))return "full";
 const dx=attacker.x-target.x,dy=attacker.y-target.y;
 if(Math.abs(dx)+Math.abs(dy)<=1)return "none";
 const offsets=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
 return offsets.some(dir=>
   (dir.x*dx+dir.y*dy)>0&&isBlocked({x:target.x+dir.x,y:target.y+dir.y}))
     ?"partial":"none";
}
export function coverArmorBonus(attacker:Position,target:Position):number{
 return coverBetween(attacker,target)==="partial"?2:0;
}
