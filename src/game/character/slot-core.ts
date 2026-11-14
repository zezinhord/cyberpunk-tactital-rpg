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
 const keys=[CHARACTER_SLOT_PREFIX+id,CHARACTER_SLOT_INDEX,CHARACTER_SAVE_KEY];
 const previous:(string|null)[]=[];
 try{
   for(const key of keys)previous.push(storage.getItem(key));
   // Grava primeiro o slot, em seguida o índice e a seleção ativa.
   storage.setItem(keys[0]!,serialized);
   storage.setItem(keys[1]!,JSON.stringify(updated));
   storage.setItem(keys[2]!,serialized);
   return true;
 }catch{
   // O armazenamento de um navegador pode falhar por falta de espaço.
   // Reverte gravações parciais, sem comprometer os outros protagonistas.
   for(let index=previous.length-1;index>=0;index--){
     try{
       if(previous[index]===null)storage.removeItem(keys[index]!);
       else storage.setItem(keys[index]!,previous[index]!);
     }catch{/* Reversão parcial: não perder o backup já gravado. */}
   }
   return false;
 }}
}
export function readRawSlot(id:string):string|null{
 try{return globalThis.localStorage?.getItem(CHARACTER_SLOT_PREFIX+id)??null;}catch{return null;}
}
export function setActiveRaw(raw:string):boolean{
 try{globalThis.localStorage?.setItem(CHARACTER_SAVE_KEY,raw);return true;}catch{return false;}
}
