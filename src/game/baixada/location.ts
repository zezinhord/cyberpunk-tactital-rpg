import { PLAYER_START, cellKey } from "./layout.ts";
import { canStand } from "./navigation.ts";
import type { Tile } from "./layout.ts";
const KEY="cyberpunk-tactical-rpg.world-location.v068.";
export function validateSpawn(tile:Tile):Tile {
  return Number.isInteger(tile.x)&&Number.isInteger(tile.y)&&canStand(tile)?tile:{...PLAYER_START};
}
export function loadWorldLocation(characterId:string):Tile {
  if(!characterId)return {...PLAYER_START};
  try {
    const raw=globalThis.localStorage?.getItem(KEY+characterId);
    if(!raw)return {...PLAYER_START};
    const value=JSON.parse(raw) as {x?:unknown;y?:unknown};
    return validateSpawn({x:typeof value.x==="number"?value.x:NaN,y:typeof value.y==="number"?value.y:NaN});
  }catch{return {...PLAYER_START};}
}
export function saveWorldLocation(characterId:string,tile:Tile):void {
  if(!characterId||!canStand(tile))return;
  try{globalThis.localStorage?.setItem(KEY+characterId,JSON.stringify(tile));}catch{}
}
export function sameTile(a:Tile,b:Tile):boolean{return cellKey(a)===cellKey(b);}
