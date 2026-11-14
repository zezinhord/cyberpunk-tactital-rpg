import type {PlayerCharacter} from "./types.ts";
import {isPlayerCharacter,parseCharacterSave,saveCharacter} from "./storage.ts";
import {containsCharacterSlot,hasSlotCapacity,readCharacterSlot} from "./slots.ts";
import {CHARACTER_SAVE_KEY,CHARACTER_SLOT_INDEX,CHARACTER_SLOT_PREFIX} from "./slot-core.ts";
import {TRIAL_STEPS} from "../story/field-test.ts";
/** Somente estes campos do jogo podem ser restaurados do arquivo fornecido.
 * Nunca executar JSON de backup nem escrever chave arbitrária de armazenamento.
 */
export const CHARACTER_BACKUP_KEYS={
 inventory:"cyberpunk-tactical-rpg.inventory.v1.",
 appearance:"cyberpunk-tactical-rpg.arena-appearance.v1.",
 location:"cyberpunk-tactical-rpg.world-location.v068.",
 mission:"cyberpunk-tactical-rpg.mission.v1.",
 v09:"cyberpunk-tactical-rpg.story-v09.v068.",
 market:"cyberpunk-tactical-rpg.market.v1.",
 health:"cyberpunk-tactical-rpg.health.v1.",
 trial:"cyberpunk-tactical-rpg.trial.v1.",
} as const;
export type BackupField=keyof typeof CHARACTER_BACKUP_KEYS;
export interface CharacterBackup{
 format:"nova-arcadia-save";version:1;exportedAt:string;
 character:PlayerCharacter;data:Partial<Record<BackupField,string>>;
}
export function exportCharacterBackup(id:string):string {
 const character=readCharacterSlot(id);
 if(!character)throw new Error("O slot solicitado não foi encontrado.");
 const data:Partial<Record<BackupField,string>>={};
 for(const [field,key] of Object.entries(CHARACTER_BACKUP_KEYS)){
   const value=globalThis.localStorage?.getItem(key+id);
   if(value!==null&&value!==undefined)data[field as BackupField]=value;
 }
 return JSON.stringify({format:"nova-arcadia-save",version:1,
   exportedAt:new Date().toISOString(),character,data} satisfies CharacterBackup,null,2);
}
export function importCharacterBackup(text:string,overwrite=false):
  {ok:boolean;message:string;character?:PlayerCharacter}{
 if(text.length>1_000_000)return {ok:false,message:"O backup excede 1 MB."};
 let obj:unknown;
 try{obj=JSON.parse(text);}catch{return {ok:false,message:"Arquivo JSON inválido."};}
 if(!obj||typeof obj!=="object")return {ok:false,message:"Formato inválido."};
 const parsed=obj as Partial<CharacterBackup>;
 if(parsed.format!=="nova-arcadia-save"||parsed.version!==1||!isPlayerCharacter(parsed.character))
   return {ok:false,message:"Este arquivo não é um salvamento válido de Nova Arcádia."};
 const character=parseCharacterSave(JSON.stringify({version:1,character:parsed.character}));
 if(!character)return {ok:false,message:"Os dados do personagem não passaram pela validação."};
 const exists=containsCharacterSlot(character.id);
 if(exists&&!overwrite)return {ok:false,message:"Já existe um slot com este identificador. Confirme a substituição."};
 if(!exists&&!hasSlotCapacity())return {ok:false,message:"Todos os slots estão ocupados."};
 if(parsed.data && (typeof parsed.data!=="object"||Array.isArray(parsed.data)))
   return {ok:false,message:"Dados adicionais inválidos."};
 const data=parsed.data??{};
 for(const field of Object.keys(data)){
   if(!Object.prototype.hasOwnProperty.call(CHARACTER_BACKUP_KEYS,field))
     return {ok:false,message:"Chave de backup não autorizada."};
   const value=data[field as BackupField];
   if(typeof value!=="string"||value.length>200_000)
     return {ok:false,message:"Campo do backup inválido: "+field};
   if(field!=="appearance"){
     let decoded:unknown;
     try{decoded=JSON.parse(value);}
     catch{return {ok:false,message:"Conteúdo inválido: "+field};}
     if(field==="trial"){
       if(!decoded||typeof decoded!=="object"||Array.isArray(decoded))
         return {ok:false,message:"Progresso da campanha inválido."};
       const progress=decoded as Record<string,unknown>;
       if(typeof progress.started!=="boolean"||typeof progress.completed!=="boolean"||
          !Number.isSafeInteger(progress.step)||Number(progress.step)<0||
          Number(progress.step)>TRIAL_STEPS.length||!Array.isArray(progress.history)||
          !progress.history.every(id=>typeof id==="string"&&TRIAL_STEPS.some(step=>step.id===id))||
          (progress.completed===true&&progress.step!==TRIAL_STEPS.length))
         return {ok:false,message:"Progresso da campanha inválido."};
     }
   }else if(value!=="masculine"&&value!=="feminine")
     return {ok:false,message:"Apresentação corporal inválida."};
 }
 const storage=globalThis.localStorage;
 if(!storage)return {ok:false,message:"Armazenamento local indisponível."};
 // Snapshot de todos os registros atingidos: importações interrompidas não
 // podem deixar um slot substituído pela metade ou apagar dados anteriores.
 const keys=[
   CHARACTER_SAVE_KEY,CHARACTER_SLOT_INDEX,CHARACTER_SLOT_PREFIX+character.id,
   ...Object.values(CHARACTER_BACKUP_KEYS).map(prefix=>prefix+character.id),
 ];
 const previous=new Map<string,string|null>();
 try{
   for(const key of keys)previous.set(key,storage.getItem(key));
 }catch{return {ok:false,message:"Não foi possível verificar o armazenamento antes da importação."};}
 const rollback=()=>{
   for(const [key,original] of previous){
     try{
       if(original===null)storage.removeItem(key);
       else storage.setItem(key,original);
     }catch{/* Preserva os demais registros mesmo quando o dispositivo está cheio. */}
   }
 };
 try{
   if(!saveCharacter(character)){
     rollback();
     return {ok:false,message:"Não foi possível gravar o personagem restaurado. Os dados anteriores foram preservados quando possível."};
   }
   for(const [field,prefix] of Object.entries(CHARACTER_BACKUP_KEYS)){
     const value=data[field as BackupField];
     if(value!==undefined)storage.setItem(prefix+character.id,value);
   }
 }catch{
   rollback();
   return {ok:false,message:"Falha ao restaurar o backup. Os dados anteriores foram preservados quando possível."};
 }
 return {ok:true,character,message:"Backup restaurado. Slot "+character.name+" disponível."};
}
