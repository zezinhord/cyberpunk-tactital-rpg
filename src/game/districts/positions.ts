import {isDistrictId,districtWalkable,DISTRICT_SPAWN,
 type DistrictId,type Tile} from "./catalog.ts";
export const DISTRICT_POSITIONS_KEY="cyberpunk-tactical-rpg.district-positions.v1.";
export function validateDistrictPositions(data:unknown):boolean{
 if(!data||typeof data!=="object"||Array.isArray(data))return false;
 const record=data as Record<string,unknown>;
 return Object.entries(record).every(([id,value])=>{
  if(!isDistrictId(id)||!value||typeof value!=="object"||Array.isArray(value))return false;
  const t=value as Tile;
  return Object.keys(value).every(k=>k==="x"||k==="y")&&districtWalkable(id,t);
 });
}
export function loadDistrictPosition(characterId:string,id:DistrictId):Tile{
 try{
  const raw=globalThis.localStorage?.getItem(DISTRICT_POSITIONS_KEY+characterId);
  if(!raw)return {...DISTRICT_SPAWN};
  const parsed:unknown=JSON.parse(raw);
  if(!validateDistrictPositions(parsed))return {...DISTRICT_SPAWN};
  const tile=(parsed as Record<DistrictId,Tile>)[id];
  return tile?{...tile}:{...DISTRICT_SPAWN};
 }catch{return {...DISTRICT_SPAWN};}
}
export function saveDistrictPosition(characterId:string,id:DistrictId,tile:Tile):boolean{
 if(!characterId||!isDistrictId(id)||!districtWalkable(id,tile))return false;
 try{
  const store=globalThis.localStorage;if(!store)return false;
  const raw=store.getItem(DISTRICT_POSITIONS_KEY+characterId);
  const value:unknown=raw?JSON.parse(raw):{};
  const prev=validateDistrictPositions(value)?value:{};
  store.setItem(DISTRICT_POSITIONS_KEY+characterId,JSON.stringify({
   ...prev,[id]:{x:tile.x,y:tile.y},
  }));
  return true;
 }catch{return false;}
}
