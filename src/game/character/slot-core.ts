/** Armazenamento multi-slot sem apagar saves 0.6.8 anteriores. */
export const CHARACTER_SAVE_KEY="cyberpunk-tactical-rpg.character.v1";
export const CHARACTER_SLOT_INDEX="cyberpunk-tactical-rpg.character-slots.v1";
export const CHARACTER_SLOT_PREFIX="cyberpunk-tactical-rpg.character-slot.v1.";
export const MAX_CHARACTER_SLOTS=8;
/** Recover only if the index itself is malformed. A VALID empty index
 * means the player intentionally deleted their characters, so never scan
 * for old/orphaned data in that case.
 * Slot files are the source of truth when just their index was corrupted.
 */
function recoverSlotIds():string[]{
 try{
  const storage=globalThis.localStorage;
  if(!storage||typeof storage.key!=="function")return [];
  const ids:string[]=[];
  // Bound the number of scanned browser records on older Android WebViews.
  const count=Math.min(storage.length,4096);
  for(let i=0;i<count&&ids.length<MAX_CHARACTER_SLOTS;i++){
   const key=storage.key(i);
   if(!key?.startsWith(CHARACTER_SLOT_PREFIX))continue;
   const id=key.slice(CHARACTER_SLOT_PREFIX.length);
   if(!id||id.length>128||ids.includes(id))continue;
   const raw=storage.getItem(key);
   if(!raw||raw.length>200_000)continue;
   try{
    const value:unknown=JSON.parse(raw);
    if(!value||typeof value!=="object")continue;
    const record=value as {version?:unknown;character?:{id?:unknown;name?:unknown}};
    if(record.version!==1||record.character?.id!==id||
       typeof record.character.name!=="string"||!record.character.name.trim())continue;
    ids.push(id);
   }catch{/* Ignore corrupted individual slots; never delete them. */}
  }
  return ids;
 }catch{return [];}
}
export function readSlotIds():string[]{
 try{
  const raw=globalThis.localStorage?.getItem(CHARACTER_SLOT_INDEX);
  if(!raw)return [];
  let parsed:unknown;
  try{parsed=JSON.parse(raw);}catch{return recoverSlotIds();}
  if(!Array.isArray(parsed))return recoverSlotIds();
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
 }
}
export function readRawSlot(id:string):string|null{
 try{return globalThis.localStorage?.getItem(CHARACTER_SLOT_PREFIX+id)??null;}catch{return null;}
}
export function setActiveRaw(raw:string):boolean{
 try{const storage=globalThis.localStorage;if(!storage)return false;
 storage.setItem(CHARACTER_SAVE_KEY,raw);return true;}catch{return false;}
}
