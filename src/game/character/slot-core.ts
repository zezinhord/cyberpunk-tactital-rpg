/** Armazenamento multi-slot sem apagar saves 0.6.8 anteriores. */
export const CHARACTER_SAVE_KEY="cyberpunk-tactical-rpg.character.v1";
export const CHARACTER_SLOT_INDEX="cyberpunk-tactical-rpg.character-slots.v1";
export const CHARACTER_SLOT_PREFIX="cyberpunk-tactical-rpg.character-slot.v1.";
export const MAX_CHARACTER_SLOTS=8;
export function readSlotIds():string[]{
 try{
   const raw=globalThis.localStorage?.getItem(CHARACTER_SLOT_INDEX);
   const parsed=raw?JSON.parse(raw):[];
   if(!Array.isArray(parsed))return [];
   return [...new Set(parsed.filter((id):id is string=>
     typeof id==="string"&&id.length>0&&id.length<=128))].slice(0,MAX_CHARACTER_SLOTS);
 }catch{return [];}
}
export function persistActiveAndSlot(id:string,serialized:string):boolean{
 if(!id||id.length>128)return false;
 const storage=globalThis.localStorage;
 if(!storage)return false;
 const ids=readSlotIds();
 if(!ids.includes(id)&&ids.length>=MAX_CHARACTER_SLOTS)return false;
 const updated=ids.includes(id)?ids:[...ids,id];
 try{
   // Primeiro preservar o slot individual, depois ativá-lo. O save legado
   // continua acessível, mesmo que a escrita do índice falhe.
   storage.setItem(CHARACTER_SLOT_PREFIX+id,serialized);
   storage.setItem(CHARACTER_SLOT_INDEX,JSON.stringify(updated));
   storage.setItem(CHARACTER_SAVE_KEY,serialized);
   return true;
 }catch{return false;}
}
export function readRawSlot(id:string):string|null{
 try{return globalThis.localStorage?.getItem(CHARACTER_SLOT_PREFIX+id)??null;}catch{return null;}
}
export function setActiveRaw(raw:string):boolean{
 try{globalThis.localStorage?.setItem(CHARACTER_SAVE_KEY,raw);return true;}catch{return false;}
}
