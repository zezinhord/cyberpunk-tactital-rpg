/** Local de exploração por protagonista. A região é um dado pequeno e
 * persistente, separado da coordenada da Baixada: um encerramento do Android
 * no esgoto ou em Ferrugem não força o jogador a reiniciar pela superfície.
 */
import type {InteriorId} from "./InteriorScene.ts";
export const WORLD_AREA_KEY="cyberpunk-tactical-rpg.world-area.v1.";
const ALLOWED:readonly InteriorId[]=[
 "clinic","workshop","canal","sewer-drain","sewer-deep","ferrugem",
] as const;
export function isSavedWorldArea(input:unknown):input is InteriorId|null{
 return input===null||(typeof input==="string"&&ALLOWED.some(a=>a===input));
}
export function loadWorldArea(characterId:string):InteriorId|null{
 if(!characterId)return null;
 try{
  const raw=globalThis.localStorage?.getItem(WORLD_AREA_KEY+characterId);
  if(raw===null||raw===undefined)return null;
  const value:unknown=JSON.parse(raw);
  return isSavedWorldArea(value)?value:null;
 }catch{return null;}
}
export function saveWorldArea(characterId:string,area:InteriorId|null):boolean{
 if(!characterId||!isSavedWorldArea(area))return false;
 try{
  if(!globalThis.localStorage)return false;
  globalThis.localStorage.setItem(WORLD_AREA_KEY+characterId,JSON.stringify(area));
  return true;
 }catch{return false;}
}
