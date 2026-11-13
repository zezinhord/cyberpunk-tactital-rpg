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
 const slots=listCharacterSlots();
 if(!slots.some(char=>char.id===id))return false;
 try{
   const storage=globalThis.localStorage;if(!storage)return false;
   const remaining=slots.filter(char=>char.id!==id);
   storage.setItem(CHARACTER_SLOT_INDEX,JSON.stringify(remaining.map(char=>char.id)));
   storage.removeItem(CHARACTER_SLOT_PREFIX+id);
   const active=loadCharacter();
   if(active?.id===id){
     if(remaining[0])setActiveRaw(JSON.stringify({version:1,character:remaining[0]}));
     else storage.removeItem(CHARACTER_SAVE_KEY);
   }
   // A exclusão explícita também elimina dados órfãos deste protagonista;
   // outros slots permanecem intactos.
   for(const prefix of OWNED_DATA_KEYS)storage.removeItem(prefix+id);
   return true;
 }catch{return false;}
}
export function hasSlotCapacity():boolean{return listCharacterSlots().length<MAX_CHARACTER_SLOTS;}
