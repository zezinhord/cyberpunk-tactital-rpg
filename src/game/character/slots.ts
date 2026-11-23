import type {PlayerCharacter} from "./types.ts";
import {loadCharacter,parseCharacterSave,saveCharacter} from "./storage.ts";
import {CHARACTER_SAVE_KEY,CHARACTER_SLOT_INDEX,CHARACTER_SLOT_PREFIX,
  MAX_CHARACTER_SLOTS,readSlotIds,readRawSlot,setActiveRaw} from "./slot-core.ts";
export {MAX_CHARACTER_SLOTS} from "./slot-core.ts";
const OWNED_DATA_KEYS=[
 "cyberpunk-tactical-rpg.inventory.v1.",
 "cyberpunk-tactical-rpg.arena-appearance.v1.",
 "cyberpunk-tactical-rpg.world-location.v068.",
 "cyberpunk-tactical-rpg.mission.v1.",
 "cyberpunk-tactical-rpg.story-v09.v068.",
 "cyberpunk-tactical-rpg.market.v1.",
 "cyberpunk-tactical-rpg.health.v1.",
 "cyberpunk-tactical-rpg.trial.v1.",
 "cyberpunk-tactical-rpg.sewer-v09.v1.",
 "cyberpunk-tactical-rpg.ferrugem.v1.",
 "cyberpunk-tactical-rpg.world-area.v1.",
 "cyberpunk-tactical-rpg.city-chapters.v1.",
 "cyberpunk-tactical-rpg.district-positions.v1.",
 "cyberpunk-tactical-rpg.favors.v1.",
 "cyberpunk-tactical-rpg.urban-cases.v1.",
 "cyberpunk-tactical-rpg.eden-echoes.v1.",
 "cyberpunk-tactical-rpg.cisma-v20.v1.",
 "cyberpunk-tactical-rpg.cisma-operations.v1.",
 "cyberpunk-tactical-rpg.party-v20.v1.",
 "cyberpunk-tactical-rpg.ai-world-memory.v1.",
 "cyberpunk-tactical-rpg.stealth-v20.v1.",
 "cyberpunk-tactical-rpg.inner-contracts-v20.v1.",
 // Nova Arcádia 2.0: clearing a character must also clear the newer
 // investigation, rescue and Éden chapters, but NEVER other characters.
 "cyberpunk-tactical-rpg.archive-v20.v1.",
 "cyberpunk-tactical-rpg.district-councils-v20.v1.",
 "cyberpunk-tactical-rpg.reconstruction-v20.v1.",
 "cyberpunk-tactical-rpg.field-simulations-v20.v1.",
 "cyberpunk-tactical-rpg.perimeter-v20.v1.",
 "cyberpunk-tactical-rpg.vigil-v20.v1.",
 "cyberpunk-tactical-rpg.shelter-v20.v1.",
 "cyberpunk-tactical-rpg.nexus-v20.v1.",
 "cyberpunk-tactical-rpg.cinema-history.v2.",
] as const;
/** Descobre e preserva automaticamente o slot único de versões anteriores. */
export function listCharacterSlots():PlayerCharacter[]{
 const current=loadCharacter();
 if(current&&!readSlotIds().includes(current.id))saveCharacter(current);
 const found=new Map<string,PlayerCharacter>();
 for(const id of readSlotIds()){
   const raw=readRawSlot(id);
   const valid=raw?parseCharacterSave(raw):null;
   if(valid&&valid.id===id)found.set(id,valid);
 }
 if(current&&!found.has(current.id))found.set(current.id,current);
 return [...found.values()].sort((a,b)=>
   Date.parse(b.updatedAt||"")-Date.parse(a.updatedAt||""));
}
export function readCharacterSlot(id:string):PlayerCharacter|null {
 if(!readSlotIds().includes(id))return null;
 const raw=readRawSlot(id),character=raw?parseCharacterSave(raw):null;
 return character?.id===id?character:null;
}
export function loadCharacterSlot(id:string):PlayerCharacter|null {
 const character=readCharacterSlot(id);
 const raw=readRawSlot(id);
 if(!character||!raw||!setActiveRaw(raw))return null;
 return character;
}
export function containsCharacterSlot(id:string):boolean{
 return listCharacterSlots().some(char=>char.id===id);
}
export function removeCharacterSlot(id:string):boolean{
 // Never delete the index, active selection or story data partially:
 // Android WebView localStorage can fail mid-transaction due to quota or IO.
 // A snapshot allows reversing each mutation without touching another slot.
 const slots=listCharacterSlots();
 if(!slots.some(char=>char.id===id))return false;
 const storage=globalThis.localStorage;
 if(!storage)return false;
 const remaining=slots.filter(char=>char.id!==id);
 const active=loadCharacter();
 const environmentKeys:string[]=[];
 try{
  for(let i=0;i<storage.length;i++){
   const key=storage.key(i);
   if(key?.startsWith("nova-arcadia.tactical-env.v2."+id+"."))
     environmentKeys.push(key);
  }
 }catch{return false;}
 const keys=[
  CHARACTER_SLOT_INDEX,CHARACTER_SLOT_PREFIX+id,
  ...(active?.id===id?[CHARACTER_SAVE_KEY]:[]),
  ...OWNED_DATA_KEYS.map(prefix=>prefix+id),
  ...environmentKeys,
 ];
 const previous=new Map<string,string|null>();
 try{
  for(const key of keys)previous.set(key,storage.getItem(key));
 }catch{return false;} // Cannot guarantee rollback without a full snapshot.
 try{
  // Commit the replacement active selection before the source slot is lost.
  if(active?.id===id){
   if(remaining[0]){
    if(!setActiveRaw(JSON.stringify({version:1,character:remaining[0]})))
     throw new Error("Não foi possível selecionar outro personagem.");
   }else storage.removeItem(CHARACTER_SAVE_KEY);
  }
  // Only delete exact per-character keys, including all 2.0 chapters.
  for(const prefix of OWNED_DATA_KEYS)storage.removeItem(prefix+id);
  for(const key of environmentKeys)storage.removeItem(key);
  storage.removeItem(CHARACTER_SLOT_PREFIX+id);
  storage.setItem(CHARACTER_SLOT_INDEX,JSON.stringify(remaining.map(char=>char.id)));
  return true;
 }catch{
  // Recover the original index, active player, and every touched record.
  // If the storage itself remains unavailable, preserve what can be restored.
  for(const [key,raw] of previous){
   try{
    if(raw===null)storage.removeItem(key);
    else storage.setItem(key,raw);
   }catch{/* WebView storage can be unavailable during rollback as well. */}
  }
  return false;
 }
}
export function hasSlotCapacity():boolean{return listCharacterSlots().length<MAX_CHARACTER_SLOTS;}
