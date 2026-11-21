/** Per-character field notebook for the twelve authored pages in each
 * of the 28 physical interiors. This is optional reading, never a blocker to
 * core quests; a missing/downloaded pack cannot corrupt a protagonist save.
 */
import {EXPANSION_ROOM_DESIGNS,type ExpansionInnerId}
 from "../districts/expansion-interiors.ts";
export const ARCHIVE_KEY="cyberpunk-tactical-rpg.archive-v20.v1.";
export const ARCHIVE_PAGES_PER_ROOM=12;
export interface ArchiveProgress{
 version:1;
 viewed:Partial<Record<ExpansionInnerId,readonly number[]>>;
}
const known=new Set<string>(EXPANSION_ROOM_DESIGNS.map(room=>room.id));
const validRoom=(id:string):id is ExpansionInnerId=>known.has(id);
export const EMPTY_ARCHIVES:Readonly<ArchiveProgress>={version:1,viewed:{}};
export function validateArchiveProgress(raw:unknown):raw is ArchiveProgress{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const x=raw as Record<string,unknown>;
 if(Object.keys(x).some(key=>!["version","viewed"].includes(key))||
  x.version!==1||!x.viewed||typeof x.viewed!=="object"||
  Array.isArray(x.viewed))return false;
 const viewed=x.viewed as Record<string,unknown>;
 const entries=Object.entries(viewed);
 if(entries.length>known.size)return false;
 return entries.every(([id,list])=>validRoom(id)&&Array.isArray(list)&&
  list.length<=ARCHIVE_PAGES_PER_ROOM&&new Set(list).size===list.length&&
  list.every(index=>Number.isInteger(index)&&index>=0&&
   index<ARCHIVE_PAGES_PER_ROOM));
}
export function readArchiveProgress(heroId:string):ArchiveProgress{
 if(!heroId)return {version:1,viewed:{}};
 try{
  const raw=globalThis.localStorage?.getItem(ARCHIVE_KEY+heroId);
  const decoded:unknown=raw?JSON.parse(raw):null;
  return validateArchiveProgress(decoded)?decoded:{version:1,viewed:{}};
 }catch{return {version:1,viewed:{}};}
}
export function saveArchiveProgress(heroId:string,state:ArchiveProgress):boolean{
 if(!heroId||!validateArchiveProgress(state))return false;
 try{
  const storage=globalThis.localStorage;
  if(!storage)return false;
  storage.setItem(ARCHIVE_KEY+heroId,JSON.stringify(state));
  return true;
 }catch{return false;}
}
export function markArchivePage(state:ArchiveProgress,room:ExpansionInnerId,index:number):
 ArchiveProgress{
 if(!validRoom(room)||!Number.isInteger(index)||index<0||
  index>=ARCHIVE_PAGES_PER_ROOM)return state;
 const seen=state.viewed[room]??[];
 if(seen.includes(index))return state;
 return {...state,viewed:{...state.viewed,[room]:[...seen,index].sort((a,b)=>a-b)}};
}
export function archiveReadCount(state:ArchiveProgress,room:ExpansionInnerId):number{
 return state.viewed[room]?.length??0;
}
